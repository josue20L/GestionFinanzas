const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

class TasaCambio {
    static async getUltimaTasa(idMonedaOrigen, idMonedaDestino) {
        const [rows] = await pool.query(
            `SELECT * FROM TASACAMBIO 
             WHERE ID_MONEDA_ORIGEN = ? AND ID_MONEDA_DESTINO = ? 
             ORDER BY FECHA DESC LIMIT 1`,
            [idMonedaOrigen, idMonedaDestino]
        );
        return rows[0];
    }

    static async updateTasa(idMonedaOrigen, idMonedaDestino, valorCompra, valorVenta) {
        const fecha = new Date().toISOString().split('T')[0];
        // Intentar actualizar si ya existe para hoy, sino insertar
        const [existing] = await pool.query(
            `SELECT ID_TASACAMBIO FROM TASACAMBIO 
             WHERE ID_MONEDA_ORIGEN = ? AND ID_MONEDA_DESTINO = ? AND FECHA = ?`,
            [idMonedaOrigen, idMonedaDestino, fecha]
        );

        if (existing.length > 0) {
            await pool.query(
                `UPDATE TASACAMBIO SET VALOR_COMPRA = ?, VALOR_VENTA = ? 
                 WHERE ID_TASACAMBIO = ?`,
                [valorCompra, valorVenta, existing[0].ID_TASACAMBIO]
            );
            return existing[0].ID_TASACAMBIO;
        } else {
            const [result] = await pool.query(
                `INSERT INTO TASACAMBIO (ID_MONEDA_ORIGEN, ID_MONEDA_DESTINO, FECHA, VALOR_COMPRA, VALOR_VENTA) 
                 VALUES (?, ?, ?, ?, ?)`,
                [idMonedaOrigen, idMonedaDestino, fecha, valorCompra, valorVenta]
            );
            return result.insertId;
        }
    }

    static async getHistorial(idMonedaOrigen, idMonedaDestino, limit = 10) {
        const [rows] = await pool.query(
            `SELECT * FROM TASACAMBIO 
             WHERE ID_MONEDA_ORIGEN = ? AND ID_MONEDA_DESTINO = ? 
             ORDER BY FECHA DESC LIMIT ?`,
            [idMonedaOrigen, idMonedaDestino, limit]
        );
        return rows;
    }
}

module.exports = TasaCambio;
