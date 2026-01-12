const FlujoCorporativo = require('../models/FlujoCorporativo');

// Obtener Flujo Corporativo por ID_PERIODO
const getByPeriodo = async (req, res) => {
    try {
        const { idPeriodo } = req.params;

        const flujoCorporativo = await FlujoCorporativo.getByIdPeriodo(idPeriodo);

        if (!flujoCorporativo) {
            return res.status(200).json(null);
        }

        return res.status(200).json(flujoCorporativo);
    } catch (error) {
        console.error('Error al obtener Flujo Corporativo:', error);
        return res.status(500).json({ message: 'Error al obtener Flujo Corporativo' });
    }
};

// Crear o actualizar Flujo Corporativo para un período
const saveForPeriodo = async (req, res) => {
    try {
        const { id_periodo } = req.body;

        if (!id_periodo) {
            return res.status(400).json({ message: 'id_periodo es requerido' });
        }

        // Extraer solo los campos que necesitamos (como Estado de Resultados)
        const {
            transferencia_fondos,
            desembolsos_bancarios,
            otros_ingresos,
            prestamos_bancarios,
            inversiones,
            rpr_consultores,
            bonos_plrs,
            dividendos_pagar,
            cuentas_pagar,
            aguinaldos,
            finiquitos,
            primas,
            retroactivos,
            iue,
            otros_gastos,
            saldo_anterior
        } = req.body;

        // Usar el Model para guardar
        const result = await FlujoCorporativo.createOrUpdate(id_periodo, {
            transferencia_fondos,
            desembolsos_bancarios,
            otros_ingresos,
            prestamos_bancarios,
            inversiones,
            rpr_consultores,
            bonos_plrs,
            dividendos_pagar,
            cuentas_pagar,
            aguinaldos,
            finiquitos,
            primas,
            retroactivos,
            iue,
            otros_gastos,
            saldo_anterior
        });

        return res.status(200).json({ message: 'Flujo Corporativo guardado correctamente' });
    } catch (error) {
        console.error('Error al guardar Flujo Corporativo:', error);
        return res.status(500).json({ message: 'Error al guardar Flujo Corporativo' });
    }
};

module.exports = {
    getByPeriodo,
    saveForPeriodo
};
