const db = require('../config/database');

class EstadoResultado {
    // Obtener estado de resultados por período
    static async getByIdPeriodo(idPeriodo) {
        try {
            const [rows] = await db.query(`
                SELECT er.*, 
                       p.ANO, p.MES,
                       e.NOMBRE_EMPRESA
                FROM ESTADORESULTADO er
                INNER JOIN PERIODOFINANCIERO p ON er.ID_PERIODO = p.ID_PERIODO
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE er.ID_PERIODO = ?
            `, [idPeriodo]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener estado de resultados: ${error.message}`);
        }
    }

    // Crear o actualizar estado de resultados
    static async createOrUpdate(idPeriodo, datos) {
        try {
            // Verificar si ya existe
            const existente = await this.getByIdPeriodo(idPeriodo);
            
            if (existente) {
                // Actualizar
                const [result] = await db.query(`
                    UPDATE ESTADORESULTADO SET
                        VENTAS_NETAS = ?,
                        COSTO_VENTAS = ?,
                        GASTO_ADMINISTRATIVO = ?,
                        GASTO_COMERCIALIZACION = ?,
                        GASTO_SIG = ?,
                        GASTO_TRIBUTARIO = ?,
                        GASTO_FINANCIERO = ?,
                        OTROS_INGRESOS = ?,
                        OTROS_EGRESOS = ?
                    WHERE ID_PERIODO = ?
                `, [
                    datos.ventas_netas || 0,
                    datos.costo_ventas || 0,
                    datos.gasto_administrativo || 0,
                    datos.gasto_comercializacion || 0,
                    datos.gasto_sig || 0,
                    datos.gasto_tributario || 0,
                    datos.gasto_financiero || 0,
                    datos.otros_ingresos || 0,
                    datos.otros_egresos || 0,
                    idPeriodo
                ]);
                return result.affectedRows > 0;
            } else {
                // Crear
                const [result] = await db.query(`
                    INSERT INTO ESTADORESULTADO 
                    (ID_PERIODO, VENTAS_NETAS, COSTO_VENTAS, GASTO_ADMINISTRATIVO, 
                     GASTO_COMERCIALIZACION, GASTO_SIG, GASTO_TRIBUTARIO, 
                     GASTO_FINANCIERO, OTROS_INGRESOS, OTROS_EGRESOS)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    idPeriodo,
                    datos.ventas_netas || 0,
                    datos.costo_ventas || 0,
                    datos.gasto_administrativo || 0,
                    datos.gasto_comercializacion || 0,
                    datos.gasto_sig || 0,
                    datos.gasto_tributario || 0,
                    datos.gasto_financiero || 0,
                    datos.otros_ingresos || 0,
                    datos.otros_egresos || 0
                ]);
                return result.insertId;
            }
        } catch (error) {
            throw new Error(`Error al guardar estado de resultados: ${error.message}`);
        }
    }

    // Eliminar estado de resultados
    static async delete(idPeriodo) {
        try {
            const [result] = await db.query('DELETE FROM ESTADORESULTADO WHERE ID_PERIODO = ?', [idPeriodo]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar estado de resultados: ${error.message}`);
        }
    }

    // Obtener estados de resultados para consolidación
    static async getForConsolidacion(empresas, anio, mes) {
        try {
            const placeholders = empresas.map(() => '?').join(',');
            const [rows] = await db.query(`
                SELECT er.*, e.NOMBRE_EMPRESA, e.ID_EMPRESA,
                       p.ANO, p.MES
                FROM ESTADORESULTADO er
                INNER JOIN PERIODOFINANCIERO p ON er.ID_PERIODO = p.ID_PERIODO
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE e.ID_EMPRESA IN (${placeholders}) 
                AND p.ANO = ? AND p.MES = ?
                ORDER BY e.NOMBRE_EMPRESA
            `, [...empresas, anio, mes]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener estados para consolidación: ${error.message}`);
        }
    }

    // Obtener estados de resultados para reportes (rango de fechas)
    static async getForReportes(idEmpresa, anioInicio, mesInicio, anioFin, mesFin) {
        try {
            const [rows] = await db.query(`
                SELECT er.*, p.ANO, p.MES,
                       DATE_FORMAT(CONCAT(p.ANO, '-', p.MES, '-01'), '%Y-%m') as periodo
                FROM ESTADORESULTADO er
                INNER JOIN PERIODOFINANCIERO p ON er.ID_PERIODO = p.ID_PERIODO
                WHERE p.ID_EMPRESA = ?
                AND ((p.ANO = ? AND p.MES >= ?) OR (p.ANO > ? AND p.ANO < ?) OR (p.ANO = ? AND p.MES <= ?))
                ORDER BY p.ANO, p.MES
            `, [idEmpresa, anioInicio, mesInicio, anioInicio, anioFin, anioFin, mesFin]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener estados para reportes: ${error.message}`);
        }
    }

    // Obtener resumen para dashboard
    static async getResumen(idEmpresa, ultimosMeses = 12) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    er.UTILIDAD_NETA,
                    er.VENTAS_NETAS,
                    er.EBIT,
                    p.ANO,
                    p.MES,
                    CONCAT(p.ANO, '-', LPAD(p.MES, 2, '0')) as periodo
                FROM ESTADORESULTADO er
                INNER JOIN PERIODOFINANCIERO p ON er.ID_PERIODO = p.ID_PERIODO
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
                INSERT INTO ESTADORESULTADO 
                (ID_PERIODO, VENTAS_NETAS, COSTO_VENTAS, GASTO_ADMINISTRATIVO, 
                 GASTO_COMERCIALIZACION, GASTO_SIG, GASTO_TRIBUTARIO, 
                 GASTO_FINANCIERO, OTROS_INGRESOS, OTROS_EGRESOS)
                SELECT ?, VENTAS_NETAS, COSTO_VENTAS, GASTO_ADMINISTRATIVO, 
                       GASTO_COMERCIALIZACION, GASTO_SIG, GASTO_TRIBUTARIO, 
                       GASTO_FINANCIERO, OTROS_INGRESOS, OTROS_EGRESOS
                FROM ESTADORESULTADO 
                WHERE ID_PERIODO = ?
            `, [idPeriodoActual, idPeriodoAnterior]);
            
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al copiar datos: ${error.message}`);
        }
    }
}

module.exports = EstadoResultado;
