const ExcelUploadService = require('../services/excelUploadService');
const fs = require('fs');
const path = require('path');

class ExcelUploadController {
    static async uploadFlujoCorporativo(req, res) {
        try {
            const { idEmpresa } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se subió ningún archivo'
                });
            }
            
            const allowedExtensions = ['.xlsx', '.xls'];
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            
            if (!allowedExtensions.includes(fileExtension)) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten archivos Excel (.xlsx, .xls)'
                });
            }
            
            if (req.file.size > 20 * 1024 * 1024) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'El archivo es demasiado grande. Máximo 20MB.'
                });
            }
            
            const resultados = await ExcelUploadService.procesarExcelFlujoCorporativo(
                req.file.path, 
                idEmpresa
            );
            
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            
            return res.status(200).json({
                success: true,
                message: 'Archivo de Flujo Corporativo procesado exitosamente',
                data: {
                    resumen: {
                        periodos_procesados: resultados.procesados,
                        registros_insertados: resultados.insertados,
                        registros_actualizados: resultados.actualizados,
                        errores_count: resultados.errores.length
                    },
                    detalles: resultados.detalles,
                    errores: resultados.errores
                }
            });
            
        } catch (error) {
            console.error('Error en uploadFlujoCorporativo:', error);
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar el archivo Excel de Flujo Corporativo',
                error: error.message
            });
        }
    }

    static async uploadFlujoOperativo(req, res) {
        try {
            const { idEmpresa } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se subió ningún archivo'
                });
            }
            
            // Validar que sea un archivo Excel
            const allowedExtensions = ['.xlsx', '.xls'];
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            
            if (!allowedExtensions.includes(fileExtension)) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten archivos Excel (.xlsx, .xls)'
                });
            }
            
            // Validar tamaño (20MB máximo)
            if (req.file.size > 20 * 1024 * 1024) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'El archivo es demasiado grande. Máximo 20MB.'
                });
            }
            
            const resultados = await ExcelUploadService.procesarExcelFlujoOperativo(
                req.file.path, 
                idEmpresa
            );
            
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            
            return res.status(200).json({
                success: true,
                message: 'Archivo de Flujo Operativo procesado exitosamente',
                data: {
                    resumen: {
                        periodos_procesados: resultados.procesados,
                        registros_insertados: resultados.insertados,
                        registros_actualizados: resultados.actualizados,
                        errores_count: resultados.errores.length
                    },
                    detalles: resultados.detalles,
                    errores: resultados.errores
                }
            });
            
        } catch (error) {
            console.error('Error en uploadFlujoOperativo:', error);
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar el archivo Excel de Flujo Operativo',
                error: error.message
            });
        }
    }

    static async uploadBalanceGeneral(req, res) {
        try {
            const { idEmpresa } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se subió ningún archivo'
                });
            }
            
            const allowedExtensions = ['.xlsx', '.xls'];
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            
            if (!allowedExtensions.includes(fileExtension)) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten archivos Excel (.xlsx, .xls)'
                });
            }
            
            if (req.file.size > 20 * 1024 * 1024) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'El archivo es demasiado grande. Máximo 20MB.'
                });
            }
            
            const resultados = await ExcelUploadService.procesarExcelBalanceGeneral(
                req.file.path, 
                idEmpresa
            );
            
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            
            return res.status(200).json({
                success: true,
                message: 'Archivo de Balance General procesado exitosamente',
                data: {
                    resumen: {
                        periodos_procesados: resultados.procesados,
                        registros_insertados: resultados.insertados,
                        registros_actualizados: resultados.actualizados,
                        errores_count: resultados.errores.length
                    },
                    detalles: resultados.detalles,
                    errores: resultados.errores
                }
            });
            
        } catch (error) {
            console.error('Error en uploadBalanceGeneral:', error);
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar el archivo Excel de Balance General',
                error: error.message
            });
        }
    }

    static async uploadEstadoResultados(req, res) {
        try {
            const { idEmpresa } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se subió ningún archivo'
                });
            }
            
            const allowedExtensions = ['.xlsx', '.xls'];
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            
            if (!allowedExtensions.includes(fileExtension)) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten archivos Excel (.xlsx, .xls)'
                });
            }
            
            const resultados = await ExcelUploadService.procesarExcelEstadoResultados(
                req.file.path, 
                idEmpresa
            );
            
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            
            return res.status(200).json({
                success: true,
                message: 'Archivo de Estado de Resultados procesado exitosamente',
                data: {
                    resumen: {
                        periodos_procesados: resultados.procesados,
                        registros_insertados: resultados.insertados,
                        registros_actualizados: resultados.actualizados,
                        errores_count: resultados.errores.length
                    },
                    detalles: resultados.detalles,
                    errores: resultados.errores
                }
            });
            
        } catch (error) {
            console.error('Error en uploadEstadoResultados:', error);
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar el archivo Excel de Estado de Resultados',
                error: error.message
            });
        }
    }

    static async getFormatoExcel(req, res) {
        try {
            const formato = {
                titulo: 'Formato Excel - Carga Masiva',
                descripcion: 'Formato transpuesto con conceptos en filas y períodos en columnas',
                estructura: {
                    columnas: {
                        formato_periodo: 'ene-26, feb-26, mar-26, etc.',
                        ejemplo: 'ene-26 = Enero 2026'
                    }
                }
            };
            return res.status(200).json({
                success: true,
                data: formato
            });
        } catch (error) {
            console.error('Error en getFormatoExcel:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener formato Excel',
                error: error.message
            });
        }
    }
}

module.exports = ExcelUploadController;
