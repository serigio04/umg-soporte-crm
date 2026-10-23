const assert = require('node:assert/strict')
const { once } = require('node:events')
const express = require('express')
const jwt = require('jsonwebtoken')
const test = require('node:test')
const { loadWithMocks } = require('../unit/test-helpers/loadWithMocks')

const jwtSecret = 'integration-test-secret'
process.env.JWT_SECRET = jwtSecret

const ticketCounts = {
  Incidente: 4,
  Solicitud: 7,
  Cambio: 2
}

const pool = {
  query: async sql => {
    const tipo = Object.keys(ticketCounts).find(value => sql.includes(`tipologiaitil = '${value}'`))
    if (tipo) return { rows: [{ cantidad: String(ticketCounts[tipo]) }] }
    throw new Error(`Consulta no contemplada en la prueba: ${sql}`)
  }
}

const metricsRouter = loadWithMocks('src/routes/metrics.route.js', {
  'src/config/db.js': { pool }
})
const app = express()
app.use('/api/metricas', metricsRouter)
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

function token(rol = 'Coordinador') {
  return jwt.sign({ idUsuario: 1, rol }, jwtSecret)
}

test('consulta la clasificación de tickets a través de la ruta protegida', async () => {
  const response = await fetch(`${baseUrl}/api/metricas/tickets/clasificacion`, {
    headers: { authorization: `Bearer ${token()}` }
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    incidentes: 4,
    solicitudes: 7,
    cambios: 2
  })
})

test('rechaza el acceso de agentes a la clasificación de métricas', async () => {
  const response = await fetch(`${baseUrl}/api/metricas/tickets/clasificacion`, {
    headers: { authorization: `Bearer ${token('Agente')}` }
  })

  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), { message: 'No tienes permiso para esto' })
})
