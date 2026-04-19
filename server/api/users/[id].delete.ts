// DELETE /api/users/:id
// Admin permanently deletes a user. Cascades to profile, records, entries, etc.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

  const userId = Number(getRouterParam(event, 'id'))
  if (!userId || Number.isNaN(userId)) {
    throw createError({ statusCode: 400, message: 'Invalid user ID.' })
  }

  await pgrestAdmin(`/users?id=eq.${userId}`, {
    method: 'DELETE',
    extraHeaders: { Prefer: 'return=minimal' }
  })

  return { ok: true }
})
