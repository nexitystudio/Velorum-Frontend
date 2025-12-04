// 🛍️ **PRODUCTDETAIL.JS** - PÁGINA DE DETALLES DEL PRODUCTO

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import { useFavorites } from './FavoritesContext';
import { useCart } from './CartContext';
import { productService } from './services';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const imageRef = useRef(null);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, setIsCartOpen, isInCart, getItemQuantity, updateQuantity } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getById(id);
        setProduct(data);
      } catch (error) {
        console.error('Error al cargar el producto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // 🛒 AGREGAR AL CARRITO
  const handleAddToCart = () => {
    if (!product) return;
    
    // Normalizar producto antes de agregar al carrito
    const normalizedProduct = {
      ...product,
      name: product.nombre || product.name || 'Producto',
      price: Number(product.precio || product.price || 0),
      image: (product.imagenes && product.imagenes.length > 0) ? product.imagenes[0] : (product.image || '/logo192.png')
    };
    
    const alreadyQty = getItemQuantity(product.id);
    if (isInCart(product.id)) {
      updateQuantity(product.id, alreadyQty + quantity);
    } else {
      addToCart(normalizedProduct, quantity);
    }
    setIsCartOpen(true);
  };

  // 💖 FAVORITO
  const handleToggleFavorite = () => {
    if (!product) return;
    
    // Normalizar el objeto del producto para que tenga la estructura esperada por FavoritesContext
    const normalizedProduct = {
      id: product.id,
      name: product.nombre || product.name || 'Producto',
      image: (product.imagenes && product.imagenes.length > 0) ? product.imagenes[0] : (product.image || '/logo192.png'),
      price: Number(product.precio || product.price) || 0,
      originalPrice: product.originalPrice || product.precio_original,
      category: product.categoria?.nombre || product.category || 'Relojes',
      badge: product.en_oferta ? 'Oferta' : (product.badge || 'Nuevo'),
      reviews: product.reviews || 0,
      description: product.descripcion || product.description || '',
      stock: product.stock_disponible || product.stock || 0
    };
    
    toggleFavorite(normalizedProduct);
  };

  // 🔍 ZOOM EN IMAGEN
  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Producto no encontrado</h2>
        <button onClick={() => navigate('/products')} className="back-btn">
          Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <button className="back-btn-minimal" onClick={() => navigate(-1)} aria-label="Volver">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        <span>Volver</span>
      </button>

      <div className="product-detail-container">
        {/* 🖼️ GALERÍA DE IMÁGENES */}
        <div className="product-gallery">
          <div 
            className={`main-image ${isZooming ? 'zooming' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={imageRef}
          >
            <img 
              src={Array.isArray(product.imagenes) && product.imagenes.length > 0 ? product.imagenes[selectedImage] : product.imagen_principal} 
              alt={product.nombre} 
              className="main-product-image"
              style={isZooming ? {
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transform: 'scale(2)'
              } : {}}
            />
          </div>
          <div className="image-thumbnails">
            {(Array.isArray(product.imagenes) && product.imagenes.length > 0 ? product.imagenes : [product.imagen_principal]).map((img, index) => (
              <div 
                key={index}
                className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={img} alt={`Vista ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="product-info-section">
          {/* 🏷️ ENCABEZADO DEL PRODUCTO */}
          <div className="product-header">
            {product.categoria && <span className="product-badge">{typeof product.categoria === 'object' ? product.categoria.nombre : product.categoria}</span>}
            <h1 className="product-title">{product.nombre}</h1>
          </div>

          {/* 💰 PRECIO */}
          <div className="price-section">
            <div className="current-price">${product.precio_final?.toLocaleString()}</div>
            {product.en_oferta && product.precio_oferta_proveedor && (
              <div className="original-price">${(product.precio_oferta_proveedor * 2).toLocaleString()}</div>
            )}
          </div>

          {/* ✨ CARACTERÍSTICAS DESTACADAS */}
          <div className="features-section">
            <h3>Características destacadas</h3>
            <ul className="features-list">
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Diseño elegante y moderno
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Alta calidad y durabilidad
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {product.stock_ilimitado ? 'Stock siempre disponible' : `Stock disponible: ${product.stock_disponible}`}
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Envío a todo el país
              </li>
            </ul>
          </div>

          {/* 🛒 SECCIÓN DE COMPRA */}
          <div className="purchase-section sticky-purchase">
            <div className="quantity-selector">
              <label>Cantidad:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-btn"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  onClick={() => setQuantity(product.stock_ilimitado ? quantity + 1 : Math.min(product.stock_disponible, quantity + 1))}
                  className="quantity-btn"
                  disabled={!product.stock_ilimitado && quantity >= product.stock_disponible}
                >
                  +
                </button>
              </div>
            </div>

            <div className="stock-info">
              {product.disponible ? (
                <span className="in-stock">✅ En stock {product.stock_ilimitado ? '(Ilimitado)' : `(${product.stock_disponible} disponibles)`}</span>
              ) : (
                <span className="out-stock">❌ Agotado</span>
              )}
            </div>

            <div className="action-buttons">
              <button 
                onClick={handleAddToCart}
                className={`add-to-cart-btn ${!product.disponible ? 'disabled' : ''}`}
                disabled={!product.disponible}
              >
                {isInCart(product.id) ? 'Actualizar carrito' : 'Agregar al carrito'} · ${(product.precio_final * quantity).toLocaleString()}
              </button>
              <button 
                onClick={handleToggleFavorite}
                className={`wishlist-btn-icon ${isFavorite(product.id) ? 'favorite-active' : ''}`}
                title={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                aria-label={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📖 DESCRIPCIÓN COMPLETA Y ESPECIFICACIONES */}
      <div className="product-details-tabs">
        <div className="tabs-container">
          <div className="tab-content">
            <div className="description-section">
              <h2>Descripción completa</h2>
              {product.descripcion ? (
                <div dangerouslySetInnerHTML={{ __html: product.descripcion }} />
              ) : (
                <p>Reloj de alta calidad con diseño elegante y acabados premium. Perfecto para cualquier ocasión.</p>
              )}
            </div>

            <div className="specifications-section">
              <h2>Especificaciones técnicas</h2>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Categoría:</span>
                  <span className="spec-value">{typeof product.categoria === 'object' ? product.categoria.nombre : (product.categoria || 'Relojes')}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Stock:</span>
                  <span className="spec-value">{product.stock_ilimitado ? 'Ilimitado' : product.stock_disponible}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Código:</span>
                  <span className="spec-value">{product.external_id || product.id}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Estado:</span>
                  <span className="spec-value">{product.disponible ? 'Disponible' : 'Agotado'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
