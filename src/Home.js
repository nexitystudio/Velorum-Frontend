// 🏠 **HOME.JS** - PÁGINA DE INICIO (SIN NAVBAR)

// 📦 IMPORTACIONES NECESARIAS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        const products = await productService.getAll();
        
        // Filtrar productos con stock disponible
        const productsWithStock = products.filter(p => 
          p.stock_ilimitado || (p.stock_disponible && p.stock_disponible > 0) || (p.stock && p.stock > 0)
        );
        
        // Intentar filtrar productos en el rango de $50,000 a $100,000
        let productsInRange = productsWithStock.filter(p => {
          const price = Number(p.precio || p.price || 0);
          return price >= 50000 && price <= 100000;
        });
        
        // Si no hay productos en ese rango, usar todos los productos con stock
        const finalProducts = productsInRange.length > 0 ? productsInRange : productsWithStock;
        
        // Seleccionar 1 producto por categoría (máximo 4)
        const categorias = {};
        const featured = [];
        
        for (const product of finalProducts) {
          const categoria = product.categoria?.nombre || product.categoria || 'Sin categoría';
          if (!categorias[categoria] && featured.length < 4) {
            categorias[categoria] = true;
            featured.push(product);
          }
        }
        
        // Si hay menos de 4, completar con productos adicionales que tengan stock
        if (featured.length < 4) {
          const remaining = finalProducts.filter(p => !featured.includes(p)).slice(0, 4 - featured.length);
          featured.push(...remaining);
        }
        
        setFeaturedProducts(featured);
      } catch (error) {
        console.error('Error cargando productos destacados:', error);
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
              PREMIUM<br />WATCHES
            </h1>
            <p className="hero-description" style={{ color: '#D3D3CE' }}>Discover Modern Luxury</p>
            <button className="btn-primary" style={{ color: '#D3D3CE' }} onClick={() => navigate('/products')}>Shop Now</button>
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
                <div className="product-image-new" onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: 'pointer' }}>
                  <img 
                    src={(product.imagenes && product.imagenes[0]) || product.imagen_url || product.image || '/logo192.png'} 
                    alt={product.nombre || product.name}
                    onError={(e) => { e.currentTarget.src = '/logo192.png'; }}
                  />
                  <div className="product-overlay">
                    <button className="quick-view-btn" onClick={() => navigate(`/product/${product.id}`)}>
                      Vista rápida
                    </button>
                    <button 
                      className={`wishlist-btn ${isFavorite && isFavorite(product.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite && toggleFavorite(product); }}
                      title={isFavorite && isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFavorite && isFavorite(product.id) ? '❤️' : '♡'}
                    </button>
                  </div>
                </div>
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

      {/* Categories section removed per request */}
    </div>
  );
}

export default Home;