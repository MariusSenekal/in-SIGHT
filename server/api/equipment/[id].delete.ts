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
    const currentUserId = Number(payload.sub)
    
    if (!isAdmin) {
      // Allow deletion if user directly owns the equipment
      const ownerUserId = equipment[0].owner_user_id == null ? null : Number(equipment[0].owner_user_id)
      if (ownerUserId != null && ownerUserId === currentUserId) {
        // User owns it directly, allow deletion
      } else {
        // Check company ownership
        const userCompanies = await pgrestAdmin<any[]>('/company_users', {
          query: {
            user_id: `eq.${payload.sub}`,
            select: 'company_id'
          }
        })
        
        const userCompanyIds = (userCompanies ?? [])
          .map(uc => Number(uc.company_id))
          .filter(id => Number.isFinite(id))
        
        const ownerCompanyId = equipment[0].owner_company_id == null ? null : Number(equipment[0].owner_company_id)
        
        if (userCompanyIds.length === 0 || ownerCompanyId == null || !userCompanyIds.includes(ownerCompanyId)) {
          throw createError({ statusCode: 403, message: 'You do not have permission to delete this equipment.' })
        }
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
