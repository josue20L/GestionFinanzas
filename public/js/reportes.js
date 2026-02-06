class ReportesManager {
    constructor() {
        this.selectEmpresa = document.getElementById('empresa-select');
        this.inputPeriodo = document.getElementById('periodo-select');
        this.selectTipoReporte = document.getElementById('tipo-reporte-select');
        this.selectPeriodoComparativo = document.getElementById('periodo-comparativo-select');

        this.btnGenerar = document.getElementById('btn-generar-reporte');
        this.btnActualizar = document.getElementById('btn-actualizar-reporte');

        this.btnImprimir = document.getElementById('btn-imprimir');
        this.btnDescargarPdf = document.getElementById('btn-descargar-pdf');
        this.btnExportarExcel = document.getElementById('btn-exportar-excel');

        this.ui = {
            titulo: document.getElementById('reporte-titulo'),
            empresasNombre: document.getElementById('reporte-empresa-nombre'),
            periodoTexto: document.getElementById('reporte-periodo-texto'),
            kpiVentas: document.getElementById('kpi-ventas-netas'),
            kpiUtilidad: document.getElementById('kpi-utilidad-neta'),
            kpiActivo: document.getElementById('kpi-total-activo'),
            kpiSaldo: document.getElementById('kpi-saldo-operativo'),
            erVentas: document.getElementById('er-ventas-netas'),
            erCosto: document.getElementById('er-costo-ventas'),
            erUtilidadVentas: document.getElementById('er-utilidad-ventas'),
            erGastos: document.getElementById('er-gastos-operativos'),
            erEbit: document.getElementById('er-ebit'),
            erUtilidadNeta: document.getElementById('er-utilidad-neta'),
            bgTotalActivo: document.getElementById('bg-total-activo'),
            bgActivoCorriente: document.getElementById('bg-activo-corriente'),
            bgActivoNoCorriente: document.getElementById('bg-activo-no-corriente'),
            bgTotalPasivoPatrimonio: document.getElementById('bg-total-pasivo-patrimonio'),
            bgTotalPasivo: document.getElementById('bg-total-pasivo'),
            bgTotalPatrimonio: document.getElementById('bg-total-patrimonio'),
            indMargenBruto: document.getElementById('ind-margen-bruto'),
            indMargenNeto: document.getElementById('ind-margen-neto'),
            indRoe: document.getElementById('ind-roe'),
            indLiquidez: document.getElementById('ind-liquidez'),
            compPeriodoActual: document.getElementById('comp-periodo-actual'),
            compPeriodoPrevio: document.getElementById('comp-periodo-previo'),
            compVentasActual: document.getElementById('comp-ventas-actual'),
            compVentasPrevio: document.getElementById('comp-ventas-previo'),
            compVentasVar: document.getElementById('comp-ventas-var'),
            compUtilidadActual: document.getElementById('comp-utilidad-actual'),
            compUtilidadPrevio: document.getElementById('comp-utilidad-previo'),
            compUtilidadVar: document.getElementById('comp-utilidad-var')
        };

        this.init();
    }

    init() {
        const today = new Date();
        const periodoDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        if (this.inputPeriodo && !this.inputPeriodo.value) {
            this.inputPeriodo.value = periodoDefault;
        }

        this.setupEvents();
        this.cargarEmpresas();
    }

    setupEvents() {
        if (this.btnGenerar) {
            this.btnGenerar.addEventListener('click', () => this.generarReporte());
        }
        if (this.btnActualizar) {
            this.btnActualizar.addEventListener('click', () => this.generarReporte());
        }

        if (this.btnImprimir) {
            this.btnImprimir.addEventListener('click', () => window.print());
        }

        if (this.btnDescargarPdf) {
            this.btnDescargarPdf.addEventListener('click', () => this.exportar('pdf'));
        }

        if (this.btnExportarExcel) {
            this.btnExportarExcel.addEventListener('click', () => this.exportar('excel'));
        }
    }

    async cargarEmpresas() {
        if (!this.selectEmpresa) return;

        try {
            const res = await fetch('/api/empresas', { credentials: 'same-origin' });
            if (!res.ok) throw new Error('No se pudieron cargar empresas');
            const empresas = await res.json();

            this.selectEmpresa.innerHTML = '<option value="">Seleccione una empresa</option>';
            (empresas || []).forEach((e) => {
                const opt = document.createElement('option');
                opt.value = e.ID_EMPRESA;
                opt.textContent = e.NOMBRE_EMPRESA || 'Sin nombre';
                this.selectEmpresa.appendChild(opt);
            });
        } catch (e) {
            this.selectEmpresa.innerHTML = '<option value="">Error al cargar empresas</option>';
        }
    }

    formatCurrency(value) {
        const n = Number(value);
        const safe = Number.isFinite(n) ? n : 0;
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(safe);
    }

    formatPercent(value) {
        const n = Number(value);
        const safe = Number.isFinite(n) ? n : 0;
        return `${safe.toFixed(1)}%`;
    }

    setText(el, text) {
        if (!el) return;
        el.textContent = text;
    }

    async fetchReporte(empresaId, periodo) {
        const url = new URL('/api/reportes', window.location.origin);
        url.searchParams.set('empresaId', empresaId);
        url.searchParams.set('periodo', periodo);

        const res = await fetch(url.toString(), { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Error al obtener reporte');
        }
        return json.data;
    }

    parsePeriodo(periodo) {
        const m = /^\d{4}-\d{2}$/.exec((periodo || '').trim());
        if (!m) return null;
        const [anioStr, mesStr] = periodo.split('-');
        const anio = Number(anioStr);
        const mes = Number(mesStr);
        if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;
        return { anio, mes };
    }

    addMonths(periodo, delta) {
        const p = this.parsePeriodo(periodo);
        if (!p) return null;
        const total = p.anio * 12 + (p.mes - 1) + Number(delta || 0);
        const y = Math.floor(total / 12);
        const m = (total % 12) + 1;
        return `${y}-${String(m).padStart(2, '0')}`;
    }

    calcularPeriodoComparativo(periodo, tipo) {
        switch (tipo) {
            case 'mes-anterior':
                return this.addMonths(periodo, -1);
            case 'trimestre-anterior':
                return this.addMonths(periodo, -3);
            case 'anio-anterior':
                return this.addMonths(periodo, -12);
            default:
                return null;
        }
    }

    applyReporteToUI(reporte) {
        const empresaNombre = reporte?.periodoFinanciero?.NOMBRE_EMPRESA || '';
        this.setText(this.ui.empresasNombre, empresaNombre);
        this.setText(this.ui.periodoTexto, reporte?.periodo || '');

        const calc = reporte?.calculos || {};
        const er = calc.estadoResultados || {};
        const bg = calc.balanceGeneral || {};
        const fo = calc.flujoOperativo || {};
        const ind = reporte?.indicadores || {};

        this.setText(this.ui.kpiVentas, this.formatCurrency(er.ventasNetas));
        this.setText(this.ui.kpiUtilidad, this.formatCurrency(er.utilidadNeta));
        this.setText(this.ui.kpiActivo, this.formatCurrency(bg.totalActivo));
        this.setText(this.ui.kpiSaldo, this.formatCurrency(fo.saldoActual));

        this.setText(this.ui.erVentas, this.formatCurrency(er.ventasNetas));
        this.setText(this.ui.erCosto, this.formatCurrency(er.costoVentas));
        this.setText(this.ui.erUtilidadVentas, this.formatCurrency(er.utilidadVentas));
        this.setText(this.ui.erGastos, this.formatCurrency(er.gastosOperativos));
        this.setText(this.ui.erEbit, this.formatCurrency(er.ebit));
        this.setText(this.ui.erUtilidadNeta, this.formatCurrency(er.utilidadNeta));

        this.setText(this.ui.bgTotalActivo, this.formatCurrency(bg.totalActivo));
        this.setText(this.ui.bgActivoCorriente, this.formatCurrency(bg.activoCorriente));
        this.setText(this.ui.bgActivoNoCorriente, this.formatCurrency(bg.activoNoCorriente));
        this.setText(this.ui.bgTotalPasivoPatrimonio, this.formatCurrency(bg.totalPasivoPatrimonio));
        this.setText(this.ui.bgTotalPasivo, this.formatCurrency(bg.totalPasivo));
        this.setText(this.ui.bgTotalPatrimonio, this.formatCurrency(bg.patrimonio));

        this.setText(this.ui.indMargenBruto, this.formatPercent(ind.margenBruto));
        this.setText(this.ui.indMargenNeto, this.formatPercent(ind.margenNeto));
        this.setText(this.ui.indRoe, this.formatPercent(ind.roe));
        this.setText(this.ui.indLiquidez, Number(ind.liquidez || 0).toFixed(2));
    }

    applyComparativoToUI(actual, previo) {
        if (!actual || !previo) return;

        const erA = actual?.calculos?.estadoResultados || {};
        const erP = previo?.calculos?.estadoResultados || {};

        const ventasA = Number(erA.ventasNetas || 0);
        const ventasP = Number(erP.ventasNetas || 0);
        const utilA = Number(erA.utilidadNeta || 0);
        const utilP = Number(erP.utilidadNeta || 0);

        const varVentas = ventasP ? ((ventasA - ventasP) / ventasP) * 100 : 0;
        const varUtil = utilP ? ((utilA - utilP) / utilP) * 100 : 0;

        this.setText(this.ui.compPeriodoActual, actual?.periodo || '');
        this.setText(this.ui.compPeriodoPrevio, previo?.periodo || '');

        this.setText(this.ui.compVentasActual, this.formatCurrency(ventasA));
        this.setText(this.ui.compVentasPrevio, this.formatCurrency(ventasP));
        this.setText(this.ui.compVentasVar, this.formatPercent(varVentas));

        this.setText(this.ui.compUtilidadActual, this.formatCurrency(utilA));
        this.setText(this.ui.compUtilidadPrevio, this.formatCurrency(utilP));
        this.setText(this.ui.compUtilidadVar, this.formatPercent(varUtil));
    }

    async generarReporte() {
        const empresaId = this.selectEmpresa?.value;
        const periodo = this.inputPeriodo?.value;

        if (!empresaId || !periodo) {
            alert('Seleccione empresa y período');
            return;
        }

        try {
            const actual = await this.fetchReporte(empresaId, periodo);
            if (!actual?.periodoFinanciero) {
                alert('No existe período financiero o no hay datos para ese período');
                return;
            }

            this.applyReporteToUI(actual);

            const tipoComp = this.selectPeriodoComparativo?.value;
            const periodoPrevio = this.calcularPeriodoComparativo(periodo, tipoComp);

            if (periodoPrevio) {
                const previo = await this.fetchReporte(empresaId, periodoPrevio);
                if (previo?.periodoFinanciero) {
                    this.applyComparativoToUI(actual, previo);
                }
            }

            const incluirGraficos = document.getElementById('incluir-graficos')?.checked;
            if (incluirGraficos) {
                this.generarGraficos(empresaId, periodo);
            }
        } catch (e) {
            alert(e.message);
        }
    }

    async generarGraficos(empresaId, periodo) {
        const canvas = document.getElementById('chart-ventas');
        if (!canvas) return;

        if (typeof Chart === 'undefined') {
            return;
        }

        const url = new URL('/api/reportes/historico', window.location.origin);
        url.searchParams.set('empresaId', empresaId);
        url.searchParams.set('periodo', periodo);
        url.searchParams.set('meses', '6');

        const res = await fetch(url.toString(), { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok || !json.success) return;

        const data = json.data || {};
        const labels = data.periodos || [];
        const ventas = data.ventasNetas || [];

        if (this._chartVentas) {
            this._chartVentas.destroy();
        }

        this._chartVentas = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Ventas Netas',
                        data: ventas,
                        borderWidth: 2,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13,110,253,0.15)',
                        tension: 0.25,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => {
                                const n = Number(value);
                                if (!Number.isFinite(n)) return value;
                                return new Intl.NumberFormat('es-BO', { notation: 'compact' }).format(n);
                            }
                        }
                    }
                }
            }
        });
    }

    async exportar(formato) {
        const empresaId = this.selectEmpresa?.value;
        const periodo = this.inputPeriodo?.value;

        if (!empresaId || !periodo) {
            alert('Seleccione empresa y período');
            return;
        }

        const endpoint = formato === 'excel' ? '/api/reportes/exportar/excel' : '/api/reportes/exportar/pdf';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ empresaId, periodo })
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(json?.message || 'No se pudo exportar');
            }

            alert('Exportación iniciada');
        } catch (e) {
            alert(e.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ReportesManager();
});
