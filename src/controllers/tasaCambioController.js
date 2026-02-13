const TasaCambio = require('../models/TasaCambio');

const getUltimaTasa = async (req, res) => {
    try {
        const { origen, destino } = req.params;
        const tasa = await TasaCambio.getUltimaTasa(origen, destino);
        if (!tasa) {
            return res.status(404).json({ success: false, message: 'Tasa de cambio no encontrada' });
        }
        res.json({ success: true, tasa });
    } catch (error) {
        console.error('Error al obtener tasa:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const actualizarTasa = async (req, res) => {
    try {
        const { idMonedaOrigen, idMonedaDestino, valorCompra, valorVenta } = req.body;
        if (!idMonedaOrigen || !idMonedaDestino || !valorVenta) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }
        const id = await TasaCambio.updateTasa(idMonedaOrigen, idMonedaDestino, valorCompra || valorVenta, valorVenta);
        res.json({ success: true, message: 'Tasa de cambio actualizada correctamente', id });
    } catch (error) {
        console.error('Error al actualizar tasa:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const getHistorial = async (req, res) => {
    try {
        const { origen, destino } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const historial = await TasaCambio.getHistorial(origen, destino, limit);
        res.json({ success: true, historial });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    getUltimaTasa,
    actualizarTasa,
    getHistorial
};
