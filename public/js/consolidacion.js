class ConsolidacionManager {
    constructor() {
        this.desdeInput = document.getElementById('desde-select');
        this.hastaInput = document.getElementById('hasta-select');
        this.empresasContainer = document.getElementById('empresas-checklist');
        this.btnGenerar = document.getElementById('btn-generar-consolidacion');

        this.init();
    }

    async init() {
        // Limpiar posibles valores mock iniciales en los formularios
        this.limpiarFormulariosConsolidados();
        await this.cargarEmpresas();
        this.setupEvents();
    }

    setupEvents() {
        if (this.btnGenerar) {
            this.btnGenerar.addEventListener('click', () => this.generarReporte());
        }
    }

    async cargarEmpresas() {
        if (!this.empresasContainer) return;

        try {
            console.log('🔄 Cargando empresas desde API...');
            const response = await fetch('/api/empresas');
            const empresas = await response.json();
            
            console.log('✅ Empresas recibidas:', empresas);
            console.log('📊 Total empresas:', empresas.length);

            this.empresasContainer.innerHTML = '';

            if (!Array.isArray(empresas) || empresas.length === 0) {
                this.empresasContainer.innerHTML = '<div class="text-muted">No hay empresas registradas</div>';
                return;
            }

            for (const empresa of empresas) {
                const id = empresa.ID_EMPRESA;
                const nombre = empresa.NOMBRE_EMPRESA || 'Sin nombre';

                console.log(`🏢 Creando checkbox para empresa: ${nombre} (ID: ${id})`);

                const wrapper = document.createElement('div');
                wrapper.className = 'form-check';

                const input = document.createElement('input');
                input.className = 'form-check-input empresa-check';
                input.type = 'checkbox';
                input.id = `empresa-${id}`;
                input.value = id;

                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.htmlFor = input.id;
                label.textContent = nombre;

                wrapper.appendChild(input);
                wrapper.appendChild(label);
                this.empresasContainer.appendChild(wrapper);
            }

            console.log('✅ Checkboxes de empresas creados:', empresas.length);
        } catch (error) {
            console.error('❌ Error al cargar empresas en consolidación:', error);
            this.empresasContainer.innerHTML = '<div class="text-danger">Error al cargar empresas</div>';
        }
    }

    getEmpresasSeleccionadas() {
        if (!this.empresasContainer) return [];
        return Array.from(this.empresasContainer.querySelectorAll('.empresa-check:checked'))
            .map((x) => Number(x.value))
            .filter((x) => Number.isInteger(x));
    }

    setInputValue(name, value) {
        const input = document.querySelector(`[name="${name}"]`);
        if (!input) return;
        const n = Number(value);
        input.value = Number.isFinite(n) ? n.toFixed(2) : '0.00';
    }

    limpiarFormulariosConsolidados() {
        // Vacía todos los inputs que terminan en _consolidado para quitar mocks del HTML
        const inputs = document.querySelectorAll('input[name$="_consolidado"]');
        inputs.forEach(inp => {
            inp.value = '';
        });
    }

    applySection(sectionData, suffix, prefix = '') {
        if (!sectionData || typeof sectionData !== 'object') return;

        Object.entries(sectionData).forEach(([rawKey, val]) => {
            if (rawKey.startsWith('ID_')) return;
            const inputName = `${prefix}${rawKey.toLowerCase()}_${suffix}`;
            this.setInputValue(inputName, val);
        });
    }

    async generarReporte() {
        const empresas = this.getEmpresasSeleccionadas();
        const desde = this.desdeInput?.value;
        const hasta = this.hastaInput?.value;

        if (!empresas.length) {
            alert('Seleccione al menos una empresa.');
            return;
        }
        if (!desde || !hasta) {
            alert('Seleccione rango de fechas (desde/hasta).');
            return;
        }

        try {
            const response = await fetch('/api/consolidacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresas, desde, hasta })
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Error al consolidar');
            }

            const data = result.data || {};
            // ER y BG no tienen prefijo en los inputs
            this.applySection(data.estadoResultados, 'consolidado', '');
            this.applySection(data.balanceGeneral, 'consolidado', '');
            // FO y FC usan prefijos 'fo_' y 'fc_' respectivamente en los nombres de input
            this.applySection(data.flujoOperativo, 'consolidado', 'fo_');
            this.applySection(data.flujoCorporativo, 'consolidado', 'fc_');

            // Actualizar contador de empresas
            const countSpan = document.getElementById('empresas-count');
            if (countSpan) {
                countSpan.textContent = empresas.length;
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
