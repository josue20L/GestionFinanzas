class EmpresasManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.cargarEmpresas();
        this.setupFormHandler();
        this.setupModalCleanup();
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

            const modal = new bootstrap.Modal(document.getElementById('nuevaEmpresaModal'));
            modal.show();
        } catch (error) {
            console.error('Error al editar empresa:', error);
            this.showToast('Error al cargar datos de la empresa', 'danger');
        }
    }

    async eliminarEmpresa(idEmpresa) {
        if (!confirm('¿Está seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
            return;
        }

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
        const payload = {
            nombre_empresa: formData.get('nombre_empresa'),
            nit_ruc: formData.get('nit_ruc'),
            pais: formData.get('pais'),
            id_grupo: formData.get('id_grupo') || null,
            id_moneda: formData.get('id_moneda')
        };

        const modo = form.dataset.modo || 'crear';
        const idEmpresa = form.dataset.idEmpresa;

        const url = modo === 'editar' && idEmpresa
            ? `/api/empresas/${idEmpresa}`
            : '/api/empresas';
        const method = modo === 'editar' && idEmpresa ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error al guardar empresa');
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    empresasManager = new EmpresasManager();
});
