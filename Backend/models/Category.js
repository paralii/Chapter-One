//Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  isListed: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Category', categorySchema);