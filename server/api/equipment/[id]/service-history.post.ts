// POST /api/equipment/[id]/service-history - Add service history entry
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
    throw createError({ statusCode: 400, message: 'Equipment ID is required.' })
  }

  const body = await readBody(event)
  
  console.log('[API] Received service history request:', JSON.stringify(body, null, 2))
  
  const {
    serviceDate,
    serviceDatetime,
    maintenanceType,
    description,
    repairCompleted,
    cost,
    performedBy,
    notes
  } = body

  // Support both old format (serviceDate) and new format (serviceDatetime)
  const finalServiceDatetime = serviceDatetime || (serviceDate ? `${serviceDate}T12:00:00` : null)
  const finalRepairCompleted = repairCompleted || description || maintenanceType || ''
  
  console.log('[API] Processed values:', {
    finalServiceDatetime,
    finalRepairCompleted,
    performedBy
  })

  if (!finalServiceDatetime || !finalRepairCompleted) {
    throw createError({ 
      statusCode: 400, 
      message: 'Service date/time and repair description are required.' 
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

    // First verify the equipment belongs to the user or their company
    let equipment
    if (userCompanies && userCompanies.length > 0) {
      const companyId = userCompanies[0].company_id
      equipment = await pgrestAdmin<any[]>('/equipment', {
        query: {
          id: `eq.${id}`,
          owner_company_id: `eq.${companyId}`
        }
      })
    } else {
      equipment = await pgrestAdmin<any[]>('/equipment', {
        query: {
          id: `eq.${id}`,
          owner_user_id: `eq.${payload.sub}`
        }
      })
    }
    
    if (!equipment || equipment.length === 0) {
      throw createError({ statusCode: 404, message: 'Equipment not found.' })
    }

    // Add service history entry
    console.log('[API] About to insert into database...')
    
    const insertBody = {
      equipment_id: parseInt(id),
      maintenance_date: finalServiceDatetime,
      service_datetime: finalServiceDatetime,
      maintenance_type: maintenanceType || repairCompleted || 'Service',
      description: description || repairCompleted || '',
      repair_completed: finalRepairCompleted,
      cost: cost ? parseFloat(cost) : null,
      performed_by: performedBy || '',
      notes: notes || ''
    }
    
    console.log('[API] Insert body:', JSON.stringify(insertBody, null, 2))
    
    const entry = await pgrestAdmin<any>('/equipment_maintenance_history', {
      method: 'POST',
      body: insertBody,
      extraHeaders: {
        'Prefer': 'return=representation'
      }
    })
    
    console.log('[API] Successfully created entry:', entry)
    
    return entry
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode === 404) {
      throw error
    }
    console.error('[API] ========================================')
    console.error('[API] ERROR: Failed to add service history')
    console.error('[API] ========================================')
    console.error('[API] Error object:', error)
    
    // Try to extract more details from the error
    if (error && typeof error === 'object') {
      const errObj = error as any
      console.error('[API] Error statusCode:', errObj.statusCode)
      console.error('[API] Error statusMessage:', errObj.statusMessage)
      console.error('[API] Error message:', errObj.message)
      console.error('[API] Error data:', errObj.data)
      console.error('[API] Error cause:', errObj.cause)
      
      // If it's a fetch error, try to get response details
      if (errObj.data) {
        console.error('[API] Response data:', JSON.stringify(errObj.data, null, 2))
      }
    }
    
    console.error('[API] Error message:', (error as Error).message)
    console.error('[API] Error stack:', (error as Error).stack)
    console.error('[API] Request body was:', JSON.stringify(body, null, 2))
    console.error('[API] Final datetime:', finalServiceDatetime)
    console.error('[API] ========================================')
    throw createError({ statusCode: 500, message: 'Failed to add service history. Check server logs for details.' })
  }
})
