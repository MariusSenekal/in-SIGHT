// PATCH /api/vehicles/[id]/service-history/[historyId] - Update service history entry
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
  const historyId = getRouterParam(event, 'historyId')
  
  if (!id || !historyId) {
    throw createError({ statusCode: 400, message: 'Vehicle ID and History ID are required.' })
  }

  const body = await readBody(event)
  const {
    serviceDatetime,
    repairCompleted,
    performedBy,
    cost,
    odometerReading,
    notes
  } = body

  if (!serviceDatetime || !repairCompleted || !performedBy) {
    throw createError({ 
      statusCode: 400, 
      message: 'Service datetime, repair completed, and technician are required.' 
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

    // Verify the vehicle belongs to the user or their company
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

    // Update service history entry
    const updated = await pgrestAdmin<any>('/vehicle_service_history', {
      method: 'PATCH',
      query: {
        id: `eq.${historyId}`,
        vehicle_id: `eq.${id}`
      },
      body: {
        service_date: serviceDatetime.split('T')[0],
        service_datetime: serviceDatetime,
        repair_completed: repairCompleted,
        performed_by: performedBy,
        cost: cost ? parseFloat(cost) : null,
        odometer_reading: odometerReading ? parseInt(odometerReading) : null,
        notes: notes || ''
      }
    })
    
    return updated
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode === 404) {
      throw error
    }
    console.error('[API] Failed to update service history:', error)
    throw createError({ statusCode: 500, message: 'Failed to update service history.' })
  }
})
