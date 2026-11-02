// PATCH /api/equipment/[id] - Update equipment
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
  const updates: Record<string, unknown> = {}

  if (body.name) updates.name = body.name
  if (body.make) updates.make = body.make
  if (body.model !== undefined) updates.model = body.model
  if (body.year !== undefined) updates.year = body.year || null
  if (body.colour !== undefined) updates.colour = body.colour
  if (body.serialNumber !== undefined) updates.serial_number = body.serialNumber
  if (body.unitAllocation !== undefined) updates.unit_allocation = body.unitAllocation
  if (body.nextServiceDue !== undefined) updates.next_service_due = body.nextServiceDue || null
  if (body.category !== undefined) updates.category = body.category
  if (body.location !== undefined) updates.location = body.location
  if (body.status !== undefined) updates.status = body.status

  try {
    // Check if user is an admin - admins can update any equipment
    const isAdmin = payload.app_role === 'admin'

    if (isAdmin) {
      // Admin users - update any equipment
      await pgrestAdmin('/equipment', {
        method: 'PATCH',
        query: { id: `eq.${id}` },
        body: updates
      })
      return { success: true }
    }

    // Check if user has a company (client role) - use admin token for company_users query
    const userCompanies = await pgrestAdmin<any[]>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })

    const companyIds = (userCompanies ?? [])
      .map(uc => Number(uc.company_id))
      .filter(id => Number.isFinite(id))

    const equipmentRows = await pgrestAdmin<any[]>('/equipment', {
      query: { id: `eq.${id}` }
    })

    const item = equipmentRows?.[0]
    if (!item) {
      throw createError({ statusCode: 404, message: 'Equipment not found.' })
    }

    const ownerUserId = item.owner_user_id == null ? null : Number(item.owner_user_id)
    const ownerCompanyId = item.owner_company_id == null ? null : Number(item.owner_company_id)

    const hasAccess = (ownerUserId != null && ownerUserId === Number(payload.sub))
      || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))

    if (!hasAccess) {
      throw createError({ statusCode: 404, message: 'Equipment not found.' })
    }

    await pgrestAdmin('/equipment', {
      method: 'PATCH',
      query: { id: `eq.${id}` },
      body: updates
    })
    return { success: true }
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error
    }
    console.error('[API] Failed to update equipment:', error)
    throw createError({ statusCode: 500, message: 'Failed to update equipment.' })
  }
})
