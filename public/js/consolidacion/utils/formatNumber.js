(function () {
    function formatNumber(num, decimals = 2) {
        const n = Number(num);
        const safe = Number.isFinite(n) ? n : 0;
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(safe);
    }

    window.formatNumber = formatNumber;
})();
