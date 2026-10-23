require('dotenv').config({ quiet: true })

const assert = require('node:assert/strict')
const { once } = require('node:events')
const { randomUUID } = require('node:crypto')
const jwt = require('jsonwebtoken')
const { after, before, describe, it } = require('node:test')

const configurationReady = Boolean(
  process.env.DB_CONNECTION &&
  process.env.JWT_SECRET &&
  process.env.E2E_STUDENT_USER_ID &&
  process.env.E2E_CONFIRM_WRITE === 'true'
)
const skipReason = configurationReady
  ? false
  : 'Configura DB_CONNECTION, JWT_SECRET, E2E_STUDENT_USER_ID y E2E_CONFIRM_WRITE=true para ejecutar E2E contra una base de prueba.'

describe('E2E de tickets', { skip: skipReason }, () => {
  const { pool } = require('../../src/config/db')
  const app = require('../../src')
  const idUsuario = Number(process.env.E2E_STUDENT_USER_ID)
  const testRunId = randomUUID()
  const descriptionPrefix = `E2E-TICKETS-${testRunId}-`
  let server
  let baseUrl
  let accessToken

  before(async () => {
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      throw new Error('E2E_STUDENT_USER_ID debe ser un entero positivo.')
    }

    const student = await pool.query(
      'SELECT idusuario FROM estudiante WHERE idusuario = $1 LIMIT 1',
      [idUsuario]
    )
    if (student.rows.length === 0) {
      throw new Error('E2E_STUDENT_USER_ID debe corresponder a un estudiante existente en la base de prueba.')
    }

    server = app.listen(0)
    await once(server, 'listening')
    baseUrl = `http://127.0.0.1:${server.address().port}`
    accessToken = jwt.sign({ idUsuario, rol: 'Estudiante' }, process.env.JWT_SECRET)
  })

  after(async () => {
    try {
      const matchingTickets = await pool.query(
        'SELECT idticket FROM tickets WHERE descripcion LIKE $1',
        [`${descriptionPrefix}%`]
      )
      const ticketIds = matchingTickets.rows.map(ticket => ticket.idticket)

      if (ticketIds.length > 0) {
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          await client.query('DELETE FROM encuestas WHERE idticket = ANY($1::int[])', [ticketIds])
          await client.query('DELETE FROM estadosticket WHERE idticket = ANY($1::int[])', [ticketIds])
          await client.query('DELETE FROM tickets WHERE idticket = ANY($1::int[])', [ticketIds])
          await client.query('COMMIT')
        } catch (error) {
          await client.query('ROLLBACK')
          throw error
        } finally {
          client.release()
        }
      }
    } finally {
      if (server?.listening) {
        server.close()
        await once(server, 'close')
      }
      await pool.end()
    }
  })

  it('crea un ticket por la API real y lo consulta en lista, último y detalle', async () => {
    const description = `${descriptionPrefix}No puedo acceder a mi cuenta`
    const createResponse = await fetch(`${baseUrl}/api/tickets`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        tipologiaITIL: 'Incidente',
        descripcion: description
      })
    })

    assert.equal(createResponse.status, 201)
    const created = await createResponse.json()
    assert.equal(created.ticket.tipologiaITIL, 'Incidente')
    assert.equal(created.ticket.prioridadSLA, 'Alta')
    assert.equal(created.ticket.estado, 'Abierto')

    const [listResponse, latestResponse, detailResponse] = await Promise.all([
      fetch(`${baseUrl}/api/tickets`, {
        headers: { authorization: `Bearer ${accessToken}` }
      }),
      fetch(`${baseUrl}/api/tickets/ultimo`, {
        headers: { authorization: `Bearer ${accessToken}` }
      }),
      fetch(`${baseUrl}/api/tickets/${created.ticket.idTicket}`, {
        headers: { authorization: `Bearer ${accessToken}` }
      })
    ])

    assert.equal(listResponse.status, 200)
    const tickets = await listResponse.json()
    assert.ok(tickets.some(ticket => ticket.idTicket === created.ticket.idTicket && ticket.descripcion === description))

    assert.equal(latestResponse.status, 200)
    const latestTicket = await latestResponse.json()
    assert.equal(latestTicket.idTicket, created.ticket.idTicket)

    assert.equal(detailResponse.status, 200)
    const detail = await detailResponse.json()
    assert.equal(detail.idTicket, created.ticket.idTicket)
    assert.equal(detail.descripcion, description)
    assert.equal(detail.estado, 'Abierto')
    assert.ok(detail.historial.some(item => item.estado === 'Abierto'))
  })

  it('rechaza una solicitud sin autenticación y un ticket sin campos requeridos', async () => {
    const unauthenticatedResponse = await fetch(`${baseUrl}/api/tickets`)
    assert.equal(unauthenticatedResponse.status, 401)

    const invalidRequestResponse = await fetch(`${baseUrl}/api/tickets`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ tipologiaITIL: 'Incidente' })
    })

    assert.equal(invalidRequestResponse.status, 400)
    const problem = await invalidRequestResponse.json()
    assert.equal(problem.code, 'MISSING_REQUIRED_FIELDS')
  })
})
