// GET /api/notifications - The current user's own notifications, newest
// first. Always scoped to the logged-in user -- nobody sees another
// account's reminders, same as the birthday check that creates them.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  const rows = await pgrestAdmin<any[]>('/notifications', {
    query: {
      user_id: `eq.${payload.sub}`,
      select: '*',
      order: 'created_at.desc',
      limit: '50'
    }
  })

  return rows ?? []
})
