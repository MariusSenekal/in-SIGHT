// POST /api/vehicles - Create a new vehicle
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
    make,
    model,
    year,
    colour,
    registrationNumber,
    vinNumber,
    licenseDiscRenewal,
    nextServiceDueKm
  } = body

  if (!make || !model || !year || !registrationNumber) {
    throw createError({ 
      statusCode: 400, 
      message: 'Make, model, year, and registration number are required.' 
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

    const vehicle = await pgrestAdmin<any>('/vehicles', {
      method: 'POST',
      body: {
        owner_user_id: payload.sub,
        owner_company_id: ownerCompanyId,
        make,
        model,
        year: parseInt(year),
        colour: colour || '',
        registration_number: registrationNumber,
        vin_number: vinNumber || '',
        license_disc_renewal: licenseDiscRenewal || null,
        next_service_due_km: nextServiceDueKm ? parseInt(nextServiceDueKm) : null
      }
    })
    return vehicle
  } catch (error: unknown) {
    console.error('[API] Failed to create vehicle:', error)
    throw createError({ statusCode: 500, message: 'Failed to create vehicle.' })
  }
})
