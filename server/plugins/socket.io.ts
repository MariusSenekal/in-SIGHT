// server/plugins/socket.io.ts
// Attaches a Socket.io server to Nitro's underlying HTTP server on the first
// inbound request.  The IO instance is stored in a module-level singleton so
// that any API route can call getIO().emit(…) to push real-time events.

import { Server as SocketIOServer } from 'socket.io'
import { getIO, setIO } from '../utils/socket'
import { resolveSessionToken, readCookieHeader, SESSION_COOKIE } from '../utils/session'

export default defineNitroPlugin((nitroApp: any) => {
  nitroApp.hooks.hook('request', (event: any) => {
    // Already initialised — nothing to do.
    if (getIO()) return

    // The underlying net.Socket (and its parent http.Server) are accessible
    // via the raw Node response object on the very first request.
    const rawServer = event.node?.res?.socket?.server
    if (!rawServer) return

    const io = new SocketIOServer(rawServer, {
      // Serve under the app base path so nginx proxies it correctly.
      path: '/socket.io/',
      // Do not serve the Socket.io client bundle — the SPA loads it via npm.
      serveClient: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })

    setIO(io)

    // Every connection must belong to a live database session (sent via the
    // HttpOnly session cookie). The server — never the client — decides which
    // rooms a socket joins, so one user can't listen in on another's events.
    io.use(async (socket, next) => {
      try {
        const token = readCookieHeader(socket.request.headers.cookie, SESSION_COOKIE)
        const session = await resolveSessionToken(token)
        if (!session) return next(new Error('unauthorized'))
        socket.data.session = session
        next()
      } catch {
        next(new Error('unauthorized'))
      }
    })

    io.on('connection', (socket) => {
      const session = socket.data.session
      // Private rooms: this user, and this one login (closed on logout).
      socket.join(`user:${session.id}`)
      socket.join(`session:${session.sessionId}`)
      // Staff/admin share the 'admins' room for service-request notifications.
      if (session.role === 'admin' || session.role === 'staff') {
        socket.join('admins')
      }
    })

    console.log('[socket.io] Server attached — path /socket.io/')
  })
})
