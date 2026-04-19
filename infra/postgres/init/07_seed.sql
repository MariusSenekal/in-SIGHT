-- 07_seed.sql
-- Seed the database with the initial administrator account.
-- The password is set to a safe placeholder and MUST be changed on first login.
-- The deploy script will prompt for the real initial admin password.

DO $$
DECLARE
  v_admin_id BIGINT;
BEGIN
  -- Only insert if no admin exists yet (idempotent).
  IF NOT EXISTS (SELECT 1 FROM insight.users WHERE role = 'admin') THEN

    INSERT INTO insight.users (name, username, password_hash, role)
    VALUES (
      'Administrator',
      'admin',
      -- Bcrypt hash of 'Lakenes101!' – REPLACE on first login via change_password().
      crypt('Lakenes101!', gen_salt('bf', 12)),
      'admin'
    )
    RETURNING id INTO v_admin_id;

    INSERT INTO insight.user_profiles (user_id, display_name)
    VALUES (v_admin_id, 'Administrator');

    RAISE NOTICE 'Admin user seeded (id=%). Change the password immediately after first login.', v_admin_id;
  ELSE
    RAISE NOTICE 'Admin user already exists – skipping seed.';
  END IF;
END;
$$;
