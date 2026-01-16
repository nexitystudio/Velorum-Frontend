// 💖 **FAVORITESCONTEXT.JS** - CONTEXTO GLOBAL PARA MANEJAR FAVORITOS
import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  // Ahora almacenamos objetos de producto completos { id, name, image, price, ... }
  const [favorites, setFavorites] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // � FUNCIÓN PARA OBTENER LA CLAVE DE USUARIO
  const getUserFavoritesKey = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return `favorites_${user.id || user.username || 'guest'}`;
    }
    return 'favorites_guest'; // Para usuarios no logueados
  };

  // �🔄 CARGAR FAVORITOS DESDE LOCALSTORAGE AL INICIAR
  useEffect(() => {
    const favoritesKey = getUserFavoritesKey();
    const savedFavorites = localStorage.getItem(favoritesKey);
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        // Migración: si eran IDs (números) limpiamos porque ya no podemos mapear a datos completos aquí
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
          setFavorites([]);
        } else {
          setFavorites(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        setFavorites([]);
      }
    }
  }, []);

  // 🔄 ESCUCHAR CAMBIOS DE USUARIO (LOGIN/LOGOUT)
  useEffect(() => {
    const handleStorageChange = () => {
      const favoritesKey = getUserFavoritesKey();
      const savedFavorites = localStorage.getItem(favoritesKey);
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (error) {
          setFavorites([]);
        }
      } else {
        setFavorites([]); // Limpiar favoritos si no hay datos para este usuario
      }
    };

    const handleUserLoggedOut = () => {
      // 🧹 LIMPIAR FAVORITOS COMPLETAMENTE AL CERRAR SESIÓN
      setFavorites([]);
      setIsOpen(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);
    window.addEventListener('userLoggedOut', handleUserLoggedOut);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  // 💾 GUARDAR FAVORITOS EN LOCALSTORAGE CUANDO CAMBIEN
  useEffect(() => {
    const favoritesKey = getUserFavoritesKey();
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  }, [favorites]);

  // 💖 FUNCIÓN PARA AGREGAR/QUITAR FAVORITOS
  const toggleFavorite = (productOrId) => {
    if (!productOrId) return;
    
    // Si recibimos solo un ID (número), necesitamos el objeto completo del producto
    // Por ahora, si es número, lo removemos o no hacemos nada
    if (typeof productOrId === 'number') {
      setFavorites(prev => {
        const exists = prev.some(p => p.id === productOrId);
        if (exists) {
          return prev.filter(p => p.id !== productOrId);
        }
        // Si no existe y solo tenemos el ID, no podemos agregarlo sin más datos
        return prev;
      });
      return;
    }
    
    // Si recibimos un objeto producto completo
    setFavorites(prev => {
      const exists = prev.some(p => p.id === productOrId.id);
      if (exists) {
        return prev.filter(p => p.id !== productOrId.id);
      }
      // Guardamos sólo campos esenciales para sidebar (evita almacenar funciones u objetos enormes)
      const { id, name, image, price, originalPrice, category, badge, reviews, description, stock } = productOrId;
      return [...prev, { id, name, image, price, originalPrice, category, badge, reviews, description, stock }];
    });
  };

  // ❌ FUNCIÓN PARA REMOVER FAVORITO
  const removeFavorite = (productId) => {
    setFavorites(prev => prev.filter(p => p.id !== productId));
  };

  // 🧹 FUNCIÓN PARA LIMPIAR TODOS LOS FAVORITOS
  const clearFavorites = () => { setFavorites([]); };

  // ✅ FUNCIÓN PARA VERIFICAR SI UN PRODUCTO ES FAVORITO
  const isFavorite = (productId) => favorites.some(p => p.id === productId);

  // 📊 FUNCIÓN PARA OBTENER CANTIDAD DE FAVORITOS
  const getFavoritesCount = () => favorites.length;

  // 🔄 FUNCIÓN PARA ALTERNAR SIDEBAR
  const toggleFavorites = () => {
    setIsOpen(prev => !prev);
  };

  // 📂 FUNCIÓN PARA CERRAR SIDEBAR
  const closeFavorites = () => {
    setIsOpen(false);
  };

  // 📂 FUNCIÓN PARA ABRIR SIDEBAR
  const openFavorites = () => {
    setIsOpen(true);
  };

  const value = {
    favorites,
    isOpen,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite,
    getFavoritesCount,
    toggleFavorites,
    closeFavorites,
    openFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
