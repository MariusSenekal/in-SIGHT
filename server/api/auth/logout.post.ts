// POST /api/auth/logout
// Revokes the current database session, clears the cookie and drops any
// real-time connections that belonged to it.
import { revokeSession, SESSION_COOKIE } from '../../utils/session'
import { getIO } from '../../utils/socket'

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (session) {
    await revokeSession(event, session.sessionId)
    getIO()?.in(`session:${session.sessionId}`).disconnectSockets(true)
  } else {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
  }
  return { ok: true }
})
