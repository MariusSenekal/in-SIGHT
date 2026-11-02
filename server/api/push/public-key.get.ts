// GET /api/push/public-key - The VAPID public key the browser needs to subscribe.
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return { publicKey: config.vapidPublicKey as string }
})
