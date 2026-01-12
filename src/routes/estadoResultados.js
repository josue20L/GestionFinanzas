const express = require('express');
const router = express.Router();
const estadoResultadoController = require('../controllers/estadoResultadoController');

// Obtener Estado de Resultados por ID_PERIODO
router.get('/estado-resultados/:idPeriodo', estadoResultadoController.getByPeriodo);

// Crear o actualizar Estado de Resultados para un período
router.post('/estado-resultados', estadoResultadoController.saveForPeriodo);

module.exports = router;
