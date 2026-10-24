const test = require('node:test')
const assert = require('node:assert/strict')
const { pool } = require('../src/config/db')
const { agentePropioOCoordinador, soloRol } = require('../src/middlewares/auth.middleware')

function respuesta() {
  return {
    statusCode: 200,
    body: null,
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

test('soloRol rechaza roles no autorizados', () => {
  const res = respuesta()
  let continuo = false
  soloRol('Coordinador')({ usuario: { rol: 'Agente' } }, res, () => { continuo = true })
  assert.equal(continuo, false)
  assert.equal(res.statusCode, 403)
})

test('un agente no puede consultar el id de otro agente', async () => {
  const queryOriginal = pool.query
  pool.query = async () => ({ rows: [] })
  const res = respuesta()
  let continuo = false

  try {
    await agentePropioOCoordinador(
      { params: { idAgente: '22' }, usuario: { idUsuario: 7, rol: 'Agente' } },
      res,
      () => { continuo = true }
    )
  } finally {
    pool.query = queryOriginal
  }

  assert.equal(continuo, false)
  assert.equal(res.statusCode, 403)
})

test('un coordinador puede consultar cualquier agente sin lookup adicional', async () => {
  let continuo = false
  await agentePropioOCoordinador(
    { params: { idAgente: '22' }, usuario: { rol: 'Coordinador' } },
    respuesta(),
    () => { continuo = true }
  )
  assert.equal(continuo, true)
})
