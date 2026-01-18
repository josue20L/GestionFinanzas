const EstadoResultado = require('../../models/EstadoResultado');

/**
 * Servicio para procesar datos de Estado de Resultados en consolidación
 */
class EstadoResultadosService {
    /**
     * Obtiene y consolida datos de estado de resultados para un período específico
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {number} anio - Año del período
     * @param {number} mes - Mes del período
     * @returns {Object} Datos consolidados del estado de resultados
     */
    async obtenerDatosPeriodo(empresasIds, anio, mes) {
        try {
            console.log(`📊 Obteniendo ER para ${anio}-${mes} de empresas:`, empresasIds);
            
            const erRows = await EstadoResultado.getForConsolidacion(empresasIds, anio, mes);
            console.log(`📈 ER obtenidos: ${erRows.length} registros para ${anio}-${mes}`);
            
            return this.consolidarDatos(erRows);
        } catch (error) {
            console.error(`Error al obtener ER para ${anio}-${mes}:`, error);
            throw new Error(`Error al obtener estado de resultados para ${anio}-${mes}: ${error.message}`);
        }
    }

    /**
     * Consolida (suma) los datos de múltiples registros de estado de resultados
     * @param {Array} rows - Registros de estado de resultados
     * @returns {Object} Datos consolidados
     */
    consolidarDatos(rows) {
        const consolidado = {
            VENTAS_NETAS: 0,
            COSTO_VENTAS: 0,
            GASTO_ADMINISTRATIVO: 0,
            GASTO_COMERCIALIZACION: 0,
            GASTO_SIG: 0,
            EBIT: 0,
            GASTO_TRIBUTARIO: 0,
            GASTO_FINANCIERO: 0,
            OTROS_INGRESOS: 0,
            OTROS_EGRESOS: 0
        };

        if (!Array.isArray(rows)) return consolidado;

        for (const row of rows) {
            if (!row) continue;
            
            for (const [key, value] of Object.entries(row)) {
                if (key.startsWith('ID_') || 
                    key === 'NOMBRE_EMPRESA' || 
                    key === 'ID_EMPRESA' || 
                    key === 'ANO' || 
                    key === 'MES' || 
                    key === 'periodo') {
                    continue;
                }

                const n = Number(value);
                if (Number.isFinite(n) && consolidado.hasOwnProperty(key)) {
                    consolidado[key] += n;
                }
            }
        }

        return consolidado;
    }

    /**
     * Inicializa la estructura de datos por períodos para estado de resultados
     * @returns {Object} Estructura vacía para datos por períodos
     */
    inicializarDatosPorPeriodo() {
        return {
            periodos: [],
            ventasNetas: [],
            costoVentas: [],
            gastoAdministrativo: [],
            gastoComercializacion: [],
            gastoSig: [],
            ebit: [],
            gastoTributario: [],
            gastoFinanciero: [],
            otrosIngresos: [],
            otrosEgresos: []
        };
    }

    /**
     * Agrega datos de un período a la estructura de datos por períodos
     * @param {Object} datosPorPeriodo - Estructura actual
     * @param {string} periodo - Identificador del período
     * @param {Object} datosPeriodo - Datos del período
     */
    agregarPeriodo(datosPorPeriodo, periodo, datosPeriodo) {
        datosPorPeriodo.periodos.push(periodo);
        datosPorPeriodo.ventasNetas.push(datosPeriodo.VENTAS_NETAS || 0);
        datosPorPeriodo.costoVentas.push(datosPeriodo.COSTO_VENTAS || 0);
        datosPorPeriodo.gastoAdministrativo.push(datosPeriodo.GASTO_ADMINISTRATIVO || 0);
        datosPorPeriodo.gastoComercializacion.push(datosPeriodo.GASTO_COMERCIALIZACION || 0);
        datosPorPeriodo.gastoSig.push(datosPeriodo.GASTO_SIG || 0);
        datosPorPeriodo.ebit.push(datosPeriodo.EBIT || 0);
        datosPorPeriodo.gastoTributario.push(datosPeriodo.GASTO_TRIBUTARIO || 0);
        datosPorPeriodo.gastoFinanciero.push(datosPeriodo.GASTO_FINANCIERO || 0);
        datosPorPeriodo.otrosIngresos.push(datosPeriodo.OTROS_INGRESOS || 0);
        datosPorPeriodo.otrosEgresos.push(datosPeriodo.OTROS_EGRESOS || 0);
    }

    /**
     * Genera resumen consolidado para compatibilidad con otros tabs
     * @param {Object} datosPorPeriodo - Datos por períodos
     * @returns {Object} Resumen consolidado
     */
    generarResumen(datosPorPeriodo) {
        return {
            VENTAS_NETAS: datosPorPeriodo.ventasNetas.reduce((a, b) => a + b, 0),
            COSTO_VENTAS: datosPorPeriodo.costoVentas.reduce((a, b) => a + b, 0),
            GASTO_ADMINISTRATIVO: datosPorPeriodo.gastoAdministrativo.reduce((a, b) => a + b, 0),
            GASTO_COMERCIALIZACION: datosPorPeriodo.gastoComercializacion.reduce((a, b) => a + b, 0),
            GASTO_SIG: datosPorPeriodo.gastoSig.reduce((a, b) => a + b, 0),
            EBIT: datosPorPeriodo.ebit.reduce((a, b) => a + b, 0),
            GASTO_TRIBUTARIO: datosPorPeriodo.gastoTributario.reduce((a, b) => a + b, 0),
            GASTO_FINANCIERO: datosPorPeriodo.gastoFinanciero.reduce((a, b) => a + b, 0),
            OTROS_INGRESOS: datosPorPeriodo.otrosIngresos.reduce((a, b) => a + b, 0),
            OTROS_EGRESOS: datosPorPeriodo.otrosEgresos.reduce((a, b) => a + b, 0)
        };
    }
}

module.exports = EstadoResultadosService;
