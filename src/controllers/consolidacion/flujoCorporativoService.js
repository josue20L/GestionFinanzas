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
     * Consolida (suma) los datos de multiples registros de flujo corporativo
     * @param {Array} rows - Registros de flujo corporativo
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

module.exports = FlujoCorporativoService;
