const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const config = require('./config/config');

// Importar rutas
const authRoutes = require('./routes/auth');
const canalRoutes = require('./routes/canales');
const anuncioRoutes = require('./routes/anuncios');
const transaccionRoutes = require('./routes/transacciones');
const notificationRoutes = require('./routes/notifications');
const fileRoutes = require('./routes/files');
const estadisticaRoutes = require('./routes/estadisticas');
const campaignRoutes = require('./routes/campaigns');
const listRoutes = require('./routes/lists');
const channelsRoutes = require('./routes/channels');
const integrationRoutes = require('./modules/integrations/routes.integrations');
const setupSwagger = require('./modules/integrations/swagger');

// Crear aplicación Express
const app = express();

// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuración
const corsOrigins = (process.env.CORS_ORIGINS || config.frontend.url || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (config.server.environment === 'development' && corsOrigins.length === 0) {
      return callback(null, true);
    }
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.server.environment === 'development' ? 5000 : 1000, // límite de requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// Sanitización de datos
app.use(mongoSanitize()); // Prevenir inyección NoSQL
app.use(xss()); // Limpiar input del usuario de HTML malicioso
app.use(hpp()); // Prevenir HTTP Parameter Pollution

// ==========================================
// MIDDLEWARE DE APLICACIÓN
// ==========================================

// Compresión de respuestas
app.use(compression());

// Logging
if (config.server.environment === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parseo de JSON y URL encoded
app.use(express.json({ 
  limit: config.server.maxRequestSize,
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: config.server.maxRequestSize }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ==========================================
// RUTAS DE SALUD Y INFORMACIÓN
// ==========================================

// Ruta de salud
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.server.environment,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.status(200).json(healthCheck);
});

// Ruta de salud API
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Ruta de información de la API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API de Plataforma de Publicidad para Creadores de Contenido',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      canales: '/api/canales',
      anuncios: '/api/anuncios',
      transacciones: '/api/transacciones',
      estadisticas: '/api/estadisticas',
      campaigns: '/api/campaigns',
      lists: '/api/lists'
    },
    documentation: '/api/docs'
  });
});

// ==========================================
// RUTAS DE LA API
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/canales', canalRoutes);
app.use('/api/anuncios', anuncioRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/estadisticas', estadisticaRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/channels', channelsRoutes);

// Rutas directas para integración externa
app.use('/auth', authRoutes);
app.use('/channels', channelsRoutes);
app.use('/campaigns', campaignRoutes);

// Rutas de Integración Externa
app.use('/api/v1/integrations', integrationRoutes);

// Configurar Swagger UI para la API de Integraciones
setupSwagger(app);

// Servir frontend en producción + SPA fallback
if (config.server.environment === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  // Fallback para SPA (siempre servir index.html para rutas no-API)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') || req.path.startsWith('/channels/') || req.path.startsWith('/campaigns/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 JSON para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.path} no encontrada`,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  
  // Error de JSON malformado
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON malformado en el cuerpo de la solicitud'
    });
  }
  
  // Error de payload muy grande
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'El archivo o datos enviados son demasiado grandes'
    });
  }
  
  // Error de validación de Mongoose
  if (error.name === 'ValidationError') {
    const errores = Object.values(error.errors).map(err => ({
      campo: err.path,
      mensaje: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errores
    });
  }
  
  // Error de cast de Mongoose
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido proporcionado'
    });
  }
  
  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error genérico
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(config.server.environment === 'development' && { stack: error.stack })
  });
});

if (require.main === module) {
  const databaseConfig = require('./config/database');

  const PORT = config.server.port;

  const server = app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
  });

  databaseConfig.conectar()
    .then(() => databaseConfig.configurarIndices())
    .catch((error) => {
      console.error('Error al inicializar base de datos:', error?.message || error);
    });

  process.on('SIGTERM', () => {
    server.close(() => {
      databaseConfig.desconectar().finally(() => {
        process.exit(0);
      });
    });
  });
}

module.exports = app;
