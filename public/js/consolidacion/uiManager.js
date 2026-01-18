(function () {
    class UiManager {
        constructor({ tipoPeriodoSelect, desdeContainer, hastaContainer, infoDiv, infoTexto, empresasContainer }) {
            this.tipoPeriodoSelect = tipoPeriodoSelect;
            this.desdeContainer = desdeContainer;
            this.hastaContainer = hastaContainer;
            this.infoDiv = infoDiv;
            this.infoTexto = infoTexto;
            this.empresasContainer = empresasContainer;
        }

        initPeriodoUI() {
            this.actualizarInterfazPeriodo();
            this.tipoPeriodoSelect?.addEventListener('change', () => this.actualizarInterfazPeriodo());
        }

        actualizarInterfazPeriodo() {
            if (!this.tipoPeriodoSelect || !this.desdeContainer || !this.hastaContainer || !this.infoTexto || !this.infoDiv) {
                return;
            }

            const tipoPeriodo = this.tipoPeriodoSelect.value;
            let desdeHtml = '';
            let hastaHtml = '';
            let infoText = '';

            switch (tipoPeriodo) {
                case 'mensual':
                    desdeHtml = `
                        <label for="desde-select" class="form-label">Desde</label>
                        <input type="month" id="desde-select" class="form-control" value="2025-01" min="2010-01" max="2030-12">
                    `;
                    hastaHtml = `
                        <label for="hasta-select" class="form-label">Hasta</label>
                        <input type="month" id="hasta-select" class="form-control" value="2025-12" min="2010-01" max="2030-12">
                    `;
                    infoText = 'Seleccione el rango de meses para consolidar (2010-2030)';
                    break;
                case 'trimestral':
                    desdeHtml = `
                        <label for="trimestre-desde" class="form-label">Desde</label>
                        <input type="month" id="trimestre-desde" class="form-control" value="2025-01" min="2010-01" max="2030-12">
                    `;
                    hastaHtml = `
                        <label for="trimestre-hasta" class="form-label">Hasta</label>
                        <input type="month" id="trimestre-hasta" class="form-control" value="2025-12" min="2010-01" max="2030-12">
                    `;
                    infoText = 'Seleccione el rango de meses para consolidar por trimestres (2010-2030)';
                    break;
                case 'anual-fiscal':
                    desdeHtml = `
                        <label for="anio-desde" class="form-label">Desde</label>
                        <input type="number" id="anio-desde" class="form-control" placeholder="Ej: 2015" min="2010" max="2030" value="2025">
                        <small class="text-muted">2015 = Año fiscal 2015-2016 (Abril 2015 - Marzo 2016)</small>
                    `;
                    hastaHtml = `
                        <label for="anio-hasta" class="form-label">Hasta</label>
                        <input type="number" id="anio-hasta" class="form-control" placeholder="Ej: 2025" min="2010" max="2030" value="2025">
                        <small class="text-muted">2025 = Año fiscal 2025-2026 (Abril 2025 - Marzo 2026)</small>
                    `;
                    infoText = 'Año fiscal: El año indica el año fiscal (ej: 2015 = 2015-2016)';
                    break;
            }

            this.desdeContainer.innerHTML = desdeHtml;
            this.hastaContainer.innerHTML = hastaHtml;
            this.infoTexto.textContent = infoText;
            this.infoDiv.style.display = 'block';
        }

        renderEmpresas(empresas) {
            if (!this.empresasContainer) return;

            this.empresasContainer.innerHTML = '';

            if (!Array.isArray(empresas) || empresas.length === 0) {
                this.empresasContainer.innerHTML = '<div class="text-muted">No hay empresas registradas</div>';
                return;
            }

            for (const empresa of empresas) {
                const id = empresa.ID_EMPRESA;
                const nombre = empresa.NOMBRE_EMPRESA || 'Sin nombre';

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
        }

        renderEmpresasError() {
            if (!this.empresasContainer) return;
            this.empresasContainer.innerHTML = '<div class="text-danger">Error al cargar empresas</div>';
        }

        getEmpresasSeleccionadas() {
            if (!this.empresasContainer) return [];
            return Array.from(this.empresasContainer.querySelectorAll('.empresa-check:checked'))
                .map((x) => Number(x.value))
                .filter((x) => Number.isInteger(x));
        }

        limpiarFormulariosConsolidados() {
            const inputs = document.querySelectorAll('input[name$="_consolidado"]');
            inputs.forEach((inp) => {
                inp.value = '';
            });
        }

        setInputValue(name, value) {
            const input = document.querySelector(`[name="${name}"]`);
            if (!input) return;
            const n = Number(value);
            input.value = Number.isFinite(n) ? n.toFixed(2) : '0.00';
        }

        applySection(sectionData, suffix, prefix = '') {
            if (!sectionData || typeof sectionData !== 'object') return;

            Object.entries(sectionData).forEach(([rawKey, val]) => {
                if (rawKey.startsWith('ID_')) return;
                const inputName = `${prefix}${rawKey.toLowerCase()}_${suffix}`;
                this.setInputValue(inputName, val);
            });
        }

        sincronizarCamposCalculados() {
            const foTotalIngresos = document.querySelector('[name="fo_total_ingresos_consolidado"]');
            const foIngresosCalculado = document.querySelector('[name="fo_ingresos_calculado_consolidado"]');
            if (foTotalIngresos && foIngresosCalculado) {
                foIngresosCalculado.value = foTotalIngresos.value;
            }

            const foTotalEgresos = document.querySelector('[name="fo_total_egresos_consolidado"]');
            const foEgresosCalculado = document.querySelector('[name="fo_egresos_calculado_consolidado"]');
            if (foTotalEgresos && foEgresosCalculado) {
                foEgresosCalculado.value = foTotalEgresos.value;
            }

            const fcTotalIngresos = document.querySelector('[name="fc_total_ingresos_consolidado"]');
            const fcIngresosCalculado = document.querySelector('[name="fc_ingresos_calculado_consolidado"]');
            if (fcTotalIngresos && fcIngresosCalculado) {
                fcIngresosCalculado.value = fcTotalIngresos.value;
            }

            const fcTotalEgresos = document.querySelector('[name="fc_total_egresos_consolidado"]');
            const fcEgresosCalculado = document.querySelector('[name="fc_egresos_calculado_consolidado"]');
            if (fcTotalEgresos && fcEgresosCalculado) {
                fcEgresosCalculado.value = fcTotalEgresos.value;
            }
        }

        updateEmpresasCount(count) {
            const countSpan = document.getElementById('empresas-count');
            if (countSpan) {
                countSpan.textContent = count;
            }
        }
    }

    window.UiManager = UiManager;
})();
