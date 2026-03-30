const db = require('./src/config/database');

async function inicializarRoles() {
    try {
        console.log('🔄 Verificando y creando roles básicos...\n');

        const rolesBasicos = [
            { nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
            { nombre: 'Administrador', descripcion: 'Administrador de empresa' },
            { nombre: 'Contador', descripcion: 'Contador general' },
            { nombre: 'Gerente', descripcion: 'Gerente' },
            { nombre: 'Auditor', descripcion: 'Auditor' },
            { nombre: 'Usuario', descripcion: 'Usuario estándar' }
        ];

        for (const rol of rolesBasicos) {
            // Verificar si el rol ya existe
            const [existing] = await db.query('SELECT ID_ROL FROM ROL WHERE NOMBRE_ROL = ?', [rol.nombre]);

            if (existing.length === 0) {
                // Crear el rol si no existe
                const [result] = await db.query('INSERT INTO ROL (NOMBRE_ROL) VALUES (?)', [rol.nombre]);
                console.log(`✅ Rol creado: ${rol.nombre} (ID: ${result.insertId})`);
            } else {
                console.log(`ℹ️  Rol ya existe: ${rol.nombre} (ID: ${existing[0].ID_ROL})`);
            }
        }

        console.log('\n🎉 Inicialización de roles completada');

        // Mostrar resumen
        const [allRoles] = await db.query('SELECT * FROM ROL ORDER BY ID_ROL');
        console.log('\n📋 Roles disponibles:');
        allRoles.forEach(rol => {
            console.log(`   ${rol.ID_ROL}: ${rol.NOMBRE_ROL}`);
        });

    } catch (error) {
        console.error('❌ Error al inicializar roles:', error);
    } finally {
        process.exit(0);
    }
}

inicializarRoles();
