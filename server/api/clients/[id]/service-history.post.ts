// POST /api/clients/[id]/service-history - Add a service history entry
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
    throw createError({ statusCode: 403, message: 'Only admins can add service history.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid client ID.' })
  }

  const body = await readBody(event)

  if (!body.serviceDate || !body.serviceTime) {
    throw createError({ statusCode: 400, message: 'Service date and time are required.' })
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

    const entry = await pgrestAdmin<any>('/client_service_history', {
      method: 'POST',
      body: {
        client_id: Number(id),
        service_date: body.serviceDate,
        service_time: body.serviceTime,
        service_completed_text: body.serviceCompletedText || '',
        service_completed: body.serviceCompleted ?? false,
        staff_on_site: body.staffOnSite || '',
        additional_info: body.additionalInfo || ''
      },
      query: { select: '*' }
    })
    return Array.isArray(entry) ? entry[0] : entry
  } catch (error: unknown) {
    console.error('[API] Failed to add service history:', error)
    throw createError({ statusCode: 500, message: 'Failed to add service history.' })
  }
})
