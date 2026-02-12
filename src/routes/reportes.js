const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// Resumen Ejecutivo
router.get('/resumen-ejecutivo', reportesController.getResumenEjecutivo);

module.exports = router;
