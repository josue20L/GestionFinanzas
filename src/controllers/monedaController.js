const Moneda = require('../models/Moneda');

class MonedaController {
    // Listar todas las monedas
    static async list(req, res) {
        try {
            const monedas = await Moneda.getAll();
            res.json({
                success: true,
                data: monedas,
                message: 'Monedas obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener monedas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener monedas',
                error: error.message
            });
        }
    }

    // Obtener moneda por ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const moneda = await Moneda.getById(id);
            
            if (!moneda) {
                return res.status(404).json({
                    success: false,
                    message: 'Moneda no encontrada'
                });
            }

            res.json({
                success: true,
                data: moneda,
                message: 'Moneda obtenida correctamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener moneda',
                error: error.message
            });
        }
    }

    // Crear nueva moneda
    static async create(req, res) {
        try {
            const { nombre_moneda, simbolo, codigo_iso } = req.body;

            // Validaciones básicas
            if (!nombre_moneda || !simbolo || !codigo_iso) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            const monedaData = {
                nombre_moneda: nombre_moneda.trim(),
                simbolo: simbolo.trim(),
                codigo_iso: codigo_iso.trim().toUpperCase()
            };

            const id = await Moneda.create(monedaData);
            
            res.status(201).json({
                success: true,
                data: { id, ...monedaData },
                message: 'Moneda creada correctamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al crear moneda',
                error: error.message
            });
        }
    }

    // Actualizar moneda
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre_moneda, simbolo, codigo_iso } = req.body;

            // Validaciones básicas
            if (!nombre_moneda || !simbolo || !codigo_iso) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            const monedaData = {
                nombre_moneda: nombre_moneda.trim(),
                simbolo: simbolo.trim(),
                codigo_iso: codigo_iso.trim().toUpperCase()
            };

            const updated = await Moneda.update(id, monedaData);
            
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Moneda no encontrada'
                });
            }

            res.json({
                success: true,
                data: { id, ...monedaData },
                message: 'Moneda actualizada correctamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar moneda',
                error: error.message
            });
        }
    }

    // Eliminar moneda
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            const deleted = await Moneda.delete(id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Moneda no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Moneda eliminada correctamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar moneda',
                error: error.message
            });
        }
    }
}

module.exports = MonedaController;
