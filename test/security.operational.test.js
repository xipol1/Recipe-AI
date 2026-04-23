const express = require('express');
const request = require('supertest');

const baseEnv = {
  JWT_SECRET: 'test_jwt_secret',
  JWT_REFRESH_SECRET: 'test_refresh_secret',
  SESSION_SECRET: 'test_session_secret',
  ENCRYPTION_KEY: 'test_encryption_key',
  MONGODB_URI: 'mongodb://localhost:27017/test'
};

describe('Operational security checks', () => {
  beforeEach(() => {
    jest.resetModules();
    Object.assign(process.env, baseEnv);
  });

  it('permite origenes CORS de la allowlist y bloquea origenes externos', async () => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = 'https://allowed.example.com';

    const stubRouteFactory = () => {
      const router = express.Router();
      router.get('/', (req, res) => res.json({ ok: true }));
      return router;
    };

    jest.doMock('../routes/auth', () => stubRouteFactory());
    jest.doMock('../routes/canales', () => stubRouteFactory());
    jest.doMock('../routes/anuncios', () => stubRouteFactory());
    jest.doMock('../routes/transacciones', () => stubRouteFactory());
    jest.doMock('../routes/notifications', () => stubRouteFactory());
    jest.doMock('../routes/files', () => stubRouteFactory());
    jest.doMock('../routes/estadisticas', () => stubRouteFactory());
    jest.doMock('../routes/campaigns', () => stubRouteFactory());
    jest.doMock('../routes/lists', () => stubRouteFactory());
    jest.doMock('../routes/channels', () => stubRouteFactory());
    jest.doMock('../modules/integrations/routes.integrations', () => stubRouteFactory());
    jest.doMock('../modules/integrations/swagger', () => () => {});

    const app = require('../app');

    const allowed = await request(app)
      .get('/health')
      .set('Origin', 'https://allowed.example.com');

    expect(allowed.status).toBe(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example.com');

    const blocked = await request(app)
      .get('/health')
      .set('Origin', 'https://evil.example.com');

    expect(blocked.status).toBeGreaterThanOrEqual(400);
  });

  it('activa rate limit en login bajo carga (max 10 por ventana)', async () => {
    process.env.NODE_ENV = 'test';
    jest.resetModules();
    Object.assign(process.env, baseEnv, { NODE_ENV: 'test' });
    jest.dontMock('../routes/auth');

    class MockUsuario {
      static findOne() {
        const promise = Promise.resolve(null);
        promise.select = async () => null;
        return promise;
      }
    }

    jest.doMock('../models/Usuario', () => MockUsuario);
    jest.doMock('../services/emailService', () => ({
      enviarEmailVerificacion: jest.fn().mockResolvedValue(true),
      enviarEmailRecuperacion: jest.fn().mockResolvedValue(true)
    }));

    const authRoutes = require('../routes/auth');
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    let lastStatus = 0;
    for (let i = 0; i < 11; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nope@test.com', password: 'badpass' });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });

  it('fuerza demo users deshabilitados en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEMO_USERS = 'true';

    const config = require('../config/config');
    expect(config.auth.enableDemoUsers).toBe(false);
  });
});
