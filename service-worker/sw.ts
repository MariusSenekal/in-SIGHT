/// <reference lib="webworker" />
// Custom service worker (injectManifest strategy) so we can add Web Push
// handling on top of the usual Workbox precache/offline-fallback behaviour
// that @vite-pwa/nuxt would otherwise generate for us automatically.
declare let self: ServiceWorkerGlobalScope

import { precacheAndRoute } from 'workbox-precaching'

// This app is ssr:false with Nitro serving '/' dynamically on every
// request -- there is no static index.html in the build output for
// globPatterns to precache. A NavigationRoute bound to '/' via
// createHandlerBoundToURL('/') therefore throws "non-precached-url" the
// moment this script is evaluated (precached URLs are looked up eagerly
// at call time, not lazily), which crashes the ENTIRE service worker
// before it can register at all -- no error surfaces anywhere except the
// browser's own "ServiceWorker script evaluation failed". Navigations
// are left to hit the network/Nitro directly; only static assets (JS,
// CSS, icons) get precached below.
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event) => {
  let data: PushPayload = { title: 'in-SIGHT', body: '' }
  try {
    if (event.data) data = event.data.json()
  } catch {
    if (event.data) data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'in-SIGHT', {
      body: data.body || '',
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-192x192.png',
      tag: data.tag,
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) || '/'

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })()
  )
})
