const Blog = require('../models/Blog'); // Assuming you have a Blog model

// List all blogs
exports.list = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Create a new blog
exports.create = async (req, res) => {
  try {
    const { title, content } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Get the Cloudinary URL

    const newBlog = new Blog({
      title,
      content,
      image: imageUrl, // Save the image URL
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

// Get a single blog by ID
exports.get = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// Update a blog
exports.update = async (req, res) => {
  try {
    const { title, content } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Get the Cloudinary URL

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        ...(imageUrl && { image: imageUrl }), // Update the image URL if provided
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

// Delete a blog
exports.remove = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};