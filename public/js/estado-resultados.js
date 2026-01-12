class EstadoResultadosManager {
    constructor() {
        this.container = document.getElementById('estado-resultados');
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn('Contenedor de estado de resultados no encontrado');
            return;
        }
        this.setupCalculos();
        this.setupEventListeners();
    }

    setupCalculos() {
        const inputs = this.container.querySelectorAll('input[type="number"]:not([readonly])');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => this.calcular());
        });

        this.calcular();
    }

    calcular() {
        console.log('🔄 Calculando Estado de Resultados...');
        
        // Ventas Netas y Costo de Ventas (inputs)
        const ventasNetas = this.getInputValue('ventas_netas');
        const costoVentas = this.getInputValue('costo_ventas');
        
        console.log('Datos entrada:', { ventasNetas, costoVentas });
        
        // Utilidad en Ventas = VENTAS_NETAS - COSTO_VENTAS
        const utilidadVentas = ventasNetas - costoVentas;
        this.setInputValue('utilidad_ventas', utilidadVentas);
        
        console.log('Utilidad en ventas calculada:', utilidadVentas);

        // Gastos (inputs)
        const gastoAdministrativo = this.getInputValue('gasto_administrativo');
        const gastoComercializacion = this.getInputValue('gasto_comercializacion');
        const gastoSig = this.getInputValue('gasto_sig');
        
        // Gasto Operativo = GASTO_ADMINISTRATIVO + GASTO_COMERCIALIZACION + GASTO_SIG
        const gastoOperativo = gastoAdministrativo + gastoComercializacion + gastoSig;
        this.setInputValue('gasto_operativo', gastoOperativo);

        // EBIT = UTILIDAD_VENTAS - GASTO_OPERATIVO
        const ebit = utilidadVentas - gastoOperativo;
        this.setInputValue('ebit', ebit);
        
        console.log('EBIT calculado:', ebit);

        // Gastos adicionales (inputs)
        const gastoTributario = this.getInputValue('gasto_tributario');
        const gastoFinanciero = this.getInputValue('gasto_financiero');
        
        // Utilidad Después de Impuestos = EBIT - (GASTO_TRIBUTARIO + GASTO_FINANCIERO)
        const utilidadDespuesImpuestos = ebit - (gastoTributario + gastoFinanciero);
        this.setInputValue('utilidad_despues_impuestos', utilidadDespuesImpuestos);
        
        console.log('Utilidad después de impuestos:', utilidadDespuesImpuestos);

        // Otros ingresos y egresos (inputs)
        const otrosIngresos = this.getInputValue('otros_ingresos');
        const otrosEgresos = this.getInputValue('otros_egresos');
        
        // Utilidad Neta = UTILIDAD_DESPUES_IMPUESTOS + OTROS_INGRESOS - OTROS_EGRESOS
        const utilidadNeta = utilidadDespuesImpuestos + otrosIngresos - otrosEgresos;
        this.setInputValue('utilidad_neta', utilidadNeta);
        
        console.log('Utilidad neta calculada:', utilidadNeta);
        console.log('✅ Cálculos completados');
    }

    async cargarDatos(periodoId) {
        try {
            console.log('📋 Cargando Estado de Resultados...');
            
            const response = await fetch(`/api/estado-resultados/${periodoId}`);
            const data = await response.json();

            if (response.ok && data) {
                let camposCargados = 0;
                Object.keys(data).forEach(key => {
                    const input = this.container.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = data[key] || 0;
                        camposCargados++;
                    }
                });
                
                console.log(`✅ Estado de Resultados: ${camposCargados} campos cargados`);
                return { success: true, camposCargados };
            } else {
                console.log('ℹ️ No hay datos previos de Estado de Resultados');
                return { success: true, camposCargados: 0 };
            }
        } catch (error) {
            console.error('Error al cargar estado de resultados:', error);
            return { success: false, error: error.message };
        }
    }

    async guardarDatos(periodoId) {
        try {
            console.log('📋 Guardando Estado de Resultados...');
            
            const data = this.getFormData();
            // Agregar el ID del período
            data.id_periodo = periodoId;
            
            console.log('Datos a guardar:', data);
            
            const response = await fetch(`/api/estado-resultados`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar Estado de Resultados');
            }
            
            console.log('✅ Estado de Resultados guardado');
            return { success: true };
        } catch (error) {
            console.error('Error al guardar estado de resultados:', error);
            return { success: false, error: error.message };
        }
    }

    getFormData() {
        const inputs = this.container.querySelectorAll('input[type="number"]');
        const data = {};

        inputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            data[input.name] = value;
        });

        return data;
    }

    getInputValue(name) {
        const input = this.container.querySelector(`[name="${name}"]`);
        return parseFloat(input?.value) || 0;
    }

    setInputValue(name, value) {
        const input = this.container.querySelector(`[name="${name}"]`);
        if (input) {
            input.value = value.toFixed(2);
        }
    }

    setupEventListeners() {
        // Eventos adicionales si se necesitan
    }

    limpiarCampos() {
        const inputs = this.container.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.value = 0;
        });
        this.calcular(); // Recalcular con valores en 0
    }
}

// Exportar para uso global
window.EstadoResultadosManager = EstadoResultadosManager;
