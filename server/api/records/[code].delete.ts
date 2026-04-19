// DELETE /api/records/:id
// Admin permanently deletes a QR record (cascades entries, tasks, templates).
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])
  const rawId = getRouterParam(event, 'code')
  const id = parseInt(rawId ?? '', 10)
  if (!rawId || isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid record ID.' })
  }

  try {
    await pgrestAdmin(`/records?id=eq.${id}`, {
      method: 'DELETE',
      extraHeaders: { Prefer: 'return=minimal' }
    })
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode ?? 500
    const pgMsg = err?.data?.message ?? err?.data ?? err?.message ?? 'Unknown PostgREST error'
    console.error('[records DELETE] id=%s status=%s error=%s', id, status, pgMsg)
    throw createError({ statusCode: status, message: String(pgMsg) })
  }

  return { ok: true }
})
