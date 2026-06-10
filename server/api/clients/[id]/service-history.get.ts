// GET /api/clients/[id]/service-history - Get service history for a client
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

  const isAdminOrStaff = payload.app_role === 'admin' || payload.app_role === 'staff' || payload.app_role === 'client_admin'
  if (!isAdminOrStaff) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid client ID.' })
  }

  try {
    if (payload.app_role === 'client_admin') {
      const memberships = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
        query: {
          user_id: `eq.${payload.sub}`,
          select: 'company_id'
        }
      })
      const companyIds = (memberships ?? []).map(m => Number(m.company_id)).filter(Number.isFinite)
      const currentUserId = Number(payload.sub)

      const clients = await pgrestAdmin<any[]>('/clients', {
        query: { id: `eq.${id}`, select: 'id,owner_user_id,owner_company_id' }
      })

      if (!clients?.length) {
        throw createError({ statusCode: 404, message: 'Client not found.' })
      }

      const client = clients[0]
      const ownerUserId = client.owner_user_id == null ? null : Number(client.owner_user_id)
      const ownerCompanyId = client.owner_company_id == null ? null : Number(client.owner_company_id)
      const canAccess = companyIds.length > 0
        ? (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))
        : (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerUserId == null && ownerCompanyId == null)

      if (!canAccess) {
        throw createError({ statusCode: 404, message: 'Client not found.' })
      }
    }

    const history = await pgrestAdmin<any[]>('/client_service_history', {
      query: {
        client_id: `eq.${id}`,
        select: '*',
        order: 'service_date.desc,service_time.desc'
      }
    })
    return history
  } catch (error: unknown) {
    console.error('[API] Failed to fetch service history:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch service history.' })
  }
})
