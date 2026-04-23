const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../constants/enums');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  rol: {
    type: String,
    enum: USER_ROLES,
    required: [true, 'El rol de usuario es obligatorio']
  },
  avatar: {
    type: String,
    default: null
  },
  telefono: {
    type: String,
    trim: true
  },
  pais: {
    type: String,
    trim: true
  },
  fechaNacimiento: {
    type: Date
  },
  verificado: {
    type: Boolean,
    default: false
  },
  verificacion: {
    emailVerificado: { type: Boolean, default: false },
    fechaVerificacion: Date,
    tokenVerificacion: String,
    tokenExpiracion: Date,
    tokenRestablecimiento: String,
    tokenRestablecimientoExpiracion: Date
  },
  activo: {
    type: Boolean,
    default: true
  },
  refreshTokens: [{
    token: { type: String, required: true },
    fechaCreacion: { type: Date, default: Date.now },
    activo: { type: Boolean, default: true }
  }],
  ultimoLogin: Date,
  ultimaActividad: Date,
  fechaDesactivacion: Date,
  motivoDesactivacion: String,
  
  // Campos específicos para creadores
  perfilCreador: {
    biografia: String,
    sitioWeb: String,
    redesSociales: {
      twitter: String,
      instagram: String,
      youtube: String,
      tiktok: String,
      whatsapp: {
        numero: String,
        publicacionAutomatica: { type: Boolean, default: false } // false = manual
      }
    },
    categorias: [{
      type: String,
      enum: ['tecnologia', 'moda', 'viajes', 'comida', 'deportes', 'entretenimiento', 'educacion', 'negocios', 'salud', 'otros']
    }],
    tarifasBase: {
      post: { type: Number, default: 0 },
      story: { type: Number, default: 0 },
      mencion: { type: Number, default: 0 },
      video: { type: Number, default: 0 }
    },
    politicasContenido: {
      aceptaAdultos: { type: Boolean, default: false },
      aceptaApuestas: { type: Boolean, default: false },
      aceptaCripto: { type: Boolean, default: true },
      aceptaSupplementos: { type: Boolean, default: true }
    }
  },
  
  // Campos específicos para anunciantes
  perfilAnunciante: {
    nombreEmpresa: String,
    sitioWeb: String,
    descripcionEmpresa: String,
    industria: String,
    presupuestoMensual: Number,
    metodoPagoPreferido: {
      type: String,
      enum: ['stripe', 'paypal', 'crypto', 'transferencia']
    }
  },
  
  // Billetera y finanzas
  billetera: {
    saldo: { type: Number, default: 0 },
    saldoPendiente: { type: Number, default: 0 },
    totalGanado: { type: Number, default: 0 },
    totalGastado: { type: Number, default: 0 }
  },
  
  // Configuración de notificaciones
  configuracionNotificaciones: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    nuevoAnuncio: { type: Boolean, default: true },
    pagoRecibido: { type: Boolean, default: true },
    mensajesDirectos: { type: Boolean, default: true }
  },
  
  // Estadísticas
  estadisticas: {
    anunciosPublicados: { type: Number, default: 0 },
    anunciosCreados: { type: Number, default: 0 },
    calificacionPromedio: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ verificado: 1 });
usuarioSchema.index({ activo: 1 });

// Middleware para hashear password antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para comparar passwords
usuarioSchema.methods.compararPassword = async function(passwordCandidata) {
  return await bcrypt.compare(passwordCandidata, this.password);
};

// Método para generar token de verificación
usuarioSchema.methods.generarTokenVerificacion = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.verificacion = this.verificacion || {};
  this.verificacion.tokenVerificacion = token;
  this.verificacion.tokenExpiracion = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

// Método para generar token de restablecimiento
usuarioSchema.methods.generarTokenRestablecimiento = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.verificacion = this.verificacion || {};
  this.verificacion.tokenRestablecimiento = token;
  this.verificacion.tokenRestablecimientoExpiracion = Date.now() + 10 * 60 * 1000;
  return token;
};

// Virtual para nombre completo
usuarioSchema.virtual('nombreCompleto').get(function() {
  return this.nombre;
});

// Virtual para verificar si es creador
usuarioSchema.virtual('esCreador').get(function() {
  return this.rol === 'creator';
});

// Virtual para verificar si es anunciante
usuarioSchema.virtual('esAnunciante').get(function() {
  return this.rol === 'advertiser';
});

module.exports = mongoose.model('Usuario', usuarioSchema);
