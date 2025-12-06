// 🛒 **CHECKOUT.JS** - PROCESO COMPLETO DE COMPRA
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import './Checkout.css';
import { API_BASE_URL, fetchWithAuth } from './services'; // ✅ base dinámica + fetchWithAuth

const WHATSAPP_NUMBER = '5491122334455'; // Reemplazar por número real (sin +, formato país+numero)

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, getTotalPrice, clearCart, getUnlockedPromotions, descuentoAplicado } = useCart();
    const promotions = getUnlockedPromotions();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [currentStep, setCurrentStep] = useState(1); // 1: Datos, 2: Envío (luego redirige a MP)

    // Estados para el formulario
    const [customerData, setCustomerData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono_contacto: ''
    });

    const [shippingData, setShippingData] = useState({
        calle: '',
        numero: '',
        piso: '',
        departamento: '',
        ciudad: '',
        provincia: '',
        codigo_postal: '',
        zona_envio: 'CABA',
        notas_envio: ''
    });

    const [costoEnvio, setCostoEnvio] = useState(800); // base

    // Tabla base por provincia (envío desde Lomas del Mirador, Buenos Aires)
    // Basado en tarifas de Correo Argentino para paquetes pequeños (hasta 1kg)
    const PROVINCIA_BASE = useMemo(() => ({
        'CABA': 4500,                      // Envío metropolitano
        'Buenos Aires': 4000,              // GBA y provincia
        'Córdoba': 5500,
        'Santa Fe': 5200,
        'Mendoza': 6000,                   // Según ejemplo: ~$5.552 base
        'Tucumán': 6500,
        'Entre Ríos': 4800,
        'Salta': 7000,
        'Chaco': 6500,
        'Corrientes': 6000,
        'Misiones': 6200,
        'San Juan': 6200,
        'Jujuy': 7500,
        'San Luis': 5800,
        'Catamarca': 6500,
        'La Rioja': 6500,
        'La Pampa': 5500,
        'Santiago del Estero': 6500,
        'Formosa': 7000,
        'Chubut': 8000,
        'Río Negro': 7500,
        'Neuquén': 7200,
        'Santa Cruz': 9500,
        'Tierra del Fuego': 11000,
    }), []);

    // Factor adicional por distancia aproximada según primer dígito del CP (muy simplificado)
    const postalDistanceFactor = (cp) => {
        if (!cp || cp.length < 4) return 0;
        const first = cp[0];
        switch (first) {
            case '1': return 0; // CABA
            case '2': return 150; // Santa Fe / Entre Ríos
            case '3': return 250; // Norte litoral
            case '4': return 350; // Norte / NOA
            case '5': return 420; // Córdoba / Cuyo
            case '6': return 500; // Buenos Aires interior / La Pampa
            case '7': return 550; // Centro / NOA extendido
            case '8': return 650; // Patagonia norte
            case '9': return 850; // Patagonia sur / Tierra del Fuego
            default: return 0;
        }
    };

    // Ajustes especiales por ciudad remota / logística
    const cityAdjustment = (city) => {
        if (!city) return 0;
        const c = city.toLowerCase();
        if (/(ushuaia|rio grande|rí o grande)/i.test(c)) return 600;
        if (/calafate|perito moreno/.test(c)) return 500;
        if (/tilcara|humahuaca/.test(c)) return 300;
        return 0;
    };

    const calcularEnvio = (provincia, codigoPostal, ciudad) => {
        if (!provincia) return { zona: 'Sin datos', costo: 0, estimado: '-' };
        const base = PROVINCIA_BASE[provincia] ?? 2600;
        const extraCP = postalDistanceFactor(codigoPostal);
        const extraCity = cityAdjustment(ciudad);
        const costo = base + extraCP + extraCity;
        // Tiempo estimado simple basado en distancia total
        const estimado = costo <= 1800 ? '1-3 días hábiles' : costo <= 2600 ? '3-5 días hábiles' : '5-8 días hábiles';
        let zona = provincia;
        if (provincia === 'CABA') zona = 'CABA';
        else if (['Buenos Aires','Entre Ríos','Santa Fe','Córdoba'].includes(provincia)) zona = 'Centro';
        else if (['Chubut','Río Negro','Neuquén','Santa Cruz','Tierra del Fuego'].includes(provincia)) zona = 'Patagonia';
        else if (['Salta','Jujuy','Catamarca','La Rioja','Santiago del Estero','Tucumán'].includes(provincia)) zona = 'Noroeste';
        else if (['Corrientes','Misiones','Formosa','Chaco'].includes(provincia)) zona = 'Noreste';
        else if (['San Juan','San Luis','Mendoza'].includes(provincia)) zona = 'Cuyo';
        return { zona, costo, estimado };
    };

    // Cargar datos del usuario si está autenticado (NO forzar login aquí)
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');

        // Redirigir solo si el carrito está vacío
        if (cartItems.length === 0 && !loading && !transferModalOpen && !createdOrderId) {
            navigate('/products');
            return;
        }

        // Autocompletar con datos del usuario SI está autenticado
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                setCustomerData({
                    nombre: user.first_name || '',
                    apellido: user.last_name || '',
                    email: user.email || '',
                    telefono_contacto: user.phone || ''
                });
            } catch (error) {
                console.error('Error parsing user info:', error);
            }
        }
    }, [cartItems.length, navigate, loading, transferModalOpen, createdOrderId]);

    // Recalcular costo de envío cuando cambian datos relevantes
    useEffect(() => {
        const { provincia, codigo_postal, ciudad } = shippingData;
        if (!provincia || !codigo_postal) return;
        const info = calcularEnvio(provincia, codigo_postal, ciudad);
        setCostoEnvio(info.costo);
        setShippingData(prev => ({ ...prev, zona_envio: info.zona }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shippingData.provincia, shippingData.codigo_postal, shippingData.ciudad]);

    // Validaciones por paso
    const validateStep1 = () => {
        return customerData.nombre && customerData.apellido && 
               customerData.email && customerData.telefono_contacto;
    };

    const validateStep2 = () => {
        return shippingData.calle && shippingData.numero && 
               shippingData.ciudad && shippingData.provincia && 
               shippingData.codigo_postal;
    };

    // Navegar entre pasos
    const nextStep = () => {
        if (currentStep === 1 && !validateStep1()) {
            setError('Por favor completa todos los campos de datos personales');
            return;
        }
        if (currentStep === 2 && !validateStep2()) {
            setError('Por favor completa todos los campos de envío');
            return;
        }
        
        setError('');
        
        // Si está en paso 2, ir directo a pagar (MP)
        if (currentStep === 2) {
            processOrderAndRedirectToMP();
            return;
        }
        
        setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setCurrentStep(currentStep - 1);
        setError('');
    };

    // Procesar orden y redirigir a Mercado Pago
    const processOrderAndRedirectToMP = async () => {
        // Ya no se requiere autenticación - permitir compras como invitado
        const token = localStorage.getItem('token');

        setLoading(true);
        setError('');

        try {
            // Preparar datos para el backend
            const requestData = {
                customer_data: {
                    nombre: customerData.nombre,
                    apellido: customerData.apellido,
                    email: customerData.email,
                    telefono_contacto: customerData.telefono_contacto
                },
                shipping_data: {
                    calle: shippingData.calle,
                    numero: shippingData.numero,
                    piso: shippingData.piso,
                    departamento: shippingData.departamento,
                    ciudad: shippingData.ciudad,
                    provincia: shippingData.provincia,
                    codigo_postal: shippingData.codigo_postal,
                    zona_envio: shippingData.zona_envio,
                    notas_envio: shippingData.notas_envio
                },
                cart_items: cartItems.map(item => ({
                    id: item.id,
                    watch_id: item.watch_id || item.id_backend || item.id,
                    id_backend: item.id_backend || item.id,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name || item.marca || 'Producto'
                })),
                total: getTotalPrice(),
                costo_envio: promotions.hasFreeShipping ? 0 : costoEnvio,
                codigo_descuento: descuentoAplicado ? descuentoAplicado.codigo : null,
                descuento_porcentaje: descuentoAplicado ? descuentoAplicado.porcentaje : 0,
                // Agregar información de promociones desbloqueadas
                promo_discount: promotions.hasDiscount ? 10 : 0,
                promo_free_shipping: promotions.hasFreeShipping,
                promo_gift_box: promotions.hasGiftBox,
                notas_promocion: promotions.hasGiftBox ? '⚠️ INCLUIR CAJA PARA RELOJ - Promoción desbloqueada' : null
            };

            console.log('Enviando datos a MP:', requestData);

            // Llamar al endpoint que crea la orden y preferencia de MP
            // Si hay token, usar fetchWithAuth, si no, fetch normal
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${API_BASE_URL}/market/mp/create-preference/`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('Respuesta de MP:', result);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                console.error('Error del servidor:', result);
                const errorMsg = typeof result.error === 'string' 
                    ? result.error 
                    : (typeof result.error === 'object' 
                        ? JSON.stringify(result.error) 
                        : JSON.stringify(result));
                throw new Error(errorMsg || 'Error al crear la preferencia de pago');
            }

            if (result.success && result.init_point) {
                // Limpiar carrito antes de redirigir
                clearCart();
                
                // Redirigir a Mercado Pago
                window.location.href = result.init_point;
            } else {
                throw new Error('No se recibió el link de pago');
            }

        } catch (error) {
            console.error('Error procesando pago:', error);
            setError(error.message || 'Error al procesar el pedido. Por favor intenta nuevamente.');
            setLoading(false);
        }
    };

    const getTotalWithShipping = () => {
        let subtotal = getTotalPrice();
        
        // Aplicar descuento por código primero (solo sobre productos)
        if (descuentoAplicado) {
            const descuentoCodigo = (subtotal * descuentoAplicado.porcentaje) / 100;
            subtotal -= descuentoCodigo;
        }
        
        // Aplicar descuento por promoción desbloqueada (10%) después
        if (promotions.hasDiscount) {
            subtotal = subtotal * 0.9; // 10% de descuento
        }
        
        // Aplicar envío gratis si está desbloqueado
        const shipping = promotions.hasFreeShipping ? 0 : costoEnvio;
        let total = subtotal + shipping;
        
        return total;
    };

    const getDescuentoMonto = () => {
        let descuentoTotal = 0;
        
        // Descuento por promoción (10%)
        if (promotions.hasDiscount) {
            descuentoTotal += getTotalPrice() * 0.1;
        }
        
        // Descuento por código
        if (descuentoAplicado) {
            const subtotal = getTotalPrice() * (promotions.hasDiscount ? 0.9 : 1) + 
                            (promotions.hasFreeShipping ? 0 : costoEnvio);
            descuentoTotal += (subtotal * descuentoAplicado.porcentaje) / 100;
        }
        
        return descuentoTotal;
    };

    // Render del paso actual
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="checkout-step">
                        <h3>1. Datos Personales</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    value={customerData.nombre}
                                    onChange={(e) => setCustomerData({...customerData, nombre: e.target.value})}
                                    placeholder="Tu nombre"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellido *</label>
                                <input
                                    type="text"
                                    value={customerData.apellido}
                                    onChange={(e) => setCustomerData({...customerData, apellido: e.target.value})}
                                    placeholder="Tu apellido"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={customerData.email}
                                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono *</label>
                                <input
                                    type="tel"
                                    value={customerData.telefono_contacto}
                                    onChange={(e) => setCustomerData({...customerData, telefono_contacto: e.target.value})}
                                    placeholder="+1234567890"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="checkout-step">
                        <h3>2. Datos de Envío</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Calle *</label>
                                <input
                                    type="text"
                                    value={shippingData.calle}
                                    onChange={(e) => setShippingData({...shippingData, calle: e.target.value})}
                                    placeholder="Av. Corrientes"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Número *</label>
                                <input
                                    type="text"
                                    value={shippingData.numero}
                                    onChange={(e) => setShippingData({...shippingData, numero: e.target.value})}
                                    placeholder="1234"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Piso (Opcional)</label>
                                <input
                                    type="text"
                                    value={shippingData.piso}
                                    onChange={(e) => setShippingData({...shippingData, piso: e.target.value})}
                                    placeholder="5°"
                                />
                            </div>
                            <div className="form-group">
                                <label>Departamento (Opcional)</label>
                                <input
                                    type="text"
                                    value={shippingData.departamento}
                                    onChange={(e) => setShippingData({...shippingData, departamento: e.target.value})}
                                    placeholder="A, B, 12..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Ciudad *</label>
                                <input
                                    type="text"
                                    value={shippingData.ciudad}
                                    onChange={(e) => setShippingData({...shippingData, ciudad: e.target.value})}
                                    placeholder="Buenos Aires"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Provincia *</label>
                                <select
                                    value={shippingData.provincia}
                                    onChange={(e) => setShippingData({...shippingData, provincia: e.target.value})}
                                    required
                                >
                                    <option value="">Selecciona una provincia</option>
                                    <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
                                    <option value="Buenos Aires">Buenos Aires</option>
                                    <option value="Córdoba">Córdoba</option>
                                    <option value="Santa Fe">Santa Fe</option>
                                    <option value="Mendoza">Mendoza</option>
                                    <option value="Tucumán">Tucumán</option>
                                    <option value="Entre Ríos">Entre Ríos</option>
                                    <option value="Salta">Salta</option>
                                    <option value="Chaco">Chaco</option>
                                    <option value="Corrientes">Corrientes</option>
                                    <option value="Misiones">Misiones</option>
                                    <option value="San Juan">San Juan</option>
                                    <option value="Jujuy">Jujuy</option>
                                    <option value="San Luis">San Luis</option>
                                    <option value="Catamarca">Catamarca</option>
                                    <option value="La Rioja">La Rioja</option>
                                    <option value="La Pampa">La Pampa</option>
                                    <option value="Santiago del Estero">Santiago del Estero</option>
                                    <option value="Formosa">Formosa</option>
                                    <option value="Chubut">Chubut</option>
                                    <option value="Río Negro">Río Negro</option>
                                    <option value="Neuquén">Neuquén</option>
                                    <option value="Santa Cruz">Santa Cruz</option>
                                    <option value="Tierra del Fuego">Tierra del Fuego</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Código Postal *</label>
                                <input
                                    type="text"
                                    value={shippingData.codigo_postal}
                                    onChange={(e) => setShippingData({...shippingData, codigo_postal: e.target.value.replace(/[^0-9]/g,'').slice(0,4)})}
                                    placeholder="1000"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Zona de Envío</label>
                                <input
                                    type="text"
                                    value={shippingData.zona_envio}
                                    readOnly
                                    className="readonly-input"
                                    placeholder="Se calculará automáticamente"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Notas de Envío (Opcional)</label>
                                <textarea
                                    value={shippingData.notas_envio}
                                    onChange={(e) => setShippingData({...shippingData, notas_envio: e.target.value})}
                                    placeholder="Timbre, referencias, horarios de entrega preferidos..."
                                    rows="3"
                                />
                            </div>
                        </div>
                        
            {shippingData.codigo_postal && shippingData.provincia && (
                            <div className="shipping-calculator">
                <h4>📦 Envío Calculado</h4>
                                <div className="shipping-info">
                                    <div className="shipping-detail">
                                        <span className="detail-label">Zona:</span>
                                        <span className="detail-value">{shippingData.zona_envio}</span>
                                    </div>
                                    <div className="shipping-detail">
                                        <span className="detail-label">Costo:</span>
                                        <span className="detail-value cost">
                                            {promotions.hasFreeShipping ? (
                                                <span style={{ color: '#10b981', fontWeight: '600' }}>GRATIS ✅</span>
                                            ) : (
                                                `$${costoEnvio}`
                                            )}
                                        </span>
                                    </div>
                                    <div className="shipping-detail">
                                        <span className="detail-label">Tiempo estimado:</span>
                    <span className="detail-value">{calcularEnvio(shippingData.provincia, shippingData.codigo_postal, shippingData.ciudad).estimado}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="checkout-container">
            <div className="checkout-header">
                <h2>🛒 Finalizar Compra</h2>
                <div className="step-indicator">
                    {[1, 2].map(step => (
                        <div 
                            key={step} 
                            className={`step ${currentStep >= step ? 'active' : ''}`}
                        >
                            {step}
                        </div>
                    ))}
                </div>
            </div>

            <div className="checkout-content">
                {/* Modal / banner para transferencia */}
                {transferModalOpen && (
                    <div className="transfer-modal">
                        <div className="transfer-modal-content">
                            <h3>¡Pedido Confirmado!</h3>
                            <p>
                                Tu pedido <strong>#{createdOrderId}</strong> se ha registrado correctamente. 
                                Para completar la compra, realiza la transferencia bancaria y envíanos el comprobante por WhatsApp. 
                                Confirmaremos tu pago en un máximo de 24 horas hábiles.
                            </p>
                            <div className="transfer-modal-actions">
                                <button
                                    onClick={() => {
                                        const msg = encodeURIComponent(`Hola! Envío comprobante del pedido #${createdOrderId}.\n\nNombre: ${customerData.nombre} ${customerData.apellido}\nTotal: $${getTotalWithShipping().toFixed(2)}`);
                                        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
                                    }}
                                >
                                    📱 Enviar por WhatsApp
                                </button>
                                <button
                                    onClick={() => {
                                        setTransferModalOpen(false);
                                        navigate('/orders', { state: { message: 'Pedido creado exitosamente', orderId: createdOrderId } });
                                    }}
                                >
                                    Ver Mis Pedidos
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="checkout-form">
                    {error && <div className="error-message">{error}</div>}
                    
                    {renderStep()}
                    
                    <div className="checkout-navigation">
                        {currentStep > 1 && (
                            <button 
                                className="btn-secondary"
                                onClick={prevStep}
                                disabled={loading}
                            >
                                ← Anterior
                            </button>
                        )}
                        
                        <button 
                            className="btn-primary"
                            onClick={nextStep}
                            disabled={loading}
                        >
                            {currentStep === 1 ? 'Siguiente →' : 'Ir a Pagar →'}
                        </button>
                    </div>
                </div>

                <div className="order-summary-sidebar">
                    <h3>Resumen</h3>
                    <div className="cart-items-summary">
                        {cartItems.map(item => (
                            <div key={item.id} className="item-summary">
                                <span className="item-name">{item.name || item.marca || 'Producto'}</span>
                                <span className="item-quantity">x{item.quantity}</span>
                                <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="price-breakdown">
                        <div className="price-line">
                            <span>Subtotal:</span>
                            <span>${getTotalPrice().toFixed(2)}</span>
                        </div>
                        
                        {/* Mostrar descuento por promoción */}
                        {promotions.hasDiscount && (
                            <div className="price-line" style={{ color: '#10b981' }}>
                                <span>Descuento 10%:</span>
                                <span>-${(getTotalPrice() * 0.1).toFixed(2)}</span>
                            </div>
                        )}
                        
                        {/* Mostrar caja de reloj */}
                        {promotions.hasGiftBox && (
                            <div className="price-line" style={{ color: '#10b981' }}>
                                <span>Caja para Reloj:</span>
                                <span>GRATIS</span>
                            </div>
                        )}
                        
                        <div className="price-line">
                            <span>Envío:</span>
                            <span>
                                {promotions.hasFreeShipping ? (
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>GRATIS</span>
                                ) : (
                                    `$${costoEnvio.toFixed(2)}`
                                )}
                            </span>
                        </div>

                        {descuentoAplicado && (
                            <div className="price-line" style={{ color: '#10b981' }}>
                                <span>Código {descuentoAplicado.codigo} ({descuentoAplicado.porcentaje}%):</span>
                                <span>-${(getTotalPrice() * descuentoAplicado.porcentaje / 100).toFixed(2)}</span>
                            </div>
                        )}
                        
                        <div className="price-line total">
                            <span>Total:</span>
                            <span>${getTotalWithShipping().toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
