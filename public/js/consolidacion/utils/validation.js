(function () {
    function validarEmpresas(empresas) {
        return Array.isArray(empresas) && empresas.length > 0;
    }

    function validarRangoFechas(desde, hasta) {
        return Boolean(desde && hasta);
    }

    window.validarEmpresas = validarEmpresas;
    window.validarRangoFechas = validarRangoFechas;
})();
