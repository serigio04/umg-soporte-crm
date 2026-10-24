const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const messageController = require('../controllers/message.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

// Rutas estáticas primero
router.get('/', verificarToken, soloRol('Estudiante'), ticketController.obtenerMisTickets);
router.post('/', verificarToken, soloRol('Estudiante', 'Agente', 'Coordinador'), ticketController.crearTicket);
router.get('/ultimo', verificarToken, soloRol('Estudiante'), ticketController.obtenerUltimoTicket);
router.get('/historial/agente', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.obtenerHistorialAgente);
router.get('/abiertos', verificarToken, soloRol('Coordinador'), ticketController.obtenerTicketsAbiertos);

// Rutas dinámicas después
router.get('/:idTicket', verificarToken, ticketController.obtenerDetalle);
router.get('/:idTicket/mensajes', verificarToken, messageController.listar);
router.post('/:idTicket/mensajes', verificarToken, messageController.enviar);
router.put('/:idTicket/prioridad', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.actualizarPrioridad);
router.get('/:idTicket/candidatos', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.obtenerCandidatos);
router.put('/:idTicket/asignacion', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.reasignar);
router.put('/:idTicket/estado', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.cambiarEstado);
router.put('/:idTicket/aceptar', verificarToken, soloRol('Estudiante'), ticketController.aceptarResolucion);
router.put('/:idTicket/escalar', verificarToken, soloRol('Agente'), ticketController.escalar);

module.exports = router;
