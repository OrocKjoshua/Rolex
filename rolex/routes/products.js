const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Create product (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const { name, desc, price, img } = req.body;
    if (!name || price == null) return res.status(400).json({ message: 'Name and price required' });
    const p = new Product({ name, desc, price, img });
    await p.save();
    // emit real-time event if io available
    const io = req.app.get('io');
    if (io) io.emit('new-product', p);
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List products
router.get('/', async (req, res) => {
  try {
    const items = await Product.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
