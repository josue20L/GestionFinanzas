const express = require('express');
const router = express.Router();
const balanceGeneralController = require('../controllers/balanceGeneralController');

const { requireAuth, requireJefe, requireEmpresaAccess } = require('../middleware/auth');

// Obtener Balance General por ID_PERIODO
router.get('/balance-general/:idPeriodo', requireAuth, balanceGeneralController.getByPeriodo);

// Crear o actualizar Balance General para un período
router.post('/balance-general', requireAuth, requireJefe, requireEmpresaAccess, balanceGeneralController.saveForPeriodo);

module.exports = router;
