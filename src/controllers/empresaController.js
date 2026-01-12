const Empresa = require('../models/Empresa');

// Obtener todas las empresas
const obtenerEmpresas = async (req, res) => {
    try {
        const empresas = await Empresa.getAll();
        console.log('Empresas encontradas:', empresas);
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
        res.status(201).json({ 
            message: 'Empresa creada exitosamente',
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
        const eliminado = await Empresa.delete(req.params.id);
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

module.exports = {
    obtenerEmpresas,
    obtenerEmpresaPorId,
    crearEmpresa,
    actualizarEmpresa,
    eliminarEmpresa,
    obtenerGruposEmpresariales,
    obtenerMonedas
};
