const Empresa = require('../models/Empresa');
const Usuario = require('../models/Usuario');
const AccesoUsuario = require('../models/AccesoUsuario');

// Obtener todas las empresas
const obtenerEmpresas = async (req, res) => {
    try {
        let empresas;
        if (req.session.user && req.session.user.isAdmin) {
            empresas = await Empresa.getAll();
        } else if (req.session.user && req.session.user.accesos) {
            const idsEmpresas = req.session.user.accesos.map(a => a.id_empresa);
            if (idsEmpresas.length > 0) {
                // Obtener solo las empresas a las que tiene acceso
                const todas = await Empresa.getAll();
                empresas = todas.filter(e => idsEmpresas.includes(e.ID_EMPRESA));
            } else {
                empresas = [];
            }
        } else {
            empresas = [];
        }
        
        console.log('Empresas filtradas para usuario:', req.session.user.nombre_usuario, empresas.length);
        res.json(empresas);
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        res.status(500).json({ message: error.message });
    }
};

// Obtener empresa por ID
const obtenerEmpresaPorId = async (req, res) => {
    try {
        const empresa = await Empresa.getById(req.params.id);
        console.log('Empresa encontrada:', empresa);
        if (!empresa) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }
        res.json(empresa);
    } catch (error) {
        console.error('Error al obtener empresa:', error);
        res.status(500).json({ message: 'Error al obtener empresa' });
    }
};

// Crear nueva empresa
const crearEmpresa = async (req, res) => {
    try {
        const idEmpresa = await Empresa.create(req.body);
        const empresa = await Empresa.getById(idEmpresa);

        // Si el usuario es JEFE, asignarlo automáticamente a la empresa creada
        if (req.session.user && !req.session.user.isAdmin && req.session.user.accesos && req.session.user.accesos.length > 0) {
            const idUsuario = req.session.user.id_usuario;
            const rolActual = req.session.user.accesos[0].id_rol;
            
            await Usuario.assignEmpresa(idUsuario, idEmpresa, rolActual);
            console.log(`✅ JEFE ${req.session.user.nombre_usuario} asignado automáticamente a empresa ${idEmpresa}`);
            
            // Actualizar la sesión del usuario con la nueva empresa
            const { accesos } = await Usuario.getWithAccesosById(idUsuario);
            req.session.user.accesos = accesos;
            
            // Guardar explícitamente la sesión
            req.session.save((err) => {
                if (err) console.error('Error al guardar sesión:', err);
            });
        }

        res.status(201).json({
            message: 'Empresa creada exitosamente',
            data: { id_empresa: idEmpresa },
            empresa: empresa
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar empresa
const actualizarEmpresa = async (req, res) => {
    try {
        const actualizado = await Empresa.update(req.params.id, req.body);
        if (!actualizado) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }
        const empresa = await Empresa.getById(req.params.id);
        res.json({ 
            message: 'Empresa actualizada exitosamente',
            empresa: empresa
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Eliminar empresa
const eliminarEmpresa = async (req, res) => {
    try {
        const idEmpresa = req.params.id;

        // Primero eliminar todos los accesos de usuarios a esta empresa
        await AccesoUsuario.deleteByEmpresa(idEmpresa);
        console.log(`✅ Accesos eliminados para empresa ${idEmpresa}`);

        // Luego eliminar la empresa
        const eliminado = await Empresa.delete(idEmpresa);
        if (!eliminado) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }

        res.json({ message: 'Empresa eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener grupos empresariales
const obtenerGruposEmpresariales = async (req, res) => {
    try {
        const grupos = await Empresa.getGrupos();
        res.json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener monedas
const obtenerMonedas = async (req, res) => {
    try {
        const monedas = await Empresa.getMonedas();
        res.json(monedas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener empresa para renderizar card
const obtenerEmpresaParaCard = async (req, res) => {
    try {
        const empresa = await Empresa.getById(req.params.id);
        if (!empresa) {
            return res.status(404).send('Empresa no encontrada');
        }
        res.render('empresas/card-empresas', { 
            empresa,
            title: 'Card Empresa',
            layout: false  // No usar layout para cards
        });
    } catch (error) {
        console.error('Error al obtener empresa para card:', error);
        res.status(500).send('Error al cargar card');
    }
};

module.exports = {
    obtenerEmpresas,
    obtenerEmpresaPorId,
    crearEmpresa,
    actualizarEmpresa,
    eliminarEmpresa,
    obtenerGruposEmpresariales,
    obtenerMonedas,
    obtenerEmpresaParaCard
};
