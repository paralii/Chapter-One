import Product from "../../models/Product.js";

export const getCategoriesUser = async (req, res) => {
  const { search = "", sort = "desc", page = 1, limit = 16, isDeleted } = req.query;

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
    const limitNumber = Math.max(1, parseInt(limit, 16));
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
