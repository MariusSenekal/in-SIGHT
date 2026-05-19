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
  if (body.category !== undefined) updates.category = body.category
  if (body.serialNumber !== undefined) updates.serial_number = body.serialNumber
  if (body.location !== undefined) updates.location = body.location
  if (body.status !== undefined) updates.status = body.status
  if (body.purchaseDate !== undefined) updates.purchase_date = body.purchaseDate || null
  if (body.notes !== undefined) updates.notes = body.notes

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

    let queryParams: Record<string, string> = { id: `eq.${id}` }
    if (userCompanies && userCompanies.length > 0) {
      // User belongs to a company - update equipment if it belongs to their company
      const companyId = userCompanies[0].company_id
      queryParams.owner_company_id = `eq.${companyId}`
    } else {
      // Regular user - update equipment if they own it
      queryParams.owner_user_id = `eq.${payload.sub}`
    }

    await pgrestAdmin('/equipment', {
      method: 'PATCH',
      query: queryParams,
      body: updates
    })
    return { success: true }
  } catch (error: unknown) {
    console.error('[API] Failed to update equipment:', error)
    throw createError({ statusCode: 500, message: 'Failed to update equipment.' })
  }
})
