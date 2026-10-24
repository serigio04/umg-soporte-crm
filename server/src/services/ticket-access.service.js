const { pool } = require('../config/db')

async function puedeAccederTicket(idTicket, usuario, db = pool) {
  const result = await db.query(
    `SELECT t.idticket, t.estado, t.idagente, t.tipologiaitil, t.version
     FROM tickets t
     LEFT JOIN estudiante e ON e.idestudiante = t.idestudiante
     LEFT JOIN agentes a ON a.idagente = t.idagente
     WHERE t.idticket = $1
       AND (
         $3 = 'Coordinador'
         OR ($3 = 'Estudiante' AND e.idusuario = $2)
         OR ($3 = 'Agente' AND a.idusuario = $2)
       )`,
    [idTicket, usuario.idUsuario, usuario.rol]
  )
  return result.rows[0] || null
}

module.exports = { puedeAccederTicket }
