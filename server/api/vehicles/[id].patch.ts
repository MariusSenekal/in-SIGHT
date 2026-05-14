// PATCH /api/vehicles/[id] - Update a vehicle
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
  const updates: Record<string, unknown> = {}

  if (body.make) updates.make = body.make
  if (body.model) updates.model = body.model
  if (body.year) updates.year = parseInt(body.year)
  if (body.colour !== undefined) updates.colour = body.colour
  if (body.registrationNumber) updates.registration_number = body.registrationNumber
  if (body.vinNumber !== undefined) updates.vin_number = body.vinNumber
  if (body.licenseDiscRenewal !== undefined) updates.license_disc_renewal = body.licenseDiscRenewal || null
  if (body.nextServiceDueKm !== undefined) {
    updates.next_service_due_km = body.nextServiceDueKm ? parseInt(body.nextServiceDueKm) : null
  }

  try {
    // Check if user has a company (client role) - use admin token for company_users query
    const userCompanies = await pgrestAdmin<any[]>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })

    let queryParams: Record<string, string> = { id: `eq.${id}` }
    if (userCompanies && userCompanies.length > 0) {
      // User belongs to a company - update vehicle if it belongs to their company
      const companyId = userCompanies[0].company_id
      queryParams.owner_company_id = `eq.${companyId}`
    } else {
      // Regular user - update vehicle if they own it
      queryParams.owner_user_id = `eq.${payload.sub}`
    }

    await pgrestAdmin('/vehicles', {
      method: 'PATCH',
      query: queryParams,
      body: updates
    })
    return { success: true }
  } catch (error: unknown) {
    console.error('[API] Failed to update vehicle:', error)
    throw createError({ statusCode: 500, message: 'Failed to update vehicle.' })
  }
})
