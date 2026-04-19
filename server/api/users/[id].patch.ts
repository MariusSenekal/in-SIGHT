// PATCH /api/users/:id
// Admin updates a user's details, profile, and optionally their password.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

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

  const allowedRoles = ['user', 'staff', 'admin']

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
