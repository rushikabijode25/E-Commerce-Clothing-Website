const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const dbPath = path.join(__dirname, '../data/database.json');

const readDB = () => {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// POST - Upload Image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// GET all products
router.get('/', (req, res) => {
  const db = readDB();
  const { category } = req.query;
  let filtered = db.products;
  
  if (category === 'new') {
    filtered = db.products.filter(p => p.badge && p.badge.toLowerCase().includes('new'));
  } else if (category && category !== 'all') {
    filtered = db.products.filter(p => p.category === category);
  }
  
  res.json(filtered);
});

// GET single product by id
router.get('/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// POST to create a new product (Admin)
router.post('/', (req, res) => {
  const db = readDB();
  const newProduct = req.body;
  
  db.counters.products += 1;
  newProduct.id = db.counters.products;
  newProduct.rating = newProduct.rating || 0;
  newProduct.reviews = newProduct.reviews || 0;
  
  db.products.push(newProduct);
  writeDB(db);
  
  res.status(201).json({ message: 'Product created successfully', product: newProduct });
});

// PUT to edit an existing product (Admin)
router.put('/:id', (req, res) => {
  const db = readDB();
  const prodId = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === prodId);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Preserve rating/reviews
  const updatedProduct = {
    ...db.products[index],
    ...req.body,
    id: prodId // prevent id overwrite
  };

  db.products[index] = updatedProduct;
  writeDB(db);

  res.json({ message: 'Product updated successfully', product: updatedProduct });
});

// DELETE a product (Admin)
router.delete('/:id', (req, res) => {
  const db = readDB();
  const prodId = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === prodId);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  db.products.splice(index, 1);
  writeDB(db);

  res.json({ message: 'Product deleted successfully' });
});

// POST to add a review
router.post('/:id/reviews', (req, res) => {
  const db = readDB();
  const prodId = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === prodId);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const newReview = req.body;
  if (!db.products[index].reviewsArray) {
    db.products[index].reviewsArray = [];
  }
  
  newReview.date = new Date().toISOString();
  db.products[index].reviewsArray.push(newReview);
  
  // Recalculate average rating
  const totalRating = db.products[index].reviewsArray.reduce((sum, r) => sum + r.rating, 0);
  db.products[index].rating = (totalRating / db.products[index].reviewsArray.length).toFixed(1);
  db.products[index].reviews = db.products[index].reviewsArray.length;

  writeDB(db);

  res.status(201).json({ message: 'Review added successfully', product: db.products[index] });
});

module.exports = router;
