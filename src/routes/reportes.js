const express = require('express');
const router = express.Router();

const reporteController = require('../controllers/reporteController');

router.get('/reportes', reporteController.getReporte);
router.get('/reportes/historico', reporteController.getHistorico);

router.post('/reportes/exportar/pdf', reporteController.exportarPdf);
router.post('/reportes/exportar/excel', reporteController.exportarExcel);

module.exports = router;
