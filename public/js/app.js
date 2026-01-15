// public/js/app.js
document.addEventListener('DOMContentLoaded', function() {
    // Activar tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Toggle sidebar en móviles
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        const sidebarInstance = new bootstrap.Collapse(sidebar, {
            toggle: false
        });

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