const Usuario = require('../models/Usuario');
const Empresa = require('../models/Empresa');
const Rol = require('../models/Rol');

const showLogin = async (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }

    // Verificar si hay usuarios en la BD
    try {
        const usuarios = await Usuario.getAll();
        if (!usuarios || usuarios.length === 0) {
            // Es el primer usuario, no mostrar campos de rol y empresa
            return res.render('auth/crear-admin', {
                title: 'Crear Primer Administrador',
                error: null,
                empresas: [],
                roles: [],
                isFirstUser: true
            });
        }
    } catch (error) {
        console.error('Error al verificar usuarios:', error);
    }

    return res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: null
    });
};

const login = async (req, res) => {
    try {
        // Permitir login por nombre de usuario (principal) o email (respaldo)
        const loginField = (req.body.login || req.body.email || '').toString().trim();
        const password = (req.body.password || '').toString();

        if (!loginField || !password) {
            return res.status(400).render('auth/login', {
                title: 'Iniciar Sesión',
                error: 'Usuario y contraseña son requeridos.'
            });
        }

        const sessionUser = await Usuario.authenticateByLogin(loginField, password);
        if (!sessionUser) {
            return res.status(401).render('auth/login', {
                title: 'Iniciar Sesión',
                error: 'Credenciales inválidas o usuario inactivo.'
            });
        }

        req.session.user = sessionUser;
        return res.redirect('/');
    } catch (error) {
        return res.status(500).render('auth/login', {
            title: 'Iniciar Sesión',
            error: error.message
        });
    }
};

const logout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/login');
    });
};

module.exports = {
    showLogin,
    login,
    logout
};
