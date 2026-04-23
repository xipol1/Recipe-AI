const mongoose = require('mongoose');
const { AD_STATES } = require('../constants/enums');

const anuncioSchema = new mongoose.Schema({
  // Información básica
  titulo: {
    type: String,
    required: [true, 'El título del anuncio es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  
  // Relaciones
  anunciante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El anunciante es obligatorio']
  },
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },
  canal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canal',
    required: [true, 'El canal es obligatorio']
  },
  
  // Tipo de anuncio
  tipoAnuncio: {
    type: String,
    enum: ['post', 'story', 'mencion', 'video', 'personalizado'],
    required: [true, 'El tipo de anuncio es obligatorio']
  },
  
  // Contenido del anuncio
  contenido: {
    texto: String,
    hashtags: [String],
    mencionesUsuarios: [String],
    enlaces: [{
      url: String,
      descripcion: String,
      tipo: { type: String, enum: ['website', 'producto', 'landing', 'social', 'otros'] }
    }],
    
    // Archivos multimedia
    multimedia: [{
      tipo: { type: String, enum: ['imagen', 'video', 'audio', 'documento'] },
      url: String,
      nombre: String,
      tamaño: Number, // en bytes
      duracion: Number, // para videos/audio en segundos
      descripcion: String
    }],
    
    // Configuración específica por plataforma
    configuracionPlataforma: {
      telegram: {
        parseMode: { type: String, enum: ['HTML', 'Markdown', 'MarkdownV2'], default: 'HTML' },
        disableWebPagePreview: { type: Boolean, default: false },
        disableNotification: { type: Boolean, default: false },
        pinMessage: { type: Boolean, default: false }
      },
      instagram: {
        ubicacion: String,
        colaboradores: [String],
        filtros: String
      },
      whatsapp: {
        broadcast: { type: Boolean, default: false },
        grupos: [String]
      }
    }
  },
  
  // Programación
  programacion: {
    tipo: { type: String, enum: ['inmediato', 'programado', 'flexible'], default: 'flexible' },
    fechaPublicacion: Date,
    horaPublicacion: String, // formato HH:MM
    zonaHoraria: { type: String, default: 'Europe/Madrid' },
    fechaLimite: Date, // fecha límite para publicación flexible
    
    // Para publicaciones recurrentes
    recurrente: {
      activo: { type: Boolean, default: false },
      frecuencia: { type: String, enum: ['diario', 'semanal', 'mensual'] },
      diasSemana: [{ type: String, enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] }],
      fechaFin: Date,
      vecesRepetir: Number
    }
  },
  
  // Presupuesto y pagos
  presupuesto: {
    monto: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0, 'El monto debe ser positivo']
    },
    moneda: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'BTC', 'ETH']
    },
    
    // Desglose de costos
    desglose: {
      costoBase: Number,
      comisionPlataforma: Number,
      impuestos: Number,
      descuentos: Number,
      costoTotal: Number
    },
    
    // Información de pago
    metodoPago: {
      tipo: { type: String, enum: ['stripe', 'paypal', 'crypto', 'transferencia'] },
      detalles: mongoose.Schema.Types.Mixed
    }
  },
  
  // Tracking y métricas en tiempo real
  tracking: {
    clicsTotales: { type: Number, default: 0 },
    clicsUnicos: { type: Number, default: 0 },
    impresiones: { type: Number, default: 0 },
    conversiones: { type: Number, default: 0 },
    ingresosGenerados: { type: Number, default: 0 },
    ultimaInteraccion: Date,
    historialClics: [{
      fecha: { type: Date, default: Date.now },
      ip: String,
      userAgent: String,
      dispositivo: String,
      os: String,
      navegador: String,
      region: String,
      ciudad: String,
      idioma: String,
      referencia: String,
      esBot: Boolean
    }]
  },
  
  // Estado del anuncio
  estado: {
    type: String,
    enum: AD_STATES,
    default: 'borrador'
  },
  
  // Flujo de aprobación
  aprobacion: {
    requerida: { type: Boolean, default: true },
    fechaSolicitud: Date,
    fechaRespuesta: Date,
    aprobadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    comentarios: String,
    cambiosSolicitados: [{
      campo: String,
      comentario: String,
      resuelto: { type: Boolean, default: false }
    }],
    historialRevisiones: [{
      fecha: { type: Date, default: Date.now },
      accion: { type: String, enum: ['solicitud', 'aprobacion', 'rechazo', 'cambios_solicitados'] },
      comentario: String,
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      }
    }]
  },
  
  // Publicación
  publicacion: {
    fechaPublicacion: Date,
    urlPublicacion: String,
    idPublicacion: String, // ID en la plataforma específica
    
    // Evidencia de publicación
    evidencia: [{
      tipo: { type: String, enum: ['screenshot', 'enlace', 'video'] },
      url: String,
      descripcion: String,
      fechaSubida: { type: Date, default: Date.now }
    }],
    
    // Confirmación
    confirmadoPorCreador: { type: Boolean, default: false },
    confirmadoPorAnunciante: { type: Boolean, default: false },
    fechaConfirmacion: Date
  },
  
  // Métricas y rendimiento
  metricas: {
    // Métricas básicas
    visualizaciones: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comentarios: { type: Number, default: 0 },
    compartidos: { type: Number, default: 0 },
    clics: { type: Number, default: 0 },
    
    // Métricas calculadas
    engagement: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }, // Click Through Rate
    cpm: { type: Number, default: 0 }, // Cost Per Mille
    cpc: { type: Number, default: 0 }, // Cost Per Click
    
    // Métricas por tiempo
    metricasPorHora: [{
      hora: Date,
      visualizaciones: Number,
      interacciones: Number,
      clics: Number
    }],
    
    // Última actualización
    ultimaActualizacion: { type: Date, default: Date.now },
    
    // Fuente de datos
    fuenteDatos: { type: String, enum: ['manual', 'api', 'scraping'], default: 'manual' }
  },
  
  // Audiencia objetivo
  audienciaObjetivo: {
    edades: {
      min: { type: Number, min: 13, max: 100 },
      max: { type: Number, min: 13, max: 100 }
    },
    generos: [{ type: String, enum: ['masculino', 'femenino', 'otros', 'todos'] }],
    ubicaciones: [{
      pais: String,
      region: String,
      ciudad: String
    }],
    intereses: [String],
    idiomas: [String]
  },
  
  // Objetivos de la campaña
  objetivos: {
    principal: {
      type: String,
      enum: ['awareness', 'engagement', 'trafico', 'conversiones', 'ventas', 'leads', 'descargas'],
      required: [true, 'El objetivo principal es obligatorio']
    },
    secundarios: [{
      type: String,
      enum: ['awareness', 'engagement', 'trafico', 'conversiones', 'ventas', 'leads', 'descargas']
    }],
    
    // KPIs específicos
    kpis: {
      visualizacionesObjetivo: Number,
      engagementObjetivo: Number,
      clicsObjetivo: Number,
      conversionesObjetivo: Number
    }
  },
  
  // Configuración de seguimiento
  seguimiento: {
    pixelTracking: {
      activo: { type: Boolean, default: false },
      pixelId: String,
      eventos: [String]
    },
    utmParameters: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String
    },
    
    // Enlaces de seguimiento
    enlacesSeguimiento: [{
      original: String,
      tracked: String,
      clics: { type: Number, default: 0 }
    }]
  },
  
  // Comunicación
  comunicacion: {
    mensajes: [{
      remitente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
      },
      mensaje: {
        type: String,
        required: true
      },
      fecha: {
        type: Date,
        default: Date.now
      },
      leido: {
        type: Boolean,
        default: false
      },
      tipo: {
        type: String,
        enum: ['mensaje', 'revision', 'aprobacion', 'rechazo', 'consulta'],
        default: 'mensaje'
      }
    }],
    
    ultimoMensaje: Date,
    mensajesNoLeidos: { type: Number, default: 0 }
  },
  
  // Configuración de notificaciones
  notificaciones: {
    anunciante: {
      cambiosEstado: { type: Boolean, default: true },
      mensajesCreador: { type: Boolean, default: true },
      metricas: { type: Boolean, default: false }
    },
    creador: {
      nuevasSolicitudes: { type: Boolean, default: true },
      recordatoriosPublicacion: { type: Boolean, default: true },
      mensajesAnunciante: { type: Boolean, default: true }
    }
  },
  
  // Metadatos
  tags: [String],
  categoria: String,
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  
  // Información de facturación
  facturacion: {
    facturaGenerada: { type: Boolean, default: false },
    numeroFactura: String,
    fechaFactura: Date,
    estadoPago: {
      type: String,
      enum: ['pendiente', 'procesando', 'completado', 'fallido', 'reembolsado'],
      default: 'pendiente'
    },
    transaccionId: String,
    fechaPago: Date
  },
  
  // Historial de cambios
  historial: [{
    fecha: { type: Date, default: Date.now },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    accion: String,
    detalles: mongoose.Schema.Types.Mixed,
    estadoAnterior: String,
    estadoNuevo: String
  }],
  
  // Control de versiones
  version: { type: Number, default: 1 },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
anuncioSchema.index({ anunciante: 1 });
anuncioSchema.index({ canal: 1 });
anuncioSchema.index({ estado: 1 });
anuncioSchema.index({ 'programacion.fechaPublicacion': 1 });
anuncioSchema.index({ 'objetivos.principal': 1 });
anuncioSchema.index({ categoria: 1 });
anuncioSchema.index({ prioridad: 1 });
anuncioSchema.index({ activo: 1 });
anuncioSchema.index({ createdAt: -1 });

// Índice compuesto para búsquedas
anuncioSchema.index({ 
  anunciante: 1, 
  estado: 1, 
  createdAt: -1 
});

anuncioSchema.index({ 
  canal: 1, 
  estado: 1, 
  'programacion.fechaPublicacion': 1 
});

// Virtual para verificar si está vencido
anuncioSchema.virtual('vencido').get(function() {
  if (this.programacion.fechaLimite) {
    return new Date() > this.programacion.fechaLimite;
  }
  return false;
});

// Virtual para calcular días restantes
anuncioSchema.virtual('diasRestantes').get(function() {
  if (this.programacion.fechaLimite) {
    const diff = this.programacion.fechaLimite - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual para verificar si está listo para publicar
anuncioSchema.virtual('listoParaPublicar').get(function() {
  return this.estado === 'aprobado' && 
         this.presupuesto.desglose.costoTotal > 0 &&
         this.facturacion.estadoPago === 'completado';
});

// Middleware pre-save
anuncioSchema.pre('save', function(next) {
  // Calcular costo total
  if (this.presupuesto.desglose) {
    const { costoBase, comisionPlataforma, impuestos, descuentos } = this.presupuesto.desglose;
    this.presupuesto.desglose.costoTotal = 
      (costoBase || 0) + (comisionPlataforma || 0) + (impuestos || 0) - (descuentos || 0);
  }
  
  // Actualizar métricas calculadas
  if (this.metricas.visualizaciones > 0) {
    this.metricas.engagement = 
      ((this.metricas.likes + this.metricas.comentarios + this.metricas.compartidos) / 
       this.metricas.visualizaciones) * 100;
    
    if (this.metricas.clics > 0) {
      this.metricas.ctr = (this.metricas.clics / this.metricas.visualizaciones) * 100;
      this.metricas.cpc = this.presupuesto.monto / this.metricas.clics;
    }
    
    this.metricas.cpm = (this.presupuesto.monto / this.metricas.visualizaciones) * 1000;
  }
  
  next();
});

// Método para cambiar estado
anuncioSchema.methods.cambiarEstado = function(nuevoEstado, usuario, comentario) {
  const estadoAnterior = this.estado;
  this.estado = nuevoEstado;
  
  // Agregar al historial
  this.historial.push({
    usuario: usuario,
    accion: `Cambio de estado: ${estadoAnterior} -> ${nuevoEstado}`,
    detalles: { comentario },
    estadoAnterior,
    estadoNuevo: nuevoEstado
  });
  
  return this.save();
};

// Método para agregar mensaje
anuncioSchema.methods.agregarMensaje = function(remitente, mensaje, tipo = 'mensaje') {
  this.comunicacion.mensajes.push({
    remitente,
    mensaje,
    tipo
  });
  
  this.comunicacion.ultimoMensaje = new Date();
  this.comunicacion.mensajesNoLeidos += 1;
  
  return this.save();
};

// Método para actualizar métricas
anuncioSchema.methods.actualizarMetricas = function(nuevasMetricas) {
  this.metricas = { ...this.metricas, ...nuevasMetricas };
  this.metricas.ultimaActualizacion = new Date();
  return this.save();
};

module.exports = mongoose.model('Anuncio', anuncioSchema);
