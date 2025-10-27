const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { requireAuth } = require('../middleware/authMiddleware');

// 📝 Create a new blog post (with Cloudinary image upload)
router.post('/api', requireAuth, blogController.uploadMiddleware, blogController.create);

// 📄 Get all blog posts
router.get('/api/list', blogController.list);

// 🔍 Get single blog by ID
router.get('/api/:id', blogController.get);

// ✏️ Update blog post (with optional new Cloudinary image)
router.put('/api/:id', requireAuth, blogController.uploadMiddleware, blogController.update);

// 🗑️ Delete blog post
router.delete('/api/:id', requireAuth, blogController.remove);

module.exports = router;