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
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });

  // Obtener rango de precios global (todos los productos con stock)
  const fetchPriceRange = useCallback(async () => {
    try {
      // Obtener todas las categorías para asegurar que incluimos todos los productos
      const url = `${API_BASE_URL}/market/model/products/?page_size=9999&categoria=todos`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      
      console.log(`fetchPriceRange: ${list.length} productos encontrados`);
      
      if (list.length > 0) {
        const precios = list.map(p => Number(p.precio) || 0).filter(p => p > 0);
        if (precios.length > 0) {
          const min = Math.floor(Math.min(...precios));
          const max = Math.ceil(Math.max(...precios));
          console.log(`Rango de precios calculado: $${min} - $${max}`);
          setPriceRange({ min, max });
          return { min, max };
        }
      }
      console.warn('No se encontraron productos con precio válido');
      return { min: 0, max: 1000000 };
    } catch (err) {
      console.error('Error al obtener rango de precios:', err);
      return { min: 0, max: 1000000 };
    }
  }, []);

  const fetchProducts = useCallback(async ({ page: requestedPage = 1, page_size = 12, params = {} } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page: requestedPage,
        page_size,
        ...params
      };

      // Construir query string
      const queryString = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryString.set(key, String(value));
        }
      });

      const url = `${API_BASE_URL}/market/model/products/?${queryString.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      
      const mappedProducts = list.map((p, index) => {
        if (index === 0) {
        }
        
        let imagen = '/logo192.png';
        if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
          imagen = p.imagenes[0];}
        
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
          price: Number(p.precio_final || p.precio) || 0,
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
      setCount(Array.isArray(data) ? mappedProducts.length : (data.count ?? mappedProducts.length));
      setNext(Array.isArray(data) ? null : (data.next ?? null));
      setPrevious(Array.isArray(data) ? null : (data.previous ?? null));
      setPage(requestedPage);
      setPageSize(page_size);
      setLastFetch(new Date());
      
      return mappedProducts;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar solo el rango de precios al montar el contexto
  // Los productos se cargarán desde Products.js según los parámetros de la URL
  useEffect(() => {
    fetchPriceRange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProducts = useCallback((params = {}) => {
    return fetchProducts({ page: 1, page_size: 12, params });
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
    count,
    next,
    previous,
    page,
    pageSize,
    priceRange,
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
