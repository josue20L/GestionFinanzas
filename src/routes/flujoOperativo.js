const express = require('express');
const router = express.Router();
const flujoOperativoController = require('../controllers/flujoOperativoController');

// Obtener Flujo Operativo por ID_PERIODO
router.get('/flujo-operativo/:idPeriodo', flujoOperativoController.getByPeriodo);

// Crear o actualizar Flujo Operativo para un período
router.post('/flujo-operativo', flujoOperativoController.saveForPeriodo);

module.exports = router;
