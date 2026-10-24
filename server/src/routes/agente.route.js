const express = require('express');
const router = express.Router();
const agenteController = require('../controllers/agente.controller');
const { verificarToken, soloRol, agentePropioOCoordinador } = require('../middlewares/auth.middleware');

router.get('/perfil',                         verificarToken, soloRol('Agente', 'Coordinador'), agenteController.obtenerPerfil)
router.get('/:idAgente/ticket-prioridad',     verificarToken, soloRol('Agente', 'Coordinador'), agentePropioOCoordinador, agenteController.obtenerTicketPrioridad)
router.get('/:idAgente/tickets',              verificarToken, soloRol('Agente', 'Coordinador'), agentePropioOCoordinador, agenteController.obtenerTicketsAsignados)

module.exports = router;
