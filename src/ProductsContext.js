import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { API_BASE_URL } from './services';

const ProductsContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de ProductsProvider');
  }
  return context;
};

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchProducts = useCallback(async (force = false) => {
    // Si ya tenemos productos y no forzamos refresh, no hacemos nada
    if (products.length > 0 && !force) {
      return products;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Cargando productos desde:', `${API_BASE_URL}/market/model/products/`);
      
      const response = await fetch(`${API_BASE_URL}/market/model/products/`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      
      const mappedProducts = list.map((p, index) => {
        if (index === 0) {
          console.log('📦 Primer producto completo:', p);
          console.log('  - imagenes field:', p.imagenes);
          console.log('  - es array?', Array.isArray(p.imagenes));
          console.log('  - length:', p.imagenes?.length);
        }
        
        let imagen = '/logo192.png';
        if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
          imagen = p.imagenes[0];
          if (index === 0) console.log('  ✅ Imagen asignada:', imagen);
        } else {
          if (index === 0) console.log('  ⚠️ Usando imagen por defecto');
        }
        
        // Determinar género basado en el nombre de la categoría o del producto
        let genero = 'Unisex';
        const nombreLower = (p.nombre || '').toLowerCase();
        const categoriaLower = (p.categoria?.nombre || '').toLowerCase();
        
        if (nombreLower.includes('mujer') || nombreLower.includes('woman') || nombreLower.includes('women') ||
            categoriaLower.includes('mujer') || categoriaLower.includes('woman') || categoriaLower.includes('women')) {
          genero = 'Mujer';
        } else if (nombreLower.includes('hombre') || nombreLower.includes('man') || nombreLower.includes('men') ||
                   categoriaLower.includes('hombre') || categoriaLower.includes('man') || categoriaLower.includes('men')) {
          genero = 'Hombre';
        }
        
        return {
          id: p.id,
          watch_id: p.id,
          id_backend: p.id,
          name: p.nombre || 'Producto',
          price: Number(p.precio) || 0,
          image: imagen,
          category: p.categoria?.nombre || 'Relojes',
          genero: genero,
          badge: p.en_oferta ? 'Oferta' : 'Nuevo',
          reviews: 0,
          description: p.descripcion || '',
          stock: p.stock_disponible || 0,
          external_id: p.external_id
        };
      });

      setProducts(mappedProducts);
      setLastFetch(new Date());
      console.log('✅ Productos cargados en context:', mappedProducts.length);
      
      return mappedProducts;
    } catch (err) {
      console.error('❌ Error al cargar productos:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [products.length]);

  // Cargar productos al montar el contexto
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProducts = useCallback(() => {
    console.log('🔄 Refrescando productos...');
    return fetchProducts(true);
  }, [fetchProducts]);

  const clearProducts = useCallback(() => {
    setProducts([]);
    setLastFetch(null);
  }, []);

  const value = {
    products,
    loading,
    error,
    lastFetch,
    fetchProducts,
    refreshProducts,
    clearProducts
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};
