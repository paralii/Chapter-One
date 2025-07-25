import Category from "../../models/Category.js";
import Product from "../../models/Product.js"

export const createCategory = async (req, res) => {
  try {
    const validName = /^[a-zA-Z0-9\s&-]+$/;
    const trimmedName = req.body.name.trim();
    const desc = req.body.description?.trim() || "";

    if (!validName.test(trimmedName)) {
      return res.status(400).json({ error: "Category name contains invalid characters." });
    }
    if (desc && desc.length < 3) {
      return res.status(400).json({ error: "Description is too short." });
    }
    if (desc.length > 300) {
      return res.status(400).json({ error: "Description is too long." });
    }
    const existing = await Category.findOne({ name: trimmedName });
    if (existing) return res.status(400).json({ error: "Category already exists" });

    const category = new Category({ ...req.body, name: trimmedName });
    await category.save();

    res.status(201).json({ message: "Category created successfully", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getCategories = async (req, res) => {
  const { search = "", sort = "desc", page = 1, limit = 10, isDeleted } = req.query;

  try {
    const query = {};

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true" ? false : true;
    } else {
      query.isDeleted = false;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.max(1, parseInt(limit, 10));
    const total = await Category.countDocuments(query);

    const categories = await Category.find(query)
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const hasMore = pageNumber * limitNumber < total;

    res.status(200).json({ categories, total, page: pageNumber, limit: limitNumber, hasMore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBooksByCategory = async (req, res) => {
  try {
    const { category } = req.params;
const books = await Product.find({ category_id: category });

    if (!books.length) {
      return res.status(404).json({ message: "No books found in this category" });
    }

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const validName = /^[a-zA-Z0-9\s&-]+$/;
    const trimmedName = req.body.name.trim();

    if (!validName.test(trimmedName)) {
      return res.status(400).json({ error: "Category name contains invalid characters." });
    }

    const existing = await Category.findOne({ name: trimmedName, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ error: "Category name already in use" });

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, name: trimmedName },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category updated successfully", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteCategory = async (req, res) => {
  try {
    const { isDeleted, isListed } = req.body;

    if (isDeleted === true) {
      const products = await Product.find({ category_id: req.params.id, isDeleted: false });
      if (products.length > 0) {
        return res.status(400).json({ error: "Cannot delete category with associated products" });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted, isListed },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category updated successfully", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};