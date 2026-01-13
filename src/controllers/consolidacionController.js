const EstadoResultado = require('../models/EstadoResultado');
const BalanceGeneral = require('../models/BalanceGeneral');
const FlujoOperativo = require('../models/FlujoOperativo');
const FlujoCorporativo = require('../models/FlujoCorporativo');

function parsePeriodo(periodo) {
    if (typeof periodo !== 'string') return null;
    const [anioStr, mesStr] = periodo.split('-');
    const anio = Number(anioStr);
    const mes = Number(mesStr);
    if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;
    return { anio, mes };
}

function buildMonthRange(desde, hasta) {
    const start = parsePeriodo(desde);
    const end = parsePeriodo(hasta);
    if (!start || !end) return null;

    const months = [];
    let y = start.anio;
    let m = start.mes;

    while (y < end.anio || (y === end.anio && m <= end.mes)) {
        months.push({ anio: y, mes: m });
        m += 1;
        if (m === 13) {
            m = 1;
            y += 1;
        }
    }

    return { start, end, months };
}

function sumRows(rows) {
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

const consolidar = async (req, res) => {
    try {
        const { empresas, desde, hasta } = req.body || {};

        if (!Array.isArray(empresas) || empresas.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe seleccionar al menos una empresa' });
        }

        const empresasIds = empresas.map((x) => Number(x)).filter((x) => Number.isInteger(x));
        if (empresasIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Empresas inválidas' });
        }

        const range = buildMonthRange(desde, hasta);
        if (!range) {
            return res.status(400).json({ success: false, message: 'Rango de fechas inválido. Use formato YYYY-MM' });
        }

        const erRows = [];
        const foRows = [];
        const fcRows = [];

        for (const { anio, mes } of range.months) {
            const [er, fo, fc] = await Promise.all([
                EstadoResultado.getForConsolidacion(empresasIds, anio, mes),
                FlujoOperativo.getForConsolidacion(empresasIds, anio, mes),
                FlujoCorporativo.getForConsolidacion(empresasIds, anio, mes)
            ]);
            if (Array.isArray(er)) erRows.push(...er);
            if (Array.isArray(fo)) foRows.push(...fo);
            if (Array.isArray(fc)) fcRows.push(...fc);
        }

        const bgRows = await BalanceGeneral.getForConsolidacion(empresasIds, range.end.anio, range.end.mes);

        const estadoResultados = sumRows(erRows);
        const flujoOperativo = sumRows(foRows);
        const flujoCorporativo = sumRows(fcRows);
        const balanceGeneral = sumRows(bgRows);

        return res.json({
            success: true,
            periodo: { desde, hasta },
            empresas: empresasIds,
            meta: {
                empresasCount: empresasIds.length,
                mesesCount: range.months.length
            },
            data: {
                estadoResultados,
                balanceGeneral,
                flujoOperativo,
                flujoCorporativo
            }
        });
    } catch (error) {
        console.error('Error en consolidación:', error);
        return res.status(500).json({ success: false, message: 'Error al consolidar datos', error: error.message });
    }
};

module.exports = {
    consolidar
};
