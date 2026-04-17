/**
 * Gestión de Conversión de Moneda para Consolidación
 */
const CurrencyManager = {
    currentCurrency: 'BOB',
    tasaUSD: 1, // 1 USD = X BOB

    async init() {
        await this.cargarTasa();
        this.setupEventListeners();
    },

    async cargarTasa() {
        try {
            const res = await fetch('/api/tasas/1/2/actual');
            const data = await res.json();
            if (data.success && data.tasa) {
                this.tasaUSD = data.tasa.VALOR_VENTA;
                document.getElementById('tasa-valor').textContent = this.tasaUSD;
                document.getElementById('tasa-info').style.display = 'inline';
            }
        } catch (error) {
            console.error('Error al cargar tasa de cambio:', error);
        }
    },

    setupEventListeners() {
        document.getElementById('moneda-bob').addEventListener('change', () => this.cambiarMoneda('BOB'));
        document.getElementById('moneda-usd').addEventListener('change', () => this.cambiarMoneda('USD'));
    },

    cambiarMoneda(nuevaMoneda) {
        if (this.currentCurrency === nuevaMoneda) return;
        
        const anteriorMoneda = this.currentCurrency;
        this.currentCurrency = nuevaMoneda;
        
        console.log(`Cambiando visualización de ${anteriorMoneda} a ${nuevaMoneda}`);
        this.actualizarValoresEnTablas();
    },

    actualizarValoresEnTablas() {
        // Buscar todos los elementos que tienen el atributo data-valor-bob
        // Estos elementos deben ser generados por el sistema de consolidación
        const celdasValores = document.querySelectorAll('td[data-valor-bob], span[data-valor-bob]');
        
        celdasValores.forEach(celda => {
            const valorUsd = parseFloat(celda.getAttribute('data-valor-bob'));
            if (isNaN(valorUsd)) return;

            if (this.currentCurrency === 'BOB') {
                // Convertir de USD a BOB: multiplicar por tasa
                const valorBob = valorUsd * this.tasaUSD;
                celda.textContent = this.formatearMonto(valorBob);
            } else {
                // Mostrar en USD: valor original
                celda.textContent = this.formatearMonto(valorUsd);
            }
        });
    },

    formatearMonto(monto) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    CurrencyManager.init();
});

// Exponer globalmente para que otros scripts puedan llamarlo tras generar datos
window.CurrencyManager = CurrencyManager;
