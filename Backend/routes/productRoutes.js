//productRoutes.js
import express from 'express';
import multer from 'multer';
import { addProduct } from '../controllers/productController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer();  // Using multer to handle multipart/form-data

// POST /api/admin/products
router.post('/', protectAdmin, upload.array('images', 10), addProduct);

// (Add routes for editing and soft deleting products as needed)

export default router;