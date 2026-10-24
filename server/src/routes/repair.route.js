const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repair.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

router.get('/repair-all', verificarToken, soloRol('Coordinador'), repairController.repairAll);

module.exports = router;
