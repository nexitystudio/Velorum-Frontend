// 🏠 **HOME.JS** - PÁGINA DE INICIO (SIN NAVBAR)

// 📦 IMPORTACIONES NECESARIAS
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import { productService } from './services';
import './Home.css';

function Home({ user, isLoggedIn }) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Detectar tamaño para condicionalmente ocultar el círculo
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const { addToCart, isInCart, getItemQuantity, setIsCartOpen } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Cargar productos destacados desde la API
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoadingProducts(true);
        // Obtener solo productos Premium (categoría más cara)
        const response = await productService.getAll({ page_size: 9999, categoria: 'premium' });
        const products = response.results || response;
        
        // Filtrar productos con stock disponible
        const productsWithStock = products.filter(p => 
          p.stock_ilimitado || (p.stock_disponible && p.stock_disponible > 0) || (p.stock && p.stock > 0)
        );
        
        // Ordenar por precio descendente (más caros primero)
        const sortedByPrice = productsWithStock.sort((a, b) => {
          const priceA = Number(a.precio || a.price || 0);
          const priceB = Number(b.precio || b.price || 0);
          return priceB - priceA;
        });
        
        // Tomar los 4 relojes Premium más caros
        const featured = sortedByPrice.slice(0, 4);
        
        console.log('Productos Premium destacados (más caros):', featured.map(p => ({ 
          nombre: p.nombre, 
          precio: p.precio || p.price 
        })));
        
        setFeaturedProducts(featured);
      } catch (error) {
        console.error('Error al cargar productos destacados:', error);
        setFeaturedProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadFeaturedProducts();
  }, []);
  
  // Array de imágenes de relojes elegantes - RELOJES REALES
  const watchImages = [
    '/Hombre/Rolex Submarino.png', // Rolex Submariner icónico
    '/Mujer/Cartier oro 18k.png', // Cartier oro para mujer
    '/Hombre/Patek Philippe.png', // Patek Philippe lujo
    '/Mujer/Chopard.png', // Chopard Happy Diamonds
    '/Hombre/Omega sterany.png', // Omega Seamaster
    '/Mujer/Tag heuer Aquaracer.png' // TAG Heuer deportivo
  ];

  // Cambiar imagen cada 4 segundos (más tiempo para apreciar cada reloj)
  useEffect(() => {
    if (isMobile) return; // no rotar en móvil para ahorrar recursos
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % watchImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMobile, watchImages.length]);

  // Texto del hero
  const heroText = {
    subtitle: "COLECCIÓN PREMIUM 2025",
    title: "El tiempo habla por ti",
    description: "Relojes suizos de lujo que combinan artesanía tradicional con diseño contemporáneo. Cada pieza cuenta tu historia única.",
    primaryButton: "Productos", // Cambiado de "Explorar Colección"
    // secondaryButton eliminado
  };

  // Elementos flotantes
  const floatingElements = [
    "🇨🇭 Swiss Made",
    "⚙️ Movimiento Suizo", 
    "💎 Cristal Zafiro",
    "🛡️ Garantía Vitalicia"
  ];

  return (
    <div className="home-minimal">
      {/* 🎭 HERO PRINCIPAL */}
      <section className="hero-minimal">
        {/* 🎬 VIDEO DE FONDO */}
        <video 
          className="hero-background-video"
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/videotest.webm" type="video/webm" />
          Tu navegador no soporta video HTML5.
        </video>

        {/* 📦 NUEVO CONTENIDO HERO */}
        <div className="hero-container">
          <div className="hero-text">
            <h1 className="hero-title" style={{ color: '#D3D3CE', textTransform: 'uppercase' }}>
              RELOJES<br />PREMIUM
            </h1>
            <p className="hero-description" style={{ color: '#D3D3CE' }}>Descubre el lujo moderno</p>
            <button className="btn-primary" style={{ color: '#D3D3CE' }} onClick={() => navigate('/products')}>Descubrir más</button>
          </div>
          <img
            src="/relojdelhero.png"
            alt="Reloj del Hero"
            className="hero-watch-image"
          />
        </div>
      </section>
 
      {/* ⭐ PRODUCTOS DESTACADOS */}
      <section className="featured-minimal">
        <div className="featured-container">
          <div className="section-header">
            <div>
              <h2>Relojes Destacados</h2>
              <p className="section-subtitle">Los más elegidos por nuestros clientes</p>
            </div>
            <button className="view-all-btn" onClick={() => navigate('/products')}>
              Ver catálogo completo →
            </button>
          </div>
          <div className="products-carousel">
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
                <p>Cargando productos...</p>
              </div>
            ) : featuredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
                <p>No hay productos disponibles</p>
              </div>
            ) : (
              featuredProducts.map(product => {
                const categoryName = product.categoria?.nombre || product.categoria || 'Premium';
                return (
              <div key={product.id} className="product-card-new">
                <div className={`product-badge ${String(categoryName).toLowerCase()}`}>
                  {categoryName}
                </div>
                <Link to={`/product/${product.id}`} className="product-image-new">
                  <img 
                    src={(product.imagenes && product.imagenes[0]) || product.imagen_url || product.image || '/logo192.png'} 
                    alt={product.nombre || product.name}
                    onError={(e) => { e.currentTarget.src = '/logo192.png'; }}
                  />
                  <div className="product-overlay">
                    <Link to={`/product/${product.id}`} className="quick-view-btn">
                      Vista rápida
                    </Link>
                    <button 
                      className={`wishlist-btn ${isFavorite && isFavorite(product.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite && toggleFavorite(product); }}
                      title={isFavorite && isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFavorite && isFavorite(product.id) ? '❤️' : '♡'}
                    </button>
                  </div>
                </Link>
                <div className="product-info-new">
                  <h4>{product.nombre || product.name}</h4>
                  <div className="product-pricing">
                    <p className="product-price">${Number(product.precio || product.price || 0).toLocaleString()}</p>
                  </div>
                  <button
                    className={`add-to-cart-new ${isInCart && isInCart(product.id) ? 'in-cart' : ''}`}
                    onClick={() => {
                      if (!isLoggedIn) {
                        navigate('/login');
                        return;
                      }
                      if (isInCart && isInCart(product.id)) {
                        setIsCartOpen(true);
                      } else {
                        // Normalizar producto antes de agregar al carrito
                        const normalizedProduct = {
                          ...product,
                          name: product.nombre || product.name,
                          price: Number(product.precio || product.price || 0),
                          image: (product.imagenes && product.imagenes[0]) || product.imagen_url || product.image
                        };
                        addToCart(normalizedProduct);
                        setIsCartOpen(true);
                      }
                    }}
                  >
                    {isInCart && isInCart(product.id)
                      ? `En carrito (${getItemQuantity(product.id)})`
                      : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            );
            }))}

          </div>
        </div>
      </section>

      {/* Sección de Instagram */}
      <section style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1a1d29 0%, #0f1419 100%)',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '20px',
            fontWeight: '700'
          }}>
            Síguenos en Instagram
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '30px',
            color: '#b0b0b0'
          }}>
            Descubre las últimas novedades y ofertas exclusivas
          </p>
          <a 
            href="https://www.instagram.com/velorum.oficial/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '15px 40px',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              boxShadow: '0 4px 15px rgba(240, 148, 51, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 148, 51, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(240, 148, 51, 0.3)';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="white"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @velorum.oficial
          </a>
        </div>
      </section>

      {/* Categories section removed per request */}
    </div>
  );
}

export default Home;