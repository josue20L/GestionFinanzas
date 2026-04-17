const express = require('express');
const router = express.Router();
const estadoResultadoController = require('../controllers/estadoResultadoController');

const { requireAuth, requireJefe, requireEmpresaAccess } = require('../middleware/auth');

// Obtener Estado de Resultados por ID_PERIODO
router.get('/estado-resultados/:idPeriodo', requireAuth, estadoResultadoController.getByPeriodo);

// Crear o actualizar Estado de Resultados para un período
router.post('/estado-resultados', requireAuth, requireJefe, requireEmpresaAccess, estadoResultadoController.saveForPeriodo);

module.exports = router;
