const PeriodoFinanciero = require('../models/PeriodoFinanciero');

// Crear u obtener período financiero para empresa + año + mes
const crearOUbtenerPeriodo = async (req, res) => {
    try {
        const { id_empresa, anio, mes } = req.body;

        if (!id_empresa || !anio || !mes) {
            return res.status(400).json({ message: 'id_empresa, anio y mes son requeridos' });
        }

        // Verificar si ya existe
        const existente = await PeriodoFinanciero.getByEmpresaAnioMes(id_empresa, anio, mes);
        const esNuevo = !existente;

        // Crear si no existe
        const idPeriodo = await PeriodoFinanciero.createIfNotExists(id_empresa, anio, mes);
        const periodo = await PeriodoFinanciero.getById(idPeriodo);

        return res.status(200).json({
            message: esNuevo ? 'Período financiero creado' : 'Período financiero existente',
            periodo,
            esNuevo
        });
    } catch (error) {
        console.error('Error en crearOUbtenerPeriodo:', error);
        return res.status(500).json({ message: error.message });
    }
};

// Obtener períodos de una empresa
const getPeriodosByEmpresa = async (req, res) => {
    try {
        const { id_empresa } = req.params;

        if (!id_empresa) {
            return res.status(400).json({ message: 'id_empresa es requerido' });
        }

        const periodos = await PeriodoFinanciero.getConDatosFinancieros(id_empresa);

        return res.status(200).json({
            message: 'Períodos obtenidos exitosamente',
            periodos
        });
    } catch (error) {
        console.error('Error en getPeriodosByEmpresa:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    crearOUbtenerPeriodo,
    getPeriodosByEmpresa
};
