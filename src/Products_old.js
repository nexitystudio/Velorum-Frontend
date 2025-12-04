import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFavorites } from './FavoritesContext';
import { useCart } from './CartContext';
import './Products.css';
import { API_BASE_URL, fetchWithAuth } from './services';

function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  
  // 🔍 Resolver imagen según marca + modelo (normaliza y busca coincidencias)
  const resolveWatchImage = (marca, modelo) => {
    const key = `${marca || ''} ${modelo || ''}`.toLowerCase().trim();
    if(!key) return '/logo192.png';
    const map = {
      'audemars': '/Hombre/Audemars piguet.png',
      'audemars piguet': '/Hombre/Audemars piguet.png',
      'cartier cuero': '/Hombre/Cartier Cuero.png',
      'cartier metalic': '/Hombre/Cartier Metalic.png',
      'cartier oro': '/Mujer/Cartier oro 18k.png',
      'cartier': '/Hombre/Cartier Metalic.png',
      'casio g shock': '/Hombre/Casio G shock.png',
      'g shock protection': '/Hombre/G Shock protection.png',
      'casio water': '/Hombre/Casio Water resist.png',
      'casio': '/Hombre/Casio G shock.png',
      'hamilton automatic': '/Hombre/Hamilton automatic.png',
      'hamilton': '/Hombre/Hamilton automatic.png',
      'omega sterany': '/Hombre/Omega sterany.png',
      'omega constellation': '/Mujer/Omega complelltion.png',
      'omega': '/Hombre/Omega sterany.png',
      'patek philippe geneve': '/Mujer/Patek Philippe geneve.png',
      'patek philippe calatrava': '/Hombre/Patek Philippe.png',
      'patek philippe': '/Hombre/Patek Philippe.png',
      'patek': '/Hombre/Patek Philippe.png',
      'poedagar 930': '/Hombre/poedagar 930.png',
      'poedagar': '/Hombre/poedagar 930.png',
      'richard mille': '/Hombre/Richard Mille.png',
      'richard': '/Hombre/Richard Mille.png',
      'rolex submarino': '/Hombre/Rolex Submarino.png',
      'rolex': '/Hombre/Rolex Submarino.png',
      'seiko mod': '/Hombre/Seiko mod.png',
      'seiko': '/Hombre/Seiko mod.png',
      'tag heuer aquaracer': '/Mujer/Tag heuer Aquaracer.png',
      'tag heuer': '/Mujer/Tag heuer Aquaracer.png',
      'chopard': '/Mujer/Chopard.png'
    };
    // Búsqueda exacta primero
    if(map[key]) return map[key];
    // Luego buscar la clave cuyo texto esté incluido en key (más larga primero)
    const candidate = Object.keys(map)
      .sort((a,b)=> b.length - a.length)
      .find(k => key.includes(k));
    return candidate ? map[candidate] : '/logo192.png';
  };
  
  // Estado inicial vacío - se llenará desde la API
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Cargar productos desde el endpoint de market
        console.log('🔍 Cargando productos desde:', `${API_BASE_URL}/market/model/products/`);
        let res = await fetch(`${API_BASE_URL}/market/model/products/`);
        console.log('📡 Respuesta:', res.status, res.ok);
        if (res.ok) {
          const data = await res.json();
          console.log('📦 Data recibida:', data);
          const list = data.results || data || [];
          console.log('📋 Lista procesada:', list.length, 'productos');
          console.log('🔍 Es array?', Array.isArray(list));
          if (mounted && Array.isArray(list) && list.length > 0) {
            const mappedProducts = list.map(p => {
              // Las imágenes vienen como array de URLs
              let imagen = '/logo192.png';
              if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
                imagen = p.imagenes[0];
              }
              
              return {
                id: p.id,
                watch_id: p.id,
                id_backend: p.id,
                name: p.nombre || 'Producto',
                price: Number(p.precio) || 0,
                image: imagen,
                category: p.categoria?.nombre || p.categoria || 'general',
                badge: p.en_oferta ? 'Oferta' : 'Nuevo',
                reviews: 0,
                description: p.descripcion || '',
                stock: p.stock_disponible || 0
              };
            });
            console.log('✅ Productos mapeados:', mappedProducts.length);
            console.log('🔍 Primer producto:', mappedProducts[0]);
            setProducts(mappedProducts);
            return;
          }
        }

        // Si falla, intentar con autenticación
        res = await fetchWithAuth(`${API_BASE_URL}/market/model/products/`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          const list = data.results || data || [];
          if (mounted && Array.isArray(list) && list.length > 0) {
            setProducts(list.map(p => ({
              id: p.id,
              watch_id: p.id,
              id_backend: p.id,
              name: p.nombre || 'Producto',
              price: Number(p.precio) || 0,
              image: p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : '/logo192.png',
              category: p.categoria?.nombre || p.categoria || 'general',
              badge: p.en_oferta ? 'Oferta' : 'Nuevo',
              reviews: 0,
              description: p.descripcion || '',
              stock: p.stock_disponible || 0
            })));
            return;
          }
        }
      } catch (e) {
        console.error('❌ Error cargando productos desde backend:', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Map para marcar primera tarjeta por categoría
  const firstCategoryRendered = useRef({});

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById('cat-' + location.hash.substring(1));
      if (target) {
        setTimeout(()=> target.scrollIntoView({behavior:'smooth', block:'start'}), 80);
      }
    }
  }, [location]);

  return (
    <div className="products-page">
      {/* 🎯 HEADER DE PRODUCTOS */}
      <div className="products-header">
        <div className="products-header-content">
          <h1>Catálogo de Productos</h1>
          <p>Aquí verás todos nuestros relojes</p>
          <div className="products-stats">
            {products.length} productos disponibles
          </div>
        </div>
      </div>

      {/* 📦 CONTENEDOR PRINCIPAL */}
      <div className="products-container">
        {/* 🛍️ GRID DE PRODUCTOS - 3 COLUMNAS */}
        <div className="products-grid">
          {products.map(product => {
            // Convertir category a string y manejar null/undefined
            const cat = product.category ? String(product.category).toLowerCase() : 'general';
            const anchorId = !firstCategoryRendered.current[cat] ? 'cat-' + cat : undefined;
            if (!firstCategoryRendered.current[cat]) firstCategoryRendered.current[cat] = true;
            return (
            <div key={product.id} className="product-card" id={anchorId}>
              {/* 🏷️ BADGE */}
              <div className={`product-badge ${product.originalPrice ? 'discount' : (product.badge || 'nuevo').toLowerCase()}`}>
                {product.originalPrice ? `-${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%` : (product.badge || 'Nuevo')}
              </div>
              
              {/* 🖼️ IMAGEN */}
              <div className="product-image">
                <img
                  src={product.image}
                  alt={product.name || 'Reloj de lujo'}
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMjI1IDE5MEgxNzVMMTUwIDIxMEwxMTAgMTcwTDEyNSAxNTVMMTUwIDE4MEwxNjUgMTY1SDIyNVYxOTBaIiBmaWxsPSIjY2NjIi8+PC9zdmc+';
                  }}
                />
                <div className="product-actions">
                  <button className="quick-view-btn" onClick={() => navigate(`/product/${product.id}`)}>
                    👁️
                  </button>
                  <button 
                    className={`wishlist-btn ${isFavorite(product.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product);
                    }}
                    title={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    {isFavorite(product.id) ? '❤️' : '♡'}
                  </button>
                </div>
              </div>
              
              {/* 📋 INFORMACIÓN */}
              <div className="product-info">
                <div className="product-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating-text">({product.reviews})</span>
                </div>
                <h3>{product.name}</h3>
                {product.description && (
                  <p className="product-desc-short">
                    {product.description}
                  </p>
                )}
                <div className="product-pricing">
                  <span className="product-price">${product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="original-price">${product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                <div className="product-actions-bottom">
                  <button 
                    className="add-to-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    🛒 Agregar al Carrito
                  </button>
                  <button 
                    className="view-details-btn"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          )})}
          {/* Anchor vacío para smart (no hay productos aún) */}
          <div id="cat-smart" style={{width:'100%', gridColumn:'1 / -1', padding:'40px 0', textAlign:'center', opacity:.7}}>
            Próximamente relojes inteligentes.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;