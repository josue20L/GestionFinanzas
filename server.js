// server.js
require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2');
const expressLayouts = require('express-ejs-layouts');
const { requireAuth } = require('./src/middleware/auth');

const app = express();

// Configuración de express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos (public/)
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sesiones (para autenticación)
app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secreto_que_debes_cambiar',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Cambia a true en producción con HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// Middleware para pasar usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ====================
// CONEXIÓN A MYSQL
// ====================
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión al iniciar
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a MySQL');
  connection.release();
});

// ====================
// RUTAS PRINCIPALES
// ====================

// Página principal (dashboard o index)
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  // Redirigir al dashboard real
  return res.redirect('/dashboard');
});

// Ruta de ejemplo protegida (dashboard)
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard',
    user: req.session.user 
  });
});

// Ruta de ejemplo para empresas
app.get('/empresas', requireAuth, (req, res) => {
  res.render('empresas/empresa', { 
    title: 'Empresas',
    user: req.session.user 
  });
});

// Ruta para gestión de monedas
app.get('/monedas', requireAuth, (req, res) => {
  res.render('monedas/index', { 
    title: 'Gestión de Monedas',
    user: req.session.user 
  });
});

// Ruta de Consolidación
app.get('/consolidacion', (req, res) => {
  res.render('consolidacion/consolidacion', { 
    title: 'Consolidación',
    user: { 
      nombre_usuario: 'Demo', 
      email_usuario: 'demo@demo.com',
      isAdmin: true 
    }
  });
});

// Ruta de Reportes
app.get('/reportes', requireAuth, (req, res) => {
  res.render('estados-financieros/reportes', { 
    title: 'Reportes',
    user: req.session.user
  });
});

// Ruta de Carga Mensual
app.get('/carga-mensual', (req, res) => {
  res.render('estados-financieros/carga-mensual', { 
    title: 'Carga Mensual',
    user: { 
      nombre_usuario: 'Demo', 
      email_usuario: 'demo@demo.com',
      isAdmin: true 
    }
  });
});

// Rutas API
const empresasRoutes = require('./src/routes/empresas');
const periodosRoutes = require('./src/routes/periodos');
const estadoResultadosRoutes = require('./src/routes/estadoResultados');
const balanceGeneralRoutes = require('./src/routes/balanceGeneral');
const flujoOperativoRoutes = require('./src/routes/flujoOperativo');
const flujoCorporativoRoutes = require('./src/routes/flujoCorporativo');
const consolidacionRoutes = require('./src/routes/consolidacion');
const reportesRoutes = require('./src/routes/reportes');
const empresasViewsRoutes = require('./src/routes/empresasViews');
const monedasRoutes = require('./src/routes/monedas');
const authRoutes = require('./src/routes/auth');
const usuariosRoutes = require('./src/routes/usuarios');

app.use('/api', empresasRoutes);
app.use('/api/monedas', monedasRoutes);
app.use('/api', periodosRoutes);
app.use('/api', estadoResultadosRoutes);
app.use('/api', balanceGeneralRoutes);
app.use('/api', flujoOperativoRoutes);
app.use('/api', flujoCorporativoRoutes);
app.use('/api', consolidacionRoutes);
app.use('/api', requireAuth, reportesRoutes);
app.use('/empresas', empresasViewsRoutes);

// Auth + Usuarios (solo admin)
app.use('/', authRoutes);
app.use('/usuarios', usuariosRoutes);

// ====================
// MANEJO DE ERRORES
// ====================
app.use((req, res, next) => {
  res.status(404).render('error', { 
    title: 'Página no encontrada',
    message: 'Lo sentimos, la página que buscas no existe.'
  });
});

app.use((err, req, res, next) => {
  console.error('Error interno:', err.stack);
  res.status(500).render('error', { 
    title: 'Error del servidor',
    message: 'Ocurrió un problema inesperado.'
  });
});

// ====================
// INICIAR SERVIDOR
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});