const EstadoResultado = require('../models/EstadoResultado');
const FlujoOperativo = require('../models/FlujoOperativo');
const PeriodoFinanciero = require('../models/PeriodoFinanciero');

// Obtener resumen ejecutivo para un período
const getResumenEjecutivo = async (req, res) => {
    try {
        const { id_empresa, anio, mes } = req.query;

        if (!id_empresa || !anio || !mes) {
            return res.status(400).json({ 
                message: 'id_empresa, anio y mes son requeridos' 
            });
        }

        // Obtener período actual
        const periodoActual = await PeriodoFinanciero.getByEmpresaAnioMes(id_empresa, anio, mes);
        if (!periodoActual) {
            return res.status(404).json({ 
                message: 'Período no encontrado' 
            });
        }

        // Obtener datos del período actual
        const estadoResultado = await EstadoResultado.getByIdPeriodo(periodoActual.ID_PERIODO);
        const flujoOperativo = await FlujoOperativo.getByIdPeriodo(periodoActual.ID_PERIODO);

        // Función auxiliar para parsear números
        const parseNumber = (value) => {
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        };

        // Calcular totales
        const totalIngresos = estadoResultado ? 
            parseNumber(estadoResultado.VENTAS_NETAS) + parseNumber(estadoResultado.OTROS_INGRESOS) : 0;
        
        const totalEgresos = estadoResultado ? 
            parseNumber(estadoResultado.COSTO_VENTAS) + 
            parseNumber(estadoResultado.GASTO_ADMINISTRATIVO) + 
            parseNumber(estadoResultado.GASTO_COMERCIALIZACION) + 
            parseNumber(estadoResultado.GASTO_SIG) + 
            parseNumber(estadoResultado.GASTO_TRIBUTARIO) + 
            parseNumber(estadoResultado.GASTO_FINANCIERO) + 
            parseNumber(estadoResultado.OTROS_EGRESOS) : 0;
            
        const utilidadNeta = estadoResultado ? parseNumber(estadoResultado.UTILIDAD_NETA) : 0;
        const saldoFinalCaja = flujoOperativo ? parseNumber(flujoOperativo.SALDO_ACTUAL) : 0;

        // Obtener período anterior para comparación
        let periodoAnterior = null;
        let estadoAnterior = null;
        let variacionIngresos = null;
        let variacionUtilidad = null;
        let variacionCaja = null;
        let variacionEgresos = null;

        // Calcular período anterior (mes anterior)
        let mesAnterior = parseInt(mes) - 1;
        let anioAnterior = parseInt(anio);
        
        if (mesAnterior === 0) {
            mesAnterior = 12;
            anioAnterior--;
        }

        periodoAnterior = await PeriodoFinanciero.getByEmpresaAnioMes(id_empresa, anioAnterior, mesAnterior);
        
        if (periodoAnterior) {
            estadoAnterior = await EstadoResultado.getByIdPeriodo(periodoAnterior.ID_PERIODO);
            const flujoAnterior = await FlujoOperativo.getByIdPeriodo(periodoAnterior.ID_PERIODO);

            // Calcular variaciones
            if (estadoAnterior && estadoResultado) {
                const ingresosAnterior = parseNumber(estadoAnterior.VENTAS_NETAS) + parseNumber(estadoAnterior.OTROS_INGRESOS);
                const ingresosActuales = totalIngresos;
                
                const egresosAnterior = parseNumber(estadoAnterior.COSTO_VENTAS) + parseNumber(estadoAnterior.GASTO_ADMINISTRATIVO) + parseNumber(estadoAnterior.GASTO_COMERCIALIZACION) + parseNumber(estadoAnterior.GASTO_SIG) + parseNumber(estadoAnterior.GASTO_TRIBUTARIO) + parseNumber(estadoAnterior.GASTO_FINANCIERO) + parseNumber(estadoAnterior.OTROS_EGRESOS);
                const egresosActuales = totalEgresos;
                
                variacionIngresos = calcularVariacion(ingresosAnterior, ingresosActuales);
                variacionUtilidad = calcularVariacion(
                    parseNumber(estadoAnterior.UTILIDAD_NETA), 
                    parseNumber(estadoResultado.UTILIDAD_NETA)
                );
                
                // Calcular variación de egresos
                variacionEgresos = calcularVariacion(egresosAnterior, egresosActuales);
            }

            if (flujoAnterior && flujoOperativo) {
                variacionCaja = calcularVariacion(
                    parseNumber(flujoAnterior.SALDO_ACTUAL), 
                    parseNumber(flujoOperativo.SALDO_ACTUAL)
                );
            }
        }

        const resumen = {
            contexto: {
                periodo: `${anio}-${mes.padStart(2, '0')}`,
                empresa: estadoResultado?.NOMBRE_EMPRESA || 'Empresa',
                reporte: 'Resumen Ejecutivo',
                fechaGeneracion: new Date().toISOString().split('T')[0]
            },
            resumenEjecutivo: {
                totalIngresos: totalIngresos,
                totalEgresos: totalEgresos,
                utilidadNeta: utilidadNeta,
                saldoFinalCaja: saldoFinalCaja,
                variacionIngresos: variacionIngresos,
                variacionEgresos: variacionEgresos,
                variacionUtilidad: variacionUtilidad,
                variacionCaja: variacionCaja
            },
            datosOriginales: {
                estadoResultado,
                flujoOperativo,
                periodoActual,
                periodoAnterior
            }
        };

        return res.status(200).json({
            message: 'Resumen ejecutivo obtenido exitosamente',
            resumen
        });

    } catch (error) {
        console.error('Error en getResumenEjecutivo:', error);
        return res.status(500).json({ message: error.message });
    }
};

// Función auxiliar para calcular variación
function calcularVariacion(valorAnterior, valorActual) {
    if (valorAnterior === 0) {
        return {
            valor: valorActual,
            porcentaje: valorActual > 0 ? 100 : 0,
            tendencia: valorActual > 0 ? 'positiva' : 'neutra'
        };
    }

    const diferencia = valorActual - valorAnterior;
    const porcentaje = (diferencia / Math.abs(valorAnterior)) * 100;

    return {
        valor: diferencia,
        porcentaje: Math.round(porcentaje * 100) / 100, // Redondear a 2 decimales
        tendencia: diferencia > 0 ? 'positiva' : diferencia < 0 ? 'negativa' : 'neutra'
    };
}

module.exports = {
    getResumenEjecutivo
};
