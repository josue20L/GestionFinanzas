const bcrypt = require('bcryptjs');
const db = require('../config/database');
const AccesoUsuario = require('./AccesoUsuario');

const normalizeRoleName = (roleName) => (roleName || '').toString().trim().toUpperCase();

const isAdminRoleName = (roleName) => {
    const n = normalizeRoleName(roleName);
    return n === 'ADMIN' || n === 'ADMINISTRADOR' || n === 'SUPERADMIN' || n === 'SUPER_ADMIN';
};

const isBcryptHash = (value) => {
    if (!value) return false;
    const s = String(value);
    return s.startsWith('$2a$') || s.startsWith('$2b$') || s.startsWith('$2y$');
};

class Usuario {
    static async getById(idUsuario) {
        try {
            const [rows] = await db.query('SELECT * FROM USUARIO WHERE ID_USUARIO = ?', [idUsuario]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
    }

    static async getByEmail(email) {
        try {
            const [rows] = await db.query('SELECT * FROM USUARIO WHERE EMAIL_USUARIO = ?', [email]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error al obtener usuario por email: ${error.message}`);
        }
    }

    static async getByUsername(username) {
        try {
            const [rows] = await db.query('SELECT * FROM USUARIO WHERE NOMBRE_USUARIO = ?', [username]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error al obtener usuario por nombre de usuario: ${error.message}`);
        }
    }

    static async getWithAccesosById(idUsuario) {
        const user = await this.getById(idUsuario);
        if (!user) return null;

        const accesos = await AccesoUsuario.getByUserId(idUsuario);
        return { user, accesos };
    }

    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM USUARIO ORDER BY NOMBRE_USUARIO');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    static async getAllWithAccesos() {
        try {
            const [users] = await db.query('SELECT * FROM USUARIO ORDER BY NOMBRE_USUARIO');

            const enriched = [];
            for (const u of users) {
                const accesos = await AccesoUsuario.getByUserId(u.ID_USUARIO);
                enriched.push({ user: u, accesos });
            }

            return enriched;
        } catch (error) {
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    static buildSessionUser(user, accesos) {
        const roles = (accesos || []).map(a => a.NOMBRE_ROL).filter(Boolean);
        const isAdmin = roles.some(isAdminRoleName);
        const isJefe = roles.some(r => r.toUpperCase() === 'JEFE');
        const isUsuario = roles.some(r => r.toUpperCase() === 'USUARIO');

        return {
            id_usuario: user.ID_USUARIO,
            nombre_usuario: user.NOMBRE_USUARIO,
            email_usuario: user.EMAIL_USUARIO,
            activo: Boolean(user.ACTIVO),
            isAdmin,
            isJefe,
            isUsuario,
            role: roles[0] || 'USUARIO', // Rol principal del usuario
            accesos: (accesos || []).map(a => ({
                id_empresa: a.ID_EMPRESA,
                nombre_empresa: a.NOMBRE_EMPRESA,
                id_rol: a.ID_ROL,
                nombre_rol: a.NOMBRE_ROL
            }))
        };
    }

    static async authenticate(email, password) {
        const user = await this.getByEmail(email);
        if (!user) return null;
        if (!user.ACTIVO) return null;

        const dbPassword = user.PASSWORD;
        let ok = false;

        if (isBcryptHash(dbPassword)) {
            ok = await bcrypt.compare(password, dbPassword);
        } else {
            ok = String(password) === String(dbPassword);
            if (ok) {
                const newHash = await bcrypt.hash(password, 10);
                await db.query('UPDATE USUARIO SET PASSWORD = ? WHERE ID_USUARIO = ?', [newHash, user.ID_USUARIO]);
            }
        }

        if (!ok) return null;

        const accesos = await AccesoUsuario.getByUserId(user.ID_USUARIO);
        return this.buildSessionUser(user, accesos);
    }

    /**
     * Autenticación por login genérico (usuario o email)
     */
    static async authenticateByLogin(login, password) {
        // Intentar primero por nombre de usuario
        let user = await this.getByUsername(login);
        if (!user) {
            // Como respaldo, intentar por email
            user = await this.getByEmail(login);
        }
        if (!user) return null;
        if (!user.ACTIVO) return null;

        const dbPassword = user.PASSWORD;
        let ok = false;

        if (isBcryptHash(dbPassword)) {
            ok = await bcrypt.compare(password, dbPassword);
        } else {
            ok = String(password) === String(dbPassword);
            if (ok) {
                const newHash = await bcrypt.hash(password, 10);
                await db.query('UPDATE USUARIO SET PASSWORD = ? WHERE ID_USUARIO = ?', [newHash, user.ID_USUARIO]);
            }
        }

        if (!ok) return null;

        const accesos = await AccesoUsuario.getByUserId(user.ID_USUARIO);
        return this.buildSessionUser(user, accesos);
    }

    static async create({ nombre_usuario, email_usuario, password, activo = true }) {
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            const [result] = await db.query(`
                INSERT INTO USUARIO (NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD, ACTIVO)
                VALUES (?, ?, ?, ?)
            `, [nombre_usuario, email_usuario, passwordHash, activo ? 1 : 0]);

            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
    }

    static async assignEmpresa(idUsuario, idEmpresa, idRol) {
        try {
            await AccesoUsuario.upsert(idUsuario, idEmpresa, idRol);
        } catch (error) {
            throw new Error(`Error al asignar empresa: ${error.message}`);
        }
    }

    static async clearAccesos(idUsuario) {
        try {
            await db.query('DELETE FROM ACCESO_USUARIO WHERE ID_USUARIO = ?', [idUsuario]);
        } catch (error) {
            throw new Error(`Error al limpiar accesos: ${error.message}`);
        }
    }

    static async update(idUsuario, { nombre_usuario, email_usuario, password, activo, id_empresa, id_rol }) {
        try {
            const fields = [];
            const values = [];

            if (typeof nombre_usuario !== 'undefined') {
                fields.push('NOMBRE_USUARIO = ?');
                values.push(nombre_usuario);
            }
            if (typeof email_usuario !== 'undefined') {
                fields.push('EMAIL_USUARIO = ?');
                values.push(email_usuario);
            }
            if (typeof activo !== 'undefined') {
                fields.push('ACTIVO = ?');
                values.push(activo ? 1 : 0);
            }
            if (typeof password !== 'undefined' && String(password).trim() !== '') {
                const passwordHash = await bcrypt.hash(password, 10);
                fields.push('PASSWORD = ?');
                values.push(passwordHash);
            }

            if (fields.length) {
                values.push(idUsuario);
                await db.query(`UPDATE USUARIO SET ${fields.join(', ')} WHERE ID_USUARIO = ?`, values);
            }

            if (id_empresa && id_rol) {
                await AccesoUsuario.deleteByUserId(idUsuario);
                await AccesoUsuario.upsert(idUsuario, id_empresa, id_rol);
            }

            return true;
        } catch (error) {
            throw new Error(`Error al actualizar usuario: ${error.message}`);
        }
    }

    static async delete(idUsuario) {
        try {
            await AccesoUsuario.deleteByUserId(idUsuario);
            const [result] = await db.query('DELETE FROM USUARIO WHERE ID_USUARIO = ?', [idUsuario]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
    }
}

module.exports = Usuario;
