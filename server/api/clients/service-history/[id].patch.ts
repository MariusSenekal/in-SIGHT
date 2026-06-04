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

  if (payload.app_role !== 'admin') {
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
  if (body.serviceCompleted !== undefined) updates.service_completed = body.serviceCompleted
  if (body.staffOnSite !== undefined)      updates.staff_on_site = body.staffOnSite
  if (body.additionalInfo !== undefined)   updates.additional_info = body.additionalInfo

  try {
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
