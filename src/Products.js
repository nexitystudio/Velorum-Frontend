import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useFavorites } from './FavoritesContext';
import { useCart } from './CartContext';
import { useProducts } from './ProductsContext';
import './Products.css';

// Mapeo de ordenamiento UI → backend
const ordenMap = {
  'precio-asc': 'precio_asc',
  'precio-desc': 'precio_desc',
  'nombre-asc': 'az',
  'nombre-desc': 'za',
  'destacados': 'destacado',
};

function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, setIsCartOpen } = useCart();
  const { products: allProducts, loading, error, count, page: currentPage, pageSize, priceRange, fetchProducts } = useProducts();
  
  // Leer valores iniciales de la URL
  const [categoriaFiltro, setCategoriaFiltro] = useState(searchParams.get('categoria') || 'Todos');
  const precioMaxDinamico = 1000000; // Máximo fijo en 1 millón
  const [precioMinInput, setPrecioMinInput] = useState(Number(searchParams.get('precio_min')) || 0);
  const [precioMaxInput, setPrecioMaxInput] = useState(Number(searchParams.get('precio_max')) || 1000000);
  const [precioMinAplicado, setPrecioMinAplicado] = useState(Number(searchParams.get('precio_min')) || 0);
  const [precioMaxAplicado, setPrecioMaxAplicado] = useState(Number(searchParams.get('precio_max')) || 1000000);
  const priceTrackRef = useRef(null);
  const [busquedaInput, setBusquedaInput] = useState(searchParams.get('q') || ''); // Input temporal
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || ''); // Búsqueda aplicada
  const [ordenamiento, setOrdenamiento] = useState(searchParams.get('orden') || 'destacados');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const PRODUCTOS_POR_PAGINA = 12;

  // Cargar productos desde URL cuando cambian los searchParams
  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1;
    const categoria = searchParams.get('categoria') || 'Todos';
    const q = searchParams.get('q') || '';
    const orden = searchParams.get('orden') || 'destacados';
    const precioMin = Number(searchParams.get('precio_min')) || 0;
    const precioMax = Number(searchParams.get('precio_max')) || 0;
    
    const params = {
      q: q || undefined,
      precio_min: precioMin || undefined,
      precio_max: precioMax || undefined,
      orden: orden || undefined,
      categoria: categoria !== 'Todos' ? categoria.toLowerCase() : undefined,
    };
    
    // Sincronizar estado local con la URL
    setCategoriaFiltro(categoria);
    setBusqueda(q);
    setBusquedaInput(q);
    setOrdenamiento(orden);
    
    // Sincronizar precios desde la URL (o usar valores por defecto)
    setPrecioMinInput(precioMin || 0);
    setPrecioMaxInput(precioMax || 1000000);
    setPrecioMinAplicado(precioMin || 0);
    setPrecioMaxAplicado(precioMax || 1000000);
    
    // Cargar productos con los parámetros de la URL
    fetchProducts({ page, page_size: 12, params });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Ejecutar cuando cambian los parámetros de la URL

  // Actualiza el fondo del track del slider cuando cambian los valores de precio
  useEffect(() => {
    if (!priceTrackRef.current || precioMaxDinamico === 0) return;
    const range = precioMaxDinamico;
    const minPct = (precioMinInput / range) * 100;
    const maxPct = (precioMaxInput / range) * 100;
    priceTrackRef.current.style.background = `linear-gradient(90deg, #e2e8f0 0%, #e2e8f0 ${minPct}%, #0d4ca3 ${minPct}%, #1e5bb8 ${maxPct}%, #e2e8f0 ${maxPct}%, #e2e8f0 100%)`;
  }, [precioMinInput, precioMaxInput, precioMaxDinamico]);

  // Función para aplicar filtros (actualiza la URL)
  const aplicarFiltrosAURL = useCallback((nuevosFiltros = {}) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', '1'); // Reset a página 1 cuando cambian filtros
    
    const filtros = {
      q: nuevosFiltros.q !== undefined ? nuevosFiltros.q : busqueda,
      categoria: nuevosFiltros.categoria !== undefined ? nuevosFiltros.categoria : categoriaFiltro,
      orden: nuevosFiltros.orden !== undefined ? nuevosFiltros.orden : ordenamiento,
      precio_min: nuevosFiltros.precio_min !== undefined ? nuevosFiltros.precio_min : precioMinAplicado,
      precio_max: nuevosFiltros.precio_max !== undefined ? nuevosFiltros.precio_max : precioMaxAplicado,
    };
    
    if (filtros.q) newSearchParams.set('q', filtros.q);
    // Solo agregar precio_min si es mayor a 0
    if (filtros.precio_min > 0) newSearchParams.set('precio_min', String(filtros.precio_min));
    // Solo agregar precio_max si es menor a 1 millón (hay filtro aplicado)
    if (filtros.precio_max > 0 && filtros.precio_max < 1000000) {
      newSearchParams.set('precio_max', String(filtros.precio_max));
    }
    if (filtros.orden && filtros.orden !== 'destacados') newSearchParams.set('orden', filtros.orden);
    if (filtros.categoria && filtros.categoria !== 'Todos') newSearchParams.set('categoria', filtros.categoria);
    
    setSearchParams(newSearchParams);
  }, [busqueda, categoriaFiltro, ordenamiento, precioMinAplicado, precioMaxAplicado, precioMaxDinamico, setSearchParams]);

  // Los productos ya vienen filtrados y paginados del servidor
  const productosMostrados = allProducts;

  // Calcular paginación con count del servidor
  const totalPaginas = Math.ceil(count / PRODUCTOS_POR_PAGINA);

  // Marcas principales (las más populares)
  const marcasPrincipales = ['Todos', 'ROLEX', 'CASIO', 'G-SHOCK'];
  
  // Otras marcas disponibles (para el desplegable)
  const otrasMarcas = [
    'PATEK PHILIPPE',
    'RICHARD MILLE',
    'HUBLOT',
    'TAG HEUER',
    'AUDEMARS PIGUET',
    'TOMI',
    'CHENXI'
  ].sort();

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setCategoriaFiltro('Todos');
    setPrecioMinInput(0);
    setPrecioMaxInput(precioMaxDinamico);
    setPrecioMinAplicado(0);
    setPrecioMaxAplicado(precioMaxDinamico);
    setBusquedaInput('');
    setBusqueda('');
    setOrdenamiento('destacados');
    // Limpiar URL
    setSearchParams({});
    // Recargar sin filtros
    fetchProducts({ page: 1, page_size: 12, params: {} });
  };

  // Función para cambiar de página (mantiene filtros actuales)
  const irPagina = (nuevaPagina) => {
    const params = {
      q: busqueda || undefined,
      precio_min: precioMinAplicado > 0 ? precioMinAplicado : undefined,
      precio_max: precioMaxAplicado < precioMaxDinamico ? precioMaxAplicado : undefined,
      orden: ordenMap[ordenamiento] || undefined,
      categoria: categoriaFiltro !== 'Todos' ? categoriaFiltro.toLowerCase() : undefined,
    };

    // Actualizar URL con la nueva página
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', String(nuevaPagina));
    if (busqueda) newSearchParams.set('q', busqueda);
    if (precioMinAplicado > 0) newSearchParams.set('precio_min', String(precioMinAplicado));
    if (precioMaxAplicado < precioMaxDinamico) newSearchParams.set('precio_max', String(precioMaxAplicado));
    if (ordenamiento !== 'destacados') newSearchParams.set('orden', ordenamiento);
    if (categoriaFiltro !== 'Todos') newSearchParams.set('categoria', categoriaFiltro);
    
    setSearchParams(newSearchParams);
    
    fetchProducts({ page: nuevaPagina, page_size: 12, params });
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="products-header">
          <h1>Cargando productos...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page">
        <div className="products-header">
          <h1>Error al cargar productos</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* HEADER */}
      <div className="products-header">
        <div className="products-header-content">
          <h1>Catálogo de Productos</h1>
          <p>Descubre nuestra colección completa de relojes</p>
          <div className="products-stats">
            {count} {count === 1 ? 'producto' : 'productos'} encontrados
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="products-container">
        {/* BOTÓN DESPLEGABLE DE FILTROS (solo móvil) */}
        <button className="filters-toggle-btn" onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}>
          <span>Filtros</span>
          <svg 
            className={`filters-toggle-icon ${filtrosAbiertos ? 'open' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* FILTROS LATERALES */}
        <aside className={`products-filters ${filtrosAbiertos ? 'open' : ''}`}>
          <div className="filters-content">
            <div className="filters-header">
              <h3>Filtros</h3>
              {(categoriaFiltro !== 'Todos' || precioMinAplicado > 0 || precioMaxAplicado < precioMaxDinamico || busqueda || ordenamiento !== 'destacados') && (
                <button className="clear-filters-btn" onClick={limpiarFiltros}>
                  Limpiar
                </button>
              )}
            </div>

              {/* Búsqueda */}
              <div className="filter-group">
                <h4>Buscar</h4>
                <input
                  type="text"
                  className="search-filter-input"
                  placeholder="Presiona Enter para buscar..."
                  value={busquedaInput}
                  onChange={(e) => {
                    setBusquedaInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      aplicarFiltrosAURL({ q: busquedaInput });
                    }
                  }}
                />
              </div>

              {/* Marca */}
              <div className="filter-group">
                <h4>Marca</h4>
                <div className="filter-options-list">
                  {marcasPrincipales.map(marca => (
                    <label key={marca} className="filter-checkbox-label">
                      <input
                        type="radio"
                        name="marca"
                        checked={categoriaFiltro === marca}
                        onChange={() => {
                          aplicarFiltrosAURL({ categoria: marca });
                        }}
                      />
                      <span>{marca}</span>
                    </label>
                  ))}
                  
                  {/* Desplegable de otras marcas */}
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      padding: '8px',
                      background: '#f0f0f0',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      Otras Marcas
                    </summary>
                    <div style={{ marginTop: '8px', paddingLeft: '8px' }}>
                      {otrasMarcas.map(marca => (
                        <label key={marca} className="filter-checkbox-label">
                          <input
                            type="radio"
                            name="marca"
                            checked={categoriaFiltro === marca}
                            onChange={() => {
                              aplicarFiltrosAURL({ categoria: marca });
                            }}
                          />
                          <span>{marca}</span>
                        </label>
                      ))}
                    </div>
                  </details>
                </div>
              </div>

              {/* Rango de Precio */}
              <div className="filter-group">
                <h4>Rango de Precio</h4>
                <div className="price-range-display">
                  <span>${precioMinInput.toLocaleString()}</span>
                  <span>${precioMaxInput.toLocaleString()}</span>
                </div>
                <div className="price-slider-container" ref={priceTrackRef}>
                  <input
                    type="range"
                    min={0}
                    max={precioMaxDinamico}
                    value={precioMinInput}
                    className="price-slider price-slider-min"
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), precioMaxInput - 1000);
                      setPrecioMinInput(value);
                    }}
                    onMouseUp={(e) => {
                      aplicarFiltrosAURL({ precio_min: Number(e.target.value) });
                    }}
                    onTouchEnd={(e) => {
                      aplicarFiltrosAURL({ precio_min: Number(e.target.value) });
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={precioMaxDinamico}
                    value={precioMaxInput}
                    className="price-slider price-slider-max"
                    onChange={(e) => {
                      const value = Math.max(Number(e.target.value), precioMinInput + 1000);
                      setPrecioMaxInput(value);
                    }}
                    onMouseUp={(e) => {
                      aplicarFiltrosAURL({ precio_max: Number(e.target.value) });
                    }}
                    onTouchEnd={(e) => {
                      aplicarFiltrosAURL({ precio_max: Number(e.target.value) });
                    }}
                  />
                </div>
              </div>

              {/* Ordenamiento */}
              <div className="filter-group">
                <h4>Ordenar por</h4>
                <select
                  className="sort-select-filter"
                  value={ordenamiento}
                  onChange={(e) => {
                    aplicarFiltrosAURL({ orden: e.target.value });
                  }}
                >
                  <option value="destacados">Destacados</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                  <option value="nombre-asc">Nombre: A-Z</option>
                  <option value="nombre-desc">Nombre: Z-A</option>
                </select>
              </div>
            </div>
        </aside>

        {/* GRID DE PRODUCTOS */}
        <div className="products-grid-container">
          {productosMostrados.length === 0 && !loading ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '3rem',
              color: '#666'
            }}>
              <h3>No se encontraron productos</h3>
              <p>Intenta ajustar los filtros o buscar algo diferente</p>
            </div>
          ) : (
            <div className="products-grid">
            {productosMostrados.map(product => (
            <div key={product.id} className="product-card">
              <div className={`product-badge ${product.badge.toLowerCase()}`}>
                {product.badge}
              </div>
              
              <Link to={`/product/${product.id}`} className="product-image">
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.src = '/logo192.png';
                  }}
                />
                <div className="product-actions">
                  <button 
                    className={`wishlist-btn ${isFavorite(product.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Enviamos el objeto completo del producto para que el contexto tenga toda la info
                      toggleFavorite(product);
                    }}
                  >
                    {isFavorite(product.id) ? '❤️' : '♡'}
                  </button>
                </div>
              </Link>
              
              <div className="product-info">
                <h3>{product.name}</h3>
                {product.description && (
                  <p 
                    className="product-desc-short"
                    dangerouslySetInnerHTML={{
                      __html: product.description.slice(0, 100) + '...'
                    }}
                  />
                )}
                <div className="product-pricing">
                  <span className="product-price">${product.price.toLocaleString()}</span>
                </div>
                <div className="product-actions-bottom">
                  <button 
                    className="add-to-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                      setIsCartOpen(true);
                    }}
                    disabled={product.stock === 0}
                  >
                    {product.stock > 0 ? (
                      <>
                        <img 
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0xOSAyMGMwIDEuMTEtLjg5IDItMiAyYTIgMiAwIDAgMS0yLTJjMC0xLjExLjg5LTIgMi0yYTIgMiAwIDAgMSAyIDJNNyAxOGMtMS4xMSAwLTIgLjg5LTIgMmEyIDIgMCAwIDAgMiAyYzEuMTEgMCAyLS44OSAyLTJzLS44OS0yLTItMm0uMi0zLjM3bC0uMDMuMTJjMCAuMTQuMTEuMjUuMjUuMjVIMTl2Mkg3YTIgMiAwIDAgMS0yLTJjMC0uMzUuMDktLjY4LjI0LS45NmwxLjM2LTIuNDVMMyA0SDFWMmgzLjI3bC45NCAySDIwYy41NSAwIDEgLjQ1IDEgMWMwIC4xNy0uMDUuMzQtLjEyLjVsLTMuNTggNi40N2MtLjM0LjYxLTEgMS4wMy0xLjc1IDEuMDNIOC4xek04LjUgMTFIMTBWOUg3LjU2ek0xMSA5djJoM1Y5em0zLTFWNmgtM3Yyem0zLjExIDFIMTV2Mmgxem0xLjY3LTNIMTV2MmgyLjY3ek02LjE0IDZsLjk0IDJIMTBWNnoiLz48L3N2Zz4="
                          alt="Cart"
                          style={{ width: '20px', height: '20px' }}
                        />
                      </>
                    ) : 'No hay stock'}
                  </button>
                  <Link 
                    to={`/product/${product.id}`}
                    className="view-details-btn"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
          </div>
          )}

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="pagination">
              <button
                onClick={() => {
                  irPagina(currentPage - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1 || loading}
                className="pagination-btn"
              >
                ← Anterior
              </button>
              
              {(() => {
                const maxVisible = 8;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPaginas, startPage + maxVisible - 1);
                
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => {
                        irPagina(i);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
                      disabled={loading}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
              
              <button
                onClick={() => {
                  irPagina(currentPage + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPaginas || loading}
                className="pagination-btn"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
