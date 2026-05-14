// POST /api/vehicles/[id]/service-history - Add service history entry
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

  const body = await readBody(event)
  const {
    serviceDate,
    serviceType,
    description,
    cost,
    odometerReading,
    performedBy,
    notes
  } = body

  if (!serviceDate || !serviceType) {
    throw createError({ 
      statusCode: 400, 
      message: 'Service date and type are required.' 
    })
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

    // Add service history entry
    const entry = await pgrestAdmin<any>('/vehicle_service_history', {
      method: 'POST',
      body: {
        vehicle_id: parseInt(id),
        service_date: serviceDate,
        service_type: serviceType,
        description: description || '',
        cost: cost ? parseFloat(cost) : null,
        odometer_reading: odometerReading ? parseInt(odometerReading) : null,
        performed_by: performedBy || '',
        notes: notes || ''
      }
    })
    
    return entry
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode === 404) {
      throw error
    }
    console.error('[API] Failed to add service history:', error)
    throw createError({ statusCode: 500, message: 'Failed to add service history.' })
  }
})
