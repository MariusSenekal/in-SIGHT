// PATCH /api/records/:id
// Admin/staff updates a QR record's details.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff'])
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
    console.warn('[records PATCH] id=%s — patch body was empty', id)
    throw createError({ statusCode: 400, message: 'Nothing to update.' })
  }

  try {
    await pgrestAdmin('/records', {
      method: 'PATCH',
      query: { id: `eq.${id}` },
      body: patch,
      extraHeaders: { Prefer: 'return=minimal' }
    })
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode ?? 500
    const pgMsg = err?.data?.message ?? err?.data ?? err?.message ?? 'Unknown PostgREST error'
    console.error('[records PATCH] id=%s patch=%j status=%s error=%s', id, patch, status, pgMsg)
    throw createError({ statusCode: status, message: String(pgMsg) })
  }

  return { ok: true }
})
