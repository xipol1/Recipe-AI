# Release Checklist (staging/production)

## 1) Quality gate (must be green)
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

## 2) Required secrets and envs
- [ ] `MONGODB_URI` defined
- [ ] `JWT_SECRET` defined
- [ ] `JWT_REFRESH_SECRET` defined
- [ ] `SESSION_SECRET` defined
- [ ] `ENCRYPTION_KEY` defined
- [ ] `CORS_ORIGINS` set to expected domains
- [ ] `ENABLE_DEMO_USERS=false` in production

## 3) Auth end-to-end smoke checks
- [ ] `POST /api/auth/login` returns `{ user, accessToken, refreshToken }`
- [ ] `POST /api/auth/demo-login` works only when demo mode enabled
- [ ] `POST /api/auth/refresh` rotates refresh token
- [ ] `POST /api/auth/refresh-token` alias works
- [ ] `POST /api/auth/logout` revokes the refresh token

## 4) Operational readiness
- [ ] Backups configured for MongoDB
- [ ] Monitoring/alerts configured (5xx, latency, auth failures)
- [ ] Rollback plan documented and tested
