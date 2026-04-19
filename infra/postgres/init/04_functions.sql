-- 04_functions.sql
-- Application-level helper functions exposed via PostgREST RPC.

-- ─────────────────────────────────────────────────────────────────────────────
-- insight.authenticate(username, password)
-- Called by the Nuxt server API to validate credentials.
-- Returns the matched user row on success, empty on failure.
-- SECURITY DEFINER so it can read the users table regardless of caller role.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.authenticate(
  in_username TEXT,
  in_password TEXT
)
RETURNS TABLE (
  user_id   BIGINT,
  username  TEXT,
  name      TEXT,
  role      insight.user_role,
  is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = insight, public
AS $$
  SELECT
    u.id          AS user_id,
    u.username,
    u.name,
    u.role,
    u.is_active
  FROM insight.users AS u
  WHERE u.username     = in_username
    AND u.password_hash = crypt(in_password, u.password_hash)
    AND u.is_active     = TRUE;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight.change_password(user_id, new_password)
-- Admins or the user themselves can change a password safely.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.change_password(
  in_user_id    BIGINT,
  in_new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = insight, public
AS $$
BEGIN
  IF length(in_new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters.' USING ERRCODE = 'check_violation';
  END IF;

  UPDATE insight.users
  SET    password_hash = crypt(in_new_password, gen_salt('bf', 12)),
         updated_at    = NOW()
  WHERE  id = in_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight.recompute_entry_status(entry_id)
-- Re-derives Done / Incomplete / Not Done from the service_tasks rows.
-- Called after task updates to keep the entry status in sync.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.recompute_entry_status(in_entry_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = insight, public
AS $$
DECLARE
  v_total     INT;
  v_completed INT;
  v_new_status insight.entry_status;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = TRUE)
    INTO v_total, v_completed
    FROM insight.service_tasks
   WHERE service_entry_id = in_entry_id;

  IF v_total = 0 OR v_completed = 0 THEN
    v_new_status := 'Not Done';
  ELSIF v_completed = v_total THEN
    v_new_status := 'Done';
  ELSE
    v_new_status := 'Incomplete';
  END IF;

  UPDATE insight.service_entries
  SET    status     = v_new_status,
         updated_at = NOW()
  WHERE  id = in_entry_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: auto-recompute entry status when tasks change
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.trg_sync_entry_status()
  RETURNS TRIGGER LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = insight, public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM insight.recompute_entry_status(OLD.service_entry_id);
    RETURN OLD;
  ELSE
    PERFORM insight.recompute_entry_status(NEW.service_entry_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_service_tasks_sync_status
  AFTER INSERT OR UPDATE OF completed OR DELETE
  ON insight.service_tasks
  FOR EACH ROW EXECUTE FUNCTION insight.trg_sync_entry_status();

-- ─────────────────────────────────────────────────────────────────────────────
-- insight.purge_expired_revoked_tokens()
-- Maintenance function; call periodically from the app or a cron job.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.purge_expired_revoked_tokens()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = insight, public
AS $$
  WITH deleted AS (
    DELETE FROM insight.revoked_tokens
    WHERE expires_at < NOW()
    RETURNING jti
  )
  SELECT COUNT(*)::INT FROM deleted;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight.revoke_token(jti, expires_at)
-- Inserts a token JTI into the revocation list so PostgREST sessions cannot
-- be replayed after logout. Called by the Nuxt server auth route.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.revoke_token(
  in_jti        TEXT,
  in_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = insight, public
AS $$
  INSERT INTO insight.revoked_tokens (jti, expires_at)
  VALUES (in_jti, in_expires_at)
  ON CONFLICT (jti) DO NOTHING;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight.register(name, username, password)
-- Public self-registration — creates a 'user' role account only.
-- Password is bcrypt-hashed server-side. Called via Nuxt server route.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.register(
  in_name     TEXT,
  in_username TEXT,
  in_password TEXT
)
RETURNS TABLE (
  user_id   BIGINT,
  username  TEXT,
  name      TEXT,
  role      insight.user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = insight, public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  IF length(trim(in_name)) = 0 OR length(trim(in_username)) = 0 THEN
    RAISE EXCEPTION 'Name and username are required.' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF length(in_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters.' USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM insight.users u WHERE u.username = lower(trim(in_username))) THEN
    RAISE EXCEPTION 'Username already taken.' USING ERRCODE = 'unique_violation';
  END IF;

  INSERT INTO insight.users (name, username, password_hash, role)
  VALUES (trim(in_name), lower(trim(in_username)), crypt(in_password, gen_salt('bf', 12)), 'user')
  RETURNING id INTO v_id;

  INSERT INTO insight.user_profiles (user_id, display_name)
  VALUES (v_id, trim(in_name));

  RETURN QUERY SELECT v_id, lower(trim(in_username)), trim(in_name), 'user'::insight.user_role;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight.admin_create_user(name, username, password, role)
-- Admin-only user creation. Hashes the password and creates a profile row.
-- Called by the Nuxt server route (uses admin JWT internally).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.admin_create_user(
  in_name     TEXT,
  in_username TEXT,
  in_password TEXT,
  in_role     insight.user_role DEFAULT 'user'
)
RETURNS TABLE (
  user_id   BIGINT,
  username  TEXT,
  name      TEXT,
  role      insight.user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = insight, public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  IF length(trim(in_name)) = 0 OR length(trim(in_username)) = 0 THEN
    RAISE EXCEPTION 'Name and username are required.' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF length(in_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters.' USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM insight.users u WHERE u.username = lower(trim(in_username))) THEN
    RAISE EXCEPTION 'Username already taken.' USING ERRCODE = 'unique_violation';
  END IF;

  INSERT INTO insight.users (name, username, password_hash, role)
  VALUES (trim(in_name), lower(trim(in_username)), crypt(in_password, gen_salt('bf', 12)), in_role)
  RETURNING id INTO v_id;

  INSERT INTO insight.user_profiles (user_id, display_name)
  VALUES (v_id, trim(in_name));

  RETURN QUERY SELECT v_id, lower(trim(in_username)), trim(in_name), in_role;
END;
$$;
