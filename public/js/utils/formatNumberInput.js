/**
 * Utilidad para mostrar números con separador de miles (coma) en inputs de Carga Mensual.
 * - formatNumberForInput: para mostrar en pantalla (ej. 1234567.5 → "1,234,567.50")
 * - parseNumberFromInput: para leer valor del input y enviar al backend (quita comas y parsea)
 */
(function () {
    function formatNumberForInput(num, decimals) {
        if (decimals === undefined) decimals = 2;
        const n = Number(num);
        const safe = Number.isFinite(n) ? n : 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: true
        }).format(safe);
    }

    function parseNumberFromInput(str) {
        if (str === null || str === undefined) return 0;
        const cleaned = String(str).replace(/,/g, '').trim();
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
    }

    window.formatNumberForInput = formatNumberForInput;
    window.parseNumberFromInput = parseNumberFromInput;
})();
