document.addEventListener('DOMContentLoaded', function() {
    const formTasa = document.getElementById('formTasa');
    const valorVentaInput = document.getElementById('valorVenta');
    const tablaHistorialBody = document.querySelector('#tablaHistorial tbody');

    // Cargar tasa actual e historial al iniciar
    cargarDatos();

    formTasa.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const valorVenta = parseFloat(valorVentaInput.value);
        if (isNaN(valorVenta) || valorVenta <= 0) {
            alert('Por favor ingrese un valor válido para la tasa.');
            return;
        }

        try {
            const response = await fetch('/api/tasacambio/actualizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idMonedaOrigen: 2, // BOB
                    idMonedaDestino: 1, // USD
                    valorCompra: valorVenta,
                    valorVenta: valorVenta
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Tasa de cambio actualizada correctamente');
                cargarDatos();
            } else {
                alert('Error al actualizar la tasa: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    });

    async function cargarDatos() {
        try {
            // Cargar tasa actual (BOB a USD es ID 2 a 1)
            const resActual = await fetch('/api/tasacambio/2/1/actual');
            const dataActual = await resActual.json();
            if (dataActual.success && dataActual.tasa) {
                valorVentaInput.value = dataActual.tasa.VALOR_VENTA;
            }

            // Cargar historial
            const resHist = await fetch('/api/tasacambio/2/1/historial');
            const dataHist = await resHist.json();
            if (dataHist.success) {
                tablaHistorialBody.innerHTML = '';
                dataHist.historial.forEach(tasa => {
                    const fecha = new Date(tasa.FECHA).toLocaleDateString();
                    const row = `
                        <tr>
                            <td>${fecha}</td>
                            <td>BOB</td>
                            <td>USD</td>
                            <td>${tasa.VALOR_VENTA}</td>
                        </tr>
                    `;
                    tablaHistorialBody.insertAdjacentHTML('beforeend', row);
                });
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    }
});
