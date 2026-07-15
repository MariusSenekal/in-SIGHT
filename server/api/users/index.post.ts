// POST /api/users
// Admin or client_admin creates a new user via the admin_create_user() DB function.
// client_admin can only create users with limited roles (not admin)
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'
import { pgrestAdmin } from '../../utils/pgrest'
import { verifyJwt } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'client_admin'])
  const token = getBearerToken(event)!
  const config = useRuntimeConfig()
  const authUser = verifyJwt(token, config.jwtSecret as string)

  const { name, username, password, role, companyId } = await readBody<{
    name: string
    username: string
    password: string
    role: string
    companyId?: number
  }>(event)

  if (!name?.trim() || !username?.trim() || !password) {
    throw createError({ statusCode: 400, message: 'Name, username, and password are required.' })
  }

  const allowedRoles = ['user', 'staff', 'admin', 'cleaner', 'uv-hero', 'client_admin', 'client_technician']

  // client_admin can only create staff or client_technician users
  if (authUser?.app_role === 'client_admin') {
    const clientAdminAllowedRoles = ['staff', 'client_technician']
    if (!clientAdminAllowedRoles.includes(role)) {
      throw createError({
        statusCode: 403,
        message: 'Client admins can only create Staff or Client Technician users.'
      })
    }
  }
  
  const safeRole = allowedRoles.includes(role) ? role : 'user'

  // client_admin must provide a companyId and it must be their own company
  if (authUser?.app_role === 'client_admin') {
    if (!companyId) {
      throw createError({ 
        statusCode: 400, 
        message: 'Company ID is required.' 
      })
    }
    
    // Verify client_admin belongs to this company
    const adminCompanies = await pgrest<any[]>('/company_users', {
      token,
      query: {
        select: 'company_id',
        user_id: `eq.${authUser.sub}`
      }
    })
    
    const adminCompanyIds = adminCompanies.map(c => c.company_id)
    
    if (!adminCompanyIds.includes(companyId)) {
      throw createError({ 
        statusCode: 403, 
        message: 'You can only create users for your own company.' 
      })
    }
  }

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
  
  // If client_admin created the user, automatically link to their company
  if (authUser?.app_role === 'client_admin' && companyId) {
    try {
      await pgrest('/company_users', {
        token,
        method: 'POST',
        body: {
          company_id: companyId,
          user_id: u.user_id
        }
      })
    } catch (error) {
      console.error('Failed to link user to company:', error)
      // User was created but not linked - admin can fix this later
    }
  }
  
  return { id: u.user_id, name: u.name, username: u.username, role: u.role }
})
