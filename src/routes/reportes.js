const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { requireAuth, requireEmpresaAccess } = require('../middleware/auth');

// Rutas de reportes - Requieren autenticación y acceso a la empresa
router.get('/reportes', requireAuth, requireEmpresaAccess, reporteController.getReporte);
router.get('/reportes/historico', requireAuth, requireEmpresaAccess, reporteController.getHistorico);

router.post('/reportes/exportar/pdf', requireAuth, requireEmpresaAccess, reporteController.exportarPdf);
router.post('/reportes/exportar/excel', requireAuth, requireEmpresaAccess, reporteController.exportarExcel);

module.exports = router;
