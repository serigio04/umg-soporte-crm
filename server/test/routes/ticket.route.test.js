const assert = require('node:assert/strict')
const test = require('node:test')
const { loadWithMocks } = require('../test-helpers/loadWithMocks')

const controllerNames = [
  'obtenerMisTickets', 'crearTicket', 'obtenerUltimoTicket', 'obtenerHistorialAgente',
  'obtenerTicketsAbiertos', 'obtenerDetalle', 'cambiarEstado', 'aceptarResolucion', 'escalar'
]
const controller = Object.fromEntries(controllerNames.map(name => [name, () => {}]))
const verificarToken = () => {}
const soloRol = (...roles) => {
  const middleware = function roleMiddleware() {}
  middleware.roles = roles
  return middleware
}
const router = loadWithMocks('src/routes/ticket.route.js', {
  'src/controllers/ticket.controller.js': controller,
  'src/middlewares/auth.middleware.js': { verificarToken, soloRol }
})

function routes() {
  return router.stack.map(layer => ({
    path: layer.route.path,
    method: Object.keys(layer.route.methods)[0].toUpperCase(),
    handlers: layer.route.stack.map(item => item.handle)
  }))
}

test('registra todas las rutas de tickets con sus roles y controladores', () => {
  const registered = routes()
  const expected = [
    ['GET', '/', ['Estudiante'], 'obtenerMisTickets'],
    ['POST', '/', ['Estudiante', 'Agente', 'Coordinador'], 'crearTicket'],
    ['GET', '/ultimo', ['Estudiante'], 'obtenerUltimoTicket'],
    ['GET', '/historial/agente', ['Agente', 'Coordinador'], 'obtenerHistorialAgente'],
    ['GET', '/abiertos', ['Coordinador'], 'obtenerTicketsAbiertos'],
    ['GET', '/:idTicket', [], 'obtenerDetalle'],
    ['PUT', '/:idTicket/estado', ['Agente', 'Coordinador'], 'cambiarEstado'],
    ['PUT', '/:idTicket/aceptar', ['Estudiante'], 'aceptarResolucion'],
    ['PUT', '/:idTicket/escalar', ['Agente'], 'escalar']
  ]

  assert.deepEqual(registered.map(route => [route.method, route.path]), expected.map(([method, path]) => [method, path]))
  expected.forEach(([method, path, roles, controllerName], index) => {
    const handlers = registered[index].handlers
    assert.equal(handlers[0], verificarToken, `${method} ${path} should verify token`)
    if (roles.length) assert.deepEqual(handlers[1].roles, roles)
    assert.equal(handlers.at(-1), controller[controllerName])
  })
  assert.ok(registered.findIndex(route => route.path === '/ultimo') < registered.findIndex(route => route.path === '/:idTicket'))
})
