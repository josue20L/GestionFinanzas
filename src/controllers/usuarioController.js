const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const Empresa = require('../models/Empresa');
const Moneda = require('../models/Moneda');
const db = require('../config/database');

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
    // Verificar si es el primer usuario (no hay usuarios en la BD)
    const allUsers = await Usuario.getAll();
    const isFirstUser = !allUsers || allUsers.length === 0;
    
    try {
        // Validación de seguridad: solo ADMIN puede crear usuarios
        if (!req.session.user.isAdmin) {
            return res.status(403).render('error', {
                title: 'Acceso Denegado',
                message: 'Solo los administradores pueden crear usuarios'
            });
        }

        if (isFirstUser) {
            // Primer usuario: crear roles básicos y asignar Administrador
            const rolesBasicos = ['Administrador', 'Gerente', 'Auditor', 'Contador', 'Usuario'];

            // Crear roles básicos si no existen
            for (const rolNombre of rolesBasicos) {
                const [existing] = await db.query('SELECT ID_ROL FROM ROL WHERE NOMBRE_ROL = ?', [rolNombre]);
                if (existing.length === 0) {
                    await db.query('INSERT INTO ROL (NOMBRE_ROL) VALUES (?)', [rolNombre]);
                    console.log(`✅ Rol creado: ${rolNombre}`);
                } else {
                    console.log(`ℹ️  Rol ya existe: ${rolNombre}`);
                }
            }

            // Crear monedas básicas si no existen
            const monedasBasicas = [
                { nombre: 'Boliviano', simbolo: 'Bs', codigo_iso: 'BOB' },
                { nombre: 'Dólar Estadounidense', simbolo: 'USD', codigo_iso: 'USD' }
            ];

            for (const moneda of monedasBasicas) {
                const [existing] = await db.query('SELECT ID_MONEDA FROM MONEDA WHERE NOMBRE_MONEDA = ?', [moneda.nombre]);
                if (existing.length === 0) {
                    await Moneda.create({
                        nombre_moneda: moneda.nombre,
                        simbolo: moneda.simbolo,
                        codigo_iso: moneda.codigo_iso
                    });
                    console.log(`✅ Moneda creada: ${moneda.nombre}`);
                } else {
                    console.log(`ℹ️  Moneda ya existe: ${moneda.nombre}`);
                }
            }

            // Crear grupos empresariales básicos si no existen
            const gruposBasicos = [
                { nombre: 'Tecnología', descripcion: 'Empresas de tecnología e innovación' },
                { nombre: 'Comercial', descripcion: 'Empresas comerciales y de ventas' },
                { nombre: 'Servicios', descripcion: 'Empresas de servicios profesionales' }
            ];

            for (const grupo of gruposBasicos) {
                const [existing] = await db.query('SELECT ID_GRUPO FROM GRUPO_EMPRESARIAL WHERE NOMBRE_GRUPO = ?', [grupo.nombre]);
                if (existing.length === 0) {
                    await db.query('INSERT INTO GRUPO_EMPRESARIAL (NOMBRE_GRUPO) VALUES (?)', [grupo.nombre]);
                    console.log(`✅ Grupo creado: ${grupo.nombre}`);
                } else {
                    console.log(`ℹ️  Grupo ya existe: ${grupo.nombre}`);
                }
            }

            // Crear empresa del sistema si no existe
            const [systemExists] = await db.query('SELECT ID_EMPRESA FROM EMPRESA WHERE IS_SYSTEM = 1 LIMIT 1');
            if (systemExists.length === 0) {
                const [grupoSistema] = await db.query('SELECT ID_GRUPO FROM GRUPO_EMPRESARIAL WHERE NOMBRE_GRUPO = ?', ['Tecnología']);
                const [monedaSistema] = await db.query('SELECT ID_MONEDA FROM MONEDA WHERE NOMBRE_MONEDA = ?', ['Boliviano']);
                
                await db.query(`
                    INSERT INTO EMPRESA (ID_GRUPO, ID_MONEDA, NOMBRE_EMPRESA, IS_SYSTEM) 
                    VALUES (?, ?, ?, 1)
                `, [grupoSistema[0].ID_GRUPO, monedaSistema[0].ID_MONEDA, 'Sistema']);
                
                console.log('✅ Empresa del sistema creada');
            }

            // Obtener el rol Administrador
            const [adminRolRows] = await db.query('SELECT ID_ROL FROM ROL WHERE NOMBRE_ROL = ?', ['Administrador']);
            const idRol = adminRolRows.length > 0 ? adminRolRows[0].ID_ROL : null;

            // Obtener empresa del sistema para el primer usuario
            const [systemEmpresa] = await db.query('SELECT ID_EMPRESA FROM EMPRESA WHERE IS_SYSTEM = 1 LIMIT 1');
            const idEmpresa = systemEmpresa.length > 0 ? systemEmpresa[0].ID_EMPRESA : null;

            const payload = {
                nombre_usuario: (req.body.nombre_usuario || '').toString().trim(),
                email_usuario: (req.body.email_usuario || '').toString().trim(),
                password: (req.body.password || '').toString(),
                activo: req.body.activo === 'on' || req.body.activo === 'true' || req.body.activo === '1',
                id_empresa: idEmpresa,
                id_rol: idRol
            };

            console.log('DEBUG: idRol =', idRol, 'idEmpresa =', idEmpresa);

            if (!payload.nombre_usuario || !payload.email_usuario || !payload.password) {
                return res.status(400).render('auth/crear-admin', {
                    title: 'Crear Primer Administrador',
                    error: 'Nombre, email y contraseña son requeridos.',
                    empresas: [],
                    roles: [],
                    isFirstUser: true
                });
            }

            await Usuario.create(payload);

            console.log('🎉 Primer usuario administrador creado exitosamente');
            console.log('📧 Email:', payload.email_usuario);
            console.log('👑 Rol: Administrador');
            console.log('🏢 Empresa asignada: Empresa del sistema');

            return res.redirect('/login');
        } else {
            // Usuarios posteriores: manejar múltiples empresas
            const empresasSeleccionadas = req.body.empresas || [];
            
            const payload = {
                nombre_usuario: (req.body.nombre_usuario || '').toString().trim(),
                email_usuario: (req.body.email_usuario || '').toString().trim(),
                password: (req.body.password || '').toString(),
                activo: req.body.activo === 'on' || req.body.activo === 'true' || req.body.activo === '1',
                id_rol: req.body.id_rol ? Number(req.body.id_rol) : null
            };

            if (!payload.nombre_usuario || !payload.email_usuario || !payload.password) {
                const roles = await Rol.getAll();
                const empresas = await Empresa.getAll();
                return res.status(400).render('auth/crear-admin', {
                    title: 'Crear Administrador',
                    error: 'Nombre, email y contraseña son requeridos.',
                    empresas,
                    roles,
                    isFirstUser: false
                });
            }

            // Crear usuario primero
            const idUsuario = await Usuario.create(payload);
            
            // Asignar múltiples empresas si se seleccionaron
            if (empresasSeleccionadas.length > 0 && payload.id_rol) {
                for (const idEmpresa of empresasSeleccionadas) {
                    await Usuario.assignEmpresa(idUsuario, Number(idEmpresa), payload.id_rol);
                }
                console.log(`✅ Asignadas ${empresasSeleccionadas.length} empresas al usuario ${payload.nombre_usuario}`);
            }
            
            return res.redirect('/usuarios');
        }
    } catch (error) {
        const roles = await Rol.getAll();
        const empresas = await Empresa.getAll();
        return res.status(500).render('auth/crear-admin', {
            title: 'Crear Administrador',
            error: error.message,
            empresas,
            roles,
            isFirstUser: isFirstUser
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
        
        // Para el formulario de rol, necesitamos el rol principal del usuario
        // El rol está en ACCESO_USUARIO, no en USUARIO
        const rolPrincipal = accesos && accesos.length > 0 ? accesos[0].ID_ROL : null;
        
        // Preparar accesos para el formulario
        const acceso = {
            empresas: accesos ? accesos.map(a => a.ID_EMPRESA) : [],
            id_rol: rolPrincipal
        };

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
        const empresasSeleccionadas = req.body.empresas || [];
        
        // Actualizar datos básicos del usuario
        await Usuario.update(idUsuario, {
            nombre_usuario: (req.body.nombre_usuario || '').toString().trim(),
            email_usuario: (req.body.email_usuario || '').toString().trim(),
            password: (req.body.password || '').toString(),
            activo: req.body.activo === 'on' || req.body.activo === 'true' || req.body.activo === '1'
        });

        // Obtener el rol actual del usuario antes de limpiar accesos
        const { accesos } = await Usuario.getWithAccesosById(idUsuario) || {};
        const rolActual = accesos && accesos.length > 0 ? accesos[0].ID_ROL : null;
        
        // Usar el rol seleccionado o mantener el rol anterior
        const idRol = req.body.id_rol ? Number(req.body.id_rol) : rolActual;
        
        // Limpiar accesos existentes
        await Usuario.clearAccesos(idUsuario);
        
        // Reasignar empresas si se seleccionaron
        if (empresasSeleccionadas.length > 0 && idRol) {
            for (const idEmpresa of empresasSeleccionadas) {
                await Usuario.assignEmpresa(idUsuario, Number(idEmpresa), idRol);
            }
            console.log(`✅ Actualizadas ${empresasSeleccionadas.length} empresas para usuario ${req.body.nombre_usuario}`);
        }

        return res.redirect('/usuarios');
    } catch (error) {
        const roles = await Rol.getAll();
        const empresas = await Empresa.getAll();

        const idUsuario = Number(req.params.id);
        const usuario = await Usuario.getById(idUsuario);
        const { accesos } = await Usuario.getWithAccesosById(idUsuario) || {};
        
        const acceso = {
            empresas: accesos ? accesos.map(a => a.ID_EMPRESA) : [],
            id_rol: accesos && accesos.length ? accesos[0].ID_ROL : null
        };

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
