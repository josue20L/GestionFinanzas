class FlujoCorporativoManager {
    constructor(container) {
        this.container = container;
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn('Contenedor de flujo corporativo no encontrado');
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
        console.log('🔄 Calculando Flujo Corporativo...');
        
        // Ingresos (inputs)
        const transferenciaFondos = this.getInputValue('fc_transferencia_fondos');
        const desembolsosBancarios = this.getInputValue('fc_desembolsos_bancarios');
        const otrosIngresos = this.getInputValue('fc_otros_ingresos');
        
        // Total Ingresos = Transferencia Fondos + Desembolsos Bancarios + Otros Ingresos
        const totalIngresos = transferenciaFondos + desembolsosBancarios + otrosIngresos;
        this.setInputValue('fc_total_ingresos', totalIngresos);
        
        console.log('Total ingresos:', totalIngresos);

        // Egresos (inputs)
        const prestamosBancarios = this.getInputValue('fc_prestamos_bancarios');
        const inversiones = this.getInputValue('fc_inversiones');
        const rprConsultores = this.getInputValue('fc_rpr_consultores');
        const bonosPLRS = this.getInputValue('fc_bonos_plrs');
        const dividendosPagar = this.getInputValue('fc_dividendos_pagar');
        const cuentasPagar = this.getInputValue('fc_cuentas_pagar');
        const aguinaldos = this.getInputValue('fc_aguinaldos');
        const finiquitos = this.getInputValue('fc_finiquitos');
        const primas = this.getInputValue('fc_primas');
        const retroactivos = this.getInputValue('fc_retroactivos');
        const iue = this.getInputValue('fc_iue');
        const otrosGastos = this.getInputValue('fc_otros_gastos');
        
        // Total Egresos = Préstamos Bancarios + Inversiones + RPR Consultores + Bonos PLRS + Dividendos a Pagar + Cuentas por Pagar + Aguinaldos + Finiquitos + Primas + Retroactivos + IUE + Otros Gastos
        const totalEgresos = prestamosBancarios + inversiones + rprConsultores + bonosPLRS + dividendosPagar + cuentasPagar + aguinaldos + finiquitos + primas + retroactivos + iue + otrosGastos;
        this.setInputValue('fc_total_egresos', totalEgresos);
        
        console.log('Total egresos:', totalEgresos);

        // Saldo Anterior (input)
        const saldoAnterior = this.getInputValue('fc_saldo_anterior');
        
        // Ingresos y Egresos calculados (iguales a los totales)
        this.setInputValue('fc_ingresos_calculado', totalIngresos);
        this.setInputValue('fc_egresos_calculado', totalEgresos);
        
        // Saldo Actual = Saldo Anterior + Ingresos - Egresos
        const saldoActual = saldoAnterior + totalIngresos - totalEgresos;
        this.setInputValue('fc_saldo_actual', saldoActual);
        
        console.log('Saldo actual:', saldoActual);
        console.log('✅ Cálculos de Flujo Corporativo completados');
    }

    async cargarDatos(periodoId) {
        try {
            console.log('🏢 Cargando Flujo Corporativo...');
            console.log('🔍 Periodo ID:', periodoId);
            console.log('🔍 Container:', this.container);
            
            const response = await fetch(`/api/flujo-corporativo/${periodoId}`);
            const data = await response.json();
            
            console.log('🔍 Response OK:', response.ok);
            console.log('🔍 Data recibida:', data);

            if (response.ok && data) {
                let camposCargados = 0;
                Object.keys(data).forEach(rawkey => {

                    if (rawkey.startsWith('ID_')) return;

                    // Mapeo explícito de nombres de campos
                    const keyMap = {
                        'TRANSFERENCIA_FONDOS': 'fc_transferencia_fondos',
                        'DESEMBOLSOS_BANCARIOS': 'fc_desembolsos_bancarios',
                        'OTROS_INGRESOS': 'fc_otros_ingresos',
                        'PRESTAMOS_BANCARIOS': 'fc_prestamos_bancarios',
                        'INVERSIONES': 'fc_inversiones',
                        'RPR_CONSULTORES': 'fc_rpr_consultores',
                        'BONOS_PLRS': 'fc_bonos_plrs',
                        'DIVIDENDOS_PAGAR': 'fc_dividendos_pagar',
                        'CUENTAS_PAGAR': 'fc_cuentas_pagar',
                        'AGUINALDOS': 'fc_aguinaldos',
                        'FINIQUITOS': 'fc_finiquitos',
                        'PRIMAS': 'fc_primas',
                        'RETROACTIVOS': 'fc_retroactivos',
                        'IUE': 'fc_iue',
                        'OTROS_GASTOS': 'fc_otros_gastos',
                        'SALDO_ANTERIOR': 'fc_saldo_anterior',
                        'TOTAL_INGRESOS': 'fc_total_ingresos',
                        'TOTAL_EGRESOS': 'fc_total_egresos',
                        'SALDO_ACTUAL': 'fc_saldo_actual'
                    };
                    
                    const inputName = keyMap[rawkey] || rawkey.toLowerCase();
                    
                    console.log('🔍 Buscando input:', `[name="${inputName}"]`);
                    const input = this.container.querySelector(`[name="${inputName}"]`);
                    console.log('🔍 Input encontrado:', input);
                    console.log('🔍 Input value actual:', input ? input.value : 'NULL');
                    
                    if (input) {
                        input.value = data[rawkey] || 0;
                        camposCargados++;
                        console.log('🔍 Input actualizado:', inputName, '=', data[rawkey] || 0);
                    } else {
                        console.error('❌ Input NO encontrado para:', inputName, '(campo original:', rawkey, ')');
                    }
                });
                
                // Llamar a calcular() para llenar campos calculados automáticamente
                this.calcular();
                
                console.log(`✅ Flujo Corporativo: ${camposCargados} campos cargados`);
                return { success: true, camposCargados };
            } else {
                console.log('ℹ️ No hay datos previos de Flujo Corporativo');
                return { success: true, camposCargados: 0 };
            }
        } catch (error) {
            console.error('Error al cargar flujo corporativo:', error);
            return { success: false, error: error.message };
        }
    }

    async guardarDatos(periodoId) {
        try {
            console.log('🏢 Guardando Flujo Corporativo...');
            
            const data = this.getFormData();
            // Agregar el ID del período
            data.id_periodo = periodoId;
            
            console.log('Datos a guardar:', data);
            
            const response = await fetch(`/api/flujo-corporativo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar Flujo Corporativo');
            }
            
            console.log('✅ Flujo Corporativo guardado');
            return { success: true };
        } catch (error) {
            console.error('Error al guardar flujo corporativo:', error);
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
window.FlujoCorporativoManager = FlujoCorporativoManager;
