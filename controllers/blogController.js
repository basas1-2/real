const Blog = require('../models/Blog');
const {upload} = require("../config/cloudinary");

// 📸 Middleware to handle single image upload using Cloudinary
exports.uploadMiddleware = upload.single('image');

// 🧾 List all posts
exports.list = async (req, res) => {
  try {
    const posts = await Blog.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username displayName avatarPath')
      .lean();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// 🆕 Create a new post
exports.create = async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: 'unauthorized' });

  try {
    const { title, content } = req.body;
    const imagePath = req.file ? req.file.path : null; // Cloudinary URL

    const blog = await Blog.create({
      author: req.currentUser.id,
      title,
      content,
      imagePath,
    });

    const savedBlog = await Blog.findById(blog._id)
      .populate('author', 'username displayName avatarPath')
      .lean();

    res.json(savedBlog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'image upload failed' });
  }
};

// 📄 Get single post
exports.get = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id)
      .populate('author', 'username displayName avatarPath')
      .lean();

    if (!post) return res.status(404).json({ error: 'not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// ✏️ Update a post
exports.update = async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: 'unauthorized' });

  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'not found' });
    if (post.author.toString() !== req.currentUser.id)
      return res.status(403).json({ error: 'forbidden' });

    // If new image uploaded, update it
    if (req.file) {
      post.imagePath = req.file.path; // Cloudinary URL
    }

    post.title = req.body.title;
    post.content = req.body.content;
    await post.save();

    const updatedPost = await Blog.findById(post._id)
      .populate('author', 'username displayName avatarPath')
      .lean();

    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// 🗑️ Delete a post
exports.remove = async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: 'unauthorized' });

  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'not found' });
    if (post.author.toString() !== req.currentUser.id)
      return res.status(403).json({ error: 'forbidden' });

    await Blog.deleteOne({ _id: post._id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};