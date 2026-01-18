(function () {
    class ApiService {
        async fetchEmpresas() {
            const response = await fetch('/api/empresas');
            const empresas = await response.json();

            if (!response.ok) {
                const message = empresas?.message || 'Error al cargar empresas';
                throw new Error(message);
            }

            return empresas;
        }

        async generarConsolidacion({ empresas, desde, hasta, tipo }) {
            const response = await fetch('/api/consolidacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresas, desde, hasta, tipo })
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                const message = result?.message || 'Error al consolidar';
                throw new Error(message);
            }

            return result;
        }
    }

    window.ApiService = ApiService;
})();
