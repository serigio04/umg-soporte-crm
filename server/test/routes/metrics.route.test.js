const assert = require('node:assert/strict')
const test = require('node:test')
const { loadWithMocks } = require('../test-helpers/loadWithMocks')

const controllerNames = [
  'obtenerMetricas', 'obtenerDashboardCoordinador', 'obtenerMetricasAgente',
  'descargarReporteCsv', 'descargarReporteExcel', 'descargarReporteCalificacionesExcel',
  'obtenerMetricasTickets'
]
const controller = Object.fromEntries(controllerNames.map(name => [name, () => {}]))
const verificarToken = () => {}
const soloRol = (...roles) => {
  const middleware = function roleMiddleware() {}
  middleware.roles = roles
  return middleware
}
const router = loadWithMocks('src/routes/metrics.route.js', {
  'src/controllers/metrics.controller.js': controller,
  'src/middlewares/auth.middleware.js': { verificarToken, soloRol }
})

test('registra las rutas de métricas protegidas con roles apropiados', () => {
  const registered = router.stack.map(layer => ({
    path: layer.route.path,
    method: Object.keys(layer.route.methods)[0].toUpperCase(),
    handlers: layer.route.stack.map(item => item.handle)
  }))
  const expected = [
    ['/', ['Coordinador'], 'obtenerMetricas'],
    ['/dashboard', ['Coordinador'], 'obtenerDashboardCoordinador'],
    ['/agente/:idAgente', ['Agente', 'Coordinador'], 'obtenerMetricasAgente'],
    ['/reporte-csv', ['Coordinador', 'Agente'], 'descargarReporteCsv'],
    ['/reporte-excel', ['Coordinador'], 'descargarReporteExcel'],
    ['/reporte-calificaciones-excel', ['Coordinador'], 'descargarReporteCalificacionesExcel'],
    ['/tickets/clasificacion', ['Coordinador'], 'obtenerMetricasTickets']
  ]

  assert.deepEqual(registered.map(route => route.path), expected.map(([path]) => path))
  expected.forEach(([path, roles, controllerName], index) => {
    assert.equal(registered[index].method, 'GET')
    assert.equal(registered[index].handlers[0], verificarToken)
    assert.equal(registered[index].handlers.at(-1), controller[controllerName])
    assert.deepEqual(registered[index].handlers[1].roles, roles)
  })
})
