class ConsolidacionReportesViewer {
    constructor() {
        this.empresasCountEl = document.getElementById('rep-empresas-count');
        this.periodoTextoEl = document.getElementById('rep-periodo-texto');
        this.apiService = typeof window.ApiService === 'function' ? new window.ApiService() : null;
        this.init();
    }

    async init() {
        try {
            // Si el servidor ya dejó una consolidación en window.consolidacionDatosUltimos, úsala
            if (window.consolidacionDatosUltimos) {
                const meta = window.consolidacionUltimaMeta || null;
                this.renderFromData(window.consolidacionDatosUltimos, meta);
                return;
            }

            if (!this.apiService) {
                console.error('ApiService no está disponible');
                if (this.periodoTextoEl) this.periodoTextoEl.textContent = 'Error al inicializar el visor.';
                return;
            }

            await this.generarConsolidacionPorDefecto();
        } catch (error) {
            console.error('Error al inicializar visor de reportes de consolidación:', error);
            if (this.periodoTextoEl) this.periodoTextoEl.textContent = `Error: ${error.message}`;
        }
    }

    async obtenerEmpresasIds() {
        try {
            const response = await fetch('/api/empresas', { credentials: 'same-origin' });
            const empresas = await response.json();
            if (!Array.isArray(empresas)) return [];
            return empresas.map(e => e.ID_EMPRESA).filter(Boolean);
        } catch (error) {
            console.error('Error al obtener empresas para reportes:', error);
            return [];
        }
    }

    calcularUltimos12Meses() {
        const hoy = new Date();
        const y = hoy.getFullYear();
        const m = hoy.getMonth() + 1; // 1-12

        // Hasta: mes actual
        const hasta = `${y}-${String(m).padStart(2, '0')}`;

        // Desde: 11 meses antes
        let desdeYear = y;
        let desdeMonth = m - 11;
        while (desdeMonth <= 0) {
            desdeMonth += 12;
            desdeYear -= 1;
        }
        const desde = `${desdeYear}-${String(desdeMonth).padStart(2, '0')}`;

        return { desde, hasta };
    }

    async generarConsolidacionPorDefecto() {
        const empresas = await this.obtenerEmpresasIds();
        if (!empresas.length) {
            if (this.periodoTextoEl) this.periodoTextoEl.textContent = 'No hay empresas registradas para consolidar.';
            return;
        }

        const { desde, hasta } = this.calcularUltimos12Meses();

        try {
            const result = await this.apiService.generarConsolidacion({
                empresas,
                desde,
                hasta,
                tipo: 'mensual'
            });
            const data = result.data || {};
            this.renderFromData(data, {
                desde,
                hasta,
                empresasCount: empresas.length
            });
        } catch (error) {
            console.error('Error al generar consolidación para reportes:', error);
            if (this.periodoTextoEl) this.periodoTextoEl.textContent = `Error: ${error.message}`;
        }
    }

    renderFromData(data, meta) {
        if (!data) return;
        // Guardar para exportaciones
        window.consolidacionDatosUltimos = data;

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

        const empresasCount = meta && meta.empresasCount ? meta.empresasCount : (Array.isArray(meta?.empresas) ? meta.empresas.length : null);
        if (this.empresasCountEl && empresasCount != null) {
            this.empresasCountEl.textContent = empresasCount;
        }
        if (this.periodoTextoEl && meta && meta.desde && meta.hasta) {
            this.periodoTextoEl.textContent = `Mensual • Desde ${meta.desde} hasta ${meta.hasta}`;
        }
    }
}

// Exportar los 4 reportes consolidados (ER, BG, FO, FC) en un solo CSV
window.exportAllConsolidacion = function () {
    const secciones = [
        { titulo: 'Estado de Resultados Consolidado', selector: '#tabla-consolidado' },
        { titulo: 'Balance General Consolidado', selector: '#tabla-balance-periodos' },
        { titulo: 'Flujo Operativo Consolidado', selector: '#tabla-fo-periodos' },
        { titulo: 'Flujo Corporativo Consolidado', selector: '#tabla-fc-periodos' }
    ];

    const lineas = [];

    secciones.forEach((sec, idx) => {
        const table = document.querySelector(sec.selector);
        if (!table) return;

        lineas.push(sec.titulo);

        const rows = table.querySelectorAll('thead tr, tbody tr');
        rows.forEach(row => {
            const cells = Array.from(row.children).map(td => {
                const txt = (td.innerText || '').trim().replace(/\s+/g, ' ');
                const safe = txt.replace(/"/g, '""');
                return `"${safe}"`;
            });
            lineas.push(cells.join(','));
        });

        if (idx < secciones.length - 1) {
            lineas.push('');
        }
    });

    if (!lineas.length) {
        alert('No hay datos para exportar.');
        return;
    }

    const csvContent = lineas.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consolidacion-completa.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('consolidacion-reportes-root')) {
        new ConsolidacionReportesViewer();
    }
});

