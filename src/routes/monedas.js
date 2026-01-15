const express = require('express');
const router = express.Router();
const MonedaController = require('../controllers/monedaController');

// GET /api/monedas - Listar todas las monedas
router.get('/', MonedaController.list);

// GET /api/monedas/:id - Obtener moneda por ID
router.get('/:id', MonedaController.getById);

// POST /api/monedas - Crear nueva moneda
router.post('/', MonedaController.create);

// PUT /api/monedas/:id - Actualizar moneda
router.put('/:id', MonedaController.update);

// DELETE /api/monedas/:id - Eliminar moneda
router.delete('/:id', MonedaController.delete);

module.exports = router;
