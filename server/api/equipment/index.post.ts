// POST /api/equipment - Create new equipment
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

  const body = await readBody(event)
  const {
    name,
    make,
    model,
    year,
    colour,
    serialNumber,
    unitAllocation,
    nextServiceDue,
    category,
    location,
    status
  } = body

  // Make is required (or fallback to name for backwards compatibility)
  const equipmentMake = make || name
  if (!equipmentMake) {
    throw createError({ 
      statusCode: 400, 
      message: 'Equipment make is required.' 
    })
  }

  try {
    // Get user's company if they're a client role - use admin token for company_users query
    let ownerCompanyId = null
    const userCompanies = await pgrestAdmin<any[]>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })
    if (userCompanies && userCompanies.length > 0) {
      ownerCompanyId = userCompanies[0].company_id
    }

    const equipment = await pgrestAdmin<any>('/equipment', {
      method: 'POST',
      body: {
        owner_user_id: payload.sub,
        owner_company_id: ownerCompanyId,
        name: name || equipmentMake,
        make: equipmentMake,
        model: model || '',
        year: year || null,
        colour: colour || '',
        serial_number: serialNumber || '',
        unit_allocation: unitAllocation || '',
        next_service_due: nextServiceDue || null,
        category: category || '',
        location: location || '',
        status: status || 'active'
      }
    })

    return equipment
  } catch (error: unknown) {
    console.error('[API] Failed to create equipment:', error)
    throw createError({ statusCode: 500, message: 'Failed to create equipment.' })
  }
})
