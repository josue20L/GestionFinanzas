const BalanceGeneral = require('../../models/BalanceGeneral');

/**
 * Servicio para procesar datos de Balance General en consolidacion
 */
class BalanceGeneralService {
    /**
     * Obtiene y consolida datos de balance general para un periodo especifico
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {number} anio - Ano del periodo
     * @param {number} mes - Mes del periodo
     * @returns {Object} Datos consolidados del balance general
     */
    async obtenerDatosPeriodo(empresasIds, anio, mes) {
        try {
            console.log(`📊 Obteniendo BG para ${anio}-${mes} de empresas:`, empresasIds);

            const bgRows = await BalanceGeneral.getForConsolidacion(empresasIds, anio, mes);
            console.log(`📈 BG obtenidos: ${bgRows.length} registros para ${anio}-${mes}`);

            return this.consolidarDatos(bgRows);
        } catch (error) {
            console.error(`Error al obtener BG para ${anio}-${mes}:`, error);
            throw new Error(`Error al obtener balance general para ${anio}-${mes}: ${error.message}`);
        }
    }

    /**
     * Consolida (suma) los datos de multiples registros de balance general
     * @param {Array} rows - Registros de balance general
     * @returns {Object} Datos consolidados
     */
    consolidarDatos(rows) {
        const totals = {};
        if (!Array.isArray(rows)) return totals;

        for (const row of rows) {
            if (!row) continue;
            for (const [key, value] of Object.entries(row)) {
                if (
                    key.startsWith('ID_') ||
                    key === 'NOMBRE_EMPRESA' ||
                    key === 'ID_EMPRESA' ||
                    key === 'ANO' ||
                    key === 'MES' ||
                    key === 'periodo'
                ) {
                    continue;
                }

                const n = Number(value);
                if (Number.isFinite(n)) {
                    totals[key] = (totals[key] || 0) + n;
                }
            }
        }

        return totals;
    }
}

module.exports = BalanceGeneralService;
