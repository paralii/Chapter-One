import Category from "../models/Category.js";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

export const createCategory = async (req, res) => {
  if (!req.user?.isAdmin) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Admin access required" });
  }

  try {
    const category = new Category(req.body);
    await category.save();
    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  const {
    search = "",
    sort = "desc",
    page = 1,
    limit = 10,
    isDeleted,
  } = req.query;

  try {
    const query = { isDeleted: false };

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true" ? false : true;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.max(1, parseInt(limit, 10));

    const total = await Category.countDocuments(query);

    let sortOption = { createdAt: sort === "asc" ? 1 : -1 };
    const categories = await Category.find(query)
      .sort(sortOption)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const hasMore = pageNumber * limitNumber < total;

    res
      .status(200)
      .json({
        categories,
        total,
        page: pageNumber,
        limit: limitNumber,
        hasMore,
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  if (!req.user?.isAdmin) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Admin access required" });
  }

  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  if (!req.user?.isAdmin) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Admin access required" });
  }

  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, isListed: false },
      { new: true }
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category soft-deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getBooksByCategory = async (req, res) => {
  try {
      const { category } = req.params;
      const books = await Product.find({ category });

      if (!books.length) {
          return res.status(404).json({ message: "No books found in this category" });
      }

      res.status(200).json(books);
  } catch (error) {
      console.error("Error fetching books by category:", error);
      res.status(500).json({ message: "Server error" });
  }
};
