const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const config = require('../config/config');
const emailService = require('../services/emailService');
const { USER_ROLES } = require('../constants/enums');

// Generar token JWT
const generarToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Generar refresh token
const generarRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const formatearAuthData = (usuario, accessToken, refreshToken) => ({
  user: {
    id: usuario.id || usuario._id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    role: usuario.rol || usuario.role,
    verificado: Boolean(usuario.verificacion?.emailVerificado ?? usuario.verificado),
    avatar: usuario.avatar,
    isDemo: Boolean(usuario.isDemo)
  },
  accessToken,
  refreshToken
});

const crearSesionDemo = (email, password) => {
  if (!config.auth.enableDemoUsers) return null;

  if (email === config.auth.demoUserEmail && password === config.auth.demoUserPassword) {
    const accessToken = jwt.sign(
      { id: 'demo-advertiser', email: config.auth.demoUserEmail, role: 'advertiser', isDemo: true },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    const refreshToken = generarRefreshToken();
    return formatearAuthData({
      id: 'demo-advertiser',
      email: config.auth.demoUserEmail,
      nombre: 'Anunciante',
      apellido: 'Demo',
      role: 'advertiser',
      verificado: true,
      isDemo: true
    }, accessToken, refreshToken);
  }

  if (email === config.auth.demoCreatorEmail && password === config.auth.demoCreatorPassword) {
    const accessToken = jwt.sign(
      { id: 'demo-creator', email: config.auth.demoCreatorEmail, role: 'creator', isDemo: true },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    const refreshToken = generarRefreshToken();
    return formatearAuthData({
      id: 'demo-creator',
      email: config.auth.demoCreatorEmail,
      nombre: 'Creador',
      apellido: 'Demo',
      role: 'creator',
      verificado: true,
      isDemo: true
    }, accessToken, refreshToken);
  }

  return null;
};

// Registro de usuario
exports.registro = async (req, res) => {
  try {
    const {
      email,
      password,
      nombre,
      apellido,
      telefono,
      role,
      perfilCreador,
      perfilAnunciante
    } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Validar rol
    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      email,
      password,
      nombre,
      apellido,
      telefono,
      rol: role,
      perfilCreador: role === 'creator' ? {
        ...perfilCreador,
        redesSociales: {
          ...perfilCreador?.redesSociales,
          whatsapp: perfilCreador?.redesSociales?.whatsapp || {
            numero: telefono, // Usar el teléfono principal por defecto
            publicacionAutomatica: false // Por defecto manual si no se especifica
          }
        }
      } : undefined,
      perfilAnunciante: role === 'advertiser' ? perfilAnunciante : undefined
    });

    // Generar token de verificación
    const tokenVerificacion = nuevoUsuario.generarTokenVerificacion();

    await nuevoUsuario.save();

    // Generar tokens de autenticación
    const token = generarToken(nuevoUsuario._id);
    const refreshToken = generarRefreshToken();

    // Guardar refresh token
    nuevoUsuario.refreshTokens.push({
      token: refreshToken,
      fechaCreacion: new Date(),
      activo: true
    });
    await nuevoUsuario.save();

    // Enviar email de verificación
    try {
      await emailService.enviarEmailVerificacion(nuevoUsuario.email, nuevoUsuario.nombre, tokenVerificacion);
    } catch (emailError) {
      console.error('❌ Error al enviar email de verificación:', emailError.message);
      // No detenemos el registro si falla el envío, pero lo logueamos
    }

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
      data: formatearAuthData(nuevoUsuario, token, refreshToken)
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Usuarios demo para acceso rápido (no requieren DB)
    const sesionDemo = crearSesionDemo(email, password);
    if (sesionDemo) {
      return res.json({
        success: true,
        data: sesionDemo
      });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email }).select('+password');
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al soporte.'
      });
    }

    // Generar tokens
    const token = generarToken(usuario._id);
    const refreshToken = generarRefreshToken();

    // Guardar refresh token
    usuario.refreshTokens.push({
      token: refreshToken,
      fechaCreacion: new Date(),
      activo: true
    });

    // Actualizar último login
    usuario.ultimoLogin = new Date();
    await usuario.save();

    res.json({
      success: true,
      message: 'Login exitoso',
      data: formatearAuthData(usuario, token, refreshToken)
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

exports.demoLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const sesionDemo = crearSesionDemo(email, password);

    if (!sesionDemo) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales demo inválidas o modo demo deshabilitado'
      });
    }

    return res.json({
      success: true,
      data: sesionDemo
    });
  } catch (error) {
    console.error('Error en demo login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    // Desactivar refresh token
    await Usuario.updateOne(
      { _id: userId, 'refreshTokens.token': refreshToken },
      { $set: { 'refreshTokens.$.activo': false } }
    );

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Refrescar token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Buscar usuario con el refresh token
    const usuario = await Usuario.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.activo': true
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    // Verificar si el token no ha expirado (30 días)
    const tokenData = usuario.refreshTokens.find(t => t.token === refreshToken);
    const fechaExpiracion = new Date(tokenData.fechaCreacion);
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);

    if (new Date() > fechaExpiracion) {
      // Desactivar token expirado
      await Usuario.updateOne(
        { _id: usuario._id, 'refreshTokens.token': refreshToken },
        { $set: { 'refreshTokens.$.activo': false } }
      );

      return res.status(401).json({
        success: false,
        message: 'Refresh token expirado'
      });
    }

    // Rotación de refresh token
    const nuevoRefreshToken = generarRefreshToken();
    usuario.refreshTokens = usuario.refreshTokens.map((tokenData) => {
      if (tokenData.token === refreshToken) {
        tokenData.activo = false;
      }
      return tokenData;
    });
    usuario.refreshTokens.push({
      token: nuevoRefreshToken,
      fechaCreacion: new Date(),
      activo: true
    });
    await usuario.save();

    // Generar nuevo access token
    const nuevoToken = generarToken(usuario._id);

    res.json({
      success: true,
      data: formatearAuthData(usuario, nuevoToken, nuevoRefreshToken)
    });

  } catch (error) {
    console.error('Error al refrescar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar email
exports.verificarEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar usuario con el token de verificación
    const usuario = await Usuario.findOne({
      'verificacion.tokenVerificacion': token,
      'verificacion.tokenExpiracion': { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificación inválido o expirado'
      });
    }

    // Verificar email
    usuario.verificacion.emailVerificado = true;
    usuario.verificacion.fechaVerificacion = new Date();
    usuario.verificacion.tokenVerificacion = undefined;
    usuario.verificacion.tokenExpiracion = undefined;

    await usuario.save();

    res.json({
      success: true,
      message: 'Email verificado exitosamente'
    });

  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Solicitar restablecimiento de contraseña
exports.solicitarRestablecimiento = async (req, res) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      // Por seguridad, no revelamos si el email existe
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token de restablecimiento
    const tokenRestablecimiento = usuario.generarTokenRestablecimiento();
    await usuario.save();

    // Enviar email de restablecimiento
    try {
      await emailService.enviarEmailRecuperacion(usuario.email, usuario.nombre, tokenRestablecimiento);
    } catch (emailError) {
      console.error('❌ Error al enviar email de restablecimiento:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });

  } catch (error) {
    console.error('Error al solicitar restablecimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Restablecer contraseña
exports.restablecerPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Buscar usuario con el token de restablecimiento
    const usuario = await Usuario.findOne({
      'verificacion.tokenRestablecimiento': token,
      'verificacion.tokenRestablecimientoExpiracion': { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'Token de restablecimiento inválido o expirado'
      });
    }

    // Actualizar contraseña
    usuario.password = password;
    usuario.verificacion.tokenRestablecimiento = undefined;
    usuario.verificacion.tokenRestablecimientoExpiracion = undefined;

    // Desactivar todos los refresh tokens
    usuario.refreshTokens.forEach(token => {
      token.activo = false;
    });

    await usuario.save();

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar contraseña (usuario autenticado)
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const userId = req.user.id;

    // Buscar usuario
    const usuario = await Usuario.findById(userId).select('+password');
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const passwordValida = await usuario.compararPassword(passwordActual);
    if (!passwordValida) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    usuario.password = passwordNueva;
    await usuario.save();

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario autenticado
exports.obtenerPerfil = async (req, res) => {
  try {
    if (req.user && req.user.isDemo) {
      return res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    }

    const userId = req.user.id;

    const usuario = await Usuario.findById(userId)
      .populate('canales')
      .select('-refreshTokens -verificacion.tokenVerificacion -verificacion.tokenRestablecimiento');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: usuario._id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          role: usuario.rol,
          verificado: usuario.verificacion?.emailVerificado,
          avatar: usuario.avatar,
          telefono: usuario.telefono,
          pais: usuario.pais,
          fechaNacimiento: usuario.fechaNacimiento,
          activo: usuario.activo,
          canales: usuario.canales,
          perfilCreador: usuario.perfilCreador,
          perfilAnunciante: usuario.perfilAnunciante
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar perfil
exports.actualizarPerfil = async (req, res) => {
  try {
    const userId = req.user.id;
    const actualizaciones = req.body;

    // Campos que no se pueden actualizar directamente
    const camposProhibidos = ['password', 'email', 'role', 'rol', 'verificacion', 'refreshTokens'];
    camposProhibidos.forEach(campo => delete actualizaciones[campo]);

    const usuario = await Usuario.findByIdAndUpdate(
      userId,
      actualizaciones,
      { new: true, runValidators: true }
    ).select('-refreshTokens -verificacion.tokenVerificacion -verificacion.tokenRestablecimiento');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: {
          id: usuario._id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          role: usuario.rol,
          verificado: usuario.verificacion?.emailVerificado,
          avatar: usuario.avatar,
          telefono: usuario.telefono,
          pais: usuario.pais,
          fechaNacimiento: usuario.fechaNacimiento,
          activo: usuario.activo,
          canales: usuario.canales,
          perfilCreador: usuario.perfilCreador,
          perfilAnunciante: usuario.perfilAnunciante
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Desactivar cuenta
exports.desactivarCuenta = async (req, res) => {
  try {
    const userId = req.user.id;
    const { motivo } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      userId,
      {
        activo: false,
        fechaDesactivacion: new Date(),
        motivoDesactivacion: motivo
      },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Desactivar todos los refresh tokens
    usuario.refreshTokens.forEach(token => {
      token.activo = false;
    });
    await usuario.save();

    res.json({
      success: true,
      message: 'Cuenta desactivada exitosamente'
    });

  } catch (error) {
    console.error('Error al desactivar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar token (middleware helper)
exports.verificarToken = async (req, res) => {
  try {
    if (req.user && req.user.isDemo) {
      return res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    }

    const userId = req.user.id;

    const usuario = await Usuario.findById(userId)
      .select('_id email nombre apellido rol verificacion.emailVerificado avatar');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: usuario._id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          role: usuario.rol,
          verificado: usuario.verificacion?.emailVerificado,
          avatar: usuario.avatar
        }
      }
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas del usuario
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.user.id;

    const usuario = await Usuario.findById(userId)
      .select('estadisticas rol')
      .populate('canales', 'estadisticas rendimiento');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Calcular estadísticas adicionales según el rol
    let estadisticasExtendidas = { ...usuario.estadisticas.toObject() };

    if (usuario.rol === 'creator') {
      // Agregar estadísticas de canales
      const totalSeguidores = usuario.canales.reduce((total, canal) => 
        total + (canal.estadisticas?.seguidores || 0), 0
      );
      
      const ingresosTotales = usuario.canales.reduce((total, canal) => 
        total + (canal.rendimiento?.ingresosTotales || 0), 0
      );

      estadisticasExtendidas.totalSeguidores = totalSeguidores;
      estadisticasExtendidas.ingresosTotales = ingresosTotales;
    }

    res.json({
      success: true,
      data: { estadisticas: estadisticasExtendidas }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
