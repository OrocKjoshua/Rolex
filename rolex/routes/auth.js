const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin_secret';
const MAX_ORDER_ADMIN_COUNT = 2;
const MAIN_ADMIN_EMAIL = process.env.MAIN_ADMIN_EMAIL || 'mainadmin@rolex.com';
const MAIN_ADMIN_PASSWORD = process.env.MAIN_ADMIN_PASSWORD || '12345';

async function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '7d' });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, isAdmin, adminCode } = req.body;
    const wantAdmin = Boolean(isAdmin);
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    if (wantAdmin) {
      if (adminCode !== ADMIN_SECRET) return res.status(400).json({ message: 'Invalid admin code' });
      const orderAdminCount = await User.countDocuments({ isAdmin: true, isMainAdmin: { $ne: true } });
      if (orderAdminCount >= MAX_ORDER_ADMIN_COUNT) return res.status(400).json({ message: `Admin quota reached. Only ${MAX_ORDER_ADMIN_COUNT} order admins are allowed.` });
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    user = new User({ name, email, password: hashed, isAdmin: wantAdmin, isMainAdmin: false });
    await user.save();
    const token = await signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin, isMainAdmin: user.isMainAdmin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Main admin login shortcut
    if (email === MAIN_ADMIN_EMAIL && password === MAIN_ADMIN_PASSWORD) {
      let user = await User.findOne({ email });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        user = new User({ name: 'Main Admin', email, password: hashed, isAdmin: true, isMainAdmin: true });
        await user.save();
      } else {
        user.isAdmin = true;
        user.isMainAdmin = true;
        await user.save();
      }
      const token = await signToken(user);
      return res.json({ token, user: { id: user._id, email: user.email, name: user.name, isAdmin: true, isMainAdmin: true } });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = await signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin, isMainAdmin: user.isMainAdmin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
