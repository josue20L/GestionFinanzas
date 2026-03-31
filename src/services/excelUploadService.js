const XLSX = require('xlsx');
const { parsePeriodo, mapearConceptoACampo, esConceptoValido, esPeriodoValido } = require('../utils/excelMappers');
const EstadoResultado = require('../models/EstadoResultado');
const BalanceGeneral = require('../models/BalanceGeneral');
const FlujoOperativo = require('../models/FlujoOperativo');
const FlujoCorporativo = require('../models/FlujoCorporativo');

class ExcelUploadService {
    static async procesarExcelEstadoResultados(filePath, idEmpresa) {
        try {
            console.log('📊 Procesando Excel de Estado de Resultados...');
            
            // Leer archivo Excel
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            if (data.length === 0) {
                throw new Error('El archivo Excel está vacío');
            }
            
            console.log(`📋 Se encontraron ${data.length} filas en el Excel`);
            
            // Identificar períodos (columnas que no son conceptos)
            const headers = Object.keys(data[0]);
            const periodos = headers.filter(header => esPeriodoValido(header));
            
            console.log(`📅 Se identificaron ${periodos.length} períodos: ${periodos.join(', ')}`);
            
            const resultados = {
                procesados: 0,
                insertados: 0,
                actualizados: 0,
                errores: [],
                detalles: []
            };
            
            // Procesar cada período
            for (const periodo of periodos) {
                try {
                    const { año, mes } = parsePeriodo(periodo);
                    if (!año || !mes) {
                        resultados.errores.push(`Período inválido: ${periodo}`);
                        continue;
                    }
                    
                    // Crear o buscar período financiero
                    const idPeriodo = await this.crearOBuscarPeriodo(idEmpresa, año, mes);
                    
                    // Extraer datos del período
                    const datos = this.extraerDatosPeriodo(data, periodo, 'ESTADO_RESULTADOS');
                    
                    if (Object.keys(datos).length === 0) {
                        resultados.errores.push(`No se encontraron datos válidos para período: ${periodo}`);
                        continue;
                    }
                    
                    // Guardar en BD
                    const existente = await EstadoResultado.getByIdPeriodo(idPeriodo);
                    const resultado = await EstadoResultado.createOrUpdate(idPeriodo, datos);
                    
                    if (existente) {
                        resultados.actualizados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'actualizado'
                        });
                    } else {
                        resultados.insertados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'insertado'
                        });
                    }
                    
                    resultados.procesados++;
                    
                } catch (error) {
                    console.error(`Error procesando período ${periodo}:`, error);
                    resultados.errores.push(`Error en período ${periodo}: ${error.message}`);
                }
            }
            
            console.log(`✅ Procesamiento completado: ${resultados.procesados} períodos`);
            return resultados;
            
        } catch (error) {
            console.error('Error general procesando Excel:', error);
            throw error;
        }
    }

    static async procesarExcelFlujoCorporativo(filePath, idEmpresa) {
        try {
            console.log('📊 Procesando Excel de Flujo Corporativo...');
            
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            if (data.length === 0) {
                throw new Error('El archivo Excel está vacío');
            }
            
            console.log(`📋 Se encontraron ${data.length} filas en el Excel`);
            
            const headers = Object.keys(data[0]);
            const periodos = headers.filter(header => esPeriodoValido(header));
            
            console.log(`📅 Se identificaron ${periodos.length} períodos: ${periodos.join(', ')}`);
            
            const resultados = {
                procesados: 0,
                insertados: 0,
                actualizados: 0,
                errores: [],
                detalles: []
            };
            
            for (const periodo of periodos) {
                try {
                    const { año, mes } = parsePeriodo(periodo);
                    if (!año || !mes) {
                        resultados.errores.push(`Período inválido: ${periodo}`);
                        continue;
                    }
                    
                    const idPeriodo = await this.crearOBuscarPeriodo(idEmpresa, año, mes);
                    const datos = this.extraerDatosPeriodo(data, periodo, 'FLUJO_CORPORATIVO');
                    
                    if (Object.keys(datos).length === 0) {
                        resultados.errores.push(`No se encontraron datos válidos para período: ${periodo}`);
                        continue;
                    }
                    
                    const existente = await FlujoCorporativo.getByIdPeriodo(idPeriodo);
                    await FlujoCorporativo.createOrUpdate(idPeriodo, datos);
                    
                    if (existente) {
                        resultados.actualizados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'actualizado'
                        });
                    } else {
                        resultados.insertados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'insertado'
                        });
                    }
                    
                    resultados.procesados++;
                    
                } catch (error) {
                    console.error(`Error procesando período ${periodo}:`, error);
                    resultados.errores.push(`Error en período ${periodo}: ${error.message}`);
                }
            }
            
            console.log(`✅ Procesamiento completado: ${resultados.procesados} períodos`);
            return resultados;
            
        } catch (error) {
            console.error('Error general procesando Excel:', error);
            throw error;
        }
    }

    static extraerDatosPeriodo(data, periodo, tipoEstado) {
        const datos = {};
        
        for (const row of data) {
            const concepto = row['BALANCE'] || row['EERR'] || row['FO'] || row['FCORP'] || row['Concepto'] || '';
            
            if (!esConceptoValido(concepto, tipoEstado)) {
                continue; // Saltar filas que no son conceptos válidos
            }
            
            const campo = mapearConceptoACampo(concepto, tipoEstado);
            const valor = parseFloat(row[periodo]) || 0;
            
            if (campo) {
                datos[campo] = valor;
            }
        }
        
        return datos;
    }

    static async crearOBuscarPeriodo(idEmpresa, año, mes) {
        const db = require('../config/database');
        
        try {
            // Buscar período existente
            const [existente] = await db.query(
                'SELECT ID_PERIODO FROM PERIODOFINANCIERO WHERE ID_EMPRESA = ? AND ANO = ? AND MES = ?',
                [idEmpresa, año, mes]
            );
            
            if (existente[0]) {
                return existente[0].ID_PERIODO;
            }
            
            // Crear nuevo período
            const [resultado] = await db.query(
                'INSERT INTO PERIODOFINANCIERO (ID_EMPRESA, ANO, MES) VALUES (?, ?, ?)',
                [idEmpresa, año, mes]
            );
            
            console.log(`📅 Período creado: Empresa ${idEmpresa}, ${año}-${mes.toString().padStart(2, '0')} (ID: ${resultado.insertId})`);
            return resultado.insertId;
            
        } catch (error) {
            throw new Error(`Error al crear/buscar período: ${error.message}`);
        }
    }

    static async procesarExcelBalanceGeneral(filePath, idEmpresa) {
        try {
            console.log('📊 Procesando Excel de Balance General...');
            
            // Leer archivo Excel
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            if (data.length === 0) {
                throw new Error('El archivo Excel está vacío');
            }
            
            console.log(`📋 Se encontraron ${data.length} filas en el Excel`);
            
            // Identificar períodos (columnas que no son conceptos)
            const headers = Object.keys(data[0]);
            const periodos = headers.filter(header => esPeriodoValido(header));
            
            console.log(`📅 Se identificaron ${periodos.length} períodos: ${periodos.join(', ')}`);
            
            const resultados = {
                procesados: 0,
                insertados: 0,
                actualizados: 0,
                errores: [],
                detalles: []
            };
            
            // Procesar cada período
            for (const periodo of periodos) {
                try {
                    const { año, mes } = parsePeriodo(periodo);
                    if (!año || !mes) {
                        resultados.errores.push(`Período inválido: ${periodo}`);
                        continue;
                    }
                    
                    // Crear o buscar período financiero
                    const idPeriodo = await this.crearOBuscarPeriodo(idEmpresa, año, mes);
                    
                    // Extraer datos del período
                    const datos = this.extraerDatosPeriodo(data, periodo, 'BALANCE_GENERAL');
                    
                    if (Object.keys(datos).length === 0) {
                        resultados.errores.push(`No se encontraron datos válidos para período: ${periodo}`);
                        continue;
                    }
                    
                    // Guardar en BD
                    const existente = await BalanceGeneral.getByIdPeriodo(idPeriodo);
                    const resultado = await BalanceGeneral.createOrUpdate(idPeriodo, datos);
                    
                    if (existente) {
                        resultados.actualizados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'actualizado'
                        });
                    } else {
                        resultados.insertados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'insertado'
                        });
                    }
                    
                    resultados.procesados++;
                    
                } catch (error) {
                    console.error(`Error procesando período ${periodo}:`, error);
                    resultados.errores.push(`Error en período ${periodo}: ${error.message}`);
                }
            }
            
            console.log(`✅ Procesamiento completado: ${resultados.procesados} períodos`);
            return resultados;
            
        } catch (error) {
            console.error('Error general procesando Excel:', error);
            throw error;
        }
    }

    static async procesarExcelFlujoOperativo(filePath, idEmpresa) {
        try {
            console.log('📊 Procesando Excel de Flujo Operativo...');
            
            // Leer archivo Excel
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            if (data.length === 0) {
                throw new Error('El archivo Excel está vacío');
            }
            
            console.log(`📋 Se encontraron ${data.length} filas en el Excel`);
            
            // Identificar períodos (columnas que no son conceptos)
            const headers = Object.keys(data[0]);
            const periodos = headers.filter(header => esPeriodoValido(header));
            
            console.log(`📅 Se identificaron ${periodos.length} períodos: ${periodos.join(', ')}`);
            
            const resultados = {
                procesados: 0,
                insertados: 0,
                actualizados: 0,
                errores: [],
                detalles: []
            };
            
            // Procesar cada período
            for (const periodo of periodos) {
                try {
                    const { año, mes } = parsePeriodo(periodo);
                    if (!año || !mes) {
                        resultados.errores.push(`Período inválido: ${periodo}`);
                        continue;
                    }
                    
                    // Crear o buscar período financiero
                    const idPeriodo = await this.crearOBuscarPeriodo(idEmpresa, año, mes);
                    
                    // Extraer datos del período
                    const datos = this.extraerDatosPeriodo(data, periodo, 'FLUJO_OPERATIVO');
                    
                    if (Object.keys(datos).length === 0) {
                        resultados.errores.push(`No se encontraron datos válidos para período: ${periodo}`);
                        continue;
                    }
                    
                    // Guardar en BD
                    const existente = await FlujoOperativo.getByIdPeriodo(idPeriodo);
                    const resultado = await FlujoOperativo.createOrUpdate(idPeriodo, datos);
                    
                    if (existente) {
                        resultados.actualizados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'actualizado'
                        });
                    } else {
                        resultados.insertados++;
                        resultados.detalles.push({
                            periodo: `${año}-${mes.toString().padStart(2, '0')}`,
                            accion: 'insertado'
                        });
                    }
                    
                    resultados.procesados++;
                    
                } catch (error) {
                    console.error(`Error procesando período ${periodo}:`, error);
                    resultados.errores.push(`Error en período ${periodo}: ${error.message}`);
                }
            }
            
            console.log(`✅ Procesamiento completado: ${resultados.procesados} períodos`);
            return resultados;
            
        } catch (error) {
            console.error('Error general procesando Excel:', error);
            throw error;
        }
    }
}

module.exports = ExcelUploadService;
