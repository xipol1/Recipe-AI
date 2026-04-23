# Auditoría técnica de la app (abril 2026)

## Resumen ejecutivo
La app **no está lista para producción** todavía. El código base tiene buena cobertura funcional (auth, campañas, canales, pagos, archivos), pero persisten brechas críticas de seguridad, consistencia de dominio y madurez operativa.

## Qué falta para terminar el desarrollo

### 1) Cerrar brechas críticas de seguridad (bloqueante)
- Rehabilitar y aplicar el rate limiting global en Express (está definido pero no se usa).
- Bajar límites de autenticación/registro/recuperación a valores realistas anti-abuso.
- Eliminar/aislar credenciales demo hardcodeadas para evitar acceso no deseado en entornos reales.
- Restringir CORS por entorno (no usar `origin: '*'` en producción).
- Eliminar defaults inseguros para secretos JWT/session/encryption y fallar de forma explícita si faltan.

### 2) Corregir inconsistencias de modelo vs validaciones (bloqueante)
- Unificar estados de anuncios entre `models/Anuncio.js` y `routes/anuncios.js`.
- Definir una única fuente de verdad para enums de estados (constante compartida).

### 3) Arreglar toolchain de calidad (bloqueante)
- Normalizar entorno Node/npm para que `npm test`, `npm run lint` y `npm run build` funcionen en CI y local.
- Asegurar permisos ejecutables de bins (`node_modules/.bin/*`) cuando se instala en Linux.
- Fijar versiones de herramientas y agregar pipeline CI (lint + test + build + audit).

### 4) Alinear contrato de autenticación y roles (alta prioridad)
- Homologar validación de `role` entre rutas y controlador para evitar comportamiento ambiguo.
- Revisar respuesta de login/registro para no duplicar tokens en distintos niveles del payload.

### 5) Endurecer despliegue y observabilidad (alta prioridad)
- Separar configuración estricta por ambiente (`development`, `staging`, `production`).
- Instrumentar métricas y alertas mínimas (errores 5xx, latencia, auth failures, pagos fallidos).
- Completar runbook operativo (rotación de claves, respaldo, recuperación, incidentes).

### 6) Completar cobertura de pruebas (alta prioridad)
- Agregar tests unitarios para servicios críticos (auth, campañas, transacciones).
- Agregar tests de integración para rutas sensibles (auth/anuncios/transacciones/files).
- Agregar smoke tests E2E de flujos clave (registro, login, crear campaña, publicación, pago).

## Hallazgos principales (con evidencia)

1. **Rate limiting global deshabilitado**: se declara `globalLimiter` pero no se aplica y se deja comentario de desactivación temporal.  
2. **Rate limits de auth prácticamente desactivados** (`max: 1000000`) en login, registro y restablecimiento.  
3. **CORS abierto globalmente** con `origin: '*'`.  
4. **Credenciales demo hardcodeadas** (`demo@adflow.com/123456`, `creator@adflow.com/123456`).  
5. **Defaults inseguros para secretos** JWT/session/encryption en config si no hay variables de entorno.  
6. **Inconsistencia de estados de anuncios**: rutas validan `pausado` y `expirado`, pero el modelo no los admite.  
7. **Inconsistencia de rol**: rutas solo permiten `creator/advertiser`, controlador también contempla `admin`.

## Plan recomendado (2 sprints)

### Sprint 1 (seguridad + consistencia)
- Aplicar rate limiting real (global + auth).
- Cerrar CORS por allowlist.
- Deshabilitar usuarios demo por flag `ENABLE_DEMO_USERS=false` en producción.
- Consolidar enums de estado en un módulo compartido.
- Corregir contrato de `role` en registro.

### Sprint 2 (calidad + release)
- Dejar CI obligatorio (lint/test/build).
- Subir cobertura mínima en módulos críticos.
- Hardening de configuración por ambiente y documentación final de despliegue.

## Criterios de “app terminada” (Definition of Done para release)
- ✅ Sin credenciales demo activas en producción.
- ✅ CORS restringido por entorno.
- ✅ Rate limiting efectivo y testeado.
- ✅ Enum de estados consistente entre modelo, rutas y frontend.
- ✅ Pipeline CI en verde (lint + test + build).
- ✅ Checklist operativo de despliegue y monitoreo aprobado.
