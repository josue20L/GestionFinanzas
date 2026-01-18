const EstadoResultadosService = require('../estadoResultadosService');
const FlujoOperativo = require('../../../models/FlujoOperativo');
const FlujoCorporativo = require('../../../models/FlujoCorporativo');
const BalanceGeneral = require('../../../models/BalanceGeneral');

/**
 * Servicio para consolidación mensual
 */
class MensualService {
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
     * Realiza consolidación mensual
     * @param {number[]} empresasIds - IDs de empresas a consolidar
     * @param {Object} range - Rango de meses {start, end, months}
     * @returns {Object} Datos consolidados por meses
     */
    async consolidar(empresasIds, range) {
        console.log('🔄 Iniciando consolidación mensual...');
        console.log('📆 Meses a procesar:', range.months.length, 'meses');

        const datosPorPeriodo = this.estadoResultadosService.inicializarDatosPorPeriodo();
        const datosPorPeriodoBG = this.inicializarDatosPorPeriodoGenerico();
        const datosPorPeriodoFO = this.inicializarDatosPorPeriodoGenerico();
        const datosPorPeriodoFC = this.inicializarDatosPorPeriodoGenerico();
        const erRows = [];
        const foRows = [];
        const fcRows = [];

        // Procesar cada mes
        for (const { anio, mes } of range.months) {
            console.log(`\n📅 Procesando mes ${mes}/${anio}`);
            
            // Obtener datos de todos los modelos para este mes
            const [er, fo, fc, bg] = await Promise.all([
                this.estadoResultadosService.obtenerDatosPeriodo(empresasIds, anio, mes),
                FlujoOperativo.getForConsolidacion(empresasIds, anio, mes),
                FlujoCorporativo.getForConsolidacion(empresasIds, anio, mes),
                BalanceGeneral.getForConsolidacion(empresasIds, anio, mes)
            ]);

            console.log(`📊 Datos obtenidos para ${anio}-${mes}:`);
            console.log(`   ER: ${Object.keys(er).length} campos`);
            console.log(`   FO: ${fo.length} registros`);
            console.log(`   FC: ${fc.length} registros`);
            console.log(`   BG: ${bg.length} registros`);

            // Formatear período como YYYY-MM
            const periodo = `${anio}-${mes.toString().padStart(2, '0')}`;
            
            // Agregar período a los datos
            this.estadoResultadosService.agregarPeriodo(datosPorPeriodo, periodo, er);

            this.agregarPeriodoGenerico(datosPorPeriodoBG, periodo, this.consolidarRows(bg));
            this.agregarPeriodoGenerico(datosPorPeriodoFO, periodo, this.consolidarRows(fo));
            this.agregarPeriodoGenerico(datosPorPeriodoFC, periodo, this.consolidarRows(fc));

            // Acumular para compatibilidad con otros tabs
            if (Array.isArray(fo)) foRows.push(...fo);
            if (Array.isArray(fc)) fcRows.push(...fc);
        }

        // Obtener balance general para el último mes
        const bgRows = await BalanceGeneral.getForConsolidacion(empresasIds, range.end.anio, range.end.mes);
        
        console.log('\n✅ Consolidación mensual completada');
        console.log(`📈 Períodos procesados: ${datosPorPeriodo.periodos.length}`);
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
}

module.exports = MensualService;
