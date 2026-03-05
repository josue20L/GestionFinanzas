// public/js/app.js
document.addEventListener('DOMContentLoaded', function() {
    // Activar tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Toggle sidebar en móviles
    const sidebar = document.getElementById('sidebar');
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    
    if (sidebar) {
        const sidebarInstance = new bootstrap.Collapse(sidebar, {
            toggle: false
        });

        // Botón de colapsar sidebar en móviles
        if (sidebarCollapse) {
            sidebarCollapse.addEventListener('click', function() {
                sidebar.classList.toggle('show');
            });
        }

        // Mostrar/ocultar sidebar en móviles
        const sidebarToggle = document.querySelector('[data-bs-target="#sidebar"]');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                sidebarInstance.toggle();
            });
        }

        // Cerrar sidebar al hacer clic en un enlace en móviles
        if (window.innerWidth < 768) {
            document.querySelectorAll('.sidebar .nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    sidebarInstance.hide();
                });
            });
        }
    }

    // Inicializar modal genérico de confirmación
    (function initConfirmModal() {
        const modalEl = document.getElementById('confirmModal');
        if (!modalEl) return;

        const modal = new bootstrap.Modal(modalEl);
        const titleEl = document.getElementById('confirmModalTitle');
        const msgEl = document.getElementById('confirmModalMessage');
        const okBtn = document.getElementById('confirmModalOk');
        const cancelBtn = document.getElementById('confirmModalCancel');

        let onConfirm = null;

        okBtn?.addEventListener('click', () => {
            modal.hide();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });

        cancelBtn?.addEventListener('click', () => {
            modal.hide();
        });

        window.confirmModal = {
            show({ title, message, confirmText, cancelText, confirmVariant = 'danger', onOk }) {
                if (titleEl && title) titleEl.textContent = title;
                if (msgEl && message) msgEl.textContent = message;
                if (okBtn && confirmText) okBtn.textContent = confirmText;

                if (cancelBtn) {
                    if (cancelText) {
                        cancelBtn.textContent = cancelText;
                        cancelBtn.style.display = '';
                    } else {
                        cancelBtn.style.display = 'none';
                    }
                }

                // Cambiar estilo del botón de confirmación (primario / peligro)
                if (okBtn) {
                    okBtn.classList.remove('btn-danger', 'btn-primary', 'btn-warning');
                    okBtn.classList.add(`btn-${confirmVariant}`);
                }

                onConfirm = typeof onOk === 'function' ? onOk : null;
                modal.show();
            }
        };
    })();

    // Manejar el tema oscuro
    const themeToggle = document.querySelector('[data-bs-theme-toggle]');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Actualizar ícono
            const icon = this.querySelector('i');
            if (newTheme === 'dark') {
                icon.classList.remove('bi-moon-stars');
                icon.classList.add('bi-sun');
                this.innerHTML = '<i class="bi bi-sun me-2"></i> Tema Claro';
            } else {
                icon.classList.remove('bi-sun');
                icon.classList.add('bi-moon-stars');
                this.innerHTML = '<i class="bi bi-moon-stars me-2"></i> Tema Oscuro';
            }
        });

        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        
        // Actualizar botón según el tema
        const icon = themeToggle.querySelector('i');
        if (savedTheme === 'dark') {
            icon.classList.remove('bi-moon-stars');
            icon.classList.add('bi-sun');
            themeToggle.innerHTML = '<i class="bi bi-sun me-2"></i> Tema Claro';
        }
    }
});