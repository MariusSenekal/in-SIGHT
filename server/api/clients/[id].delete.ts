// DELETE /api/clients/[id] - Delete a client (admin only)
import { pgrestAdmin } from '~/server/utils/pgrest'
import { verifyJwt } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Missing or invalid token.' })
  }

  const token = authHeader.substring(7)
  const config = useRuntimeConfig()
  const payload = verifyJwt(token, config.jwtSecret as string)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  }

  if (payload.app_role !== 'admin' && payload.app_role !== 'client_admin') {
    throw createError({ statusCode: 403, message: 'Only admins can delete clients.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid client ID.' })
  }

  try {
    const existing = await pgrestAdmin<any[]>('/clients', {
      query: { id: `eq.${id}`, select: 'id,company_name,owner_user_id,owner_company_id' }
    })
    if (!existing || existing.length === 0) {
      throw createError({ statusCode: 404, message: 'Client not found.' })
    }

    if (payload.app_role === 'client_admin') {
      const memberships = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
        query: {
          user_id: `eq.${payload.sub}`,
          select: 'company_id'
        }
      })
      const companyIds = (memberships ?? []).map(m => Number(m.company_id)).filter(Number.isFinite)
      const currentUserId = Number(payload.sub)
      const row = existing[0]
      const ownerUserId = row.owner_user_id == null ? null : Number(row.owner_user_id)
      const ownerCompanyId = row.owner_company_id == null ? null : Number(row.owner_company_id)
      const canAccess = companyIds.length > 0
        ? (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))
        : (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerUserId == null && ownerCompanyId == null)

      if (!canAccess) {
        throw createError({ statusCode: 404, message: 'Client not found.' })
      }
    }

    await pgrestAdmin('/clients', {
      method: 'DELETE',
      query: { id: `eq.${id}` }
    })
    return { success: true, message: 'Client deleted successfully.' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Failed to delete client.' })
  }
})
