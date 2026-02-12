const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentosController');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/temp');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

// Rutas para documentos de empresas

// Subir documentos a una empresa
router.post('/empresas/:idEmpresa/documentos', 
    upload.array('documentos', 10), // Máximo 10 archivos
    documentosController.subirDocumentos
);

// Obtener documentos de una empresa
router.get('/empresas/:idEmpresa/documentos', 
    documentosController.obtenerDocumentos
);

// Eliminar un documento específico
router.delete('/documentos/:id', 
    documentosController.eliminarDocumento
);

// Descargar un documento específico
router.get('/documentos/:id/descargar', 
    documentosController.descargarDocumento
);

module.exports = router;
