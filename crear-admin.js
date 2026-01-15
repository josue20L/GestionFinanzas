const db = require('./src/config/database');

async function crearAdminDefecto() {
    try {
        // 1. Verificar si ya existe rol ADMIN
        const [rolRows] = await db.query('SELECT ID_ROL FROM ROL WHERE NOMBRE_ROL = ?', ['ADMIN']);
        
        if (rolRows.length === 0) {
            // 2. Crear rol ADMIN
            const [rolResult] = await db.query('INSERT INTO ROL (NOMBRE_ROL) VALUES (?)', ['ADMIN']);
            console.log('✅ Rol ADMIN creado:', rolResult.insertId);
        }

        // 3. Crear usuario admin
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('admin123', 10);
        const [userResult] = await db.query(\`
            INSERT INTO USUARIO (NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD, ACTIVO)
            VALUES (?, ?, ?, ?)
        \`, ['Admin', 'admin@demo.com', passwordHash, 1]);

        console.log('✅ Usuario Admin creado:', userResult.insertId);

        // 4. Asignar acceso a una empresa (si existe)
        const [empresas] = await db.query('SELECT ID_EMPRESA FROM EMPRESA LIMIT 1');
        if (empresas.length > 0) {
            await db.query(\`
                INSERT INTO ACCESO_USUARIO (ID_USUARIO, ID_EMPRESA, ID_ROL)
                VALUES (?, ?, ?)
            \`, [userResult.insertId, empresas[0].ID_EMPRESA, rolRows[0].ID_ROL]);
            console.log('✅ Acceso asignado a empresa:', empresas[0].NOMBRE_EMPRESA);
        }

        console.log('🎉 Administrador por defecto creado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

crearAdminDefecto();
