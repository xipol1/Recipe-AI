# Plataforma de Monetización para Canales de Comunicación

Una plataforma completa para la monetización de canales de comunicación como Telegram, WhatsApp, Instagram y Discord a través de anuncios publicitarios.

## 🚀 Características Principales

### 📢 Gestión de Canales
- Registro y verificación de canales de múltiples plataformas
- Estadísticas detalladas de audiencia y engagement
- Categorización automática de contenido
- Sistema de verificación y validación

### 💰 Sistema de Anuncios
- Creación y gestión de campañas publicitarias
- Segmentación avanzada de audiencia
- Múltiples formatos de anuncios (texto, imagen, video)
- Sistema de pujas y precios dinámicos
- Programación automática de publicaciones

### 💳 Procesamiento de Pagos
- Integración con Stripe para pagos seguros
- Soporte para múltiples monedas
- Sistema de comisiones configurable
- Reportes financieros detallados
- Pagos automáticos a propietarios de canales

### 🔐 Autenticación y Seguridad
- Sistema JWT para autenticación
- Roles y permisos granulares
- Rate limiting avanzado
- Validación y sanitización de datos
- Encriptación de datos sensibles

### 📁 Gestión de Archivos
- Upload seguro de imágenes y documentos
- Procesamiento automático de imágenes
- Generación de thumbnails
- Almacenamiento optimizado
- CDN para entrega rápida

### 🔔 Sistema de Notificaciones
- Notificaciones en tiempo real
- Múltiples canales (email, push, in-app)
- Plantillas personalizables
- Historial de notificaciones

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **Stripe** - Procesamiento de pagos
- **Socket.io** - Comunicación en tiempo real
- **Multer** - Manejo de archivos
- **Sharp** - Procesamiento de imágenes
- **Nodemailer** - Envío de emails

### Seguridad
- **Helmet** - Headers de seguridad
- **Express Rate Limit** - Limitación de requests
- **Express Validator** - Validación de datos
- **XSS Clean** - Protección contra XSS
- **HPP** - Protección contra HTTP Parameter Pollution
- **Mongo Sanitize** - Protección contra inyección NoSQL

## 📦 Instalación

### Prerrequisitos
- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 5.0
- Redis (opcional, para caché)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd plataforma-monetizacion
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar el archivo `.env` con tus configuraciones:
   ```env
   # Base de datos
   MONGODB_URI=mongodb://localhost:27017/plataforma_monetizacion
   
   # JWT
   JWT_SECRET=tu_jwt_secret_muy_seguro
   JWT_REFRESH_SECRET=tu_refresh_secret_muy_seguro
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Email
   EMAIL_PROVIDER=gmail
   EMAIL_USER=tu_email@gmail.com
   EMAIL_PASS=tu_password_de_aplicacion
   
   # Servidor
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # Archivos
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   ```

4. **Iniciar la aplicación**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 🔧 Configuración

### Base de Datos
La aplicación se conectará automáticamente a MongoDB usando la URI proporcionada en las variables de entorno.

### Plantillas de entorno por ambiente
- `.env.example` (base local)
- `.env.staging.example` (staging)
- `.env.production.example` (producción)

Para despliegues, usa también `RELEASE_CHECKLIST.md` como guía operativa previa a publicar.

### Stripe
1. Crear cuenta en [Stripe](https://stripe.com)
2. Obtener las claves API desde el dashboard
3. Configurar webhooks para eventos de pago

### Email
Configurar el proveedor de email en las variables de entorno. Soporta:
- Gmail
- Outlook
- SendGrid
- Mailgun
- SMTP personalizado

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `GET /api/auth/verify-email/:token` - Verificar email

### Canales
- `GET /api/canales` - Listar canales
- `POST /api/canales` - Crear canal
- `GET /api/canales/:id` - Obtener canal
- `PUT /api/canales/:id` - Actualizar canal
- `DELETE /api/canales/:id` - Eliminar canal
- `POST /api/canales/:id/verificar` - Verificar canal

### Anuncios
- `GET /api/anuncios` - Listar anuncios
- `POST /api/anuncios` - Crear anuncio
- `GET /api/anuncios/:id` - Obtener anuncio
- `PUT /api/anuncios/:id` - Actualizar anuncio
- `DELETE /api/anuncios/:id` - Eliminar anuncio
- `POST /api/anuncios/:id/aprobar` - Aprobar anuncio

### Transacciones
- `GET /api/transacciones` - Listar transacciones
- `POST /api/transacciones` - Crear transacción
- `GET /api/transacciones/:id` - Obtener transacción
- `POST /api/transacciones/webhook` - Webhook de Stripe

### Archivos
- `POST /api/files/upload` - Subir archivo
- `GET /api/files/:id` - Obtener archivo
- `GET /api/files/:id/thumbnail` - Obtener thumbnail
- `DELETE /api/files/:id` - Eliminar archivo

### Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `PUT /api/notifications/:id/read` - Marcar como leída
- `DELETE /api/notifications/:id` - Eliminar notificación

## 🔒 Seguridad

### Autenticación
- Tokens JWT con expiración
- Refresh tokens para renovación automática
- Logout seguro con invalidación de tokens

### Validación
- Validación estricta de todos los inputs
- Sanitización contra inyecciones
- Rate limiting por IP y usuario

### Archivos
- Validación de tipos de archivo
- Límites de tamaño
- Escaneo de malware (recomendado)

## 📊 Monitoreo

### Logs
- Winston para logging estructurado
- Diferentes niveles de log
- Rotación automática de archivos

### Métricas
- Estadísticas de uso en tiempo real
- Reportes de rendimiento
- Alertas automáticas

## 🚀 Despliegue

### Docker
```dockerfile
# Dockerfile incluido en el proyecto
docker build -t plataforma-monetizacion .
docker run -p 5000:5000 plataforma-monetizacion
```

### Variables de Entorno de Producción
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico:
- 📧 Email: soporte@plataforma-monetizacion.com
- 📚 Documentación: [docs.plataforma-monetizacion.com](https://docs.plataforma-monetizacion.com)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/plataforma-monetizacion/issues)

## 🔄 Changelog

### v1.0.0 (2024-01-15)
- ✨ Lanzamiento inicial
- 🔐 Sistema de autenticación completo
- 📢 Gestión de canales
- 💰 Sistema de anuncios
- 💳 Integración con Stripe
- 📁 Gestión de archivos
- 🔔 Sistema de notificaciones

---

**Desarrollado con ❤️ por el equipo de Plataforma Monetización**
