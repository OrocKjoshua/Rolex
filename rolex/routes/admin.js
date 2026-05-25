const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');
const User = require('../models/User');
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

function deleteFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to remove file:', filePath, err);
  }
}

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

// Update image metadata or replace image file (admin only)
router.put('/images/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    if (req.file) {
      const oldPath = image.path;
      const imgPath = req.file.path.replace(/\\/g, '/');
      const url = `/images/${req.file.filename}`;
      image.filename = req.file.filename;
      image.originalName = req.file.originalname;
      image.path = imgPath;
      image.url = url;
      deleteFileIfExists(oldPath);
    }

    if (req.body.originalName) {
      image.originalName = req.body.originalName;
    }

    await image.save();
    res.json({ message: 'Image updated', image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete image (admin only)
router.delete('/images/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    deleteFileIfExists(image.path);
    await image.remove();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove an order admin (main admin only)
router.delete('/admins/:id', auth, async (req, res) => {
  try {
    if (!req.user.isMainAdmin) return res.status(403).json({ message: 'Forbidden' });
    const adminUser = await User.findById(req.params.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(404).json({ message: 'Admin user not found' });
    if (adminUser.isMainAdmin) return res.status(400).json({ message: 'Cannot remove main admin' });

    adminUser.isAdmin = false;
    await adminUser.save();
    res.json({ message: 'Order admin removed', user: { id: adminUser._id, email: adminUser.email } });
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
