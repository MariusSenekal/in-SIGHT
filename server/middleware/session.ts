// server/middleware/session.ts
// Runs before every /api route. Identity comes ONLY from the database session
// referenced by the HttpOnly cookie — any Authorization header sent by the
// browser is discarded. For a valid session, a short-lived internal JWT for
// that user is placed on the request so route handlers and PostgREST (RLS)
// see the correct user and role.
import { resolveSession } from '../utils/session'
import { signJwt } from '../utils/jwt'

const INTERNAL_TOKEN_SECONDS = 120

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) return

  delete event.node.req.headers.authorization

  const session = await resolveSession(event)
  if (!session) return

  event.context.session = session
  const token = signJwt(
    session.id,
    session.name,
    session.username,
    session.role,
    useRuntimeConfig().jwtSecret as string,
    INTERNAL_TOKEN_SECONDS
  )
  event.node.req.headers.authorization = `Bearer ${token}`
})
