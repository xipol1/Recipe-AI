// Configuración de la API para conectar el frontend con el backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuración de headers por defecto
const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Función helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de conexión' }));
    throw new Error(error.message || 'Error en la solicitud');
  }
  return response.json();
};

// Servicios de autenticación
export const authAPI = {
  // Registro de usuario
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Inicio de sesión
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials)
    });
    const data = await handleResponse(response);
    
    // Guardar token en localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Actualizar perfil
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(passwordData)
    });
    return handleResponse(response);
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('authToken');
  }
};

// Servicios de productos
export const productsAPI = {
  // Obtener todos los productos del usuario
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Agregar filtros como parámetros de consulta
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'todos') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Obtener estadísticas de la despensa
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/products/stats`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Crear un nuevo producto
  create: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse(response);
  },

  // Crear múltiples productos (desde escaneo de ticket)
  createBatch: async (productsArray) => {
    const response = await fetch(`${API_BASE_URL}/products/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ products: productsArray })
    });
    return handleResponse(response);
  },

  // Actualizar un producto
  update: async (productId, productData) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse(response);
  },

  // Eliminar un producto
  delete: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Marcar producto como consumido
  consume: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/consume`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// Servicios de recetas
export const recipesAPI = {
  // Obtener recetas del usuario
  getUserRecipes: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/recipes/user${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Obtener recetas públicas/comunitarias
  getPublicRecipes: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/recipes/public${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Obtener una receta específica
  getById: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Crear una nueva receta
  create: async (recipeData) => {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(recipeData)
    });
    return handleResponse(response);
  },

  // Actualizar una receta
  update: async (recipeId, recipeData) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(recipeData)
    });
    return handleResponse(response);
  },

  // Eliminar una receta
  delete: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Dar like a una receta
  like: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/like`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Quitar like de una receta
  unlike: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/unlike`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Guardar una receta
  save: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/save`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Quitar de guardados
  unsave: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/unsave`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Calificar una receta
  rate: async (recipeId, rating) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/rate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating })
    });
    return handleResponse(response);
  }
};

// Servicios de IA
export const aiAPI = {
  // Generar receta basada en ingredientes disponibles
  generateRecipe: async (ingredients, preferences = {}) => {
    const response = await fetch(`${API_BASE_URL}/ai/generate-recipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ingredients, preferences })
    });
    return handleResponse(response);
  },

  // Procesar imagen de ticket con OCR
  processTicket: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/ocr/process-ticket`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return handleResponse(response);
  },

  // Obtener recomendaciones de recetas
  getRecommendations: async (preferences = {}) => {
    const response = await fetch(`${API_BASE_URL}/ai/recommendations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(preferences)
    });
    return handleResponse(response);
  }
};

// Hook personalizado para manejar estados de carga y errores
export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeAPI = async (apiCall) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, executeAPI };
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

// Función para obtener el token actual
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Interceptor para manejar errores de autenticación globalmente
export const setupAuthInterceptor = (onUnauthorized) => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      if (onUnauthorized) {
        onUnauthorized();
      }
    }
    
    return response;
  };
};

export default {
  auth: authAPI,
  products: productsAPI,
  recipes: recipesAPI,
  ai: aiAPI,
  isAuthenticated,
  getAuthToken,
  setupAuthInterceptor
};