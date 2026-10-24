import { io } from 'socket.io-client'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const socketUrl = new URL(apiUrl, window.location.origin).origin
let tokenConectado = null

const socket = io(socketUrl, {
  autoConnect: false,
  auth: callback => callback({ token: localStorage.getItem('token') }),
})

socket.on('connect', () => {
  tokenConectado = localStorage.getItem('token')
})

socket.on('disconnect', () => {
  tokenConectado = null
})

export function getTicketSocket() {
  const tokenActual = localStorage.getItem('token')
  if (socket.connected && tokenConectado !== tokenActual) socket.disconnect()
  if (!socket.connected) socket.connect()
  return socket
}

export default socket
