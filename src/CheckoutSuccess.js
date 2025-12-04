import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from './services';
import './CheckoutResult.css';

function CheckoutSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [orderData, setOrderData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [registerData, setRegisterData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [registerError, setRegisterError] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);

    useEffect(() => {
        console.log('🔍 URL COMPLETA:', window.location.href);
        console.log('🔍 SEARCH PARAMS:', window.location.search);
        console.log('🔍 HASH:', window.location.hash);
        
        // Verificar si el usuario está logueado
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        
        const searchParams = new URLSearchParams(window.location.search);
        
        // Ver TODOS los parámetros que llegaron
        for (let [key, value] of searchParams.entries()) {
            console.log(`   ${key}: ${value}`);
        }
        
        const validateCheckoutAccess = async () => {
            // Obtener parámetros que Mercado Pago agrega automáticamente
            const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
            const externalRef = searchParams.get('external_reference');
            const preferenceId = searchParams.get('preference_id');

            // Si no hay parámetros de MP, es acceso directo no autorizado
            if (!paymentId && !preferenceId) {
                console.log('❌ No MP parameters - unauthorized access');
                navigate('/');
                return;
            }

            try {
                // Pasar todos los parámetros de MP al backend
                const queryString = window.location.search;
                const response = await fetch(`${API_BASE_URL}/market/validate-checkout/${queryString}`);
                const data = await response.json();

                if (data.valid) {
                    setIsValid(true);
                    setOrderData(data.order);
                    
                    // Limpiar el carrito del localStorage después de un pago exitoso
                    localStorage.removeItem('cart');
                    
                    // Disparar evento para que el CartContext se actualice
                    window.dispatchEvent(new Event('storage'));
                } else {
                    console.log('❌ Invalid access:', data.error);
                    navigate('/');
                }
            } catch (error) {
                console.error('❌ Error validating checkout:', error);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        validateCheckoutAccess();
    }, [searchParams, navigate]);

    // Manejar registro de usuario después de compra
    const handleRegister = async (e) => {
        e.preventDefault();
        setRegisterError('');
        
        if (!registerData.username || registerData.username.trim().length < 3) {
            setRegisterError('El nombre de usuario debe tener al menos 3 caracteres');
            return;
        }
        
        if (registerData.password !== registerData.confirmPassword) {
            setRegisterError('Las contraseñas no coinciden');
            return;
        }
        
        if (registerData.password.length < 6) {
            setRegisterError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        setRegisterLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/accounts_admin/register-with-order/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: orderData.usuario || orderData.email,
                    username: registerData.username,
                    password: registerData.password,
                    first_name: orderData.nombre || '',
                    last_name: orderData.apellido || '',
                    order_id: orderData.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Guardar tokens y usuario
                localStorage.setItem('token', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                localStorage.setItem('userInfo', JSON.stringify(data.user));
                
                setIsLoggedIn(true);
                setShowRegisterForm(false);
                
                // Mostrar username creado
                alert(`¡Cuenta creada exitosamente!\n\nTu usuario es: ${data.user.username}\nYa podés seguir tu pedido.`);
            } else {
                setRegisterError(data.error || 'Error al crear la cuenta');
            }
        } catch (error) {
            console.error('Error al registrar:', error);
            setRegisterError('Error al crear la cuenta. Por favor intentá de nuevo.');
        } finally {
            setRegisterLoading(false);
        }
    };

    // Mostrar loading mientras valida
    if (isLoading) {
        return (
            <div className="checkout-result-container">
                <div className="result-card">
                    <div className="result-icon">
                        <div className="pending-circle">
                            <div className="clock-icon">⏳</div>
                        </div>
                    </div>
                    <h1>Validando Pago...</h1>
                    <p className="result-message">
                        Estamos verificando tu pago. Por favor, esperá un momento.
                    </p>
                </div>
            </div>
        );
    }

    // Si no es válido, no debería llegar aquí (ya redirigió)
    if (!isValid) {
        return null;
    }

    // Si el usuario NO está logueado, mostrar oferta de registro
    if (!isLoggedIn && orderData) {
        return (
            <div className="checkout-result-container">
                <div className="result-card success">
                    <div className="result-icon">
                        <div className="checkmark-circle">
                            <div className="checkmark"></div>
                        </div>
                    </div>
                    
                    <h1>¡Pago Confirmado!</h1>
                    <p className="result-message">
                        Tu pago ha sido procesado exitosamente. Pedido #{orderData.id}
                    </p>

                    {!showRegisterForm ? (
                        <div className="register-offer">
                            <h2>¿Querés crear una cuenta?</h2>
                            <p>Creá una cuenta para seguir el estado de tu pedido y futuras compras.</p>
                            
                            <div className="result-actions">
                                <button 
                                    className="btn-primary"
                                    onClick={() => setShowRegisterForm(true)}
                                >
                                    Crear Cuenta
                                </button>
                                <button 
                                    className="btn-secondary"
                                    onClick={() => navigate('/')}
                                >
                                    No, gracias
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="register-form-container">
                            <h2>Crear Cuenta</h2>
                            <form onSubmit={handleRegister} className="register-form">
                                <div className="form-group">
                                    <label>Email (ya registrado con tu compra)</label>
                                    <input 
                                        type="email" 
                                        value={orderData.usuario || orderData.email || ''}
                                        disabled
                                        className="input-disabled"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Nombre de Usuario *</label>
                                    <input 
                                        type="text"
                                        value={registerData.username}
                                        onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                                        placeholder="Ej: juan123 (para iniciar sesión)"
                                        required
                                        minLength="3"
                                    />
                                    <small className="form-hint">Con este nombre vas a iniciar sesión</small>
                                </div>
                                
                                <div className="form-group">
                                    <label>Contraseña *</label>
                                    <input 
                                        type="password"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength="6"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Confirmar Contraseña *</label>
                                    <input 
                                        type="password"
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                        placeholder="Repetí tu contraseña"
                                        required
                                    />
                                </div>
                                
                                {registerError && (
                                    <div className="error-message">{registerError}</div>
                                )}
                                
                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="btn-primary"
                                        disabled={registerLoading}
                                    >
                                        {registerLoading ? 'Creando...' : 'Crear Cuenta'}
                                    </button>
                                    <button 
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setShowRegisterForm(false)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Usuario logueado - mostrar mensaje normal
    return (
        <div className="checkout-result-container">
            <div className="result-card success">
                <div className="result-icon">
                    <div className="checkmark-circle">
                        <div className="checkmark"></div>
                    </div>
                </div>
                
                <h1>¡Pago Confirmado!</h1>
                <p className="result-message">
                    Tu pago ha sido procesado exitosamente. Tu pedido está siendo preparado.
                </p>
                
                {orderData && (
                    <div className="order-summary">
                        <h2>Pedido #{orderData.id}</h2>
                        <p><strong>Total:</strong> ${orderData.total}</p>
                        <p><strong>Estado:</strong> {orderData.estado}</p>
                        {orderData.productos && orderData.productos.length > 0 && (
                            <div className="order-products">
                                <h3>Productos:</h3>
                                <ul>
                                    {orderData.productos.map((producto, index) => (
                                        <li key={index}>
                                            {producto.producto__nombre} - Cantidad: {producto.cantidad} - ${producto.subtotal}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="result-info">
                    <p>
                        📦 Puedes seguir el estado de tu pedido en la sección "Mis Pedidos".
                    </p>
                </div>

                <div className="result-actions">
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/orders')}
                    >
                        Ver Mis Pedidos
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={() => navigate('/')}
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CheckoutSuccess;
