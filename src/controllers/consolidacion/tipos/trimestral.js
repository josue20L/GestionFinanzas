const EstadoResultadosService = require('../estadoResultadosService');
const FlujoOperativo = require('../../../models/FlujoOperativo');
const FlujoCorporativo = require('../../../models/FlujoCorporativo');
const BalanceGeneral = require('../../../models/BalanceGeneral');

/**
 * Servicio para consolidación trimestral
 */
class TrimestralService {
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
     * Realiza consolidación trimestral
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {Object} range - Rango de meses {start, end, months}
     * @returns {Object} Datos consolidados por trimestres
     */
    async consolidar(empresasIds, range) {
        console.log('🔄 Iniciando consolidación trimestral...');
        console.log('📆 Meses a procesar:', range.months.length, 'meses');

        // Agrupar meses por trimestre
        const trimestres = this.agruparMesesPorTrimestre(range.months);
        console.log('📊 Trimestres a procesar:', Object.keys(trimestres));
        console.log('📆 Meses por trimestre:', trimestres);

        const datosPorPeriodo = this.estadoResultadosService.inicializarDatosPorPeriodo();
        const datosPorPeriodoBG = this.inicializarDatosPorPeriodoGenerico();
        const datosPorPeriodoFO = this.inicializarDatosPorPeriodoGenerico();
        const datosPorPeriodoFC = this.inicializarDatosPorPeriodoGenerico();
        const erRows = [];
        const foRows = [];
        const fcRows = [];

        // Procesar cada trimestre
        for (const [trimestreKey, meses] of Object.entries(trimestres)) {
            console.log(`\n🔄 Procesando trimestre ${trimestreKey} con meses:`, meses);
            
            let trimestralVentasNetas = 0;
            let trimestralCostoVentas = 0;
            let trimestralGastoAdministrativo = 0;
            let trimestralGastoComercializacion = 0;
            let trimestralGastoSig = 0;
            let trimestralEbit = 0;
            let trimestralGastoTributario = 0;
            let trimestralGastoFinanciero = 0;
            let trimestralOtrosIngresos = 0;
            let trimestralOtrosEgresos = 0;

            const foRowsTrimestre = [];
            const fcRowsTrimestre = [];

            // Sumar todos los meses del trimestre
            for (const { anio, mes } of meses) {
                console.log(`   📅 Procesando mes ${mes} del trimestre ${trimestreKey}`);
                
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

                // Sumar valores trimestrales
                trimestralVentasNetas += er.VENTAS_NETAS || 0;
                trimestralCostoVentas += er.COSTO_VENTAS || 0;
                trimestralGastoAdministrativo += er.GASTO_ADMINISTRATIVO || 0;
                trimestralGastoComercializacion += er.GASTO_COMERCIALIZACION || 0;
                trimestralGastoSig += er.GASTO_SIG || 0;
                trimestralEbit += er.EBIT || 0;
                trimestralGastoTributario += er.GASTO_TRIBUTARIO || 0;
                trimestralGastoFinanciero += er.GASTO_FINANCIERO || 0;
                trimestralOtrosIngresos += er.OTROS_INGRESOS || 0;
                trimestralOtrosEgresos += er.OTROS_EGRESOS || 0;

                // Acumular para compatibilidad con otros tabs
                if (Array.isArray(fo)) foRows.push(...fo);
                if (Array.isArray(fc)) fcRows.push(...fc);

                if (Array.isArray(fo)) foRowsTrimestre.push(...fo);
                if (Array.isArray(fc)) fcRowsTrimestre.push(...fc);
            }

            console.log(`✅ Totales trimestre ${trimestreKey}:`, {
                ventasNetas: trimestralVentasNetas,
                costoVentas: trimestralCostoVentas,
                ebit: trimestralEbit
            });

            // Agregar trimestre y valores trimestrales
            const datosTrimestral = {
                VENTAS_NETAS: trimestralVentasNetas,
                COSTO_VENTAS: trimestralCostoVentas,
                GASTO_ADMINISTRATIVO: trimestralGastoAdministrativo,
                GASTO_COMERCIALIZACION: trimestralGastoComercializacion,
                GASTO_SIG: trimestralGastoSig,
                EBIT: trimestralEbit,
                GASTO_TRIBUTARIO: trimestralGastoTributario,
                GASTO_FINANCIERO: trimestralGastoFinanciero,
                OTROS_INGRESOS: trimestralOtrosIngresos,
                OTROS_EGRESOS: trimestralOtrosEgresos
            };

            this.estadoResultadosService.agregarPeriodo(datosPorPeriodo, trimestreKey, datosTrimestral);

            this.agregarPeriodoGenerico(datosPorPeriodoFO, trimestreKey, this.consolidarRows(foRowsTrimestre));
            this.agregarPeriodoGenerico(datosPorPeriodoFC, trimestreKey, this.consolidarRows(fcRowsTrimestre));

            const ultimoMes = meses[meses.length - 1];
            if (ultimoMes) {
                const bg = await BalanceGeneral.getForConsolidacion(empresasIds, ultimoMes.anio, ultimoMes.mes);
                this.agregarPeriodoGenerico(datosPorPeriodoBG, trimestreKey, this.consolidarRows(bg));
            }
        }

        // Obtener balance general para el último mes
        const bgRows = await BalanceGeneral.getForConsolidacion(empresasIds, range.end.anio, range.end.mes);
        
        console.log('\n✅ Consolidación trimestral completada');
        console.log(`📈 Trimestres procesados: ${datosPorPeriodo.periodos.length}`);
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
     * Agrupa meses por trimestre
     * @param {Array} months - Array de objetos {anio, mes}
     * @returns {Object} Objeto con trimestres como claves y arrays de meses como valores
     */
    agruparMesesPorTrimestre(months) {
        const trimestres = {};
        
        months.forEach(({ anio, mes }) => {
            const quarter = Math.ceil(mes / 3);
            const trimestreKey = `${anio}-Q${quarter}`;
            
            if (!trimestres[trimestreKey]) {
                trimestres[trimestreKey] = [];
            }
            trimestres[trimestreKey].push({ anio, mes });
        });

        return trimestres;
    }
}

module.exports = TrimestralService;
