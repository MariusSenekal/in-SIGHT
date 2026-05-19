// DELETE /api/equipment/[id] - Delete equipment
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

  const equipmentId = getRouterParam(event, 'id')
  if (!equipmentId || isNaN(Number(equipmentId))) {
    throw createError({ statusCode: 400, message: 'Invalid equipment ID.' })
  }

  try {
    // First, verify the equipment exists and user has permission
    const equipment = await pgrestAdmin<any[]>('/equipment', {
      query: {
        id: `eq.${equipmentId}`,
        select: '*'
      }
    })

    if (!equipment || equipment.length === 0) {
      throw createError({ statusCode: 404, message: 'Equipment not found.' })
    }

    // Check if user owns the equipment (client users) or is admin
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
      
      if (!userCompanyId || equipment[0].owner_company_id !== userCompanyId) {
        throw createError({ statusCode: 403, message: 'You do not have permission to delete this equipment.' })
      }
    }

    // Delete the equipment
    await pgrestAdmin('/equipment', {
      query: { id: `eq.${equipmentId}` },
      method: 'DELETE'
    })

    return { success: true, message: 'Equipment deleted successfully.' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ 
      statusCode: 500, 
      message: error.message || 'Failed to delete equipment.' 
    })
  }
})
