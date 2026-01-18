class ConsolidacionManager {
    constructor() {
        this.tipoPeriodoSelect = document.getElementById('tipo-periodo');
        this.btnGenerar = document.getElementById('btn-generar-consolidacion');
        this.empresasContainer = document.getElementById('empresas-checklist');
        this.desdeContainer = document.getElementById('desde-container');
        this.hastaContainer = document.getElementById('hasta-container');
        this.infoDiv = document.getElementById('info-periodo');
        this.infoTexto = document.getElementById('texto-info-periodo');

        this.apiService = new window.ApiService();
        this.periodConverter = new window.PeriodConverter();
        this.uiManager = new window.UiManager({
            tipoPeriodoSelect: this.tipoPeriodoSelect,
            desdeContainer: this.desdeContainer,
            hastaContainer: this.hastaContainer,
            infoDiv: this.infoDiv,
            infoTexto: this.infoTexto,
            empresasContainer: this.empresasContainer
        });

        this.init();
    }

    async init() {
        this.uiManager.limpiarFormulariosConsolidados();
        this.uiManager.initPeriodoUI();
        await this.cargarEmpresas();
        this.setupEvents();
    }

    setupEvents() {
        if (this.btnGenerar) {
            this.btnGenerar.addEventListener('click', () => this.generarReporte());
        }
    }

    async cargarEmpresas() {
        try {
            console.log('🔄 Cargando empresas desde API...');
            const empresas = await this.apiService.fetchEmpresas();
            console.log('✅ Empresas recibidas:', empresas);
            this.uiManager.renderEmpresas(empresas);
        } catch (error) {
            console.error('❌ Error al cargar empresas en consolidación:', error);
            this.uiManager.renderEmpresasError();
        }
    }

    obtenerRango(tipoPeriodo) {
        let desde;
        let hasta;

        switch (tipoPeriodo) {
            case 'mensual':
                desde = document.getElementById('desde-select')?.value;
                hasta = document.getElementById('hasta-select')?.value;
                break;
            case 'trimestral':
                desde = document.querySelector('input[type="month"][id*="trimestre-desde"]')?.value;
                hasta = document.querySelector('input[type="month"][id*="trimestre-hasta"]')?.value;
                break;
            case 'anual-fiscal':
                const anioDesde = document.querySelector('input[type="number"][id*="anio-desde"]')?.value;
                const anioHasta = document.querySelector('input[type="number"][id*="anio-hasta"]')?.value;
                desde = this.periodConverter.convertirAnioFiscalAMes(anioDesde);
                hasta = this.periodConverter.convertirAnioFiscalAMes(anioHasta, true);
                break;
        }

        return { desde, hasta };
    }

    async generarReporte() {
        const empresas = this.uiManager.getEmpresasSeleccionadas();
        const tipoPeriodo = this.tipoPeriodoSelect?.value || 'mensual';
        const { desde, hasta } = this.obtenerRango(tipoPeriodo);

        console.log('🔍 Parámetros de consolidación:', { empresas, tipoPeriodo, desde, hasta });

        if (typeof window.validarEmpresas === 'function') {
            if (!window.validarEmpresas(empresas)) {
                alert('Seleccione al menos una empresa.');
                return;
            }
        } else if (!empresas.length) {
            alert('Seleccione al menos una empresa.');
            return;
        }

        if (typeof window.validarRangoFechas === 'function') {
            if (!window.validarRangoFechas(desde, hasta)) {
                alert('Seleccione rango de fechas.');
                return;
            }
        } else if (!desde || !hasta) {
            alert('Seleccione rango de fechas.');
            return;
        }

        try {
            const result = await this.apiService.generarConsolidacion({
                empresas,
                desde,
                hasta,
                tipo: tipoPeriodo
            });
            const data = result.data || {};

            if (data.datosPorPeriodo && window.actualizarTablaConsolidacion) {
                window.actualizarTablaConsolidacion(data.datosPorPeriodo);
            }
            if (data.datosPorPeriodoBG && window.actualizarTablaBalance) {
                window.actualizarTablaBalance(data.datosPorPeriodoBG);
            }
            if (data.datosPorPeriodoFO && window.actualizarTablaFlujoOperativo) {
                window.actualizarTablaFlujoOperativo(data.datosPorPeriodoFO);
            }
            if (data.datosPorPeriodoFC && window.actualizarTablaFlujoCorporativo) {
                window.actualizarTablaFlujoCorporativo(data.datosPorPeriodoFC);
            }

            this.uiManager.applySection(data.estadoResultados, 'consolidado', '');
            this.uiManager.applySection(data.balanceGeneral, 'consolidado', '');
            this.uiManager.applySection(data.flujoOperativo, 'consolidado', 'fo_');
            this.uiManager.applySection(data.flujoCorporativo, 'consolidado', 'fc_');
            this.uiManager.sincronizarCamposCalculados();
            this.uiManager.updateEmpresasCount(empresas.length);

            if (data.datosPorPeriodo?.periodos) {
                console.log(`✅ Consolidación ${tipoPeriodo} generada con ${data.datosPorPeriodo.periodos.length} período(s)`);
            }
        } catch (error) {
            console.error('Error al generar consolidación:', error);
            alert(`Error: ${error.message}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ConsolidacionManager();
});
