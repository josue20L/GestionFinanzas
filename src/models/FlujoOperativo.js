const db = require('../config/database');

class FlujoOperativo {
    // Obtener flujo operativo por período
    static async getByIdPeriodo(idPeriodo) {
        try {
            const [rows] = await db.query(`
                SELECT fo.*, 
                       p.ANO, p.MES,
                       e.NOMBRE_EMPRESA
                FROM FLUJOOPERATIVO fo
                INNER JOIN PERIODOFINANCIERO p ON fo.ID_PERIODO = p.ID_PERIODO
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE fo.ID_PERIODO = ?
            `, [idPeriodo]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener flujo operativo: ${error.message}`);
        }
    }

    // Crear o actualizar flujo operativo
    static async createOrUpdate(idPeriodo, datos) {
        try {
            // Verificar si ya existe
            const existente = await this.getByIdPeriodo(idPeriodo);
            
            if (existente) {
                // Actualizar
                const [result] = await db.query(`
                    UPDATE FLUJOOPERATIVO SET
                        VENTAS = ?,
                        VENTAS_EXPORTACION = ?,
                        CARTERA = ?,
                        TRANSPORTES_ING = ?,
                        OTROS_INGRESOS = ?,
                        GASTOS_ADMINISTRATIVOS = ?,
                        GASTOS_COMERCIALES = ?,
                        GASTOS_PRODUCCION = ?,
                        ENVIOS_CTA_CORP = ?,
                        IMPUESTOS = ?,
                        TRANSPORTES_EGR = ?,
                        CUENTAS_POR_PAGAR = ?,
                        INVERSIONES = ?,
                        OTROS_GASTOS = ?,
                        SALDO_ANTERIOR = ?
                    WHERE ID_PERIODO = ?
                `, [
                    datos.ventas || 0,
                    datos.ventas_exportacion || 0,
                    datos.cartera || 0,
                    datos.transportes_ing || 0,
                    datos.otros_ingresos || 0,
                    datos.gastos_administrativos || 0,
                    datos.gastos_comerciales || 0,
                    datos.gastos_produccion || 0,
                    datos.envios_cta_corp || 0,
                    datos.impuestos || 0,
                    datos.transportes_egr || 0,
                    datos.cuentas_por_pagar || 0,
                    datos.inversiones || 0,
                    datos.otros_gastos || 0,
                    datos.saldo_anterior || 0,
                    idPeriodo
                ]);
                return result.affectedRows > 0;
            } else {
                // Crear
                const [result] = await db.query(`
                    INSERT INTO FLUJOOPERATIVO 
                    (ID_PERIODO, VENTAS, VENTAS_EXPORTACION, CARTERA, TRANSPORTES_ING, 
                     OTROS_INGRESOS, GASTOS_ADMINISTRATIVOS, GASTOS_COMERCIALES, GASTOS_PRODUCCION,
                     ENVIOS_CTA_CORP, IMPUESTOS, TRANSPORTES_EGR, CUENTAS_POR_PAGAR,
                     INVERSIONES, OTROS_GASTOS, SALDO_ANTERIOR)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    idPeriodo,
                    datos.ventas || 0,
                    datos.ventas_exportacion || 0,
                    datos.cartera || 0,
                    datos.transportes_ing || 0,
                    datos.otros_ingresos || 0,
                    datos.gastos_administrativos || 0,
                    datos.gastos_comerciales || 0,
                    datos.gastos_produccion || 0,
                    datos.envios_cta_corp || 0,
                    datos.impuestos || 0,
                    datos.transportes_egr || 0,
                    datos.cuentas_por_pagar || 0,
                    datos.inversiones || 0,
                    datos.otros_gastos || 0,
                    datos.saldo_anterior || 0
                ]);
                return result.insertId;
            }
        } catch (error) {
            throw new Error(`Error al guardar flujo operativo: ${error.message}`);
        }
    }

    // Eliminar flujo operativo
    static async delete(idPeriodo) {
        try {
            const [result] = await db.query('DELETE FROM FLUJOOPERATIVO WHERE ID_PERIODO = ?', [idPeriodo]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar flujo operativo: ${error.message}`);
        }
    }

    // Obtener flujos para consolidación
    static async getForConsolidacion(empresas, anio, mes) {
        try {
            const placeholders = empresas.map(() => '?').join(',');
            const [rows] = await db.query(`
                SELECT fo.*, e.NOMBRE_EMPRESA, e.ID_EMPRESA,
                       p.ANO, p.MES
                FROM FLUJOOPERATIVO fo
                INNER JOIN PERIODOFINANCIERO p ON fo.ID_PERIODO = p.ID_PERIODO
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE e.ID_EMPRESA IN (${placeholders}) 
                AND p.ANO = ? AND p.MES = ?
                ORDER BY e.NOMBRE_EMPRESA
            `, [...empresas, anio, mes]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener flujos para consolidación: ${error.message}`);
        }
    }

    // Obtener flujos para reportes
    static async getForReportes(idEmpresa, anioInicio, mesInicio, anioFin, mesFin) {
        try {
            const [rows] = await db.query(`
                SELECT fo.*, p.ANO, p.MES,
                       DATE_FORMAT(CONCAT(p.ANO, '-', p.MES, '-01'), '%Y-%m') as periodo
                FROM FLUJOOPERATIVO fo
                INNER JOIN PERIODOFINANCIERO p ON fo.ID_PERIODO = p.ID_PERIODO
                WHERE p.ID_EMPRESA = ?
                AND ((p.ANO = ? AND p.MES >= ?) OR (p.ANO > ? AND p.ANO < ?) OR (p.ANO = ? AND p.MES <= ?))
                ORDER BY p.ANO, p.MES
            `, [idEmpresa, anioInicio, mesInicio, anioInicio, anioFin, anioFin, mesFin]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener flujos para reportes: ${error.message}`);
        }
    }

    // Obtener resumen para dashboard
    static async getResumen(idEmpresa, ultimosMeses = 12) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    fo.SALDO_ACTUAL,
                    fo.TOTAL_INGRESOS,
                    fo.TOTAL_EGRESOS,
                    p.ANO,
                    p.MES,
                    CONCAT(p.ANO, '-', LPAD(p.MES, 2, '0')) as periodo
                FROM FLUJOOPERATIVO fo
                INNER JOIN PERIODOFINANCIERO p ON fo.ID_PERIODO = p.ID_PERIODO
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
                INSERT INTO FLUJOOPERATIVO 
                (ID_PERIODO, VENTAS, VENTAS_EXPORTACION, CARTERA, TRANSPORTES_ING, 
                 OTROS_INGRESOS, GASTOS_ADMINISTRATIVOS, GASTOS_COMERCIALES, GASTOS_PRODUCCION,
                 ENVIOS_CTA_CORP, IMPUESTOS, TRANSPORTES_EGR, CUENTAS_POR_PAGAR,
                 INVERSIONES, OTROS_GASTOS, SALDO_ANTERIOR)
                SELECT ?, VENTAS, VENTAS_EXPORTACION, CARTERA, TRANSPORTES_ING, 
                       OTROS_INGRESOS, GASTOS_ADMINISTRATIVOS, GASTOS_COMERCIALES, GASTOS_PRODUCCION,
                       ENVIOS_CTA_CORP, IMPUESTOS, TRANSPORTES_EGR, CUENTAS_POR_PAGAR,
                       INVERSIONES, OTROS_GASTOS, SALDO_ANTERIOR
                FROM FLUJOOPERATIVO 
                WHERE ID_PERIODO = ?
            `, [idPeriodoActual, idPeriodoAnterior]);
            
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al copiar datos: ${error.message}`);
        }
    }

    // Obtener tendencia de saldos
    static async getTendenciaSaldos(idEmpresa, meses = 12) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    fo.SALDO_ACTUAL,
                    fo.TOTAL_INGRESOS,
                    fo.TOTAL_EGRESOS,
                    p.ANO,
                    p.MES,
                    CONCAT(p.ANO, '-', LPAD(p.MES, 2, '0')) as periodo,
                    DATE_FORMAT(CONCAT(p.ANO, '-', p.MES, '-01'), '%Y-%m') as fecha
                FROM FLUJOOPERATIVO fo
                INNER JOIN PERIODOFINANCIERO p ON fo.ID_PERIODO = p.ID_PERIODO
                WHERE p.ID_EMPRESA = ?
                ORDER BY p.ANO DESC, p.MES DESC
                LIMIT ?
            `, [idEmpresa, meses]);
            return rows.reverse(); // Orden cronológico
        } catch (error) {
            throw new Error(`Error al obtener tendencia: ${error.message}`);
        }
    }
}

module.exports = FlujoOperativo;
