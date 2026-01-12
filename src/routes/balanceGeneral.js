const express = require('express');
const router = express.Router();
const balanceGeneralController = require('../controllers/balanceGeneralController');

// Obtener Balance General por ID_PERIODO
router.get('/balance-general/:idPeriodo', balanceGeneralController.getByPeriodo);

// Crear o actualizar Balance General para un período
router.post('/balance-general', balanceGeneralController.saveForPeriodo);

module.exports = router;
