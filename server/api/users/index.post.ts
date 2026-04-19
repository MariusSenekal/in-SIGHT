// POST /api/users
// Admin creates a new user (any role) via the admin_create_user() DB function.
import { requireAuth } from '../../utils/pgrest'
import { pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

  const { name, username, password, role } = await readBody<{
    name: string
    username: string
    password: string
    role: string
  }>(event)

  if (!name?.trim() || !username?.trim() || !password) {
    throw createError({ statusCode: 400, message: 'Name, username, and password are required.' })
  }

  const allowedRoles = ['user', 'staff', 'admin']
  const safeRole = allowedRoles.includes(role) ? role : 'user'

  interface Row { user_id: number; username: string; name: string; role: string }
  let rows: Row[]
  try {
    rows = await pgrestAdmin<Row[]>('/rpc/admin_create_user', {
      method: 'POST',
      body: {
        in_name: name.trim(),
        in_username: username.trim().toLowerCase(),
        in_password: password,
        in_role: safeRole
      }
    })
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message ?? ''
    if (msg.includes('already taken')) {
      throw createError({ statusCode: 409, message: 'That username is already taken.' })
    }
    throw createError({ statusCode: 400, message: msg || 'User creation failed.' })
  }

  if (!rows?.length) throw createError({ statusCode: 500, message: 'User creation failed.' })

  const u = rows[0]
  return { id: u.user_id, name: u.name, username: u.username, role: u.role }
})
