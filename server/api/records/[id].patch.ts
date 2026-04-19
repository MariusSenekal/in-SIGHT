// PATCH /api/records/:id
// Admin/staff updates a QR record's details.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff'])
  const token = getBearerToken(event)!
  const id = getRouterParam(event, 'id')!

  const { name, description, type, location, ownerUserId, ownerCompanyId } = await readBody<{
    name?: string
    description?: string
    type?: string
    location?: string
    ownerUserId?: number | null
    ownerCompanyId?: number | null
  }>(event)

  const patch: Record<string, unknown> = {}
  if (name        !== undefined) patch.name             = name.trim()
  if (description !== undefined) patch.description      = description.trim()
  if (type        !== undefined) patch.type             = type.trim()
  if (location    !== undefined) patch.location         = location.trim()
  if (ownerUserId !== undefined) patch.owner_user_id    = ownerUserId
  if (ownerCompanyId !== undefined) patch.owner_company_id = ownerCompanyId

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update.' })
  }

  await pgrest('/records', {
    method: 'PATCH',
    token,
    query: { id: `eq.${id}` },
    body: patch,
    extraHeaders: { Prefer: 'return=minimal' }
  })

  return { ok: true }
})
