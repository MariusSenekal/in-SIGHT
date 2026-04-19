// server/plugins/socket.io.ts
// Attaches a Socket.io server to Nitro's underlying HTTP server on the first
// inbound request.  The IO instance is stored in a module-level singleton so
// that any API route can call getIO().emit(…) to push real-time events.

import { Server as SocketIOServer } from 'socket.io'
import { getIO, setIO } from '../utils/socket'

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
      path: '/login/socket.io/',
      // Do not serve the Socket.io client bundle — the SPA loads it via npm.
      serveClient: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })

    setIO(io)

    io.on('connection', (socket) => {
      // Clients join the 'admins' room after authenticating so that we can
      // direct-broadcast to staff/admin users without hitting everyone.
      socket.on('join-admins', () => {
        socket.join('admins')
      })
    })

    console.log('[socket.io] Server attached — path /login/socket.io/')
  })
})
