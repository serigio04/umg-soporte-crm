const express = require('express')
const router = express.Router()
const surveyController = require('../controllers/survey.controller')
const { verificarToken, soloRol } = require('../middlewares/auth.middleware')

router.post('/:idEncuesta/responder', verificarToken, soloRol('Estudiante'), surveyController.enviarEncuesta)
router.get('/ticket/:idTicket', verificarToken, soloRol('Estudiante'), surveyController.obtenerEncuestaPorTicket)

module.exports = router
