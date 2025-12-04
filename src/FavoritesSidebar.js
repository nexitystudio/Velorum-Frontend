// 💖 **FAVORITESSIDEBAR.JS** - SIDEBAR DE FAVORITOS
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from './FavoritesContext';
import './FavoritesSidebar.css';

function FavoritesSidebar() {
  const navigate = useNavigate();
  const { 
    favorites, 
    isOpen, 
    toggleFavorites, 
    removeFavorite, 
    clearFavorites 
  } = useFavorites();

  // � VERIFICAR SI EL USUARIO ESTÁ LOGUEADO
  // Aceptamos varias claves posibles para el token para soportar inconsistencias
  const isUserLoggedIn = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken') || localStorage.getItem('refresh');
    const userInfo = localStorage.getItem('userInfo');
    return !!((token || refresh) && userInfo);
  };

  // 🛍️ Productos de muestra (asociados a imágenes existentes en /public/Hombre)
  const allProducts = [
    { id: 1, name: "Minimalist Steel", price: 2199, originalPrice: 2599, image: "/Hombre/Rolex%20Submarino.png", category: "luxury", badge: "Bestseller", reviews: 342 },
    { id: 2, name: "Poedagar 930", price: 1899, image: "/Hombre/poedagar%20930.png", category: "sport", badge: "Nuevo", reviews: 267 },
    { id: 3, name: "Classic Heritage", price: 3299, originalPrice: 3799, image: "/Hombre/Patek%20Philippe.png", category: "classic", badge: "Premium", reviews: 189 },
    { id: 4, name: "Sport Pro", price: 1599, image: "/Hombre/Casio%20G%20shock.png", category: "sport", badge: "Nuevo", reviews: 156 },
    { id: 5, name: "Elegant Gold", price: 4299, originalPrice: 4899, image: "/Hombre/Audemars%20piguet.png", category: "luxury", badge: "Premium", reviews: 298 },
    { id: 6, name: "Urban Style", price: 999, image: "/Hombre/Seiko%20mod.png", category: "casual", badge: "Oferta", reviews: 134 }
  ];

  // 💖 OBTENER PRODUCTOS FAVORITOS
  // Ahora siempre usamos los objetos completos almacenados en favorites
  const favoriteProducts = Array.isArray(favorites) ? favorites : [];

  // 🚫 Si no hay usuario logueado mostramos un prompt pequeño (y no el sidebar vacío)
  if (!isUserLoggedIn()) {
    return (
      <div className={`favorites-sidebar`}>
        <div className="favorites-header">
          <h2>Mis Favoritos</h2>
        </div>
        <div className="favorites-content" style={{padding: '24px'}}>
          <p style={{marginBottom: '12px'}}>Inicia sesión para ver y guardar tus favoritos.</p>
          <div style={{display:'flex',gap:'8px'}}>
            <button className="cluster-btn primary" onClick={()=>{ navigate('/login'); }}>{'Iniciar sesión'}</button>
            <button className="cluster-btn ghost" onClick={()=>{ navigate('/products'); }}>{'Explorar'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🌑 OVERLAY */}
      {isOpen && (
        <div 
          className="favorites-overlay"
          onClick={toggleFavorites}
        />
      )}

      {/* 💖 SIDEBAR DE FAVORITOS */}
      <div className={`favorites-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="favorites-header">
          <h2>
            <span className="favorites-icon" aria-hidden="true">
              {/* Heart icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61c-1.54-1.64-4.04-1.9-5.88-.49L12 6.4l-2.96-2.28c-1.84-1.41-4.34-1.15-5.88.49-1.64 1.74-1.55 4.52.2 6.19l2.89 2.73L12 21l5.75-7.47 2.89-2.73c1.75-1.67 1.84-4.45.2-6.19Z" />
              </svg>
            </span>
            Mis Favoritos
          </h2>
          <button 
            className="close-favorites-btn"
            onClick={toggleFavorites}
            aria-label="Cerrar favoritos"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="favorites-content">
          {favoriteProducts.length === 0 ? (
            <div className="empty-favorites">
              <div className="empty-icon" aria-hidden="true">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#c9a646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61c-1.54-1.64-4.04-1.9-5.88-.49L12 6.4l-2.96-2.28c-1.84-1.41-4.34-1.15-5.88.49-1.64 1.74-1.55 4.52.2 6.19L6 13" />
                  <path d="m8.5 15.5 3.5 5.5 5.75-7.47 2.89-2.73c1.75-1.67 1.84-4.45.2-6.19" />
                  <path d="M3 3l18 18" stroke="#d21818" />
                </svg>
              </div>
              <h3>Tu lista está vacía</h3>
              <p>Agrega productos a favoritos para verlos aquí</p>
              <button 
                className="browse-btn"
                onClick={() => {
                  toggleFavorites();
                  navigate('/products');
                }}
              >
                Explorar Productos
              </button>
            </div>
          ) : (
            <>
              <div className="favorites-items">
                {favoriteProducts.map(product => (
                  <div key={product.id} className="favorite-item">
                    <div className="favorite-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjhGOUZBIi8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjgiIHN0cm9rZT0iI0Q1RDlERCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                    </div>
                    <div className="favorite-details">
                      <div className="favorite-name-row">
                        <h4 className="favorite-name">{product.name}</h4>
                        <span className="favorite-badge" aria-label="Marcado como favorito">Favorito</span>
                      </div>
                      <div className="favorite-price">
                        <span className="current-price">${product.price.toLocaleString()}</span>
                      </div>
                      <div className="favorite-rating">
                        <span className="stars">★★★★★</span>
                        <span className="reviews">({product.reviews})</span>
                      </div>
                    </div>
                    <div className="favorite-actions">
                      <button
                        className="view-product-btn"
                        onClick={() => {
                          toggleFavorites();
                          navigate(`/product/${product.id}`);
                        }}
                        title="Ver producto"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button
                        className="remove-favorite-btn"
                        onClick={() => removeFavorite(product.id)}
                        title="Quitar de favoritos"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 6l1 14c.06 1 1 2 2 2h8c1 0 1.94-1 2-2l1-14"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="favorites-footer">
                <div className="favorites-summary">
                  <p>{favoriteProducts.length} producto{favoriteProducts.length !== 1 ? 's' : ''} guardado{favoriteProducts.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="favorites-actions">
                  <button 
                    className="clear-favorites-btn"
                    onClick={clearFavorites}
                  >
                    Limpiar Lista
                  </button>
                  <button 
                    className="continue-browsing-btn"
                    onClick={() => {
                      toggleFavorites();
                      navigate('/products');
                    }}
                  >
                    Seguir Explorando
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default FavoritesSidebar;
