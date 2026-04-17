const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { requireAuth, requireJefe, requireEmpresaAccess } = require('../middleware/auth');

// Rutas para empresas - Lectura (cualquier usuario autenticado)
router.get('/empresas', requireAuth, empresaController.obtenerEmpresas);
router.get('/empresas/:id', requireAuth, requireEmpresaAccess, empresaController.obtenerEmpresaPorId);

// Rutas para empresas - Escritura (solo Jefe o Admin)
router.post('/empresas', requireAuth, requireJefe, empresaController.crearEmpresa);
router.put('/empresas/:id', requireAuth, requireJefe, requireEmpresaAccess, empresaController.actualizarEmpresa);
router.delete('/empresas/:id', requireAuth, requireJefe, requireEmpresaAccess, empresaController.eliminarEmpresa);

// Rutas adicionales - Lectura (cualquier usuario autenticado)
router.get('/grupos-empresariales', requireAuth, empresaController.obtenerGruposEmpresariales);

module.exports = router;
