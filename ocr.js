const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Procesar ticket con OCR
router.post('/process-ticket', auth, [
  body('image').notEmpty().withMessage('La imagen es requerida'),
  body('imageType').optional().isIn(['base64', 'url']).withMessage('Tipo de imagen inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { image, imageType = 'base64' } = req.body;

    // Aquí iría la integración con un servicio OCR real
    // Por ahora, devolvemos datos simulados
    const mockProducts = [
      {
        name: 'Leche Entera',
        quantity: 1,
        unit: 'litro',
        category: 'Lácteos',
        price: 2.50,
        store: 'Supermercado Central'
      },
      {
        name: 'Pan Integral',
        quantity: 1,
        unit: 'unidad',
        category: 'Panadería',
        price: 1.80,
        store: 'Supermercado Central'
      },
      {
        name: 'Manzanas',
        quantity: 1.5,
        unit: 'kg',
        category: 'Frutas',
        price: 3.20,
        store: 'Supermercado Central'
      },
      {
        name: 'Pollo',
        quantity: 1,
        unit: 'kg',
        category: 'Carnes',
        price: 8.50,
        store: 'Supermercado Central'
      }
    ];

    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.json({
      success: true,
      products: mockProducts,
      totalAmount: mockProducts.reduce((sum, product) => sum + product.price, 0),
      store: 'Supermercado Central',
      date: new Date().toISOString(),
      confidence: 0.95
    });

  } catch (error) {
    console.error('Error procesando ticket:', error);
    res.status(500).json({ 
      error: 'Error procesando el ticket',
      details: error.message 
    });
  }
});

// Obtener historial de tickets procesados
router.get('/history', auth, async (req, res) => {
  try {
    // Aquí podrías implementar un modelo para guardar el historial
    // Por ahora devolvemos un array vacío
    res.json({
      tickets: [],
      total: 0
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Validar formato de imagen
router.post('/validate-image', auth, [
  body('image').notEmpty().withMessage('La imagen es requerida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { image } = req.body;

    // Validaciones básicas de formato
    let isValid = false;
    let format = null;

    if (image.startsWith('data:image/')) {
      const formatMatch = image.match(/data:image\/([^;]+);/);
      if (formatMatch) {
        format = formatMatch[1];
        isValid = ['jpeg', 'jpg', 'png', 'webp'].includes(format.toLowerCase());
      }
    }

    res.json({
      isValid,
      format,
      message: isValid ? 'Imagen válida' : 'Formato de imagen no soportado'
    });

  } catch (error) {
    console.error('Error validando imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;