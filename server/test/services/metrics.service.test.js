const assert = require('node:assert/strict')
const test = require('node:test')
const { loadWithMocks } = require('../test-helpers/loadWithMocks')

const calls = []
const pool = {
  query: async (sql, params) => {
    calls.push([sql, params])
    if (sql.includes('AVG(EXTRACT')) return { rows: [{ tiempo_promedio_horas: '2.5' }] }
    if (sql.includes('COUNT(*)') && sql.includes("NOT IN ('Resuelto'")) return { rows: [{ cantidad: '3' }] }
    if (sql.includes('COUNT(*)') && sql.includes("IN ('Resuelto'")) return { rows: [{ cantidad: '8' }] }
    if (sql.includes('SELECT t.idticket')) return {
      rows: [{
        idticket: 4,
        prioridadsla: 'Alta',
        fechacreacion: '2026-01-01',
        fecharesolucion: null,
        estado: 'Abierto',
        tipologiaitil: 'Incidente'
      }]
    }
    if (sql.includes("tipologiaitil = 'Incidente'")) return { rows: [{ cantidad: '5' }] }
    if (sql.includes("tipologiaitil = 'Solicitud'")) return { rows: [{ cantidad: '6' }] }
    if (sql.includes("tipologiaitil = 'Cambio'")) return { rows: [{ cantidad: '7' }] }
    return { rows: [] }
  }
}
const metricsService = loadWithMocks('src/services/metrics.service.js', {
  'src/config/db.js': { pool }
})

test('arma métricas del agente y convierte conteos a números', async () => {
  calls.length = 0

  const result = await metricsService.obtenerMetricasAgente(12)

  assert.deepEqual(result, {
    tiempoPromedioResolucionHoras: '2.5',
    ticketsAbiertos: 3,
    ticketsResueltos: 8,
    ticketsVencidos: [{
      idTicket: 4,
      prioridadSLA: 'Alta',
      fechaCreacion: '2026-01-01',
      fechaResolucion: null,
      estado: 'Abierto',
      tipologiaITIL: 'Incidente'
    }]
  })
  assert.ok(calls.every(([, params]) => params?.[0] === 12))
})

test('devuelve la clasificación de tickets por tipología', async () => {
  const result = await metricsService.obtenerMetricasTickets()

  assert.deepEqual(result, { incidentes: 5, solicitudes: 6, cambios: 7 })
})

test('usa cero cuando no hay tiempo promedio de resolución', async () => {
  const originalQuery = pool.query
  pool.query = async sql => {
    if (sql.includes('AVG(EXTRACT')) return { rows: [{ tiempo_promedio_horas: null }] }
    if (sql.includes('AVG(calificacion)')) return { rows: [] }
    return { rows: [] }
  }
  try {
    const result = await metricsService.obtenerMetricasCoordinador()
    assert.equal(result.tiempoPromedioResolucionHoras, 0)
    assert.deepEqual(result.calificacionGeneral, { promedio_calificacion: 0, porcentaje_calificacion: 0 })
  } finally {
    pool.query = originalQuery
  }
})
