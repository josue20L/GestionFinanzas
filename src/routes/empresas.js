const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');

// Rutas para empresas
router.get('/empresas', empresaController.obtenerEmpresas);
router.get('/empresas/:id', empresaController.obtenerEmpresaPorId);
router.post('/empresas', empresaController.crearEmpresa);
router.put('/empresas/:id', empresaController.actualizarEmpresa);
router.delete('/empresas/:id', empresaController.eliminarEmpresa);

// Rutas adicionales
router.get('/grupos-empresariales', empresaController.obtenerGruposEmpresariales);
router.get('/monedas', empresaController.obtenerMonedas);

module.exports = router;
