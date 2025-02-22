//categoryController.js
import Category from "../models/Category.js";

// GET /api/categories?search=...&page=...&limit=...
export const getCategories = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    // Query for non-deleted categories and filter by name using case-insensitive search
    const query = { isDeleted: false, name: { $regex: search, $options: "i" } };
    const totalCount = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .sort({ createdAt: -1 }) // Sort descending (latest first)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ categories, totalCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const newCategory = new Category({ name });
    await newCategory.save();
    res.status(201).json({ category: newCategory, message: "Category created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name }, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ category: updatedCategory, message: "Category updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/categories/:id (Soft Delete)
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const deletedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ category: deletedCategory, message: "Category deleted (soft)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
