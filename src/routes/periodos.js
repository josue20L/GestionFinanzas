const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodoFinancieroController');
const { requireAuth, requireJefe, requireEmpresaAccess } = require('../middleware/auth');

// Crear u obtener período financiero (empresa + año + mes) - Requiere rol Jefe+ y acceso a la empresa
router.post('/periodos-financieros/crear-o-obtener', requireAuth, requireJefe, requireEmpresaAccess, periodoController.crearOUbtenerPeriodo);

// Obtener todos los períodos de una empresa - Requiere acceso a la empresa
router.get('/periodos-financieros/empresa/:id_empresa', requireAuth, requireEmpresaAccess, periodoController.getPeriodosByEmpresa);

// Eliminar período financiero - Requiere rol Jefe+ y acceso a la empresa (se asume que el ID de empresa viene en el body o query)
router.delete('/periodos-financieros/eliminar', requireAuth, requireJefe, requireEmpresaAccess, periodoController.eliminarPeriodo);

module.exports = router;
