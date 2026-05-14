// GET /api/vehicles - Get all vehicles for the current user
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
    // Check if user has a company (client role) - use admin token for company_users query
    const userCompanies = await pgrestAdmin<any[]>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })

    let vehicles
    if (userCompanies && userCompanies.length > 0) {
      // User belongs to a company - get all vehicles for that company
      const companyId = userCompanies[0].company_id
      vehicles = await pgrestAdmin<any[]>('/vehicles', {
        query: {
          owner_company_id: `eq.${companyId}`,
          order: 'created_at.desc'
        }
      })
    } else {
      // Regular user - get only their own vehicles
      vehicles = await pgrestAdmin<any[]>('/vehicles', {
        query: {
          owner_user_id: `eq.${payload.sub}`,
          order: 'created_at.desc'
        }
      })
    }
    
    return vehicles
  } catch (error: unknown) {
    console.error('[API] Failed to fetch vehicles:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch vehicles.' })
  }
})
