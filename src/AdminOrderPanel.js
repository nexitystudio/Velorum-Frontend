import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';
import { API_BASE_URL } from './services'; // ✅ Base dinámica

const AdminOrderPanel = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    // Eliminado: no usado
    // Estado para eliminación individual (podría retirarse si sólo usamos modo bulk)
    const [deleteConfirm, setDeleteConfirm] = useState({ show:false, order:null, loading:false, error:'' });
    // Modo selección múltiple
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkSelected, setBulkSelected] = useState(new Set());
    const [bulkConfirm, setBulkConfirm] = useState({ show:false, loading:false, error:'' });
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        pendientes: 0,
        procesando: 0,
        enviados: 0,
        entregados: 0,
        cancelados: 0
    });

    const estados = [
        { value: 'pendiente', label: 'Pendiente', color: '#ffc107' },
        { value: 'pagado', label: 'Pagado', color: '#17a2b8' },
        { value: 'procesando', label: 'Procesando', color: '#fd7e14' },
        { value: 'enviado', label: 'Enviado', color: '#20c997' },
        { value: 'entregado', label: 'Entregado', color: '#28a745' },
        { value: 'cancelado', label: 'Cancelado', color: '#dc3545' }
    ];

    const estadosPago = [
        { value: 'pendiente', label: 'Pago Pendiente', color: '#ffc107' },
        { value: 'procesando', label: 'Procesando Pago', color: '#fd7e14' },
        { value: 'completado', label: 'Pago Completado', color: '#28a745' },
        { value: 'fallido', label: 'Pago Fallido', color: '#dc3545' },
        { value: 'reembolsado', label: 'Reembolsado', color: '#6c757d' }
    ];

    const [filters, setFilters] = useState({
        estado: 'todos',
        fecha_desde: '',
        fecha_hasta: '',
        buscar: ''
    });

    // Función para obtener información del estado
    const getEstadoInfo = (estado) => {
        return estados.find(e => e.value === estado) || { value: estado, label: estado, color: '#6c757d' };
    };

    // Función para obtener información del estado del pago
    const getEstadoPagoInfo = (estadoPago) => {
        return estadosPago.find(e => e.value === estadoPago) || { value: estadoPago, label: estadoPago, color: '#6c757d' };
    };

    // Función para obtener pedidos desde la API (useCallback para dependencias estables)
    const obtenerPedidos = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No hay token de autenticación');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/market/model/orders/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    navigate('/login');
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setOrders(data);
            calcularEstadisticas(data);
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            setError('Error al cargar pedidos: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Función para cambiar el estado de un pedido - Removida: estados controlados por webhook MP

    // Función para eliminar pedidos cancelados
    const eliminarPedido = async (pedidoId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/market/model/orders/${pedidoId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            // Recargar pedidos después de eliminar
            obtenerPedidos();
            
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            setError('Error al eliminar pedido: ' + error.message);
        }
    };

    // Función para confirmar eliminación
    // const confirmarEliminacion = (order) => { /* ... */ } // Eliminado: no usado

    const cancelarEliminacion = () => {
        setDeleteConfirm({ show:false, order:null, loading:false, error:'' });
        setBulkConfirm({ show:false, loading:false, error:'' });
    };

    const ejecutarEliminacion = async () => { // individual
        if(!deleteConfirm.order) return;
        setDeleteConfirm(dc=>({...dc, loading:true, error:''}));
        try {
            await eliminarPedido(deleteConfirm.order.id);
            setDeleteConfirm({ show:false, order:null, loading:false, error:'' });
        } catch(err){
            setDeleteConfirm(dc=>({...dc, loading:false, error: err.message || 'Error'}));
        }
    };

    // --- Bulk delete helpers ---
    const toggleBulkMode = () => {
        setBulkMode(m => !m);
        setBulkSelected(new Set());
    };

    const toggleSelectOrder = (order) => {
        if(order.estado !== 'cancelado') return; // sólo cancelados
        setBulkSelected(prev => {
            const next = new Set(prev);
            if(next.has(order.id)) next.delete(order.id); else next.add(order.id);
            return next;
        });
    };

    const abrirConfirmacionBulk = () => {
        if(bulkSelected.size === 0) return;
        setBulkConfirm({ show:true, loading:false, error:'' });
    };

    const ejecutarEliminacionBulk = async () => {
        if(bulkSelected.size === 0) return;
        setBulkConfirm(c=>({...c, loading:true, error:'' }));
        try {
            // Eliminar en paralelo sólo pedidos cancelados seleccionados
            const ids = Array.from(bulkSelected);
            for(const id of ids){
                await eliminarPedido(id);
            }
            setBulkConfirm({ show:false, loading:false, error:'' });
            setBulkSelected(new Set());
            setBulkMode(false);
        } catch(err){
            setBulkConfirm(c=>({...c, loading:false, error: err.message || 'Error eliminando'}));
        }
    };

    // Función para gestionar pagos
    const gestionarPago = async (pedidoId, estadoPago, detalles = '') => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/market/model/orders/${pedidoId}/manage_payment/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    estado_pago: estadoPago,
                    detalles: detalles,
                    fecha_pago: estadoPago === 'completado' ? new Date().toISOString() : null
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            // Recargar pedidos después de actualizar
            obtenerPedidos();
            
        } catch (error) {
            console.error('Error al gestionar pago:', error);
            setError('Error al gestionar pago: ' + error.message);
        }
    };

    // Función para calcular estadísticas
    const calcularEstadisticas = (pedidos) => {
        const stats = {
            total: pedidos.length,
            pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
            procesando: pedidos.filter(p => p.estado === 'procesando').length,
            enviados: pedidos.filter(p => p.estado === 'enviado').length,
            entregados: pedidos.filter(p => p.estado === 'entregado').length,
            cancelados: pedidos.filter(p => p.estado === 'cancelado').length
        };
        setEstadisticas(stats);
    };

    // Función para filtrar pedidos
    const filtrarPedidos = () => {
        let pedidosFiltrados = orders;

        if (filters.estado !== 'todos') {
            pedidosFiltrados = pedidosFiltrados.filter(order => order.estado === filters.estado);
        }

        if (filters.buscar) {
            pedidosFiltrados = pedidosFiltrados.filter(order => 
                order.id.toString().includes(filters.buscar) ||
                order.email.toLowerCase().includes(filters.buscar.toLowerCase()) ||
                (order.nombre + ' ' + order.apellido).toLowerCase().includes(filters.buscar.toLowerCase())
            );
        }

        // Filtro por rango de fechas (interpretar como fechas locales completas)
        if (filters.fecha_desde) {
            const [y,m,d] = filters.fecha_desde.split('-').map(Number);
            const desde = new Date(y, m - 1, d, 0, 0, 0, 0); // inicio del día local
            pedidosFiltrados = pedidosFiltrados.filter(order => new Date(order.fecha) >= desde);
        }

        if (filters.fecha_hasta) {
            const [y2,m2,d2] = filters.fecha_hasta.split('-').map(Number);
            const hasta = new Date(y2, m2 - 1, d2, 23, 59, 59, 999); // fin del día local
            pedidosFiltrados = pedidosFiltrados.filter(order => new Date(order.fecha) <= hasta);
        }

        return pedidosFiltrados;
    };

    // Función para ver detalles de un pedido
    const verDetalles = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    // Función para formatear fecha
    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Función para abrir modal de acción
    // const abrirModalAccion = (action, order) => { /* ... */ } // Eliminado: no usado

    // Cargar pedidos al montar el componente
    useEffect(() => {
        obtenerPedidos();
    }, [obtenerPedidos]);

    // Mostrar spinner de carga
    if (loading) {
        return (
            <div className="admin-panel">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando panel de administración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            {/* Header centrado como en usuarios */}
            <div className="admin-header centered">
                <h2>Gestión de Pedidos</h2>
                <p className="subtitle">Revisa, filtra y actualiza el estado de cada pedido</p>
            </div>

            {/* Estadísticas (reutiliza stat-card) */}
            <div className="dashboard-stats" style={{marginTop:'-10px'}}>
                <div className="stat-card"><h3>Total</h3><p>{estadisticas.total}</p></div>
                <div className="stat-card"><h3>Pendientes</h3><p>{estadisticas.pendientes}</p></div>
                <div className="stat-card"><h3>Procesando</h3><p>{estadisticas.procesando}</p></div>
                <div className="stat-card"><h3>Enviados</h3><p>{estadisticas.enviados}</p></div>
                <div className="stat-card"><h3>Entregados</h3><p>{estadisticas.entregados}</p></div>
                <div className="stat-card"><h3>Cancelados</h3><p>{estadisticas.cancelados}</p></div>
            </div>

            {/* Controles y filtros con la misma estética */}
            <div className="controls-card">
                <div className="controls-grid compact-filters">
                    {/* Estado */}
                    <div className="control-field">
                        <label>Estado</label>
                        <select value={filters.estado} onChange={(e)=>setFilters({...filters, estado:e.target.value})}>
                            <option value="todos">Todos</option>
                            {estados.map(es => <option key={es.value} value={es.value}>{es.label}</option>)}
                        </select>
                    </div>
                    {/* Buscar */}
                    <div className="control-field">
                        <label>Buscar</label>
                        <input type="text" placeholder="ID, email o cliente" value={filters.buscar} onChange={(e)=>setFilters({...filters, buscar:e.target.value})} />
                    </div>
                    {/* Rango Fecha */}
                    <div className="control-field">
                        <label>Rango Fecha</label>
                        <div className="date-range">
                            <input type="date" value={filters.fecha_desde} onChange={(e)=>setFilters({...filters, fecha_desde:e.target.value})} />
                            <input type="date" value={filters.fecha_hasta} onChange={(e)=>setFilters({...filters, fecha_hasta:e.target.value})} />
                        </div>
                    </div>
                    {/* Grupo de acciones */}
                            <div className="control-actions">
                                <div className="action-group" aria-label="Acciones de pedidos">
                            <button className="ag-btn ghost icon" onClick={()=>obtenerPedidos()} title="Recargar" aria-label="Recargar pedidos">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 2v6h-6"/>
                                    <path d="M3 12a9 9 0 0 1 15-6l3 2"/>
                                    <path d="M3 22v-6h6"/>
                                    <path d="M21 12a9 9 0 0 1-15 6l-3-2"/>
                                </svg>
                            </button>
                            <button className="ag-btn" onClick={()=>setFilters({ estado:'todos', fecha_desde:'', fecha_hasta:'', buscar:'' })} aria-label="Limpiar filtros">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"/>
                                    <path d="M8 6v10a4 4 0 0 0 8 0V6"/>
                                </svg>
                                Limpiar
                            </button>
                                    <button className={`ag-btn icon danger ${bulkMode ? 'active' : ''}`} onClick={toggleBulkMode} title={bulkMode ? 'Salir modo eliminar' : 'Modo eliminar cancelados'} aria-label="Modo eliminar pedidos cancelados">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    </button>
                                    {bulkMode && (
                                        <>
                                            <button 
                                                className="ag-btn primary" 
                                                onClick={abrirConfirmacionBulk} 
                                                disabled={bulkSelected.size===0}
                                                aria-label="Eliminar pedidos seleccionados"
                                            >
                                                Eliminar ({bulkSelected.size})
                                            </button>
                                        </>
                                    )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Pedidos */}
            {filtrarPedidos().length === 0 ? (
                <div className="empty-state">
                    <h3>No se encontraron pedidos</h3>
                    <p>Ajusta los filtros para ver más resultados</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {bulkMode && <th className="sel-col">Sel</th>}
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Estado Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrarPedidos().map(order => {
                                // const estadoInfo = getEstadoInfo(order.estado); // Eliminado: no usado
                                return (
                                    <tr key={order.id}>
                                        {bulkMode && (
                                            <td className="sel-cell">
                                                {order.estado === 'cancelado' ? (
                                                    <label className="bulk-checkbox">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={bulkSelected.has(order.id)} 
                                                            onChange={()=>toggleSelectOrder(order)}
                                                        />
                                                        <span></span>
                                                    </label>
                                                ) : <span className="no-sel" title="Sólo se pueden eliminar cancelados">—</span>}
                                            </td>
                                        )}
                                        <td>#{order.id}</td>
                                        <td>
                                            <div className="cliente-info">
                                                <span className="nombre">{order.nombre} {order.apellido}</span>
                                                <span className="email">{order.email}</span>
                                            </div>
                                        </td>
                                        <td>{formatearFecha(order.fecha)}</td>
                                        <td className="total">${order.total_con_envio || order.total}</td>
                                        <td>
                                            <div className="state-control">
                                                <span className={`dot dot-${order.estado}`}></span>
                                                <span 
                                                    className="estado-badge" 
                                                    style={{ 
                                                        backgroundColor: getEstadoInfo(order.estado).color,
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        color: 'white',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {getEstadoInfo(order.estado).label}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="state-control">
                                                <span className={`dot dot-${(order.estado_pago||'pendiente')}`}></span>
                                                <span 
                                                    className="estado-badge" 
                                                    style={{ 
                                                        backgroundColor: getEstadoPagoInfo(order.estado_pago || 'pendiente').color,
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        color: 'white',
                                                        fontWeight: '500'
                                                    }}
                                                    title="Actualizado automáticamente por Mercado Pago"
                                                >
                                                    {getEstadoPagoInfo(order.estado_pago || 'pendiente').label}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="order-actions">
                                                <button className="tbl-btn" onClick={()=>verDetalles(order)} aria-label="Ver detalles del pedido">Ver</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de detalles del pedido */}
            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalles del Pedido #{selectedOrder.id}</h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="btn-close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="seccion">
                                <h3>Información del Cliente</h3>
                                <p><strong>Nombre:</strong> {selectedOrder.nombre} {selectedOrder.apellido}</p>
                                <p><strong>Email:</strong> {selectedOrder.email}</p>
                                <p><strong>Teléfono:</strong> {selectedOrder.telefono_contacto}</p>
                            </div>

                            <div className="seccion">
                                <h3>Dirección de Envío</h3>
                                <p><strong>Dirección:</strong> {selectedOrder.direccion_completa}</p>
                                <p><strong>Código Postal:</strong> {selectedOrder.codigo_postal}</p>
                                <p><strong>Zona de Envío:</strong> {selectedOrder.zona_envio}</p>
                            </div>

                            <div className="productos-seccion">
                                <h3>Productos</h3>
                                <div className="productos-lista">
                                    {selectedOrder.detalles && selectedOrder.detalles.map(detalle => {
                                        const producto = detalle.producto_detalle || {};
                                        return (
                                            <div key={detalle.id} className="producto-item">
                                                <div className="producto-info">
                                                    <h4>{producto.nombre || 'Producto'}</h4>
                                                    <p>Cantidad: {detalle.cantidad} × ${detalle.subtotal / detalle.cantidad}</p>
                                                </div>
                                                <div className="producto-total">
                                                    ${detalle.subtotal}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="seccion">
                                <h3>Información del Pedido</h3>
                                <p><strong>Fecha:</strong> {formatearFecha(selectedOrder.fecha)}</p>
                                <p><strong>Estado:</strong> 
                                    <span 
                                        className="estado-badge" 
                                        style={{ backgroundColor: getEstadoInfo(selectedOrder.estado).color, marginLeft: '10px' }}
                                    >
                                        {getEstadoInfo(selectedOrder.estado).label}
                                    </span>
                                </p>
                                <p><strong>Subtotal:</strong> ${selectedOrder.total}</p>
                                <p><strong>Costo de Envío:</strong> ${selectedOrder.costo_envio || 0}</p>
                                <p><strong>Total Final:</strong> ${selectedOrder.total_con_envio || selectedOrder.total}</p>
                                {selectedOrder.numero_seguimiento && (
                                    <p><strong>Seguimiento:</strong> {selectedOrder.numero_seguimiento}</p>
                                )}
                            </div>

                            {selectedOrder.notas && (
                                <div className="seccion">
                                    <h3>Notas</h3>
                                    <p>{selectedOrder.notas}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm.show && (
                <div className="modal-overlay" onClick={cancelarEliminacion}>
                    <div className="modal-content small-modal" onClick={e=>e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Eliminar Pedido</h2>
                            <button className="btn-close" onClick={cancelarEliminacion}>×</button>
                        </div>
                        <div className="modal-body" style={{padding:'22px 28px 6px'}}>
                            <p style={{margin:'0 0 14px', fontSize:'14px', lineHeight:1.4}}>
                                ¿Seguro que querés eliminar el pedido <strong>#{deleteConfirm.order?.id}</strong>? Esta acción es permanente.
                            </p>
                            {deleteConfirm.error && <p className="error-message" style={{marginTop:0}}>{deleteConfirm.error}</p>}
                        </div>
                        <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:'10px', padding:'14px 24px 20px'}}>
                            <button className="btn-secondary" onClick={cancelarEliminacion} disabled={deleteConfirm.loading}>Cancelar</button>
                            <button className="btn-danger" onClick={ejecutarEliminacion} disabled={deleteConfirm.loading}>
                                {deleteConfirm.loading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {bulkConfirm.show && (
                <div className="modal-overlay" onClick={cancelarEliminacion}>
                    <div className="modal-content small-modal" onClick={e=>e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Eliminar Pedidos</h2>
                            <button className="btn-close" onClick={cancelarEliminacion}>×</button>
                        </div>
                        <div className="modal-body" style={{padding:'22px 28px 6px'}}>
                            <p style={{margin:'0 0 14px', fontSize:'14px', lineHeight:1.4}}>
                                Vas a eliminar <strong>{bulkSelected.size}</strong> pedido(s) cancelado(s). Esta acción no se puede deshacer.
                            </p>
                            {bulkConfirm.error && <p className="error-message" style={{marginTop:0}}>{bulkConfirm.error}</p>}
                        </div>
                        <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:'10px', padding:'14px 24px 20px'}}>
                            <button className="btn-secondary" onClick={cancelarEliminacion} disabled={bulkConfirm.loading}>Cancelar</button>
                            <button className="btn-danger" onClick={ejecutarEliminacionBulk} disabled={bulkConfirm.loading}>
                                {bulkConfirm.loading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mostrar error si existe */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
};

export default AdminOrderPanel;
