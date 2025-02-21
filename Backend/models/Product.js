//Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  author_name: String,
  price: { type: Number, required: true },
  available_quantity: { type: Number, default: 0 },
  description: String,
  publishing_date: Date,
  publisher: String,
  page: Number,
  language: String,
  product_imgs: [String], // Array of image URLs
  isDeleted: { type: Boolean, default: false },  // Soft delete flag
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);