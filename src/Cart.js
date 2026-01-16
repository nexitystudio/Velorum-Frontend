// 🛒 **CART.JS** - COMPONENTE DEL CARRITO DE COMPRAS
import React, { useMemo, useState } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, fetchWithAuth } from './services';
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
    setIsCartOpen,
    descuentoAplicado,
    setDescuentoAplicado
  } = useCart();

  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const [validandoCodigo, setValidandoCodigo] = useState(false);

  // CONFIGURACIÓN DE NIVELES DE PROMOCIONES
  const PROMO_LEVELS = [
    { 
      threshold: 70000, 
      reward: 'Envío Gratis', 
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h5l3 3v5h-2m-4 0H2"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
      type: 'shipping' 
    },
    { 
      threshold: 120000, 
      reward: '10% Descuento', 
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2"/><circle cx="16" cy="16" r="6"/><path d="M12 16h8"/></svg>,
      type: 'discount', 
      value: 10 
    },
    { 
      threshold: 170000, 
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

  const validarCodigoDescuento = async () => {
    if (!codigoDescuento.trim()) {
      setErrorCodigo('Ingresa un código de descuento');
      return;
    }

    setValidandoCodigo(true);
    setErrorCodigo('');

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/market/validar-codigo-descuento/`, {
        method: 'POST',
        body: JSON.stringify({ codigo: codigoDescuento.trim().toUpperCase() })
      });

      const result = await response.json();

      if (response.ok && result.valido) {
        setDescuentoAplicado({
          codigo: result.codigo,
          porcentaje: result.porcentaje,
          descripcion: result.descripcion
        });
        setErrorCodigo('');
      } else {
        setErrorCodigo(result.mensaje || 'Código de descuento inválido');
        setDescuentoAplicado(null);
      }
    } catch (error) {
      setErrorCodigo('Error al validar el código. Intenta nuevamente.');
      setDescuentoAplicado(null);
    } finally {
      setValidandoCodigo(false);
    }
  };

  const eliminarDescuento = () => {
    setDescuentoAplicado(null);
    setCodigoDescuento('');
    setErrorCodigo('');
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
                <button className="cluster-like accent" onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) { window.open('/products', '_blank'); return; }
                  handleContinueShopping();
                }} onAuxClick={() => { window.open('/products', '_blank'); }}>Explorar</button>
                <button className="cluster-like ghost" onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) { window.open('/', '_blank'); return; }
                  setIsCartOpen(false); navigate('/');
                }} onAuxClick={() => { window.open('/', '_blank'); }}>Inicio</button>
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
                  {/* Código de descuento */}
                  <div className="discount-section" style={{ margin: '0 0 15px 0', padding: '0 0 15px 0', borderBottom: '1px solid #e2e8f0' }}>
                    {!descuentoAplicado ? (
                      <div className="discount-input-group" style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Código de descuento"
                          value={codigoDescuento}
                          onChange={(e) => setCodigoDescuento(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && validarCodigoDescuento()}
                          style={{
                            padding: '10px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '13px',
                            flex: 1,
                            color: '#000000'
                          }}
                        />
                        <button
                          onClick={validarCodigoDescuento}
                          disabled={validandoCodigo}
                          style={{
                            padding: '10px 16px',
                            background: '#0f172a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: validandoCodigo ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            opacity: validandoCodigo ? 0.6 : 1
                          }}
                        >
                          {validandoCodigo ? '...' : 'Aplicar'}
                        </button>
                      </div>
                    ) : (
                      <div className="discount-applied" style={{
                        background: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#155724', fontSize: '13px' }}>
                            {descuentoAplicado.codigo} aplicado
                          </div>
                          <div style={{ fontSize: '11px', color: '#155724' }}>
                            {descuentoAplicado.porcentaje}% de descuento
                          </div>
                        </div>
                        <button
                          onClick={eliminarDescuento}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#155724',
                            cursor: 'pointer',
                            fontSize: '18px',
                            lineHeight: '1'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {errorCodigo && (
                      <div style={{ color: '#dc3545', fontSize: '11px', marginTop: '5px' }}>
                        {errorCodigo}
                      </div>
                    )}
                  </div>
                  
                  {/* Mostrar descuento por código si está aplicado */}
                  {descuentoAplicado && (
                    <div className="row discount">
                      <span className="lbl">Descuento ({descuentoAplicado.porcentaje}%)</span>
                      <span className="val">-${(getTotalPrice() * descuentoAplicado.porcentaje / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
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
                        
                        // Aplicar descuento por código primero
                        if (descuentoAplicado) {
                          finalTotal = finalTotal * (1 - descuentoAplicado.porcentaje / 100);
                        }
                        
                        // Aplicar descuento de promoción
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
                  <button className="summary-btn ghost" onClick={(e) => {
                    if (e.metaKey || e.ctrlKey) { window.open('/products', '_blank'); return; }
                    handleContinueShopping();
                  }} onAuxClick={() => { window.open('/products', '_blank'); }}>Seguir Comprando</button>
                    <button className="summary-btn accent" onClick={(e) => {
                      if (e.metaKey || e.ctrlKey) { window.open('/checkout', '_blank'); return; }
                      handleCheckout();
                    }} onAuxClick={() => { window.open('/checkout', '_blank'); }}>Finalizar</button>
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
                <button className="modal-btn primary" onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) { window.open('/login', '_blank'); return; }
                  handleLoginRedirect();
                }} onAuxClick={() => { window.open('/login', '_blank'); }}>
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
