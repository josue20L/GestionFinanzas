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
     * Consolida (suma) los datos de multiples registros de flujo operativo
     * @param {Array} rows - Registros de flujo operativo
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

module.exports = FlujoOperativoService;
