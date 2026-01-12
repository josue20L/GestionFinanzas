const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodoFinancieroController');

// Crear u obtener período financiero (empresa + año + mes)
router.post('/periodos-financieros/crear-o-obtener', periodoController.crearOUbtenerPeriodo);

module.exports = router;
