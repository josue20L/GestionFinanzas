/**
 * Sistema de notificación de cambios sin guardar
 * Modal personalizado mejorado con detección de navegación
 */
class ModalCambios {
    constructor() {
        this.modalId = 'modalAlertaCambios';
        this.indicadorId = 'indicador-cambios';
        this.crearModal();
        this.configurarEventos();
        this.configurarDeteccionNavegacion();
    }

    /**
     * Crear el modal en el DOM con diseño mejorado
     */
    crearModal() {
        // Verificar si ya existe
        if (document.getElementById(this.modalId)) {
            return;
        }

        const modalHtml = `
            <div class="modal fade modal-alerta-cambios" id="${this.modalId}" tabindex="-1" aria-labelledby="modalAlertaCambiosLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalAlertaCambiosLabel">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                Atención
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3"><strong><i class="bi bi-exclamation-circle me-2"></i>Tienes cambios sin guardar en el formulario actual.</strong></p>
                            <p class="mb-3">¿Qué deseas hacer?</p>
                            <div class="d-grid gap-2">
                                <button type="button" class="btn btn-primary btn-confirmar" onclick="modalCambios.guardarYContinuar()">
                                    <i class="bi bi-save-fill me-2"></i> Guardar y continuar
                                </button>
                                <button type="button" class="btn btn-secondary btn-cancelar" onclick="modalCambios.descartarCambios()">
                                    <i class="bi bi-x-circle-fill me-2"></i> Descartar cambios
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="modalCambios.salirSinGuardar()">
                                    <i class="bi bi-arrow-right-circle me-2"></i> Salir sin guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Configurar eventos del modal
     */
    configurarEventos() {
        // Prevenir salida sin guardar
        window.addEventListener('beforeunload', (e) => {
            if (this.hayCambiosSinGuardar()) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
                return e.returnValue;
            }
        });

        // Actualizar indicador cuando se cierra el modal
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.addEventListener('hidden.bs.modal', () => {
                this.actualizarIndicador();
            });
        }
    }

    /**
     * Configurar detección de navegación en el sidebar
     */
    configurarDeteccionNavegacion() {
        // Detectar clics en enlaces de navegación del sidebar
        document.addEventListener('click', (e) => {
            const enlace = e.target.closest('a');
            if (enlace && this.esEnlaceDeNavegacion(enlace)) {
                if (this.hayCambiosSinGuardar()) {
                    e.preventDefault();
                    this.mostrar();
                    return false;
                }
            }
        });

        // Detectar cambios en el hash de la URL
        window.addEventListener('hashchange', (e) => {
            if (this.hayCambiosSinGuardar()) {
                e.preventDefault();
                this.mostrar();
                return false;
            }
        });

        // Detectar antes de cambiar de página
        window.addEventListener('popstate', (e) => {
            if (this.hayCambiosSinGuardar()) {
                e.preventDefault();
                this.mostrar();
                return false;
            }
        });
    }

    /**
     * Verificar si un enlace es de navegación principal
     */
    esEnlaceDeNavegacion(enlace) {
        const href = enlace.getAttribute('href');
        if (!href) return false;

        // Excluir enlaces internos del mismo formulario
        if (href.startsWith('#')) return false;
        
        // Excluir enlaces que no cambian de página
        if (href.includes('javascript:')) return false;
        
        // Excluir enlaces de descarga
        if (href.includes('download')) return false;
        
        // Excluir enlaces de mail
        if (href.includes('mailto:')) return false;
        
        // Excluir enlaces externos que abren en nueva pestaña
        if (enlace.target === '_blank') return false;

        return true;
    }

    /**
     * Verificar si hay cambios sin guardar
     */
    hayCambiosSinGuardar() {
        const indicador = document.getElementById(this.indicadorId);
        if (!indicador) return false;
        
        return indicador.textContent.includes('cambios sin guardar') || 
               indicador.classList.contains('text-warning');
    }

    /**
     * Actualizar indicador visual
     */
    actualizarIndicador() {
        // El indicador fue eliminado del HTML, ya no se necesita
        // El sistema ahora solo muestra el modal cuando hay cambios
        return true;
    }

    /**
     * Mostrar el modal
     */
    mostrar() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            return true;
        }
        return false;
    }

    /**
     * Ocultar el modal
     */
    ocultar() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
            return true;
        }
        return false;
    }

    /**
     * Guardar y continuar
     */
    guardarYContinuar() {
        this.ocultar();
        
        // Llamar a la función global de guardar si existe
        if (typeof guardarDatos === 'function') {
            guardarDatos();
        }
        
        // Actualizar indicador
        setTimeout(() => {
            this.actualizarIndicador();
        }, 1000);
        
        return true;
    }

    /**
     * Descartar cambios
     */
    descartarCambios() {
        this.ocultar();
        
        // Recargar página para descartar cambios
        window.location.reload();
        
        return true;
    }

    /**
     * Salir sin guardar
     */
    salirSinGuardar(targetUrl) {
        this.ocultar();
        
        // Navegar a la URL solicitada
        if (targetUrl) {
            window.location.href = targetUrl;
        }
        
        return true;
    }
}

// Crear instancia global
let modalCambios;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    modalCambios = new ModalCambios();
});

// Exportar para uso global
window.ModalCambios = ModalCambios;
