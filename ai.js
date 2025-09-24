const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Recipe = require('../models/Recipe');

const router = express.Router();

// Generar receta basada en ingredientes disponibles
router.post('/generate-recipe', auth, [
  body('ingredients').isArray({ min: 1 }).withMessage('Debe proporcionar al menos un ingrediente'),
  body('preferences').optional().isObject(),
  body('servings').optional().isInt({ min: 1, max: 20 }),
  body('difficulty').optional().isIn(['Fácil', 'Intermedio', 'Difícil']),
  body('cookingTime').optional().isInt({ min: 5, max: 300 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      ingredients, 
      preferences = {}, 
      servings = 4, 
      difficulty = 'Intermedio',
      cookingTime = 30 
    } = req.body;

    // Simular tiempo de generación de IA
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generar receta simulada basada en los ingredientes
    const mockRecipe = {
      title: `Deliciosa receta con ${ingredients.slice(0, 2).join(' y ')}`,
      description: `Una receta perfecta que combina ${ingredients.join(', ')} de manera deliciosa y nutritiva.`,
      ingredients: ingredients.map((ingredient, index) => ({
        name: ingredient,
        amount: Math.floor(Math.random() * 500) + 100,
        unit: ['g', 'ml', 'unidad', 'cucharada', 'taza'][Math.floor(Math.random() * 5)]
      })),
      instructions: [
        'Preparar todos los ingredientes y tenerlos listos.',
        `Comenzar cocinando los ingredientes principales: ${ingredients[0]}.`,
        `Agregar ${ingredients[1] || 'el resto de ingredientes'} y mezclar bien.`,
        'Cocinar a fuego medio durante 15-20 minutos.',
        'Sazonar al gusto y servir caliente.'
      ],
      prepTime: Math.floor(Math.random() * 20) + 10,
      cookingTime: cookingTime,
      servings: servings,
      difficulty: difficulty,
      category: 'Plato Principal',
      cuisine: 'Internacional',
      tags: ['IA Generada', 'Rápida', 'Fácil'],
      nutrition: {
        calories: Math.floor(Math.random() * 400) + 200,
        protein: Math.floor(Math.random() * 30) + 10,
        carbs: Math.floor(Math.random() * 50) + 20,
        fat: Math.floor(Math.random() * 20) + 5,
        fiber: Math.floor(Math.random() * 10) + 2
      },
      isAIGenerated: true,
      creator: req.user.id
    };

    res.json({
      success: true,
      recipe: mockRecipe,
      confidence: 0.92,
      generationTime: 3000
    });

  } catch (error) {
    console.error('Error generando receta:', error);
    res.status(500).json({ 
      error: 'Error generando la receta',
      details: error.message 
    });
  }
});

// Obtener recomendaciones de recetas basadas en la despensa
router.get('/recommendations', auth, async (req, res) => {
  try {
    // Obtener productos del usuario
    const userProducts = await Product.find({ 
      creator: req.user.id,
      isConsumed: false 
    });

    if (userProducts.length === 0) {
      return res.json({
        recommendations: [],
        message: 'Agrega productos a tu despensa para obtener recomendaciones personalizadas'
      });
    }

    // Simular recomendaciones basadas en productos disponibles
    const availableIngredients = userProducts.map(p => p.name);
    
    const mockRecommendations = [
      {
        id: '1',
        title: 'Ensalada Fresca de Temporada',
        description: 'Una ensalada nutritiva con ingredientes de tu despensa',
        matchingIngredients: availableIngredients.slice(0, 3),
        missingIngredients: ['Aceite de oliva', 'Vinagre'],
        difficulty: 'Fácil',
        cookingTime: 15,
        confidence: 0.95,
        imageUrl: '/api/placeholder/recipe1.jpg'
      },
      {
        id: '2',
        title: 'Guiso Casero',
        description: 'Un plato reconfortante perfecto para cualquier ocasión',
        matchingIngredients: availableIngredients.slice(1, 4),
        missingIngredients: ['Caldo de verduras'],
        difficulty: 'Intermedio',
        cookingTime: 45,
        confidence: 0.88,
        imageUrl: '/api/placeholder/recipe2.jpg'
      },
      {
        id: '3',
        title: 'Pasta Rápida',
        description: 'Una pasta deliciosa lista en minutos',
        matchingIngredients: availableIngredients.slice(0, 2),
        missingIngredients: ['Pasta', 'Queso parmesano'],
        difficulty: 'Fácil',
        cookingTime: 20,
        confidence: 0.82,
        imageUrl: '/api/placeholder/recipe3.jpg'
      }
    ];

    res.json({
      recommendations: mockRecommendations,
      totalIngredients: availableIngredients.length,
      pantryUtilization: Math.floor(Math.random() * 30) + 70
    });

  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Analizar valor nutricional de una receta
router.post('/analyze-nutrition', auth, [
  body('ingredients').isArray({ min: 1 }).withMessage('Debe proporcionar ingredientes'),
  body('servings').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ingredients, servings = 1 } = req.body;

    // Simular análisis nutricional
    await new Promise(resolve => setTimeout(resolve, 1500));

    const nutrition = {
      calories: Math.floor(Math.random() * 400) + 200,
      protein: Math.floor(Math.random() * 30) + 10,
      carbs: Math.floor(Math.random() * 50) + 20,
      fat: Math.floor(Math.random() * 20) + 5,
      fiber: Math.floor(Math.random() * 10) + 2,
      sugar: Math.floor(Math.random() * 15) + 3,
      sodium: Math.floor(Math.random() * 800) + 200,
      vitamins: {
        vitaminA: Math.floor(Math.random() * 100),
        vitaminC: Math.floor(Math.random() * 100),
        calcium: Math.floor(Math.random() * 100),
        iron: Math.floor(Math.random() * 100)
      }
    };

    // Calcular por porción
    const perServing = {};
    Object.keys(nutrition).forEach(key => {
      if (key === 'vitamins') {
        perServing[key] = {};
        Object.keys(nutrition[key]).forEach(vitamin => {
          perServing[key][vitamin] = Math.round(nutrition[key][vitamin] / servings);
        });
      } else {
        perServing[key] = Math.round(nutrition[key] / servings);
      }
    });

    res.json({
      success: true,
      nutrition: {
        total: nutrition,
        perServing: perServing
      },
      healthScore: Math.floor(Math.random() * 40) + 60,
      recommendations: [
        'Rica en proteínas',
        'Buena fuente de fibra',
        'Contiene vitaminas esenciales'
      ]
    });

  } catch (error) {
    console.error('Error analizando nutrición:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Sugerir sustitutos para ingredientes
router.post('/suggest-substitutes', auth, [
  body('ingredient').notEmpty().withMessage('El ingrediente es requerido'),
  body('reason').optional().isIn(['allergy', 'unavailable', 'preference'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ingredient, reason = 'unavailable' } = req.body;

    // Base de datos simulada de sustitutos
    const substitutes = {
      'huevo': ['1/4 taza de puré de manzana', '1 cucharada de linaza molida + 3 cucharadas de agua', '1/4 taza de yogur'],
      'leche': ['leche de almendras', 'leche de avena', 'leche de coco'],
      'mantequilla': ['aceite de coco', 'puré de aguacate', 'aceite de oliva'],
      'azúcar': ['miel', 'jarabe de arce', 'stevia', 'azúcar de coco'],
      'harina': ['harina de almendras', 'harina de avena', 'harina de coco']
    };

    const ingredientLower = ingredient.toLowerCase();
    const suggestions = substitutes[ingredientLower] || [
      'Consulta con un nutricionista',
      'Busca en tiendas especializadas',
      'Considera omitir este ingrediente'
    ];

    res.json({
      ingredient,
      substitutes: suggestions.map(substitute => ({
        name: substitute,
        ratio: '1:1',
        notes: 'Ajustar según el gusto'
      })),
      reason,
      confidence: 0.85
    });

  } catch (error) {
    console.error('Error sugiriendo sustitutos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Optimizar receta para reducir desperdicio
router.post('/optimize-recipe', auth, [
  body('recipeId').optional().isMongoId(),
  body('availableIngredients').isArray().withMessage('Debe proporcionar ingredientes disponibles')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipeId, availableIngredients } = req.body;

    // Simular optimización
    await new Promise(resolve => setTimeout(resolve, 2000));

    const optimization = {
      wasteReduction: Math.floor(Math.random() * 30) + 20,
      costSavings: Math.floor(Math.random() * 15) + 10,
      suggestions: [
        'Usar ingredientes próximos a vencer primero',
        'Ajustar porciones según disponibilidad',
        'Guardar sobras para otra receta'
      ],
      alternativeRecipes: [
        {
          title: 'Versión optimizada',
          description: 'Receta adaptada a tus ingredientes disponibles',
          wasteReduction: 35
        }
      ]
    };

    res.json({
      success: true,
      optimization,
      message: 'Receta optimizada para reducir desperdicio'
    });

  } catch (error) {
    console.error('Error optimizando receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;