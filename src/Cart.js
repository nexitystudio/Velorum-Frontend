// 🛒 **CART.JS** - COMPONENTE DEL CARRITO DE COMPRAS
import React, { useMemo, useState } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

function Cart() {
  const {
    cartItems,
    isCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    setIsCartOpen
  } = useCart();

  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // CONFIGURACIÓN DE NIVELES DE PROMOCIONES
  const PROMO_LEVELS = [
    { 
      threshold: 50000, 
      reward: 'Envío Gratis', 
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h5l3 3v5h-2m-4 0H2"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
      type: 'shipping' 
    },
    { 
      threshold: 100000, 
      reward: '10% Descuento', 
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2"/><circle cx="16" cy="16" r="6"/><path d="M12 16h8"/></svg>,
      type: 'discount', 
      value: 10 
    },
    { 
      threshold: 150000, 
      reward: 'Caja para Reloj', 
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
      type: 'gift' 
    }
  ];

  // 📊 CALCULAR ESTADO DE PROMOCIONES
  const promoStatus = useMemo(() => {
    const total = getTotalPrice();
    const unlockedRewards = [];
    let nextLevel = null;
    let progress = 0;
    const maxThreshold = PROMO_LEVELS[PROMO_LEVELS.length - 1].threshold;

    for (let i = 0; i < PROMO_LEVELS.length; i++) {
      const level = PROMO_LEVELS[i];
      if (total >= level.threshold) {
        unlockedRewards.push(level);
      } else {
        nextLevel = level;
        break;
      }
    }

    // Calcular progreso basado en el total de la barra completa
    if (total > 0) {
      progress = (total / maxThreshold) * 100;
    }

    return { unlockedRewards, nextLevel, progress, total };
  }, [cartItems]);

  const handleCheckout = () => {
    // 🛒 VERIFICAR QUE HAY PRODUCTOS EN EL CARRITO
    if (cartItems.length === 0) {
      alert('⚠️ No tienes productos en el carrito');
      return;
    }
    
    // ✅ REDIRIGIR AL PROCESO DE CHECKOUT (ahora permite invitados)
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    setIsCartOpen(false);
    navigate('/login');
  };

  const handleContinueShopping = () => {
    setIsCartOpen(false);
    navigate('/products');
  };

  return (
    <>
      {isCartOpen && <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />}
      <div className={`cart-sidebar modern ${isCartOpen ? 'open' : ''}`}>        
        <div className="cart-header enhanced">
          <div className="cart-title-block">
            <h2>Mi Carrito</h2>
            <span className="cart-sub">{getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'}</span>
          </div>
          <div className="action-cluster">
            {cartItems.length > 0 && (
              <button className="cluster-btn ghost" onClick={clearCart}>Vaciar</button>
            )}
            <button className="cluster-btn icon" onClick={() => setIsCartOpen(false)} aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 🎁 BARRA DE PROMOCIONES PROGRESIVAS */}
        {cartItems.length > 0 && (
          <div className="promo-progress-container">
            <div className="promo-header" style={{ marginBottom: '30px' }}>
              <span className="promo-title">Beneficios Desbloqueables</span>
              {promoStatus.nextLevel && (
                <span className="promo-remaining" style={{ fontSize: '0.53rem' }}>
                  Faltan ${(promoStatus.nextLevel.threshold - promoStatus.total).toFixed(0)} para {promoStatus.nextLevel.reward}
                </span>
              )}
              {!promoStatus.nextLevel && promoStatus.total > 0 && (
                <span className="promo-completed" style={{ fontSize: '0.53rem' }}>
                  ¡Todos los beneficios desbloqueados!
                </span>
              )}
            </div>

            <div className="promo-bar-wrapper">
              <div className="promo-bar-track">
                <div 
                  className="promo-bar-fill" 
                  style={{ width: `${Math.min(promoStatus.progress, 100)}%` }}
                />
                {PROMO_LEVELS.map((level, index) => {
                  const position = (level.threshold / PROMO_LEVELS[PROMO_LEVELS.length - 1].threshold) * 100;
                  const isUnlocked = promoStatus.total >= level.threshold;
                  return (
                    <div 
                      key={index}
                      className={`promo-milestone ${isUnlocked ? 'unlocked' : ''}`}
                      style={{ left: `${position}%` }}
                      title={`${level.reward} - $${level.threshold}`}
                    >
                      <span className="milestone-icon">{level.icon}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
  <div className="cart-content">
          {cartItems.length === 0 ? (
            <div className="cart-empty modern-empty">
              <div className="empty-visual">
                <div className="empty-ring" />
                <div className="empty-icon">🛒</div>
              </div>
              <h3>Tu carrito está vacío</h3>
              <p className="desc">Agrega productos para continuar con la compra.</p>
              <div className="empty-actions refined">
                <button className="cluster-like accent" onClick={handleContinueShopping}>Explorar</button>
                <button className="cluster-like ghost" onClick={() => { setIsCartOpen(false); navigate('/'); }}>Inicio</button>
              </div>
            </div>
          ) : (
            <>
              <div className="cart-items modern">
                {cartItems.map(item => {
                  const displayName = item.name && item.name.length > 28 ? item.name.slice(0,27) + '…' : item.name;
                  return (
                  <div key={item.id} className="cart-item modern">
                    <div className="cart-item-image">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => { e.target.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjhGOUZBIi8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjEyIiBzdHJva2U9IiNENUQ5REQiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'; }}
                      />
                    </div>
                    <div className="cart-item-info">
                      <h4 title={item.name}>{displayName}</h4>
                      <p className="cart-item-category">{item.category}</p>
                      <p className="cart-item-price">${item.price}</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-controls soft">
                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span className="quantity">{item.quantity}</span>
                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="remove-item-btn" onClick={() => removeFromCart(item.id)} aria-label="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )})}
                
                {/* Agregar caja de reloj como item cuando se desbloquea */}
                {promoStatus.unlockedRewards.find(r => r.type === 'gift') && (
                  <div className="cart-item modern promo-gift-item">
                    <div className="cart-item-image gift-box">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 12v10H4V12"/>
                        <path d="M22 7H2v5h20V7z"/>
                        <path d="M12 22V7"/>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                      </svg>
                    </div>
                    <div className="cart-item-info">
                      <h4>Caja para Reloj</h4>
                      <p className="cart-item-category">Regalo desbloqueado</p>
                      <p className="cart-item-price promo-free">GRATIS</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="promo-badge-lock">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="cart-summary modern">
                <div className="summary-totals">
                  <div className="row"><span className="lbl">Artículos</span><span className="val">{getTotalItems()}</span></div>
                  <div className="row"><span className="lbl">Subtotal</span><span className="val">${getTotalPrice().toFixed(2)}</span></div>
                  
                  {/* Mostrar descuento si está desbloqueado */}
                  {promoStatus.unlockedRewards.find(r => r.type === 'discount') && (
                    <div className="row discount">
                      <span className="lbl">Descuento 10%</span>
                      <span className="val">-${(getTotalPrice() * 0.10).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Mostrar envío */}
                  {promoStatus.unlockedRewards.find(r => r.type === 'shipping') ? (
                    <div className="row shipping-free">
                      <span className="lbl">Envío</span>
                      <span className="val free">GRATIS</span>
                    </div>
                  ) : (
                    <div className="row"><span className="lbl">Envío</span><span className="val">A calcular</span></div>
                  )}
                  
                  <div className="row total">
                    <span className="lbl">Total</span>
                    <span className="val">
                      ${(() => {
                        let finalTotal = getTotalPrice();
                        const discountReward = promoStatus.unlockedRewards.find(r => r.type === 'discount');
                        if (discountReward) {
                          finalTotal = finalTotal * (1 - discountReward.value / 100);
                        }
                        return finalTotal.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
                <div className="summary-actions">
                  <button className="summary-btn ghost" onClick={handleContinueShopping}>Seguir Comprando</button>
                  <button className="summary-btn accent" onClick={handleCheckout}>Finalizar</button>
                </div>
              </div>
            </>
          )}
  </div>
      </div>

      {/* 🔐 MODAL DE LOGIN REQUERIDO */}
      {showLoginModal && (
        <>
          <div className="cart-overlay" style={{zIndex: 10001}} onClick={() => setShowLoginModal(false)} />
          <div className="login-required-modal">
            <div className="modal-content">
              <div className="modal-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <h3>Inicia Sesión para Continuar</h3>
              <p>Para finalizar tu compra necesitas tener una cuenta. Tu carrito se mantendrá guardado.</p>
              <div className="modal-actions">
                <button className="modal-btn primary" onClick={handleLoginRedirect}>
                  Ir a Iniciar Sesión
                </button>
                <button className="modal-btn secondary" onClick={() => setShowLoginModal(false)}>
                  Seguir Comprando
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Cart;
