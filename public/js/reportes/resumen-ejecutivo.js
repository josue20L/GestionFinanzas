class ResumenEjecutivoManager {
    constructor() {
        this.empresaSelect = document.getElementById('empresa-select');
        this.periodoSelect = document.getElementById('periodo-select');
        this.resumenContainer = document.getElementById('resumen-container');
        this.loadingContainer = document.getElementById('loading-container');
        
        this.datosActuales = null;
        
        this.init();
    }

    init() {
        this.cargarEmpresas();
        this.establecerPeriodoActual();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listeners para los selectores
        this.empresaSelect.addEventListener('change', () => this.verificarDatosDisponibles());
        this.periodoSelect.addEventListener('change', () => this.verificarDatosDisponibles());
    }

    async cargarEmpresas() {
        try {
            const response = await fetch('/api/empresas');
            const empresas = await response.json();

            this.empresaSelect.innerHTML = '<option value="">Seleccione una empresa</option>';

            empresas.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.ID_EMPRESA;
                option.textContent = empresa.NOMBRE_EMPRESA || 'Sin nombre';
                this.empresaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar empresas:', error);
            this.mostrarError('Error al cargar empresas');
        }
    }

    establecerPeriodoActual() {
        const fechaActual = new Date().toISOString().slice(0, 7);
        this.periodoSelect.value = fechaActual;
    }

    async verificarDatosDisponibles() {
        const empresaId = this.empresaSelect.value;
        const periodo = this.periodoSelect.value;

        if (!empresaId || !periodo) {
            return;
        }

        try {
            const response = await fetch(`/api/periodos-financieros/empresa/${empresaId}`);
            const result = await response.json();

            if (response.ok) {
                const periodos = result.periodos || [];
                const periodoExiste = periodos.some(p => 
                    p.ANO == periodo.split('-')[0] && p.MES == periodo.split('-')[1]
                );

                if (!periodoExiste) {
                    this.mostrarAdvertencia(`El período ${periodo} no tiene datos cargados. 
                        <a href="/carga-mensual" class="alert-link">Cargar datos aquí</a>`);
                } else {
                    this.ocultarMensajes();
                }
            }
        } catch (error) {
            console.error('Error al verificar datos:', error);
        }
    }

    async cargarResumenEjecutivo() {
        const empresaId = this.empresaSelect.value;
        const periodo = this.periodoSelect.value;

        if (!empresaId || !periodo) {
            this.mostrarError('Por favor seleccione empresa y período');
            return;
        }

        try {
            this.mostrarLoading(true);

            const [anio, mes] = periodo.split('-');
            const response = await fetch(`/api/reportes/resumen-ejecutivo?id_empresa=${empresaId}&anio=${anio}&mes=${mes}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al generar resumen');
            }

            this.datosActuales = result.resumen;
            
            // Validar que los datos existan antes de mostrar
            if (!result.resumen || !result.resumen.resumenEjecutivo) {
                throw new Error('Datos incompletos recibidos del servidor');
            }
            
            this.mostrarResumen(result.resumen);
            
        } catch (error) {
            console.error('Error al cargar resumen ejecutivo:', error);
            this.mostrarError(`Error: ${error.message}`);
        } finally {
            this.mostrarLoading(false);
        }
    }

    mostrarResumen(resumen) {
        // Ocultar loading y mostrar contenedor
        this.resumenContainer.style.display = 'block';
        this.loadingContainer.style.display = 'none';

        // Mostrar contexto
        this.mostrarContexto(resumen.contexto);
        
        // Mostrar resumen ejecutivo
        this.mostrarDatosPrincipales(resumen.resumenEjecutivo);
        
        // Calcular y mostrar indicadores
        this.calcularIndicadores(resumen.resumenEjecutivo);
    }

    mostrarContexto(contexto) {
        if (!contexto) return;
        document.getElementById('contexto-periodo').textContent = contexto.periodo || '-';
        document.getElementById('contexto-empresa').textContent = contexto.empresa || '-';
        const reporteEl = document.getElementById('contexto-reporte');
        const fechaEl = document.getElementById('contexto-fecha');
        if (reporteEl) reporteEl.textContent = contexto.reporte || '-';
        if (fechaEl) fechaEl.textContent = contexto.fechaGeneracion || '-';
    }

    mostrarDatosPrincipales(datos) {
        // datos es directamente el objeto resumenEjecutivo (totalIngresos, totalEgresos, etc.)
        if (!datos || typeof datos.totalIngresos === 'undefined') {
            return;
        }

        const elementos = {
            'total-ingresos': document.getElementById('total-ingresos'),
            'total-egresos': document.getElementById('total-egresos'),
            'utilidad-neta': document.getElementById('utilidad-neta'),
            'saldo-caja': document.getElementById('saldo-caja')
        };

        elementos['total-ingresos'] && (elementos['total-ingresos'].textContent = this.formatearMoneda(datos.totalIngresos));
        elementos['total-egresos'] && (elementos['total-egresos'].textContent = this.formatearMoneda(datos.totalEgresos));
        elementos['utilidad-neta'] && (elementos['utilidad-neta'].textContent = this.formatearMoneda(datos.utilidadNeta));
        elementos['saldo-caja'] && (elementos['saldo-caja'].textContent = this.formatearMoneda(datos.saldoFinalCaja));

        this.mostrarVariacion('variacion-ingresos', datos.variacionIngresos);
        this.mostrarVariacion('variacion-egresos', datos.variacionEgresos);
        this.mostrarVariacion('variacion-utilidad', datos.variacionUtilidad);
        this.mostrarVariacion('variacion-caja', datos.variacionCaja);

        this.calcularIndicadores(datos);
    }

    mostrarVariacion(elementId, variacion) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (!variacion) {
            element.innerHTML = '<span class="text-muted">Sin datos anteriores</span>';
            return;
        }

        const colorClass = variacion.tendencia === 'positiva' ? 'text-success' : 
                         variacion.tendencia === 'negativa' ? 'text-danger' : 'text-muted';
        const icon = variacion.tendencia === 'positiva' ? '↑' : 
                     variacion.tendencia === 'negativa' ? '↓' : '→';

        element.innerHTML = `
            <span class="${colorClass}">
                ${icon} ${variacion.porcentaje}% 
                (${this.formatearMoneda(Math.abs(variacion.valor))})
            </span>
        `;
    }

    calcularIndicadores(datos) {
        // Validar que los datos existan
        if (!datos || !datos.totalIngresos || !datos.totalEgresos) {
            console.error('Datos inválidos para calcular indicadores:', datos);
            return;
        }

        // Margen Neto
        const margenNeto = datos.totalIngresos > 0 ? 
            (datos.utilidadNeta / datos.totalIngresos) * 100 : 0;
        document.getElementById('margen-neto').textContent = `${margenNeto.toFixed(1)}%`;

        // Rentabilidad (basada en utilidad vs caja)
        const rentabilidad = datos.saldoFinalCaja > 0 ? 
            (datos.utilidadNeta / datos.saldoFinalCaja) * 100 : 0;
        document.getElementById('rentabilidad').textContent = `${rentabilidad.toFixed(1)}%`;

        // Eficiencia (ingresos vs egresos)
        const eficiencia = datos.totalEgresos > 0 ? 
            (datos.totalIngresos / datos.totalEgresos) * 100 : 0;
        document.getElementById('eficiencia').textContent = `${eficiencia.toFixed(1)}%`;

        // Tendencia general
        const tendenciaGeneral = this.calcularTendenciaGeneral(datos);
        const tendenciaElement = document.getElementById('tendencia-general');
        
        if (tendenciaGeneral === 'positiva') {
            tendenciaElement.innerHTML = '<i class="bi bi-arrow-up-circle-fill text-success"></i>';
        } else if (tendenciaGeneral === 'negativa') {
            tendenciaElement.innerHTML = '<i class="bi bi-arrow-down-circle-fill text-danger"></i>';
        } else {
            tendenciaElement.innerHTML = '<i class="bi bi-dash-circle text-muted"></i>';
        }
    }

    calcularTendenciaGeneral(datos) {
        let positivas = 0;
        let negativas = 0;

        if (datos.variacionIngresos?.tendencia === 'positiva') positivas++;
        else if (datos.variacionIngresos?.tendencia === 'negativa') negativas++;

        if (datos.variacionEgresos?.tendencia === 'positiva') positivas++;
        else if (datos.variacionEgresos?.tendencia === 'negativa') negativas++;

        if (datos.variacionUtilidad?.tendencia === 'positiva') positivas++;
        else if (datos.variacionUtilidad?.tendencia === 'negativa') negativas++;

        if (datos.variacionCaja?.tendencia === 'positiva') positivas++;
        else if (datos.variacionCaja?.tendencia === 'negativa') negativas++;

        if (positivas > negativas) return 'positiva';
        if (negativas > positivas) return 'negativa';
        return 'neutra';
    }

    mostrarLoading(show) {
        if (show) {
            this.loadingContainer.style.display = 'block';
            this.resumenContainer.style.display = 'none';
        } else {
            this.loadingContainer.style.display = 'none';
        }
    }

    mostrarError(mensaje) {
        this.ocultarMensajes();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.card.mb-4');
        container.parentNode.insertBefore(alertDiv, container.nextSibling);
    }

    mostrarAdvertencia(mensaje) {
        this.ocultarMensajes();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.card.mb-4');
        container.parentNode.insertBefore(alertDiv, container.nextSibling);
    }

    ocultarMensajes() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    formatearMoneda(valor) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true
        }).format(valor || 0);
    }

    formatearFecha(fechaISO) {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    exportarPDF() {
        if (!this.datosActuales) {
            this.mostrarError('Primero genere un resumen ejecutivo');
            return;
        }

        // Aquí iría la lógica de exportación a PDF
        // Por ahora, mostramos un mensaje
        this.mostrarAdvertencia('Función de exportación PDF en desarrollo');
    }
}

// Funciones globales para onclick
let resumenEjecutivoManager;

function cargarResumenEjecutivo() {
    if (resumenEjecutivoManager) {
        resumenEjecutivoManager.cargarResumenEjecutivo();
    } else {
        console.error('resumenEjecutivoManager no está inicializado');
    }
}

function exportarPDF() {
    if (resumenEjecutivoManager) {
        resumenEjecutivoManager.exportarPDF();
    } else {
        console.error('resumenEjecutivoManager no está inicializado');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    resumenEjecutivoManager = new ResumenEjecutivoManager();
});
