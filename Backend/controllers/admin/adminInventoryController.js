import mongoose from "mongoose";
import Product from "../../models/Product.js";
import asyncHandler from "express-async-handler";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../../utils/logger.js";

export const getAllInventory = asyncHandler(async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    return res
      .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
      .json({ success: false, message: "Invalid page or limit" });
  }

  const skip = (pageNum - 1) * limitNum;
  const filter = { isDeleted: false };
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const [products, total] = await Promise.all([
    Product.find(
      filter,
      "title available_quantity price category_id author_name"
    )
      .populate("category_id", "name")
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ]);

  logger.info(
    `Fetched ${products.length} products with search: "${search}", page: ${pageNum}, limit: ${limitNum}`
  );
  res.status(STATUS_CODES.SUCCESS.OK).json({ success: true, products, total });
});

export const updateProductStock = asyncHandler(async (req, res) => {
  try {
    const { productId, quantity, reason = "Manual update" } = req.body;
    if (!mongoose.isValidObjectId(productId)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid product ID" });
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Quantity must be a non-negative integer",
        });
    }
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Reason is required" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ success: false, message: "Product not found" });
    }

    product.available_quantity = quantity;
    await product.save();
    logger.info(
      `Updated stock for product ${product.title} (${productId}) to ${quantity}. Reason: ${reason}`
    );
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ success: true, message: "Stock updated successfully", product });
  } catch (err) {
    errorLogger.error("Error updating product stock", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Error updating stock",
        error: err.message,
      });
  }
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = 5;
  const lowStockProducts = await Product.find(
    { available_quantity: { $lt: threshold }, isDeleted: false },
    "title available_quantity price"
  ).lean();
  logger.info(
    `Fetched ${lowStockProducts.length} low stock products below threshold of ${threshold}`
  );
  res.status(STATUS_CODES.SUCCESS.OK).json({
    success: true,
    count: lowStockProducts.length,
    lowStockProducts,
  });
});

export const getInventoryReport = asyncHandler(async (req, res) => {
  const products = await Product.find(
    { isDeleted: false },
    "title available_quantity price"
  ).lean();

  const totalProducts = products.length;
  const totalItemsInStock = products.reduce(
    (sum, p) => sum + p.available_quantity,
    0
  );
  const totalValue = products.reduce(
    (sum, p) => sum + p.available_quantity * p.price,
    0
  );
  const lowStockCount = products.filter((p) => p.available_quantity < 5).length;

  logger.info(
    `Generated inventory report: ${totalProducts} products, ${totalItemsInStock} items in stock, total value $${totalValue.toFixed(
      2
    )}, ${lowStockCount} low stock products`
  );
  res.status(STATUS_CODES.SUCCESS.OK).json({
    success: true,
    report: {
      totalProducts,
      totalItemsInStock,
      estimatedStockValue: totalValue.toFixed(2),
      lowStockCount,
    },
  });
});
