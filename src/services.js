// Configuración base (revertida a localhost fijo a pedido del usuario)
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Función para obtener headers de autenticación
export const getAuthHeaders = () => {
  // Preferimos access_token; mantenemos compatibilidad con keys antiguas
  const access = localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("accessToken");
  return {
    'Content-Type': 'application/json',
    ...(access && { 'Authorization': `Bearer ${access}` }),
  };
};

// Función para hacer logout cuando el token expire
const handleTokenExpiration = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_data");
  localStorage.removeItem("userInfo");
  
  // Recargar la página para resetear el estado
  window.location.href = '/';
};

// Función genérica para hacer requests
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetchWithAuth(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error);
    throw error;
  }
};

// =============================================================================
// SERVICIO DE AUTENTICACIÓN
// =============================================================================
export const authService = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      // Guardar access y refresh bajo keys estandarizadas
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("token", data.access); // compatibilidad
      localStorage.setItem("refresh_token", data.refresh);
      if (data.user_info) {
        localStorage.setItem('userInfo', JSON.stringify(data.user_info));
      }
      return { success: true, data };
    } else {
      const errorData = await response.json().catch(() => ({ detail: "Error de autenticación" }));
      return { success: false, error: errorData.detail };
    }
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/create-user/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/logout/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      handleTokenExpiration();
    }
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      handleTokenExpiration();
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizar access token en keys utilizadas
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("token", data.access);
        return true;
      } else {
        handleTokenExpiration();
        return false;
      }
    } catch (error) {
      handleTokenExpiration();
      return false;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("access_token");
  }
};

// =============================================================================
// SERVICIO DE USUARIOS
// =============================================================================
export const userService = {
  getAll: async () => {
    const token = localStorage.getItem("access_token");
    console.log('🔍 Token disponible:', !!token); // 🔍 Debug
    console.log('🔑 Token value:', token ? token.substring(0, 20) + '...' : 'null'); // 🔍 Debug
    
    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: getAuthHeaders()
    });
    console.log('🔍 Making request to:', `${API_BASE_URL}/users/`); // 🔍 Debug
    console.log('🔑 Headers:', getAuthHeaders()); // 🔍 Debug
    console.log('📊 Response status:', response.status); // 🔍 Debug
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Users data received:', data); // 🔍 Debug
      return data.results || data.users || data;
    } else {
      // Intentar leer el mensaje de error del backend
      try {
        const errorData = await response.json();
        console.error('❌ Error response data:', errorData); // 🔍 Debug
      } catch (e) {
        console.error('❌ Could not parse error response'); // 🔍 Debug
      }
      console.error('❌ Response not ok:', response.status, response.statusText); // 🔍 Debug
      throw new Error(`Error loading users: ${response.status}`);
    }
  },

  create: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/create-user/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return response;
  },

  update: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return response;
  },

  delete: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return response;
  },
  getById: async (userId) => {
    // Usamos el mismo endpoint del viewset de customers
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error obteniendo usuario');
    return await response.json();
  },

  toggleStatus: async (userId, isActive) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive })
    });
    return response;
  },

  changeRole: async (userId, role) => {
    const response = await fetch(`${API_BASE_URL}/change-role/${userId}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return response;
  },

  // Cargar perfil de usuario
  loadProfile: async () => {
    try {
      const response = await apiRequest('/profile/');

      if (response.ok) {
        const data = await response.json();

        // Guardar en localStorage
        localStorage.setItem("user_role", data.role);
        localStorage.setItem("user_data", JSON.stringify(data));

        return { success: true, data };
      } else {
        return { success: false, error: 'Error al cargar perfil' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Actualizar perfil de usuario
  updateProfile: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return response;
  },

  // Verificar si puede acceder a admin
  canAccessAdmin: (userData, userRole) => {
    if (!userData || !userRole) {
      return false;
    }

    return (
      userRole === 'admin' ||
      userRole === 'operator' ||
      userData.permissions?.can_access_admin === true
    );
  },

  // Limpiar datos de usuario
  clearUserData: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_data");
  }
};

// =============================================================================
// SERVICIO DE PRODUCTOS
// =============================================================================
export const productService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getById: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/${productId}/`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      return response.json();
    }
    throw new Error(`Error loading product: ${response.status}`);
  },

  getMenWatches: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/?gender=men`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getWomenWatches: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/?gender=women`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  search: async (query) => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/?search=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  create: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return response;
  },

  update: async (productId, productData) => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/${productId}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return response;
  },

  delete: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/${productId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return response;
  }
};

// =============================================================================
// SERVICIO DE CATEGORÍAS
// =============================================================================
export const categoryService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/categories/`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  create: async (categoryData) => {
    const response = await fetch(`${API_BASE_URL}/market/model/categories/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return response;
  },

  update: async (categoryId, categoryData) => {
    const response = await fetch(`${API_BASE_URL}/market/model/categories/${categoryId}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return response;
  },

  delete: async (categoryId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/categories/${categoryId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return response;
  }
};

// =============================================================================
// SERVICIO DE PEDIDOS
// =============================================================================
export const orderService = {
  getAll: async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/market/model/orders/`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Error al obtener todos los pedidos");
    }
    return response.json();
  },

  getMyOrders: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/my-orders/`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(`Error al obtener mis pedidos: ${errorData.detail}`);
    }
    return response.json();
  },

  getById: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/${orderId}/`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return response.json();
    }
    throw new Error(`Error loading order: ${response.status}`);
  },

  create: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    return response;
  },

  update: async (orderId, orderData) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/${orderId}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    return response;
  },

  updateStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/${orderId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado: status })
    });
    return response;
  },

  updateOrder: async (orderId, orderData) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/${orderId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    if (!response.ok) {
      throw new Error("Error al actualizar el pedido");
    }
    return response.json();
  },

  cancel: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/${orderId}/cancel/`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return response;
  },

  updateTotal: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/${orderId}/update_total/`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return response;
  },

  delete: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/orders/${orderId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return response;
  }
};

// =============================================================================
// SERVICIO DE FAVORITOS
// =============================================================================
export const favoritesService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/favorites/`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  add: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/favorites/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId })
    });
    return response;
  },

  remove: async (favoriteId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/favorites/${favoriteId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return response;
  },

  removeByProductId: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/favorites/?product_id=${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return response;
  }
};

// =============================================================================
// SERVICIO DE CARRITO
// =============================================================================
export const cartService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/cart/`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  add: async (productId, quantity = 1) => {
    const response = await fetch(`${API_BASE_URL}/market/model/products/${productId}/add_to_cart/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        cantidad: quantity 
      })
    });
    return response;
  },

  update: async (cartItemId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/market/model/cart-items/${cartItemId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ cantidad: quantity })
    });
    return response;
  },

  remove: async (cartItemId) => {
    const response = await fetch(`${API_BASE_URL}/market/model/cart-items/${cartItemId}/`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return response;
  },

  clear: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/cart/clear/`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return response;
  },

  checkout: async () => {
    const response = await fetch(`${API_BASE_URL}/market/model/cart/checkout/`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return response;
  }
};

// =============================================================================
// SERVICIO DE ADMINISTRACIÓN
// =============================================================================
export const adminService = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
      headers: getAuthHeaders()
    });
    console.log('🔍 Making request to:', `${API_BASE_URL}/admin/dashboard/`); // 🔍 Debug
    
    if (response.ok) {
      return response.json();
    }
    console.error('❌ Dashboard response not ok:', response.status, response.statusText); // 🔍 Debug
    throw new Error(`Error loading dashboard: ${response.status}`);
  },

  // Estadísticas y métricas
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/account_admin/admin/stats/`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// =============================================================================
// SERVICIO DE CONTACTO
// =============================================================================
export const contactService = {
  send: async (contactData) => {
    const response = await fetch(`${API_BASE_URL}/contact/`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData)
    });
    return response;
  }
};

// =============================================================================
// EXPORTACIONES POR DEFECTO
// =============================================================================
const exportedServices = {
  auth: authService,
  user: userService,
  product: productService,
  category: categoryService,
  order: orderService,
  favorites: favoritesService,
  cart: cartService,
  admin: adminService,
  contact: contactService,
  
  // Utilidades
  apiRequest,
  getAuthHeaders,
  handleTokenExpiration,
  API_BASE_URL
};
export default exportedServices;

// Wrapper que añade Authorization y reintenta con refresh token si recibe 401
export const fetchWithAuth = async (url, options = {}) => {
  const opts = { ...options };
  opts.headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
    ...getAuthHeaders()
  };

  let response = await fetch(url, opts);

  if (response.status === 401) {
    // Intentar refresh
    const refreshed = await authService.refreshToken();
    if (refreshed) {
      // Reintentar la petición con nuevo token
      opts.headers = {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
        ...getAuthHeaders()
      };
      response = await fetch(url, opts);
      if (response.status === 401) {
        // token inválido incluso después de refresh
        handleTokenExpiration();
      }
    } else {
      // No pudo refrescar
      handleTokenExpiration();
    }
  }

  return response;
};