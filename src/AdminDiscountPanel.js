import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from './services';
import './AdminPanel.css';

const AdminDiscountPanel = () => {
    const [codigos, setCodigos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCodigo, setEditingCodigo] = useState(null);

    const [formData, setFormData] = useState({
        codigo: '',
        descripcion: '',
        porcentaje_descuento: '',
        activo: true,
        fecha_inicio: '',
        fecha_expiracion: '',
        usos_maximos: '',
        usos_por_usuario: 1,
        monto_minimo: ''
    });

    useEffect(() => {
        fetchCodigos();
    }, []);

    const fetchCodigos = async () => {
        setLoading(true);
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/market/model/codigos-descuento/`);
            const data = await response.json();
            setCodigos(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            setError('Error al cargar códigos de descuento');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCodigo 
                ? `${API_BASE_URL}/market/model/codigos-descuento/${editingCodigo.id}/`
                : `${API_BASE_URL}/market/model/codigos-descuento/`;
            
            const method = editingCodigo ? 'PUT' : 'POST';

            // Preparar datos limpiando campos vacíos opcionales
            const dataToSend = {
                codigo: formData.codigo,
                descripcion: formData.descripcion || '',
                porcentaje_descuento: parseFloat(formData.porcentaje_descuento),
                activo: formData.activo,
                usos_por_usuario: parseInt(formData.usos_por_usuario) || 1
            };

            // Agregar campos opcionales solo si tienen valor
            if (formData.fecha_inicio) {
                dataToSend.fecha_inicio = formData.fecha_inicio;
            }
            if (formData.fecha_expiracion) {
                dataToSend.fecha_expiracion = formData.fecha_expiracion;
            }
            if (formData.usos_maximos) {
                dataToSend.usos_maximos = parseInt(formData.usos_maximos);
            }
            if (formData.monto_minimo) {
                dataToSend.monto_minimo = parseFloat(formData.monto_minimo);
            }

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                alert(editingCodigo ? 'Código actualizado' : 'Código creado exitosamente');
                setShowCreateForm(false);
                setEditingCodigo(null);
                resetForm();
                fetchCodigos();
            } else {
                const errorData = await response.json();
                alert('Error: ' + JSON.stringify(errorData));
            }
        } catch (err) {
            alert('Error al guardar el código: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este código?')) return;

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/market/model/codigos-descuento/${id}/`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Código eliminado');
                fetchCodigos();
            } else {
                alert('Error al eliminar el código');
            }
        } catch (err) {
            alert('Error al eliminar el código');
        }
    };

    const handleEdit = (codigo) => {
        setEditingCodigo(codigo);
        setFormData({
            codigo: codigo.codigo,
            descripcion: codigo.descripcion || '',
            porcentaje_descuento: codigo.porcentaje_descuento,
            activo: codigo.activo,
            fecha_inicio: codigo.fecha_inicio ? codigo.fecha_inicio.split('T')[0] : '',
            fecha_expiracion: codigo.fecha_expiracion ? codigo.fecha_expiracion.split('T')[0] : '',
            usos_maximos: codigo.usos_maximos || '',
            usos_por_usuario: codigo.usos_por_usuario || 1,
            monto_minimo: codigo.monto_minimo || ''
        });
        setShowCreateForm(true);
    };

    const resetForm = () => {
        setFormData({
            codigo: '',
            descripcion: '',
            porcentaje_descuento: '',
            activo: true,
            fecha_inicio: '',
            fecha_expiracion: '',
            usos_maximos: '',
            usos_por_usuario: 1,
            monto_minimo: ''
        });
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setEditingCodigo(null);
        resetForm();
    };

    if (loading) return <div className="loading">Cargando códigos...</div>;

    return (
        <div className="admin-section">
            <div className="section-header">
                <h3>Códigos de Descuento</h3>
                <button 
                    className="btn-primary"
                    onClick={() => {
                        setShowCreateForm(true);
                        setEditingCodigo(null);
                        resetForm();
                    }}
                >
                    + Crear Código
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showCreateForm && (
                <div className="form-container">
                    <div className="form-header">
                        <h4>{editingCodigo ? 'Editar Código' : 'Crear Nuevo Código'}</h4>
                        <button type="button" className="btn-close" onClick={handleCancel}>✕</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="admin-form discount-form">
                        {/* Información Básica */}
                        <div className="form-section">
                            <div className="section-title">Información Básica</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Código *</label>
                                    <input
                                        type="text"
                                        value={formData.codigo}
                                        onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                                        required
                                        placeholder="MANOLITO"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Descuento *</label>
                                    <div className="input-with-suffix">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.porcentaje_descuento}
                                            onChange={(e) => setFormData({...formData, porcentaje_descuento: e.target.value})}
                                            required
                                            placeholder="10"
                                        />
                                        <span className="input-suffix">%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <input
                                    type="text"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                    placeholder="10% de descuento de Manolito"
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                    />
                                    <span>Activar código inmediatamente</span>
                                </label>
                            </div>
                        </div>

                        {/* Validez */}
                        <div className="form-section">
                            <div className="section-title">Validez</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha Expiración</label>
                                    <input
                                        type="date"
                                        value={formData.fecha_expiracion}
                                        onChange={(e) => setFormData({...formData, fecha_expiracion: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Límites de Uso */}
                        <div className="form-section">
                            <div className="section-title">Límites de Uso</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Usos Máximos</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.usos_maximos}
                                        onChange={(e) => setFormData({...formData, usos_maximos: e.target.value})}
                                        placeholder="Ilimitado"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Usos por Usuario</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.usos_por_usuario}
                                        onChange={(e) => setFormData({...formData, usos_por_usuario: e.target.value})}
                                        placeholder="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Compra Mínima</label>
                                    <div className="input-with-prefix">
                                        <span className="input-prefix">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.monto_minimo}
                                            onChange={(e) => setFormData({...formData, monto_minimo: e.target.value})}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary">
                                {editingCodigo ? 'Actualizar Código' : 'Crear Código'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleCancel}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descuento</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Usos</th>
                            <th>Fecha Exp.</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {codigos.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>
                                    No hay códigos de descuento creados
                                </td>
                            </tr>
                        ) : (
                            codigos.map(codigo => (
                                <tr key={codigo.id}>
                                    <td><strong>{codigo.codigo}</strong></td>
                                    <td>{codigo.porcentaje_descuento}%</td>
                                    <td>{codigo.descripcion || '-'}</td>
                                    <td>
                                        <span className={`badge ${codigo.activo ? 'active' : 'inactive'}`}>
                                            {codigo.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        {codigo.usos_actuales} / {codigo.usos_maximos || '∞'}
                                    </td>
                                    <td>
                                        {codigo.fecha_expiracion 
                                            ? new Date(codigo.fecha_expiracion).toLocaleDateString() 
                                            : 'Sin límite'}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-icon edit"
                                            onClick={() => handleEdit(codigo)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="btn-icon delete"
                                            onClick={() => handleDelete(codigo.id)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDiscountPanel;
