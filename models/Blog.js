const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  content: { type: String },
  imagePath: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
