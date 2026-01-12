const db = require('../config/database');

// Obtener Balance General por ID_PERIODO
const getByPeriodo = async (req, res) => {
    try {
        const { idPeriodo } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM BALANCEGENERAL WHERE ID_PERIODO = ?',
            [idPeriodo]
        );

        if (!rows[0]) {
            return res.status(200).json(null);
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener Balance General:', error);
        return res.status(500).json({ message: 'Error al obtener Balance General' });
    }
};

// Crear o actualizar Balance General para un período
const saveForPeriodo = async (req, res) => {
    try {
        const {
            id_periodo,
            disponible,
            exigible,
            realizable,
            activo_fijo_tangible,
            activo_diferido,
            otros_activos,
            pasivo_corriente,
            prevision_beneficios_sociales,
            obligaciones_bancarias,
            intereses_pagar,
            procesos_legales,
            patrimonio
        } = req.body;

        if (!id_periodo) {
            return res.status(400).json({ message: 'id_periodo es requerido' });
        }

        const [existeRows] = await db.query(
            'SELECT ID_BG FROM BALANCEGENERAL WHERE ID_PERIODO = ?',
            [id_periodo]
        );

        const values = [
            disponible || 0,
            exigible || 0,
            realizable || 0,
            activo_fijo_tangible || 0,
            activo_diferido || 0,
            otros_activos || 0,
            pasivo_corriente || 0,
            prevision_beneficios_sociales || 0,
            obligaciones_bancarias || 0,
            intereses_pagar || 0,
            procesos_legales || 0,
            patrimonio || 0
        ];

        if (existeRows[0]) {
            // UPDATE
            await db.query(
                `UPDATE BALANCEGENERAL
                 SET DISPONIBLE = ?, EXIGIBLE = ?, REALIZABLE = ?,
                     ACTIVO_FIJO_TANGIBLE = ?, ACTIVO_DIFERIDO = ?, OTROS_ACTIVOS = ?,
                     PASIVO_CORRIENTE = ?, PREVISION_BENEFICIOS_SOCIALES = ?, OBLIGACIONES_BANCARIAS = ?,
                     INTERESES_POR_PAGAR = ?, PROCESOS_LEGALES = ?, PATRIMONIO = ?
                 WHERE ID_PERIODO = ?`,
                [...values, id_periodo]
            );
        } else {
            // INSERT
            await db.query(
                `INSERT INTO BALANCEGENERAL
                 (ID_PERIODO, DISPONIBLE, EXIGIBLE, REALIZABLE,
                  ACTIVO_FIJO_TANGIBLE, ACTIVO_DIFERIDO, OTROS_ACTIVOS,
                  PASIVO_CORRIENTE, PREVISION_BENEFICIOS_SOCIALES, OBLIGACIONES_BANCARIAS,
                  INTERESES_POR_PAGAR, PROCESOS_LEGALES, PATRIMONIO)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_periodo, ...values]
            );
        }

        return res.status(200).json({ message: 'Balance General guardado correctamente' });
    } catch (error) {
        console.error('Error al guardar Balance General:', error);
        return res.status(500).json({ message: 'Error al guardar Balance General' });
    }
};

module.exports = {
    getByPeriodo,
    saveForPeriodo
};
