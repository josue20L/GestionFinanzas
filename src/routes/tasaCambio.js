const express = require('express');
const router = express.Router();
const tasaCambioController = require('../controllers/tasaCambioController');
const { requireAuth } = require('../middleware/auth');

// Rutas para tasas de cambio
router.get('/:origen/:destino/actual', tasaCambioController.getUltimaTasa);
router.post('/actualizar', requireAuth, tasaCambioController.actualizarTasa);
router.get('/:origen/:destino/historial', tasaCambioController.getHistorial);

module.exports = router;
