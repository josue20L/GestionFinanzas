const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function testDataMaestros() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'gestionfinanzas'
        });

        console.log('🧪 Probando datos maestros...\n');

        // Verificar roles
        const [roles] = await connection.execute('SELECT * FROM ROL ORDER BY ID_ROL');
        console.log('👑 ROLES:');
        roles.forEach(rol => {
            console.log(`   ${rol.ID_ROL}: ${rol.NOMBRE_ROL}`);
        });

        // Verificar monedas
        const [monedas] = await connection.execute('SELECT * FROM MONEDA ORDER BY ID_MONEDA');
        console.log('\n💰 MONEDAS:');
        monedas.forEach(moneda => {
            console.log(`   ${moneda.ID_MONEDA}: ${moneda.NOMBRE_MONEDA} (${moneda.SIMBOLO})`);
        });

        // Verificar grupos
        const [grupos] = await connection.execute('SELECT * FROM GRUPO_EMPRESARIAL ORDER BY ID_GRUPO');
        console.log('\n🏢 GRUPOS EMPRESARIALES:');
        grupos.forEach(grupo => {
            console.log(`   ${grupo.ID_GRUPO}: ${grupo.NOMBRE_GRUPO}`);
        });

        // Verificar usuarios
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM USUARIO');
        console.log(`\n👥 Usuarios totales: ${users[0].count}`);

        if (users[0].count === 0) {
            console.log('\n✅ BD vacía - Los datos maestros se crearían automáticamente con el primer usuario');
            console.log('📝 Datos que se crearían:');
            console.log('   👑 Roles: Administrador, Gerente, Auditor, Contador, Usuario');
            console.log('   💰 Monedas: Boliviano (Bs), Dólar Estadounidense (USD)');
            console.log('   🏢 Grupos: Tecnología, Comercial, Servicios');
        } else {
            console.log('\nℹ️  Ya hay usuarios - Los datos maestros ya deberían existir');
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testDataMaestros();
