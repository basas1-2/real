const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../config/multer'); // Import the Multer configuration

router.get('/api/list', blogController.list);
router.post('/api', upload.single('image'), blogController.create); // Add upload middleware
router.get('/api/:id', blogController.get);
router.put('/api/:id', upload.single('image'), blogController.update); // Add upload middleware
router.delete('/api/:id', blogController.remove);

module.exports = router;
