const assert = require('node:assert/strict')
const { once } = require('node:events')
const express = require('express')
const jwt = require('jsonwebtoken')
const test = require('node:test')
const { loadWithMocks } = require('../unit/test-helpers/loadWithMocks')

const jwtSecret = 'integration-test-secret'
process.env.JWT_SECRET = jwtSecret

const database = {
  nextTicketId: 1,
  tickets: [],
  history: []
}

const pool = {
  query: async (sql, params = []) => {
    if (sql.includes('SELECT carne FROM estudiante')) {
      return { rows: [{ carne: 'A123' }] }
    }

    if (sql.includes('FROM tickets t') && sql.includes('WHERE t.idticket = $1')) {
      const ticket = database.tickets.find(item => item.idticket === Number(params[0]))
      return { rows: ticket ? [ticket] : [] }
    }

    if (sql.includes('FROM estadosticket')) {
      return { rows: database.history.filter(item => item.idticket === Number(params[0])) }
    }

    throw new Error(`Consulta no contemplada en la prueba: ${sql}`)
  },
  connect: async () => ({
    query: async (sql, params = []) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] }

      if (sql.includes('SELECT idestudiante FROM estudiante')) {
        return { rows: [{ idestudiante: 5 }] }
      }

      if (sql.includes('SELECT a.idagente')) {
        return { rows: [{ idagente: 3 }] }
      }

      if (sql.includes('INSERT INTO tickets')) {
        const ticket = {
          idticket: database.nextTicketId++,
          fechacreacion: '2026-01-01T12:00:00.000Z',
          prioridadsla: params[0],
          tipologiaitil: params[1],
          estado: 'Abierto',
          descripcion: params[3],
          idestudiante: params[2],
          idagente: params[4],
          carne: 'A123',
          nombreestudiante: 'Estudiante de Integración'
        }
        database.tickets.push(ticket)
        return { rows: [{ idticket: ticket.idticket }] }
      }

      if (sql.includes('INSERT INTO estadosticket')) {
        database.history.push({
          nombreestado: 'Abierto',
          fechacambio: '2026-01-01T12:00:00.000Z',
          comentariotecnico: 'Ticket creado',
          idticket: Number(params[0])
        })
        return { rows: [] }
      }

      throw new Error(`Consulta transaccional no contemplada en la prueba: ${sql}`)
    },
    release: () => {}
  })
}

const ticketRouter = loadWithMocks('src/routes/ticket.route.js', {
  'src/config/db.js': { pool }
})
const app = express()
app.use(express.json())
app.use('/api/tickets', ticketRouter)
app.use(require('../../src/middlewares/errorHandler.middleware'))

let server
let baseUrl

test.before(async () => {
  server = app.listen(0)
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

test.after(async () => {
  if (server?.listening) {
    server.close()
    await once(server, 'close')
  }
})

test.beforeEach(() => {
  database.nextTicketId = 1
  database.tickets.length = 0
  database.history.length = 0
})

function token(rol = 'Estudiante') {
  return jwt.sign({ idUsuario: 9, rol }, jwtSecret)
}

test('crea un ticket por HTTP y permite consultar su detalle', async () => {
  const createResponse = await fetch(`${baseUrl}/api/tickets`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token()}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      tipologiaITIL: 'Incidente',
      descripcion: 'No puedo ingresar al portal'
    })
  })

  assert.equal(createResponse.status, 201)
  const created = await createResponse.json()
  assert.equal(created.ticket.idTicket, 1)
  assert.equal(created.ticket.prioridadSLA, 'Alta')

  const detailResponse = await fetch(`${baseUrl}/api/tickets/1`, {
    headers: { authorization: `Bearer ${token()}` }
  })

  assert.equal(detailResponse.status, 200)
  const detail = await detailResponse.json()
  assert.equal(detail.idTicket, 1)
  assert.equal(detail.descripcion, 'No puedo ingresar al portal')
  assert.equal(detail.nombreEstudiante, 'Estudiante de Integración')
  assert.deepEqual(detail.historial.map(item => item.estado), ['Abierto'])
})

test('protege los endpoints cuando falta el token o el rol no está autorizado', async () => {
  const missingTokenResponse = await fetch(`${baseUrl}/api/tickets`)
  assert.equal(missingTokenResponse.status, 401)

  const wrongRoleResponse = await fetch(`${baseUrl}/api/tickets`, {
    headers: { authorization: `Bearer ${token('Agente')}` }
  })
  assert.equal(wrongRoleResponse.status, 403)
})
