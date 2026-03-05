const ExcelUploadService = require('../services/excelUploadService');
const fs = require('fs');
const path = require('path');

class ExcelUploadController {
    static async uploadEstadoResultados(req, res) {
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
                // Eliminar archivo subido
                fs.unlinkSync(req.file.path);
                
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten archivos Excel (.xlsx, .xls)'
                });
            }
            
            console.log(`📁 Archivo recibido: ${req.file.originalname}`);
            console.log(`🏢 Empresa ID: ${idEmpresa}`);
            
            // Procesar el Excel
            const resultados = await ExcelUploadService.procesarExcelEstadoResultados(
                req.file.path, 
                idEmpresa
            );
            
            // Eliminar archivo temporal
            fs.unlinkSync(req.file.path);
            
            // Retornar resultados
            return res.status(200).json({
                success: true,
                message: 'Archivo procesado exitosamente',
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
            
            // Eliminar archivo si existe
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            return res.status(500).json({
                success: false,
                message: 'Error al procesar el archivo Excel',
                error: error.message
            });
        }
    }
    
    static async getFormatoExcel(req, res) {
        try {
            // Retornar formato esperado para el Excel
            const formato = {
                titulo: 'Formato Excel - Estado de Resultados',
                descripcion: 'Formato transpuesto con conceptos en filas y períodos en columnas',
                estructura: {
                    filas: [
                        'Venta Netas',
                        'Costo de Ventas',
                        'Gasto Administrativo',
                        'Gasto Comercializacion',
                        'Gasto SIG',
                        'Gasto Tributario',
                        'Gasto Financiero',
                        'Otros Ingresos',
                        'Otros Egresos'
                    ],
                    columnas: {
                        formato_periodo: 'ene-26, feb-26, mar-26, etc.',
                        ejemplo: 'ene-26 = Enero 2026'
                    }
                },
                ejemplo: {
                    'EERR': 'Venta Netas',
                    'ene-26': 100000,
                    'feb-26': 110000,
                    'mar-26': 120000
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
