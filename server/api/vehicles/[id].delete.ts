// DELETE /api/vehicles/[id] - Delete a vehicle
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

  const vehicleId = getRouterParam(event, 'id')
  if (!vehicleId || isNaN(Number(vehicleId))) {
    throw createError({ statusCode: 400, message: 'Invalid vehicle ID.' })
  }

  try {
    // First, verify the vehicle exists and user has permission
    const vehicle = await pgrestAdmin<any[]>('/vehicles', {
      query: {
        id: `eq.${vehicleId}`,
        select: '*'
      }
    })

    if (!vehicle || vehicle.length === 0) {
      throw createError({ statusCode: 404, message: 'Vehicle not found.' })
    }

    // Check if user owns the vehicle (client users) or is admin
    const userRole = payload.role
    const isAdmin = userRole === 'admin'
    
    if (!isAdmin) {
      // Get user's company
      const userCompanies = await pgrestAdmin<any[]>('/company_users', {
        query: {
          user_id: `eq.${payload.sub}`,
          select: 'company_id'
        }
      })
      
      const userCompanyId = userCompanies && userCompanies.length > 0 ? userCompanies[0].company_id : null
      
      if (!userCompanyId || vehicle[0].owner_company_id !== userCompanyId) {
        throw createError({ statusCode: 403, message: 'You do not have permission to delete this vehicle.' })
      }
    }

    // Delete the vehicle
    await pgrestAdmin('/vehicles', {
      query: { id: `eq.${vehicleId}` },
      method: 'DELETE'
    })

    return { success: true, message: 'Vehicle deleted successfully.' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ 
      statusCode: 500, 
      message: error.message || 'Failed to delete vehicle.' 
    })
  }
})
