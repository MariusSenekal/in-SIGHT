// GET /api/vehicles/[id] - Get a specific vehicle
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
    // Check if user is an admin - admins can see ALL vehicles
    const isAdmin = payload.app_role === 'admin'

    if (isAdmin) {
      // Admin users - get any vehicle
      const vehicles = await pgrestAdmin<any[]>('/vehicles', {
        query: {
          select: '*',
          id: `eq.${id}`
        }
      })
      
      if (!vehicles || vehicles.length === 0) {
        throw createError({ statusCode: 404, message: 'Vehicle not found.' })
      }
      
      return vehicles[0]
    }

    // Check if user has a company (client role) - use admin token for company_users query
    const userCompanies = await pgrestAdmin<any[]>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })

    const companyIds = (userCompanies ?? [])
      .map(uc => Number(uc.company_id))
      .filter(id => Number.isFinite(id))

    const vehicles = await pgrestAdmin<any[]>('/vehicles', {
      query: {
        select: '*',
        id: `eq.${id}`
      }
    })

    const vehicle = vehicles?.[0]
    if (!vehicle) {
      throw createError({ statusCode: 404, message: 'Vehicle not found.' })
    }

    const ownerUserId = vehicle.owner_user_id == null ? null : Number(vehicle.owner_user_id)
    const ownerCompanyId = vehicle.owner_company_id == null ? null : Number(vehicle.owner_company_id)

    const hasAccess = (ownerUserId != null && ownerUserId === Number(payload.sub))
      || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))

    if (!hasAccess) {
      throw createError({ statusCode: 404, message: 'Vehicle not found.' })
    }

    return vehicle
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode === 404) {
      throw error
    }
    console.error('[API] Failed to fetch vehicle:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch vehicle.' })
  }
})
