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

// navigator.serviceWorker.ready never resolves or rejects if no service
// worker ever successfully activates for this origin -- so every call that
// awaits it is raced against this timeout instead of hanging forever with
// no error and no way to tell the user what went wrong.
const SW_READY_TIMEOUT_MS = 8000

const getReadyRegistration = async (): Promise<ServiceWorkerRegistration> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Service worker did not become ready in time.')), SW_READY_TIMEOUT_MS)
  )
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

export const usePushNotifications = () => {
  const isSupported = () =>
    import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window

  // Most mobile browsers only show the permission popup when
  // requestPermission() is called synchronously inside a user gesture
  // (a click/tap handler) with no `await` ahead of it -- call this as the
  // very first line of that handler. Once the gesture window has passed
  // (e.g. after an awaited login request), the browser silently resolves
  // to 'default' instead of prompting, with no error at all.
  const requestPermission = (): Promise<NotificationPermission> => {
    if (!isSupported()) return Promise.resolve('denied')
    if (Notification.permission !== 'default') return Promise.resolve(Notification.permission)
    return Notification.requestPermission()
  }

  // Finishes the subscription using whatever permission state already
  // exists -- never prompts itself, so it's safe to call from async code
  // (e.g. straight after login) once requestPermission() has already run
  // inside the click handler, or on every subsequent app load where the
  // user already granted permission. Throws on failure so a caller that's
  // driving a loading spinner (the profile page's Enable button) can show
  // the real reason instead of spinning forever with a swallowed error.
  const subscribe = async (): Promise<void> => {
    if (!isSupported()) throw new Error('Push notifications are not supported in this browser.')
    if (Notification.permission !== 'granted') return

    const registration = await getReadyRegistration()
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const { publicKey } = await $fetch<{ publicKey: string }>('/api/push/public-key')
      if (!publicKey) throw new Error('Push is not configured on the server yet.')
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
  }

  // Requests permission (must be called directly from a click/tap handler)
  // then subscribes if granted -- the one call sites that aren't already
  // inside a user gesture (e.g. session restore on page load) should call
  // subscribe() alone instead, since permission will already be resolved
  // from a previous visit by then.
  const requestPermissionAndSubscribe = async (): Promise<void> => {
    await requestPermission()
    await subscribe()
  }

  // True only when this device both has OS/browser permission AND holds a
  // live PushManager subscription -- permission can be 'granted' while the
  // subscription itself was removed (e.g. disabled from another tab, or
  // dropped by the browser), so the profile page checks this rather than
  // permission alone before showing "enabled".
  const isSubscribed = async (): Promise<boolean> => {
    if (!isSupported() || Notification.permission !== 'granted') return false
    try {
      const registration = await getReadyRegistration()
      const subscription = await registration.pushManager.getSubscription()
      return subscription !== null
    } catch {
      return false
    }
  }

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported()) return
    try {
      const registration = await getReadyRegistration()
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return

      await $fetch('/api/push/unsubscribe', {
        method: 'POST',
        body: { endpoint: subscription.endpoint }
      }).catch(() => {})

      await subscription.unsubscribe()
    } catch (error) {
      console.warn('[push] Failed to unsubscribe this device:', error)
    }
  }

  return { isSupported, requestPermission, subscribe, requestPermissionAndSubscribe, isSubscribed, unsubscribe }
}
