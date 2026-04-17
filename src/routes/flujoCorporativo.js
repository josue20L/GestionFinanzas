const express = require('express');
const router = express.Router();
const flujoCorporativoController = require('../controllers/flujoCorporativoController');

const { requireAuth, requireJefe, requireEmpresaAccess } = require('../middleware/auth');

// Obtener Flujo Corporativo por ID_PERIODO
router.get('/flujo-corporativo/:idPeriodo', requireAuth, flujoCorporativoController.getByPeriodo);

// Crear o actualizar Flujo Corporativo para un período
router.post('/flujo-corporativo', requireAuth, requireJefe, requireEmpresaAccess, flujoCorporativoController.saveForPeriodo);

module.exports = router;
