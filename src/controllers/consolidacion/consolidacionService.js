const MensualService = require('./tipos/mensual');
const TrimestralService = require('./tipos/trimestral');
const AnualFiscalService = require('./tipos/anualFiscal');
const BalanceGeneralService = require('./balanceGeneralService');
const FlujoOperativoService = require('./flujoOperativoService');
const FlujoCorporativoService = require('./flujoCorporativoService');

/**
 * Servicio principal de consolidación
 */
class ConsolidacionService {
    constructor() {
        this.mensualService = new MensualService();
        this.trimestralService = new TrimestralService();
        this.anualFiscalService = new AnualFiscalService();
        this.balanceGeneralService = new BalanceGeneralService();
        this.flujoOperativoService = new FlujoOperativoService();
        this.flujoCorporativoService = new FlujoCorporativoService();
    }

    /**
     * Realiza consolidación según el tipo especificado
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {Object} range - Rango de fechas
     * @param {string} tipo - Tipo de consolidación (mensual, trimestral, anual-fiscal)
     * @returns {Object} Datos consolidados
     */
    async consolidar(empresasIds, range, tipo = 'mensual') {
        console.log(`🚀 Iniciando consolidación tipo: ${tipo}`);
        console.log(`🏢 Empresas: ${empresasIds.length} empresas`);
        console.log(`📅 Rango: ${range.start.anio}-${range.start.mes} a ${range.end.anio}-${range.end.mes}`);

        let resultado;

        switch (tipo) {
            case 'mensual':
                resultado = await this.mensualService.consolidar(empresasIds, range);
                break;
            case 'trimestral':
                resultado = await this.trimestralService.consolidar(empresasIds, range);
                break;
            case 'anual-fiscal':
                resultado = await this.anualFiscalService.consolidar(empresasIds, range);
                break;
            default:
                throw new Error(`Tipo de consolidación no válido: ${tipo}`);
        }

        // Procesar datos adicionales
        const datosProcesados = await this.procesarDatosAdicionales(resultado);

        console.log('✅ Consolidación completada exitosamente');
        return datosProcesados;
    }

    /**
     * Procesa datos adicionales y genera resúmenes
     * @param {Object} resultado - Resultado de la consolidación
     * @returns {Object} Datos procesados
     */
    async procesarDatosAdicionales(resultado) {
        const { datosPorPeriodo, datosPorPeriodoBG, datosPorPeriodoFO, datosPorPeriodoFC, erRows, foRows, fcRows, bgRows } = resultado;

        // Generar resúmenes para compatibilidad
        const estadoResultados = this.generarResumenEstadoResultados(datosPorPeriodo);
        const flujoOperativo = this.flujoOperativoService.consolidarDatos(foRows);
        const flujoCorporativo = this.flujoCorporativoService.consolidarDatos(fcRows);
        const balanceGeneral = this.balanceGeneralService.consolidarDatos(bgRows);

        return {
            datosPorPeriodo,
            datosPorPeriodoBG,
            datosPorPeriodoFO,
            datosPorPeriodoFC,
            estadoResultados,
            balanceGeneral,
            flujoOperativo,
            flujoCorporativo
        };
    }

    /**
     * Suma valores numéricos de un array de registros
     * @param {Array} rows - Registros a sumar
     * @returns {Object} Totales por campo
     */
    sumRows(rows) {
        const totals = {};
        if (!Array.isArray(rows)) return totals;

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
                if (Number.isFinite(n)) {
                    totals[key] = (totals[key] || 0) + n;
                }
            }
        }

        return totals;
    }

    /**
     * Genera resumen de estado de resultados para compatibilidad
     * @param {Object} datosPorPeriodo - Datos por períodos
     * @returns {Object} Resumen consolidado
     */
    generarResumenEstadoResultados(datosPorPeriodo) {
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

module.exports = ConsolidacionService;
