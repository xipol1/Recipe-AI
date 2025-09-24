const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Obtener perfil de usuario público
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user.getPublicData());
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Buscar usuarios
router.get('/', [
  query('search').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {};

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'preferences.favoriteCuisines': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filters)
        .select('-password -email')
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filters)
    ]);

    const publicUsers = users.map(user => user.getPublicData());

    res.json({
      users: publicUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Seguir/dejar de seguir usuario
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
    }

    const [targetUser, currentUser] = await Promise.all([
      User.findById(targetUserId),
      User.findById(currentUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Dejar de seguir
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId
      );
    } else {
      // Seguir
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    res.json({
      following: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    console.error('Error procesando seguimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener seguidores de un usuario
router.get('/:id/followers', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20
    } = req.query;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const followersIds = user.followers.slice(skip, skip + parseInt(limit));

    const followers = await User.find({ _id: { $in: followersIds } })
      .select('-password -email');

    const publicFollowers = followers.map(follower => follower.getPublicData());

    res.json({
      followers: publicFollowers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.followers.length,
        pages: Math.ceil(user.followers.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo seguidores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener usuarios seguidos
router.get('/:id/following', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20
    } = req.query;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const followingIds = user.following.slice(skip, skip + parseInt(limit));

    const following = await User.find({ _id: { $in: followingIds } })
      .select('-password -email');

    const publicFollowing = following.map(user => user.getPublicData());

    res.json({
      following: publicFollowing,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.following.length,
        pages: Math.ceil(user.following.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo seguidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar preferencias de usuario
router.put('/preferences', auth, [
  body('dietaryRestrictions').optional().isArray(),
  body('favoriteCuisines').optional().isArray(),
  body('skillLevel').optional().isIn(['Principiante', 'Intermedio', 'Avanzado'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar solo las preferencias proporcionadas
    if (req.body.dietaryRestrictions !== undefined) {
      user.preferences.dietaryRestrictions = req.body.dietaryRestrictions;
    }
    if (req.body.favoriteCuisines !== undefined) {
      user.preferences.favoriteCuisines = req.body.favoriteCuisines;
    }
    if (req.body.skillLevel !== undefined) {
      user.preferences.skillLevel = req.body.skillLevel;
    }

    await user.save();

    res.json({
      message: 'Preferencias actualizadas correctamente',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del usuario
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Aquí podrías agregar más estadísticas como:
    // - Número de recetas creadas
    // - Número de productos en despensa
    // - Recetas más populares
    // - etc.

    const stats = {
      followersCount: user.followers.length,
      followingCount: user.following.length,
      joinDate: user.createdAt,
      isActive: user.isActive
    };

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;