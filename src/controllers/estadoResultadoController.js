const db = require('../config/database');

// Obtener Estado de Resultados por ID_PERIODO
const getByPeriodo = async (req, res) => {
    try {
        const { idPeriodo } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM ESTADORESULTADO WHERE ID_PERIODO = ?',
            [idPeriodo]
        );

        if (!rows[0]) {
            return res.status(200).json(null);
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener Estado de Resultados:', error);
        return res.status(500).json({ message: 'Error al obtener Estado de Resultados' });
    }
};

// Crear o actualizar Estado de Resultados para un período
const saveForPeriodo = async (req, res) => {
    try {
        const { id_periodo, ventas_netas, costo_ventas, gasto_administrativo, gasto_comercializacion, gasto_sig, gasto_tributario, gasto_financiero, otros_ingresos, otros_egresos } = req.body;

        if (!id_periodo) {
            return res.status(400).json({ message: 'id_periodo es requerido' });
        }

        // Verificar si ya existe un registro para ese período
        const [existeRows] = await db.query(
            'SELECT ID_ER FROM ESTADORESULTADO WHERE ID_PERIODO = ?',
            [id_periodo]
        );

        if (existeRows[0]) {
            // Actualizar
            await db.query(
                `UPDATE ESTADORESULTADO
                 SET VENTAS_NETAS = ?, COSTO_VENTAS = ?, GASTO_ADMINISTRATIVO = ?, GASTO_COMERCIALIZACION = ?, GASTO_SIG = ?,
                     GASTO_TRIBUTARIO = ?, GASTO_FINANCIERO = ?, OTROS_INGRESOS = ?, OTROS_EGRESOS = ?
                 WHERE ID_PERIODO = ?`,
                [
                    ventas_netas || 0,
                    costo_ventas || 0,
                    gasto_administrativo || 0,
                    gasto_comercializacion || 0,
                    gasto_sig || 0,
                    gasto_tributario || 0,
                    gasto_financiero || 0,
                    otros_ingresos || 0,
                    otros_egresos || 0,
                    id_periodo
                ]
            );
        } else {
            // Insertar
            await db.query(
                `INSERT INTO ESTADORESULTADO
                 (ID_PERIODO, VENTAS_NETAS, COSTO_VENTAS, GASTO_ADMINISTRATIVO, GASTO_COMERCIALIZACION, GASTO_SIG,
                  GASTO_TRIBUTARIO, GASTO_FINANCIERO, OTROS_INGRESOS, OTROS_EGRESOS)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_periodo,
                    ventas_netas || 0,
                    costo_ventas || 0,
                    gasto_administrativo || 0,
                    gasto_comercializacion || 0,
                    gasto_sig || 0,
                    gasto_tributario || 0,
                    gasto_financiero || 0,
                    otros_ingresos || 0,
                    otros_egresos || 0
                ]
            );
        }

        return res.status(200).json({ message: 'Estado de Resultados guardado correctamente' });
    } catch (error) {
        console.error('Error al guardar Estado de Resultados:', error);
        return res.status(500).json({ message: 'Error al guardar Estado de Resultados' });
    }
};

module.exports = {
    getByPeriodo,
    saveForPeriodo
};
