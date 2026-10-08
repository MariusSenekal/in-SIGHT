// POST /api/auth/refresh
// Keep-alive: the session middleware already extended last_seen_at for a valid
// session, so this only reports whether the session is still alive.
export default defineEventHandler((event) => {
  if (!event.context.session) {
    throw createError({ statusCode: 401, message: 'Session expired.' })
  }
  return { ok: true }
})
