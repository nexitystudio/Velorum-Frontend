// 👤 **PROFILE.JS** - PÁGINA DE PERFIL DEL USUARIO
import React, { useState, useEffect } from 'react';
import './Profile.css';

// Helper para formatear fechas en dd/mm/aaaa
const formatDateDMY = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d)) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

function Profile() {
  // 📋 Estado para los datos del usuario
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
  });

  // 🔄 Cargar datos del usuario al montar el componente
  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📥 Función para cargar el perfil del usuario
  const loadUserProfile = async () => {
    try {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.error('No hay token de usuario');
        setLoading(false);
        return;
      }

      // 📋 Obtener datos del localStorage
  const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // 🔍 Intentar cargar datos adicionales del perfil específico del usuario
        const userKey = `profile_${userData.id || userData.username || 'guest'}`;
        const savedProfile = localStorage.getItem(userKey);
        
        let profileData = {};
        if (savedProfile) {
          try {
            profileData = JSON.parse(savedProfile);
          } catch (error) {
            console.error('Error al cargar perfil guardado:', error);
          }
        }
        
        const fullUser = {
          ...userData,
          phone: profileData.phone || userData.phone || '',
          address: profileData.address || userData.address || '',
          first_name: profileData.first_name || userData.first_name || '',
          last_name: profileData.last_name || userData.last_name || '',
          date_joined: userData.date_joined || new Date().toISOString()
        };
        
        // Si faltan phone o address intentar cargar desde API real
        if ((!fullUser.phone || !fullUser.address) && token) {
          try {
            const resp = await fetch('http://127.0.0.1:8000/api/profile/', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
              const apiData = await resp.json();
              fullUser.phone = apiData.phone || fullUser.phone || '';
              fullUser.address = apiData.address || fullUser.address || '';
              // Actualizar cache local
              localStorage.setItem('userInfo', JSON.stringify(fullUser));
              const userKey = `profile_${fullUser.id || fullUser.username || 'guest'}`;
              const mergedProfile = { ...formData, phone: fullUser.phone, address: fullUser.address };
              localStorage.setItem(userKey, JSON.stringify(mergedProfile));
            }
          } catch (e) {
            console.warn('No se pudo actualizar datos desde API perfil', e);
          }
        }
        setUser(fullUser);
        setFormData({
          first_name: fullUser.first_name || '',
          last_name: fullUser.last_name || '',
          email: fullUser.email || '',
          phone: fullUser.phone || '',
          address: fullUser.address || ''
        });
        setLoading(false);
        return;
      }

      // 🔄 Si no hay datos en localStorage, crear usuario básico
      const basicUser = {
        username: 'Usuario',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        date_joined: new Date().toISOString()
      };

      setUser(basicUser);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: ''
      });

    } catch (error) {
      console.error('Error:', error);
      // 🔄 Crear usuario básico en caso de error
      const basicUser = {
        username: 'Usuario',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        date_joined: new Date().toISOString()
      };
      setUser(basicUser);
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Función para activar el modo edición
  const handleEdit = () => {
    setEditing(true);
  };

  // ❌ Función para cancelar la edición
  const handleCancel = () => {
    setEditing(false);
    // Restaurar datos originales
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    });
  };

  // 📝 Función para manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 💾 Función para guardar cambios
  const handleSave = async () => {
    try {
      // 📋 Actualizar datos en localStorage para el usuario actual
      const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updatedUser = { ...currentUser, ...formData };
      
      // 📋 Guardar en localStorage general
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      
      // 📋 También guardar en clave específica del usuario para persistencia
      const userKey = `profile_${updatedUser.id || updatedUser.username || 'guest'}`;
      localStorage.setItem(userKey, JSON.stringify(formData));
      
      // 📋 Actualizar estado local
      setUser({ ...user, ...formData });
      setEditing(false);
      alert('Perfil actualizado correctamente');
      
      // 🔄 Aquí puedes agregar la llamada real a la API cuando esté disponible:
      /*
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/user/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
        alert('Perfil actualizado correctamente');
      } else {
        alert('Error al actualizar el perfil');
      }
      */
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el perfil');
    }
  };

  // 🔄 Recargar perfil (sin mostrar pantalla completa de carga)
  const handleReload = async () => {
    setReloading(true);
    try {
      await loadUserProfile();
    } finally {
      setReloading(false);
    }
  };

  // 🔄 Mostrar cargando
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // ❌ Si no hay usuario
  if (!user) {
    return (
      <div className="profile-container">
        <div className="error-state">
          <h2>Error al cargar el perfil</h2>
          <p>No se pudieron cargar los datos del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container profile-panel">
      {/* Header estilo admin */}
      <div className="profile-header enhanced">
        <div className="profile-header-left">
          <div className="profile-avatar">
            <div className="avatar-circle soft">
              {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
            </div>
          </div>
          <div className="profile-title">
            <h1>Mi Perfil</h1>
            <p className="subtitle">Gestiona y actualiza tu información personal</p>
          </div>
        </div>
        <div className="profile-actions">
          {!editing ? (
            <div className="action-cluster">
              <button className="cluster-btn icon" onClick={handleReload} aria-label="Recargar perfil" disabled={reloading}>
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
              <button className="cluster-btn primary" onClick={handleEdit} aria-label="Editar perfil">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>
            </div>
          ) : (
            <div className="action-cluster">
              <button className="cluster-btn ghost" onClick={handleCancel}>Cancelar</button>
              <button className="cluster-btn primary" onClick={handleSave}>Guardar</button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-layout">
        {/* Columna principal */}
        <div className="profile-card profile-surface">
          <div className="profile-card-header">
            <h2>Información Personal</h2>
            {editing && <span className="editing-badge">Editando</span>}
          </div>
          <div className="profile-card-body">
            <div className="form-grid modern">
              <div className="form-field">
                <label>Nombre</label>
                {editing ? (
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Tu nombre" />
                ) : (
                  <div className="field-value alt">{user.first_name || 'No especificado'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Apellido</label>
                {editing ? (
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Tu apellido" />
                ) : (
                  <div className="field-value alt">{user.last_name || 'No especificado'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Email</label>
                {editing ? (
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" />
                ) : (
                  <div className="field-value alt">{user.email || 'No especificado'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Usuario</label>
                <div className="field-value readonly alt">{user.username}</div>
                <small>El nombre de usuario no se puede cambiar</small>
              </div>
              <div className="form-field full-width">
                <label>Teléfono</label>
                {editing ? (
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Tu número de teléfono" />
                ) : (
                  <div className="field-value alt">{user.phone || 'No especificado'}</div>
                )}
              </div>
              <div className="form-field full-width">
                <label>Dirección</label>
                {editing ? (
                  <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Tu dirección completa" rows="3" />
                ) : (
                  <div className="field-value alt">{user.address || 'No especificado'}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="profile-side">
          <div className="stat-grid">
            <div className="stat-card modern">
              <div className="stat-meta">
                <h3>Miembro desde</h3>
                <p>{formatDateDMY(user.date_joined)}</p>
              </div>
            </div>
            <div className="stat-card modern">
              <div className="stat-meta">
                <h3>Pedidos realizados</h3>
                <p>0</p>
              </div>
            </div>
            <div className="stat-card modern">
              <div className="stat-meta">
                <h3>Favoritos</h3>
                <p>0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
