const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

router.get('/api/list', blogController.list);
router.post('/api', blogController.uploadMiddleware, blogController.create);
router.get('/api/:id', blogController.get);
router.put('/api/:id', blogController.uploadMiddleware, blogController.update);
router.delete('/api/:id', blogController.remove);

module.exports = router;
