const ticketService = require('../services/ticket.service')
const { pool } = require('../config/db')

//Handler de errores
const ProblemDetailError = require('../utils/ProblemDetails');

// ─── crearTicket ─────────────────────────────────────────────────────────────
const crearTicket = async (req, res) => {
  const { tipologiaITIL, descripcion, carnetEstudiante } = req.body

  if (!tipologiaITIL || !descripcion){
    throw new ProblemDetailError({
      status: 400,
      title: 'Solicitud Inválida',
      detail: 'Los campos tipologiaITIL y descripcion son obligatorios.',
      type: 'campos-requeridos',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  try {
    let carnet = carnetEstudiante

    // Si es Estudiante, obtenemos su carnet automáticamente
    if (req.usuario.rol === 'Estudiante') {
      const est = await pool.query(
        `SELECT carne FROM estudiante WHERE idusuario = $1 LIMIT 1`,
        [req.usuario.idUsuario]
      )
      if (est.rows.length === 0) {
        throw new ProblemDetailError({
          status: 404,
          title: 'Estudiante no encontrado',
          detail: 'No se encontró un estudiante asociado al usuario.',
          type: 'estudiante-no-encontrado',
          code: 'STUDENT_NOT_FOUND'
        });
      }
      carnet = est.rows[0].carne
    } else if (!carnetEstudiante) {
      throw new ProblemDetailError({
        status: 400,
        title: 'Solicitud Inválida',
        detail: 'Se requiere el carnet del estudiante.',
        type: 'carnet-requerido',
        code: 'STUDENT_CARD_REQUIRED'
      });
    }

    const ticket = await ticketService.crearTicket({
      tipologiaITIL,
      descripcion,
      carnetEstudiante: carnet,
      idUsuario: req.usuario.idUsuario,
      rol: req.usuario.rol
    })
    res.status(201).json({ message: 'Ticket creado exitosamente', ticket })
  } catch (err) {
    if (err.message === 'ESTUDIANTE_NO_ENCONTRADO'){
      throw new ProblemDetailError({
        status: 404,
        title: 'Estudiante no encontrado',
        detail: 'No se encontró un estudiante con el carnet proporcionado.',
        type: 'estudiante-no-encontrado',
        code: 'STUDENT_NOT_FOUND'
      });
    }
    console.error('Error creando ticket:', err)
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

// ─── obtenerMisTickets ────────────────────────────────────────────────────────
const obtenerMisTickets = async (req, res) => {
  try {
    const tickets = await ticketService.obtenerTicketsEstudiante(req.usuario.idUsuario)
    res.json(tickets)
  } catch (err) {
    console.error('Error obteniendo tickets:', err)
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

// ─── obtenerUltimoTicket ──────────────────────────────────────────────────────
const obtenerUltimoTicket = async (req, res) => {
  try {
    const ticket = await ticketService.obtenerUltimoTicket(req.usuario.idUsuario)
    res.json(ticket) // null si no tiene tickets
  } catch (err) {
    console.error('Error obteniendo último ticket:', err);
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

// ─── obtenerDetalle ───────────────────────────────────────────────────────────
const obtenerDetalle = async (req, res) => {
  const { idTicket } = req.params
  try {
    const idTicketInt = Number(idTicket);
    if (!Number.isInteger(idTicketInt) || Number.isNaN(idTicketInt)) {
      throw new ProblemDetailError({
        status: 400,
        title: 'ID de ticket inválido',
        detail: 'El ID del ticket proporcionado no es válido.',
        type: 'id-ticket-invalido',
        code: 'INVALID_TICKET_ID'
      });
    }
    const ticket = await ticketService.obtenerDetalleTicket(idTicketInt);
    res.status(200).json(ticket);
  } catch (err) {
    if (err instanceof ProblemDetailError) throw err;
    if (err.message === 'TICKET_NO_ENCONTRADO') {
      throw new ProblemDetailError({
        status: 404,
        title: 'Ticket no encontrado',
        detail: 'No se encontró un ticket con el ID proporcionado.',
        type: 'ticket-no-encontrado',
        code: 'TICKET_NOT_FOUND'
      });
    }
    if (err.message === 'ID_TICKET_INVALIDO') {
      throw new ProblemDetailError({
        status: 400,
        title: 'ID de ticket inválido',
        detail: 'El ID del ticket proporcionado no es válido.',
        type: 'id-ticket-invalido',
        code: 'INVALID_TICKET_ID'
      });
    }
    console.error('Error:', err);
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

// ─── cambiarEstado ────────────────────────────────────────────────────────────
const cambiarEstado = async (req, res) => {
  const { idTicket } = req.params
  const { nuevoEstado, comentario } = req.body

  if (!nuevoEstado) {
    throw new ProblemDetailError({
      status: 400,
      title: 'Estado requerido',
      detail: 'El estado del ticket es requerido.',
      type: 'estado-requerido',
      code: 'STATE_REQUIRED'
    });
  }

  try {
    const idTicketInt = Number(idTicket)
    if (!Number.isInteger(idTicketInt) || Number.isNaN(idTicketInt)) {
      throw new ProblemDetailError({
        status: 400,
        title: 'ID de ticket inválido',
        detail: 'El ID del ticket proporcionado no es válido.',
        type: 'id-ticket-invalido',
        code: 'INVALID_TICKET_ID'
      });
    }

    const ticket = await pool.query(
      `SELECT idestudiante FROM tickets WHERE idticket = $1`,
      [idTicketInt]
    )
    if (ticket.rows.length === 0) {
      throw new ProblemDetailError({
        status: 404,
        title: 'Ticket no encontrado',
        detail: 'No se encontró un ticket con el ID proporcionado.',
        type: 'ticket-no-encontrado',
        code: 'TICKET_NOT_FOUND'
      });
    }

    const resultado = await ticketService.cambiarEstadoTicket(
      idTicketInt,
      nuevoEstado,
      comentario || '',
      ticket.rows[0].idestudiante
    )
    res.json(resultado)
  } catch (err) {
    if (err.message === 'ESTADO_INVALIDO')
      throw new ProblemDetailError({
        status: 400,
        title: 'Estado inválido',
        detail: 'l estado proporcionado no es válido.',
        type: 'estado-invalido',
        code: 'INVALID_STATE'
      });
    console.error('Error:', err);
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

const obtenerHistorialAgente = async (req, res) => {
  try {
    const agente = await pool.query(
      `SELECT idagente FROM agentes WHERE idusuario = $1`,
      [req.usuario.idUsuario]
    );
    if (agente.rows.length === 0) {
      throw new ProblemDetailError({
        status: 404,
        title: 'Agente no encontrado',
        detail: 'No se encontró un agente con el ID de usuario proporcionado.',
        type: 'agente-no-encontrado',
        code: 'AGENT_NOT_FOUND'
      });
    }

    const historial = await ticketService.obtenerHistorialTicketsAgente(agente.rows[0].idagente);
    res.json(historial);
  } catch (err) {
    console.error('Error:', err);
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  };
};

// ─── escalar ────────────────────────────────────────────────────────────────
const escalar = async (req, res) => {
  const { idTicket } = req.params

  try {
    const resultado = await ticketService.escalarTicket(idTicket)
    res.json(resultado)
  } catch (err) {
    if (err.message === 'COORDINADOR_NO_ENCONTRADO')
      throw new ProblemDetailError({
        status: 404,
        title: 'Coordinador no encontrado',
        detail: 'No se encontró un coordinador activo.',
        type: 'coordinador-no-encontrado',
        code: 'COORDINATOR_NOT_FOUND'
      });
    console.error('Error escalando ticket:', err);
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

// ─── aceptarResolucion ───────────────────────────────────────────────────────
const aceptarResolucion = async (req, res) => {
  const { idTicket } = req.params;
  try {
    const resultado = await ticketService.aceptarResolucion(idTicket, req.usuario.idUsuario);
    res.json(resultado);
  } catch (err) {
    if (err.message === 'TICKET_NO_ENCONTRADO')
      throw new ProblemDetailError({
        status: 404,
        title: 'Ticket no encontrado',
        detail: 'No se encontró el ticket o no te pertenece.',
        type: 'ticket-no-encontrado',
        code: 'TICKET_NOT_FOUND'
      });
    if (err.message === 'TICKET_NO_RESUELTO')
      throw new ProblemDetailError({
        status: 400,
        title: 'Ticket no resuelto',
        detail: 'El ticket no está en estado Resuelto.',
        type: 'ticket-no-resuelto',
        code: 'TICKET_NOT_RESOLVED'
      });
    console.error('Error al aceptar resolución:', err);
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

const obtenerTicketsAbiertos = async (req, res) => {
  try {
    const tickets = await ticketService.obtenerTicketsAbiertos();
    res.json(tickets);
  } catch (err) {
    console.error('Error:', err);
    throw new ProblemDetailError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ha ocurrido un error no controlado en el servidor.',
      type: 'error-interno',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

module.exports = { 
  crearTicket, 
  obtenerMisTickets, 
  obtenerUltimoTicket, 
  obtenerDetalle, 
  cambiarEstado, 
  obtenerHistorialAgente, 
  escalar, 
  aceptarResolucion, 
  obtenerTicketsAbiertos
};
