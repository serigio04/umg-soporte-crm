const assert = require('node:assert/strict')
const test = require('node:test')
const { loadWithMocks } = require('../test-helpers/loadWithMocks')

const calls = []
const ticketService = {
  crearTicket: async (...args) => {
    calls.push(['crearTicket', ...args])
    return { idTicket: 21 }
  },
  obtenerDetalleTicket: async (...args) => {
    calls.push(['obtenerDetalleTicket', ...args])
    return { idTicket: args[0] }
  },
  obtenerTicketsEstudiante: async (...args) => [{ idUsuario: args[0] }],
  obtenerUltimoTicket: async () => null,
  cambiarEstadoTicket: async (...args) => ({ idTicket: args[0], nuevoEstado: args[1] }),
  obtenerHistorialTicketsAgente: async () => [],
  escalarTicket: async () => ({ idTicket: 21 }),
  aceptarResolucion: async () => ({ estado: 'Cerrado' }),
  obtenerTicketsAbiertos: async () => []
}
const pool = {
  query: async (...args) => {
    calls.push(['pool.query', ...args])
    return { rows: [{ carne: 'A123', idestudiante: 5 }] }
  }
}
const controller = loadWithMocks('src/controllers/ticket.controller.js', {
  'src/services/ticket.service.js': ticketService,
  'src/config/db.js': { pool }
})

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

test('rechaza la creación de ticket si faltan campos requeridos', async () => {
  await assert.rejects(
    controller.crearTicket({ body: { tipologiaITIL: 'Incidente' } }, response()),
    error => error.status === 400 && error.code === 'MISSING_REQUIRED_FIELDS'
  )
})

test('crea el ticket del estudiante usando su carnet asociado', async () => {
  calls.length = 0
  const res = response()

  await controller.crearTicket({
    body: { tipologiaITIL: 'Incidente', descripcion: 'No funciona el portal' },
    usuario: { rol: 'Estudiante', idUsuario: 9 }
  }, res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.body.ticket.idTicket, 21)
  assert.deepEqual(calls[0], ['pool.query', 'SELECT carne FROM estudiante WHERE idusuario = $1 LIMIT 1', [9]])
  assert.deepEqual(calls[1], ['crearTicket', {
    tipologiaITIL: 'Incidente',
    descripcion: 'No funciona el portal',
    carnetEstudiante: 'A123',
    idUsuario: 9,
    rol: 'Estudiante'
  }])
})

test('valida y consulta el detalle del ticket por ID entero', async () => {
  calls.length = 0
  const res = response()

  await controller.obtenerDetalle({ params: { idTicket: '21' } }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { idTicket: 21 })
  assert.deepEqual(calls[0], ['obtenerDetalleTicket', 21])
  await assert.rejects(
    controller.obtenerDetalle({ params: { idTicket: 'abc' } }, response()),
    error => error.status === 400 && error.code === 'INVALID_TICKET_ID'
  )
})
