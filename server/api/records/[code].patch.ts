// PATCH /api/records/:id
// Admin/staff updates a QR record's details.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff', 'cleaner'])
  // Segment is keyed 'code' since this file is [code].patch.ts
  const rawId = getRouterParam(event, 'code')
  const id = parseInt(rawId ?? '', 10)
  if (!rawId || isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid record ID.' })
  }

  const { name, description, type, location, ownerUserId, ownerCompanyId } = await readBody<{
    name?: string
    description?: string
    type?: string
    location?: string
    ownerUserId?: number | null
    ownerCompanyId?: number | null
  }>(event)

  const patch: Record<string, unknown> = {}
  if (name        !== undefined) patch.name             = String(name ?? '').trim()
  if (description !== undefined) patch.description      = String(description ?? '').trim()
  if (type        !== undefined) patch.type             = String(type ?? '').trim()
  if (location    !== undefined) patch.location         = String(location ?? '').trim()
  // Coerce any stray "undefined" strings or JS undefined to null for bigint columns
  if (ownerUserId    !== undefined) patch.owner_user_id    = (ownerUserId    == null || ownerUserId    === ('undefined' as any)) ? null : Number(ownerUserId)
  if (ownerCompanyId !== undefined) patch.owner_company_id = (ownerCompanyId == null || ownerCompanyId === ('undefined' as any)) ? null : Number(ownerCompanyId)

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
