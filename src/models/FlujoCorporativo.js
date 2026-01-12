const db = require('../config/database');

class FlujoCorporativo {
    // Obtener flujo corporativo por período
    static async getByIdPeriodo(idPeriodo) {
        try {
            const [rows] = await db.query(`
                SELECT fc.*, 
                       p.ANO, p.MES,
                       e.NOMBRE_EMPRESA
                FROM FLUJOCORPORATIVO fc
                INNER JOIN PERIODOFINANCIERO p ON fc.ID_PERIODO = p.ID_PERIODO
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE fc.ID_PERIODO = ?
            `, [idPeriodo]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener flujo corporativo: ${error.message}`);
        }
    }

    // Crear o actualizar flujo corporativo
    static async createOrUpdate(idPeriodo, datos) {
        try {
            // Verificar si ya existe
            const existente = await this.getByIdPeriodo(idPeriodo);
            
            if (existente) {
                // Actualizar
                const [result] = await db.query(`
                    UPDATE FLUJOCORPORATIVO SET
                        TRANSFERENCIA_FONDOS = ?,
                        DESEMBOLSOS_BANCARIOS = ?,
                        OTROS_INGRESOS = ?,
                        PRESTAMOS_BANCARIOS = ?,
                        INVERSIONES = ?,
                        RPR_CONSULTORES = ?,
                        BONOS_PLRS = ?,
                        DIVIDENDOS_PAGAR = ?,
                        CUENTAS_PAGAR = ?,
                        AGUINALDOS = ?,
                        FINIQUITOS = ?,
                        PRIMAS = ?,
                        RETROACTIVOS = ?,
                        IUE = ?,
                        OTROS_GASTOS = ?,
                        SALDO_ANTERIOR = ?
                    WHERE ID_PERIODO = ?
                `, [
                    datos.transferencia_fondos || 0,
                    datos.desembolsos_bancarios || 0,
                    datos.otros_ingresos || 0,
                    datos.prestamos_bancarios || 0,
                    datos.inversiones || 0,
                    datos.rpr_consultores || 0,
                    datos.bonos_plrs || 0,
                    datos.dividendos_pagar || 0,
                    datos.cuentas_pagar || 0,
                    datos.aguinaldos || 0,
                    datos.finiquitos || 0,
                    datos.primas || 0,
                    datos.retroactivos || 0,
                    datos.iue || 0,
                    datos.otros_gastos || 0,
                    datos.saldo_anterior || 0,
                    idPeriodo
                ]);
                return result.affectedRows > 0;
            } else {
                // Crear
                const [result] = await db.query(`
                    INSERT INTO FLUJOCORPORATIVO 
                    (ID_PERIODO, TRANSFERENCIA_FONDOS, DESEMBOLSOS_BANCARIOS, OTROS_INGRESOS,
                     PRESTAMOS_BANCARIOS, INVERSIONES, RPR_CONSULTORES, BONOS_PLRS,
                     DIVIDENDOS_PAGAR, CUENTAS_PAGAR, AGUINALDOS, FINIQUITOS,
                     PRIMAS, RETROACTIVOS, IUE, OTROS_GASTOS, SALDO_ANTERIOR)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    idPeriodo,
                    datos.transferencia_fondos || 0,
                    datos.desembolsos_bancarios || 0,
                    datos.otros_ingresos || 0,
                    datos.prestamos_bancarios || 0,
                    datos.inversiones || 0,
                    datos.rpr_consultores || 0,
                    datos.bonos_plrs || 0,
                    datos.dividendos_pagar || 0,
                    datos.cuentas_pagar || 0,
                    datos.aguinaldos || 0,
                    datos.finiquitos || 0,
                    datos.primas || 0,
                    datos.retroactivos || 0,
                    datos.iue || 0,
                    datos.otros_gastos || 0,
                    datos.saldo_anterior || 0
                ]);
                return result.insertId;
            }
        } catch (error) {
            throw new Error(`Error al guardar flujo corporativo: ${error.message}`);
        }
    }

    // Eliminar flujo corporativo
    static async delete(idPeriodo) {
        try {
            const [result] = await db.query('DELETE FROM FLUJOCORPORATIVO WHERE ID_PERIODO = ?', [idPeriodo]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    // Obtener flujos para consolidación
    static async getForConsolidacion(empresas, anio, mes) {
        try {
            const placeholders = empresas.map(() => '?').join(',');
            const [rows] = await db.query(`
                SELECT fc.*, e.NOMBRE_EMPRESA, e.ID_EMPRESA,
                       p.ANO, p.MES
                FROM FLUJOCORPORATIVO fc
                INNER JOIN PERIODOFINANCIERO p ON fc.ID_PERIODO = p.ID_PERIODO
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
                SELECT fc.*, p.ANO, p.MES,
                       DATE_FORMAT(CONCAT(p.ANO, '-', p.MES, '-01'), '%Y-%m') as periodo
                FROM FLUJOCORPORATIVO fc
                INNER JOIN PERIODOFINANCIERO p ON fc.ID_PERIODO = p.ID_PERIODO
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
                    fc.SALDO_ACTUAL,
                    fc.TOTAL_INGRESOS,
                    fc.TOTAL_EGRESOS,
                    p.ANO,
                    p.MES,
                    CONCAT(p.ANO, '-', LPAD(p.MES, 2, '0')) as periodo
                FROM FLUJOCORPORATIVO fc
                INNER JOIN PERIODOFINANCIERO p ON fc.ID_PERIODO = p.ID_PERIODO
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
                INSERT INTO FLUJOCORPORATIVO 
                (ID_PERIODO, TRANSFERENCIA_FONDOS, DESEMBOLSOS_BANCARIOS, OTROS_INGRESOS,
                 PRESTAMOS_BANCARIOS, INVERSIONES, RPR_CONSULTORES, BONOS_PLRS,
                 DIVIDENDOS_PAGAR, CUENTAS_PAGAR, AGUINALDOS, FINIQUITOS,
                 PRIMAS, RETROACTIVOS, IUE, OTROS_GASTOS, SALDO_ANTERIOR)
                SELECT ?, TRANSFERENCIA_FONDOS, DESEMBOLSOS_BANCARIOS, OTROS_INGRESOS,
                       PRESTAMOS_BANCARIOS, INVERSIONES, RPR_CONSULTORES, BONOS_PLRS,
                       DIVIDENDOS_PAGAR, CUENTAS_PAGAR, AGUINALDOS, FINIQUITOS,
                       PRIMAS, RETROACTIVOS, IUE, OTROS_GASTOS, SALDO_ANTERIOR
                FROM FLUJOCORPORATIVO 
                WHERE ID_PERIODO = ?
            `, [idPeriodoActual, idPeriodoAnterior]);
            
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al copiar datos: ${error.message}`);
        }
    }

    // Obtener análisis de egresos
    static async getAnalisisEgresos(idEmpresa, anio, mes) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    fc.PRESTAMOS_BANCARIOS,
                    fc.INVERSIONES,
                    fc.RPR_CONSULTORES,
                    fc.BONOS_PLRS,
                    fc.DIVIDENDOS_PAGAR,
                    fc.CUENTAS_PAGAR,
                    fc.AGUINALDOS,
                    fc.FINIQUITOS,
                    fc.PRIMAS,
                    fc.RETROACTIVOS,
                    fc.IUE,
                    fc.OTROS_GASTOS,
                    fc.TOTAL_EGRESOS,
                    p.ANO,
                    p.MES
                FROM FLUJOCORPORATIVO fc
                INNER JOIN PERIODOFINANCIERO p ON fc.ID_PERIODO = p.ID_PERIODO
                WHERE p.ID_EMPRESA = ? AND p.ANO = ? AND p.MES = ?
            `, [idEmpresa, anio, mes]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener análisis de egresos: ${error.message}`);
        }
    }
}

module.exports = FlujoCorporativo;
