const db = require('../config/database');

class Empresa {
    // Obtener todas las empresas
    static async getAll() {
        try {
            const [rows] = await db.query(`
                SELECT e.*, g.NOMBRE_GRUPO, m.SIMBOLO, m.NOMBRE_MONEDA
                FROM EMPRESA e
                LEFT JOIN GRUPO_EMPRESARIAL g ON e.ID_GRUPO = g.ID_GRUPO
                LEFT JOIN MONEDA m ON e.ID_MONEDA = m.ID_MONEDA
                ORDER BY e.NOMBRE_EMPRESA
            `);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener empresas: ${error.message}`);
        }
    }

    // Obtener empresa por ID
    static async getById(id) {
        try {
            const [rows] = await db.query(`
                SELECT e.*, g.NOMBRE_GRUPO, m.SIMBOLO, m.NOMBRE_MONEDA
                FROM EMPRESA e
                LEFT JOIN GRUPO_EMPRESARIAL g ON e.ID_GRUPO = g.ID_GRUPO
                LEFT JOIN MONEDA m ON e.ID_MONEDA = m.ID_MONEDA
                WHERE e.ID_EMPRESA = ?
            `, [id]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener empresa: ${error.message}`);
        }
    }

    // Crear nueva empresa
    static async create(empresa) {
        try {
            const [result] = await db.query(`
                INSERT INTO EMPRESA (ID_GRUPO, ID_MONEDA, NOMBRE_EMPRESA, NIT_RUC, PAIS)
                VALUES (?, ?, ?, ?, ?)
            `, [
                empresa.id_grupo,
                empresa.id_moneda,
                empresa.nombre_empresa,
                empresa.nit_ruc || null,
                empresa.pais || null
            ]);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear empresa: ${error.message}`);
        }
    }

    // Actualizar empresa
    static async update(id, empresa) {
        try {
            const [result] = await db.query(`
                UPDATE EMPRESA 
                SET ID_GRUPO = ?, ID_MONEDA = ?, NOMBRE_EMPRESA = ?, NIT_RUC = ?, PAIS = ?
                WHERE ID_EMPRESA = ?
            `, [
                empresa.id_grupo,
                empresa.id_moneda,
                empresa.nombre_empresa,
                empresa.nit_ruc || null,
                empresa.pais || null,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar empresa: ${error.message}`);
        }
    }

    // Eliminar empresa
    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM EMPRESA WHERE ID_EMPRESA = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar empresa: ${error.message}`);
        }
    }

    // Obtener grupos empresariales
    static async getGrupos() {
        try {
            const [rows] = await db.query('SELECT * FROM GRUPO_EMPRESARIAL ORDER BY NOMBRE_GRUPO');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener grupos: ${error.message}`);
        }
    }

    // Obtener monedas
    static async getMonedas() {
        try {
            const [rows] = await db.query('SELECT * FROM MONEDA ORDER BY NOMBRE_MONEDA');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener monedas: ${error.message}`);
        }
    }
}

module.exports = Empresa;
