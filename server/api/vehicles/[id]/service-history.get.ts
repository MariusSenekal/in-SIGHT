// GET /api/vehicles/[id]/service-history - Get service history for a vehicle
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

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Vehicle ID is required.' })
  }

  try {
    // Check if user has a company (client role) - use admin token for company_users query
    const userCompanies = await pgrestAdmin<any[]>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })

    // First verify the vehicle belongs to the user or their company
    let vehicles
    if (userCompanies && userCompanies.length > 0) {
      const companyId = userCompanies[0].company_id
      vehicles = await pgrestAdmin<any[]>('/vehicles', {
        query: {
          id: `eq.${id}`,
          owner_company_id: `eq.${companyId}`
        }
      })
    } else {
      vehicles = await pgrestAdmin<any[]>('/vehicles', {
        query: {
          id: `eq.${id}`,
          owner_user_id: `eq.${payload.sub}`
        }
      })
    }
    
    if (!vehicles || vehicles.length === 0) {
      throw createError({ statusCode: 404, message: 'Vehicle not found.' })
    }

    // Get service history
    const history = await pgrestAdmin<any[]>('/vehicle_service_history', {
      query: {
        vehicle_id: `eq.${id}`,
        order: 'service_date.desc'
      }
    })
    
    return history
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode === 404) {
      throw error
    }
    console.error('[API] Failed to fetch service history:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch service history.' })
  }
})
