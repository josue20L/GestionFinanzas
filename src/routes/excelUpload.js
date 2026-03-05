const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ExcelUploadController = require('../controllers/excelUploadController');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/');
    },
    filename: function (req, file, cb) {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'excel-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Solo permitir archivos Excel
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos Excel'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB máximo
    },
    fileFilter: fileFilter
});

// Rutas para carga de Excel
router.post('/estado-resultados/:idEmpresa', 
    upload.single('excelFile'), 
    ExcelUploadController.uploadEstadoResultados
);

router.post('/balance-general/:idEmpresa', 
    upload.single('excelFile'), 
    ExcelUploadController.uploadBalanceGeneral
);

// Ruta para obtener formato esperado
router.get('/formato/estado-resultados', 
    ExcelUploadController.getFormatoExcel
);

module.exports = router;
