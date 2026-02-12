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
            disponible = 0,
            exigible = 0,
            realizable = 0,
            activo_fijo_tangible = 0,
            activo_diferido = 0,
            otros_activos = 0,
            pasivo_corriente = 0,
            prevision_beneficios_sociales = 0,
            obligaciones_bancarias = 0,
            intereses_pagar = 0,
            procesos_legales = 0,
            patrimonio = 0
        } = req.body;

        if (!id_periodo) {
            return res.status(400).json({ message: 'id_periodo es requerido' });
        }

        // Validación de balance: Total Activo debe ser igual a Total Pasivo + Patrimonio
        const totalActivoGeneral =
            (Number(disponible) || 0) +
            (Number(exigible) || 0) +
            (Number(realizable) || 0) +
            (Number(activo_fijo_tangible) || 0) +
            (Number(activo_diferido) || 0) +
            (Number(otros_activos) || 0);

        const totalPasivoPatrimonio =
            (Number(pasivo_corriente) || 0) +
            (Number(prevision_beneficios_sociales) || 0) +
            (Number(obligaciones_bancarias) || 0) +
            (Number(intereses_pagar) || 0) +
            (Number(procesos_legales) || 0) +
            (Number(patrimonio) || 0);

        const diff = Math.round((totalActivoGeneral - totalPasivoPatrimonio) * 100) / 100;
        if (diff !== 0) {
            return res.status(400).json({
                message: 'El Balance General no cuadra: Total Activo debe ser igual a Total Pasivo + Patrimonio.',
                detalle: {
                    total_activo: totalActivoGeneral,
                    total_pasivo_patrimonio: totalPasivoPatrimonio,
                    diferencia: diff
                }
            });
        }

        // Verificar si ya existe un registro para ese período
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
            // UPDATE - Solo guardar campos de input, los calculados son automáticos
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
            // INSERT - Solo guardar campos de input, los calculados son automáticos
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
