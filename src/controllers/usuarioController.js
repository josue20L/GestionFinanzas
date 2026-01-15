const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const Empresa = require('../models/Empresa');

const listView = async (req, res) => {
    try {
        const usuarios = await Usuario.getAllWithAccesos();
        const roles = await Rol.getAll();
        const empresas = await Empresa.getAll();
        return res.render('usuarios/index', {
            title: 'Usuarios',
            usuarios,
            roles,
            empresas
        });
    } catch (error) {
        return res.status(500).render('error', {
            title: 'Error',
            message: error.message
        });
    }
};

const newView = async (req, res) => {
    try {
        const roles = await Rol.getAll();
        const empresas = await Empresa.getAll();
        return res.render('usuarios/form', {
            title: 'Nuevo Usuario',
            mode: 'create',
            usuario: null,
            acceso: null,
            roles,
            empresas,
            error: null
        });
    } catch (error) {
        return res.status(500).render('error', {
            title: 'Error',
            message: error.message
        });
    }
};

const create = async (req, res) => {
    try {
        const payload = {
            nombre_usuario: (req.body.nombre_usuario || '').toString().trim(),
            email_usuario: (req.body.email_usuario || '').toString().trim(),
            password: (req.body.password || '').toString(),
            activo: req.body.activo === 'on' || req.body.activo === 'true' || req.body.activo === '1',
            id_empresa: req.body.id_empresa ? Number(req.body.id_empresa) : null,
            id_rol: req.body.id_rol ? Number(req.body.id_rol) : null
        };

        if (!payload.nombre_usuario || !payload.email_usuario || !payload.password) {
            const roles = await Rol.getAll();
            const empresas = await Empresa.getAll();
            return res.status(400).render('auth/crear-admin', {
                title: 'Crear Administrador',
                error: 'Nombre, email y contraseña son requeridos.',
                empresas,
                roles
            });
        }

        await Usuario.create(payload);
        return res.redirect('/login');
    } catch (error) {
        const roles = await Rol.getAll();
        const empresas = await Empresa.getAll();
        return res.status(500).render('auth/crear-admin', {
            title: 'Crear Administrador',
            error: error.message,
            empresas,
            roles
        });
    }
};

const editView = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);
        const { user, accesos } = await Usuario.getWithAccesosById(idUsuario) || {};

        if (!user) {
            return res.status(404).render('error', {
                title: 'No encontrado',
                message: 'Usuario no encontrado.'
            });
        }

        const roles = await Rol.getAll();
        const empresas = await Empresa.getAll();
        const acceso = accesos && accesos.length ? accesos[0] : null;

        return res.render('usuarios/form', {
            title: 'Editar Usuario',
            mode: 'edit',
            usuario: user,
            acceso,
            roles,
            empresas,
            error: null
        });
    } catch (error) {
        return res.status(500).render('error', {
            title: 'Error',
            message: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);
        await Usuario.update(idUsuario, {
            nombre_usuario: (req.body.nombre_usuario || '').toString().trim(),
            email_usuario: (req.body.email_usuario || '').toString().trim(),
            password: (req.body.password || '').toString(),
            activo: req.body.activo === 'on' || req.body.activo === 'true' || req.body.activo === '1',
            id_empresa: req.body.id_empresa ? Number(req.body.id_empresa) : null,
            id_rol: req.body.id_rol ? Number(req.body.id_rol) : null
        });

        return res.redirect('/usuarios');
    } catch (error) {
        const roles = await Rol.getAll();
        const empresas = await Empresa.getAll();

        const idUsuario = Number(req.params.id);
        const usuario = await Usuario.getById(idUsuario);
        const acceso = { ID_EMPRESA: req.body.id_empresa, ID_ROL: req.body.id_rol };

        return res.status(500).render('usuarios/form', {
            title: 'Editar Usuario',
            mode: 'edit',
            usuario,
            acceso,
            roles,
            empresas,
            error: error.message
        });
    }
};

const remove = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);
        await Usuario.delete(idUsuario);
        return res.redirect('/usuarios');
    } catch (error) {
        return res.status(500).render('error', {
            title: 'Error',
            message: error.message
        });
    }
};

module.exports = {
    listView,
    newView,
    create,
    editView,
    update,
    remove
};
