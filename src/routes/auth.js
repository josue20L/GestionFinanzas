const express = require('express');
const router = express.Router();

const { showLogin, login, logout } = require('../controllers/authController');
const { create } = require('../controllers/usuarioController');

router.get('/login', showLogin);
router.post('/login', login);
router.get('/logout', logout);

// Ruta especial para crear primer admin (sin autenticación)
router.post('/crear-admin', create);

module.exports = router;
