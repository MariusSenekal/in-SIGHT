// Shared helper for writing an in-app notification row and, if that user has
// a tab open right now, pushing it to them live over their socket room.
// Used by both the birthday and client-date-reminder background checks.
import { pgrestAdmin } from './pgrest'
import { getIO } from './socket'

export interface NewNotification {
  userId: number
  type: string
  title: string
  body: string
  linkType: string
  linkId: number
  // Unique per (user, event, interval) so a container restart mid-day can
  // never insert the same reminder twice -- the UNIQUE(user_id, dedupe_key)
  // constraint on insight.notifications turns a repeat into a no-op.
  dedupeKey: string
}

export const createNotification = async (notification: NewNotification): Promise<void> => {
  const rows = await pgrestAdmin<any[]>('/notifications', {
    method: 'POST',
    body: {
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link_type: notification.linkType,
      link_id: notification.linkId,
      dedupe_key: notification.dedupeKey
    },
    extraHeaders: { Prefer: 'return=representation,resolution=ignore-duplicates' }
  }).catch(() => [])

  const inserted = rows?.[0]
  if (inserted) {
    getIO()?.to(`user:${notification.userId}`).emit('new-notification', inserted)
  }
}
