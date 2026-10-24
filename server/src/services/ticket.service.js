const { pool } = require('../config/db');
const surveyService = require('./survey.service');
const { emitirTicket, refrescarAccesosTicket } = require('../realtime');


const validarEntero = (valor, nombre) => {
  const entero = Number(valor)
  if (!Number.isInteger(entero) || entero <= 0) {
    throw new Error(`${nombre}_INVALIDO`)
  }
  return entero
}
// ─── crearTicket ────────────────────────────────────────────────────────────
const crearTicket = async ({ tipologiaITIL, descripcion, carnetEstudiante, idUsuario, rol }) => {
  const tipologiasValidas = ['Incidente', 'Solicitud', 'Cambio']
  if (!tipologiasValidas.includes(tipologiaITIL)) throw new Error('Tipología inválida')

  const prioridad = tipologiaITIL === 'Incidente' ? 'Alta'
    : tipologiaITIL === 'Solicitud' ? 'Media' : 'Baja'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Obtener el idEstudiante real según el rol
    let idEstudiante
    if (rol === 'Estudiante') {
      const est = await client.query(
        `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
        [idUsuario]
      )
      if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
      idEstudiante = est.rows[0].idestudiante
    } else {
      // Agente crea el ticket buscando al estudiante por carnet
      const est = await client.query(
        `SELECT idestudiante FROM estudiante WHERE carne = $1 LIMIT 1`,
        [carnetEstudiante]
      )
      if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
      idEstudiante = est.rows[0].idestudiante
    }

    let idAgente = null
    if (rol === 'Agente') {
      const agente = await client.query(
        `SELECT a.idagente FROM agentes a
         JOIN usuarios u ON u.idusuario = a.idusuario
         WHERE a.idusuario = $1 AND u.rol = 'Agente' LIMIT 1`,
        [idUsuario]
      )
      if (agente.rows.length === 0) throw new Error('AGENTE_NO_ENCONTRADO')
      idAgente = agente.rows[0].idagente
    } else {
      await client.query(
        `INSERT INTO asignacion_cursor (especialidad) VALUES ($1)
         ON CONFLICT (especialidad) DO NOTHING`,
        [tipologiaITIL]
      )
      const cursor = await client.query(
        `SELECT ultimoidagente FROM asignacion_cursor
         WHERE especialidad = $1 FOR UPDATE`,
        [tipologiaITIL]
      )
      const agente = await client.query(
        `SELECT a.idagente
         FROM agentes a
         JOIN usuarios u ON u.idusuario = a.idusuario
         WHERE a.especialidad = $1 AND u.rol = 'Agente'
         ORDER BY (a.idagente > COALESCE($2, 0)) DESC, a.idagente
         LIMIT 1`,
        [tipologiaITIL, cursor.rows[0].ultimoidagente]
      )
      if (agente.rows.length > 0) {
        idAgente = agente.rows[0].idagente
        await client.query(
          `UPDATE asignacion_cursor
           SET ultimoidagente = $2, fechaactualizacion = NOW()
           WHERE especialidad = $1`,
          [tipologiaITIL, idAgente]
        )
      }
    }

    // Insertar el ticket
    const ticketResult = await client.query(
      `INSERT INTO tickets
         (fechacreacion, fechalimitesla, prioridadsla, tipologiaitil, estado,
          idestudiante, descripcion, idagente, idusuariocreador)
       VALUES (NOW(), NOW() + CASE $1
                 WHEN 'Alta' THEN INTERVAL '4 hours'
                 WHEN 'Media' THEN INTERVAL '24 hours'
                 ELSE INTERVAL '48 hours' END,
               $1, $2, 'Abierto', $3, $4, $5, $6)
       RETURNING idticket, fechalimitesla, version`,
      [prioridad, tipologiaITIL, idEstudiante, descripcion, idAgente, idUsuario]
    )
    const idTicket = ticketResult.rows[0].idticket

    // Insertar el estado inicial
    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
       VALUES ('Abierto', NOW(), 'Ticket creado', $1)`,
      [idTicket]
    )

    await registrarEvento(client, idTicket, 'ticket.creado', idUsuario, ticketResult.rows[0].version, {
      idAgente,
      prioridadSLA: prioridad
    })

    await client.query('COMMIT')
    emitirTicket(idTicket, 'ticket:updated', {
      idTicket,
      tipo: 'ticket.creado',
      version: ticketResult.rows[0].version
    })
    console.log(`Ticket ${idTicket} creado. Agente: ${idAgente ?? 'ninguno'}`)
    return {
      idTicket,
      tipologiaITIL,
      descripcion,
      prioridadSLA: prioridad,
      fechaLimiteSLA: ticketResult.rows[0].fechalimitesla,
      estado: 'Abierto',
      idAgente,
      version: ticketResult.rows[0].version
    }

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── obtenerTicketsEstudiante ────────────────────────────────────────────────
const obtenerTicketsEstudiante = async (idUsuario) => {
  // Traducir idUsuario → idEstudiante
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
    [idUsuario]
  )
  if (est.rows.length === 0) return []

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion,
       (SELECT e.nombreestado FROM estadosticket e
        WHERE e.idticket = t.idticket
        ORDER BY e.fechacambio DESC LIMIT 1) AS ultimoestado
     FROM tickets t
     WHERE t.idestudiante = $1
     ORDER BY t.fechacreacion DESC`,
    [est.rows[0].idestudiante]
  )

  console.log('Tickets encontrados:', result.rows.length)

  return result.rows.map(t => ({
    idTicket:      t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA:  t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado:        t.estado,
    descripcion:   t.descripcion,
    ultimoEstado:  t.ultimoestado
  }))
}

// ─── obtenerUltimoTicket ─────────────────────────────────────────────────────
const obtenerUltimoTicket = async (idUsuario) => {
  // Traducir idUsuario → idEstudiante
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
    [idUsuario]
  )
  if (est.rows.length === 0) return null

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idestudiante = $1
     ORDER BY fechacreacion DESC LIMIT 1`,
    [est.rows[0].idestudiante]
  )

  if (result.rows.length === 0) return null
  const t = result.rows[0]
  return {
    idTicket:      t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA:  t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado:        t.estado,
    descripcion:   t.descripcion
  }
}

// ─── obtenerDetalleTicket ────────────────────────────────────────────────────
const obtenerDetalleTicket = async (idTicket, idUsuario, rol) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET')
  const ticketRes = await pool.query(
    `SELECT t.idticket, t.fechacreacion, t.fechalimitesla, t.prioridadsla, t.tipologiaitil,
            t.estado, t.descripcion, t.idestudiante, t.idagente, t.idusuariocreador, t.version,
            e.carne, u.nombrecompleto as nombreestudiante,
            ua.nombrecompleto as nombreagente
     FROM tickets t
     LEFT JOIN estudiante e ON t.idestudiante = e.idestudiante
     LEFT JOIN usuarios u ON e.idusuario = u.idusuario
     LEFT JOIN agentes aa ON aa.idagente = t.idagente
     LEFT JOIN usuarios ua ON ua.idusuario = aa.idusuario
     WHERE t.idticket = $1
       AND (
         $3 = 'Coordinador'
         OR ($3 = 'Estudiante' AND e.idusuario = $2)
         OR ($3 = 'Agente' AND EXISTS (
           SELECT 1 FROM agentes a
           WHERE a.idagente = t.idagente AND a.idusuario = $2
         ))
       )`,
    [idTicketInt, idUsuario, rol]
  )

  if (ticketRes.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO')
  const t = ticketRes.rows[0]

  const historial = await pool.query(
    `SELECT nombreestado, fechacambio, comentariotecnico
     FROM estadosticket
     WHERE idticket = $1
     ORDER BY fechacambio DESC`,
    [idTicketInt]
  )

  const fechaLimite = new Date(t.fechalimitesla)
  const ahora = new Date()
  const horasRestantes = Math.max(0, Math.round((fechaLimite - ahora) / (1000 * 60 * 60) * 10) / 10)
  const vencido = ahora > fechaLimite

  return {
    idTicket: t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA: t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado: t.estado,
    descripcion: t.descripcion,
    idEstudiante: t.idestudiante,
    carneEstudiante: t.carne,
    nombreEstudiante: t.nombreestudiante,
    idAgente: t.idagente,
    nombreAgente: t.nombreagente,
    idUsuarioCreador: t.idusuariocreador,
    fechaLimiteSLA: t.fechalimitesla,
    version: t.version,
    horasRestantes,
    vencido,
    historial: historial.rows.map(h => ({
      estado: h.nombreestado,
      fecha: h.fechacambio,
      comentario: h.comentariotecnico
    }))
  }
}

// ─── cambiarEstadoTicket ─────────────────────────────────────────────────────
const cambiarEstadoTicket = async (idTicket, nuevoEstado, comentario, idUsuario, rol) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET');
  const estadosValidos = ['Abierto', 'EnProceso', 'Pendiente', 'Resuelto', 'Cerrado'];
  if (!estadosValidos.includes(nuevoEstado)) throw new Error('ESTADO_INVALIDO');

  const transicionesValidas = {
    Abierto: ['EnProceso'],
    EnProceso: ['Pendiente'],
    Pendiente: ['Resuelto'],
    Resuelto: [],
    Cerrado: []
  };

  const client = await pool.connect()
  try {
    console.log(`Cambiando estado del ticket ${idTicketInt}`);

    await client.query('BEGIN');

    const ticketRes = await client.query(
      `SELECT t.estado, t.idestudiante
       FROM tickets t
       WHERE t.idticket = $1
         AND (
           $3 = 'Coordinador'
           OR ($3 = 'Agente' AND EXISTS (
             SELECT 1 FROM agentes a
             WHERE a.idagente = t.idagente AND a.idusuario = $2
           ))
         )
       FOR UPDATE`,
      [idTicketInt, idUsuario, rol]
    );

    if (ticketRes.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO');

    const { estado: estadoActual, idestudiante: idEstudiante } = ticketRes.rows[0];
    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      throw new Error('TRANSICION_ESTADO_INVALIDA');
    }

    const actualizado = await client.query(
      `UPDATE tickets SET estado = $1, version = version + 1 WHERE idticket = $2
       RETURNING version`,
      [nuevoEstado, idTicketInt]
    );

    console.log(`Estado del ticket ${idTicketInt} actualizado a ${nuevoEstado}`);

    if (nuevoEstado === 'Resuelto') {
      await surveyService.crearEncuesta(idTicketInt, idEstudiante, client);
    };

    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
       VALUES ($1, NOW(), $2, $3)`,
      [nuevoEstado, comentario, idTicketInt]
    );

    await registrarEvento(client, idTicketInt, 'estado.cambiado', idUsuario, actualizado.rows[0].version, {
      estadoAnterior: estadoActual,
      nuevoEstado,
      comentario
    });

    await client.query('COMMIT');
    await refrescarAccesosTicket(idTicketInt);
    emitirTicket(idTicketInt, 'ticket:updated', {
      idTicket: idTicketInt,
      tipo: 'estado.cambiado',
      nuevoEstado,
      version: actualizado.rows[0].version
    });
    
    console.log(`Historial del ticket ${idTicketInt} actualizado`);
    
    return { idTicket: idTicketInt, nuevoEstado, version: actualizado.rows[0].version };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error al cambiar el estado del ticket ${idTicketInt}:`, err, 'Realizando ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const obtenerHistorialTicketsAgente = async (idAgente) => {
  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idagente = $1 AND estado != 'Abierto'
     ORDER BY fechacreacion DESC`,
    [idAgente]
  );
  
  return result.rows.map(t => ({
    idTicket: t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA: t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado: t.estado,
    descripcion: t.descripcion
  }));
};

const obtenerTicketsAbiertos = async () => {
  const result = await pool.query(
    `SELECT t.idticket, t.fechacreacion, t.prioridadsla, t.tipologiaitil, t.estado, t.descripcion, e.carne, u.nombrecompleto
     FROM tickets t
     JOIN estudiante e ON t.idestudiante = e.idestudiante
     JOIN usuarios u ON e.idusuario = u.idusuario
     WHERE t.estado = 'Abierto'
     ORDER BY t.fechacreacion DESC`
  );

  console.log('Tickets abiertos encontrados:', result.rows.length);

  return result.rows.map(ticket => ({
    idTicket: ticket.idticket,
    fechaCreacion: ticket.fechacreacion,
    prioridadSLA: ticket.prioridadsla,
    tipologiaITIL: ticket.tipologiaitil,
    estado: ticket.estado,
    descripcion: ticket.descripcion,
    carneEstudiante: ticket.carne,
    nombreEstudiante: ticket.nombrecompleto
  }));
};

// ─── escalarTicket ─────────────────────────────────────────────────────────────
const escalarTicket = async (idTicket, idUsuario) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ticketRes = await client.query(
      `SELECT t.estado
       FROM tickets t
       JOIN agentes a ON a.idagente = t.idagente
       WHERE t.idticket = $1 AND a.idusuario = $2
       FOR UPDATE OF t`,
      [idTicketInt, idUsuario]
    );

    if (ticketRes.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO');
    if (['Resuelto', 'Cerrado'].includes(ticketRes.rows[0].estado)) {
      throw new Error('TRANSICION_ESTADO_INVALIDA');
    }

    // Buscar ID del coordinador
    const coordRes = await client.query(
      `SELECT a.idagente 
       FROM agentes a 
       JOIN usuarios u ON a.idusuario = u.idusuario 
       WHERE u.rol = 'Coordinador' 
       LIMIT 1`
    );

    if (coordRes.rows.length === 0) throw new Error('COORDINADOR_NO_ENCONTRADO');
    const idCoordinador = coordRes.rows[0].idagente;

    // Actualizar ticket: asignar a coordinador y pasar a Abierto si no lo estaba
    const actualizado = await client.query(
      `UPDATE tickets
       SET idagente = $1, estado = 'Abierto', version = version + 1
       WHERE idticket = $2 RETURNING version`,
      [idCoordinador, idTicketInt]
    );

    // Registrar historial
    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
       VALUES ('Abierto', NOW(), 'Ticket escalado al Coordinador', $1)`,
      [idTicketInt]
    );

    await registrarEvento(client, idTicketInt, 'ticket.escalado', idUsuario, actualizado.rows[0].version, {
      idAgente: idCoordinador
    });

    await client.query('COMMIT');
    await refrescarAccesosTicket(idTicketInt);
    emitirTicket(idTicketInt, 'ticket:updated', {
      idTicket: idTicketInt,
      tipo: 'ticket.escalado',
      idAgente: idCoordinador,
      version: actualizado.rows[0].version
    });
    return { idTicket: idTicketInt, idCoordinador, version: actualizado.rows[0].version };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── aceptarResolucion ───────────────────────────────────────────────────────
const aceptarResolucion = async (idTicket, idUsuario) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ticketRes = await client.query(
      `SELECT t.estado
       FROM tickets t
       JOIN estudiante e ON t.idestudiante = e.idestudiante
       WHERE t.idticket = $1 AND e.idusuario = $2
       FOR UPDATE OF t`,
      [idTicketInt, idUsuario]
    );

    if (ticketRes.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO');
    if (ticketRes.rows[0].estado !== 'Resuelto') throw new Error('TICKET_NO_RESUELTO');

    const actualizado = await client.query(
      `UPDATE tickets SET estado = 'Cerrado', version = version + 1
       WHERE idticket = $1 RETURNING version`,
      [idTicketInt]
    );
    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
       VALUES ('Cerrado', NOW(), 'Resolución aceptada por el estudiante', $1)`,
      [idTicketInt]
    );
    await registrarEvento(client, idTicketInt, 'estado.cambiado', idUsuario, actualizado.rows[0].version, {
      estadoAnterior: 'Resuelto',
      nuevoEstado: 'Cerrado'
    });
    await client.query('COMMIT');
    emitirTicket(idTicketInt, 'ticket:updated', {
      idTicket: idTicketInt,
      tipo: 'estado.cambiado',
      nuevoEstado: 'Cerrado',
      version: actualizado.rows[0].version
    });
    return { idTicket: idTicketInt, estado: 'Cerrado', version: actualizado.rows[0].version };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const actualizarPrioridad = async (idTicket, prioridad, idUsuario, rol) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET')
  if (!['Alta', 'Media', 'Baja'].includes(prioridad)) throw new Error('PRIORIDAD_INVALIDA')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ticket = await client.query(
      `SELECT t.estado, t.prioridadsla
       FROM tickets t
       WHERE t.idticket = $1
         AND ($3 = 'Coordinador' OR ($3 = 'Agente' AND EXISTS (
           SELECT 1 FROM agentes a WHERE a.idagente = t.idagente AND a.idusuario = $2
         )))
       FOR UPDATE`,
      [idTicketInt, idUsuario, rol]
    )
    if (ticket.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO')
    if (['Resuelto', 'Cerrado'].includes(ticket.rows[0].estado)) throw new Error('TICKET_FINALIZADO')

    const actualizado = await client.query(
      `UPDATE tickets
       SET prioridadsla = $1,
           fechalimitesla = NOW() + CASE $1
             WHEN 'Alta' THEN INTERVAL '4 hours'
             WHEN 'Media' THEN INTERVAL '24 hours'
             ELSE INTERVAL '48 hours' END,
           version = version + 1
       WHERE idticket = $2
       RETURNING prioridadsla, fechalimitesla, version`,
      [prioridad, idTicketInt]
    )
    await registrarEvento(client, idTicketInt, 'prioridad.cambiada', idUsuario, actualizado.rows[0].version, {
      prioridadAnterior: ticket.rows[0].prioridadsla,
      prioridadSLA: prioridad,
      fechaLimiteSLA: actualizado.rows[0].fechalimitesla
    })
    await client.query('COMMIT')

    const resultado = {
      idTicket: idTicketInt,
      prioridadSLA: actualizado.rows[0].prioridadsla,
      fechaLimiteSLA: actualizado.rows[0].fechalimitesla,
      version: actualizado.rows[0].version
    }
    emitirTicket(idTicketInt, 'ticket:updated', { ...resultado, tipo: 'prioridad.cambiada' })
    return resultado
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

const obtenerCandidatos = async (idTicket, idUsuario, rol) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET')
  const ticket = await pool.query(
    `SELECT t.tipologiaitil, t.estado
     FROM tickets t
     WHERE t.idticket = $1
       AND ($3 = 'Coordinador' OR ($3 = 'Agente' AND EXISTS (
         SELECT 1 FROM agentes actual
         WHERE actual.idagente = t.idagente AND actual.idusuario = $2
       )))`,
    [idTicketInt, idUsuario, rol]
  )
  if (ticket.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO')
  if (['Resuelto', 'Cerrado'].includes(ticket.rows[0].estado)) throw new Error('TICKET_FINALIZADO')

  const agentes = await pool.query(
    `SELECT a.idagente, a.especialidad, a.sedeasignada,
            u.nombrecompleto, u.correoinstitucional
     FROM agentes a
     JOIN usuarios u ON u.idusuario = a.idusuario
       WHERE a.especialidad = $1 AND u.rol = 'Agente'
     ORDER BY u.nombrecompleto, a.idagente`,
    [ticket.rows[0].tipologiaitil]
  )
  return agentes.rows.map(row => ({
    idAgente: row.idagente,
    nombreCompleto: row.nombrecompleto,
    correoInstitucional: row.correoinstitucional,
    especialidad: row.especialidad,
    sedeAsignada: row.sedeasignada
  }))
}

const reasignar = async (idTicket, idAgente, idUsuario, rol) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET')
  const idAgenteInt = validarEntero(idAgente, 'ID_AGENTE')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ticket = await client.query(
      `SELECT t.estado, t.tipologiaitil, t.idagente
       FROM tickets t
       WHERE t.idticket = $1
         AND ($3 = 'Coordinador' OR ($3 = 'Agente' AND EXISTS (
           SELECT 1 FROM agentes actual
           WHERE actual.idagente = t.idagente AND actual.idusuario = $2
         )))
       FOR UPDATE`,
      [idTicketInt, idUsuario, rol]
    )
    if (ticket.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO')
    if (['Resuelto', 'Cerrado'].includes(ticket.rows[0].estado)) throw new Error('TICKET_FINALIZADO')

    const candidato = await client.query(
      `SELECT a.idagente
       FROM agentes a
       JOIN usuarios u ON u.idusuario = a.idusuario
       WHERE a.idagente = $1 AND a.especialidad = $2 AND u.rol = 'Agente'`,
      [idAgenteInt, ticket.rows[0].tipologiaitil]
    )
    if (candidato.rows.length === 0) throw new Error('AGENTE_INCOMPATIBLE')

    const actualizado = await client.query(
      `UPDATE tickets SET idagente = $1, version = version + 1
       WHERE idticket = $2 RETURNING version`,
      [idAgenteInt, idTicketInt]
    )
    await registrarEvento(client, idTicketInt, 'asignacion.cambiada', idUsuario, actualizado.rows[0].version, {
      idAgenteAnterior: ticket.rows[0].idagente,
      idAgente: idAgenteInt
    })
    await client.query('COMMIT')
    await refrescarAccesosTicket(idTicketInt)

    const resultado = { idTicket: idTicketInt, idAgente: idAgenteInt, version: actualizado.rows[0].version }
    emitirTicket(idTicketInt, 'ticket:updated', { ...resultado, tipo: 'asignacion.cambiada' })
    return resultado
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

const registrarEvento = async (client, idTicket, tipo, idUsuario, version, datos) => {
  await client.query(
    `INSERT INTO eventos_ticket (idticket, tipo, idusuario, versionticket, datos)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [idTicket, tipo, idUsuario, version, JSON.stringify(datos)]
  )
}

module.exports = { 
  crearTicket, 
  obtenerTicketsEstudiante, 
  obtenerUltimoTicket, 
  obtenerDetalleTicket, 
  cambiarEstadoTicket, 
  obtenerHistorialTicketsAgente, 
  escalarTicket, 
  aceptarResolucion,
  obtenerTicketsAbiertos,
  actualizarPrioridad,
  obtenerCandidatos,
  reasignar
}
