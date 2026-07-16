// DELETE /api/users/:id
// Admin permanently deletes a user. Cascades to profile, records, entries, etc.
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

  if (authUser?.app_role === 'client_admin') {
    if (Number(authUser.sub) === userId) {
      throw createError({
        statusCode: 403,
        message: 'You cannot delete your own account.'
      })
    }

    try {
      const targetUserCompanies = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
        query: {
          select: 'company_id',
          user_id: `eq.${userId}`
        }
      })

      const adminCompanies = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
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
          message: 'You can only delete users in your own company.'
        })
      }
    } catch (error: any) {
      if (error.statusCode === 403) throw error
      console.error('Error checking company membership before delete:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to verify company membership.'
      })
    }
  }

  await pgrestAdmin(`/users?id=eq.${userId}`, {
    method: 'DELETE',
    extraHeaders: { Prefer: 'return=minimal' }
  })

  return { ok: true }
})
