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

  const isAdminOrStaff = payload.app_role === 'admin' || payload.app_role === 'staff'
  if (!isAdminOrStaff) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid client ID.' })
  }

  try {
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
