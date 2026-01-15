const db = require('../config/database');

class Rol {
    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM ROL ORDER BY NOMBRE_ROL');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener roles: ${error.message}`);
        }
    }
}

module.exports = Rol;
