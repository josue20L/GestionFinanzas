class CargaMensualManager {
    constructor() {
        this.selectEmpresa = document.getElementById('empresa-select');
        this.periodoInput = document.getElementById('periodo-select');
        this.formulariosContainer = document.getElementById('formularios-container');
        this.btnCargarCrear = document.querySelector('.btn-group .btn.btn-primary');
        this.periodoActual = null;
        
        // 🆕 DATOS ORIGINALES PARA DETECTAR CAMBIOS
        this.datosOriginales = {};
        
        // Managers para cada sección
        this.estadoResultadosManager = null;
        this.balanceGeneralManager = null;
        
        // Hacer el manager disponible globalmente para el sidebar
        window.cargaMensualManager = this;
        
        this.init();
    }

    init() {
        // Establecer año y mes actual dinámicamente
        const fechaActual = new Date().toISOString().slice(0, 7);
        this.periodoInput.value = fechaActual;
        
        this.cargarEmpresas();
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.btnCargarCrear) {
            this.btnCargarCrear.addEventListener('click', () => this.cargarOCrearPeriodo());
        }
        
        // VERIFICAR CAMBIOS ANTES DE CAMBIAR DE PERÍODO
        this.selectEmpresa.addEventListener('change', () => this.verificarCambiosAntesDeCambiar());
        this.periodoInput.addEventListener('change', () => this.verificarCambiosAntesDeCambiar());
    }

    async cargarEmpresas() {
        try {
            const response = await fetch('/api/empresas');
            const empresas = await response.json();

            this.selectEmpresa.innerHTML = '<option value="">Seleccione una empresa</option>';

            empresas.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.ID_EMPRESA;
                option.textContent = empresa.NOMBRE_EMPRESA || 'Sin nombre';
                this.selectEmpresa.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar empresas:', error);
            this.showToast('Error al cargar empresas', 'danger');
        }
    }

    async cargarOCrearPeriodo() {
        // VERIFICAR CAMBIOS ANTES DE CAMBIAR DE PERÍODO
        if (this.hayCambiosSinGuardarEnFormularios()) {
            const confirmar = confirm('Tienes cambios sin guardar. ¿Deseas continuar sin guardar?');
            if (!confirmar) {
                return;
            }
        }

        const empresaId = this.selectEmpresa.value;
        const periodo = this.periodoInput.value;

        if (!empresaId || !periodo) {
            this.showToast('Por favor seleccione empresa y período', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            this.showToast('Creando/obteniendo período financiero...', 'info');

            const response = await fetch('/api/periodos-financieros/crear-o-obtener', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_empresa: empresaId,
                    anio: periodo.split('-')[0],
                    mes: periodo.split('-')[1]
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al crear/obtener período');
            }

            this.periodoActual = result.periodo;
            
            // Limpiar campos siempre antes de cargar
            this.limpiarTodosLosCampos();
            
            // Limpiar campos si es nuevo período
            if (result.esNuevo) {
                this.showToast(`✅ Período ${periodo} creado correctamente`, 'success');
            } else {
                this.showToast(`✅ Período ${periodo} cargado correctamente`, 'success');
            }
            
            // Pequeña pausa para que el usuario vea el mensaje
            setTimeout(() => {
                this.mostrarFormularios();
                this.inicializarManagers();
                this.cargarDatosDelPeriodo();
            }, 500);

        } catch (error) {
            console.error('Error al cargar/crear período:', error);
            this.showToast(`❌ Error: ${error.message}`, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    mostrarFormularios() {
        if (this.formulariosContainer) {
            this.formulariosContainer.style.display = 'block';
        }
    }

    inicializarManagers() {
        // Siempre re-instanciar managers con el contenedor correcto de cada pestaña
        const erContainer = document.getElementById('estado-resultados');
        const bgContainer = document.getElementById('balance-general');
        const foContainer = document.getElementById('flujo-operativo');
        const fcContainer = document.getElementById('flujo-corporativo');

        this.estadoResultadosManager = new EstadoResultadosManager(erContainer);
        this.balanceGeneralManager = new BalanceGeneralManager(bgContainer);
        this.flujoOperativoManager = new FlujoOperativoManager(foContainer);
        this.flujoCorporativoManager = new FlujoCorporativoManager(fcContainer);
    }

    async cargarDatosDelPeriodo() {
        this.showToast('📊 Cargando datos financieros...', 'info');
        
        try {
            const resultados = await Promise.all([
                this.estadoResultadosManager.cargarDatos(this.periodoActual.ID_PERIODO),
                this.balanceGeneralManager.cargarDatos(this.periodoActual.ID_PERIODO),
                this.flujoOperativoManager.cargarDatos(this.periodoActual.ID_PERIODO),
                this.flujoCorporativoManager.cargarDatos(this.periodoActual.ID_PERIODO)
            ]);
            
            const [erResult, bgResult, foResult, fcResult] = resultados;
            
            if (erResult.success && bgResult.success && foResult.success && fcResult.success) {
                this.showToast('✅ Datos cargados exitosamente', 'success');
                
                // 🆕 GUARDAR DATOS ORIGINALES DESPUÉS DE CARGAR
                setTimeout(() => {
                    this.guardarDatosOriginales();
                }, 500);
                
                // Actualizar mensaje de validación
                const mensajeValidacion = document.getElementById('mensaje-validacion');
                if (mensajeValidacion) {
                    mensajeValidacion.textContent = 'Datos procesados correctamente';
                    mensajeValidacion.className = 'text-success fw-bold';
                }
            } else {
                throw new Error('Error al cargar algunos datos');
            }
            
        } catch (error) {
            console.error('Error al cargar datos del período:', error);
            this.showToast(`❌ Error al cargar datos: ${error.message}`, 'danger');
            
            // Actualizar mensaje de validación
            const mensajeValidacion = document.getElementById('mensaje-validacion');
            if (mensajeValidacion) {
                mensajeValidacion.textContent = 'Error al cargar datos';
                mensajeValidacion.className = 'text-danger fw-bold';
            }
        }
    }

    async guardarDatos() {
        if (!this.periodoActual) {
            this.showToast('⚠️ No hay período activo para guardar', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            this.showToast('💾 Guardando datos financieros...', 'info');

            // Guardar Estado de Resultados
            this.showToast('📋 Guardando Estado de Resultados...', 'info');
            const erResult = await this.estadoResultadosManager.guardarDatos(this.periodoActual.ID_PERIODO);
            
            if (!erResult.success) {
                throw new Error(erResult.error);
            }
            this.showToast('✅ Estado de Resultados guardado', 'success');

            // Guardar Balance General
            this.showToast('⚖️ Guardando Balance General...', 'info');
            const bgResult = await this.balanceGeneralManager.guardarDatos(this.periodoActual.ID_PERIODO);
            
            if (!bgResult.success) {
                throw new Error(bgResult.error);
            }
            this.showToast('✅ Balance General guardado', 'success');

            // Guardar Flujo Operativo
            this.showToast('💰 Guardando Flujo Operativo...', 'info');
            const foResult = await this.flujoOperativoManager.guardarDatos(this.periodoActual.ID_PERIODO);
            
            if (!foResult.success) {
                throw new Error(foResult.error);
            }
            this.showToast('✅ Flujo Operativo guardado', 'success');

            // Guardar Flujo Corporativo
            this.showToast('🏢 Guardando Flujo Corporativo...', 'info');
            const fcResult = await this.flujoCorporativoManager.guardarDatos(this.periodoActual.ID_PERIODO);
            
            if (!fcResult.success) {
                throw new Error(fcResult.error);
            }
            this.showToast('✅ Flujo Corporativo guardado', 'success');

            // Mensaje final
            this.showToast('🎉 Todos los datos guardados exitosamente', 'success');
            
            // Actualizar mensaje de validación
            const mensajeValidacion = document.getElementById('mensaje-validacion');
            if (mensajeValidacion) {
                mensajeValidacion.textContent = 'Datos guardados correctamente';
                mensajeValidacion.className = 'text-success fw-bold';
            }
            
            // 🆕 ACTUALIZAR DATOS ORIGINALES DESPUÉS DE GUARDAR
            setTimeout(() => {
                this.guardarDatosOriginales();
            }, 500);

        } catch (error) {
            console.error('Error al guardar datos:', error);
            this.showToast(`❌ Error al guardar datos: ${error.message}`, 'danger');
            
            // Actualizar mensaje de validación
            const mensajeValidacion = document.getElementById('mensaje-validacion');
            if (mensajeValidacion) {
                mensajeValidacion.textContent = 'Error al guardar datos';
                mensajeValidacion.className = 'text-danger fw-bold';
            }
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        if (show) {
            this.btnCargarCrear.disabled = true;
            this.btnCargarCrear.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Procesando...';
        } else {
            this.btnCargarCrear.disabled = false;
            this.btnCargarCrear.innerHTML = '<i class="bi bi-folder-open me-2"></i> Cargar o Crear';
        }
    }

    showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // 🆕 MÉTODO NUEVO: Guardar datos originales
    guardarDatosOriginales() {
        if (!this.estadoResultadosManager || !this.balanceGeneralManager || !this.flujoOperativoManager || !this.flujoCorporativoManager) {
            return; // Los managers no están inicializados
        }

        this.datosOriginales = {
            estadoResultados: this.estadoResultadosManager.getFormData(),
            balanceGeneral: this.balanceGeneralManager.getFormData(),
            flujoOperativo: this.flujoOperativoManager.getFormData(),
            flujoCorporativo: this.flujoCorporativoManager.getFormData()
        };
    }

    // 🆕 MÉTODO NUEVO: Verificar cambios antes de cambiar de período
    verificarCambiosAntesDeCambiar() {
        if (this.hayCambiosSinGuardarEnFormularios()) {
            // Usar el modal externo
            if (typeof modalCambios !== 'undefined') {
                modalCambios.mostrar();
                return false; // Detener la acción hasta que el usuario decida
            } else {
                // Fallback a confirm nativo
                const resultado = confirm('¿Deseas continuar sin guardar los cambios actuales?');
                if (!resultado) {
                    return false; // Usuario canceló
                }
            }
        }
        return true; // Continuar si no hay cambios
    }

    hayCambiosSinGuardarEnFormularios() {
        // Si no hay managers aún o sus contenedores no existen, asumir sin cambios
        if (!this.estadoResultadosManager || !this.balanceGeneralManager || !this.flujoOperativoManager || !this.flujoCorporativoManager) {
            return false;
        }

        const safeGet = (mgr) => {
            try {
                return mgr && mgr.getFormData ? mgr.getFormData() : {};
            } catch (_) {
                return {};
            }
        };

        const datosActuales = {
            estadoResultados: safeGet(this.estadoResultadosManager),
            balanceGeneral: safeGet(this.balanceGeneralManager),
            flujoOperativo: safeGet(this.flujoOperativoManager),
            flujoCorporativo: safeGet(this.flujoCorporativoManager)
        };

        try {
            return JSON.stringify(datosActuales) !== JSON.stringify(this.datosOriginales || {});
        } catch (error) {
            console.error('Error al verificar cambios:', error);
            return false;
        }
    }

    // MÉTODO NUEVO: Actualizar indicador visual
    actualizarIndicadorCambios() {
        // El indicador fue eliminado del HTML, ya no se necesita
        // El sistema ahora solo muestra el modal cuando hay cambios
        return true;
    }

    limpiarTodosLosCampos() {
        const managers = [
            this.estadoResultadosManager,
            this.balanceGeneralManager,
            this.flujoOperativoManager,
            this.flujoCorporativoManager
        ];
        
        managers.forEach(manager => {
            if (manager && manager.limpiarCampos) {
                manager.limpiarCampos();
            }
        });
    }
}

// Funciones globales para onclick
let cargaMensualManager;

function guardarDatos() {
    if (cargaMensualManager) {
        cargaMensualManager.guardarDatos();
    } else {
        console.error('cargaMensualManager no está inicializado');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    cargaMensualManager = new CargaMensualManager();
});
