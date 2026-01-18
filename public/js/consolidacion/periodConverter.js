(function () {
    class PeriodConverter {
        convertirTrimestreAMes(trimestre, esUltimoMes = false) {
            if (!trimestre) return null;

            const match = trimestre.match(/(\d{4})-Q(\d)/);
            if (!match) return null;

            const year = parseInt(match[1], 10);
            const quarter = parseInt(match[2], 10);

            const mesesPorTrimestre = {
                1: { inicio: '01', fin: '03' },
                2: { inicio: '04', fin: '06' },
                3: { inicio: '07', fin: '09' },
                4: { inicio: '10', fin: '12' }
            };

            const mes = esUltimoMes ? mesesPorTrimestre[quarter]?.fin : mesesPorTrimestre[quarter]?.inicio;
            return mes ? `${year}-${mes}` : null;
        }

        convertirAnioFiscalAMes(anio, esUltimoMes = false) {
            if (!anio) return null;

            const year = parseInt(anio, 10);
            if (!Number.isInteger(year)) return null;

            if (esUltimoMes) {
                return `${year + 1}-03`;
            }

            return `${year}-04`;
        }
    }

    window.PeriodConverter = PeriodConverter;
})();
