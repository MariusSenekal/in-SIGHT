// PATCH /api/staff/[id] - Update a staff member (admin only)
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

  if (payload.app_role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Only admins can update staff members.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid staff member ID.' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined)                  updates.name = body.name
  if (body.surname !== undefined)               updates.surname = body.surname
  if (body.address !== undefined)               updates.address = body.address
  if (body.landlineNumber !== undefined)        updates.landline_number = body.landlineNumber
  if (body.email !== undefined)                 updates.email = body.email
  if (body.mobileNumber !== undefined)          updates.mobile_number = body.mobileNumber
  if (body.idNumber !== undefined)              updates.id_number = body.idNumber
  if (body.gender !== undefined)                updates.gender = body.gender
  if (body.nextOfKin !== undefined)             updates.next_of_kin = body.nextOfKin
  if (body.nextOfKinMobile !== undefined)       updates.next_of_kin_mobile = body.nextOfKinMobile
  if (body.dateJoined !== undefined)            updates.date_joined = body.dateJoined || null
  if (body.contractRenewalDate !== undefined)   updates.contract_renewal_date = body.contractRenewalDate || null
  if (body.traxNumber !== undefined)            updates.trax_number = body.traxNumber
  if (body.uifNumber !== undefined)             updates.uif_number = body.uifNumber
  if (body.role !== undefined)                  updates.role = body.role
  if (body.teamAllocation !== undefined)        updates.team_allocation = body.teamAllocation
  if (body.salary !== undefined)                updates.salary = body.salary ?? null
  if (body.frequencyPaid !== undefined)         updates.frequency_paid = body.frequencyPaid
  if (body.additionalInformation !== undefined) updates.additional_information = body.additionalInformation
  if (body.isActive !== undefined)              updates.is_active = body.isActive

  try {
    await pgrestAdmin('/staff_members', {
      method: 'PATCH',
      query: { id: `eq.${id}` },
      body: updates
    })
    return { success: true }
  } catch (error: unknown) {
    console.error('[API] Failed to update staff member:', error)
    throw createError({ statusCode: 500, message: 'Failed to update staff member.' })
  }
})
