import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { CartProvider, useCart } from './CartContext';
import { SearchProvider } from './SearchContext';
import { ProductsProvider } from './ProductsContext';
import SearchBar from './SearchBar';
import Cart from './Cart';
import FavoritesSidebar from './FavoritesSidebar';
import Home from './Home';
import Login from './Login';
import Products from './Products';
import ProductDetail from './ProductDetail';
import About from './About';
import Favorites from './Favorites';
import Profile from './Profile';
import Orders from './Orders';
import AdminPanel from './AdminPanel';
import AdminOrderPanel from './AdminOrderPanel';
import Checkout from './Checkout';
import CheckoutSuccess from './CheckoutSuccess';
import CheckoutPending from './CheckoutPending';
import CheckoutFailure from './CheckoutFailure';
import './App.css';

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [isDarkMode, setIsDarkMode] = useState(false); // Eliminado: no usado
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  // 🔒 CERRAR DROPDOWN AL CLIC FUERA
  useEffect(() => {
    if (!showUserDropdown) return;
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  // 📱 Menú móvil
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false); // cerrar si vuelve a desktop
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateAndClose = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };
  
  // 💖 USAR EL CONTEXTO DE FAVORITOS
  const { getFavoritesCount, toggleFavorites } = useFavorites();
  
  // 🛒 USAR EL CONTEXTO DEL CARRITO
  const { getTotalItems, toggleCart } = useCart();

  // 📦 Estado para modales / contenido del footer
  const [footerInfo, setFooterInfo] = useState({ type: null });

  const openFooterInfo = (type) => setFooterInfo({ type });
  const closeFooterInfo = () => setFooterInfo({ type: null });

  // Newsletter handler removed (newsletter UI removed)

  // Contenidos dinámicos del footer
  const renderFooterContent = () => {
    switch (footerInfo.type) {
      case 'envios':
        return (
          <div>
            <h2>Tarifas de Envío</h2>
            <ul style={{lineHeight:'1.6'}}>
              <li><strong>CABA / GBA Norte:</strong> $4.500 (24-48h)</li>
              <li><strong>GBA Sur / Oeste:</strong> $5.200 (48-72h)</li>
              <li><strong>Interior Provincia Buenos Aires:</strong> $6.000 (3-5 días)</li>
              <li><strong>Capitales del Interior:</strong> $7.500 (4-6 días)</li>
              <li><strong>Regiones Patagónicas / NOA / NEA:</strong> $8.900 (5-8 días)</li>
            </ul>
            <p style={{fontSize:'0.85rem',opacity:.8}}>Los tiempos se expresan en días hábiles. En fechas especiales (Hot Sale / Black Friday) pueden extenderse +24/48h.</p>
          </div>
        );
      case 'devoluciones':
        return (
          <div>
            <h2>Política de Devoluciones</h2>
            <p>Tenés hasta <strong>30 días corridos</strong> desde la recepción para solicitar devolución o cambio.</p>
            <ol style={{lineHeight:'1.6'}}>
              <li>El producto debe estar sin uso, con films, etiquetas y embalaje original.</li>
              <li>Escribinos a <a href="mailto:velorum.oficial@gmail.com">velorum.oficial@gmail.com</a> con asunto: DEVOLUCIÓN + Nº de pedido.</li>
              <li>Te enviamos etiqueta / coordinamos retiro. Una vez recibido y controlado emitimos reintegro (hasta 7 días hábiles).</li>
            </ol>
            <p style={{fontSize:'0.85rem',opacity:.8}}>Productos personalizados o con signos de manipulación indebida quedan excluidos.</p>
          </div>
        );
      case 'careers':
        return (
          <div>
            <h2>Carreras</h2>
            <p>Próximamente publicaremos oportunidades para sumarte al equipo Velorum (áreas: producto, marketing, e‑commerce y atención). Mandanos CV espontáneo a <a href="mailto:velorum.oficial@gmail.com?subject=CV%20Velorum">velorum.oficial@gmail.com</a>.</p>
          </div>
        );
      default:
        return null;
    }
  };

  // (Eliminada función toggleTheme: no usada)

  // 🔍 VERIFICAR SI EL USUARIO ESTÁ LOGUEADO (al cargar la página)
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      if (token && userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo);
          setUser(parsedUser);
          setIsLoggedIn(true);
        } catch (error) {
          // Si hay error, limpiar datos
          localStorage.removeItem('userInfo');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };
    
    checkAuth();
    
    // 📡 ESCUCHAR CAMBIOS EN EL STORAGE (cuando se hace login)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    const handleUserChanged = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleUserChanged);
    
    // 🧹 LIMPIAR EL LISTENER AL DESMONTAR
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, []);

  // 🚪 CERRAR SESIÓN
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setShowUserDropdown(false);  // ➕ Cerrar dropdown
    
    // 📋 ELIMINAR TOKENS Y DATOS DE SESIÓN
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userInfo');
    
    // 🧹 LIMPIAR DATOS DE USUARIO (carrito y favoritos actuales)
    // Esto forzará a que se carguen datos vacíos para usuario guest
    
    // 🔄 DISPARAR EVENTO PARA QUE LOS CONTEXTOS SE ACTUALICEN
    window.dispatchEvent(new Event('userChanged'));
    window.dispatchEvent(new Event('userLoggedOut'));
    
    navigate('/');  // 🏠 Ir al inicio
  };

  // 🎯 Mostrar botón scroll top al bajar
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTopFast = () => {
    window.scrollTo({ top:0, left:0, behavior:'smooth' });
  };

  return (
    <div>
      {/* 🧭 NAVBAR - BARRA DE NAVEGACIÓN SUPERIOR */}
      <nav className="modern-navbar">
        <div className="navbar-container">
          {isMobile && (
            <button
              aria-label="Abrir carrito"
              className="navbar-cart-mobile"
              onClick={toggleCart}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                color: '#D3D3CE'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {getTotalItems() > 0 && (
                <span style={{
                  background: '#c9a646',
                  color: '#1a1200',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {getTotalItems()}
                </span>
              )}
            </button>
          )}
          {/* 📍 SECCIÓN IZQUIERDA - Enlaces de navegación */}
          <div className="navbar-left">
            <button 
              className="nav-item"
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              INICIO
            </button>
            <button 
              className="nav-item"
              onClick={() => navigate('/about')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ACERCA DE
            </button>
            <button 
              className="nav-item"
              onClick={() => navigate('/products')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              PRODUCTOS
            </button>
          </div>
          
          {/* 🏷️ CENTRO - Logo CLICKEABLE */}
          <div className="navbar-center">
            <button 
              onClick={() => navigate('/')}
              className="logo-button nav-item"
              style={{ fontSize: '17px', fontWeight: '400', letterSpacing: '4px' }}
            >
              VELORUM
            </button>
          </div>
          
          {/* ⚙️ SECCIÓN DERECHA - Acciones */}
          <div className="navbar-right">
            {/* 🔍 BARRA DE BÚSQUEDA (solo desktop/tablet) */}
            {/* !isMobile && <SearchBar className="navbar-search" /> */}
            
            {/* �👤 USUARIO LOGUEADO */}
            {isLoggedIn ? (
              <div className="user-dropdown-container" ref={userDropdownRef}>
                <button 
                  className="user-text-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0xMiAyYTUgNSAwIDEgMCA1IDVhNSA1IDAgMCAwLTUtNW0wIDhhMyAzIDAgMSAxIDMtM2EzIDMgMCAwIDEtMyAzbTkgMTF2LTFhNyA3IDAgMCAwLTctN2gtNGE3IDcgMCAwIDAtNyA3djFoMnYtMWE1IDUgMCAwIDEgNS01aDRhNSA1IDAgMCAxIDUgNXYxeiIvPjwvc3ZnPg=="
                    alt="User"
                    width="20"
                    height="20"
                  />
                  <span className="user-name">
                    {user?.first_name || user?.username || 'Usuario'}
                  </span>
                  <svg 
                    className={`dropdown-arrow ${showUserDropdown ? 'open' : ''}`}
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                {showUserDropdown && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <strong>{user?.first_name || user?.username || 'Usuario'}</strong>
                    </div>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => {navigate('/profile'); setShowUserDropdown(false);}}>
                      Mi Perfil
                    </button>
                    <button className="dropdown-item" onClick={() => {navigate('/orders'); setShowUserDropdown(false);}}>
                      Mis Pedidos
                    </button>
                    {/* 🔧 MOSTRAR PANEL ADMIN SI EL USUARIO ES ADMIN U OPERADOR */}
                    {(user?.role === 'admin' || user?.role === 'operator') && (
                      <>
                        <hr className="dropdown-divider" />
                        <button className="dropdown-item admin-item" onClick={() => {navigate('/admin'); setShowUserDropdown(false);}}>
                          Administración
                        </button>
                      </>
                    )}
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 🔐 USUARIO NO LOGUEADO */
              <button 
                className={isMobile ? 'login-icon-btn' : 'login-text-btn'}
                onClick={() => navigate('/login')}
                aria-label="Iniciar sesión"
                title="Iniciar sesión"
              >
                {isMobile ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                ) : 'Iniciar sesión'}
              </button>
            )}
            
            {/* ❤️ BOTÓN DE FAVORITOS - SOLO PARA USUARIOS LOGUEADOS */}
            {isLoggedIn && (
              <button 
                className="icon-btn-minimal"
                onClick={toggleFavorites}
                title="Ver Favoritos"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {getFavoritesCount() > 0 && (
                  <span className="favorites-count">{getFavoritesCount()}</span>
                )}
              </button>
            )}
            
            {/* 🛒 BOTÓN DE CARRITO - SIEMPRE VISIBLE */}
            <button 
              className="icon-btn-minimal"
              onClick={toggleCart}
              title="Ver Carrito"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {getTotalItems() > 0 && (
                <span className="cart-count">{getTotalItems()}</span>
              )}
            </button>
          </div>
        </div>
      </nav>
      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu-overlay" role="dialog" aria-modal="true">
          <div className="mobile-menu-panel">
            <nav className="mobile-menu-nav">
              <button className="mobile-link" onClick={() => navigateAndClose('/')}>INICIO</button>
              <button className="mobile-link" onClick={() => navigateAndClose('/about')}>ACERCA DE</button>
              <button className="mobile-link" onClick={() => navigateAndClose('/products')}>PRODUCTOS</button>
              {isLoggedIn && (
                <>
                  <hr className="mobile-separator" />
                  <button className="mobile-link" onClick={() => navigateAndClose('/profile')}>MI PERFIL</button>
                  <button className="mobile-link" onClick={() => navigateAndClose('/orders')}>MIS PEDIDOS</button>
                  {(user?.role === 'admin' || user?.role === 'operator') && (
                    <button className="mobile-link" onClick={() => navigateAndClose('/admin')}>ADMINISTRACIÓN</button>
                  )}
                  <button className="mobile-link danger" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>CERRAR SESIÓN</button>
                </>
              )}
              {!isLoggedIn && (
                <button className="mobile-link" onClick={() => navigateAndClose('/login')}>INICIAR SESIÓN</button>
              )}
            </nav>
            <div className="mobile-quick-actions">
              {isLoggedIn && (
                <button className="quick-action" onClick={() => { toggleFavorites(); setMobileMenuOpen(false); }}>Favoritos ({getFavoritesCount()})</button>
              )}
              {/* 🛒 Carrito siempre visible en móvil */}
              <button className="quick-action" onClick={() => { toggleCart(); setMobileMenuOpen(false); }}>Carrito ({getTotalItems()})</button>
            </div>
          </div>
        </div>
      )}

      {/* 🗂️ SISTEMA DE RUTAS - QUÉ PÁGINA MOSTRAR */}
      <Routes>
        {/* 🏠 PÁGINA DE INICIO - ruta "/" */}
        <Route path="/" element={<Home user={user} isLoggedIn={isLoggedIn} />} />
        
        {/* 🔐 PÁGINA DE LOGIN - ruta "/login" */}
        <Route path="/login" element={<Login />} />
        
        {/* 📦 PÁGINAS DE PRODUCTOS */}
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        
        {/* 🏢 PÁGINA DE INFORMACIÓN */}
        <Route path="/about" element={<About />} />
        
        {/* 💖 PÁGINA DE FAVORITOS */}
        <Route path="/favorites" element={<Favorites />} />
        
        {/* 👤 PÁGINA DE PERFIL */}
        <Route path="/profile" element={<Profile />} />
        
        {/* 🛒 PÁGINA DE PEDIDOS */}
        <Route path="/orders" element={<Orders />} />
        
        {/* 🛒 PROCESO DE CHECKOUT */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/pending" element={<CheckoutPending />} />
        <Route path="/checkout/failure" element={<CheckoutFailure />} />
        
        {/* 🛠️ PANEL DE ADMINISTRACIÓN - PARA ADMINS Y OPERADORES */}
        <Route 
          path="/admin" 
          element={
            (user?.role === 'admin' || user?.role === 'operator') ? (
              <AdminPanel />
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh', 
                flexDirection: 'column' 
              }}>
                <h2>🚫 Acceso Denegado</h2>
                <p>No tienes permisos para acceder a esta página</p>
                <button 
                  onClick={() => navigate('/')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  Volver al Inicio
                </button>
              </div>
            )
          } 
        />
        
        {/* 📋 PANEL DE ADMINISTRACIÓN DE PEDIDOS - SOLO PARA ADMINS */}
        <Route 
          path="/admin/orders" 
          element={
            user?.role === 'admin' ? (
              <AdminOrderPanel />
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh', 
                flexDirection: 'column' 
              }}>
                <h2>🚫 Acceso Denegado</h2>
                <p>No tienes permisos para acceder a esta página</p>
                <button 
                  onClick={() => navigate('/')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  Volver al Inicio
                </button>
              </div>
            )
          } 
        />
      </Routes>

      {/* 🦶 FOOTER - PIE DE PÁGINA GLOBAL (aparece en todas las páginas) */}
      <footer className="footer" role="contentinfo">
        <div className="footer-content footer-container">
          <div className="footer-section">
            <div className="footer-logo">VELORUM</div>
            <p className="footer-tag">Exploramos el arte de la relojería para ofrecerte piezas únicas.</p>
            {/* social links removed per request */}
          </div>

          <div className="footer-section">
            <h3>Enlaces</h3>
            <ul>
              <li><button className="footer-link" onClick={() => navigate('/products')}>Productos</button></li>
              <li><button className="footer-link" onClick={() => navigate('/about')}>Acerca de</button></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Soporte</h3>
            <ul>
              <li><button className="footer-link" onClick={() => openFooterInfo('envios')}>Envíos</button></li>
              <li><button className="footer-link" onClick={() => openFooterInfo('devoluciones')}>Devoluciones</button></li>
              <li><button className="footer-link" onClick={() => openFooterInfo('careers')}>Carreras</button></li>
            </ul>
          </div>

          {/* Contact section removed per request */}
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Velorum. Todos los derechos reservados.</p>
        </div>
      </footer>

      {footerInfo.type && (
        <div className="modal-overlay footer-info-overlay" onClick={closeFooterInfo}>
          <div className="modal-content footer-info-modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header footer-info-header">
              <h2 style={{margin:0}}>
                {footerInfo.type === 'envios' && 'Información de Envíos'}
                {footerInfo.type === 'devoluciones' && 'Devoluciones'}
                {footerInfo.type === 'careers' && 'Carreras'}
              </h2>
              <button className="btn-close footer-info-close" onClick={closeFooterInfo}>✕</button>
            </div>
            <div className="modal-body footer-info-body">
              {renderFooterContent()}
            </div>
          </div>
        </div>
      )}

      {/* ⬆️ BOTÓN SCROLL TOP */}
      <button
        type="button"
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        aria-label="Volver arriba"
        onClick={scrollToTopFast}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l7-7 7 7"/></svg>
      </button>

      {/* 🛒 CARRITO DE COMPRAS */}
      <Cart />

      {/* 💖 FAVORITOS SIDEBAR */}
      <FavoritesSidebar />
    </div>
  );
}

function App() {
  // Componente interno para resetear scroll al cambiar ruta
  const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
      // Desplaza al top suave (puedes cambiar behavior a 'auto')
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);
    return null;
  };

  return (
    <Router>
      <SearchProvider>
        <ProductsProvider>
          <FavoritesProvider>
            <CartProvider>
              <ScrollToTop />
              <AppContent />
            </CartProvider>
          </FavoritesProvider>
        </ProductsProvider>
      </SearchProvider>
    </Router>
  );
}

export default App;
