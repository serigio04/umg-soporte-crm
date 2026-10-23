const assert = require('node:assert/strict')
const test = require('node:test')
const { loadWithMocks } = require('../test-helpers/loadWithMocks')

const queries = []
let clientQueries = []
const client = {
  query: async (sql, params) => {
    clientQueries.push([sql, params])
    if (sql.includes('SELECT idestudiante FROM estudiante')) return { rows: [{ idestudiante: 6 }] }
    if (sql.includes('SELECT a.idagente')) return { rows: [{ idagente: 3 }] }
    if (sql.includes('INSERT INTO tickets')) return { rows: [{ idticket: 42 }] }
    return { rows: [] }
  },
  release: () => queries.push(['release'])
}
const pool = {
  connect: async () => client,
  query: async (sql, params) => {
    queries.push([sql, params])
    if (sql.includes('SELECT idestudiante FROM estudiante')) return { rows: [{ idestudiante: 6 }] }
    if (sql.includes('FROM tickets')) return {
      rows: [{
        idticket: 42, fechacreacion: '2026-01-01', prioridadsla: 'Alta',
        tipologiaitil: 'Incidente', estado: 'Abierto', descripcion: 'Falla'
      }]
    }
    return { rows: [] }
  }
}
const surveyService = { crearEncuesta: async () => {} }
const ticketService = loadWithMocks('src/services/ticket.service.js', {
  'src/config/db.js': { pool },
  'src/services/survey.service.js': surveyService
})

test('crea un ticket con prioridad SLA según la tipología y confirma la transacción', async () => {
  queries.length = 0
  clientQueries = []

  const result = await ticketService.crearTicket({
    tipologiaITIL: 'Incidente',
    descripcion: 'Falla',
    carnetEstudiante: 'A123',
    idUsuario: 9,
    rol: 'Estudiante'
  })

  assert.deepEqual(result, {
    idTicket: 42,
    tipologiaITIL: 'Incidente',
    descripcion: 'Falla',
    prioridadSLA: 'Alta',
    estado: 'Abierto',
    idAgente: 3
  })
  assert.equal(clientQueries[0][0], 'BEGIN')
  assert.ok(clientQueries.some(([sql]) => sql.includes("'Alta'") || (sql.includes('INSERT INTO tickets') && sql.includes('prioridadsla'))))
  assert.equal(clientQueries.at(-1)[0], 'COMMIT')
  assert.ok(queries.some(([entry]) => entry === 'release'))
})

test('rechaza tipologías no válidas sin abrir una transacción', async () => {
  clientQueries = []
  await assert.rejects(
    ticketService.crearTicket({ tipologiaITIL: 'Otro', descripcion: 'x', carnetEstudiante: 'A123', idUsuario: 9, rol: 'Agente' }),
    /Tipología inválida/
  )
  assert.equal(clientQueries.length, 0)
})

test('mapea el último ticket del estudiante al contrato de respuesta', async () => {
  const result = await ticketService.obtenerUltimoTicket(9)

  assert.deepEqual(result, {
    idTicket: 42,
    fechaCreacion: '2026-01-01',
    prioridadSLA: 'Alta',
    tipologiaITIL: 'Incidente',
    estado: 'Abierto',
    descripcion: 'Falla'
  })
})
