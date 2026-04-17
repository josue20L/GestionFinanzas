const db = require('../config/database');

class AccesoUsuario {
    static async getByUserId(idUsuario) {
        try {
            const [rows] = await db.query(`
                SELECT au.ID_USUARIO, au.ID_EMPRESA, au.ID_ROL,
                       e.NOMBRE_EMPRESA,
                       r.NOMBRE_ROL
                FROM ACCESO_USUARIO au
                INNER JOIN EMPRESA e ON au.ID_EMPRESA = e.ID_EMPRESA
                INNER JOIN ROL r ON au.ID_ROL = r.ID_ROL
                WHERE au.ID_USUARIO = ?
                ORDER BY e.NOMBRE_EMPRESA
            `, [idUsuario]);

            return rows;
        } catch (error) {
            throw new Error(`Error al obtener accesos del usuario: ${error.message}`);
        }
    }

    static async upsert(idUsuario, idEmpresa, idRol) {
        try {
            console.log('DEBUG: Upserting access for user', idUsuario, 'empresa', idEmpresa, 'rol', idRol);
            await db.query(`
                INSERT INTO ACCESO_USUARIO (ID_USUARIO, ID_EMPRESA, ID_ROL)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE ID_ROL = VALUES(ID_ROL)
            `, [idUsuario, idEmpresa, idRol]);
            console.log('DEBUG: Upsert successful');
            return true;
        } catch (error) {
            console.error('DEBUG: Upsert failed:', error.message);
            throw new Error(`Error al asignar acceso: ${error.message}`);
        }
    }

    static async deleteByUserId(idUsuario) {
        try {
            const [result] = await db.query('DELETE FROM ACCESO_USUARIO WHERE ID_USUARIO = ?', [idUsuario]);
            return result.affectedRows >= 0;
        } catch (error) {
            throw new Error(`Error al eliminar accesos: ${error.message}`);
        }
    }

    static async deleteByEmpresa(idEmpresa) {
        try {
            const [result] = await db.query('DELETE FROM ACCESO_USUARIO WHERE ID_EMPRESA = ?', [idEmpresa]);
            return result.affectedRows >= 0;
        } catch (error) {
            throw new Error(`Error al eliminar accesos de empresa: ${error.message}`);
        }
    }
}

module.exports = AccesoUsuario;
