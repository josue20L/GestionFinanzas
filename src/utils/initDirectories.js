const fs = require('fs');
const path = require('path');

function ensureDirectories() {
    const dirs = [
        'uploads',
        'uploads/temp',
        'uploads/empresas'
    ];
    
    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, '../../', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`✅ Directorio creado: ${dir}`);
        } else {
            console.log(`ℹ️  Directorio ya existe: ${dir}`);
        }
    });
}

ensureDirectories();
