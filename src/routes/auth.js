const express = require('express');
const router = express.Router();

const { showLogin, login, logout } = require('../controllers/authController');
const { create } = require('../controllers/usuarioController');
const { requireAuth } = require('../middleware/auth');

router.get('/login', showLogin);
router.post('/login', login);
router.get('/logout', logout);

// Endpoint para obtener usuario actual (ahora accesible en /auth/user)
router.get('/user', requireAuth, (req, res) => {
    res.json(req.session.user);
});

// Endpoint de prueba
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes working', timestamp: new Date() });
});

// Ruta especial para crear primer admin (sin autenticación)
router.post('/crear-admin', create);

module.exports = router;
