const PeriodoFinanciero = require('../models/PeriodoFinanciero');

// Crear u obtener período financiero para empresa + año + mes
const crearOUbtenerPeriodo = async (req, res) => {
    try {
        const { id_empresa, anio, mes } = req.body;

        if (!id_empresa || !anio || !mes) {
            return res.status(400).json({ message: 'id_empresa, anio y mes son requeridos' });
        }

        const idPeriodo = await PeriodoFinanciero.createIfNotExists(id_empresa, anio, mes);
        const periodo = await PeriodoFinanciero.getById(idPeriodo);

        return res.status(200).json({
            message: 'Período financiero listo',
            periodo
        });
    } catch (error) {
        console.error('Error en crearOUbtenerPeriodo:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    crearOUbtenerPeriodo
};
