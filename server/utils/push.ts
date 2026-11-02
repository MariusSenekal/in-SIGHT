import webpush from 'web-push'
import { pgrestAdmin } from './pgrest'

interface PushSubscriptionRow {
  id: number
  user_id: number
  endpoint: string
  p256dh: string
  auth: string
}

let configured = false

const ensureConfigured = () => {
  if (configured) return
  const config = useRuntimeConfig()
  webpush.setVapidDetails(
    config.vapidSubject as string,
    config.vapidPublicKey as string,
    config.vapidPrivateKey as string
  )
  configured = true
}

/**
 * Sends one push payload to every device the given user has subscribed from.
 * Dead subscriptions (404/410 — the browser dropped them) are removed so the
 * table doesn't accumulate stale rows.
 */
export const sendPushToUser = async (
  userId: number,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<void> => {
  ensureConfigured()

  const subscriptions = await pgrestAdmin<PushSubscriptionRow[]>('/push_subscriptions', {
    query: { user_id: `eq.${userId}`, select: '*' }
  })

  if (!subscriptions?.length) return

  const body = JSON.stringify(payload)

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        body
      )
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        await pgrestAdmin('/push_subscriptions', {
          method: 'DELETE',
          query: { id: `eq.${sub.id}` }
        }).catch(() => {})
      } else {
        console.error('[push] Failed to send to subscription', sub.id, error)
      }
    }
  }))
}
