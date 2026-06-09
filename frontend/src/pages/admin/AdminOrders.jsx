import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'https://e-commerce-wensite.onrender.com/api');

const STATUS_COLORS = {
  'Pending':         { bg: '#fef3c7', color: '#92400e' },
  'Processing':      { bg: '#dbeafe', color: '#1e40af' },
  'Shipped':         { bg: '#ede9fe', color: '#5b21b6' },
  'Out for Delivery':{ bg: '#fce7f3', color: '#9d174d' },
  'Delivered':       { bg: '#d1fae5', color: '#065f46' },
  'Cancelled':       { bg: '#fee2e2', color: '#991b1b' },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Tracking modal
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('Pending');
  const [trackingNote, setTrackingNote] = useState('');

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/orders`);
      setOrders(res.data.reverse()); // latest first
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Error updating status');
    }
  };

  const openTrackingModal = (order) => {
    setSelectedOrder(order);
    setTrackingStatus(order.status);
    setTrackingNote('');
    setTrackingModalOpen(true);
  };

  const openDetailModal = (order) => {
    setDetailOrder(order);
    setDetailModalOpen(true);
  };

  const submitTrackingUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/orders/${selectedOrder.orderId}/tracking`, {
        status: trackingStatus,
        description: trackingNote || `Status updated to ${trackingStatus}`
      });
      setOrders(orders.map(o =>
        o.orderId === selectedOrder.orderId
          ? {
              ...o,
              status: trackingStatus,
              trackingHistory: [
                ...(o.trackingHistory || []),
                {
                  status: trackingStatus,
                  description: trackingNote || `Status updated to ${trackingStatus}`,
                  date: new Date().toISOString()
                }
              ]
            }
          : o
      ));
      setTrackingModalOpen(false);
    } catch (err) {
      alert('Error updating tracking');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch =
      order.orderId.toLowerCase().includes(search.toLowerCase()) ||
      order.address?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      (order.userEmail || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const StatusBadge = ({ status }) => {
    const style = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#374151' };
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>Manage Orders</h2>
        <button
          onClick={fetchOrders}
          className="btn-secondary btn-sm"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by Order ID, Name or Email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '220px', padding: '10px 14px',
            border: '1px solid var(--admin-border, #e5e7eb)',
            borderRadius: '8px', background: 'var(--admin-bg-surface, #fff)',
            color: 'var(--admin-text, #111)', fontSize: '0.9rem'
          }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 14px', border: '1px solid var(--admin-border, #e5e7eb)',
            borderRadius: '8px', background: 'var(--admin-bg-surface, #fff)',
            color: 'var(--admin-text, #111)', fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          {['All', 'Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['Pending', 'Processing', 'Shipped', 'Delivered'].map(status => (
          <div key={status} style={{
            background: STATUS_COLORS[status]?.bg || '#f3f4f6',
            color: STATUS_COLORS[status]?.color || '#374151',
            padding: '10px 18px', borderRadius: '10px',
            fontSize: '0.85rem', fontWeight: 600
          }}>
            {status}: {orders.filter(o => o.status === status).length}
          </div>
        ))}
      </div>

      <div className="admin-content-inner">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-muted)' }}>
                  {search || filterStatus !== 'All' ? 'No orders match your search.' : 'No orders yet. Orders will appear here when customers place them.'}
                </td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.orderId}>
                    <td><strong style={{ fontFamily: 'monospace' }}>{order.orderId}</strong></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div>
                        <strong>{order.address?.fullName || '—'}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                          📞 {order.address?.phone || '—'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                          📍 {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                      {order.userEmail || <em>Guest</em>}
                    </td>
                    <td>
                      <span style={{
                        background: 'var(--admin-bg, #f9fafb)',
                        border: '1px solid var(--admin-border, #e5e7eb)',
                        borderRadius: '12px', padding: '2px 10px',
                        fontSize: '0.82rem', fontWeight: 600
                      }}>
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{order.paymentMethod || 'COD'}</span>
                      {order.promoCode && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>🏷 {order.promoCode}</div>
                      )}
                    </td>
                    <td><strong style={{ color: 'var(--admin-accent, #059669)' }}>₹{(order.total || 0).toLocaleString('en-IN')}</strong></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                        <button
                          className="btn-secondary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          onClick={() => openDetailModal(order)}
                        >
                          👁 Details
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          onClick={() => openTrackingModal(order)}
                        >
                          ✏ Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ORDER DETAIL MODAL ────────────────────────────────── */}
      {detailModalOpen && detailOrder && (
        <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '620px', width: '95%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Order Details — <span style={{ fontFamily: 'monospace' }}>{detailOrder.orderId}</span></h3>
              <button className="modal-close" onClick={() => setDetailModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Status + Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <StatusBadge status={detailOrder.status} />
                <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  🕐 {new Date(detailOrder.createdAt).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Customer Info */}
              <div style={{ background: 'var(--admin-bg, #f9fafb)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '0.9rem' }}>👤 Customer Info</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Name</span>
                  <span><strong>{detailOrder.address?.fullName}</strong></span>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Phone</span>
                  <span>{detailOrder.address?.phone}</span>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Email</span>
                  <span>{detailOrder.userEmail || <em>Guest Order</em>}</span>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Address</span>
                  <span>{detailOrder.address?.street}, {detailOrder.address?.city}, {detailOrder.address?.state} - {detailOrder.address?.pincode}</span>
                </div>
              </div>

              {/* Ordered Items */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem' }}>🛍 Ordered Items ({detailOrder.items?.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {detailOrder.items?.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      border: '1px solid var(--admin-border, #e5e7eb)',
                      borderRadius: '10px', padding: '10px'
                    }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                          {item.selectedSize && `Size: ${item.selectedSize}`}
                          {item.selectedColor && ` | Color: ${item.selectedColor}`}
                          {` | Qty: ${item.quantity}`}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--admin-accent, #059669)' }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ background: 'var(--admin-bg, #f9fafb)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '0.9rem' }}>💰 Price Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Subtotal</span>
                    <span>₹{(detailOrder.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Shipping</span>
                    <span>₹{(detailOrder.shipping || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {detailOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>Promo Discount {detailOrder.promoCode && `(${detailOrder.promoCode})`}</span>
                      <span>−₹{detailOrder.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid var(--admin-border, #e5e7eb)', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Total Paid</span>
                    <span style={{ color: 'var(--admin-accent, #059669)' }}>₹{(detailOrder.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Payment Method</span>
                    <span style={{ fontWeight: 600 }}>{detailOrder.paymentMethod || 'COD'}</span>
                  </div>
                </div>
              </div>

              {/* Tracking History */}
              {detailOrder.trackingHistory?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem' }}>📦 Tracking History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[...detailOrder.trackingHistory].reverse().map((track, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                        borderLeft: '3px solid var(--admin-accent, #059669)',
                        paddingLeft: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{track.status}</div>
                          {track.description && <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{track.description}</div>}
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                            {new Date(track.date).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick status update from detail modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingTop: '4px' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => { setDetailModalOpen(false); openTrackingModal(detailOrder); }}
                >
                  ✏ Update Status
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => setDetailModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TRACKING UPDATE MODAL ────────────────────────────── */}
      {trackingModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Update Order <span style={{ fontFamily: 'monospace' }}>#{selectedOrder.orderId}</span></h3>
              <button className="modal-close" onClick={() => setTrackingModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={submitTrackingUpdate} className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '6px', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                Customer: <strong>{selectedOrder.address?.fullName}</strong>
              </div>
              {selectedOrder.userEmail && (
                <div style={{ marginBottom: '16px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  Email: {selectedOrder.userEmail}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>New Status</label>
                <select
                  className="status-select"
                  value={trackingStatus}
                  onChange={(e) => setTrackingStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tracking Note (optional)</label>
                <textarea
                  rows="3"
                  value={trackingNote}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  placeholder="e.g. Package arrived at local courier facility"
                  style={{
                    width: '100%', marginTop: '4px', padding: '10px 12px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)', color: 'var(--text-primary)',
                    resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setTrackingModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
