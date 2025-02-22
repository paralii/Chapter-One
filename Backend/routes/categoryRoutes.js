//categoryRoutes.js
import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// GET: List categories with search and pagination
router.get("/", getCategories);

// POST: Create a new category
router.post("/", createCategory);

// PUT: Update an existing category by ID
router.put("/:id", updateCategory);

// DELETE: Soft delete a category by ID
router.delete("/:id", deleteCategory);

export default router;
