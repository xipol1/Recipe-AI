import { useState, useEffect, useContext, createContext } from 'react';
import apiService from '../services/api';
import { isDemoEmail } from '../services/demoData';

// Crear contexto de autenticación
const AuthContext = createContext();

// Provider de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verificar si el usuario está autenticado
   */
  const checkAuth = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      const isDemo = localStorage.getItem('isDemo') === 'true';
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      let parsedStoredUser = null;
      
      if (storedUser) {
        try {
          parsedStoredUser = JSON.parse(storedUser);
          if (parsedStoredUser && isDemoEmail(parsedStoredUser.email)) {
            parsedStoredUser = { ...parsedStoredUser, isDemo: true };
          }
          if (parsedStoredUser && isDemo) {
            parsedStoredUser = { ...parsedStoredUser, isDemo: true };
          }
          setUser(parsedStoredUser);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }

      if (isDemo) {
        setLoading(false);
        return;
      }

      if (!token) {
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await apiService.verifyToken();
      
      if (response.success) {
        let verifiedUser = response.data?.user;

        if (!verifiedUser || !verifiedUser.role) {
          throw new Error("Invalid user response from API");
        }

        if ((parsedStoredUser && parsedStoredUser.isDemo === true) || isDemoEmail(verifiedUser.email)) {
          verifiedUser = { ...verifiedUser, isDemo: true };
        }

        setUser(verifiedUser);
        localStorage.setItem('user', JSON.stringify(verifiedUser));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Iniciar sesión
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.login(credentials);
      
      if (response.success) {
        let user = response.data?.user;
        const token = response.data?.accessToken || response.data?.token;
        const refreshToken = response.data?.refreshToken;

        if (!user || !user.role) {
          throw new Error("Invalid user response from API");
        }
        if (!token) {
          throw new Error("Invalid token response from API");
        }

        if (user.isDemo === true || isDemoEmail(credentials?.email) || isDemoEmail(user.email)) {
          user = { ...user, isDemo: true };
        }

        localStorage.removeItem('isDemo');
        localStorage.removeItem('role');
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true, user };
      } else {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = (role) => {
    const demoUser = {
      id: 'demo-user',
      _id: 'demo-user',
      email: 'demo@adflow.com',
      role: role === 'creator' ? 'creator' : 'advertiser',
      isDemo: true,
    };
    localStorage.removeItem('token');
    localStorage.setItem('isDemo', 'true');
    localStorage.setItem('role', demoUser.role);
    localStorage.setItem('user', JSON.stringify(demoUser));
    setError(null);
    setUser(demoUser);
    return { success: true, user: demoUser };
  };

  /**
   * Registrar usuario
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.register(userData);
      
      if (response.success) {
        const user = response.data?.user;
        const token = response.data?.accessToken || response.data?.token;
        const refreshToken = response.data?.refreshToken;

        if (token && user) {
          if (!user.role) {
            throw new Error("Invalid user response from API");
          }
          localStorage.setItem('token', token);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        }
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Error al registrar usuario');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isDemo');
      localStorage.removeItem('role');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setError(null);
    }
  };

  /**
   * Solicitar restablecimiento de contraseña
   */
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.requestPasswordReset(email);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Error al solicitar restablecimiento');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Restablecer contraseña
   */
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.resetPassword(token, newPassword);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Error al restablecer contraseña');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar datos del usuario
   */
  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  /**
   * Limpiar errores
   */
  const clearError = () => {
    setError(null);
  };

  let storedIsDemo = false;
  try {
    storedIsDemo = localStorage.getItem('isDemo') === 'true';
  } catch (e) {
    storedIsDemo = false;
  }
  const isDemoUser = user?.isDemo === true || storedIsDemo;

  const value = {
    user,
    loading,
    error,
    login,
    loginDemo,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    updateUser,
    clearError,
    isAuthenticated: !!user,
    isAnunciante: user?.role === 'advertiser',
    isCreador: user?.role === 'creator',
    isAdmin: user?.role === 'admin',
    isDemo: user?.isDemo === true,
    isDemoUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

export default useAuth;
