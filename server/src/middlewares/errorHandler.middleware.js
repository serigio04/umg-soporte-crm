const ProblemDetailsError = require('../utils/ProblemDetails');

const errorHandler = (err, req, res, next) => {
  let problem;

  if (err instanceof ProblemDetailsError) {
    problem = err;
  } else if (err.message === 'Tipología inválida') {
    problem = new ProblemDetailsError({
      status: 400,
      title: 'Solicitud Inválida',
      detail: 'La tipología ITIL proporcionada no es válida. Valores permitidos: Incidente, Solicitud, Cambio.',
      type: 'tipologia-invalida',
      code: 'INVALID_TIPOLOGY'
    });
  } else if (err.message === 'ESTUDIANTE_NO_ENCONTRADO') {
    problem = new ProblemDetailsError({
      status: 404,
      title: 'Recurso No Encontrado',
      detail: 'No se encontró ningún estudiante asociado al carnet o usuario especificado.',
      type: 'estudiante-no-encontrado',
      code: 'STUDENT_NOT_FOUND'
    });
  } else if (err.message === 'TICKET_NO_ENCONTRADO') {
    problem = new ProblemDetailsError({
      status: 404,
      title: 'Ticket No Encontrado',
      detail: 'El ticket solicitado no existe en el sistema o no se tienen permisos para acceder a él.',
      type: 'ticket-no-encontrado',
      code: 'TICKET_NOT_FOUND'
    });
  } else {
    // Captura de errores no controlados o de base de datos
    console.error('[Unhandled Error]:', err);
    problem = new ProblemDetailsError({
      status: 500,
      title: 'Error Interno del Servidor',
      detail: 'Ocurrió un error inesperado al procesar la solicitud en la base de datos Neon PostgreSQL.',
      type: 'internal-server-error',
      code: 'DATABASE_OR_SYSTEM_ERROR'
    });
  }

  res.setHeader('Content-Type', 'application/problem+json');
  return res.status(problem.status).json(problem.toObject(req));
};

module.exports = errorHandler;