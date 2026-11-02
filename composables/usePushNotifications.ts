// Subscribes the current device to Web Push and ties that subscription to
// whichever account is logged in right now. If this same device later logs
// in as a different in-SIGHT account, calling subscribe() again saves a
// separate row for that account too — each account's birthdays only ever
// reach that account's own subscription row(s), never a shared one.
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export const usePushNotifications = () => {
  const isSupported = () =>
    import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window

  const subscribe = async (): Promise<void> => {
    if (!isSupported()) return
    if (Notification.permission === 'denied') return

    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        const { publicKey } = await $fetch<{ publicKey: string }>('/api/push/public-key')
        if (!publicKey) return
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
        })
      }

      const json = subscription.toJSON()
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: { endpoint: json.endpoint, keys: json.keys }
      })
    } catch (error) {
      console.warn('[push] Failed to subscribe this device:', error)
    }
  }

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported()) return
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return

      await $fetch('/api/push/unsubscribe', {
        method: 'POST',
        body: { endpoint: subscription.endpoint }
      }).catch(() => {})
    } catch (error) {
      console.warn('[push] Failed to unsubscribe this device:', error)
    }
  }

  return { isSupported, subscribe, unsubscribe }
}
