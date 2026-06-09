import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiMapPin, FiCopy, FiCheck, FiTag, FiPackage, FiArrowLeft, FiShield, FiCreditCard, FiLock } from 'react-icons/fi';
import './Checkout.css';

const API_URL = (import.meta.env.VITE_API_URL || 'https://e-commerce-wensite.onrender.com/api');
const SHIPPING_CHARGE = 40;

const Checkout = () => {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: '', phone: '', street: '', city: '', state: '', pincode: ''
  });

  // Auto-fill name from logged-in user
  useEffect(() => {
    if (user?.name) {
      setAddress(prev => ({ ...prev, fullName: prev.fullName || user.name }));
    }
  }, [user]);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [activeCodes, setActiveCodes] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');
  const [errors, setErrors] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Payment Gateway State
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState(0); // 0: input, 1: processing, 2: success
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const total = subtotal + SHIPPING_CHARGE - discount;

  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        const res = await axios.get(`${API_URL}/orders/promo-codes`);
        setActiveCodes(res.data);
      } catch (err) {
        console.error('Error fetching promo codes:', err);
      }
    };
    fetchPromoCodes();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setPromoCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/orders/validate-promo`, { code: promoCode });
      setDiscount(res.data.discount);
      setPromoApplied(true);
      setPromoError('');
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid promo code');
      setDiscount(0);
      setPromoApplied(false);
    }
  };

  const removePromo = () => {
    setPromoCode('');
    setDiscount(0);
    setPromoApplied(false);
    setPromoError('');
  };

  const validateAddress = () => {
    const newErrors = {};
    if (!address.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!address.phone.trim() || address.phone.length < 10) newErrors.phone = 'Valid phone number is required';
    if (!address.street.trim()) newErrors.street = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.pincode.trim() || address.pincode.length < 6) newErrors.pincode = 'Valid 6-digit pincode is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;
    if (cartItems.length === 0) return;

    if (paymentMethod === 'Card') {
      setShowPaymentGateway(true);
      return;
    }

    setProcessing(true);
    
    // Simulate real delay for UPI processing or COD
    const delay = paymentMethod !== 'COD' ? 1500 : 500;
    
    setTimeout(async () => {
      await finalizeOrder();
    }, delay);
  };

  const finalizeOrder = async () => {
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        items: cartItems,
        address,
        paymentMethod,
        promoCode: promoApplied ? promoCode : null,
        subtotal,
        shipping: SHIPPING_CHARGE,
        discount,
        total,
        userEmail: user?.email || null
      });
      setOrderData(res.data.order);
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Error placing order');
    } finally {
      setProcessing(false);
    }
  };

  const processGatewayPayment = (e) => {
    e.preventDefault();
    if (cardDetails.number.length < 16 || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) return;
    
    setGatewayStep(1); // Set to processing
    
    setTimeout(() => {
      setGatewayStep(2); // Set to success
      setTimeout(() => {
        setShowPaymentGateway(false);
        setGatewayStep(0);
        finalizeOrder();
      }, 1500);
    }, 2500);
  };

  if (orderPlaced && orderData) {
    return (
      <div className="checkout page-enter">
        <div className="order-success container">
          <div className="order-success__card">
            <div className="order-success__icon">✅</div>
            <h1>Order Placed Successfully!</h1>
            <p className="order-success__id">Order ID: <strong>{orderData.orderId}</strong></p>
            <div className="order-success__details">
              <div className="order-success__row">
                <span>Total Amount</span>
                <span className="gold-text">₹{orderData.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="order-success__row">
                <span>Payment Mode</span>
                <span>{orderData.paymentMethod}</span>
              </div>
              <div className="order-success__row">
                <span>Items</span>
                <span>{orderData.items.length} product(s)</span>
              </div>
              <div className="order-success__row">
                <span>Delivery To</span>
                <span>{orderData.address.city}, {orderData.address.state}</span>
              </div>
            </div>
            <p className="order-success__msg">You will receive order confirmation shortly via SMS/Email.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="checkout page-enter">
        <div className="checkout-empty container">
          <h2>Your cart is empty</h2>
          <p>Add some products before checking out.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Shop Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout page-enter">
      <div className="checkout__inner container">
        <button className="checkout__back" onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
          Back to Shopping
        </button>

        <h1 className="checkout__title">Checkout</h1>

        <div className="checkout__layout">
          {/* Left - Address Form & Payment */}
          <div className="checkout__form-section">
            <div className="checkout__card">
              <h2 className="checkout__card-title">
                <FiMapPin className="checkout__card-icon" />
                Delivery Address
              </h2>

              <div className="checkout__form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={address.fullName}
                    onChange={(e) => setAddress({...address, fullName: e.target.value})}
                    className={errors.fullName ? 'input-error' : ''}
                    id="input-fullname"
                  />
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={address.phone}
                    onChange={(e) => setAddress({...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    className={errors.phone ? 'input-error' : ''}
                    id="input-phone"
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>

                <div className="form-group form-group--full">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    placeholder="House no., Building, Street, Area"
                    value={address.street}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                    className={errors.street ? 'input-error' : ''}
                    id="input-street"
                  />
                  {errors.street && <span className="form-error">{errors.street}</span>}
                </div>

                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    className={errors.city ? 'input-error' : ''}
                    id="input-city"
                  />
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => setAddress({...address, state: e.target.value})}
                    className={errors.state ? 'input-error' : ''}
                    id="input-state"
                  />
                  {errors.state && <span className="form-error">{errors.state}</span>}
                </div>

                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    placeholder="6-digit pincode"
                    value={address.pincode}
                    onChange={(e) => setAddress({...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                    className={errors.pincode ? 'input-error' : ''}
                    id="input-pincode"
                  />
                  {errors.pincode && <span className="form-error">{errors.pincode}</span>}
                </div>
              </div>
            </div>

            <div className="checkout__card">
              <h2 className="checkout__card-title">
                <FiCreditCard className="checkout__card-icon" />
                Payment Method
              </h2>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'UPI' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="UPI" 
                    checked={paymentMethod === 'UPI'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <div className="payment-option__info">
                    <strong>UPI Payment</strong>
                    <span>Google Pay, PhonePe, Paytm</span>
                  </div>
                </label>
                
                <label className={`payment-option ${paymentMethod === 'Card' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="Card" 
                    checked={paymentMethod === 'Card'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <div className="payment-option__info">
                    <strong>Credit / Debit Card</strong>
                    <span>Visa, MasterCard, RuPay</span>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="COD" 
                    checked={paymentMethod === 'COD'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <div className="payment-option__info">
                    <strong>Cash on Delivery</strong>
                    <span>Pay at your doorstep</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="checkout__summary-section">
            <div className="checkout__card">
              <h2 className="checkout__card-title">
                <FiPackage className="checkout__card-icon" />
                Order Summary ({cartItems.length} items)
              </h2>
              <div className="checkout__items">
                {cartItems.map(item => (
                  <div className="checkout__item" key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}>
                    <img src={item.image} alt={item.name} className="checkout__item-img" />
                    <div className="checkout__item-info">
                      <h4>{item.name}</h4>
                      <div className="checkout__item-specs">
                        <span>Size: {item.selectedSize}</span>
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        <span> × {item.quantity}</span>
                      </div>
                    </div>
                    <span className="checkout__item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="checkout__card">
              <h2 className="checkout__card-title">
                <FiTag className="checkout__card-icon" />
                Promo Code
              </h2>

              {activeCodes.length > 0 && (
                <div className="promo-hint">
                  <p className="promo-hint__label">🎉 Current active promo codes:</p>
                  {activeCodes.map(promo => (
                    <div className="promo-hint__code" key={promo.code}>
                      <div>
                        <strong>{promo.code}</strong>
                        <span> — {promo.description}</span>
                      </div>
                      <button className="promo-hint__copy" onClick={() => handleCopyCode(promo.code)}>
                        {copiedCode === promo.code ? <><FiCheck size={14} /> Copied!</> : <><FiCopy size={14} /> Copy</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="promo-input-group">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={promoApplied}
                  className="promo-input"
                  id="promo-code-input"
                />
                {promoApplied ? (
                  <button className="promo-remove-btn" onClick={removePromo}>Remove</button>
                ) : (
                  <button className="promo-apply-btn" onClick={handleApplyPromo}>Apply</button>
                )}
              </div>
              {promoError && <span className="promo-error">{promoError}</span>}
              {promoApplied && <span className="promo-success">✅ Promo code applied! You saved ₹{discount}</span>}
            </div>

            <div className="checkout__card checkout__price-card">
              <div className="checkout__price-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="checkout__price-row">
                <span>Shipping Charge</span>
                <span>₹{SHIPPING_CHARGE}</span>
              </div>
              {discount > 0 && (
                <div className="checkout__price-row checkout__price-row--discount">
                  <span>Promo Discount</span>
                  <span>- ₹{discount}</span>
                </div>
              )}
              <div className="checkout__price-divider" />
              <div className="checkout__price-row checkout__price-row--total">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>

              <button
                className="btn-primary checkout__place-order-btn"
                onClick={handlePlaceOrder}
                disabled={processing}
                id="place-order-btn"
              >
                {processing ? 'Processing Secure Payment...' : `Confirm & Pay ₹${total.toLocaleString('en-IN')}`}
              </button>

              <div className="checkout__secure">
                <FiShield size={14} />
                <span>Secure SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentGateway && (
        <div className="payment-gateway-modal page-enter">
          <div className="gateway-card">
            <div className="gateway-header">
              <div className="gateway-logo">
                <FiLock size={18} /> Secure Checkout
              </div>
              <button 
                className="gateway-close" 
                onClick={() => { setShowPaymentGateway(false); setGatewayStep(0); setCardDetails({ number: '', name: '', expiry: '', cvv: '' }); }}
                disabled={gatewayStep > 0}
              >✕</button>
            </div>
            
            <div className="gateway-amount-display">
              <span>Amount to Pay</span>
              <strong>₹{total.toLocaleString('en-IN')}</strong>
            </div>

            {gatewayStep === 0 && (
              <form onSubmit={processGatewayPayment} className="gateway-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    maxLength="16"
                    value={cardDetails.number}
                    onChange={e => setCardDetails({...cardDetails, number: e.target.value.replace(/\D/g, '')})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input 
                    type="text" 
                    placeholder="Name on card" 
                    value={cardDetails.name}
                    onChange={e => setCardDetails({...cardDetails, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry (MM/YY)</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      maxLength="5"
                      value={cardDetails.expiry}
                      onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="password" 
                      placeholder="123" 
                      maxLength="3"
                      value={cardDetails.cvv}
                      onChange={e => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary gateway-btn">
                  Pay ₹{total.toLocaleString('en-IN')}
                </button>
              </form>
            )}

            {gatewayStep === 1 && (
              <div className="gateway-processing">
                <div className="spinner"></div>
                <h4>Processing Payment</h4>
                <p>Please do not close or refresh this window.</p>
              </div>
            )}

            {gatewayStep === 2 && (
              <div className="gateway-success">
                <div className="success-check"><FiCheck size={32} /></div>
                <h4>Payment Successful</h4>
                <p>Redirecting back to store...</p>
              </div>
            )}
            
            <div className="gateway-footer">
              <span>Powered by StandardSecure™</span>
              <div className="card-icons">
                <span className="card-icon visa">VISA</span>
                <span className="card-icon mc">MasterCard</span>
                <span className="card-icon rupay">RuPay</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
