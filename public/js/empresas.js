class EmpresasManager {
    constructor() {
        this.documentosSeleccionados = [];
        this.idEmpresaActual = null;
        this.init();
    }

    async init() {
        await this.cargarEmpresas();
        this.setupFormHandler();
        this.setupModalCleanup();
        this.setupDocumentosHandler();
    }

    async cargarEmpresas() {
        try {
            const response = await fetch('/api/empresas', {
                credentials: 'same-origin'
            });
            const empresas = await response.json();
            
            const grid = document.getElementById('companiesGrid');
            const noCompanies = document.getElementById('no-companies');
            
            if (empresas && empresas.length > 0) {
                grid.innerHTML = '';
                for (const empresa of empresas) {
                    const cardHtml = await this.renderCard(empresa);
                    grid.innerHTML += cardHtml;
                }
                noCompanies.style.display = 'none';
            } else {
                grid.innerHTML = '';
                noCompanies.style.display = 'block';
            }
        } catch (error) {
            console.error('Error al cargar empresas:', error);
            this.showToast('Error al cargar empresas', 'danger');
        }
    }

    async renderCard(empresa) {
        const response = await fetch(`/empresas/card/${empresa.ID_EMPRESA}`, {
            credentials: 'same-origin'
        });
        return await response.text();
    }

    async cargarGruposEmpresariales() {
        try {
            const response = await fetch('/api/grupos-empresariales', {
                credentials: 'same-origin'
            });
            const grupos = await response.json();
            
            const select = document.getElementById('Tipo-empresa');
            select.innerHTML = '<option value="">Seleccionar tipo...</option>';
            
            grupos.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.ID_GRUPO;
                option.textContent = grupo.NOMBRE_GRUPO;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar tipos:', error);
            this.showToast('Error al cargar tipos de empresa', 'danger');
        }
    }

    async cargarMonedas() {
        try {
            const response = await fetch('/api/monedas', {
                credentials: 'same-origin'
            });
            const monedas = await response.json();
            
            const select = document.getElementById('moneda');
            if (!select) {
                console.error('No se encontró el select con id="moneda"');
                return;
            }
            
            select.innerHTML = '<option value="">Seleccionar moneda...</option>';
            
            if (monedas.success && monedas.data) {
                monedas.data.forEach(moneda => {
                    const option = document.createElement('option');
                    option.value = moneda.ID_MONEDA;
                    option.textContent = `${moneda.NOMBRE_MONEDA} (${moneda.SIMBOLO})`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar monedas:', error);
            this.showToast('Error al cargar monedas', 'danger');
        }
    }

    setupModalCleanup() {
        const modalEl = document.getElementById('nuevaEmpresaModal');
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', () => {
                this.limpiarFormulario();
            });
        }
    }

    limpiarFormulario() {
        const form = document.getElementById('nuevaEmpresaForm');
        if (form) {
            form.reset();
            delete form.dataset.modo;
            delete form.dataset.idEmpresa;
            
            const modalTitle = document.querySelector('#nuevaEmpresaModal .modal-title');
            if (modalTitle) modalTitle.textContent = 'Nueva Empresa';
        }
    }

    async editarEmpresa(idEmpresa) {
        try {
            const response = await fetch(`/api/empresas/${idEmpresa}`, {
                credentials: 'same-origin'
            });
            if (!response.ok) {
                this.showToast('No se pudo cargar la empresa para edición', 'danger');
                return;
            }
            const empresa = await response.json();

            await this.cargarGruposEmpresariales();
            await this.cargarMonedas();

            const form = document.getElementById('nuevaEmpresaForm');
            form.dataset.modo = 'editar';
            form.dataset.idEmpresa = idEmpresa;

            form.querySelector('[name="nombre_empresa"]').value = empresa.NOMBRE_EMPRESA || '';
            form.querySelector('[name="nit_ruc"]').value = empresa.NIT_RUC || '';
            form.querySelector('[name="pais"]').value = empresa.PAIS || '';
            form.querySelector('[name="id_grupo"]').value = empresa.ID_GRUPO || '';
            form.querySelector('[name="id_moneda"]').value = empresa.ID_MONEDA || '';

            const modalTitle = document.querySelector('#nuevaEmpresaModal .modal-title');
            if (modalTitle) modalTitle.textContent = 'Editar Empresa';

            // Cargar documentos existentes para esta empresa y mostrarlos en el modal
            await this.cargarDocumentosExistentes(idEmpresa);

            const modal = new bootstrap.Modal(document.getElementById('nuevaEmpresaModal'));
            modal.show();
        } catch (error) {
            console.error('Error al editar empresa:', error);
            this.showToast('Error al cargar datos de la empresa', 'danger');
        }
    }

    async eliminarEmpresa(idEmpresa) {
        const ejecutarBorrado = async () => {
            try {
                const response = await fetch(`/api/empresas/${idEmpresa}`, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Error al eliminar la empresa');
                }

                this.showToast('Empresa eliminada exitosamente', 'success');
                await this.cargarEmpresas();
            } catch (error) {
                console.error('Error al eliminar empresa:', error);
                this.showToast(error.message || 'Error al eliminar la empresa', 'danger');
            }
        };

        if (window.confirmModal) {
            window.confirmModal.show({
                title: 'Eliminar empresa',
                message: 'Esta acción eliminará la empresa de forma permanente. ¿Deseas continuar?',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmVariant: 'danger',
                onOk: ejecutarBorrado
            });
        } else {
            // Fallback a confirm nativo
            if (confirm('¿Está seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
                await ejecutarBorrado();
            }
        }
    }

    setupFormHandler() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupForm();
            });
        } else {
            this.setupForm();
        }
    }

    setupForm() {
        const form = document.getElementById('nuevaEmpresaForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.guardarEmpresa(form);
            });
        }
    }

    async guardarEmpresa(form) {
        const formData = new FormData(form);
        
        // Extraer datos del formulario como JSON (como antes)
        const payload = {
            nombre_empresa: formData.get('nombre_empresa') || '',
            nit_ruc: formData.get('nit_ruc') || '',
            pais: formData.get('pais') || '',
            id_grupo: formData.get('id_grupo') || null,
            id_moneda: formData.get('id_moneda') || ''
        };

        const modo = form.dataset.modo || 'crear';
        const idEmpresa = form.dataset.idEmpresa;

        const url = modo === 'editar' && idEmpresa
            ? `/api/empresas/${idEmpresa}`
            : '/api/empresas';
        const method = modo === 'editar' && idEmpresa ? 'PUT' : 'POST';

        try {
            // Primero guardar la empresa con JSON
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'same-origin'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error al guardar empresa');
            }

            // Si hay documentos, subirlos después de guardar la empresa
            if (this.documentosSeleccionados && this.documentosSeleccionados.length > 0) {
                const nuevaEmpresaId = result.data?.id_empresa || idEmpresa;
                if (nuevaEmpresaId) {
                    await this.subirDocumentosEmpresa(nuevaEmpresaId);
                }
            }

            this.cerrarModal(form);
            this.showToast(
                modo === 'editar' ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente', 
                'success'
            );
            await this.cargarEmpresas();
        } catch (error) {
            console.error('Error al guardar empresa:', error);
            this.showToast(error.message || 'Error al guardar empresa', 'danger');
        }
    }

    cerrarModal(form) {
        const modalEl = document.getElementById('nuevaEmpresaModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        form.reset();
        delete form.dataset.modo;
        delete form.dataset.idEmpresa;
        const modalTitle = document.querySelector('#nuevaEmpresaModal .modal-title');
        if (modalTitle) modalTitle.textContent = 'Nueva Empresa';
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

    // Métodos para manejar documentos
    setupDocumentosHandler() {
        const inputDocumentos = document.getElementById('documentosPDF');
        if (inputDocumentos) {
            inputDocumentos.addEventListener('change', (e) => this.handleDocumentosChange(e));
        }
    }

    handleDocumentosChange(event) {
        const archivos = event.target.files;
        this.documentosSeleccionados = Array.from(archivos);
        
        this.mostrarDocumentosSeleccionados();
    }

    mostrarDocumentosSeleccionados() {
        const listaContainer = document.getElementById('listaDocumentos');
        const archivosContainer = document.getElementById('archivosSeleccionados');
        
        if (this.documentosSeleccionados.length === 0) {
            listaContainer.style.display = 'none';
            return;
        }
        
        listaContainer.style.display = 'block';
        
        archivosContainer.innerHTML = this.documentosSeleccionados.map((archivo, index) => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <i class="bi bi-file-earmark-pdf text-danger me-2"></i>
                    <div>
                        <small class="fw-bold">${archivo.name}</small><br>
                        <small class="text-muted">${this.formatearTamano(archivo.size)}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="empresasManager.removerDocumento(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');
    }

    formatearTamano(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removerDocumento(index) {
        this.documentosSeleccionados.splice(index, 1);
        
        // Actualizar el input
        const input = document.getElementById('documentosPDF');
        const dt = new DataTransfer();
        this.documentosSeleccionados.forEach(archivo => dt.items.add(archivo));
        input.files = dt.files;
        
        this.mostrarDocumentosSeleccionados();
    }

    limpiarDocumentos() {
        this.documentosSeleccionados = [];
        const input = document.getElementById('documentosPDF');
        if (input) {
            input.value = '';
        }
        document.getElementById('listaDocumentos').style.display = 'none';
    }

    limpiarFormulario() {
        const form = document.getElementById('nuevaEmpresaForm');
        if (form) {
            form.reset();
            delete form.dataset.modo;
            delete form.dataset.idEmpresa;
            
            const modalTitle = document.querySelector('#nuevaEmpresaModal .modal-title');
            if (modalTitle) modalTitle.textContent = 'Nueva Empresa';
        }
        
        // Limpiar documentos
        this.limpiarDocumentos();
        
        // Ocultar documentos existentes
        const docsExistentes = document.getElementById('documentosExistentes');
        if (docsExistentes) docsExistentes.style.display = 'none';
    }

    // Subir documentos de una empresa
    async subirDocumentosEmpresa(idEmpresa) {
        if (!this.documentosSeleccionados || this.documentosSeleccionados.length === 0) {
            return;
        }

        try {
            const formData = new FormData();
            this.documentosSeleccionados.forEach(archivo => {
                formData.append('documentos', archivo);
            });

            const response = await fetch(`/api/empresas/${idEmpresa}/documentos`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Error al subir documentos');
            }

            this.showToast(`Documentos subidos exitosamente: ${this.documentosSeleccionados.length} archivos`, 'success');
            
        } catch (error) {
            console.error('Error al subir documentos:', error);
            this.showToast('Error al subir documentos', 'danger');
        }
    }

    // Método para ver documentos de una empresa
    async verDocumentos(idEmpresa, nombreEmpresa) {
        this.idEmpresaActual = idEmpresa; // Guardar ID de empresa actual
        
        // Actualizar título del modal
        document.getElementById('empresaNombre').textContent = nombreEmpresa;
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('documentosModal'));
        modal.show();
        
        // Cargar documentos (con API real)
        await this.cargarDocumentosEmpresa(idEmpresa);
    }

    // Cargar documentos de la empresa (con API real)
    async cargarDocumentosEmpresa(idEmpresa) {
        try {
            const response = await fetch(`/api/empresas/${idEmpresa}/documentos`, {
                credentials: 'same-origin'
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Error al cargar documentos');
            }
            
            this.mostrarDocumentos(result.data || []);
        } catch (error) {
            console.error('Error al cargar documentos:', error);
            this.mostrarDocumentos([]); // Mostrar vacío en caso de error
        }
    }

    // Cargar documentos existentes para el modal de edición
    async cargarDocumentosExistentes(idEmpresa) {
        try {
            const response = await fetch(`/api/empresas/${idEmpresa}/documentos`, {
                credentials: 'same-origin'
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al cargar documentos existentes');
            }

            const documentos = result.data || [];
            const contenedor = document.getElementById('documentosExistentes');
            const lista = document.getElementById('listaDocumentosExistentes');
            if (!contenedor || !lista) return;

            if (!documentos.length) {
                contenedor.style.display = 'none';
                lista.innerHTML = '';
                return;
            }

            contenedor.style.display = 'block';
            lista.innerHTML = documentos.map(doc => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-file-earmark-pdf text-danger me-2"></i>
                        <strong>${doc.nombre_archivo}</strong>
                        <br>
                        <small class="text-muted">${doc.tipo_documento} · ${this.formatearFecha(doc.fecha_subida)}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" type="button"
                        onclick="empresasManager.verDocumento('${doc.ruta_archivo}', '${doc.nombre_archivo}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al cargar documentos existentes:', error);
            const contenedor = document.getElementById('documentosExistentes');
            const lista = document.getElementById('listaDocumentosExistentes');
            if (contenedor && lista) {
                contenedor.style.display = 'none';
                lista.innerHTML = '';
            }
        }
    }

    // Mostrar documentos en el modal
    mostrarDocumentos(documentos) {
        console.log('Documentos recibidos:', documentos); // Debug
        
        const grid = document.getElementById('documentosGrid');
        const noDocumentos = document.getElementById('noDocumentos');
        
        if (!documentos || documentos.length === 0) {
            grid.innerHTML = '';
            noDocumentos.style.display = 'block';
            return;
        }
        
        noDocumentos.style.display = 'none';
        
        grid.innerHTML = documentos.map(doc => `
            <div class="col-md-6 mb-3">
                <div class="card border-secondary">
                    <div class="card-body">
                        <div class="d-flex align-items-start">
                            <i class="bi bi-file-earmark-pdf text-danger fs-4 me-3"></i>
                            <div class="flex-grow-1">
                                <h6 class="card-title mb-1">${doc.nombre_archivo}</h6>
                                <p class="card-text small text-muted mb-2">
                                    <strong>Tipo:</strong> ${doc.tipo_documento}<br>
                                    <strong>Subido:</strong> ${this.formatearFecha(doc.fecha_subida)}
                                </p>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="empresasManager.verDocumento('${doc.ruta_archivo}', '${doc.nombre_archivo}')">
                                        <i class="bi bi-eye"></i> Ver
                                    </button>
                                    <button class="btn btn-outline-success" onclick="empresasManager.descargarDocumento('${doc.ruta_archivo}', '${doc.nombre_archivo}', ${doc.id_archivo})">
                                        <i class="bi bi-download"></i> Descargar
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="empresasManager.eliminarDocumento(${doc.id_archivo})">
                                        <i class="bi bi-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Formatear fecha
    formatearFecha(fecha) {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Ver documento (abrir en nueva pestaña)
    verDocumento(ruta, nombre) {
        // Codificar la URL para manejar espacios y caracteres especiales
        const urlCodificada = encodeURI(ruta);
        window.open(urlCodificada, '_blank');
    }

    // Descargar documento
    async descargarDocumento(ruta, nombre, idDocumento) {
        try {
            const response = await fetch(`/api/documentos/${idDocumento}/descargar`, {
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Error al descargar documento');
            }
            
            // Crear blob y descargar
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombre;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error al descargar documento:', error);
            this.showToast('Error al descargar documento', 'danger');
        }
    }

    // Eliminar documento
    async eliminarDocumento(idDocumento) {
        const ejecutarBorrado = async () => {
            try {
                const response = await fetch(`/api/documentos/${idDocumento}`, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Error al eliminar documento');
                }

                this.showToast('Documento eliminado exitosamente', 'success');

                // Recargar documentos si tenemos el ID de la empresa actual
                if (this.idEmpresaActual) {
                    await this.cargarDocumentosEmpresa(this.idEmpresaActual);
                }
            } catch (error) {
                console.error('Error al eliminar documento:', error);
                this.showToast('Error al eliminar documento', 'danger');
            }
        };

        if (window.confirmModal) {
            window.confirmModal.show({
                title: 'Eliminar documento',
                message: '¿Estás seguro de eliminar este documento?',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmVariant: 'danger',
                onOk: ejecutarBorrado
            });
        } else {
            if (confirm('¿Estás seguro de eliminar este documento?')) {
                await ejecutarBorrado();
            }
        }
    }
}

// Funciones globales para onclick
let empresasManager;

async function openCompanyModal() {
    empresasManager.limpiarFormulario();
    await Promise.all([
        empresasManager.cargarGruposEmpresariales(),
        empresasManager.cargarMonedas()
    ]);
    const modal = new bootstrap.Modal(document.getElementById('nuevaEmpresaModal'));
    modal.show();
}

function editarEmpresa(id) {
    empresasManager.editarEmpresa(id);
}

function eliminarEmpresa(id) {
    empresasManager.eliminarEmpresa(id);
}

function verDocumentos(idEmpresa, nombreEmpresa) {
    empresasManager.verDocumentos(idEmpresa, nombreEmpresa);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    empresasManager = new EmpresasManager();
});
