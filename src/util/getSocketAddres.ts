import net from 'node:net'

export function getSocketAddres(socket: net.Socket) {
  return `${socket.remoteAddress} + ${socket.remotePort}`;
}
