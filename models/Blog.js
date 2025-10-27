const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // Field to store the image URL
});

module.exports = mongoose.model('Blog', blogSchema);