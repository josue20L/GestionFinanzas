// Configuración de Tasas de Cambio
document.addEventListener('DOMContentLoaded', function() {
    const formTasa = document.getElementById('formTasa');
    const tablaHistorial = document.getElementById('tablaHistorial');

    // Cargar historial de tasas al cargar la página
    cargarHistorialTasas();

    // Manejar envío del formulario
    if (formTasa) {
        formTasa.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const valorVenta = document.getElementById('valorVenta').value;
            
            if (!valorVenta || valorVenta <= 0) {
                mostrarNotificacion('Por favor, ingrese un valor válido', 'error');
                return;
            }

            try {
                const response = await fetch('/api/tasas/actualizar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        valor_compra: valorVenta,
                        valor_venta: valorVenta,
                        id_moneda_origen: 1, // BOB
                        id_moneda_destino: 2  // USD
                    })
                });

                if (response.ok) {
                    mostrarNotificacion('Tasa de cambio guardada exitosamente', 'success');
                    formTasa.reset();
                    cargarHistorialTasas();
                } else {
                    const error = await response.json();
                    mostrarNotificacion(error.message || 'Error al guardar la tasa', 'error');
                }
            } catch (error) {
                console.error('Error al guardar tasa:', error);
                mostrarNotificacion('Error al guardar la tasa', 'error');
            }
        });
    }

    // Función para cargar historial de tasas
    async function cargarHistorialTasas() {
        try {
            // Usar la ruta correcta para historial (BOB=1, USD=2)
            const response = await fetch('/api/tasas/1/2/historial');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.historial) {
                    renderizarHistorial(data.historial);
                }
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    }

    // Función para renderizar historial en la tabla
    function renderizarHistorial(tasas) {
        const tbody = tablaHistorial.querySelector('tbody');
        tbody.innerHTML = '';

        if (!tasas || tasas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay tasas registradas</td></tr>';
            return;
        }

        tasas.forEach(tasa => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(tasa.fecha).toLocaleDateString()}</td>
                <td>${tasa.nombre_moneda_origen || 'BOB'}</td>
                <td>${tasa.nombre_moneda_destino || 'USD'}</td>
                <td>${tasa.valor_venta}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo) {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
        notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        notificacion.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notificacion);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }
});
