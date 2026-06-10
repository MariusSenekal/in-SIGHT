// PATCH /api/clients/service-history/[id] - Update a service history entry
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
    throw createError({ statusCode: 403, message: 'Only admins can update service history.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid service history ID.' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = {}

  if (body.serviceDate !== undefined)      updates.service_date = body.serviceDate
  if (body.serviceTime !== undefined)      updates.service_time = body.serviceTime
  if (body.serviceCompletedText !== undefined) updates.service_completed_text = body.serviceCompletedText
  if (body.serviceCompleted !== undefined) updates.service_completed = body.serviceCompleted
  if (body.staffOnSite !== undefined)      updates.staff_on_site = body.staffOnSite
  if (body.additionalInfo !== undefined)   updates.additional_info = body.additionalInfo

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

      const entries = await pgrestAdmin<any[]>('/client_service_history', {
        query: { id: `eq.${id}`, select: 'id,client_id' }
      })

      if (!entries?.length) {
        throw createError({ statusCode: 404, message: 'Service history entry not found.' })
      }

      const clients = await pgrestAdmin<any[]>('/clients', {
        query: { id: `eq.${entries[0].client_id}`, select: 'id,owner_user_id,owner_company_id' }
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
        throw createError({ statusCode: 404, message: 'Service history entry not found.' })
      }
    }

    await pgrestAdmin('/client_service_history', {
      method: 'PATCH',
      query: { id: `eq.${id}` },
      body: updates
    })
    return { success: true }
  } catch (error: unknown) {
    console.error('[API] Failed to update service history:', error)
    throw createError({ statusCode: 500, message: 'Failed to update service history.' })
  }
})
