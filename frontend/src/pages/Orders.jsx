import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiPackage, FiCalendar, FiTruck, FiCheckCircle, FiClock, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTracking, setExpandedTracking] = useState({});

  const toggleTracking = (orderId) => {
    setExpandedTracking(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://e-commerce-wensite.onrender.com/api'}/orders/user/${user.email}`);
        setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <FiCheckCircle className="status-delivered" />;
      case 'Shipped': return <FiTruck className="status-shipped" />;
      default: return <FiClock className="status-pending" />;
    }
  };

  if (loading) {
    return (
      <div className="orders-page orders-page--loading">
        <div className="container">
          <div className="skeleton h1-skeleton" />
          {[1, 2].map(i => <div key={i} className="skeleton order-skeleton" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="orders-page page-enter">
        <div className="container orders-empty">
          <FiShoppingBag className="empty-icon" />
          <h1>Please log in</h1>
          <p>You need to be logged in to view your order history.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page page-enter">
      <div className="container">
        <header className="orders-header">
          <h1>My Order History</h1>
          <p>Track and manage your luxury acquisitions</p>
        </header>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <FiPackage className="empty-icon" />
            <h2>No orders found</h2>
            <p>You haven't placed any orders yet. Start your luxury collection today.</p>
            <Link to="/" className="btn-primary">
              Browse Boutique <FiArrowRight />
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.orderId} className="order-card">
                <div className="order-card__header">
                  <div className="order-card__meta">
                    <span className="order-id">#{order.orderId}</span>
                    <span className="order-date">
                      <FiCalendar /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className={`order-status order-status--${order.status.toLowerCase()}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>

                <div className="order-card__body">
                  <div className="order-items-preview">
                    {order.items.map((item, i) => (
                      <div key={i} className="order-item-mini">
                        <img src={item.image} alt={item.name} />
                        <div className="item-mini-info">
                          <span className="name">{item.name}</span>
                          <span className="details">Size: {item.selectedSize} | Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-card__footer">
                    <div className="order-total">
                      <span className="label">Total Paid</span>
                      <span className="amount">₹{order.total.toLocaleString('en-IN')}</span>
                    </div>
                    <button className="btn-secondary btn-sm" onClick={() => toggleTracking(order.orderId)}>
                      {expandedTracking[order.orderId] ? 'Hide Tracking' : 'Track Order'}
                    </button>
                  </div>

                  {expandedTracking[order.orderId] && (
                    <div className="order-tracking-container">
                      <h4>Tracking Timeline</h4>
                      <div className="tracking-timeline">
                        {order.trackingHistory && order.trackingHistory.map((track, i) => (
                          <div key={i} className="tracking-step">
                            <div className="tracking-step__indicator"></div>
                            <div className="tracking-step__content">
                              <div className="tracking-step__title">{track.status}</div>
                              {track.description && <div className="tracking-step__desc">{track.description}</div>}
                              <div className="tracking-step__date">{new Date(track.date).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
