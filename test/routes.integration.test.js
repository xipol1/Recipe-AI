const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  autenticar: (req, res, next) => {
    req.user = {
      id: '507f191e810c19729de860ea',
      role: 'advertiser',
      verificado: true,
      usuario: { rol: 'advertiser' }
    };
    next();
  },
  autorizarRoles: () => (req, res, next) => next(),
  requiereEmailVerificado: (req, res, next) => next(),
  verificarPropietario: () => (req, res, next) => next()
}));

jest.mock('../middleware/rateLimiter', () => ({
  limitadorAPI: (req, res, next) => next(),
  limitadorGeneral: (req, res, next) => next(),
  limitadorEndpoint: {
    crearAnuncio: (req, res, next) => next(),
    actualizarAnuncio: (req, res, next) => next(),
    responderAprobacion: (req, res, next) => next(),
    completarAnuncio: (req, res, next) => next(),
    crearTransaccion: (req, res, next) => next(),
    procesarPago: (req, res, next) => next()
  }
}));

jest.mock('../controllers/anuncioController', () => ({
  obtenerMisAnuncios: (req, res) => res.json({ success: true, source: 'anuncios' }),
  crearAnuncio: (req, res) => res.status(201).json({ success: true }),
  trackClick: (req, res) => res.json({ success: true }),
  trackConversion: (req, res) => res.json({ success: true }),
  obtenerAnunciosParaCreador: (req, res) => res.json({ success: true }),
  obtenerEstadisticas: (req, res) => res.json({ success: true }),
  obtenerAnuncio: (req, res) => res.json({ success: true }),
  actualizarAnuncio: (req, res) => res.json({ success: true }),
  eliminarAnuncio: (req, res) => res.json({ success: true }),
  responderAprobacion: (req, res) => res.json({ success: true }),
  completarAnuncio: (req, res) => res.json({ success: true }),
  buscarAnuncios: (req, res) => res.json({ success: true }),
  enviarParaAprobacion: (req, res) => res.json({ success: true }),
  activarAnuncio: (req, res) => res.json({ success: true })
}));

jest.mock('../controllers/transaccionController', () => ({
  obtenerMisTransacciones: (req, res) => res.json({ success: true, source: 'transacciones' }),
  obtenerEstadisticasFinancieras: (req, res) => res.json({ success: true }),
  obtenerTransaccion: (req, res) => res.json({ success: true }),
  procesarPagoAnuncio: (req, res) => res.status(201).json({ success: true }),
  liberarPagoCreador: (req, res) => res.json({ success: true }),
  procesarReembolso: (req, res) => res.json({ success: true }),
  obtenerTransaccionesAdmin: (req, res) => res.json({ success: true })
}));

jest.mock('../controllers/fileController', () => ({
  obtenerArchivo: (req, res) => res.json({ exito: true, source: 'files' }),
  obtenerThumbnail: (req, res) => res.json({ exito: true }),
  obtenerInfoArchivo: (req, res) => res.json({ exito: true }),
  descargarArchivo: (req, res) => res.json({ exito: true }),
  subirArchivos: (req, res) => res.status(201).json({ exito: true }),
  listarArchivos: (req, res) => res.json({ exito: true }),
  buscarArchivos: (req, res) => res.json({ exito: true }),
  obtenerEstadisticas: (req, res) => res.json({ exito: true }),
  actualizarArchivo: (req, res) => res.json({ exito: true }),
  eliminarArchivo: (req, res) => res.json({ exito: true }),
  limpiarTemporales: (req, res) => res.json({ exito: true }),
  limpiarExpirados: (req, res) => res.json({ exito: true })
}));

jest.mock('../services/fileService', () => {
  return jest.fn().mockImplementation(() => ({
    maxFileSize: 5 * 1024 * 1024,
    getMulterConfig: () => ({
      array: () => (req, res, next) => next(),
      single: () => (req, res, next) => next()
    })
  }));
});

describe('Integration coverage for anuncios/transacciones/files routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    app.use('/api/anuncios', require('../routes/anuncios'));
    app.use('/api/transacciones', require('../routes/transacciones'));
    app.use('/api/files', require('../routes/files'));
  });

  it('anuncios: obtiene listado autenticado', async () => {
    const res = await request(app).get('/api/anuncios');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('anuncios');
  });

  it('transacciones: obtiene listado autenticado', async () => {
    const res = await request(app).get('/api/transacciones');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('transacciones');
  });

  it('files: obtiene archivo público por id válido', async () => {
    const res = await request(app).get('/api/files/publico/507f191e810c19729de860ea');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('files');
  });
});
