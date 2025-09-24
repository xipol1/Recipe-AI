const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');

const router = express.Router();

// Obtener todas las recetas del usuario con filtros y paginación
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  query('category').optional().isString(),
  query('cuisine').optional().isString(),
  query('difficulty').optional().isIn(['Fácil', 'Intermedio', 'Difícil']),
  query('cookingTime').optional().isInt({ min: 1 }),
  query('isPublic').optional().isBoolean(),
  query('sortBy').optional().isIn(['createdAt', 'title', 'cookingTime', 'difficulty', 'averageRating']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      search,
      category,
      cuisine,
      difficulty,
      cookingTime,
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = {
      $or: [
        { creator: req.user.id },
        { isPublic: true }
      ]
    };

    if (search) {
      filters.$and = filters.$and || [];
      filters.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    if (category) filters.category = category;
    if (cuisine) filters.cuisine = cuisine;
    if (difficulty) filters.difficulty = difficulty;
    if (cookingTime) filters.cookingTime = { $lte: parseInt(cookingTime) };
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';

    // Configurar ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recipes, total] = await Promise.all([
      Recipe.find(filters)
        .populate('creator', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Recipe.countDocuments(filters)
    ]);

    res.json({
      recipes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo recetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una receta específica
router.get('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('creator', 'name avatar');

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    // Verificar permisos
    if (!recipe.isPublic && recipe.creator._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta receta' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error obteniendo receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva receta
router.post('/', auth, [
  body('title').notEmpty().trim().withMessage('El título es requerido'),
  body('description').optional().trim(),
  body('ingredients').isArray({ min: 1 }).withMessage('Debe incluir al menos un ingrediente'),
  body('ingredients.*.name').notEmpty().withMessage('El nombre del ingrediente es requerido'),
  body('ingredients.*.amount').isFloat({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('ingredients.*.unit').notEmpty().withMessage('La unidad es requerida'),
  body('instructions').isArray({ min: 1 }).withMessage('Debe incluir al menos una instrucción'),
  body('prepTime').isInt({ min: 0 }).withMessage('El tiempo de preparación debe ser un número positivo'),
  body('cookingTime').isInt({ min: 0 }).withMessage('El tiempo de cocción debe ser un número positivo'),
  body('servings').isInt({ min: 1 }).withMessage('Las porciones deben ser un número positivo'),
  body('difficulty').isIn(['Fácil', 'Intermedio', 'Difícil']).withMessage('Dificultad inválida'),
  body('category').optional().isString(),
  body('cuisine').optional().isString(),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const recipeData = {
      ...req.body,
      creator: req.user.id
    };

    const recipe = new Recipe(recipeData);
    await recipe.save();

    await recipe.populate('creator', 'name avatar');

    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creando receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar receta
router.put('/:id', auth, [
  body('title').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('ingredients').optional().isArray({ min: 1 }),
  body('instructions').optional().isArray({ min: 1 }),
  body('prepTime').optional().isInt({ min: 0 }),
  body('cookingTime').optional().isInt({ min: 0 }),
  body('servings').optional().isInt({ min: 1 }),
  body('difficulty').optional().isIn(['Fácil', 'Intermedio', 'Difícil']),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    if (recipe.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para editar esta receta' });
    }

    Object.assign(recipe, req.body);
    await recipe.save();

    await recipe.populate('creator', 'name avatar');

    res.json(recipe);
  } catch (error) {
    console.error('Error actualizando receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar receta
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    if (recipe.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta receta' });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    res.json({ message: 'Receta eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Dar like a una receta
router.post('/:id/like', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    const hasLiked = recipe.hasLiked(req.user.id);

    if (hasLiked) {
      recipe.likes = recipe.likes.filter(like => like.toString() !== req.user.id);
    } else {
      recipe.likes.push(req.user.id);
    }

    await recipe.save();

    res.json({ 
      liked: !hasLiked,
      likesCount: recipe.likesCount
    });
  } catch (error) {
    console.error('Error procesando like:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Guardar/quitar de guardados una receta
router.post('/:id/save', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    const hasSaved = recipe.hasSaved(req.user.id);

    if (hasSaved) {
      recipe.savedBy = recipe.savedBy.filter(save => save.toString() !== req.user.id);
    } else {
      recipe.savedBy.push(req.user.id);
    }

    await recipe.save();

    res.json({ 
      saved: !hasSaved,
      savedCount: recipe.savedCount
    });
  } catch (error) {
    console.error('Error procesando guardado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Calificar una receta
router.post('/:id/rate', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    const { rating } = req.body;

    // Buscar si ya existe una calificación del usuario
    const existingRating = recipe.ratings.find(r => r.user.toString() === req.user.id);

    if (existingRating) {
      existingRating.rating = rating;
    } else {
      recipe.ratings.push({ user: req.user.id, rating });
    }

    await recipe.save();

    res.json({ 
      rating,
      averageRating: recipe.averageRating,
      ratingsCount: recipe.ratings.length
    });
  } catch (error) {
    console.error('Error calificando receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;