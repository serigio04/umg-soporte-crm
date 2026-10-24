const { pool } = require('../config/db')

const crearEncuesta = async (idTicket, idEstudiante, db = pool) => {
  const existente = await db.query(
    `SELECT idencuesta FROM encuestas WHERE idticket = $1 LIMIT 1`,
    [idTicket]
  )
  if (existente.rows.length > 0) return existente.rows[0].idencuesta

  const result = await db.query(
    `INSERT INTO encuestas (idticket, idestudiante, fechacreacion)
     VALUES ($1, $2, NOW())
     RETURNING idencuesta`,
    [idTicket, idEstudiante]
  )
  return result.rows[0].idencuesta
}

const enviarEncuesta = async (idEncuesta, calificacion, comentario, idUsuario) => {
  const valor = Number(calificacion)
  if (!Number.isInteger(valor) || valor < 1 || valor > 5) throw new Error('CALIFICACION_INVALIDA')
  const encuestaId = Number(idEncuesta)
  if (!Number.isInteger(encuestaId)) throw new Error('ENCUESTA_NO_ENCONTRADA')
  
  const result = await pool.query(
    `UPDATE encuestas e
     SET calificacion = $1, comentario = $2, fecharespuesta = NOW()
     FROM estudiante est
     WHERE e.idencuesta = $3
       AND e.idestudiante = est.idestudiante
       AND est.idusuario = $4
       AND e.fecharespuesta IS NULL`,
    [valor, comentario, encuestaId, idUsuario]
  )
  if (result.rowCount === 0) throw new Error('ENCUESTA_NO_ENCONTRADA')
}

const obtenerEncuestaPorTicket = async (idTicket, idUsuario) => {
  const ticketId = Number(idTicket)
  if (!Number.isInteger(ticketId)) throw new Error('ENCUESTA_NO_ENCONTRADA')
  const result = await pool.query(
    `SELECT e.idencuesta
     FROM encuestas e
     JOIN estudiante est ON e.idestudiante = est.idestudiante
     WHERE e.idticket = $1
       AND est.idusuario = $2
       AND e.fecharespuesta IS NULL
     LIMIT 1`,
    [ticketId, idUsuario]
  )
  if (result.rows.length === 0) throw new Error('ENCUESTA_NO_ENCONTRADA')
  return result.rows[0]
}

module.exports = { crearEncuesta, enviarEncuesta, obtenerEncuestaPorTicket }
