// 🛒 **ORDERS.JS** - PÁGINA DE PEDIDOS DEL USUARIO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Orders.css';
import { API_BASE_URL } from './services'; // ✅ base dinámica

// Helper formato fecha dd/mm/aaaa HH:MM
const formatDateTimeDMY = (iso) => {
  if(!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const day = String(d.getDate()).padStart(2,'0');
  const month = String(d.getMonth()+1).padStart(2,'0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2,'0');
  const mins = String(d.getMinutes()).padStart(2,'0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
};

function Orders() {
  const navigate = useNavigate();
  
  // �️ Estado para los pedidos del usuario
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // Para modal de detalles
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [confirming, setConfirming] = useState(null); // Pedido que se está confirmando para cancelar
  // txt eliminado: no usado

  // 🔄 Cargar pedidos al montar el componente
  useEffect(() => {
    loadUserOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📥 Función para cargar los pedidos del usuario
  // 🔍 Resolver imagen segun marca + modelo (normaliza y busca coincidencias)
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
      'omega complelltion': '/Mujer/Omega complelltion.png',
      'omega': '/Hombre/Omega sterany.png',
      'patek philippe geneve': '/Mujer/Patek Philippe geneve.png',
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

  const loadUserOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de usuario');
        setLoading(false);
        return;
      }

  const response = await fetch(`${API_BASE_URL}/market/model/orders/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
    const ordersData = await response.json();
    // Normalizar a la estructura usada en el render
        const mapped = ordersData.map(o => ({
          id: o.id,
          status: o.estado,
          subtotal: parseFloat(o.total || 0),
          total: parseFloat(o.total || 0) + parseFloat(o.costo_envio || 0),
          shipping: parseFloat(o.costo_envio || 0),
          created_at: o.fecha,
          address: o.direccion_envio || '—',
          postal_code: o.codigo_postal || '—',
          payment_method: o.metodo_pago || 'Mercado Pago',
          items: (o.detalles || []).map(d => ({
            product: { 
              name: d.producto_detalle ? `${d.producto_detalle.marca || ''} ${d.producto_detalle.modelo || ''}`.trim() || 'Producto' : 'Producto',
              image: d.producto_detalle?.imagen_principal || d.producto_detalle?.imagenes?.[0] || '/logo192.png'
            },
            quantity: d.cantidad,
            price: parseFloat(d.subtotal || 0) / (d.cantidad || 1)
          }))
        }));
        setOrders(mapped);
      } else {
  setError(`Error ${response.status}: ${await response.text() || 'al cargar los pedidos'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de red al cargar pedidos');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  // 🔄 Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return '#f59e0b';
      case 'processing':
      case 'procesando':
        return '#3b82f6';
      case 'shipped':
      case 'enviado':
        return '#8b5cf6';
      case 'delivered':
      case 'entregado':
        return '#10b981';
      case 'cancelled':
      case 'cancelado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // 🔄 Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status || 'Desconocido';
    }
  };

  const canUserCancel = (order) => {
    if(!order) return false;
    const s = (order.status||'').toLowerCase();
    if(['enviado','shipped','entregado','delivered','cancelado','cancelled','pagado','preparando'].includes(s)) return false;
    return true; // Solo se puede cancelar si está pendiente o en revisión
  };

  const cancelOrder = async (order) => {
    if(!order) return;
    if(!canUserCancel(order)) return;
    try {
      const token = localStorage.getItem('token');
  const resp = await fetch(`${API_BASE_URL}/market/model/orders/${order.id}/cancel/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' }
      });
      if(resp.ok){
        // Refrescar lista y modal
        await loadUserOrders();
        setSelectedOrder(null);
        setConfirming(null);
        setFlash({type:'success', msg:'Pedido cancelado'});
        setTimeout(()=>setFlash(null),3000);
      } else {
  // const txt = await resp.text(); // Eliminado: no usado
        setFlash({type:'error', msg:'No se pudo cancelar'});
        setTimeout(()=>setFlash(null),4000);
      }
    } catch(e){
      setFlash({type:'error', msg:'Error de red'});
      setTimeout(()=>setFlash(null),4000);
    }
  };

  // Recargar manual (sin resetear totalmente si ya se cargó)
  const handleReload = () => {
    setReloading(true);
    loadUserOrders();
  };

  // 🔄 Mostrar cargando
  if (loading) {
    return (
      <div className="orders-container orders-panel">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  // ❌ Mostrar error
  if (error) {
    return (
      <div className="orders-container">
        <div className="error-state">
          <h2>Error al cargar pedidos</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={loadUserOrders}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container orders-panel">
      {flash && (
        <div className={`flash-msg ${flash.type}`}>{flash.msg}</div>
      )}
      {/* Header estilo admin/profile */}
      <div className="orders-header enhanced">
        <div className="orders-header-left">
          <h1>Mis Pedidos</h1>
          <p className="subtitle">Historial y estado de tus compras</p>
        </div>
        <div className="orders-actions">
          <div className="action-cluster">
            <button className="cluster-btn icon" onClick={handleReload} aria-label="Recargar" disabled={reloading}>
              {reloading ? (
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6l3 2" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6l-3-2" />
                </svg>
              )}
            </button>
            <button className="cluster-btn primary" onClick={() => navigate('/products')}>Comprar</button>
          </div>
        </div>
      </div>

      {/* 📦 LISTA DE PEDIDOS O ESTADO VACÍO */}
      {orders.length === 0 ? (
        // 📭 ESTADO VACÍO - NO HAY PEDIDOS
        <div className="empty-orders modern-empty">
          <div className="empty-visual">
            <div className="empty-ring"></div>
            <div className="empty-icon">
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                <path d="M3 10h18" />
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <path d="M9 14h.01" />
                <path d="M13 14h2" />
                <path d="M9 18h4" />
              </svg>
            </div>
          </div>
          <h2>Sin pedidos aún</h2>
            <p className="desc">Cuando compres relojes, verás aquí su estado y detalle.</p>
          <div className="empty-actions refined">
            <button className="cluster-like accent" onClick={() => navigate('/products')}>Explorar Productos</button>
            <button className="cluster-like ghost" onClick={() => navigate('/')}>Ir al Inicio</button>
          </div>
        </div>
      ) : (
        // 📦 LISTA DE PEDIDOS (diseño modernizado)
  <div className="orders-list modern compact">
          {orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            return (
              <div key={order.id} className="order-card modern">
                <div className="order-headline">
                  <div className="main-id">Pedido #{order.id || '001'}</div>
                  <div className="meta-line">
                    <span className="date">{formatDateTimeDMY(order.created_at)}</span>
                    <span className="dot" />
                    <span className="status-pill" style={{'--status-color': statusColor}}>{getStatusText(order.status)}</span>
                  </div>
                </div>
                <div className="items-scroller">
                  {(order.items?.length ? order.items : [
                    { product:{ name:'Reloj Clásico', image:'/Reloj1.png'}, quantity:1, price:'199.99' }
                  ]).map((item,i)=>(
                    <div key={i} className="item-chip">
                      <div className="thumb"><img src={item.product?.image || '/Reloj1.png'} alt={item.product?.name || 'Producto'} /></div>
                      <div className="info">
                        <div className="name">{item.product?.name || 'Producto'}</div>
                        <div className="sub">x{item.quantity || 1} · ${item.price || '0.00'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-totals">
                  <div className="cell"><span className="lbl">Subtotal</span><span className="val">${order.subtotal || '199.99'}</span></div>
                  <div className="cell"><span className="lbl">Envío</span><span className="val">${order.shipping || '0.00'}</span></div>
                  <div className="cell total"><span className="lbl">Total</span><span className="val">${order.total || '199.99'}</span></div>
                </div>
                <div className="order-actions compact">
                  <button className="o-btn ghost" onClick={() => setSelectedOrder(order)}>Detalles</button>
                  {(order.status === 'delivered' || order.status === 'entregado') && (
                    <button className="o-btn primary">Repetir</button>
                  )}
                  {(order.status === 'pending' || order.status === 'pendiente' || canUserCancel(order)) && (
                    <button className="o-btn danger" onClick={() => setConfirming(order)}>Cancelar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📊 RESUMEN DE PEDIDOS (solo si hay pedidos) */}
      {orders.length > 0 && (
        <div className="orders-summary modern">
          <div className="summary-grid">
            <div className="summary-card metric">
              <h3>Pedidos</h3>
              <p className="number">{orders.length}</p>
            </div>
            <div className="summary-card metric">
              <h3>Total Gastado</h3>
              <p className="number">${orders.reduce((total, order) => total + parseFloat(order.total || 0), 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={(e)=>{ if(e.target.classList.contains('order-modal-overlay')) setSelectedOrder(null); }}>
          <div className="order-modal">
            <div className="modal-head">
              <h3>Pedido #{selectedOrder.id}</h3>
              <button className="close-btn" onClick={()=>setSelectedOrder(null)} aria-label="Cerrar">×</button>
            </div>
            <div className="modal-section">
              <h4>Items</h4>
              <div className="modal-items">
                {selectedOrder.items.map((it,i)=>(
                  <div key={i} className="m-item">
                    <img src={it.product.image} alt={it.product.name} />
                    <div className="mi-info">
                      <span className="mi-name">{it.product.name}</span>
                      <span className="mi-sub">x{it.quantity} · ${it.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-section grid">
              <div className="stat"><span className="lbl">Dirección</span><span className="val" style={{fontSize:'.75rem',lineHeight:'1.2rem'}}>{selectedOrder.address || '—'}</span></div>
              <div className="stat"><span className="lbl">Código Postal</span><span className="val">{selectedOrder.postal_code || '—'}</span></div>
              <div className="stat"><span className="lbl">Método de Pago</span><span className="val" style={{fontSize:'.7rem'}}>{selectedOrder.payment_method || '—'}</span></div>
            </div>
            <div className="modal-section grid">
              <div className="stat"><span className="lbl">Subtotal</span><span className="val">${selectedOrder.subtotal}</span></div>
              <div className="stat"><span className="lbl">Envío</span><span className="val">${selectedOrder.shipping}</span></div>
              <div className="stat total"><span className="lbl">Total</span><span className="val">${selectedOrder.total}</span></div>
            </div>
            <div className="modal-actions">
              {canUserCancel(selectedOrder) && (
                <button className="o-btn danger" onClick={()=>setConfirming(selectedOrder)}>Cancelar Pedido</button>
              )}
              <button className="o-btn ghost" onClick={()=>setSelectedOrder(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {confirming && (
        <div className="confirm-cancel-overlay" onClick={(e)=>{ if(e.target.classList.contains('confirm-cancel-overlay')) setConfirming(null); }}>
          <div className="confirm-cancel-box" role="dialog" aria-modal="true" aria-labelledby="cc-title">
            <h4 id="cc-title">Cancelar pedido #{confirming.id}</h4>
            <p className="cc-text">¿Seguro que querés cancelarlo? Esta acción no se puede deshacer.</p>
            <div className="cc-actions">
              <button className="o-btn danger" onClick={()=>cancelOrder(confirming)}>Sí, cancelar</button>
              <button className="o-btn ghost" onClick={()=>setConfirming(null)}>Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
