const express = require('express');
const router = express.Router();
const flujoCorporativoController = require('../controllers/flujoCorporativoController');

// Obtener Flujo Corporativo por ID_PERIODO
router.get('/flujo-corporativo/:idPeriodo', flujoCorporativoController.getByPeriodo);

// Crear o actualizar Flujo Corporativo para un período
router.post('/flujo-corporativo', flujoCorporativoController.saveForPeriodo);

module.exports = router;
