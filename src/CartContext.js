// 🛒 **CARTCONTEXT.JS** - CONTEXTO GLOBAL PARA MANEJAR EL CARRITO
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 📊 FUNCIÓN PARA OBTENER LA CLAVE DE USUARIO
  const getUserCartKey = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return `cart_${user.id || user.username}`;
      } catch (error) {
        console.error('Error parsing userInfo:', error);
      }
    }
    return 'cart_guest'; // Para usuarios no logueados
  };

  // 🔄 MIGRAR CARRITO DE GUEST A USUARIO AUTENTICADO
  const migrateGuestCartToUser = () => {
    const guestCart = localStorage.getItem('cart_guest');
    if (guestCart) {
      try {
        const guestItems = JSON.parse(guestCart);
        if (guestItems.length > 0) {
          console.log('🛒 Migrando carrito guest a usuario autenticado:', guestItems);
          
          const userCartKey = getUserCartKey();
          const existingUserCart = localStorage.getItem(userCartKey);
          
          if (existingUserCart) {
            // Combinar carritos: agregar items guest al carrito existente del usuario
            const existingItems = JSON.parse(existingUserCart);
            const mergedItems = [...existingItems];
            
            guestItems.forEach(guestItem => {
              const existingIndex = mergedItems.findIndex(item => item.id === guestItem.id);
              if (existingIndex >= 0) {
                // Si el producto ya existe, sumar las cantidades
                mergedItems[existingIndex].quantity += guestItem.quantity;
              } else {
                // Si no existe, agregarlo
                mergedItems.push(guestItem);
              }
            });
            
            setCartItems(mergedItems);
            localStorage.setItem(userCartKey, JSON.stringify(mergedItems));
          } else {
            // No hay carrito de usuario, usar el guest directamente
            setCartItems(guestItems);
            localStorage.setItem(userCartKey, guestCart);
          }
          
          // Limpiar carrito guest después de migrar
          localStorage.removeItem('cart_guest');
          console.log('✅ Carrito migrado exitosamente');
        }
      } catch (error) {
        console.error('Error al migrar carrito:', error);
      }
    }
  };

  // 🔄 CARGAR CARRITO DESDE LOCALSTORAGE AL INICIAR
  useEffect(() => {
    const cartKey = getUserCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
        console.log('🛒 Carrito cargado:', cartKey);
      } catch (error) {
        console.error('Error al cargar carrito:', error);
        setCartItems([]);
      }
    }
  }, []);

  // 🔄 ESCUCHAR CAMBIOS DE USUARIO (LOGIN/LOGOUT)
  useEffect(() => {
    const handleUserLoggedIn = () => {
      console.log('👤 Usuario inició sesión, migrando carrito...');
      // Migrar carrito de guest a usuario
      migrateGuestCartToUser();
    };

    const handleStorageChange = () => {
      const cartKey = getUserCartKey();
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          setCartItems([]);
        }
      }
    };

    const handleUserLoggedOut = () => {
      console.log('👋 Usuario cerró sesión, limpiando carrito...');
      // Al cerrar sesión, volver al carrito guest vacío
      setCartItems([]);
      setIsCartOpen(false);
      localStorage.removeItem('cart_guest'); // Limpiar carrito guest también
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    window.addEventListener('userLoggedOut', handleUserLoggedOut);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  // 💾 GUARDAR CARRITO EN LOCALSTORAGE CUANDO CAMBIEN
  useEffect(() => {
    const cartKey = getUserCartKey();
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
  }, [cartItems]);

  // ➕ FUNCIÓN PARA AGREGAR AL CARRITO
  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { ...product, quantity, watch_id: product.watch_id || product.id_backend || product.id }];
      }
    });
  };

  // ➖ FUNCIÓN PARA REMOVER DEL CARRITO
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  // 🔄 FUNCIÓN PARA ACTUALIZAR CANTIDAD
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // 🧹 FUNCIÓN PARA LIMPIAR CARRITO
  const clearCart = () => {
    setCartItems([]);
  };

  // 📊 FUNCIÓN PARA OBTENER CANTIDAD TOTAL DE ITEMS
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // 💰 FUNCIÓN PARA OBTENER PRECIO TOTAL
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI UN PRODUCTO ESTÁ EN EL CARRITO
  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  // 📦 FUNCIÓN PARA OBTENER CANTIDAD DE UN PRODUCTO ESPECÍFICO
  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  // 🛒 FUNCIÓN PARA ABRIR/CERRAR CARRITO
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  // 🎁 FUNCIÓN PARA CALCULAR PROMOCIONES DESBLOQUEADAS
  const getUnlockedPromotions = () => {
    const total = getTotalPrice();
    const promotions = {
      hasDiscount: total >= 100000,
      hasFreeShipping: total >= 50000,
      hasGiftBox: total >= 150000,
      discountPercentage: total >= 100000 ? 10 : 0
    };
    return promotions;
  };

  const value = {
    cartItems,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
    getItemQuantity,
    toggleCart,
    setIsCartOpen,
    getUnlockedPromotions
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
