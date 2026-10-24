const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { puedeAccederTicket } = require('./services/ticket-access.service')

let io

function obtenerToken(socket) {
  const authorization = socket.handshake.headers.authorization
  if (authorization && authorization.startsWith('Bearer ')) return authorization.slice(7)
  return socket.handshake.auth && socket.handshake.auth.token
}

function iniciarRealtime(server) {
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(item => item.trim())
  io = new Server(server, { cors: { origin: origins } })

  io.use((socket, next) => {
    try {
      socket.usuario = jwt.verify(obtenerToken(socket), process.env.JWT_SECRET)
      next()
    } catch (error) {
      next(new Error('NO_AUTORIZADO'))
    }
  })

  io.on('connection', socket => {
    socket.on('ticket:join', async (valor, responder = () => {}) => {
      const idTicket = Number(valor && valor.idTicket !== undefined ? valor.idTicket : valor)
      if (!Number.isInteger(idTicket)) return responder({ ok: false, error: 'ID_TICKET_INVALIDO' })
      try {
        const ticket = await puedeAccederTicket(idTicket, socket.usuario)
        if (!ticket) return responder({ ok: false, error: 'NO_AUTORIZADO' })
        await socket.join(`ticket:${idTicket}`)
        responder({ ok: true, idTicket })
      } catch (error) {
        responder({ ok: false, error: 'ERROR_INTERNO' })
      }
    })

    socket.on('ticket:leave', valor => {
      const idTicket = Number(valor && valor.idTicket !== undefined ? valor.idTicket : valor)
      if (Number.isInteger(idTicket)) socket.leave(`ticket:${idTicket}`)
    })
  })

  return io
}

function emitirTicket(idTicket, tipo, payload) {
  if (io) io.to(`ticket:${idTicket}`).emit(tipo, payload)
}

async function refrescarAccesosTicket(idTicket) {
  if (!io) return

  try {
    const sockets = await io.in(`ticket:${idTicket}`).fetchSockets()
    await Promise.all(sockets.map(async socket => {
      const ticket = await puedeAccederTicket(idTicket, socket.usuario)
      if (!ticket) await socket.leave(`ticket:${idTicket}`)
    }))
  } catch (error) {
    console.error(`No se pudieron refrescar los accesos del ticket ${idTicket}:`, error)
  }
}

module.exports = { iniciarRealtime, emitirTicket, refrescarAccesosTicket }
