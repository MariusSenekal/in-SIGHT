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

    // Check if user has a company (client role) - use admin token for company_users query
    const userCompanies = await pgrestAdmin<any[]>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })

    let equipment
    if (userCompanies && userCompanies.length > 0) {
      // User belongs to a company - get all equipment for that company
      const companyId = userCompanies[0].company_id
      equipment = await pgrestAdmin<any[]>('/equipment', {
        query: {
          select: '*',
          owner_company_id: `eq.${companyId}`,
          order: 'created_at.desc'
        }
      })
    } else {
      // Regular user - get only their own equipment
      equipment = await pgrestAdmin<any[]>('/equipment', {
        query: {
          select: '*',
          owner_user_id: `eq.${payload.sub}`,
          order: 'created_at.desc'
        }
      })
    }
    
    return equipment || []
  } catch (error: unknown) {
    console.error('[API] Failed to fetch equipment:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch equipment.' })
  }
})
