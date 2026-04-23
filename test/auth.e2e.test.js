const express = require('express');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.SESSION_SECRET = 'test_session_secret';
process.env.ENCRYPTION_KEY = 'test_encryption_key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.ENABLE_DEMO_USERS = 'true';
process.env.DEMO_USER_EMAIL = 'demo@adflow.com';
process.env.DEMO_USER_PASSWORD = '123456';
process.env.DEMO_CREATOR_EMAIL = 'creator@adflow.com';
process.env.DEMO_CREATOR_PASSWORD = '123456';

const usersById = new Map();
const usersByEmail = new Map();
let nextId = 1;

class MockUsuario {
  constructor(data = {}) {
    this._id = data._id || String(nextId++);
    this.id = this._id;
    this.email = data.email;
    this.password = data.password;
    this.nombre = data.nombre || 'User';
    this.apellido = data.apellido || 'Test';
    this.telefono = data.telefono || '';
    this.rol = data.rol || 'advertiser';
    this.verificacion = data.verificacion || { emailVerificado: true };
    this.activo = data.activo !== false;
    this.refreshTokens = data.refreshTokens || [];
    this.ultimoLogin = data.ultimoLogin;
    this.avatar = data.avatar || null;
  }

  generarTokenVerificacion() {
    this.verificacion.tokenVerificacion = 'verification-token';
    this.verificacion.tokenExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return 'verification-token';
  }

  async compararPassword(password) {
    return this.password === password;
  }

  async save() {
    usersById.set(String(this._id), this);
    usersByEmail.set(this.email, this);
    return this;
  }

  static findOne(query = {}) {
    let user = null;

    if (query.email) {
      user = usersByEmail.get(query.email) || null;
    } else if (query._id) {
      user = usersById.get(String(query._id)) || null;
    } else if (query['refreshTokens.token']) {
      const token = query['refreshTokens.token'];
      user = Array.from(usersById.values()).find((candidate) =>
        candidate.refreshTokens.some((entry) => entry.token === token && entry.activo === true)
      ) || null;
    }

    const promise = Promise.resolve(user);
    promise.select = async () => user;
    return promise;
  }

  static findById(id) {
    const user = usersById.get(String(id)) || null;
    const promise = Promise.resolve(user);
    promise.select = async () => user;
    promise.populate = () => promise;
    return promise;
  }

  static async updateOne(filter, update) {
    const user = usersById.get(String(filter._id));
    if (!user) return { matchedCount: 0, modifiedCount: 0 };

    const token = filter['refreshTokens.token'];
    if (token && update?.$set?.['refreshTokens.$.activo'] === false) {
      const tokenEntry = user.refreshTokens.find((entry) => entry.token === token);
      if (tokenEntry) tokenEntry.activo = false;
    }

    return { matchedCount: 1, modifiedCount: 1 };
  }
}

jest.mock('../models/Usuario', () => MockUsuario);
jest.mock('../services/emailService', () => ({
  enviarEmailVerificacion: jest.fn().mockResolvedValue(true),
  enviarEmailRecuperacion: jest.fn().mockResolvedValue(true)
}));

const authRoutes = require('../routes/auth');

describe('Auth flow e2e (login/demo/refresh/logout)', () => {
  let app;

  beforeEach(async () => {
    usersById.clear();
    usersByEmail.clear();
    nextId = 1;

    const seeded = new MockUsuario({
      email: 'user@test.com',
      password: 'password123',
      nombre: 'Test',
      apellido: 'User',
      rol: 'advertiser',
      verificacion: { emailVerificado: true }
    });
    await seeded.save();

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  it('debe completar login -> refresh rotation -> logout/revoke', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeTruthy();
    expect(loginRes.body.data.refreshToken).toBeTruthy();

    const accessToken = loginRes.body.data.accessToken;
    const refreshToken1 = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshToken1 });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeTruthy();
    expect(refreshRes.body.data.refreshToken).toBeTruthy();

    const refreshToken2 = refreshRes.body.data.refreshToken;
    expect(refreshToken2).not.toEqual(refreshToken1);

    const oldRefreshRes = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: refreshToken1 });

    expect(oldRefreshRes.status).toBe(401);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: refreshToken2 });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    const revokedRefreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshToken2 });

    expect(revokedRefreshRes.status).toBe(401);
  });

  it('debe permitir demo-login con credenciales configuradas', async () => {
    const demoRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ email: 'demo@adflow.com', password: '123456' });

    expect(demoRes.status).toBe(200);
    expect(demoRes.body.success).toBe(true);
    expect(demoRes.body.data.user.isDemo).toBe(true);
    expect(demoRes.body.data.accessToken).toBeTruthy();
    expect(demoRes.body.data.refreshToken).toBeTruthy();
  });

  it('debe rechazar refresh token expirado y revocarlo', async () => {
    const seeded = usersByEmail.get('user@test.com');
    seeded.refreshTokens.push({
      token: 'expired-refresh-token',
      fechaCreacion: new Date(Date.now() - (31 * 24 * 60 * 60 * 1000)),
      activo: true
    });

    const expiredRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'expired-refresh-token' });

    expect(expiredRes.status).toBe(401);
    expect(expiredRes.body.success).toBe(false);

    const tokenEntry = seeded.refreshTokens.find((entry) => entry.token === 'expired-refresh-token');
    expect(tokenEntry.activo).toBe(false);
  });
});
