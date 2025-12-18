// 📦 IMPORTACIONES NECESARIAS
import React, { useState, useEffect } from 'react';           // ➕ Agregar useEffect
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { API_BASE_URL } from './services';

function Login() {
  // 🧭 NAVEGACIÓN - Para redirigir al usuario después del login
  const navigate = useNavigate();
  
  // 📊 ESTADO DEL FORMULARIO - Datos que el usuario ingresa
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    address: '',
    phone: ''
  });
  const [passwordErrors, setPasswordErrors] = useState([]); // Solo para indicar vacío
  
  // 🔄 ESTADO DE LA INTERFAZ
  const [isLogin, setIsLogin] = useState(true);        // ✅ true = Login, false = Registro
  const [regStep, setRegStep] = useState(1);           // Paso del registro (1 credenciales, 2 perfil)
  const [error, setError] = useState('');             // ⚠️ Mensajes de error para mostrar al usuario
  const [loading, setLoading] = useState(false);      // ⏳ true = Procesando, false = Listo
  const [isSuccess, setIsSuccess] = useState(false);  // 🎯 Estado para éxito

  // 🚫 BLOQUEAR SCROLL AL MONTAR/DESMONTAR COMPONENTE
  useEffect(() => {
    // 🔒 AL ENTRAR AL LOGIN: Bloquear scroll
    document.body.classList.add('login-active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // 🔓 AL SALIR DEL LOGIN: Restaurar scroll
    return () => {
      document.body.classList.remove('login-active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // 📝 FUNCIÓN PARA MANEJAR CAMBIOS EN LOS CAMPOS DE TEXTO
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,        // Mantener todos los datos anteriores
      [name]: value       // Actualizar solo el campo que cambió
    });
  };

  const validatePasswordPolicy = (pwd) => pwd ? [] : ['La contraseña no puede estar vacía'];

  // 📤 FUNCIÓN PRINCIPAL - ENVIAR DATOS AL SERVIDOR
  const handleSubmit = async (e) => {
    e.preventDefault();    // Evitar que la página se recargue
    setError('');         // Limpiar errores anteriores
    setLoading(true);     // Mostrar que está procesando
    
    try {
      // 🌐 DETERMINAR A QUÉ URL ENVIAR LOS DATOS
      const url = isLogin 
        ? `${API_BASE_URL}/login/`      // 🔐 Endpoint login dinámico
        : `${API_BASE_URL}/create-user/`;  // 📝 Endpoint registro dinámico
      
      // 📦 PREPARAR LOS DATOS SEGÚN EL TIPO DE FORMULARIO
      let dataToSend;
      if (isLogin) {
        dataToSend = { username: formData.username, password: formData.password };
      } else {
        // Validar política de contraseña en cliente
  const pwErrs = validatePasswordPolicy(formData.password); setPasswordErrors(pwErrs); if (pwErrs.length) { throw new Error('La contraseña no puede estar vacía'); }
        // Validar campos perfil
        const required = ['first_name','last_name','address','phone'];
        const missing = required.filter(f => !formData[f]);
        if (missing.length) {
          throw new Error('Completa todos los campos del perfil');
        }
        dataToSend = {
          username: formData.username,
            password: formData.password,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            address: formData.address,
            phone: formData.phone
        };
      }
      
      // 🚀 ENVIAR PETICIÓN HTTP AL SERVIDOR
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      // 📥 RECIBIR RESPUESTA DEL SERVIDOR
      const data = await response.json();
      
      // ⚠️ VERIFICAR SI HUBO ALGÚN ERROR
      if (!response.ok) {
        const errorMessage = data.detail || data.error || data.message || 'Error durante la autenticación';
        throw new Error(errorMessage);
      }
      
      // ✅ SI TODO SALIÓ BIEN...
      if (isLogin) {
        // 🔐 CASO LOGIN EXITOSO
        setIsSuccess(true);  // 🎯 Activar estado de éxito
        
        // 🎨 Cambiar clase de la tarjeta
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
          loginCard.classList.add('success');
        }
        
        // 💾 GUARDAR TOKENS PRIMERO
        localStorage.setItem('token', data.access);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        // 👤 OBTENER INFORMACIÓN COMPLETA DEL USUARIO DESDE /profile/
        try {
          const profileResponse = await fetch(`${API_BASE_URL}/profile/`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.access}`
            }
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            
            // 💾 GUARDAR INFORMACIÓN COMPLETA DEL USUARIO
            const userInfo = {
              id: profileData.id,
              username: profileData.username,
              first_name: profileData.first_name || '',
              last_name: profileData.last_name || '',
              email: profileData.email || '',
              phone: profileData.phone || '',
              address: profileData.address || '',
              role: profileData.role || 'client', // 🎭 ROL DEL USUARIO (¡IMPORTANTE!)
            };
            
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
          } else {
            console.error('❌ Error al obtener perfil del usuario');
          }
        } catch (profileError) {
          console.error('❌ Error al cargar perfil:', profileError);
        }
        
        // 📢 NOTIFICAR A OTROS COMPONENTES QUE EL USUARIO SE LOGUEÓ
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('userChanged'));
        window.dispatchEvent(new Event('userLoggedIn')); // 🛒 Disparar migración de carrito
        
        // ⏰ REDIRIGIR DESPUÉS DE 2.5 SEGUNDOS
        setTimeout(() => {
          // 🔓 RESTAURAR SCROLL ANTES DE REDIRIGIR
          document.body.classList.remove('login-active');
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          navigate('/');
        }, 2500);
        
      } else {
        // 📝 CASO REGISTRO EXITOSO
        setIsLogin(true);        // Cambiar a modo login
  setFormData({ username: formData.username, password: '', email: '', first_name: '', last_name: '', address: '', phone: '' });
  setPasswordErrors([]);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      // 🏁 SIEMPRE AL FINAL: QUITAR EL INDICADOR DE CARGA
      setLoading(false);
    }
  };

  // 🔄 FUNCIÓN PARA CAMBIAR ENTRE LOGIN Y REGISTRO
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', password: '', email: '', first_name: '', last_name: '', address: '', phone: '' });
    setPasswordErrors([]);
    setRegStep(1);
  };

  // 🎨 INTERFAZ VISUAL DEL COMPONENTE
  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* ✅ MOSTRAR ÉXITO O FORMULARIO NORMAL */}
        {isSuccess ? (
          // 🎉 PANTALLA DE ÉXITO
          <div className="success-container">
            <div className="success-icon">
              <div className="success-check">✓</div>
            </div>
            <h2 className="success-title">¡Iniciaste sesión correctamente!</h2>
            <p className="success-subtitle">
              Bienvenido a Velorum
              <span className="redirect-spinner"></span>
            </p>
            <p style={{fontSize: '14px', color: '#666', marginTop: '15px'}}>
              Redirigiendo a la página principal...
            </p>
          </div>
        ) : (
          // 📋 FORMULARIO NORMAL
          <>
            {/* 📝 TÍTULO DINÁMICO */}
            <h2 className="login-title">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
            
            {/* ⚠️ MENSAJE DE ERROR */}
            {error && <div className="error-message">{error}</div>}
            
            {/* 📋 FORMULARIO PRINCIPAL */}
            <form onSubmit={handleSubmit}>
              { (isLogin || regStep === 1) && (
                <>
                  <div className="form-group">
                    <label htmlFor="username">Usuario</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                  </div>
                  {!isLogin && (
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                    {!isLogin && passwordErrors.length > 0 && (
                      <div style={{marginTop:'6px', fontSize:'12px', color:'#c00'}}>{passwordErrors[0]}</div>
                    )}
                  </div>
                  {!isLogin && regStep === 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button type="button" className="login-button" disabled={loading} onClick={() => {
                        const pwErrs = validatePasswordPolicy(formData.password); setPasswordErrors(pwErrs); if (pwErrs.length) { setError('La contraseña no puede estar vacía'); return; }
                        if (!formData.username || !formData.email) { setError('Completa usuario y email'); return; }
                        setError('');
                        setRegStep(2);
                      }}>Continuar</button>
                      <button
                        className="back-home-button"
                        type="button"
                        onClick={() => navigate('/')}
                      >
                        {/* Solo el símbolo de flecha */}
                      </button>
                    </div>
                  )}
                  {isLogin && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="login-button"
            type="submit"
          >
            Iniciar Sesión
          </button>
          <button
            className="back-home-button"
            onClick={() => navigate('/')}
          >
            {/* Solo el símbolo de flecha */}
          </button>
        </div>
                  )}
                </>
              )}
              {!isLogin && regStep === 2 && (
                <>
                  <div className="step-indicator" style={{marginBottom:'12px', fontSize:'13px', color:'#666'}}>Paso 2 de 2: Datos de Perfil</div>
                  <div className="form-group">
                    <label htmlFor="first_name">Nombre</label>
                    <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Apellido</label>
                    <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Dirección</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Teléfono</label>
                    <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                  </div>
                  <div style={{display:'flex', gap:'8px'}}>
                    <button type="button" className="login-button" style={{background:'#555'}} onClick={() => setRegStep(1)} disabled={loading}>Volver</button>
                    <button type="submit" className="login-button" disabled={loading}>{loading ? 'Procesando...' : 'Crear Cuenta'}</button>
                  </div>
                </>
              )}
            </form>
            
            {/* 🔄 ENLACE DE CAMBIO */}
            <p className="toggle-form">
              <span 
                className="toggle-link"
                onClick={toggleForm}
              >
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              </span>
            </p>
          </>
        )}
        
        {/* 🔙 BOTÓN VOLVER AL INICIO */}
        
      </div>
    </div>
  );
}

export default Login;