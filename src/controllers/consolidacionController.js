const ConsolidacionService = require('./consolidacion/consolidacionService');

// Helper functions (se mantienen aquí por ahora)
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

const consolidar = async (req, res) => {
    try {
        const { empresas, desde, hasta, tipo = 'mensual' } = req.body;

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

        // Usar el servicio de consolidación
        const consolidacionService = new ConsolidacionService();
        const datosConsolidados = await consolidacionService.consolidar(empresasIds, range, tipo);

        return res.json({
            success: true,
            periodo: { desde, hasta },
            empresas: empresasIds,
            tipo: tipo,
            meta: {
                empresasCount: empresasIds.length,
                periodosCount: datosConsolidados.datosPorPeriodo.periodos.length
            },
            data: datosConsolidados
        });
    } catch (error) {
        console.error('Error en consolidación:', error);
        return res.status(500).json({ success: false, message: 'Error al consolidar datos', error: error.message });
    }
};

module.exports = {
    consolidar
};
