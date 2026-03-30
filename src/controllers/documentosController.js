const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mysql = require('mysql2');

const unlinkAsync = promisify(fs.unlink);

// Configuración de la BD
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Subir documentos de una empresa
const subirDocumentos = async (req, res) => {
    try {
        const { idEmpresa } = req.params;
        
        if (!idEmpresa) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de empresa es requerido' 
            });
        }

        // Verificar que se hayan subido archivos
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se subieron archivos' 
            });
        }

        // Crear carpeta de la empresa si no existe
        const empresaFolder = path.join(__dirname, '../../uploads/empresas', `empresa_${idEmpresa}`);
        if (!fs.existsSync(empresaFolder)) {
            fs.mkdirSync(empresaFolder, { recursive: true });
        }

        // Guardar información de los archivos en la BD
        const documentosGuardados = [];
        
        for (const file of req.files) {
            // Mover archivo a la carpeta final
            const finalPath = path.join(empresaFolder, file.originalname);
            
            // Si ya existe un archivo con ese nombre, añadir timestamp
            let rutaFinal = finalPath;
            if (fs.existsSync(finalPath)) {
                const timestamp = Date.now();
                const nameWithoutExt = path.parse(file.originalname).name;
                const ext = path.parse(file.originalname).ext;
                rutaFinal = path.join(empresaFolder, `${nameWithoutExt}_${timestamp}${ext}`);
            }
            
            console.log('Intentando mover archivo de:', file.path, 'a:', rutaFinal);
            fs.renameSync(file.path, rutaFinal);
            console.log('Archivo movido exitosamente');
            console.log('¿Existe archivo después de mover?:', fs.existsSync(rutaFinal));
            
            // Guardar en BD real
            const query = `
                INSERT INTO ARCHIVO_EMPRESA (ID_EMPRESA, TIPO_DOCUMENTO, NOMBRE_ARCHIVO, RUTA_ARCHIVO)
                VALUES (?, ?, ?, ?)
            `;
            
            // Guardar solo ruta relativa (sin la parte del proyecto)
            const rutaRelativa = rutaFinal.replace(/\\/g, '/').replace(/.*?uploads/, '/uploads');
            
            const [result] = await db.promise().execute(query, [
                parseInt(idEmpresa),
                path.parse(file.originalname).name.toUpperCase(),
                file.originalname,
                rutaRelativa
            ]);
            
            // Debug: Ver qué ruta se está guardando
            console.log('Archivo guardado en:', rutaFinal);
            console.log('Ruta en BD:', rutaRelativa);
            console.log('¿Existe archivo?:', fs.existsSync(rutaFinal));
            
            const documentoInfo = {
                id_archivo: result.insertId,
                id_empresa: parseInt(idEmpresa),
                tipo_documento: path.parse(file.originalname).name.toUpperCase(),
                nombre_archivo: file.originalname,
                ruta_archivo: rutaRelativa,
                fecha_subida: new Date()
            };
            
            documentosGuardados.push(documentoInfo);
        }

        return res.status(201).json({
            success: true,
            message: 'Documentos subidos exitosamente',
            data: documentosGuardados
        });

    } catch (error) {
        console.error('Error al subir documentos:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al subir documentos: ' + error.message 
        });
    }
};

// Obtener documentos de una empresa
const obtenerDocumentos = async (req, res) => {
    try {
        const { idEmpresa } = req.params;
        
        if (!idEmpresa) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de empresa es requerido' 
            });
        }

        // Consultar documentos reales de la BD
        // Alias para que los nombres de campos coincidan con lo que espera el frontend (empresas.js)
        const query = `
            SELECT 
                ID_ARCHIVO     AS id_archivo,
                ID_EMPRESA     AS id_empresa,
                TIPO_DOCUMENTO AS tipo_documento,
                NOMBRE_ARCHIVO AS nombre_archivo,
                RUTA_ARCHIVO   AS ruta_archivo,
                FECHA_SUBIDA   AS fecha_subida
            FROM ARCHIVO_EMPRESA 
            WHERE ID_EMPRESA = ?
            ORDER BY FECHA_SUBIDA DESC
        `;
        
        const [documentos] = await db.promise().execute(query, [parseInt(idEmpresa)]);

        return res.status(200).json({
            success: true,
            message: 'Documentos obtenidos exitosamente',
            data: documentos
        });

    } catch (error) {
        console.error('Error al obtener documentos:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al obtener documentos: ' + error.message 
        });
    }
};

// Eliminar un documento
const eliminarDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de documento es requerido' 
            });
        }

        // Obtener información del documento antes de eliminar
        const querySelect = `
            SELECT RUTA_ARCHIVO FROM ARCHIVO_EMPRESA 
            WHERE ID_ARCHIVO = ?
        `;
        
        const [documentos] = await db.promise().execute(querySelect, [parseInt(id)]);
        
        if (documentos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado' 
            });
        }

        const documento = documentos[0];
        
        // Eliminar archivo físico
        const fullPath = path.join(__dirname, '../../', documento.RUTA_ARCHIVO);
        if (fs.existsSync(fullPath)) {
            await unlinkAsync(fullPath);
        }

        // Eliminar de BD
        const queryDelete = `
            DELETE FROM ARCHIVO_EMPRESA 
            WHERE ID_ARCHIVO = ?
        `;
        
        await db.promise().execute(queryDelete, [parseInt(id)]);
        
        return res.status(200).json({
            success: true,
            message: 'Documento eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar documento:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar documento: ' + error.message 
        });
    }
};

// Descargar un documento
const descargarDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de documento es requerido' 
            });
        }

        // Obtener información del documento
        const query = `
            SELECT NOMBRE_ARCHIVO, RUTA_ARCHIVO FROM ARCHIVO_EMPRESA 
            WHERE ID_ARCHIVO = ?
        `;
        
        const [documentos] = await db.promise().execute(query, [parseInt(id)]);
        
        if (documentos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado' 
            });
        }

        const documento = documentos[0];
        const fullPath = path.join(__dirname, '../../', documento.RUTA_ARCHIVO);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Archivo no encontrado' 
            });
        }

        // Enviar archivo para descarga
        res.download(fullPath, documento.NOMBRE_ARCHIVO, (err) => {
            if (err) {
                console.error('Error al descargar archivo:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al descargar archivo' 
                });
            }
        });

    } catch (error) {
        console.error('Error al descargar documento:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al descargar documento: ' + error.message 
        });
    }
};

module.exports = {
    subirDocumentos,
    obtenerDocumentos,
    eliminarDocumento,
    descargarDocumento
};
