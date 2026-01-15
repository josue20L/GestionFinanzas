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
            // Obtener empresas y roles para el formulario
            const empresas = await Empresa.getAll();
            const roles = await Rol.getAll();
            
            return res.render('auth/crear-admin', {
                title: 'Crear Administrador',
                error: null,
                empresas,
                roles
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
        const email = (req.body.email || '').toString().trim();
        const password = (req.body.password || '').toString();

        if (!email || !password) {
            return res.status(400).render('auth/login', {
                title: 'Iniciar Sesión',
                error: 'Email y contraseña son requeridos.'
            });
        }

        const sessionUser = await Usuario.authenticate(email, password);
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
