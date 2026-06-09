const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../data/database.json');

const readDB = () => {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// GET all orders (Admin)
router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// GET orders by user email
router.get('/user/:email', (req, res) => {
  const db = readDB();
  const userOrders = db.orders.filter(o => o.userEmail === req.params.email);
  res.json(userOrders);
});

// GET single order by ID
router.get('/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.orderId === req.params.id.toUpperCase());
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  res.json(order);
});

// POST - Place a new order
router.post('/', (req, res) => {
  const db = readDB();
  const { items, address, paymentMethod, promoCode, subtotal, shipping, discount, total, userEmail } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }
  
  db.counters.orders += 1;
  const order = {
    orderId: `ORD-${db.counters.orders}`,
    items,
    address,
    paymentMethod: paymentMethod || 'COD',
    promoCode: promoCode || null,
    subtotal,
    shipping,
    discount,
    total,
    status: 'Pending',
    userEmail: userEmail || null,
    createdAt: new Date().toISOString(),
    trackingHistory: [
      { status: 'Placed', date: new Date().toISOString(), description: 'Order has been placed successfully.' }
    ]
  };

  db.orders.push(order);
  writeDB(db);

  res.status(201).json({ message: 'Order placed successfully!', order });
});

// PUT - Update order status (Admin)
router.put('/:id/status', (req, res) => {
  const db = readDB();
  const { status } = req.body;
  const orderIndex = db.orders.findIndex(o => o.orderId === req.params.id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  db.orders[orderIndex].status = status;
  writeDB(db);
  
  res.json({ message: 'Order status updated', order: db.orders[orderIndex] });
});

// POST - Validate promo code
router.post('/validate-promo', (req, res) => {
  const db = readDB();
  const { code } = req.body;
  const promo = db.promoCodes.find(p => p.code === code.toUpperCase() && p.active);
  if (!promo) {
    return res.status(400).json({ message: 'Invalid or expired promo code' });
  }
  res.json({ valid: true, discount: promo.discount, description: promo.description });
});

// GET - Active promo codes
router.get('/promo-codes', (req, res) => {
  const db = readDB();
  const active = db.promoCodes.filter(p => p.active);
  res.json(active);
});

// POST - Add Tracking update (Admin)
router.post('/:id/tracking', (req, res) => {
  const db = readDB();
  const { status, description } = req.body;
  const orderIndex = db.orders.findIndex(o => o.orderId === req.params.id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  const order = db.orders[orderIndex];
  if (!order.trackingHistory) order.trackingHistory = [];
  
  order.trackingHistory.push({
    status,
    description,
    date: new Date().toISOString()
  });
  order.status = status; // also update main status
  
  writeDB(db);
  res.json({ message: 'Tracking updated', trackingHistory: order.trackingHistory });
});

module.exports = router;
