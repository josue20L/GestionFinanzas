const db = require('../config/database');

// Obtener Flujo Operativo por ID_PERIODO
const getByPeriodo = async (req, res) => {
    try {
        const { idPeriodo } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM FLUJOOPERATIVO WHERE ID_PERIODO = ?',
            [idPeriodo]
        );

        if (!rows[0]) {
            return res.status(200).json(null);
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener Flujo Operativo:', error);
        return res.status(500).json({ message: 'Error al obtener Flujo Operativo' });
    }
};

// Crear o actualizar Flujo Operativo para un período
const saveForPeriodo = async (req, res) => {
    try {
        const { id_periodo } = req.body;

        if (!id_periodo) {
            return res.status(400).json({ message: 'id_periodo es requerido' });
        }

        // Extraer solo los campos que necesitamos (como Estado de Resultados)
        const {
            ventas,
            ventas_exportacion,
            cartera,
            transportes_ing,
            otros_ingresos,
            gastos_administrativos,
            gastos_comerciales,
            gastos_produccion,
            envios_cta_corp,
            impuestos,
            transportes_egr,
            cuentas_por_pagar,
            inversiones,
            otros_gastos,
            saldo_anterior
        } = req.body;

        // Verificar si ya existe un registro para ese período
        const [existeRows] = await db.query(
            'SELECT ID_FO FROM FLUJOOPERATIVO WHERE ID_PERIODO = ?',
            [id_periodo]
        );

        if (existeRows[0]) {
            // Actualizar - Solo guardar campos de input, los calculados son automáticos
            await db.query(
                `UPDATE FLUJOOPERATIVO
                     SET VENTAS = ?, VENTAS_EXPORTACION = ?, CARTERA = ?, TRANSPORTES_ING = ?, OTROS_INGRESOS = ?,
                         GASTOS_ADMINISTRATIVOS = ?, GASTOS_COMERCIALES = ?, GASTOS_PRODUCCION = ?, ENVIOS_CTA_CORP = ?,
                         IMPUESTOS = ?, TRANSPORTES_EGR = ?, CUENTAS_POR_PAGAR = ?, INVERSIONES = ?, OTROS_GASTOS = ?,
                         SALDO_ANTERIOR = ?
                     WHERE ID_PERIODO = ?`,
                [
                    ventas || 0,
                    ventas_exportacion || 0,
                    cartera || 0,
                    transportes_ing || 0,
                    otros_ingresos || 0,
                    gastos_administrativos || 0,
                    gastos_comerciales || 0,
                    gastos_produccion || 0,
                    envios_cta_corp || 0,
                    impuestos || 0,
                    transportes_egr || 0,
                    cuentas_por_pagar || 0,
                    inversiones || 0,
                    otros_gastos || 0,
                    saldo_anterior || 0,
                    id_periodo
                ]
            );
        } else {
            // Insertar - Solo guardar campos de input, los calculados son automáticos
            await db.query(
                `INSERT INTO FLUJOOPERATIVO
                     (ID_PERIODO, VENTAS, VENTAS_EXPORTACION, CARTERA, TRANSPORTES_ING, OTROS_INGRESOS,
                      GASTOS_ADMINISTRATIVOS, GASTOS_COMERCIALES, GASTOS_PRODUCCION, ENVIOS_CTA_CORP,
                      IMPUESTOS, TRANSPORTES_EGR, CUENTAS_POR_PAGAR, INVERSIONES, OTROS_GASTOS, SALDO_ANTERIOR)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_periodo,
                    ventas || 0,
                    ventas_exportacion || 0,
                    cartera || 0,
                    transportes_ing || 0,
                    otros_ingresos || 0,
                    gastos_administrativos || 0,
                    gastos_comerciales || 0,
                    gastos_produccion || 0,
                    envios_cta_corp || 0,
                    impuestos || 0,
                    transportes_egr || 0,
                    cuentas_por_pagar || 0,
                    inversiones || 0,
                    otros_gastos || 0,
                    saldo_anterior || 0
                ]);
        }

        return res.status(200).json({ message: 'Flujo Operativo guardado correctamente' });
    } catch (error) {
        console.error('Error al guardar Flujo Operativo:', error);
        return res.status(500).json({ message: 'Error al guardar Flujo Operativo' });
    }
};

module.exports = {
    getByPeriodo,
    saveForPeriodo
};
