// DELETE /api/records/:id
// Admin permanently deletes a QR record (cascades entries, tasks, templates).
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])
  const id = getRouterParam(event, 'id')!

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
