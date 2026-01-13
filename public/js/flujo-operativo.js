class FlujoOperativoManager {
    constructor(container) {
        this.container = container;
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn('Contenedor de flujo operativo no encontrado');
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
        console.log('🔄 Calculando Flujo Operativo...');
        
        // Ingresos (inputs)
        const ventas = this.getInputValue('ventas');
        const ventasExportacion = this.getInputValue('ventas_exportacion');
        const cartera = this.getInputValue('cartera');
        const transportesIngreso = this.getInputValue('transportes_ing');
        const otrosIngresos = this.getInputValue('otros_ingresos');
        
        // Total Ingresos = Ventas + Ventas Exportación + Cartera + Transportes + Otros Ingresos
        const totalIngresos = ventas + ventasExportacion + cartera + transportesIngreso + otrosIngresos;
        this.setInputValue('fo_total_ingresos', totalIngresos);
        
        console.log('Total ingresos:', totalIngresos);

        // Egresos (inputs)
        const gastosAdministrativos = this.getInputValue('gastos_administrativos');
        const gastosComerciales = this.getInputValue('gastos_comerciales');
        const gastosProduccion = this.getInputValue('gastos_produccion');
        const enviosCuentaCorporativa = this.getInputValue('envios_cta_corp');
        const impuestos = this.getInputValue('impuestos');
        const transportesEgreso = this.getInputValue('transportes_egr');
        const cuentasPorPagar = this.getInputValue('cuentas_por_pagar');
        const inversiones = this.getInputValue('inversiones');
        const otrosGastos = this.getInputValue('otros_gastos');
        
        // Total Egresos = Gastos Administrativos + Gastos Comerciales + Gastos Producción + Envíos Cta Corp + Impuestos + Transportes + Cuentas por Pagar + Inversiones + Otros Gastos
        const totalEgresos = gastosAdministrativos + gastosComerciales + gastosProduccion + enviosCuentaCorporativa + impuestos + transportesEgreso + cuentasPorPagar + inversiones + otrosGastos;
        this.setInputValue('fo_total_egresos', totalEgresos);
        
        console.log('Total egresos:', totalEgresos);

        // Saldo Anterior (input)
        const saldoAnterior = this.getInputValue('saldo_anterior');
        
        // Ingresos y Egresos calculados (iguales a los totales)
        this.setInputValue('fo_ingresos_calculado', totalIngresos);
        this.setInputValue('fo_egresos_calculado', totalEgresos);
        
        // Saldo Actual = Saldo Anterior + Ingresos - Egresos
        const saldoActual = saldoAnterior + totalIngresos - totalEgresos;
        this.setInputValue('fo_saldo_actual', saldoActual);
        
        console.log('Saldo actual:', saldoActual);
        console.log('✅ Cálculos de Flujo Operativo completados');
    }

    async cargarDatos(periodoId) {
        try {
            console.log('💰 Cargando Flujo Operativo...');
            console.log('🔍 Periodo ID:', periodoId);
            console.log('🔍 Container:', this.container);
            
            const response = await fetch(`/api/flujo-operativo/${periodoId}`);
            const data = await response.json();
            
            console.log('🔍 Response OK:', response.ok);
            console.log('🔍 Data recibida:', data);

            if (response.ok && data) {
                let camposCargados = 0;
                Object.keys(data).forEach(key => {
                    console.log('🔍 Buscando input:', `[name="${key}"]`);
                    const input = this.container.querySelector(`[name="${key}"]`);
                    console.log('🔍 Input encontrado:', input);
                    console.log('🔍 Input value actual:', input ? input.value : 'NULL');
                    
                    if (input) {
                        input.value = data[key] || 0;
                        camposCargados++;
                        console.log('🔍 Input actualizado:', key, '=', data[key] || 0);
                    } else {
                        console.error('❌ Input NO encontrado para:', key);
                    }
                });
                
                console.log(`✅ Flujo Operativo: ${camposCargados} campos cargados`);
                return { success: true, camposCargados };
            } else {
                console.log('ℹ️ No hay datos previos de Flujo Operativo');
                return { success: true, camposCargados: 0 };
            }
        } catch (error) {
            console.error('Error al cargar flujo operativo:', error);
            return { success: false, error: error.message };
        }
    }

    async guardarDatos(periodoId) {
        try {
            console.log('💰 Guardando Flujo Operativo...');
            
            const data = this.getFormData();
            // Agregar el ID del período
            data.id_periodo = periodoId;
            
            console.log('Datos a guardar:', data);
            
            const response = await fetch(`/api/flujo-operativo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar Flujo Operativo');
            }
            
            console.log('✅ Flujo Operativo guardado');
            return { success: true };
        } catch (error) {
            console.error('Error al guardar flujo operativo:', error);
            return { success: false, error: error.message };
        }
    }

    getFormData() {
        const inputs = this.container.querySelectorAll('input[type="number"]');
        const data = {};

        inputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            // Excluir campos calculados que no existen en la BD
            if (!input.name.includes('_calculado') && input.name !== 'fo_total_ingresos' && input.name !== 'fo_total_egresos') {
                data[input.name] = value;
            }
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
window.FlujoOperativoManager = FlujoOperativoManager;
