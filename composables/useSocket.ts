// composables/useSocket.ts
// Client-side Socket.io connection.
// Call useSocket() in any component; it returns a shared singleton socket.
// Authenticated users (admin/staff) automatically join the 'admins' room so
// they receive real-time service-request notifications.

import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null

export const useSocket = () => {
  const { currentUser } = useAuth()

  const connect = (): Socket => {
    if (_socket?.connected) return _socket

    _socket = io({
      path: '/socket.io/',
      // Try WebSocket first; fall back to long-polling if WS is blocked.
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    })

    _socket.on('connect', () => {
      // Join the 'admins' room so the server can broadcast only to staff/admin clients.
      const role = currentUser.value?.role
      if (role === 'admin' || role === 'staff') {
        _socket!.emit('join-admins')
      }
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
