// POST /api/staff - Create a new staff member (admin only)
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
    throw createError({ statusCode: 403, message: 'Only admins can add staff members.' })
  }

  const body = await readBody(event)

  if (!body.name || !body.surname) {
    throw createError({ statusCode: 400, message: 'Name and surname are required.' })
  }

  try {
    const member = await pgrestAdmin<any>('/staff_members', {
      method: 'POST',
      body: {
        name: body.name,
        surname: body.surname,
        address: body.address || '',
        landline_number: body.landlineNumber || '',
        email: body.email || '',
        mobile_number: body.mobileNumber || '',
        id_number: body.idNumber || '',
        gender: body.gender || '',
        next_of_kin: body.nextOfKin || '',
        next_of_kin_mobile: body.nextOfKinMobile || '',
        date_joined: body.dateJoined || null,
        contract_renewal_date: body.contractRenewalDate || null,
        trax_number: body.traxNumber || '',
        uif_number: body.uifNumber || '',
        role: body.role || '',
        team_allocation: body.teamAllocation || '',
        salary: body.salary ?? null,
        frequency_paid: body.frequencyPaid || '',
        additional_information: body.additionalInformation || '',
        is_active: body.isActive !== undefined ? body.isActive : true
      },
      query: { select: '*' }
    })
    return Array.isArray(member) ? member[0] : member
  } catch (error: unknown) {
    console.error('[API] Failed to create staff member:', error)
    const msg = (error as any)?.data?.message || (error as any)?.message || 'Failed to create staff member.'
    throw createError({ statusCode: 500, message: msg })
  }
})
