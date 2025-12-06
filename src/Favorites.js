// 💖 **FAVORITES.JS** - PÁGINA DE PRODUCTOS FAVORITOS
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from './FavoritesContext';
import { useCart } from './CartContext';
import './Favorites.css';

function Favorites() {
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const { addToCart, setIsCartOpen } = useCart();

  // 📦 TODOS LOS PRODUCTOS DISPONIBLES (combinando todas las colecciones)
  const allProducts = [
    // Productos originales
    {
      id: 1,
      name: "Elegante Clásico",
      price: 299.99,
      originalPrice: 399.99,
      image: "/Reloj1.png",
      rating: 4.8,
      reviews: 234,
      category: "Clásico",
      description: "Reloj elegante con diseño clásico perfecto para cualquier ocasión"
    },
    {
      id: 2,
      name: "Deportivo Moderno",
      price: 199.99,
      originalPrice: 249.99,
      image: "/Reloj2.png",
      rating: 4.6,
      reviews: 189,
      category: "Deportivo",
      description: "Reloj deportivo resistente al agua, ideal para actividades al aire libre"
    },
    {
      id: 3,
      name: "Lujo Premium",
      price: 599.99,
      originalPrice: 799.99,
      image: "/Reloj3.png",
      rating: 4.9,
      reviews: 156,
      category: "Lujo",
      description: "Reloj de lujo con acabados premium y materiales de alta calidad"
    },
    {
      id: 4,
      name: "Aventurero",
      price: 449.99,
      originalPrice: 549.99,
      image: "/Reloj4.png",
      rating: 4.7,
      reviews: 203,
      category: "Deportivo",
      description: "Diseñado para aventureros, con funciones avanzadas y resistencia extrema"
    },
    {
      id: 5,
      name: "Minimalista",
      price: 159.99,
      originalPrice: 199.99,
      image: "/Reloj5.png",
      rating: 4.5,
      reviews: 167,
      category: "Minimalista",
      description: "Diseño minimalista y moderno para el uso diario"
    },
    {
      id: 6,
      name: "Business Elite",
      price: 799.99,
      originalPrice: 999.99,
      image: "/Reloj6.png",
      rating: 4.9,
      reviews: 98,
      category: "Lujo",
      description: "La elección perfecta para reuniones de negocios y eventos formales"
    },
    // Productos de mujer
    {
      id: 7,
      name: "Elegancia Femenina",
      price: 249.99,
      originalPrice: 329.99,
      image: "/Reloj1.png",
      rating: 4.9,
      reviews: 187,
      category: "Elegante",
      description: "Diseño sofisticado y elegante para la mujer contemporánea"
    },
    {
      id: 8,
      name: "Rosé Gold Deluxe",
      price: 389.99,
      originalPrice: 499.99,
      image: "/Reloj2.png",
      rating: 4.8,
      reviews: 298,
      category: "Lujo",
      description: "Acabado en oro rosa con detalles cristales, perfecta para ocasiones especiales"
    },
    {
      id: 9,
      name: "Sport Chic",
      price: 179.99,
      originalPrice: 229.99,
      image: "/Reloj3.png",
      rating: 4.6,
      reviews: 156,
      category: "Deportivo",
      description: "Combina funcionalidad deportiva con un toque de elegancia femenina"
    },
    {
      id: 10,
      name: "Minimalist Pearl",
      price: 199.99,
      originalPrice: 259.99,
      image: "/Reloj4.png",
      rating: 4.7,
      reviews: 203,
      category: "Minimalista",
      description: "Diseño minimalista con detalles nacarados, perfecta para uso diario"
    },
    {
      id: 11,
      name: "Vintage Romance",
      price: 299.99,
      originalPrice: 399.99,
      image: "/Reloj5.png",
      rating: 4.5,
      reviews: 142,
      category: "Vintage",
      description: "Inspiración vintage con un toque romántico y moderno"
    },
    {
      id: 12,
      name: "Diamond Elite",
      price: 899.99,
      originalPrice: 1199.99,
      image: "/Reloj6.png",
      rating: 4.9,
      reviews: 89,
      category: "Lujo",
      description: "Reloj de lujo con incrustaciones de diamantes genuinos"
    }
  ];

  // 🔄 CARGAR FAVORITOS DESDE LOCALSTORAGE
  useEffect(() => {
    // Ya no necesitamos cargar desde localStorage porque el contexto lo maneja
  }, []);

  // 👁️ FUNCIÓN PARA VER DETALLES
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // 📦 FILTRAR PRODUCTOS FAVORITOS
  const favoriteProducts = allProducts.filter(product => 
    favorites.includes(product.id)
  );

  // 🧹 LIMPIAR TODOS LOS FAVORITOS - USAR LA FUNCIÓN DEL CONTEXTO
  const handleClearAllFavorites = () => {
    clearFavorites();
  };

  return (
    <div className="favorites-shell">
      <header className="fav-header enhanced">
        <div className="fav-title-block">
          <h2>Mis Favoritos</h2>
          <span className="fav-sub">{favoriteProducts.length ? `${favoriteProducts.length} ${favoriteProducts.length===1?'reloj':'relojes'}` : 'Sin favoritos'}</span>
        </div>
        <div className="action-cluster">
          <button className="cluster-btn ghost" onClick={()=>navigate('/products')}>Explorar</button>
          {favoriteProducts.length>0 && (
            <button className="cluster-btn primary" onClick={handleClearAllFavorites}>Limpiar</button>
          )}
        </div>
      </header>
      <div className="fav-content">
        {favoriteProducts.length === 0 ? (
          <div className="fav-empty modern-empty">
            <div className="empty-visual">
              <div className="empty-ring" />
              <div className="empty-icon">🤍</div>
            </div>
            <h3>No hay favoritos</h3>
            <p className="desc">Agregá relojes a tu lista para verlos rápido más tarde.</p>
            <div className="empty-actions refined">
              <button className="cluster-like accent" onClick={()=>navigate('/products')}>Explorar</button>
              <button className="cluster-like ghost" onClick={()=>navigate('/')}>Inicio</button>
            </div>
          </div>
        ) : (
          <>
            <div className="favorites-list modern">
              {favoriteProducts.map(item => (
                <div key={item.id} className="favorite-row modern" onClick={()=>handleProductClick(item.id)}>
                  <div className="fav-thumb">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e)=>{ e.target.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjhGOUZBIi8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjEyIiBzdHJva2U9IiNENUQ5REQiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'; }}
                    />
                  </div>
                  <div className="fav-info">
                    <h4>{item.name}</h4>
                    <p className="fav-cat">{item.category}</p>
                    <div className="fav-prices">
                      <span className="price">${item.price}</span>
                    </div>
                  </div>
                  <div className="fav-actions">
                    <button className="mini-btn add" onClick={(e)=>{
                      e.stopPropagation(); 
                      addToCart(item);
                      setIsCartOpen(true);
                    }}>Agregar</button>
                    <button className="mini-btn remove" onClick={(e)=>{e.stopPropagation(); removeFavorite(item.id);}} aria-label="Quitar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Favorites;
