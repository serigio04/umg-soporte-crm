const express = require('express')
const router = express.Router()
const metricsController = require('../controllers/metrics.controller')
const { verificarToken, soloRol, agentePropioOCoordinador } = require('../middlewares/auth.middleware')

router.get('/dashboard', verificarToken, soloRol('Coordinador'), metricsController.obtenerDashboardCoordinador)
router.get('/tickets', verificarToken, soloRol('Coordinador'), metricsController.obtenerTickets)
router.get('/agente/:idAgente', verificarToken, soloRol('Agente', 'Coordinador'), agentePropioOCoordinador, metricsController.obtenerMetricasAgente)
router.get('/reporte-csv', verificarToken, soloRol('Coordinador'), metricsController.descargarReporteCsv)
router.get('/reporte-excel', verificarToken, soloRol('Coordinador'), metricsController.descargarReporteExcel)
router.get('/reporte-calificaciones-excel', verificarToken, soloRol('Coordinador'), metricsController.descargarReporteCalificacionesExcel)

module.exports = router
