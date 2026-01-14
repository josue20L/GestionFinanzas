class BalanceGeneralManager {
    constructor(container) {
        this.container = container;
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn('Contenedor de balance general no encontrado');
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
        console.log('🔄 Calculando Balance General...');
        
        // Activo Corriente (inputs)
        const disponible = this.getInputValue('disponible');
        const exigible = this.getInputValue('exigible');
        const realizable = this.getInputValue('realizable');
        
        // Activo Corriente = DISPONIBLE + EXIGIBLE + REALIZABLE
        const activoCorriente = disponible + exigible + realizable;
        this.setInputValue('activo_corriente', activoCorriente);
        
        console.log('Activo corriente:', activoCorriente);

        // Activo No Corriente (inputs)
        const activoFijoTangible = this.getInputValue('activo_fijo_tangible');
        const activoDiferido = this.getInputValue('activo_diferido');
        const otrosActivos = this.getInputValue('otros_activos');
        
        // Activo No Corriente = ACTIVO_FIJO_TANGIBLE + ACTIVO_DIFERIDO + OTROS_ACTIVOS
        const activoNoCorriente = activoFijoTangible + activoDiferido + otrosActivos;
        this.setInputValue('activo_no_corriente', activoNoCorriente);
        
        console.log('Activo no corriente:', activoNoCorriente);

        // Total Activo = ACTIVO_CORRIENTE + ACTIVO_NO_CORRIENTE
        const totalActivo = activoCorriente + activoNoCorriente;
        this.setInputValue('total_activo', totalActivo);
        
        console.log('Total activo:', totalActivo);

        // Pasivo Corriente (input)
        const pasivoCorriente = this.getInputValue('pasivo_corriente');
        
        console.log('Pasivo corriente:', pasivoCorriente);

        // Pasivo No Corriente (inputs)
        const previsionBeneficiosSociales = this.getInputValue('prevision_beneficios_sociales');
        const obligacionesBancarias = this.getInputValue('obligaciones_bancarias');
        const interesesPorPagar = this.getInputValue('intereses_pagar');
        const procesosLegales = this.getInputValue('procesos_legales');
        
        // Pasivo No Corriente = PREVISION_BENEFICIOS_SOCIALES + OBLIGACIONES_BANCARIAS + INTERESES_POR_PAGAR + PROCESOS_LEGALES
        const pasivoNoCorriente = previsionBeneficiosSociales + obligacionesBancarias + interesesPorPagar + procesosLegales;
        this.setInputValue('pasivo_no_corriente', pasivoNoCorriente);
        
        console.log('Pasivo no corriente:', pasivoNoCorriente);

        // Patrimonio (input)
        const patrimonio = this.getInputValue('patrimonio');
        
        console.log('Patrimonio:', patrimonio);

        // Total Pasivo y Patrimonio = PASIVO_CORRIENTE + PASIVO_NO_CORRIENTE + PATRIMONIO
        const totalPasivoPatrimonio = pasivoCorriente + pasivoNoCorriente + patrimonio;
        this.setInputValue('total_pasivo_patrimonio', totalPasivoPatrimonio);
        
        console.log('Total pasivo + patrimonio:', totalPasivoPatrimonio);
        console.log('✅ Cálculos de Balance General completados');
    }

    async cargarDatos(periodoId) {
        try {
            console.log('⚖️ Cargando Balance General...');
            console.log('🔍 Periodo ID:', periodoId);
            console.log('🔍 Container:', this.container);
            
            const response = await fetch(`/api/balance-general/${periodoId}`);
            const data = await response.json();
            
            console.log('🔍 Response OK:', response.ok);
            console.log('🔍 Data recibida:', data);

            if (response.ok && data) {
                let camposCargados = 0;
                Object.keys(data).forEach(rawkey => {

                    if (rawkey.startsWith('ID_')) return;

                    // Mapeo explícito de nombres de campos
                    const keyMap = {
                        'DISPONIBLE': 'disponible',
                        'EXIGIBLE': 'exigible',
                        'REALIZABLE': 'realizable',
                        'ACTIVO_FIJO_TANGIBLE': 'activo_fijo_tangible',
                        'ACTIVO_DIFERIDO': 'activo_diferido',
                        'OTROS_ACTIVOS': 'otros_activos',
                        'PASIVO_CORRIENTE': 'pasivo_corriente',
                        'PREVISION_BENEFICIOS_SOCIALES': 'prevision_beneficios_sociales',
                        'OBLIGACIONES_BANCARIAS': 'obligaciones_bancarias',
                        'INTERESES_POR_PAGAR': 'intereses_pagar',
                        'PROCESOS_LEGALES': 'procesos_legales',
                        'PATRIMONIO': 'patrimonio',
                        'ACTIVO_CORRIENTE': 'activo_corriente',
                        'ACTIVO_NO_CORRIENTE': 'activo_no_corriente',
                        'TOTAL_ACTIVO': 'total_activo',
                        'PASIVO_NO_CORRIENTE': 'pasivo_no_corriente',
                        'TOTAL_PASIVO_PATRIMONIO': 'total_pasivo_patrimonio'
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
                
                console.log(`✅ Balance General: ${camposCargados} campos cargados`);
                return { success: true, camposCargados };
            } else {
                console.log('ℹ️ No hay datos previos de Balance General');
                return { success: true, camposCargados: 0 };
            }
        } catch (error) {
            console.error('Error al cargar balance general:', error);
            return { success: false, error: error.message };
        }
    }

    async guardarDatos(periodoId) {
        try {
            console.log('⚖️ Guardando Balance General...');
            
            const data = this.getFormData();
            // Agregar el ID del período
            data.id_periodo = periodoId;
            
            console.log('Datos a guardar:', data);
            
            const response = await fetch(`/api/balance-general`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar Balance General');
            }
            
            console.log('✅ Balance General guardado');
            return { success: true };
        } catch (error) {
            console.error('Error al guardar balance general:', error);
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
window.BalanceGeneralManager = BalanceGeneralManager;
