// GET /api/equipment - List all equipment for the authenticated user's company
import { pgrest, pgrestAdmin } from '~/server/utils/pgrest'
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

  try {
    // Check if user is an admin - admins can see ALL equipment
    const isAdmin = payload.app_role === 'admin'

    if (isAdmin) {
      // Admin users - get ALL equipment using admin token
      const equipment = await pgrestAdmin<any[]>('/equipment', {
        query: {
          select: '*',
          order: 'created_at.desc'
        }
      })
      return equipment || []
    }

    // RLS will filter equipment based on user's company
    const equipment = await pgrest<any[]>('/equipment', {
      token,
      query: {
        select: '*',
        order: 'created_at.desc'
      }
    })

    return equipment || []
  } catch (error: unknown) {
    console.error('[API] Failed to fetch equipment:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch equipment.' })
  }
})
