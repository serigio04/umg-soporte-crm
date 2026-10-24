const { pool } = require('../config/db')

const obtenerMetricasCoordinador = async () => {
  // 1. Tiempo de resolución promedio (en horas)
  const tiempoResQuery = await pool.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (h_fin.fechacambio - t.fechacreacion))/3600) as tiempo_promedio_horas
    FROM tickets t
    JOIN LATERAL (
      SELECT e.fechacambio
      FROM estadosticket e
      WHERE e.idticket = t.idticket AND e.nombreestado IN ('Resuelto', 'Cerrado')
      ORDER BY e.fechacambio ASC, e.idestado ASC
      LIMIT 1
    ) h_fin ON TRUE
    WHERE t.estado IN ('Resuelto', 'Cerrado')
  `)

  // 1.5 Tiempo de resolución promedio por agente
  const tiempoResPorAgenteQuery = await pool.query(`
    SELECT u.nombrecompleto as agente, AVG(EXTRACT(EPOCH FROM (h_fin.fechacambio - t.fechacreacion))/3600) as tiempo_promedio_horas
    FROM tickets t
    JOIN agentes a ON t.idagente = a.idagente
    JOIN usuarios u ON a.idusuario = u.idusuario
    JOIN LATERAL (
      SELECT e.fechacambio
      FROM estadosticket e
      WHERE e.idticket = t.idticket AND e.nombreestado IN ('Resuelto', 'Cerrado')
      ORDER BY e.fechacambio ASC, e.idestado ASC
      LIMIT 1
    ) h_fin ON TRUE
    WHERE t.estado IN ('Resuelto', 'Cerrado')
    GROUP BY u.nombrecompleto
    ORDER BY tiempo_promedio_horas ASC
  `)

  // 2. Tickets abiertos por agente
  const ticketsPorAgenteQuery = await pool.query(`
    SELECT u.nombrecompleto as agente, COUNT(t.idticket) as cantidad
    FROM agentes a
    JOIN usuarios u ON a.idusuario = u.idusuario
    LEFT JOIN tickets t ON a.idagente = t.idagente AND t.estado NOT IN ('Resuelto', 'Cerrado', 'Cancelado')
    GROUP BY u.nombrecompleto
    ORDER BY cantidad DESC
  `)

  // 3. SLA Vencidos (Abiertos o Resueltos que superaron SLA)
  const slaVencidosQuery = await pool.query(`
    SELECT t.idticket, t.prioridadsla, t.fechacreacion, u.nombrecompleto as agente,
           (SELECT MIN(e.fechacambio) FROM estadosticket e WHERE e.idticket = t.idticket AND e.nombreestado IN ('Resuelto', 'Cerrado')) as fecharesolucion
    FROM tickets t
    LEFT JOIN agentes a ON t.idagente = a.idagente
    LEFT JOIN usuarios u ON a.idusuario = u.idusuario
    WHERE
      (t.estado NOT IN ('Resuelto', 'Cerrado') AND NOW() > t.fechalimitesla)
      OR
      (t.estado IN ('Resuelto', 'Cerrado') AND
        (SELECT MIN(e.fechacambio) FROM estadosticket e WHERE e.idticket = t.idticket AND e.nombreestado IN ('Resuelto', 'Cerrado')) > t.fechalimitesla)
    ORDER BY t.fechacreacion DESC
  `)

  // 4. Calificaciones
  const calificacionesAgentesQuery = await pool.query(`
    SELECT u.nombrecompleto as agente, 
           AVG(e.calificacion) as promedio_calificacion,
           (AVG(e.calificacion) / 5.0) * 100 as porcentaje_calificacion
    FROM encuestas e
    JOIN tickets t ON e.idticket = t.idticket
    JOIN agentes a ON t.idagente = a.idagente
    JOIN usuarios u ON a.idusuario = u.idusuario
    WHERE e.calificacion IS NOT NULL
    GROUP BY u.nombrecompleto
  `)

  const calificacionGeneralQuery = await pool.query(`
    SELECT AVG(calificacion) as promedio_calificacion, 
           (AVG(calificacion) / 5.0) * 100 as porcentaje_calificacion
    FROM encuestas
    WHERE calificacion IS NOT NULL
  `)

  return {
    tiempoPromedioResolucionHoras: tiempoResQuery.rows[0].tiempo_promedio_horas || 0,
    tiempoPromedioPorAgente: tiempoResPorAgenteQuery.rows,
    ticketsAbiertosPorAgente: ticketsPorAgenteQuery.rows,
    slaVencidos: slaVencidosQuery.rows,
    calificacionGeneral: calificacionGeneralQuery.rows[0] || { promedio_calificacion: 0, porcentaje_calificacion: 0 },
    calificacionesPorAgente: calificacionesAgentesQuery.rows
  }
}

const obtenerMetricasAgente = async (idAgente) => {
  const tiempoResQuery = await pool.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (h_fin.fechacambio - t.fechacreacion))/3600) as tiempo_promedio_horas
    FROM tickets t
    JOIN LATERAL (
      SELECT e.fechacambio
      FROM estadosticket e
      WHERE e.idticket = t.idticket AND e.nombreestado IN ('Resuelto', 'Cerrado')
      ORDER BY e.fechacambio ASC, e.idestado ASC
      LIMIT 1
    ) h_fin ON TRUE
    WHERE t.estado IN ('Resuelto', 'Cerrado')
      AND t.idagente = $1
  `, [idAgente])

  const ticketsAbiertosQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE idagente = $1 AND estado NOT IN ('Resuelto', 'Cerrado', 'Cancelado')
  `, [idAgente])

  const ticketsResueltosQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE idagente = $1 AND estado IN ('Resuelto', 'Cerrado')
  `, [idAgente])

  const slaVencidosQuery = await pool.query(`
    SELECT t.idticket, t.prioridadsla, t.fechacreacion, t.estado, t.tipologiaitil,
           (SELECT MIN(e.fechacambio) FROM estadosticket e WHERE e.idticket = t.idticket AND e.nombreestado IN ('Resuelto', 'Cerrado')) as fecharesolucion
    FROM tickets t
    WHERE t.idagente = $1 AND (
      (t.estado NOT IN ('Resuelto', 'Cerrado') AND NOW() > t.fechalimitesla)
      OR
      (t.estado IN ('Resuelto', 'Cerrado') AND
        (SELECT MIN(e.fechacambio) FROM estadosticket e WHERE e.idticket = t.idticket AND e.nombreestado IN ('Resuelto', 'Cerrado')) > t.fechalimitesla)
    )
    ORDER BY t.fechacreacion DESC
  `, [idAgente])

  return {
    tiempoPromedioResolucionHoras: tiempoResQuery.rows[0].tiempo_promedio_horas || 0,
    ticketsAbiertos: parseInt(ticketsAbiertosQuery.rows[0].cantidad),
    ticketsResueltos: parseInt(ticketsResueltosQuery.rows[0].cantidad),
    ticketsVencidos: slaVencidosQuery.rows.map(row => ({
      idTicket: row.idticket,
      prioridadSLA: row.prioridadsla,
      fechaCreacion: row.fechacreacion,
      fechaResolucion: row.fecharesolucion,
      estado: row.estado,
      tipologiaITIL: row.tipologiaitil
    }))
  }
}

const obtenerDatosReporteCsv = async () => {
  const columnaFechaLimite = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = ANY(current_schemas(FALSE))
        AND table_name = 'tickets'
        AND column_name = 'fechalimitesla'
    ) AS existe
  `)

  const fechaLimiteCalculada = `
    CASE t.prioridadsla
      WHEN 'Alta' THEN t.fechacreacion + INTERVAL '4 hours'
      WHEN 'Media' THEN t.fechacreacion + INTERVAL '24 hours'
      WHEN 'Baja' THEN t.fechacreacion + INTERVAL '48 hours'
    END
  `
  const fechaLimiteSla = columnaFechaLimite.rows[0].existe
    ? `COALESCE(t.fechalimitesla, ${fechaLimiteCalculada})`
    : fechaLimiteCalculada

  const query = await pool.query(`
    SELECT t.idticket, t.tipologiaitil, t.prioridadsla, t.estado, t.fechacreacion,
           resolucion.fecharesolucion, cierre.fechacierre,
           resolucion.comentariotecnico AS solucion,
           CASE
             WHEN ${fechaLimiteSla} IS NULL THEN 'Pendiente'
             WHEN COALESCE(resolucion.fecharesolucion, cierre.fechacierre) <= ${fechaLimiteSla} THEN 'Cumplió'
             WHEN COALESCE(resolucion.fecharesolucion, cierre.fechacierre) IS NOT NULL
               OR NOW() > ${fechaLimiteSla} THEN 'No cumplió'
             ELSE 'Pendiente'
           END AS estadosla,
           u_agente.nombrecompleto as agente, u_estudiante.nombrecompleto as estudiante
    FROM tickets t
    LEFT JOIN agentes a ON t.idagente = a.idagente
    LEFT JOIN usuarios u_agente ON a.idusuario = u_agente.idusuario
    LEFT JOIN estudiante e ON t.idestudiante = e.idestudiante
    LEFT JOIN usuarios u_estudiante ON e.idusuario = u_estudiante.idusuario
    LEFT JOIN LATERAL (
      SELECT h.fechacambio AS fecharesolucion, h.comentariotecnico
      FROM estadosticket h
      WHERE h.idticket = t.idticket AND h.nombreestado = 'Resuelto'
      ORDER BY h.fechacambio ASC, h.idestado ASC
      LIMIT 1
    ) resolucion ON TRUE
    LEFT JOIN LATERAL (
      SELECT h.fechacambio AS fechacierre
      FROM estadosticket h
      WHERE h.idticket = t.idticket AND h.nombreestado = 'Cerrado'
      ORDER BY h.fechacambio ASC, h.idestado ASC
      LIMIT 1
    ) cierre ON TRUE
    ORDER BY t.fechacreacion DESC
  `)
  return query.rows
}

const obtenerDatosCalificacionesExcel = async () => {
  const query = await pool.query(`
    SELECT u.nombrecompleto as agente, 
           ROUND(AVG(e.calificacion), 2) as promedio_calificacion,
           ROUND((AVG(e.calificacion) / 5.0) * 100, 2) as porcentaje_calificacion
    FROM encuestas e
    JOIN tickets t ON e.idticket = t.idticket
    JOIN agentes a ON t.idagente = a.idagente
    JOIN usuarios u ON a.idusuario = u.idusuario
    WHERE e.calificacion IS NOT NULL
    GROUP BY u.nombrecompleto
    ORDER BY promedio_calificacion DESC
  `)
  return query.rows
}

const obtenerMetricas = async (req, res) => {
  // Querys para obtener conteo de tickets según estado.
  const ticketsAbiertosQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE estado = 'Abierto'  
  `);

  const ticketsResueltosQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE estado = 'Resuelto'
  `);

  const ticketsCerradosQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE estado = 'Cerrado'
  `);

  const ticketsEnProcesoQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE estado = 'EnProceso'
  `);

  // Query para obtener tiempo promedio de resolución de tickets (en horas).
  const tiempoResQuery = await pool.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (h_fin.fechacambio - t.fechacreacion))/3600) as tiempo_promedio_horas
    FROM tickets t
    JOIN estadosticket h_fin ON t.idticket = h_fin.idticket
    WHERE h_fin.nombreestado IN ('Resuelto', 'Cerrado')
    AND t.estado IN ('Resuelto', 'Cerrado')
  `);

  // Query para obtener calificación general de tickets.
  const calificacionGeneralQuery = await pool.query(`
    SELECT AVG(calificacion) as promedio_calificacion, 
            (AVG(calificacion) / 5.0) * 100 as porcentaje_calificacion
    FROM encuestas
    WHERE calificacion IS NOT NULL
  `);

  return {
    tiempoPromedioResolucionHoras: tiempoResQuery.rows[0].tiempo_promedio_horas || 0,
    ticketsAbiertos: parseInt(ticketsAbiertosQuery.rows[0].cantidad),
    ticketsResueltos: parseInt(ticketsResueltosQuery.rows[0].cantidad),
    ticketsCerrados: parseInt(ticketsCerradosQuery.rows[0].cantidad),
    ticketsEnProceso: parseInt(ticketsEnProcesoQuery.rows[0].cantidad),
    calificacionGeneral: calificacionGeneralQuery.rows[0] || { promedio_calificacion: 0, porcentaje_calificacion: 0 }
  }
}

const obtenerMetricasTickets = async (req, res) => {
  const IncidentesQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE tipologiaitil = 'Incidente'
  `);

  const SolicitudQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE tipologiaitil = 'Solicitud'
  `);

  const cambioQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE tipologiaitil = 'Cambio'
  `);

  return {
    incidentes: parseInt(IncidentesQuery.rows[0].cantidad),
    solicitudes: parseInt(SolicitudQuery.rows[0].cantidad),
    cambios: parseInt(cambioQuery.rows[0].cantidad)
  }
}

module.exports = { obtenerMetricasCoordinador, obtenerMetricasAgente, obtenerDatosReporteCsv, obtenerDatosCalificacionesExcel, obtenerMetricas, obtenerMetricasTickets }
