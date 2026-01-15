const db = require('../config/database');

class Moneda {
    // Obtener todas las monedas
    static async getAll() {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM MONEDA ORDER BY NOMBRE_MONEDA'
            );
            return rows;
        } catch (error) {
            console.error('Error obteniendo monedas:', error);
            throw error;
        }
    }

    // Obtener moneda por ID
    static async getById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM MONEDA WHERE ID_MONEDA = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error obteniendo moneda por ID:', error);
            throw error;
        }
    }

    // Crear nueva moneda
    static async create(data) {
        try {
            const [result] = await db.execute(
                'INSERT INTO MONEDA (NOMBRE_MONEDA, SIMBOLO, CODIGO_ISO) VALUES (?, ?, ?)',
                [data.nombre_moneda, data.simbolo, data.codigo_iso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creando moneda:', error);
            throw error;
        }
    }

    // Actualizar moneda
    static async update(id, data) {
        try {
            const [result] = await db.execute(
                'UPDATE MONEDA SET NOMBRE_MONEDA = ?, SIMBOLO = ?, CODIGO_ISO = ? WHERE ID_MONEDA = ?',
                [data.nombre_moneda, data.simbolo, data.codigo_iso, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error actualizando moneda:', error);
            throw error;
        }
    }

    // Eliminar moneda
    static async delete(id) {
        try {
            const [result] = await db.execute(
                'DELETE FROM MONEDA WHERE ID_MONEDA = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error eliminando moneda:', error);
            throw error;
        }
    }

    // Obtener moneda por código ISO
    static async getByCodigoISO(codigo_iso) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM MONEDA WHERE CODIGO_ISO = ?',
                [codigo_iso]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error obteniendo moneda por código ISO:', error);
            throw error;
        }
    }
}

module.exports = Moneda;
