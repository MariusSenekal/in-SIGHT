// DELETE /api/requests/:id
// Admin permanently deletes a service request.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])
  const token = getBearerToken(event)!
  const id = getRouterParam(event, 'id')!

  await pgrest(`/service_requests`, {
    method: 'DELETE',
    token,
    query: { id: `eq.${id}` },
    extraHeaders: { Prefer: 'return=minimal' }
  })

  return { ok: true }
})
