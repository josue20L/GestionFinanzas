const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');

// Ruta para renderizar card individual
router.get('/card/:id', empresaController.obtenerEmpresaParaCard);

module.exports = router;
