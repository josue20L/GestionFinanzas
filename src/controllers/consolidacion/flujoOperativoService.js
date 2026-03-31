const FlujoOperativo = require('../../models/FlujoOperativo');

/**
 * Servicio para procesar datos de Flujo Operativo en consolidacion
 */
class FlujoOperativoService {
    /**
     * Obtiene y consolida datos de flujo operativo para un periodo especifico
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {number} anio - Ano del periodo
     * @param {number} mes - Mes del periodo
     * @returns {Object} Datos consolidados del flujo operativo
     */
    async obtenerDatosPeriodo(empresasIds, anio, mes) {
        try {
            console.log(`📊 Obteniendo FO para ${anio}-${mes} de empresas:`, empresasIds);

            const foRows = await FlujoOperativo.getForConsolidacion(empresasIds, anio, mes);
            console.log(`📈 FO obtenidos: ${foRows.length} registros para ${anio}-${mes}`);

            return this.consolidarDatos(foRows);
        } catch (error) {
            console.error(`Error al obtener FO para ${anio}-${mes}:`, error);
            throw new Error(`Error al obtener flujo operativo para ${anio}-${mes}: ${error.message}`);
        }
    }

    /**
     * Consolida los datos de flujo operativo aplicando las reglas de negocio
     * @param {Array} rows - Registros de flujo operativo
     * @returns {Object} Datos consolidados con campos calculados
     */
    consolidarDatos(rows) {
        const totals = {};
        if (!Array.isArray(rows)) return totals;

        // Primero sumar los campos base (no calculados)
        for (const row of rows) {
            if (!row) continue;
            for (const [key, value] of Object.entries(row)) {
                if (
                    key.startsWith('ID_') ||
                    key === 'NOMBRE_EMPRESA' ||
                    key === 'ID_EMPRESA' ||
                    key === 'ANO' ||
                    key === 'MES' ||
                    key === 'periodo' ||
                    key === 'TOTAL_INGRESOS' ||  // Campos calculados que se ignoran
                    key === 'TOTAL_EGRESOS' ||
                    key === 'SALDO_ACTUAL'
                ) {
                    continue;
                }

                const n = Number(value);
                if (Number.isFinite(n)) {
                    // SALDO_ANTERIOR es estado_inicio -> tomar valor del primer mes (no sumar)
                    if (key === 'SALDO_ANTERIOR') {
                        if (!totals.hasOwnProperty(key)) {
                            totals[key] = n; // Solo tomar el primer valor
                        }
                    } else {
                        // Demás campos son flujo -> sumar
                        totals[key] = (totals[key] || 0) + n;
                    }
                }
            }
        }

        // Aplicar reglas de consolidación
        // Total Ingresos = SUMA de todos los ingresos
        totals.TOTAL_INGRESOS = 
            (totals.VENTAS || 0) +
            (totals.VENTAS_EXPORTACION || 0) +
            (totals.CARTERA || 0) +
            (totals.TRANSPORTES_ING || 0) +
            (totals.OTROS_INGRESOS || 0);

        // Total Egresos = SUMA de todos los egresos
        totals.TOTAL_EGRESOS = 
            (totals.GASTOS_ADMINISTRATIVOS || 0) +
            (totals.GASTOS_COMERCIALES || 0) +
            (totals.GASTOS_PRODUCCION || 0) +
            (totals.ENVIOS_CTA_CORP || 0) +
            (totals.IMPUESTOS || 0) +
            (totals.TRANSPORTES_EGR || 0) +
            (totals.CUENTAS_POR_PAGAR || 0) +
            (totals.INVERSIONES || 0) +
            (totals.OTROS_GASTOS || 0);

        // Saldo Actual = Saldo Anterior + Total Ingresos - Total Egresos
        totals.SALDO_ACTUAL = (totals.SALDO_ANTERIOR || 0) + totals.TOTAL_INGRESOS - totals.TOTAL_EGRESOS;

        return totals;
    }
}

module.exports = FlujoOperativoService;
