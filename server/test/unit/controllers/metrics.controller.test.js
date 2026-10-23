const assert = require('node:assert/strict')
const test = require('node:test')
const { loadWithMocks } = require('../test-helpers/loadWithMocks')

const serviceCalls = []
const metricsService = {
  obtenerMetricas: async () => ({ ticketsAbiertos: 4 }),
  obtenerMetricasCoordinador: async () => ({ slaVencidos: [] }),
  obtenerMetricasAgente: async id => ({ idAgente: id }),
  obtenerMetricasTickets: async () => ({ incidentes: 2 }),
  obtenerDatosReporteCsv: async () => {
    serviceCalls.push('obtenerDatosReporteCsv')
    return [{
      idticket: 10,
      tipologiaitil: 'Incidente',
      prioridadsla: 'Alta',
      estado: 'Abierto',
      fechacreacion: '2026-01-02T10:00:00.000Z',
      agente: 'Ana "A"',
      estudiante: null
    }]
  }
}
const controller = loadWithMocks('src/controllers/metrics.controller.js', {
  'src/services/metrics.service.js': metricsService
})

function response() {
  return {
    headers: {},
    statusCode: 200,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    header(name, value) {
      this.headers[name] = value
      return this
    },
    attachment(name) {
      this.filename = name
      return this
    },
    send(body) {
      this.body = body
      return this
    }
  }
}

test('devuelve las métricas del dashboard del coordinador', async () => {
  const res = response()

  await controller.obtenerDashboardCoordinador({}, res)

  assert.deepEqual(res.body, { slaVencidos: [] })
})

test('pasa el ID del agente al servicio de métricas', async () => {
  const res = response()

  await controller.obtenerMetricasAgente({ params: { idAgente: '7' } }, res)

  assert.deepEqual(res.body, { idAgente: '7' })
})

test('genera CSV con encabezados, campos escapados y valores faltantes', async () => {
  serviceCalls.length = 0
  const res = response()

  await controller.descargarReporteCsv({}, res)

  assert.deepEqual(serviceCalls, ['obtenerDatosReporteCsv'])
  assert.equal(res.headers['Content-Type'], 'text/csv')
  assert.equal(res.filename, 'reporte_tickets.csv')
  assert.match(res.body, /^ID Ticket,Tipologia,Prioridad,Estado,Fecha Creacion,Agente,Estudiante/)
  assert.match(res.body, /"Ana ""A""","Desconocido"/)
})

test('responde 404 si no hay tickets que exportar a CSV', async () => {
  metricsService.obtenerDatosReporteCsv = async () => []
  const res = response()

  await controller.descargarReporteCsv({}, res)

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { message: 'No hay datos para exportar' })
})
