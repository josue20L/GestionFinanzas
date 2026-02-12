(function () {
    function formatNumber(num, decimals = 2) {
        const n = Number(num);
        const safe = Number.isFinite(n) ? n : 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: true
        }).format(safe);
    }

    window.formatNumber = formatNumber;
})();
