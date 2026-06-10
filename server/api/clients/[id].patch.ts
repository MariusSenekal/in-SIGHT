// PATCH /api/clients/[id] - Update a client (admin only)
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
    throw createError({ statusCode: 403, message: 'Only admins can update clients.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid client ID.' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = {}

  if (body.companyName !== undefined)           updates.company_name = body.companyName
  if (body.name !== undefined)                  updates.name = body.name
  if (body.surname !== undefined)               updates.surname = body.surname
  if (body.address !== undefined)               updates.address = body.address
  if (body.email !== undefined)                 updates.email = body.email
  if (body.industry !== undefined)              updates.industry = body.industry
  if (body.relationshipAllocation !== undefined) updates.relationship_allocation = body.relationshipAllocation
  if (body.annualRevenue !== undefined)         updates.annual_revenue = body.annualRevenue ?? null
  if (body.specialRequirements !== undefined)   updates.special_requirements = body.specialRequirements
  if (body.lastServiced !== undefined)          updates.last_serviced = body.lastServiced || null
  if (body.companyRegistration !== undefined)   updates.company_registration = body.companyRegistration
  if (body.landlineNumber !== undefined)        updates.landline_number = body.landlineNumber
  if (body.mobileNumber !== undefined)          updates.mobile_number = body.mobileNumber
  if (body.status !== undefined)                updates.status = body.status
  if (body.serviceType !== undefined)           updates.service_type = body.serviceType
  if (body.contractRenewalDate !== undefined)   updates.contract_renewal_date = body.contractRenewalDate || null
  if (body.regFlagsNotes !== undefined)         updates.reg_flags_notes = body.regFlagsNotes
  if (body.nextServiceDue !== undefined)        updates.next_service_due = body.nextServiceDue || null

  try {
    if (payload.app_role === 'client_admin') {
      const memberships = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
        query: {
          user_id: `eq.${payload.sub}`,
          select: 'company_id'
        }
      })
      const companyIds = (memberships ?? []).map(m => Number(m.company_id)).filter(Number.isFinite)
      const currentUserId = Number(payload.sub)

      const existing = await pgrestAdmin<any[]>('/clients', {
        query: { id: `eq.${id}`, select: 'id,owner_user_id,owner_company_id' }
      })

      if (!existing?.length) {
        throw createError({ statusCode: 404, message: 'Client not found.' })
      }

      const row = existing[0]
      const ownerUserId = row.owner_user_id == null ? null : Number(row.owner_user_id)
      const ownerCompanyId = row.owner_company_id == null ? null : Number(row.owner_company_id)
      const canAccess = companyIds.length > 0
        ? (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))
        : (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerUserId == null && ownerCompanyId == null)

      if (!canAccess) {
        throw createError({ statusCode: 404, message: 'Client not found.' })
      }
    }

    await pgrestAdmin('/clients', {
      method: 'PATCH',
      query: { id: `eq.${id}` },
      body: updates
    })
    return { success: true }
  } catch (error: unknown) {
    console.error('[API] Failed to update client:', error)
    throw createError({ statusCode: 500, message: 'Failed to update client.' })
  }
})
