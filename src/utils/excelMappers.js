const MAPEO_CONCEPTOS = {
    'Venta Netas': 'ventas_netas',
    'Ventas Netas': 'ventas_netas',
    'Costo de Ventas': 'costo_ventas',
    'Gasto Administrativo': 'gasto_administrativo',
    'Gasto Comercializacion': 'gasto_comercializacion',
    'Gasto Comercialización': 'gasto_comercializacion',
    'Gasto SIG': 'gasto_sig',
    'Gasto Tributario': 'gasto_tributario',
    'Gasto Financiero': 'gasto_financiero',
    'Otros Ingresos': 'otros_ingresos',
    'Otros Egresos': 'otros_egresos'
};

const MESES_MAP = {
    // Español
    'ene': 1, 'ene.': 1, 'enero': 1,
    'feb': 2, 'feb.': 2, 'febrero': 2,
    'mar': 3, 'mar.': 3, 'marzo': 3,
    'abr': 4, 'abr.': 4, 'abril': 4,
    'may': 5, 'may.': 5, 'mayo': 5,
    'jun': 6, 'jun.': 6, 'junio': 6,
    'jul': 7, 'jul.': 7, 'julio': 7,
    'ago': 8, 'ago.': 8, 'agosto': 8,
    'sep': 9, 'sep.': 9, 'septiembre': 9,
    'oct': 10, 'oct.': 10, 'octubre': 10,
    'nov': 11, 'nov.': 11, 'noviembre': 11,
    'dic': 12, 'dic.': 12, 'diciembre': 12,
    // Inglés
    'jan': 1, 'jan.': 1, 'january': 1,
    'feb': 2, 'feb.': 2, 'february': 2,
    'mar': 3, 'mar.': 3, 'march': 3,
    'apr': 4, 'apr.': 4, 'april': 4,
    'may': 5, 'may.': 5, 'may': 5,
    'jun': 6, 'jun.': 6, 'june': 6,
    'jul': 7, 'jul.': 7, 'july': 7,
    'aug': 8, 'aug.': 8, 'august': 8,
    'sep': 9, 'sep.': 9, 'september': 9,
    'oct': 10, 'oct.': 10, 'october': 10,
    'nov': 11, 'nov.': 11, 'november': 11,
    'dec': 12, 'dec.': 12, 'december': 12
};

function parsePeriodo(periodoStr) {
    // Formatos esperados: "ene-26", "ene-2026", "enero-26", etc.
    const partes = periodoStr.toLowerCase().split('-');
    
    if (partes.length !== 2) return null;
    
    const mesStr = partes[0];
    const añoStr = partes[1];
    
    const mes = MESES_MAP[mesStr];
    if (!mes) return null;
    
    // Convertir año de 2 dígitos a 4
    let año = parseInt(añoStr);
    if (año < 100) {
        año += año >= 50 ? 1900 : 2000;
    }
    
    return { año, mes };
}

function mapearConceptoACampo(concepto) {
    return MAPEO_CONCEPTOS[concepto] || null;
}

function esConceptoValido(concepto) {
    return MAPEO_CONCEPTOS.hasOwnProperty(concepto);
}

function esPeriodoValido(header) {
    return header !== 'EERR' && header !== 'Concepto' && header.includes('-');
}

module.exports = {
    MAPEO_CONCEPTOS,
    MESES_MAP,
    parsePeriodo,
    mapearConceptoACampo,
    esConceptoValido,
    esPeriodoValido
};
