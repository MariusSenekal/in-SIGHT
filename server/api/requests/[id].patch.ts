// PATCH /api/requests/[id]
// Update a service request's status. Admin and staff only.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff', 'cleaner'])
  const token = getBearerToken(event)!
  const id = getRouterParam(event, 'id')!
  const { status } = await readBody<{ status: string }>(event)

  if (!['open', 'resolved'].includes(status)) {
    throw createError({ statusCode: 400, message: 'Status must be "open" or "resolved".' })
  }

  await pgrest('/service_requests', {
    method: 'PATCH',
    token,
    body: { status },
    query: { id: `eq.${id}` },
    extraHeaders: { 'Prefer': 'return=minimal' }
  })

  return { ok: true }
})
