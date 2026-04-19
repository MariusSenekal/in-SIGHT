// POST /api/auth/login
// Validates credentials via PostgREST rpc/authenticate, returns a signed JWT.
import { signJwt } from '../../utils/jwt'
import { pgrestAdmin } from '../../utils/pgrest'

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
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid username or password.' })
  }

  if (!rows || rows.length === 0) {
    throw createError({ statusCode: 401, message: 'Invalid username or password.' })
  }

  const user = rows[0]
  const config = useRuntimeConfig()
  const token = signJwt(user.user_id, user.name, user.username, user.role, config.jwtSecret as string)

  return {
    token,
    user: {
      id: user.user_id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  }
})
