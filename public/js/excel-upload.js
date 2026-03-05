class ExcelUploadManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupEmpresaWatcher();
    }

    setupEventListeners() {
        // Selección de archivo
        document.getElementById('excel-file').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Cambio de tipo de estado
        document.getElementById('tipo-estado').addEventListener('change', () => {
            this.updateInstructions();
        });

        // Botón de subir
        document.getElementById('btn-subir-excel').addEventListener('click', () => {
            this.uploadExcel();
        });
    }

    setupEmpresaWatcher() {
        // Observar cambios en el selector de empresa
        const empresaSelect = document.getElementById('empresa-select');
        if (empresaSelect) {
            empresaSelect.addEventListener('change', () => {
                this.updateEmpresaInfo();
            });
            this.updateEmpresaInfo(); // Actualizar al cargar
        }
    }

    updateEmpresaInfo() {
        const empresaSelect = document.getElementById('empresa-select');
        const empresaNombre = document.getElementById('excel-empresa-nombre');
        const btnSubir = document.getElementById('btn-subir-excel');
        const fileInput = document.getElementById('excel-file');

        if (empresaSelect.value) {
            const selectedOption = empresaSelect.options[empresaSelect.selectedIndex];
            empresaNombre.textContent = selectedOption.text;
            btnSubir.disabled = !fileInput.files[0];
        } else {
            empresaNombre.textContent = 'Seleccione empresa arriba';
            btnSubir.disabled = true;
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        const btnSubir = document.getElementById('btn-subir-excel');
        const empresaSelect = document.getElementById('empresa-select');

        if (file) {
            // Validar tipo de archivo
            const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!validTypes.includes(file.type)) {
                this.showError('Por favor, seleccione un archivo Excel válido (.xlsx, .xls)');
                event.target.value = '';
                return;
            }

            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                this.showError('El archivo es demasiado grande. Máximo 5MB.');
                event.target.value = '';
                return;
            }

            btnSubir.disabled = !empresaSelect.value;
        } else {
            btnSubir.disabled = true;
        }
    }

    updateInstructions() {
        const tipoEstado = document.getElementById('tipo-estado').value;
        const fileInput = document.getElementById('excel-file');
        const formText = fileInput.parentElement.querySelector('.form-text');
        
        if (tipoEstado === 'BALANCE_GENERAL') {
            formText.textContent = 'Formato: Conceptos en filas, períodos en columnas (ej: Disponible, Exigible, etc.)';
        } else {
            formText.textContent = 'Formato: Conceptos en filas, períodos en columnas (ej: ene-26, feb-26)';
        }
    }

    async uploadExcel() {
        const fileInput = document.getElementById('excel-file');
        const empresaSelect = document.getElementById('empresa-select');
        const tipoEstado = document.getElementById('tipo-estado').value;
        const file = fileInput.files[0];

        if (!file) {
            this.showError('Por favor, seleccione un archivo Excel');
            return;
        }

        if (!empresaSelect.value) {
            this.showError('Por favor, seleccione una empresa');
            return;
        }

        if (!tipoEstado) {
            this.showError('Por favor, seleccione un tipo de estado financiero');
            return;
        }

        // Mostrar progreso
        this.showProgress();

        try {
            const formData = new FormData();
            formData.append('excelFile', file);

            // Seleccionar endpoint según el tipo
            const endpoint = tipoEstado === 'BALANCE_GENERAL' 
                ? `/api/excel/balance-general/${empresaSelect.value}`
                : `/api/excel/estado-resultados/${empresaSelect.value}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showResults(result.data);
                // Limpiar archivo
                fileInput.value = '';
                document.getElementById('btn-subir-excel').disabled = true;
            } else {
                this.showError(result.message || 'Error al procesar el archivo');
            }

        } catch (error) {
            console.error('Error subiendo Excel:', error);
            this.showError('Error de conexión al servidor');
        } finally {
            this.hideProgress();
        }
    }

    showProgress() {
        document.getElementById('excel-progreso').style.display = 'block';
        document.getElementById('excel-resultados').style.display = 'none';
        
        const progressBar = document.getElementById('excel-progress-bar');
        const mensaje = document.getElementById('excel-mensaje');
        
        progressBar.style.width = '50%';
        mensaje.className = 'alert alert-info mb-0';
        mensaje.textContent = 'Procesando archivo...';
    }

    hideProgress() {
        const progressBar = document.getElementById('excel-progress-bar');
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            document.getElementById('excel-progreso').style.display = 'none';
        }, 500);
    }

    showResults(data) {
        const resultadosDiv = document.getElementById('excel-resultados');
        const resumen = data.resumen;
        
        let html = `
            <div class="alert alert-success">
                <h6 class="alert-heading">
                    <i class="bi bi-check-circle me-2"></i>Procesamiento Completado
                </h6>
                <div class="row mt-3">
                    <div class="col-md-3">
                        <strong>Períodos procesados:</strong> ${resumen.periodos_procesados}
                    </div>
                    <div class="col-md-3">
                        <strong>Registros insertados:</strong> <span class="text-success">${resumen.registros_insertados}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Registros actualizados:</strong> <span class="text-warning">${resumen.registros_actualizados}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Errores:</strong> <span class="text-danger">${resumen.errores_count}</span>
                    </div>
                </div>
        `;

        // Mostrar detalles si hay
        console.log('🔍 Data recibida:', data);
        console.log('🔍 Detalles:', data.detalles);
        console.log('🔍 Es array?:', Array.isArray(data.detalles));
        
        if (data && data.detalles && Array.isArray(data.detalles) && data.detalles.length > 0) {
            html += `
                <hr class="my-3">
                <h6>Detalles:</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Período</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.detalles.forEach(detalle => {
                const badgeClass = detalle.accion === 'insertado' ? 'bg-success' : 'bg-warning';
                html += `
                    <tr>
                        <td>${detalle.periodo}</td>
                        <td><span class="badge ${badgeClass}">${detalle.accion}</span></td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Mostrar errores si hay
        if (data.errores && data.errores.length > 0) {
            html += `
                <hr class="my-3">
                <h6 class="text-danger">Errores:</h6>
                <ul class="mb-0">
            `;
            
            data.errores.forEach(error => {
                html += `<li class="text-danger">${error}</li>`;
            });
            
            html += `</ul>`;
        }

        html += `</div>`;
        
        resultadosDiv.innerHTML = html;
        resultadosDiv.style.display = 'block';
    }

    showError(message) {
        const resultadosDiv = document.getElementById('excel-resultados');
        resultadosDiv.innerHTML = `
            <div class="alert alert-danger">
                <h6 class="alert-heading">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error
                </h6>
                ${message}
            </div>
        `;
        resultadosDiv.style.display = 'block';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ExcelUploadManager();
});
