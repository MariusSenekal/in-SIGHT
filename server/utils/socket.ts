import type { Server as SocketIOServer } from 'socket.io'

let _io: SocketIOServer | null = null

export const getIO = (): SocketIOServer | null => _io

export const setIO = (io: SocketIOServer): void => {
  _io = io
}
