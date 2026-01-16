import React, { useState, useEffect } from 'react';
import { apiRequest } from './services';
import { useProducts } from './ProductsContext';
import './AdminSyncPanel.css';

function AdminSyncPanel() {
    const { refreshProducts } = useProducts();
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalProductos: 0,
        ultimaSync: null
    });

    useEffect(() => {
        cargarEstadisticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarEstadisticas = async () => {
        try {
            const data = await apiRequest('/market/model/products/');
            
            // Obtener total de productos (con paginación usa data.count)
            const totalProductos = data.count || (Array.isArray(data) ? data.length : (data.results || []).length);
            
            // Asegurar que sea un array para calcular última sync
            const productos = Array.isArray(data) ? data : (data.results || []);
            const conSync = productos.filter(p => p.last_sync);
            
            if (conSync.length > 0) {
                const ultimaFecha = new Date(Math.max(...conSync.map(p => new Date(p.last_sync))));
            }
            
            setStats({
                totalProductos: totalProductos,
                ultimaSync: conSync.length > 0 
                    ? new Date(Math.max(...conSync.map(p => new Date(p.last_sync)))).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : 'Nunca'
            });
        } catch (err) {
        }
    };

    const handleSync = async () => {
        setLoading(true);
        setError(null);
        setResultado(null);

        try {
            const data = await apiRequest('/market/sync-external/', {
                method: 'POST'
            });

            setResultado(data);
            
            // Refrescar productos en el context
            await refreshProducts();
            
            // Esperar un poco y recargar estadísticas
            setTimeout(() => {
                cargarEstadisticas();
            }, 500);

        } catch (err) {
            setError(err.message || 'Error al sincronizar productos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-sync-panel">
            <div className="sync-header">
                <h2>Sincronización de Productos</h2>
                <p className="sync-subtitle">
                    Sincroniza automáticamente los productos desde el proveedor externo
                </p>
            </div>

            <div className="sync-stats">
                <div className="stat-card">
                    <div className="stat-icon"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik0yMiAzSDJ2NmgxdjExYTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMlY5aDF6TTQgNWgxNnYySDR6bTE1IDE1SDVWOWgxNHpNOSAxMWg2YTIgMiAwIDAgMS0yIDJoLTJhMiAyIDAgMCAxLTItMiIvPjwvc3ZnPg==" alt="" style={{width: '32px', height: '32px'}} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalProductos}</div>
                        <div className="stat-label">Productos Totales</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgNDggNDgiPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI0Ij48Y2lyY2xlIGN4PSIyNCIgY3k9IjI4IiByPSIxNiIvPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTI4IDRoLThtNCAwdjhtMTEgNGwzLTNNMjQgMjh2LTZtMCA2aC02Ii8+PC9nPjwvc3ZnPg==" alt="" style={{width: '32px', height: '32px'}} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.ultimaSync}</div>
                        <div className="stat-label">Última Sincronización</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik00IDIwdi0yaDIuNzVsLS40LS4zNXEtMS4yMjUtMS4yMjUtMS43ODctMi42NjJUNCAxMi4wNXEwLTIuNzc1IDEuNjYzLTQuOTM3VDEwIDQuMjV2Mi4xUTguMiA3IDcuMSA4LjU2M1Q2IDEyLjA1cTAgMS4xMjUuNDI1IDIuMTg4VDcuNzUgMTYuMmwuMjUuMjVWMTRoMnY2em0xMC0uMjV2LTIuMXExLjgtLjY1IDIuOS0yLjIxMlQxOCAxMS45NXEwLTEuMTI1LS40MjUtMi4xODdUMTYuMjUgNy44TDE2IDcuNTVWMTBoLTJWNGg2djJoLTIuNzVsLjQuMzVxMS4yMjUgMS4yMjUgMS43ODggMi42NjNUMjAgMTEuOTVxMCAyLjc3NS0xLjY2MiA0LjkzOFQxNCAxOS43NSIvPjwvc3ZnPg==" alt="" style={{width: '32px', height: '32px'}} /></div>
                    <div className="stat-content">
                        <div className="stat-value">30 min</div>
                        <div className="stat-label">Frecuencia Automática</div>
                    </div>
                </div>
            </div>

            <div className="sync-actions">
                <button 
                    onClick={handleSync} 
                    disabled={loading}
                    className="sync-button"
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Sincronizando...
                        </>
                    ) : (
                        <>
                            <span className="sync-icon"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik00IDIwdi0yaDIuNzVsLS40LS4zNXEtMS4yMjUtMS4yMjUtMS43ODctMi42NjJUNCAxMi4wNXEwLTIuNzc1IDEuNjYzLTQuOTM3VDEwIDQuMjV2Mi4xUTguMiA3IDcuMSA4LjU2M1Q2IDEyLjA1cTAgMS4xMjUuNDI1IDIuMTg4VDcuNzUgMTYuMmwuMjUuMjVWMTRoMnY2em0xMC0uMjV2LTIuMXExLjgtLjY1IDIuOS0yLjIxMlQxOCAxMS45NXEwLTEuMTI1LS40MjUtMi4xODdUMTYuMjUgNy44TDE2IDcuNTVWMTBoLTJWNGg2djJoLTIuNzVsLjQuMzVxMS4yMjUgMS4yMjUgMS43ODggMi42NjNUMjAgMTEuOTVxMCAyLjc3NS0xLjY2MiA0LjkzOFQxNCAxOS43NSIvPjwvc3ZnPg==" alt="" style={{width: '20px', height: '20px', marginRight: '8px'}} /></span>
                            Sincronizar Ahora
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="sync-error">
                    <span className="error-icon">❌</span>
                    <span>{error}</span>
                </div>
            )}

            {resultado && resultado.success && (
                <div className="sync-result success">
                    <h3>✅ Sincronización Completada</h3>
                    <div className="result-details">
                        <div className="result-item">
                            <span className="result-label">Productos Nuevos:</span>
                            <span className="result-value">{resultado.nuevos}</span>
                        </div>
                        <div className="result-item">
                            <span className="result-label">Productos Actualizados:</span>
                            <span className="result-value">{resultado.actualizados}</span>
                        </div>
                        <div className="result-item">
                            <span className="result-label">Total Procesados:</span>
                            <span className="result-value">{resultado.total}</span>
                        </div>
                        {resultado.desactivados > 0 && (
                            <div className="result-item warning">
                                <span className="result-label">Productos Desactivados:</span>
                                <span className="result-value">{resultado.desactivados}</span>
                            </div>
                        )}
                        {resultado.errores && resultado.errores.length > 0 && (
                            <div className="result-errors">
                                <h4>Errores:</h4>
                                <ul>
                                    {resultado.errores.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="sync-info">
                <h3>ℹ️ Información</h3>
                <ul>
                    <li>La sincronización automática se ejecuta cada 30 minutos</li>
                    <li>Los productos se actualizan con el precio del proveedor × 2</li>
                    <li>Los productos que desaparecen del proveedor se desactivan automáticamente</li>
                    <li>El stock se actualiza en tiempo real</li>
                </ul>
            </div>
        </div>
    );
}

export default AdminSyncPanel;
