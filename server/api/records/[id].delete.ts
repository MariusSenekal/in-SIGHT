// DELETE /api/records/:id
// Admin permanently deletes a QR record (cascades entries, tasks, templates).
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])
  const id = getRouterParam(event, 'id')!

  await pgrestAdmin(`/records?id=eq.${id}`, {
    method: 'DELETE',
    extraHeaders: { Prefer: 'return=minimal' }
  })

  return { ok: true }
})
