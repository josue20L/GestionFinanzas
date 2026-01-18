const EstadoResultadosService = require('../estadoResultadosService');
const FlujoOperativo = require('../../../models/FlujoOperativo');
const FlujoCorporativo = require('../../../models/FlujoCorporativo');
const BalanceGeneral = require('../../../models/BalanceGeneral');

/**
 * Servicio para consolidación anual fiscal
 */
class AnualFiscalService {
    constructor() {
        this.estadoResultadosService = new EstadoResultadosService();
    }

    inicializarDatosPorPeriodoGenerico() {
        return { periodos: [], series: {} };
    }

    agregarPeriodoGenerico(datosPorPeriodo, periodo, datosPeriodo) {
        datosPorPeriodo.periodos.push(periodo);

        if (!datosPeriodo || typeof datosPeriodo !== 'object') return;

        for (const [key, value] of Object.entries(datosPeriodo)) {
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
            if (!Number.isFinite(n)) continue;
            if (!Array.isArray(datosPorPeriodo.series[key])) datosPorPeriodo.series[key] = [];
            datosPorPeriodo.series[key].push(n);
        }

        for (const k of Object.keys(datosPorPeriodo.series)) {
            if (datosPorPeriodo.series[k].length < datosPorPeriodo.periodos.length) {
                datosPorPeriodo.series[k].push(0);
            }
        }
    }

    consolidarRows(rows) {
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
                if (Number.isFinite(n)) totals[key] = (totals[key] || 0) + n;
            }
        }
        return totals;
    }

    /**
     * Realiza consolidación anual fiscal
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {Object} range - Rango de meses {start, end, months}
     * @returns {Object} Datos consolidados por años fiscales
     */
    async consolidar(empresasIds, range) {
        console.log('🔄 Iniciando consolidación anual fiscal...');
        console.log('📆 Meses a procesar:', range.months.length, 'meses');

        // Agrupar meses por año fiscal (Abril - Marzo)
        const aniosFiscales = this.agruparMesesPorAnioFiscal(range.months);
        console.log('📊 Años fiscales a procesar:', Object.keys(aniosFiscales));
        console.log('📆 Meses por año fiscal:', aniosFiscales);

        const datosPorPeriodo = this.estadoResultadosService.inicializarDatosPorPeriodo();
        const datosPorPeriodoBG = this.inicializarDatosPorPeriodoGenerico();
        const datosPorPeriodoFO = this.inicializarDatosPorPeriodoGenerico();
        const datosPorPeriodoFC = this.inicializarDatosPorPeriodoGenerico();
        const erRows = [];
        const foRows = [];
        const fcRows = [];

        // Procesar cada año fiscal
        for (const [anioFiscalKey, meses] of Object.entries(aniosFiscales)) {
            console.log(`\n🔄 Procesando año fiscal ${anioFiscalKey} con meses:`, meses);
            
            let anualVentasNetas = 0;
            let anualCostoVentas = 0;
            let anualGastoAdministrativo = 0;
            let anualGastoComercializacion = 0;
            let anualGastoSig = 0;
            let anualEbit = 0;
            let anualGastoTributario = 0;
            let anualGastoFinanciero = 0;
            let anualOtrosIngresos = 0;
            let anualOtrosEgresos = 0;

            const foRowsAnio = [];
            const fcRowsAnio = [];

            // Sumar todos los meses del año fiscal
            for (const { anio, mes } of meses) {
                console.log(`   📅 Procesando mes ${mes} del año fiscal ${anioFiscalKey}`);
                
                // Obtener datos de estado de resultados para este mes
                const er = await this.estadoResultadosService.obtenerDatosPeriodo(empresasIds, anio, mes);
                
                // Obtener datos de otros modelos para compatibilidad
                const [fo, fc] = await Promise.all([
                    FlujoOperativo.getForConsolidacion(empresasIds, anio, mes),
                    FlujoCorporativo.getForConsolidacion(empresasIds, anio, mes)
                ]);

                console.log(`      📊 ER datos para ${anio}-${mes}:`, Object.keys(er).length, 'campos');
                console.log(`      📊 FO datos para ${anio}-${mes}:`, fo.length, 'registros');
                console.log(`      📊 FC datos para ${anio}-${mes}:`, fc.length, 'registros');

                // Sumar valores anuales
                anualVentasNetas += er.VENTAS_NETAS || 0;
                anualCostoVentas += er.COSTO_VENTAS || 0;
                anualGastoAdministrativo += er.GASTO_ADMINISTRATIVO || 0;
                anualGastoComercializacion += er.GASTO_COMERCIALIZACION || 0;
                anualGastoSig += er.GASTO_SIG || 0;
                anualEbit += er.EBIT || 0;
                anualGastoTributario += er.GASTO_TRIBUTARIO || 0;
                anualGastoFinanciero += er.GASTO_FINANCIERO || 0;
                anualOtrosIngresos += er.OTROS_INGRESOS || 0;
                anualOtrosEgresos += er.OTROS_EGRESOS || 0;

                // Acumular para compatibilidad con otros tabs
                if (Array.isArray(fo)) foRows.push(...fo);
                if (Array.isArray(fc)) fcRows.push(...fc);

                if (Array.isArray(fo)) foRowsAnio.push(...fo);
                if (Array.isArray(fc)) fcRowsAnio.push(...fc);
            }

            console.log(`✅ Totales año fiscal ${anioFiscalKey}:`, {
                ventasNetas: anualVentasNetas,
                costoVentas: anualCostoVentas,
                ebit: anualEbit
            });

            // Agregar año fiscal y valores anuales
            const datosAnual = {
                VENTAS_NETAS: anualVentasNetas,
                COSTO_VENTAS: anualCostoVentas,
                GASTO_ADMINISTRATIVO: anualGastoAdministrativo,
                GASTO_COMERCIALIZACION: anualGastoComercializacion,
                GASTO_SIG: anualGastoSig,
                EBIT: anualEbit,
                GASTO_TRIBUTARIO: anualGastoTributario,
                GASTO_FINANCIERO: anualGastoFinanciero,
                OTROS_INGRESOS: anualOtrosIngresos,
                OTROS_EGRESOS: anualOtrosEgresos
            };

            this.estadoResultadosService.agregarPeriodo(datosPorPeriodo, anioFiscalKey, datosAnual);

            this.agregarPeriodoGenerico(datosPorPeriodoFO, anioFiscalKey, this.consolidarRows(foRowsAnio));
            this.agregarPeriodoGenerico(datosPorPeriodoFC, anioFiscalKey, this.consolidarRows(fcRowsAnio));

            const ultimoMes = meses[meses.length - 1];
            if (ultimoMes) {
                const bg = await BalanceGeneral.getForConsolidacion(empresasIds, ultimoMes.anio, ultimoMes.mes);
                this.agregarPeriodoGenerico(datosPorPeriodoBG, anioFiscalKey, this.consolidarRows(bg));
            }
        }

        // Obtener balance general para el último mes
        const bgRows = await BalanceGeneral.getForConsolidacion(empresasIds, range.end.anio, range.end.mes);
        
        console.log('\n✅ Consolidación anual fiscal completada');
        console.log(`📈 Años fiscales procesados: ${datosPorPeriodo.periodos.length}`);
        console.log(`📊 Total ER rows: ${erRows.length}`);
        console.log(`📊 Total FO rows: ${foRows.length}`);
        console.log(`📊 Total FC rows: ${fcRows.length}`);
        console.log(`📊 Total BG rows: ${bgRows.length}`);

        return {
            datosPorPeriodo,
            datosPorPeriodoBG,
            datosPorPeriodoFO,
            datosPorPeriodoFC,
            // Datos para compatibilidad con otros tabs
            erRows,
            foRows,
            fcRows,
            bgRows
        };
    }

    /**
     * Agrupa meses por año fiscal (Abril - Marzo)
     * @param {Array} months - Array de objetos {anio, mes}
     * @returns {Object} Objeto con años fiscales como claves y arrays de meses como valores
     */
    agruparMesesPorAnioFiscal(months) {
        const aniosFiscales = {};
        
        months.forEach(({ anio, mes }) => {
            let anioFiscal;
            if (mes >= 4) {
                // Abril - Diciembre pertenece al año fiscal del año actual
                anioFiscal = anio;
            } else {
                // Enero - Marzo pertenece al año fiscal del año anterior
                anioFiscal = anio - 1;
            }
            
            const anioFiscalKey = `${anioFiscal}-${anioFiscal + 1}`;
            
            if (!aniosFiscales[anioFiscalKey]) {
                aniosFiscales[anioFiscalKey] = [];
            }
            aniosFiscales[anioFiscalKey].push({ anio, mes });
        });

        return aniosFiscales;
    }
}

module.exports = AnualFiscalService;
