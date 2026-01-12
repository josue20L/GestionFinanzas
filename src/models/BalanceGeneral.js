const db = require('../config/database');

class BalanceGeneral {
    // Obtener balance general por período
    static async getByIdPeriodo(idPeriodo) {
        try {
            const [rows] = await db.query(`
                SELECT bg.*, 
                       p.ANO, p.MES,
                       e.NOMBRE_EMPRESA
                FROM BALANCEGENERAL bg
                INNER JOIN PERIODOFINANCIERO p ON bg.ID_PERIODO = p.ID_PERIODO
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE bg.ID_PERIODO = ?
            `, [idPeriodo]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener balance general: ${error.message}`);
        }
    }

    // Crear o actualizar balance general
    static async createOrUpdate(idPeriodo, datos) {
        try {
            // Verificar si ya existe
            const existente = await this.getByIdPeriodo(idPeriodo);
            
            if (existente) {
                // Actualizar
                const [result] = await db.query(`
                    UPDATE BALANCEGENERAL SET
                        DISPONIBLE = ?,
                        EXIGIBLE = ?,
                        REALIZABLE = ?,
                        ACTIVO_FIJO_TANGIBLE = ?,
                        ACTIVO_DIFERIDO = ?,
                        OTROS_ACTIVOS = ?,
                        PASIVO_CORRIENTE = ?,
                        PREVISION_BENEFICIOS_SOCIALES = ?,
                        OBLIGACIONES_BANCARIAS = ?,
                        INTERESES_POR_PAGAR = ?,
                        PROCESOS_LEGALES = ?,
                        PATRIMONIO = ?
                    WHERE ID_PERIODO = ?
                `, [
                    datos.disponible || 0,
                    datos.exigible || 0,
                    datos.realizable || 0,
                    datos.activo_fijo_tangible || 0,
                    datos.activo_diferido || 0,
                    datos.otros_activos || 0,
                    datos.pasivo_corriente || 0,
                    datos.prevision_beneficios_sociales || 0,
                    datos.obligaciones_bancarias || 0,
                    datos.intereses_pagar || 0,
                    datos.procesos_legales || 0,
                    datos.patrimonio || 0,
                    idPeriodo
                ]);
                return result.affectedRows > 0;
            } else {
                // Crear
                const [result] = await db.query(`
                    INSERT INTO BALANCEGENERAL 
                    (ID_PERIODO, DISPONIBLE, EXIGIBLE, REALIZABLE, 
                     ACTIVO_FIJO_TANGIBLE, ACTIVO_DIFERIDO, OTROS_ACTIVOS,
                     PASIVO_CORRIENTE, PREVISION_BENEFICIOS_SOCIALES, OBLIGACIONES_BANCARIAS,
                     INTERESES_POR_PAGAR, PROCESOS_LEGALES, PATRIMONIO)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    idPeriodo,
                    datos.disponible || 0,
                    datos.exigible || 0,
                    datos.realizable || 0,
                    datos.activo_fijo_tangible || 0,
                    datos.activo_diferido || 0,
                    datos.otros_activos || 0,
                    datos.pasivo_corriente || 0,
                    datos.prevision_beneficios_sociales || 0,
                    datos.obligaciones_bancarias || 0,
                    datos.intereses_pagar || 0,
                    datos.procesos_legales || 0,
                    datos.patrimonio || 0
                ]);
                return result.insertId;
            }
        } catch (error) {
            throw new Error(`Error al guardar balance general: ${error.message}`);
        }
    }

    // Eliminar balance general
    static async delete(idPeriodo) {
        try {
            const [result] = await db.query('DELETE FROM BALANCEGENERAL WHERE ID_PERIODO = ?', [idPeriodo]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar balance general: ${error.message}`);
        }
    }

    // Obtener balances para consolidación
    static async getForConsolidacion(empresas, anio, mes) {
        try {
            const placeholders = empresas.map(() => '?').join(',');
            const [rows] = await db.query(`
                SELECT bg.*, e.NOMBRE_EMPRESA, e.ID_EMPRESA,
                       p.ANO, p.MES
                FROM BALANCEGENERAL bg
                INNER JOIN PERIODOFINANCIERO p ON bg.ID_PERIODO = p.ID_PERIODO
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE e.ID_EMPRESA IN (${placeholders}) 
                AND p.ANO = ? AND p.MES = ?
                ORDER BY e.NOMBRE_EMPRESA
            `, [...empresas, anio, mes]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener balances para consolidación: ${error.message}`);
        }
    }

    // Obtener balances para reportes
    static async getForReportes(idEmpresa, anioInicio, mesInicio, anioFin, mesFin) {
        try {
            const [rows] = await db.query(`
                SELECT bg.*, p.ANO, p.MES,
                       DATE_FORMAT(CONCAT(p.ANO, '-', p.MES, '-01'), '%Y-%m') as periodo
                FROM BALANCEGENERAL bg
                INNER JOIN PERIODOFINANCIERO p ON bg.ID_PERIODO = p.ID_PERIODO
                WHERE p.ID_EMPRESA = ?
                AND ((p.ANO = ? AND p.MES >= ?) OR (p.ANO > ? AND p.ANO < ?) OR (p.ANO = ? AND p.MES <= ?))
                ORDER BY p.ANO, p.MES
            `, [idEmpresa, anioInicio, mesInicio, anioInicio, anioFin, anioFin, mesFin]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener balances para reportes: ${error.message}`);
        }
    }

    // Obtener resumen para dashboard
    static async getResumen(idEmpresa, ultimosMeses = 12) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    bg.TOTAL_ACTIVO,
                    bg.TOTAL_PASIVO_PATRIMONIO,
                    bg.ACTIVO_CORRIENTE,
                    bg.PASIVO_CORRIENTE,
                    p.ANO,
                    p.MES,
                    CONCAT(p.ANO, '-', LPAD(p.MES, 2, '0')) as periodo
                FROM BALANCEGENERAL bg
                INNER JOIN PERIODOFINANCIERO p ON bg.ID_PERIODO = p.ID_PERIODO
                WHERE p.ID_EMPRESA = ?
                ORDER BY p.ANO DESC, p.MES DESC
                LIMIT ?
            `, [idEmpresa, ultimosMeses]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener resumen: ${error.message}`);
        }
    }

    // Copiar datos de período anterior
    static async copiarDesdePeriodoAnterior(idPeriodoActual, idPeriodoAnterior) {
        try {
            // Obtener datos del período anterior
            const datosAnterior = await this.getByIdPeriodo(idPeriodoAnterior);
            if (!datosAnterior) {
                throw new Error('No se encontraron datos en el período anterior');
            }

            // Crear en el período actual (sin los campos calculados)
            const [result] = await db.query(`
                INSERT INTO BALANCEGENERAL 
                (ID_PERIODO, DISPONIBLE, EXIGIBLE, REALIZABLE, 
                 ACTIVO_FIJO_TANGIBLE, ACTIVO_DIFERIDO, OTROS_ACTIVOS,
                 PASIVO_CORRIENTE, PREVISION_BENEFICIOS_SOCIALES, OBLIGACIONES_BANCARIAS,
                 INTERESES_POR_PAGAR, PROCESOS_LEGALES, PATRIMONIO)
                SELECT ?, DISPONIBLE, EXIGIBLE, REALIZABLE, 
                       ACTIVO_FIJO_TANGIBLE, ACTIVO_DIFERIDO, OTROS_ACTIVOS,
                       PASIVO_CORRIENTE, PREVISION_BENEFICIOS_SOCIALES, OBLIGACIONES_BANCARIAS,
                       INTERESES_POR_PAGAR, PROCESOS_LEGALES, PATRIMONIO
                FROM BALANCEGENERAL 
                WHERE ID_PERIODO = ?
            `, [idPeriodoActual, idPeriodoAnterior]);
            
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al copiar datos: ${error.message}`);
        }
    }

    // Calcular ratios financieros
    static async calcularRatios(idPeriodo) {
        try {
            const balance = await this.getByIdPeriodo(idPeriodo);
            if (!balance) {
                throw new Error('No se encontró balance para el período');
            }

            const ratios = {
                liquidez_corriente: balance.ACTIVO_CORRIENTE / balance.PASIVO_CORRIENTE,
                prueba_acida: (balance.ACTIVO_CORRIENTE - balance.REALIZABLE) / balance.PASIVO_CORRIENTE,
                endeudamiento: (balance.PASIVO_CORRIENTE + balance.PASIVO_NO_CORRIENTE) / balance.TOTAL_ACTIVO,
                apalancamiento: balance.TOTAL_ACTIVO / balance.PATRIMONIO
            };

            return ratios;
        } catch (error) {
            throw new Error(`Error al calcular ratios: ${error.message}`);
        }
    }
}

module.exports = BalanceGeneral;
