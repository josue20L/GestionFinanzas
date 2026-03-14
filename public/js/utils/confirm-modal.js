/**
 * Sistema de confirmación genérico usando modales de Bootstrap
 */
class ConfirmModal {
    constructor() {
        this.modalId = 'confirmGenericModal';
        this.crearModal();
    }

    crearModal() {
        if (document.getElementById(this.modalId)) return;

        const modalHtml = `
            <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${this.modalId}Label">Confirmación</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p id="${this.modalId}Message"></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="${this.modalId}CancelBtn">Cancelar</button>
                            <button type="button" class="btn btn-danger" id="${this.modalId}ConfirmBtn">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    show({ title, message, confirmText, cancelText, confirmVariant, onOk }) {
        const modalEl = document.getElementById(this.modalId);
        const bsModal = new bootstrap.Modal(modalEl);
        
        document.getElementById(`${this.modalId}Label`).textContent = title || 'Confirmación';
        document.getElementById(`${this.modalId}Message`).innerHTML = message || '¿Está seguro?';
        
        const confirmBtn = document.getElementById(`${this.modalId}ConfirmBtn`);
        confirmBtn.textContent = confirmText || 'Confirmar';
        confirmBtn.className = `btn btn-${confirmVariant || 'danger'}`;
        
        const cancelBtn = document.getElementById(`${this.modalId}CancelBtn`);
        cancelBtn.textContent = cancelText || 'Cancelar';

        // Limpiar eventos previos
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', () => {
            if (onOk) onOk();
            bsModal.hide();
        });

        bsModal.show();
    }
}

window.confirmModal = new ConfirmModal();
