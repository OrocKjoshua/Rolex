const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Image = require('../models/Image');
const auth = require('../middleware/auth');

// Ensure 'rolex img' exists and use as storage directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'rolex img'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload an image (admin only)
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imgPath = req.file.path.replace(/\\/g, '/');
    const url = `/images/${req.file.filename}`;
    const image = new Image({ filename: req.file.filename, originalName: req.file.originalname, path: imgPath, url, uploadedBy: req.user._id });
    await image.save();
    res.json({ message: 'Uploaded', image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List images
router.get('/images', async (req, res) => {
  try {
    const imgs = await Image.find().sort({ createdAt: -1 });
    res.json(imgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
