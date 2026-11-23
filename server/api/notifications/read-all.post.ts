// POST /api/notifications/read-all - Mark every unread notification of the
// current user read in a single call (the bell's "Mark all read" button).
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  await pgrestAdmin('/notifications', {
    method: 'PATCH',
    query: { user_id: `eq.${payload.sub}`, read_at: 'is.null' },
    body: { read_at: new Date().toISOString() }
  })

  return { success: true }
})
