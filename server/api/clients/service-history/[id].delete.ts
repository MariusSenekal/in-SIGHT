// DELETE /api/clients/service-history/[id] - Delete a service history entry
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
    throw createError({ statusCode: 403, message: 'Only admins can delete service history.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid service history ID.' })
  }

  try {
    await pgrestAdmin('/client_service_history', {
      method: 'DELETE',
      query: { id: `eq.${id}` }
    })
    return { success: true, message: 'Service history entry deleted.' }
  } catch (error: unknown) {
    console.error('[API] Failed to delete service history:', error)
    throw createError({ statusCode: 500, message: 'Failed to delete service history entry.' })
  }
})
