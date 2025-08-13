import Category from "../../models/Category.js";
import Product from "../../models/Product.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { validationMessages } from "../../utils/validationMessages/admin.js";
import { logger, errorLogger } from "../../utils/logger.js";

export const createCategory = async (req, res) => {
  try {
    const validName = /^[a-zA-Z0-9\s&-]+$/;
    const trimmedName = req.body.name.trim();
    const desc = req.body.description?.trim() || "";

    if (!validName.test(trimmedName)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ error: validationMessages.category.invalidName });
    }
    if (desc && desc.length < 3) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ error: validationMessages.category.descTooShort });
    }
    if (desc.length > 300) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ error: validationMessages.category.descTooLong });
    }
    const existing = await Category.findOne({ name: trimmedName });
    if (existing)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ error: validationMessages.category.alreadyExists });

    const category = new Category({ ...req.body, name: trimmedName });
    await category.save();

    logger.info(`Category ${category.name} created successfully`);
    res
      .status(STATUS_CODES.SUCCESS.CREATED)
      .json({ message: validationMessages.category.added, category });
  } catch (err) {
    errorLogger.error("Error creating category", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  const { search = "", sort = "desc", page = 1, limit, isDeleted } = req.query;

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
      .limit(limitNumber)
      .select("_id name description isListed isDeleted");

    logger.info(
      `Fetched ${categories.length} categories with search: "${search}", sort: "${sort}", page: ${pageNumber}, limit: ${limitNumber}`
    );
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ categories, total, page: pageNumber, limit: limitNumber });
  } catch (err) {
    errorLogger.error("Error fetching categories", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
};

export const getBooksByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const books = await Product.find({ category_id: category });

    if (!books.length) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: validationMessages.category.noBooks });
    }
    logger.info(`Fetched ${books.length} books for category: ${category}`);
    res.status(STATUS_CODES.SUCCESS.OK).json(books);
  } catch (error) {
    errorLogger.error("Error fetching books by category", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const validName = /^[a-zA-Z0-9\s&-]+$/;
    const trimmedName = req.body.name.trim();

    if (!validName.test(trimmedName)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ error: validationMessages.category.invalidName });
    }

    const existing = await Category.findOne({
      name: trimmedName,
      _id: { $ne: req.params.id },
    });
    if (existing)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ error: validationMessages.category.alreadyExists });

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, name: trimmedName },
      { new: true }
    );

    if (!category)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: validationMessages.category.notFound });
    logger.info(`Category ${category.name} updated successfully`);
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ message: validationMessages.adminAuth.updateCategory, category });
  } catch (err) {
    errorLogger.error("Error updating category", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { isDeleted, isListed } = req.body;

    if (isDeleted === true) {
      const products = await Product.find({
        category_id: req.params.id,
        isDeleted: false,
      });
      if (products.length > 0) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({ error: "Cannot delete category with associated products" });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted, isListed },
      { new: true }
    );

    if (!category)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Category not found" });
    logger.info(`Category ${category.name} deleted successfully`);
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ message: "Category updated successfully", category });
  } catch (err) {
    errorLogger.error("Error deleting category", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
};
