const express = require('express');
const router = express.Router();
const flujoOperativoController = require('../controllers/flujoOperativoController');

const { requireAuth, requireJefe, requireEmpresaAccess } = require('../middleware/auth');

// Obtener Flujo Operativo por ID_PERIODO
router.get('/flujo-operativo/:idPeriodo', requireAuth, flujoOperativoController.getByPeriodo);

// Crear o actualizar Flujo Operativo para un período
router.post('/flujo-operativo', requireAuth, requireJefe, requireEmpresaAccess, flujoOperativoController.saveForPeriodo);

module.exports = router;
