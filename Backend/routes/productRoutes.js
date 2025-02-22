//productRoutes.js
import express from "express";
import multer from "multer";
import { createProduct, updateProduct, deleteProduct, getProducts } from "../controllers/productController.js";

// Use memory storage for multer and enforce a 5 MB file size limit per image
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

const router = express.Router();

// GET: List products with combined search, sort, and filter
router.get("/", getProducts);

// POST: Create a new product with multiple images
router.post("/", upload.array("images", 10), createProduct);

// PUT: Update an existing product (optional new images)
router.put("/:id", upload.array("images", 10), updateProduct);

// DELETE: Soft delete a product
router.delete("/:id", deleteProduct);

export default router;
