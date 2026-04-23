require('dotenv').config();

/**
 * Configuración centralizada de la aplicación
 */
const config = {
  // ==========================================
  // CONFIGURACIÓN DEL SERVIDOR
  // ==========================================
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    timeout: parseInt(process.env.SERVER_TIMEOUT) || 30000,
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
  },

  app: {
    nombre: process.env.APP_NAME || 'AdFlow'
  },

  // ==========================================
  // CONFIGURACIÓN DE BASE DE DATOS
  // ==========================================
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma_publicidad',
    options: {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
      retryWrites: true,
      w: 'majority'
    }
  },

  // ==========================================
  // CONFIGURACIÓN DE REDIS
  // ==========================================
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'plataforma:',
    ttl: parseInt(process.env.REDIS_TTL) || 3600
  },

  // ==========================================
  // CONFIGURACIÓN DE JWT
  // ==========================================
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'plataforma-publicidad',
    audience: process.env.JWT_AUDIENCE || 'plataforma-users'
  },

  // ==========================================
  // CONFIGURACIÓN DE PAGOS
  // ==========================================
  payments: {
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      currency: process.env.STRIPE_CURRENCY || 'usd'
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      mode: process.env.PAYPAL_MODE || 'sandbox'
    },
    commissions: {
      platform: parseFloat(process.env.PLATFORM_COMMISSION) || 0.10,
      creator: parseFloat(process.env.CREATOR_COMMISSION) || 0.85,
      processing: parseFloat(process.env.PROCESSING_FEE) || 0.05
    }
  },

  // ==========================================
  // CONFIGURACIÓN DE EMAIL
  // ==========================================
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    },
    support: process.env.EMAIL_SUPPORT || process.env.EMAIL_USER || '',
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Plataforma de Publicidad',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@plataforma.com'
    }
  },

  // ==========================================
  // CONFIGURACIÓN DE ARCHIVOS
  // ==========================================
  files: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
      documents: ['application/pdf', 'application/msword']
    }
  },

  // ==========================================
  // CONFIGURACIÓN DE RATE LIMITING
  // ==========================================
  rateLimiting: {
    general: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
      message: 'Demasiadas solicitudes desde esta IP'
    },
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10,
      message: 'Demasiados intentos de autenticación'
    },
    api: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Límite de API excedido'
    }
  },

  // ==========================================
  // CONFIGURACIÓN DE APIS EXTERNAS
  // ==========================================
  apis: {
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY || '',
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || ''
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || ''
    },
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || ''
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || ''
    }
  },

  // ==========================================
  // CONFIGURACIÓN DE FRONTEND
  // ==========================================
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    resetPasswordUrl: process.env.RESET_PASSWORD_URL || 'http://localhost:3000/reset-password',
    verifyEmailUrl: process.env.VERIFY_EMAIL_URL || 'http://localhost:3000/verify-email'
  },

  // ==========================================
  // CONFIGURACIÓN DE SEGURIDAD
  // ==========================================
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY
  },

  auth: {
    enableDemoUsers: process.env.NODE_ENV === 'production'
      ? false
      : process.env.ENABLE_DEMO_USERS === 'true',
    demoUserEmail: process.env.DEMO_USER_EMAIL || 'demo@adflow.com',
    demoUserPassword: process.env.DEMO_USER_PASSWORD || '123456',
    demoCreatorEmail: process.env.DEMO_CREATOR_EMAIL || 'creator@adflow.com',
    demoCreatorPassword: process.env.DEMO_CREATOR_PASSWORD || '123456'
  }
};

/**
 * Validar configuración requerida
 */
function validarConfiguracion() {
  const requeridos = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY'
  ];

  const faltantes = requeridos.filter(key => !process.env[key]);
  
  if (faltantes.length > 0) {
    console.error('❌ Variables de entorno requeridas faltantes:');
    faltantes.forEach(key => console.error(`   • ${key}`));
    process.exit(1);
  }

  console.log('✅ Configuración validada correctamente');
}

// Validar configuración al cargar el módulo
if (process.env.NODE_ENV !== 'test') {
  validarConfiguracion();
}

module.exports = config;
