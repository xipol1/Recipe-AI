const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    required: true
  },
  optional: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const nutritionSchema = new mongoose.Schema({
  calories: { type: Number, min: 0 },
  protein: { type: Number, min: 0 },
  carbs: { type: Number, min: 0 },
  fat: { type: Number, min: 0 },
  fiber: { type: Number, min: 0 },
  sugar: { type: Number, min: 0 }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  image_url: {
    type: String,
    default: null
  },
  video_url: {
    type: String,
    default: null
  },
  ingredients: {
    type: [ingredientSchema],
    required: [true, 'Los ingredientes son requeridos'],
    validate: {
      validator: function(ingredients) {
        return ingredients && ingredients.length > 0;
      },
      message: 'Debe haber al menos un ingrediente'
    }
  },
  instructions: {
    type: [String],
    required: [true, 'Las instrucciones son requeridas'],
    validate: {
      validator: function(instructions) {
        return instructions && instructions.length > 0;
      },
      message: 'Debe haber al menos una instrucción'
    }
  },
  prep_time: {
    type: Number,
    required: [true, 'El tiempo de preparación es requerido'],
    min: [1, 'El tiempo de preparación debe ser al menos 1 minuto']
  },
  cook_time: {
    type: Number,
    required: [true, 'El tiempo de cocción es requerido'],
    min: [0, 'El tiempo de cocción no puede ser negativo']
  },
  servings: {
    type: Number,
    required: [true, 'El número de porciones es requerido'],
    min: [1, 'Debe servir al menos 1 porción']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['desayuno', 'almuerzo', 'cena', 'postre', 'snack', 'bebida'],
    required: [true, 'La categoría es requerida']
  },
  cuisine: {
    type: String,
    enum: ['mexican', 'italian', 'asian', 'mediterranean', 'american', 'indian', 'french', 'spanish', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  nutrition: {
    type: nutritionSchema,
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_ai_generated: {
    type: Boolean,
    default: false
  },
  ai_prompt: {
    type: String,
    default: null
  },
  is_public: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  saves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'El comentario no puede exceder 500 caracteres']
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índices para mejorar las consultas
recipeSchema.index({ created_by: 1, is_public: 1 });
recipeSchema.index({ category: 1, is_public: 1 });
recipeSchema.index({ tags: 1, is_public: 1 });
recipeSchema.index({ 'likes': 1 });

// Virtual para tiempo total
recipeSchema.virtual('total_time').get(function() {
  return this.prep_time + this.cook_time;
});

// Virtual para rating promedio
recipeSchema.virtual('average_rating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual para número de likes
recipeSchema.virtual('likes_count').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual para número de saves
recipeSchema.virtual('saves_count').get(function() {
  return this.saves ? this.saves.length : 0;
});

// Método para verificar si un usuario ha dado like
recipeSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

// Método para verificar si un usuario ha guardado la receta
recipeSchema.methods.isSavedBy = function(userId) {
  return this.saves.includes(userId);
};

// Asegurar que los virtuals se incluyan en JSON
recipeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Recipe', recipeSchema);