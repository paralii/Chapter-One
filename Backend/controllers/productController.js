//productController.js
import Product from '../models/Product.js';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';

// Helper: Upload image buffer to Cloudinary with transformation
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'products',
        transformation: [{ width: 500, height: 500, crop: 'fill' }]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const addProduct = async (req, res) => {
  try {
    // Ensure at least 3 images are uploaded
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ message: 'At least 3 images are required' });
    }
    // Upload images to Cloudinary
    const imageUploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
    const imageUrls = await Promise.all(imageUploadPromises);

    const newProduct = new Product({
      title: req.body.title,
      category_id: req.body.category_id,
      author_name: req.body.author_name,
      price: req.body.price,
      available_quantity: req.body.available_quantity,
      description: req.body.description,
      publishing_date: req.body.publishing_date,
      publisher: req.body.publisher,
      page: req.body.page,
      language: req.body.language,
      product_imgs: imageUrls
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};