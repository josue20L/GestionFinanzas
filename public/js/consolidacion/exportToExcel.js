// Función para exportar todo el reporte consolidado a Excel
function exportarTodoExcel() {
    // Verificar si tenemos datos de consolidación
    if (!window.consolidacionDatosUltimos) {
        alert('No hay datos de consolidación para exportar. Genere primero el reporte.');
        return;
    }

    const datos = window.consolidacionDatosUltimos;
    
    try {
        // Usar la librería SheetJS (xlsx) si está disponible
        if (typeof XLSX !== 'undefined') {
            const workbook = XLSX.utils.book_new();
            
            // Agregar hoja de Estado de Resultados
            const wsER = crearWorksheetEstadoResultados(datos);
            XLSX.utils.book_append_sheet(workbook, wsER, 'Estado de Resultados');
            
            // Agregar hoja de Balance General
            const wsBG = crearWorksheetBalanceGeneral(datos);
            XLSX.utils.book_append_sheet(workbook, wsBG, 'Balance General');
            
            // Agregar hoja de Flujo Operativo
            const wsFO = crearWorksheetFlujoOperativo(datos);
            XLSX.utils.book_append_sheet(workbook, wsFO, 'Flujo Operativo');
            
            // Agregar hoja de Flujo Corporativo
            const wsFC = crearWorksheetFlujoCorporativo(datos);
            XLSX.utils.book_append_sheet(workbook, wsFC, 'Flujo Corporativo');
            
            // Descargar archivo Excel con todas las hojas
            XLSX.writeFile(workbook, 'consolidacion-completa.xlsx');
        } else {
            // Fallback: exportar individualmente como CSV
            alert('Librería Excel no disponible. Se exportará cada reporte individualmente.');
            exportarComoCSV('estado-resultados', datos);
            setTimeout(() => exportarComoCSV('balance', datos), 500);
            setTimeout(() => exportarComoCSV('flujo-operativo', datos), 1000);
            setTimeout(() => exportarComoCSV('flujo-corporativo', datos), 1500);
        }
    } catch (error) {
        console.error('Error al exportar todo a Excel:', error);
        alert('Error al exportar. Intente exportar individualmente.');
    }
}

// Hacer la función global
window.exportarTodoExcel = exportarTodoExcel;

// Función para exportar tablas de consolidación a Excel
function exportToExcel(tipo) {
    // Verificar si tenemos datos de consolidación
    if (!window.consolidacionDatosUltimos) {
        alert('No hay datos de consolidación para exportar. Genere primero el reporte.');
        return;
    }

    const datos = window.consolidacionDatosUltimos;
    
    // Depuración: mostrar estructura de datos en consola
    console.log('🔍 Estructura de datos para exportación:', datos);
    console.log('📊 Datos por período:', datos.datosPorPeriodo);
    console.log('⚖️ Balance General:', datos.balanceGeneral);
    console.log('💰 Flujo Operativo:', datos.flujoOperativo);
    console.log('🏢 Flujo Corporativo:', datos.flujoCorporativo);
    
    let workbook;
    let worksheet;
    let filename;

    try {
        // Usar la librería SheetJS (xlsx) si está disponible, si no, usar método alternativo
        if (typeof XLSX !== 'undefined') {
            workbook = XLSX.utils.book_new();
            
            switch(tipo) {
                case 'estado-resultados':
                    worksheet = crearWorksheetEstadoResultados(datos);
                    filename = 'consolidado-estado-resultados.xlsx';
                    break;
                case 'balance':
                    worksheet = crearWorksheetBalanceGeneral(datos);
                    filename = 'consolidado-balance-general.xlsx';
                    break;
                case 'flujo-operativo':
                    worksheet = crearWorksheetFlujoOperativo(datos);
                    filename = 'consolidado-flujo-operativo.xlsx';
                    break;
                case 'flujo-corporativo':
                    worksheet = crearWorksheetFlujoCorporativo(datos);
                    filename = 'consolidado-flujo-corporativo.xlsx';
                    break;
                default:
                    throw new Error('Tipo de reporte no válido');
            }
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
            XLSX.writeFile(workbook, filename);
        } else {
            // Método alternativo: exportar como CSV
            exportarComoCSV(tipo, datos);
        }
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        // Fallback a CSV si Excel falla
        exportarComoCSV(tipo, datos);
    }
}

// Función para crear worksheet de Estado de Resultados
function crearWorksheetEstadoResultados(datos) {
    const ws_data = [];
    
    // Encabezados
    const headers = ['Concepto'];
    if (datos.datosPorPeriodo && datos.datosPorPeriodo.periodos) {
        datos.datosPorPeriodo.periodos.forEach(periodo => {
            headers.push(periodo.descripcion || periodo.periodo);
        });
    }
    headers.push('Total');
    ws_data.push(headers);
    
    // Datos
    const conceptos = [
        ['Ventas Netas', 'ventas_netas'],
        ['Costo de Ventas', 'costo_ventas'],
        ['Utilidad Bruta', 'utilidad_bruta'],
        ['Gasto Administrativo', 'gasto_administrativo'],
        ['Gasto Comercialización', 'gasto_comercializacion'],
        ['Gasto SIG', 'gasto_sig'],
        ['Gasto Tributario', 'gasto_tributario'],
        ['Gasto Financiero', 'gasto_financiero'],
        ['Utilidad Operativa', 'utilidad_operativa'],
        ['Otros Ingresos', 'otros_ingresos'],
        ['Otros Egresos', 'otros_egresos'],
        ['Utilidad Neta', 'utilidad_neta']
    ];
    
    conceptos.forEach(([nombre, clave]) => {
        const row = [nombre];
        let total = 0;
        
        if (datos.datosPorPeriodo && datos.datosPorPeriodo.periodos) {
            datos.datosPorPeriodo.periodos.forEach(periodo => {
                const valor = periodo[clave] || 0;
                row.push(parseFloat(valor) || 0);
                total += parseFloat(valor) || 0;
            });
        }
        
        row.push(total);
        ws_data.push(row);
    });
    
    return XLSX.utils.aoa_to_sheet(ws_data);
}

// Función para crear worksheet de Balance General
function crearWorksheetBalanceGeneral(datos) {
    const ws_data = [['Cuenta', 'Total']];
    
    const cuentas = [
        ['Disponible', 'DISPONIBLE'],
        ['Exigible', 'EXIGIBLE'],
        ['Realizable', 'REALIZABLE'],
        ['Activo Corriente', 'ACTIVO_CORRIENTE'],
        ['Activo No Corriente', 'ACTIVO_NO_CORRIENTE'],
        ['Total Activo', 'TOTAL_ACTIVOS'],
        ['Pasivo Corriente', 'PASIVO_CORRIENTE'],
        ['Pasivo No Corriente', 'PASIVO_NO_CORRIENTE'],
        ['Total Pasivo', 'TOTAL_PASIVOS'],
        ['Patrimonio', 'PATRIMONIO'],
        ['Total Pasivo + Patrimonio', 'TOTAL_PASIVO_PATRIMONIO']
    ];
    
    // Usar datos consolidados del balance general
    if (datos.balanceGeneral) {
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.balanceGeneral[clave] || 0;
            ws_data.push([nombre, parseFloat(valor) || 0]);
        });
    } else if (datos.datosPorPeriodoBG && datos.datosPorPeriodoBG.consolidado) {
        // Fallback a datos por período
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.datosPorPeriodoBG.consolidado[clave] || 0;
            ws_data.push([nombre, parseFloat(valor) || 0]);
        });
    }
    
    return XLSX.utils.aoa_to_sheet(ws_data);
}

// Función para crear worksheet de Flujo Operativo
function crearWorksheetFlujoOperativo(datos) {
    const ws_data = [['Cuenta', 'Total']];
    
    const cuentas = [
        ['Ventas', 'VENTAS'],
        ['Ventas Exportación', 'VENTAS_EXPORTACION'],
        ['Cartera', 'CARTERA'],
        ['Transportes (Ingreso)', 'TRANSPORTES_ING'],
        ['Otros Ingresos', 'OTROS_INGRESOS'],
        ['Total Ingresos', 'TOTAL_INGRESOS'],
        ['Compras', 'COMPRAS'],
        ['Gastos Administrativos', 'GASTOS_ADMIN'],
        ['Gastos Comercialización', 'GASTOS_COMERCIAL'],
        ['Transportes (Egreso)', 'TRANSPORTES_EGR'],
        ['Gastos SIG', 'GASTOS_SIG'],
        ['Gastos Tributarios', 'GASTOS_TRIBUTARIOS'],
        ['Gastos Financieros', 'GASTOS_FINANCIEROS'],
        ['Otros Egresos', 'OTROS_EGRESOS'],
        ['Total Egresos', 'TOTAL_EGRESOS'],
        ['Saldo Operativo', 'SALDO_OPERATIVO']
    ];
    
    // Usar datos consolidados del flujo operativo
    if (datos.flujoOperativo) {
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.flujoOperativo[clave] || 0;
            ws_data.push([nombre, parseFloat(valor) || 0]);
        });
    } else if (datos.datosPorPeriodoFO && datos.datosPorPeriodoFO.consolidado) {
        // Fallback a datos por período
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.datosPorPeriodoFO.consolidado[clave] || 0;
            ws_data.push([nombre, parseFloat(valor) || 0]);
        });
    }
    
    return XLSX.utils.aoa_to_sheet(ws_data);
}

// Función para crear worksheet de Flujo Corporativo
function crearWorksheetFlujoCorporativo(datos) {
    const ws_data = [['Cuenta', 'Total']];
    
    const cuentas = [
        ['Transferencia Fondos', 'TRANSFERENCIA_FONDOS'],
        ['Desembolsos Bancarios', 'DESEMBOLSOS_BANCARIOS'],
        ['Otros Ingresos', 'OTROS_INGRESOS'],
        ['Total Ingresos', 'TOTAL_INGRESOS'],
        ['Transferencia Fondos (Egreso)', 'TRANSFERENCIA_FONDOS_EGR'],
        ['Pagos Financieros', 'PAGOS_FINANCIEROS'],
        ['Otros Egresos', 'OTROS_EGRESOS'],
        ['Total Egresos', 'TOTAL_EGRESOS'],
        ['Saldo Corporativo', 'SALDO_CORPORATIVO']
    ];
    
    // Usar datos consolidados del flujo corporativo
    if (datos.flujoCorporativo) {
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.flujoCorporativo[clave] || 0;
            ws_data.push([nombre, parseFloat(valor) || 0]);
        });
    } else if (datos.datosPorPeriodoFC && datos.datosPorPeriodoFC.consolidado) {
        // Fallback a datos por período
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.datosPorPeriodoFC.consolidado[clave] || 0;
            ws_data.push([nombre, parseFloat(valor) || 0]);
        });
    }
    
    return XLSX.utils.aoa_to_sheet(ws_data);
}

// Función fallback para exportar como CSV
function exportarComoCSV(tipo, datos) {
    let csvContent = '';
    let filename = '';
    
    switch(tipo) {
        case 'estado-resultados':
            csvContent = generarCSVEstadoResultados(datos);
            filename = 'consolidado-estado-resultados.csv';
            break;
        case 'balance':
            csvContent = generarCSVBalance(datos);
            filename = 'consolidado-balance-general.csv';
            break;
        case 'flujo-operativo':
            csvContent = generarCSVFlujoOperativo(datos);
            filename = 'consolidado-flujo-operativo.csv';
            break;
        case 'flujo-corporativo':
            csvContent = generarCSVFlujoCorporativo(datos);
            filename = 'consolidado-flujo-corporativo.csv';
            break;
    }
    
    // Descargar archivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funciones para generar CSV (fallback)
function generarCSVEstadoResultados(datos) {
    let csv = 'Concepto,Total\n';
    
    const conceptos = [
        ['Ventas Netas', 'ventas_netas'],
        ['Costo de Ventas', 'costo_ventas'],
        ['Utilidad Bruta', 'utilidad_bruta'],
        ['Gasto Administrativo', 'gasto_administrativo'],
        ['Gasto Comercialización', 'gasto_comercializacion'],
        ['Gasto SIG', 'gasto_sig'],
        ['Gasto Tributario', 'gasto_tributario'],
        ['Gasto Financiero', 'gasto_financiero'],
        ['Utilidad Operativa', 'utilidad_operativa'],
        ['Otros Ingresos', 'otros_ingresos'],
        ['Otros Egresos', 'otros_egresos'],
        ['Utilidad Neta', 'utilidad_neta']
    ];
    
    if (datos.estadoResultados) {
        conceptos.forEach(([nombre, clave]) => {
            const valor = datos.estadoResultados[clave] || 0;
            csv += `"${nombre}",${valor}\n`;
        });
    }
    
    return csv;
}

function generarCSVBalance(datos) {
    let csv = 'Cuenta,Total\n';
    
    const cuentas = [
        ['Disponible', 'DISPONIBLE'],
        ['Exigible', 'EXIGIBLE'],
        ['Realizable', 'REALIZABLE'],
        ['Activo Corriente', 'ACTIVO_CORRIENTE'],
        ['Activo No Corriente', 'ACTIVO_NO_CORRIENTE'],
        ['Total Activo', 'TOTAL_ACTIVOS'],
        ['Pasivo Corriente', 'PASIVO_CORRIENTE'],
        ['Pasivo No Corriente', 'PASIVO_NO_CORRIENTE'],
        ['Total Pasivo', 'TOTAL_PASIVOS'],
        ['Patrimonio', 'PATRIMONIO'],
        ['Total Pasivo + Patrimonio', 'TOTAL_PASIVO_PATRIMONIO']
    ];
    
    if (datos.balanceGeneral) {
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.balanceGeneral[clave] || 0;
            csv += `"${nombre}",${valor}\n`;
        });
    }
    
    return csv;
}

function generarCSVFlujoOperativo(datos) {
    let csv = 'Cuenta,Total\n';
    
    const cuentas = [
        ['Ventas', 'VENTAS'],
        ['Ventas Exportación', 'VENTAS_EXPORTACION'],
        ['Cartera', 'CARTERA'],
        ['Transportes (Ingreso)', 'TRANSPORTES_ING'],
        ['Otros Ingresos', 'OTROS_INGRESOS'],
        ['Total Ingresos', 'TOTAL_INGRESOS'],
        ['Compras', 'COMPRAS'],
        ['Gastos Administrativos', 'GASTOS_ADMIN'],
        ['Gastos Comercialización', 'GASTOS_COMERCIAL'],
        ['Transportes (Egreso)', 'TRANSPORTES_EGR'],
        ['Gastos SIG', 'GASTOS_SIG'],
        ['Gastos Tributarios', 'GASTOS_TRIBUTARIOS'],
        ['Gastos Financieros', 'GASTOS_FINANCIEROS'],
        ['Otros Egresos', 'OTROS_EGRESOS'],
        ['Total Egresos', 'TOTAL_EGRESOS'],
        ['Saldo Operativo', 'SALDO_OPERATIVO']
    ];
    
    if (datos.flujoOperativo) {
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.flujoOperativo[clave] || 0;
            csv += `"${nombre}",${valor}\n`;
        });
    }
    
    return csv;
}

function generarCSVFlujoCorporativo(datos) {
    let csv = 'Cuenta,Total\n';
    
    const cuentas = [
        ['Transferencia Fondos', 'TRANSFERENCIA_FONDOS'],
        ['Desembolsos Bancarios', 'DESEMBOLSOS_BANCARIOS'],
        ['Otros Ingresos', 'OTROS_INGRESOS'],
        ['Total Ingresos', 'TOTAL_INGRESOS'],
        ['Transferencia Fondos (Egreso)', 'TRANSFERENCIA_FONDOS_EGR'],
        ['Pagos Financieros', 'PAGOS_FINANCIEROS'],
        ['Otros Egresos', 'OTROS_EGRESOS'],
        ['Total Egresos', 'TOTAL_EGRESOS'],
        ['Saldo Corporativo', 'SALDO_CORPORATIVO']
    ];
    
    if (datos.flujoCorporativo) {
        cuentas.forEach(([nombre, clave]) => {
            const valor = datos.flujoCorporativo[clave] || 0;
            csv += `"${nombre}",${valor}\n`;
        });
    }
    
    return csv;
}

// Hacer la función global
window.exportToExcel = exportToExcel;
