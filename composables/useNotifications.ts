// composables/useNotifications.ts
// Shared client-side state for the notification bell: next service due,
// birthday and contract renewal reminders for the current user's own
// records. Backed by GET/POST /api/notifications/*; kept live by a socket
// event (see components/NotificationBell.vue) with polling as a fallback
// for any device that never gets a socket connection.
export interface AppNotification {
  id: number
  user_id: number
  type: 'next_service_due' | 'birthday' | 'contract_renewal'
  title: string
  body: string
  link_type: string
  link_id: number | null
  read_at: string | null
  created_at: string
}

export const useNotifications = () => {
  const notifications = useState<AppNotification[]>('notifications-list', () => [])
  const loaded = useState<boolean>('notifications-loaded', () => false)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.read_at).length)

  const fetchAll = async () => {
    try {
      notifications.value = await $fetch<AppNotification[]>('/api/notifications')
      loaded.value = true
    } catch {
      // Non-fatal — the bell just keeps showing whatever it last had.
    }
  }

  const markRead = async (id: number) => {
    const notification = notifications.value.find((n) => n.id === id)
    if (!notification || notification.read_at) return
    notification.read_at = new Date().toISOString()
    await $fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
  }

  const markAllRead = async () => {
    const now = new Date().toISOString()
    notifications.value.forEach((n) => { if (!n.read_at) n.read_at = now })
    await $fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {})
  }

  // Called when the socket delivers a brand-new row live -- prepend it
  // rather than re-fetching, so the bell updates instantly.
  const addLive = (notification: AppNotification) => {
    if (notifications.value.some((n) => n.id === notification.id)) return
    notifications.value = [notification, ...notifications.value]
  }

  return { notifications, unreadCount, loaded, fetchAll, markRead, markAllRead, addLive }
}
