// POST /api/clients - Create a new client (admin only)
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

  if (payload.app_role !== 'admin' && payload.app_role !== 'client_admin') {
    throw createError({ statusCode: 403, message: 'Only admins can create clients.' })
  }

  const body = await readBody(event)

  if (!body.companyName) {
    throw createError({ statusCode: 400, message: 'Company name is required.' })
  }

  try {
    const client = await pgrestAdmin<any>('/clients', {
      method: 'POST',
      body: {
        company_name: body.companyName,
        name: body.name || '',
        surname: body.surname || '',
        address: body.address || '',
        email: body.email || '',
        industry: body.industry || '',
        relationship_allocation: body.relationshipAllocation || '',
        annual_revenue: body.annualRevenue ?? null,
        special_requirements: body.specialRequirements || '',
        last_serviced: body.lastServiced || null,
        company_registration: body.companyRegistration || '',
        landline_number: body.landlineNumber || '',
        mobile_number: body.mobileNumber || '',
        status: body.status || 'active',
        service_type: body.serviceType || '',
        contract_renewal_date: body.contractRenewalDate || null,
        reg_flags_notes: body.regFlagsNotes || '',
        next_service_due: body.nextServiceDue || null
      },
      query: { select: '*' }
    })
    return Array.isArray(client) ? client[0] : client
  } catch (error: unknown) {
    console.error('[API] Failed to create client:', error)
    throw createError({ statusCode: 500, message: 'Failed to create client.' })
  }
})
