// POST /api/notifications/[id]/read - Mark one of the current user's own
// notifications read. Scoped by user_id in the same request so one account
// can never mark (or even discover the existence of) another's.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, message: 'Invalid notification id.' })
  }

  await pgrestAdmin('/notifications', {
    method: 'PATCH',
    query: { id: `eq.${id}`, user_id: `eq.${payload.sub}` },
    body: { read_at: new Date().toISOString() }
  })

  return { success: true }
})
