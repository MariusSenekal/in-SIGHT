// composables/useSocket.ts
// Client-side Socket.io connection.
// Call useSocket() in any component; it returns a shared singleton socket.
// The socket authenticates with the browser's HttpOnly database-session cookie;
// the server places it in that user's private rooms (and 'admins' for
// admin/staff).

import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null

export const useSocket = () => {
  const connect = (): Socket => {
    if (_socket) return _socket

    _socket = io({
      path: '/socket.io/',
      // Try WebSocket first; fall back to long-polling if WS is blocked.
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    })

    return _socket
  }

  const disconnect = () => {
    _socket?.disconnect()
    _socket = null
  }

  const getSocket = (): Socket | null => _socket

  return { connect, disconnect, getSocket }
}
