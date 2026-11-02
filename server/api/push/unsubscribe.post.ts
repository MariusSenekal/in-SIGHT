// POST /api/push/unsubscribe - Remove this device's subscription for the
// currently logged-in user (e.g. on logout or when the browser revokes it).
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const body = await readBody(event)
  const endpoint = body?.endpoint

  if (!endpoint) {
    throw createError({ statusCode: 400, message: 'Endpoint is required.' })
  }

  try {
    await pgrestAdmin('/push_subscriptions', {
      method: 'DELETE',
      query: { user_id: `eq.${payload.sub}`, endpoint: `eq.${endpoint}` }
    })
    return { success: true }
  } catch (error: unknown) {
    console.error('[API] Failed to remove push subscription:', error)
    throw createError({ statusCode: 500, message: 'Failed to remove push subscription.' })
  }
})
