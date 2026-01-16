import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from './services';
import './CheckoutResult.css';

function CheckoutFailure() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const validateCheckoutAccess = async () => {
            // Obtener parámetros que Mercado Pago agrega automáticamente
            const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
            const externalRef = searchParams.get('external_reference');
            const preferenceId = searchParams.get('preference_id');

            // Si no hay parámetros de MP, es acceso directo no autorizado
            if (!paymentId && !preferenceId) {
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
                } else {
                    navigate('/');
                }
            } catch (error) {
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        validateCheckoutAccess();
    }, [searchParams, navigate]);

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

    return (
        <div className="checkout-result-container">
            <div className="result-card failure">
                <div className="result-icon">
                    <div className="error-circle">
                        <div className="error-icon">✕</div>
                    </div>
                </div>
                
                <h1>Pago Rechazado</h1>
                <p className="result-message">
                    El pago no pudo ser procesado. Por favor, intentá nuevamente.
                </p>
                
                <div className="result-info">
                    <p>
                        💳 Verificá que los datos de tu tarjeta sean correctos.
                    </p>
                    <p>
                        💰 Asegurate de tener fondos suficientes.
                    </p>
                    <p>
                        🔒 Consultá con tu banco si el problema persiste.
                    </p>
                </div>

                <div className="result-actions">
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/cart')}
                    >
                        Volver al Carrito
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

export default CheckoutFailure;
