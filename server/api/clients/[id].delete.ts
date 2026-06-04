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

  if (payload.app_role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Only admins can delete clients.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid client ID.' })
  }

  try {
    const existing = await pgrestAdmin<any[]>('/clients', {
      query: { id: `eq.${id}`, select: 'id,company_name' }
    })
    if (!existing || existing.length === 0) {
      throw createError({ statusCode: 404, message: 'Client not found.' })
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
