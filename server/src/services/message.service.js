const { pool } = require('../config/db')
const { puedeAccederTicket } = require('./ticket-access.service')
const { emitirTicket } = require('../realtime')

async function listar(idTicket, usuario) {
  const ticket = await puedeAccederTicket(idTicket, usuario)
  if (!ticket) throw new Error('TICKET_NO_ENCONTRADO')

  const result = await pool.query(
    `SELECT m.idmensaje, m.idticket, m.contenido, m.fechacreacion,
            u.idusuario, u.nombrecompleto, u.rol
     FROM mensajes_ticket m
     JOIN usuarios u ON u.idusuario = m.idusuario
     WHERE m.idticket = $1
     ORDER BY m.idmensaje ASC`,
    [idTicket]
  )
  return result.rows.map(mapearMensaje)
}

async function enviar(idTicket, contenido, usuario) {
  if (typeof contenido !== 'string' || contenido.trim().length === 0 || contenido.trim().length > 4000) {
    throw new Error('MENSAJE_INVALIDO')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const bloqueado = await client.query(
      'SELECT estado, version FROM tickets WHERE idticket = $1 FOR UPDATE',
      [idTicket]
    )
    if (bloqueado.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO')
    const ticket = await puedeAccederTicket(idTicket, usuario, client)
    if (!ticket) throw new Error('TICKET_NO_ENCONTRADO')
    if (bloqueado.rows[0].estado === 'Cerrado') throw new Error('TICKET_CERRADO')

    const result = await client.query(
      `INSERT INTO mensajes_ticket (idticket, idusuario, contenido)
       VALUES ($1, $2, $3)
       RETURNING idmensaje, idticket, contenido, fechacreacion`,
      [idTicket, usuario.idUsuario, contenido.trim()]
    )
    const userResult = await client.query(
      'SELECT nombrecompleto, rol FROM usuarios WHERE idusuario = $1',
      [usuario.idUsuario]
    )
    await client.query(
      `INSERT INTO eventos_ticket (idticket, tipo, idusuario, versionticket, datos)
       VALUES ($1, 'mensaje.creado', $2, $3, jsonb_build_object('idMensaje', $4))`,
      [idTicket, usuario.idUsuario, bloqueado.rows[0].version, result.rows[0].idmensaje]
    )
    await client.query('COMMIT')

    const mensaje = mapearMensaje({ ...result.rows[0], idusuario: usuario.idUsuario, ...userResult.rows[0] })
    emitirTicket(idTicket, 'ticket:message', mensaje)
    return mensaje
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

function mapearMensaje(row) {
  return {
    idMensaje: row.idmensaje,
    idTicket: row.idticket,
    contenido: row.contenido,
    fechaCreacion: row.fechacreacion,
    autor: {
      idUsuario: row.idusuario,
      nombreCompleto: row.nombrecompleto,
      rol: row.rol
    }
  }
}

module.exports = { listar, enviar }
