// DELETE /api/records/:id
// Admin permanently deletes a QR record (cascades entries, tasks, templates).
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])
  const token = getBearerToken(event)!
  const id = getRouterParam(event, 'id')!

  await pgrest('/records', {
    method: 'DELETE',
    token,
    query: { id: `eq.${id}` },
    extraHeaders: { Prefer: 'return=minimal' }
  })

  return { ok: true }
})
