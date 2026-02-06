const Reporte = require('../models/Reporte');

const getReporte = async (req, res) => {
    try {
        const empresaId = req.query.empresaId;
        const periodo = req.query.periodo;

        const data = await Reporte.getReporte(empresaId, periodo);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getHistorico = async (req, res) => {
    try {
        const empresaId = req.query.empresaId;
        const periodo = req.query.periodo;
        const meses = req.query.meses;

        const data = await Reporte.getHistorico(empresaId, periodo, meses);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const exportarPdf = async (req, res) => {
    try {
        return res.status(501).json({
            success: false,
            message: 'Exportación a PDF no implementada aún (requiere dependencias).'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al exportar PDF' });
    }
};

const exportarExcel = async (req, res) => {
    try {
        return res.status(501).json({
            success: false,
            message: 'Exportación a Excel no implementada aún (requiere dependencias).'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al exportar Excel' });
    }
};

module.exports = {
    getReporte,
    getHistorico,
    exportarPdf,
    exportarExcel
};
