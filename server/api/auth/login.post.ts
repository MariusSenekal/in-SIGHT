// POST /api/auth/login
// Validates credentials via PostgREST rpc/authenticate, then opens a database
// session (insight.user_sessions) and sets the HttpOnly session cookie.
import { pgrestAdmin } from '../../utils/pgrest'
import { createSession, resolveSession, revokeSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody<{ username: string; password: string }>(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username and password are required.' })
  }

  interface AuthRow { user_id: number; username: string; name: string; role: string; is_active: boolean }

  let rows: AuthRow[]
  try {
    rows = await pgrestAdmin<AuthRow[]>('/rpc/authenticate', {
      method: 'POST',
      body: { in_username: username.trim().toLowerCase(), in_password: password }
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    throw createError({ statusCode: 401, message: `Auth failed: ${msg}` })
  }

  if (!rows || rows.length === 0) {
    throw createError({ statusCode: 401, message: 'Invalid username or password.' })
  }

  // Close any session this browser already had before opening a new one.
  const previous = await resolveSession(event)
  if (previous) await revokeSession(event, previous.sessionId)

  const user = rows[0]
  await createSession(event, user.user_id)

  return {
    user: {
      id: user.user_id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  }
})
