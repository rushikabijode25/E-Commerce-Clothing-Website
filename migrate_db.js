const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Initialize products with reviews
db.products = db.products.map(p => {
  if (!p.reviewsArray) p.reviewsArray = [];
  return p;
});

// Initialize orders with trackingUpdates
db.orders = db.orders.map(o => {
  if (!o.trackingHistory) {
    o.trackingHistory = [
      { status: 'Placed', date: o.createdAt, description: 'Order has been placed successfully.' }
    ];
  }
  return o;
});

// Initialize users with cart and wishlist
db.users = (db.users || []).map(u => {
  if (!u.cart) u.cart = [];
  if (!u.wishlist) u.wishlist = [];
  return u;
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Database migrated successfully.');
