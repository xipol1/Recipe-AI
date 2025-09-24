const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware de validación para productos
const validateProduct = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('quantity').isNumeric().withMessage('La cantidad debe ser un número'),
  body('unit').isIn(['kg', 'g', 'l', 'ml', 'piezas', 'latas', 'paquetes']).withMessage('Unidad inválida'),
  body('category').isIn(['frutas', 'verduras', 'carnes', 'pescados', 'lacteos', 'cereales', 'legumbres', 'especias', 'aceites', 'otros']).withMessage('Categoría inválida'),
  body('location').optional().isIn(['despensa', 'nevera', 'congelador']).withMessage('Ubicación inválida'),
  body('expiry_date').optional().isISO8601().withMessage('Fecha de vencimiento inválida')
];

// GET /api/products - Obtener todos los productos del usuario
router.get('/', auth, async (req, res) => {
  try {
    const { category, location, expiring_soon, expired, page = 1, limit = 50 } = req.query;
    
    const filter = { created_by: req.user.id, is_consumed: false };
    
    // Filtros opcionales
    if (category) filter.category = category;
    if (location) filter.location = location;
    
    let query = Product.find(filter);
    
    // Filtro por productos próximos a vencer
    if (expiring_soon === 'true') {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      query = query.where('expiry_date').lte(threeDaysFromNow).gte(new Date());
    }
    
    // Filtro por productos vencidos
    if (expired === 'true') {
      query = query.where('expiry_date').lt(new Date());
    }
    
    // Paginación
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(parseInt(limit));
    
    // Ordenar por fecha de vencimiento (próximos primero)
    query = query.sort({ expiry_date: 1, createdAt: -1 });
    
    const products = await query;
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/products/stats - Estadísticas de la despensa
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [
      totalProducts,
      expiringSoon,
      expired,
      byCategory,
      byLocation
    ] = await Promise.all([
      Product.countDocuments({ created_by: userId, is_consumed: false }),
      Product.countDocuments({
        created_by: userId,
        is_consumed: false,
        expiry_date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      }),
      Product.countDocuments({
        created_by: userId,
        is_consumed: false,
        expiry_date: { $lt: new Date() }
      }),
      Product.aggregate([
        { $match: { created_by: userId, is_consumed: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        { $match: { created_by: userId, is_consumed: false } },
        { $group: { _id: '$location', count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({
      total_products: totalProducts,
      expiring_soon: expiringSoon,
      expired: expired,
      by_category: byCategory,
      by_location: byLocation
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/products - Crear nuevo producto
router.post('/', auth, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const productData = {
      ...req.body,
      created_by: req.user.id
    };
    
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/products/bulk - Crear múltiples productos (para OCR)
router.post('/bulk', auth, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de productos' });
    }
    
    const productsWithUser = products.map(product => ({
      ...product,
      created_by: req.user.id
    }));
    
    const createdProducts = await Product.insertMany(productsWithUser);
    
    res.status(201).json({
      message: `${createdProducts.length} productos creados exitosamente`,
      products: createdProducts
    });
  } catch (error) {
    console.error('Error creando productos en lote:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', auth, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      created_by: req.user.id
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PATCH /api/products/:id/consume - Marcar producto como consumido
router.patch('/:id/consume', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user.id },
      { 
        is_consumed: true, 
        consumed_date: new Date(),
        quantity: 0
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error marcando producto como consumido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;