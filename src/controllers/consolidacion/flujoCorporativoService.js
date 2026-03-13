const FlujoCorporativo = require('../../models/FlujoCorporativo');

/**
 * Servicio para procesar datos de Flujo Corporativo en consolidacion
 */
class FlujoCorporativoService {
    /**
     * Obtiene y consolida datos de flujo corporativo para un periodo especifico
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {number} anio - Ano del periodo
     * @param {number} mes - Mes del periodo
     * @returns {Object} Datos consolidados del flujo corporativo
     */
    async obtenerDatosPeriodo(empresasIds, anio, mes) {
        try {
            console.log(`📊 Obteniendo FC para ${anio}-${mes} de empresas:`, empresasIds);

            const fcRows = await FlujoCorporativo.getForConsolidacion(empresasIds, anio, mes);
            console.log(`📈 FC obtenidos: ${fcRows.length} registros para ${anio}-${mes}`);

            return this.consolidarDatos(fcRows);
        } catch (error) {
            console.error(`Error al obtener FC para ${anio}-${mes}:`, error);
            throw new Error(`Error al obtener flujo corporativo para ${anio}-${mes}: ${error.message}`);
        }
    }

    /**
     * Consolida los datos de flujo corporativo aplicando las reglas de negocio
     * @param {Array} rows - Registros de flujo corporativo
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
        // Total Ingresos = Transferencia Fondos + Desembolsos Bancarios + Otros Ingresos
        totals.TOTAL_INGRESOS = 
            (totals.TRANSFERENCIA_FONDOS || 0) +
            (totals.DESEMBOLSOS_BANCARIOS || 0) +
            (totals.OTROS_INGRESOS || 0);

        // Total Egresos = Suma de todos los gastos/egresos
        totals.TOTAL_EGRESOS = 
            (totals.PRESTAMOS_BANCARIOS || 0) +
            (totals.INVERSIONES || 0) +
            (totals.RPR_CONSULTORES || 0) +
            (totals.BONOS_PLRS || 0) +
            (totals.DIVIDENDOS_PAGAR || 0) +
            (totals.CUENTAS_PAGAR || 0) +
            (totals.AGUINALDOS || 0) +
            (totals.FINIQUITOS || 0) +
            (totals.PRIMAS || 0) +
            (totals.RETROACTIVOS || 0) +
            (totals.IUE || 0) +
            (totals.OTROS_GASTOS || 0);

        // Saldo Actual = Saldo Anterior + Total Ingresos - Total Egresos
        totals.SALDO_ACTUAL = (totals.SALDO_ANTERIOR || 0) + totals.TOTAL_INGRESOS - totals.TOTAL_EGRESOS;

        return totals;
    }
}

module.exports = FlujoCorporativoService;
