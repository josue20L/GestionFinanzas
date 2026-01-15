// Variables globales
let monedas = [];
let monedaIdEliminar = null;

// Cargar monedas al iniciar la página
document.addEventListener('DOMContentLoaded', cargarMonedas);

// Función para cargar todas las monedas
async function cargarMonedas() {
    try {
        console.log('🔄 Cargando monedas...');
        const response = await fetch('/api/monedas', {
            credentials: 'same-origin'
        });
        
        console.log('📊 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📋 Result:', result);
        
        if (result.success) {
            monedas = result.data;
            console.log('💰 Monedas cargadas:', monedas);
            renderizarTabla();
        } else {
            console.error('❌ Error en respuesta:', result);
            mostrarAlerta('Error al cargar monedas', 'danger');
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        mostrarAlerta('Error de conexión: ' + error.message, 'danger');
    }
}

// Función para renderizar la tabla
function renderizarTabla() {
    const tbody = document.querySelector('#tablaMonedas tbody');
    tbody.innerHTML = '';
    
    monedas.forEach(moneda => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${moneda.ID_MONEDA}</td>
            <td>${moneda.NOMBRE_MONEDA}</td>
            <td>${moneda.SIMBOLO}</td>
            <td>${moneda.CODIGO_ISO}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editarMoneda(${moneda.ID_MONEDA})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarMoneda(${moneda.ID_MONEDA}, '${moneda.NOMBRE_MONEDA}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función para editar moneda
function editarMoneda(id) {
    const moneda = monedas.find(m => m.ID_MONEDA === id);
    if (moneda) {
        document.getElementById('monedaId').value = moneda.ID_MONEDA;
        document.getElementById('nombre_moneda').value = moneda.NOMBRE_MONEDA;
        document.getElementById('simbolo').value = moneda.SIMBOLO;
        document.getElementById('codigo_iso').value = moneda.CODIGO_ISO;
        document.getElementById('modalMonedaTitle').textContent = 'Editar Moneda';
        
        const modal = new bootstrap.Modal(document.getElementById('modalMoneda'));
        modal.show();
    }
}

// Función para eliminar moneda
function eliminarMoneda(id, nombre) {
    monedaIdEliminar = id;
    document.getElementById('monedaEliminarNombre').textContent = nombre;
    
    const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
    modal.show();
}

// Event listener para guardar moneda
document.getElementById('btnGuardarMoneda').addEventListener('click', async function() {
    const id = document.getElementById('monedaId').value;
    const nombre_moneda = document.getElementById('nombre_moneda').value.trim();
    const simbolo = document.getElementById('simbolo').value.trim();
    const codigo_iso = document.getElementById('codigo_iso').value.trim().toUpperCase();
    
    if (!nombre_moneda || !simbolo || !codigo_iso) {
        mostrarAlerta('Todos los campos son requeridos', 'warning');
        return;
    }
    
    try {
        const url = id ? `/api/monedas/${id}` : '/api/monedas';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin', // Incluir cookies de sesión
            body: JSON.stringify({
                nombre_moneda,
                simbolo,
                codigo_iso
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta(id ? 'Moneda actualizada correctamente' : 'Moneda creada correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalMoneda')).hide();
            cargarMonedas();
            limpiarFormulario();
        } else {
            mostrarAlerta(result.message || 'Error al guardar moneda', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión', 'danger');
    }
});

// Event listener para confirmar eliminación
document.getElementById('btnConfirmarEliminar').addEventListener('click', async function() {
    try {
        const response = await fetch(`/api/monedas/${monedaIdEliminar}`, {
            method: 'DELETE',
            credentials: 'same-origin' // Incluir cookies de sesión
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('Moneda eliminada correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            cargarMonedas();
        } else {
            mostrarAlerta(result.message || 'Error al eliminar moneda', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión', 'danger');
    }
});

// Función para limpiar formulario
function limpiarFormulario() {
    document.getElementById('formMoneda').reset();
    document.getElementById('monedaId').value = '';
    document.getElementById('modalMonedaTitle').textContent = 'Nueva Moneda';
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    // Crear alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar al principio del container
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alerta, container.firstChild);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Resetear formulario cuando se cierra el modal
document.getElementById('modalMoneda').addEventListener('hidden.bs.modal', limpiarFormulario);
