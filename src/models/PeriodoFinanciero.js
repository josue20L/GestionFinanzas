const db = require('../config/database');

class PeriodoFinanciero {
    // Obtener períodos de una empresa
    static async getByEmpresa(idEmpresa) {
        try {
            const [rows] = await db.query(`
                SELECT p.*, e.NOMBRE_EMPRESA
                FROM PERIODOFINANCIERO p
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE p.ID_EMPRESA = ?
                ORDER BY p.ANO DESC, p.MES DESC
            `, [idEmpresa]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener períodos: ${error.message}`);
        }
    }

    // Obtener período específico
    static async getById(id) {
        try {
            const [rows] = await db.query(`
                SELECT p.*, e.NOMBRE_EMPRESA
                FROM PERIODOFINANCIERO p
                INNER JOIN EMPRESA e ON p.ID_EMPRESA = e.ID_EMPRESA
                WHERE p.ID_PERIODO = ?
            `, [id]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener período: ${error.message}`);
        }
    }

    // Obtener período por empresa, año y mes
    static async getByEmpresaAnioMes(idEmpresa, anio, mes) {
        try {
            const [rows] = await db.query(`
                SELECT * FROM PERIODOFINANCIERO 
                WHERE ID_EMPRESA = ? AND ANO = ? AND MES = ?
            `, [idEmpresa, anio, mes]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener período: ${error.message}`);
        }
    }

    // Crear nuevo período
    static async create(periodo) {
        try {
            const [result] = await db.query(`
                INSERT INTO PERIODOFINANCIERO (ID_EMPRESA, ANO, MES, CERRADO)
                VALUES (?, ?, ?, ?)
            `, [
                periodo.id_empresa,
                periodo.anio,
                periodo.mes,
                periodo.cerrado || false
            ]);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear período: ${error.message}`);
        }
    }

    // Crear o obtener período (si no existe, lo crea)
    static async createIfNotExists(idEmpresa, anio, mes) {
        try {
            // Verificar si ya existe
            const existente = await this.getByEmpresaAnioMes(idEmpresa, anio, mes);
            if (existente) {
                return existente.ID_PERIODO;
            }

            // Crear nuevo
            return await this.create({
                id_empresa: idEmpresa,
                anio: anio,
                mes: mes,
                cerrado: false
            });
        } catch (error) {
            throw new Error(`Error al crear/obtener período: ${error.message}`);
        }
    }

    // Actualizar período
    static async update(id, periodo) {
        try {
            const [result] = await db.query(`
                UPDATE PERIODOFINANCIERO 
                SET ANO = ?, MES = ?, CERRADO = ?
                WHERE ID_PERIODO = ?
            `, [
                periodo.anio,
                periodo.mes,
                periodo.cerrado || false,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar período: ${error.message}`);
        }
    }

    // Cerrar período
    static async cerrar(id) {
        try {
            const [result] = await db.query(`
                UPDATE PERIODOFINANCIERO 
                SET CERRADO = TRUE 
                WHERE ID_PERIODO = ?
            `, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al cerrar período: ${error.message}`);
        }
    }

    // Abrir período
    static async abrir(id) {
        try {
            const [result] = await db.query(`
                UPDATE PERIODOFINANCIERO 
                SET CERRADO = FALSE 
                WHERE ID_PERIODO = ?
            `, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al abrir período: ${error.message}`);
        }
    }

    // Eliminar período
    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM PERIODOFINANCIERO WHERE ID_PERIODO = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar período: ${error.message}`);
        }
    }

    // Obtener períodos con datos financieros
    static async getConDatosFinancieros(idEmpresa) {
        try {
            const [rows] = await db.query(`
                SELECT DISTINCT p.*, 
                       CASE WHEN er.ID_ER IS NOT NULL THEN 'ER' END as tiene_er,
                       CASE WHEN bg.ID_BG IS NOT NULL THEN 'BG' END as tiene_bg,
                       CASE WHEN fo.ID_FO IS NOT NULL THEN 'FO' END as tiene_fo,
                       CASE WHEN fc.ID_FC IS NOT NULL THEN 'FC' END as tiene_fc
                FROM PERIODOFINANCIERO p
                LEFT JOIN ESTADORESULTADO er ON p.ID_PERIODO = er.ID_PERIODO
                LEFT JOIN BALANCEGENERAL bg ON p.ID_PERIODO = bg.ID_PERIODO
                LEFT JOIN FLUJOOPERATIVO fo ON p.ID_PERIODO = fo.ID_PERIODO
                LEFT JOIN FLUJOCORPORATIVO fc ON p.ID_PERIODO = fc.ID_PERIODO
                WHERE p.ID_EMPRESA = ?
                ORDER BY p.ANO DESC, p.MES DESC
            `, [idEmpresa]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener períodos con datos: ${error.message}`);
        }
    }
}

module.exports = PeriodoFinanciero;
