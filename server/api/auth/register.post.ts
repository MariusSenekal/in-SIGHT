// POST /api/auth/register
// Public self-registration — creates a 'user' role account via the register() DB function.
import { signJwt } from '../../utils/jwt'
import { pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const { name, username, password } = await readBody<{ name: string; username: string; password: string }>(event)

  if (!name?.trim() || !username?.trim() || !password) {
    throw createError({ statusCode: 400, message: 'Name, username, and password are required.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters.' })
  }

  interface RegRow { user_id: number; username: string; name: string; role: string }

  let rows: RegRow[]
  try {
    rows = await pgrestAdmin<RegRow[]>('/rpc/register', {
      method: 'POST',
      body: { in_name: name.trim(), in_username: username.trim().toLowerCase(), in_password: password }
    })
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message ?? ''
    if (msg.includes('already taken')) {
      throw createError({ statusCode: 409, message: 'That username is already taken.' })
    }
    throw createError({ statusCode: 400, message: msg || 'Registration failed.' })
  }

  if (!rows || rows.length === 0) {
    throw createError({ statusCode: 500, message: 'Registration failed — no user returned.' })
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
