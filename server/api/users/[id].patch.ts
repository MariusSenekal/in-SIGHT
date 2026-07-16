// PATCH /api/users/:id
// Admin or client_admin updates a user's details, profile, and optionally their password.
// client_admin can only update users in their own company (enforced by RLS)
import { requireAuth, pgrestAdmin, getBearerToken } from '../../utils/pgrest'
import { verifyJwt } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'client_admin'])
  const token = getBearerToken(event)!
  const config = useRuntimeConfig()
  const authUser = verifyJwt(token, config.jwtSecret as string)

  const userId = Number(getRouterParam(event, 'id'))
  if (!userId || Number.isNaN(userId)) {
    throw createError({ statusCode: 400, message: 'Invalid user ID.' })
  }

  const body = await readBody<{
    name?: string
    username?: string
    role?: string
    isActive?: boolean
    displayName?: string
    phone?: string
    location?: string
    bio?: string
    newPassword?: string
  }>(event)

  const allowedRoles = ['user', 'staff', 'admin', 'cleaner', 'uv-hero', 'client_admin', 'client_technician']
  
  // client_admin restrictions
  if (authUser?.app_role === 'client_admin') {
    // Verify the target user is in client_admin's company
    try {
      const targetUserCompanies = await pgrestAdmin<any[]>('/company_users', {
        query: {
          select: 'company_id',
          user_id: `eq.${userId}`
        }
      })

      const adminCompanies = await pgrestAdmin<any[]>('/company_users', {
        query: {
          select: 'company_id',
          user_id: `eq.${authUser.sub}`
        }
      })

      const targetCompanyIds = targetUserCompanies.map(c => c.company_id)
      const adminCompanyIds = adminCompanies.map(c => c.company_id)
      
      const hasSharedCompany = targetCompanyIds.some(id => adminCompanyIds.includes(id))
      
      if (!hasSharedCompany) {
        throw createError({ 
          statusCode: 403, 
          message: 'You can only manage users in your own company.' 
        })
      }
    } catch (error: any) {
      if (error.statusCode === 403) throw error
      console.error('Error checking company membership:', error)
      throw createError({ 
        statusCode: 500, 
        message: 'Failed to verify company membership.' 
      })
    }
    
    // client_admin can only assign staff or client_technician roles
    if (body.role !== undefined) {
      const clientAdminAllowedRoles = ['staff', 'client_technician']
      if (!clientAdminAllowedRoles.includes(body.role)) {
        throw createError({
          statusCode: 403,
          message: 'Client admins can only assign Staff or Client Technician roles.'
        })
      }
    }
  }

  // ── Update users table ────────────────────────────────────────────────────
  const userPatch: Record<string, unknown> = {}
  if (body.name !== undefined)     userPatch.name      = body.name.trim()
  if (body.username !== undefined) userPatch.username  = body.username.trim().toLowerCase()
  if (body.role !== undefined && allowedRoles.includes(body.role)) userPatch.role = body.role
  if (body.isActive !== undefined) userPatch.is_active = body.isActive

  if (Object.keys(userPatch).length > 0) {
    await pgrestAdmin(`/users?id=eq.${userId}`, {
      method: 'PATCH',
      extraHeaders: { Prefer: 'return=minimal' },
      body: userPatch
    })
  }

  // ── Update user_profiles table ────────────────────────────────────────────
  const profilePatch: Record<string, unknown> = {}
  if (body.displayName !== undefined) profilePatch.display_name = body.displayName.trim()
  if (body.phone !== undefined)       profilePatch.phone        = body.phone.trim()
  if (body.location !== undefined)    profilePatch.location     = body.location.trim()
  if (body.bio !== undefined)         profilePatch.bio          = body.bio.trim()

  if (Object.keys(profilePatch).length > 0) {
    await pgrestAdmin(`/user_profiles?user_id=eq.${userId}`, {
      method: 'PATCH',
      extraHeaders: { Prefer: 'return=minimal' },
      body: profilePatch
    })
  }

  // ── Change password (via RPC) ─────────────────────────────────────────────
  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      throw createError({ statusCode: 400, message: 'Password must be at least 8 characters.' })
    }
    await pgrestAdmin('/rpc/change_password', {
      method: 'POST',
      body: { in_user_id: userId, in_new_password: body.newPassword }
    })
  }

  return { ok: true }
})
