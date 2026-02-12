const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function testRolesInitialization() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'gestionfinanzas'
        });

        console.log('🧪 Probando inicialización de roles...\n');

        // Verificar roles existentes
        const [roles] = await connection.execute('SELECT * FROM ROL ORDER BY ID_ROL');
        console.log('📋 Roles actuales:');
        roles.forEach(rol => {
            console.log(`   ${rol.ID_ROL}: ${rol.NOMBRE_ROL}`);
        });

        // Verificar usuarios
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM USUARIO');
        console.log(`\n👥 Usuarios totales: ${users[0].count}`);

        if (users[0].count === 0) {
            console.log('\n✅ BD vacía - Los roles se crearían automáticamente con el primer usuario');
            console.log('📝 Roles que se crearían: Administrador, Gerente, Auditor, Contador, Usuario');
        } else {
            console.log('\nℹ️  Ya hay usuarios - Los roles ya deberían existir');
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testRolesInitialization();
