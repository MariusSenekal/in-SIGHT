// POST /api/push/subscribe - Save (or refresh) this device's push subscription
// for the currently logged-in user only. Upserts on (user_id, endpoint).
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const body = await readBody(event)

  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const auth = body?.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    throw createError({ statusCode: 400, message: 'Invalid subscription payload.' })
  }

  const userAgent = getRequestHeader(event, 'user-agent') || ''

  try {
    await pgrestAdmin('/push_subscriptions', {
      method: 'POST',
      body: {
        user_id: Number(payload.sub),
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent
      },
      extraHeaders: { Prefer: 'resolution=merge-duplicates' },
      query: { on_conflict: 'user_id,endpoint' }
    })
    return { success: true }
  } catch (error: unknown) {
    console.error('[API] Failed to save push subscription:', error)
    throw createError({ statusCode: 500, message: 'Failed to save push subscription.' })
  }
})
