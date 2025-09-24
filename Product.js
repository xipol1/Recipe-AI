const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [0, 'La cantidad no puede ser negativa'],
    default: 1
  },
  unit: {
    type: String,
    required: [true, 'La unidad es requerida'],
    enum: ['kg', 'g', 'l', 'ml', 'piezas', 'latas', 'paquetes'],
    default: 'piezas'
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['frutas', 'verduras', 'carnes', 'pescados', 'lacteos', 'cereales', 'legumbres', 'especias', 'aceites', 'otros'],
    default: 'otros'
  },
  location: {
    type: String,
    enum: ['despensa', 'nevera', 'congelador'],
    default: 'despensa'
  },
  expiry_date: {
    type: Date,
    default: null
  },
  purchase_date: {
    type: Date,
    default: Date.now
  },
  price: {
    type: Number,
    min: [0, 'El precio no puede ser negativo'],
    default: null
  },
  store: {
    type: String,
    trim: true,
    maxlength: [50, 'El nombre de la tienda no puede exceder 50 caracteres'],
    default: null
  },
  barcode: {
    type: String,
    trim: true,
    default: null
  },
  image_url: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_consumed: {
    type: Boolean,
    default: false
  },
  consumed_date: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices para mejorar las consultas
productSchema.index({ created_by: 1, category: 1 });
productSchema.index({ created_by: 1, expiry_date: 1 });
productSchema.index({ created_by: 1, is_consumed: 1 });

// Método para verificar si el producto está próximo a vencer
productSchema.methods.isExpiringSoon = function(days = 3) {
  if (!this.expiry_date) return false;
  
  const today = new Date();
  const expiryDate = new Date(this.expiry_date);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= days && diffDays >= 0;
};

// Método para verificar si el producto está vencido
productSchema.methods.isExpired = function() {
  if (!this.expiry_date) return false;
  
  const today = new Date();
  const expiryDate = new Date(this.expiry_date);
  
  return expiryDate < today;
};

// Método virtual para obtener días hasta vencimiento
productSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiry_date) return null;
  
  const today = new Date();
  const expiryDate = new Date(this.expiry_date);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Asegurar que los virtuals se incluyan en JSON
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);