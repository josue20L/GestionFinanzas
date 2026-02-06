const PeriodoFinanciero = require('./PeriodoFinanciero');
const EstadoResultado = require('./EstadoResultado');
const BalanceGeneral = require('./BalanceGeneral');
const FlujoOperativo = require('./FlujoOperativo');
const FlujoCorporativo = require('./FlujoCorporativo');

const parsePeriodo = (periodo) => {
    const p = (periodo || '').toString().trim();
    const m = /^\d{4}-\d{2}$/.exec(p);
    if (!m) return null;
    const [anioStr, mesStr] = p.split('-');
    const anio = Number(anioStr);
    const mes = Number(mesStr);
    if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;
    return { anio, mes };
};

const pad2 = (n) => String(n).padStart(2, '0');

const formatPeriodo = (anio, mes) => `${anio}-${pad2(mes)}`;

const addMonths = (anio, mes, delta) => {
    let y = Number(anio);
    let m = Number(mes);
    if (!Number.isInteger(y) || !Number.isInteger(m)) return null;

    let total = y * 12 + (m - 1) + Number(delta || 0);
    const newY = Math.floor(total / 12);
    const newM = (total % 12) + 1;
    return { anio: newY, mes: newM, periodo: formatPeriodo(newY, newM) };
};

const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};

class Reporte {
    static computeER(er) {
        const ventasNetas = n(er?.VENTAS_NETAS);
        const costoVentas = n(er?.COSTO_VENTAS);
        const gastoAdministrativo = n(er?.GASTO_ADMINISTRATIVO);
        const gastoComercializacion = n(er?.GASTO_COMERCIALIZACION);
        const gastoSig = n(er?.GASTO_SIG);
        const gastoTributario = n(er?.GASTO_TRIBUTARIO);
        const gastoFinanciero = n(er?.GASTO_FINANCIERO);
        const otrosIngresos = n(er?.OTROS_INGRESOS);
        const otrosEgresos = n(er?.OTROS_EGRESOS);

        const utilidadVentas = ventasNetas - costoVentas;
        const gastosOperativos = gastoAdministrativo + gastoComercializacion + gastoSig;
        const ebit = utilidadVentas - gastosOperativos;
        const utilidadAntesImpuestos = ebit - gastoFinanciero + otrosIngresos - otrosEgresos;
        const utilidadNeta = utilidadAntesImpuestos - gastoTributario;

        return {
            ventasNetas,
            costoVentas,
            gastoAdministrativo,
            gastoComercializacion,
            gastoSig,
            gastoTributario,
            gastoFinanciero,
            otrosIngresos,
            otrosEgresos,
            utilidadVentas,
            gastosOperativos,
            ebit,
            utilidadAntesImpuestos,
            utilidadNeta
        };
    }

    static computeBG(bg) {
        const disponible = n(bg?.DISPONIBLE);
        const exigible = n(bg?.EXIGIBLE);
        const realizable = n(bg?.REALIZABLE);
        const activoFijoTangible = n(bg?.ACTIVO_FIJO_TANGIBLE);
        const activoDiferido = n(bg?.ACTIVO_DIFERIDO);
        const otrosActivos = n(bg?.OTROS_ACTIVOS);

        const pasivoCorriente = n(bg?.PASIVO_CORRIENTE);
        const previsionBeneficiosSociales = n(bg?.PREVISION_BENEFICIOS_SOCIALES);
        const obligacionesBancarias = n(bg?.OBLIGACIONES_BANCARIAS);
        const interesesPorPagar = n(bg?.INTERESES_POR_PAGAR);
        const procesosLegales = n(bg?.PROCESOS_LEGALES);
        const patrimonio = n(bg?.PATRIMONIO);

        const activoCorriente = disponible + exigible + realizable;
        const activoNoCorriente = activoFijoTangible + activoDiferido + otrosActivos;
        const totalActivo = n(bg?.TOTAL_ACTIVO) || (activoCorriente + activoNoCorriente);

        const totalPasivo = pasivoCorriente + previsionBeneficiosSociales + obligacionesBancarias + interesesPorPagar + procesosLegales;
        const totalPasivoPatrimonio = n(bg?.TOTAL_PASIVO_PATRIMONIO) || (totalPasivo + patrimonio);

        return {
            disponible,
            exigible,
            realizable,
            activoFijoTangible,
            activoDiferido,
            otrosActivos,
            pasivoCorriente,
            previsionBeneficiosSociales,
            obligacionesBancarias,
            interesesPorPagar,
            procesosLegales,
            patrimonio,
            activoCorriente,
            activoNoCorriente,
            totalActivo,
            totalPasivo,
            totalPasivoPatrimonio
        };
    }

    static computeFO(fo) {
        const ventas = n(fo?.VENTAS);
        const ventasExportacion = n(fo?.VENTAS_EXPORTACION);
        const cartera = n(fo?.CARTERA);
        const transportesIng = n(fo?.TRANSPORTES_ING);
        const otrosIngresos = n(fo?.OTROS_INGRESOS);

        const gastosAdministrativos = n(fo?.GASTOS_ADMINISTRATIVOS);
        const gastosComerciales = n(fo?.GASTOS_COMERCIALES);
        const gastosProduccion = n(fo?.GASTOS_PRODUCCION);
        const enviosCtaCorp = n(fo?.ENVIOS_CTA_CORP);
        const impuestos = n(fo?.IMPUESTOS);
        const transportesEgr = n(fo?.TRANSPORTES_EGR);
        const cuentasPorPagar = n(fo?.CUENTAS_POR_PAGAR);
        const inversiones = n(fo?.INVERSIONES);
        const otrosGastos = n(fo?.OTROS_GASTOS);
        const saldoAnterior = n(fo?.SALDO_ANTERIOR);

        const totalIngresos = n(fo?.TOTAL_INGRESOS) || (ventas + ventasExportacion + cartera + transportesIng + otrosIngresos);
        const totalEgresos = n(fo?.TOTAL_EGRESOS) || (gastosAdministrativos + gastosComerciales + gastosProduccion + enviosCtaCorp + impuestos + transportesEgr + cuentasPorPagar + inversiones + otrosGastos);
        const saldoActual = n(fo?.SALDO_ACTUAL) || (saldoAnterior + totalIngresos - totalEgresos);

        return {
            ventas,
            ventasExportacion,
            cartera,
            transportesIng,
            otrosIngresos,
            gastosAdministrativos,
            gastosComerciales,
            gastosProduccion,
            enviosCtaCorp,
            impuestos,
            transportesEgr,
            cuentasPorPagar,
            inversiones,
            otrosGastos,
            saldoAnterior,
            totalIngresos,
            totalEgresos,
            saldoActual
        };
    }

    static computeFC(fc) {
        const transferenciaFondos = n(fc?.TRANSFERENCIA_FONDOS);
        const desembolsosBancarios = n(fc?.DESEMBOLSOS_BANCARIOS);
        const otrosIngresos = n(fc?.OTROS_INGRESOS);

        const prestamosBancarios = n(fc?.PRESTAMOS_BANCARIOS);
        const inversiones = n(fc?.INVERSIONES);
        const rprConsultores = n(fc?.RPR_CONSULTORES);
        const bonosPlrs = n(fc?.BONOS_PLRS);
        const dividendosPagar = n(fc?.DIVIDENDOS_PAGAR);
        const cuentasPagar = n(fc?.CUENTAS_PAGAR);
        const aguinaldos = n(fc?.AGUINALDOS);
        const finiquitos = n(fc?.FINIQUITOS);
        const primas = n(fc?.PRIMAS);
        const retroactivos = n(fc?.RETROACTIVOS);
        const iue = n(fc?.IUE);
        const otrosGastos = n(fc?.OTROS_GASTOS);
        const saldoAnterior = n(fc?.SALDO_ANTERIOR);

        const totalIngresos = n(fc?.TOTAL_INGRESOS) || (transferenciaFondos + desembolsosBancarios + otrosIngresos);
        const totalEgresos = n(fc?.TOTAL_EGRESOS) || (prestamosBancarios + inversiones + rprConsultores + bonosPlrs + dividendosPagar + cuentasPagar + aguinaldos + finiquitos + primas + retroactivos + iue + otrosGastos);
        const saldoActual = n(fc?.SALDO_ACTUAL) || (saldoAnterior + totalIngresos - totalEgresos);

        return {
            transferenciaFondos,
            desembolsosBancarios,
            otrosIngresos,
            prestamosBancarios,
            inversiones,
            rprConsultores,
            bonosPlrs,
            dividendosPagar,
            cuentasPagar,
            aguinaldos,
            finiquitos,
            primas,
            retroactivos,
            iue,
            otrosGastos,
            saldoAnterior,
            totalIngresos,
            totalEgresos,
            saldoActual
        };
    }

    static computeIndicadores({ erCalc, bgCalc }) {
        const ventas = n(erCalc?.ventasNetas);
        const utilidadNeta = n(erCalc?.utilidadNeta);
        const utilidadVentas = n(erCalc?.utilidadVentas);

        const totalActivo = n(bgCalc?.totalActivo);
        const patrimonio = n(bgCalc?.patrimonio);
        const activoCorriente = n(bgCalc?.activoCorriente);
        const pasivoCorriente = n(bgCalc?.pasivoCorriente);
        const totalPasivo = n(bgCalc?.totalPasivo);

        const margenBruto = ventas ? (utilidadVentas / ventas) * 100 : 0;
        const margenNeto = ventas ? (utilidadNeta / ventas) * 100 : 0;
        const roe = patrimonio ? (utilidadNeta / patrimonio) * 100 : 0;
        const roa = totalActivo ? (utilidadNeta / totalActivo) * 100 : 0;
        const liquidez = pasivoCorriente ? (activoCorriente / pasivoCorriente) : 0;
        const endeudamiento = totalActivo ? (totalPasivo / totalActivo) * 100 : 0;

        return {
            margenBruto,
            margenNeto,
            roe,
            roa,
            liquidez,
            endeudamiento
        };
    }

    static async getReporte(empresaId, periodoStr) {
        const parsed = parsePeriodo(periodoStr);
        if (!parsed) {
            throw new Error('Período inválido. Use formato YYYY-MM');
        }

        const idEmpresa = Number(empresaId);
        if (!Number.isInteger(idEmpresa)) {
            throw new Error('Empresa inválida');
        }

        const periodo = await PeriodoFinanciero.getByEmpresaAnioMes(idEmpresa, parsed.anio, parsed.mes);
        if (!periodo) {
            return {
                empresaId: idEmpresa,
                periodo: periodoStr,
                periodoFinanciero: null,
                estadoResultados: null,
                balanceGeneral: null,
                flujoOperativo: null,
                flujoCorporativo: null,
                calculos: null,
                indicadores: null
            };
        }

        const [er, bg, fo, fc] = await Promise.all([
            EstadoResultado.getByIdPeriodo(periodo.ID_PERIODO),
            BalanceGeneral.getByIdPeriodo(periodo.ID_PERIODO),
            FlujoOperativo.getByIdPeriodo(periodo.ID_PERIODO),
            FlujoCorporativo.getByIdPeriodo(periodo.ID_PERIODO)
        ]);

        const erCalc = this.computeER(er);
        const bgCalc = this.computeBG(bg);
        const foCalc = this.computeFO(fo);
        const fcCalc = this.computeFC(fc);
        const indicadores = this.computeIndicadores({ erCalc, bgCalc });

        return {
            empresaId: idEmpresa,
            periodo: periodoStr,
            periodoFinanciero: periodo,
            estadoResultados: er,
            balanceGeneral: bg,
            flujoOperativo: fo,
            flujoCorporativo: fc,
            calculos: {
                estadoResultados: erCalc,
                balanceGeneral: bgCalc,
                flujoOperativo: foCalc,
                flujoCorporativo: fcCalc
            },
            indicadores
        };
    }

    static async getHistorico(empresaId, periodoStr, meses = 6) {
        const parsed = parsePeriodo(periodoStr);
        if (!parsed) {
            throw new Error('Período inválido. Use formato YYYY-MM');
        }

        const idEmpresa = Number(empresaId);
        if (!Number.isInteger(idEmpresa)) {
            throw new Error('Empresa inválida');
        }

        const m = Math.max(1, Math.min(36, Number(meses) || 6));
        const start = addMonths(parsed.anio, parsed.mes, -(m - 1));
        if (!start) {
            throw new Error('Rango inválido');
        }

        const rowsER = await EstadoResultado.getForReportes(idEmpresa, start.anio, start.mes, parsed.anio, parsed.mes);
        const seriesVentas = [];
        const seriesUtilidad = [];
        const periodos = [];

        for (const row of rowsER || []) {
            const per = row.periodo || formatPeriodo(row.ANO, row.MES);
            periodos.push(per);
            const erCalc = this.computeER(row);
            seriesVentas.push(erCalc.ventasNetas);
            seriesUtilidad.push(erCalc.utilidadNeta);
        }

        return {
            empresaId: idEmpresa,
            desde: start.periodo,
            hasta: periodoStr,
            periodos,
            ventasNetas: seriesVentas,
            utilidadNeta: seriesUtilidad
        };
    }
}

module.exports = Reporte;
module.exports.addMonths = addMonths;
module.exports.parsePeriodo = parsePeriodo;
module.exports.formatPeriodo = formatPeriodo;
