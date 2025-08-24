import Offer from "../../models/Offer.js";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import mongoose from "mongoose";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../../utils/logger.js";

export const createOffer = async (req, res) => {
  const {
    type,
    product_id,
    category_id,
    discount_type,
    discount_value,
    start_date,
    end_date,
  } = req.body;
  try {
    if (!["PRODUCT", "CATEGORY"].includes(type)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid offer type" });
    }
    if (type === "PRODUCT" && !mongoose.isValidObjectId(product_id)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid product ID" });
    }
    if (type === "CATEGORY" && !mongoose.isValidObjectId(category_id)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid category ID" });
    }
    if (discount_type === "PERCENTAGE" && discount_value > 100) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Percentage discount must be <= 100",
        });
    }
    if (type === "PRODUCT") {
      const product = await Product.findById(product_id);
      if (!product)
        return res
          .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
          .json({ success: false, message: "Product not found" });
      if (product.isDeleted) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Cannot apply offer to blocked or unlisted product",
          });
      }
      if (discount_type === "FLAT" && discount_value > product.price) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Flat discount exceeds product price",
          });
      }
    } else {
      const category = await Category.findById(category_id);
      if (!category)
        return res
          .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
          .json({ success: false, message: "Category not found" });
      if (category.isDeleted || !category.isListed) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Cannot apply offer to unlisted category",
          });
      }
    }
    const offer = new Offer({
      type,
      product_id: type === "PRODUCT" ? product_id : null,
      category_id: type === "CATEGORY" ? category_id : null,
      discount_type,
      discount_value,
      start_date,
      end_date,
    });
    await offer.save();
    logger.info(`Offer created successfully: ${offer._id}`);
    res.json({ success: true, message: "Offer created successfully", offer });
  } catch (err) {
    errorLogger.error("Error creating offer", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: err.message, error: err.message });
  }
};

export const getOffers = async (req, res) => {
  try {
    const { type, includeInactive = "false" } = req.query;
    const query = includeInactive === "true" ? {} : { is_active: true };
    if (type && ["PRODUCT", "CATEGORY"].includes(type)) query.type = type;
    const offers = await Offer.find(query)
      .populate("product_id", "title price")
      .populate("category_id", "name")
      .sort({ createdAt: -1 });
    const currentDate = new Date();
    const filteredOffers = offers.filter(
      (offer) =>
        new Date(offer.start_date) <= currentDate &&
        new Date(offer.end_date) >= currentDate
    );
    logger.info(
      `Fetched ${offers.length} offers with type: ${type}, includeInactive: ${includeInactive}`
    );
    res.json({
      success: true,
      offers: includeInactive === "true" ? offers : filteredOffers,
    });
  } catch (err) {
    errorLogger.error("Error fetching offers", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getOfferById = async (req, res) => {
  try {
    const { offerId } = req.params;
    if (!mongoose.isValidObjectId(offerId)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid offer ID" });
    }
    const offer = await Offer.findById(offerId)
      .populate("product_id", "title price")
      .populate("category_id", "name")
      .populate("user_id", "firstname email");
    if (!offer)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ success: false, message: "Offer not found" });
    logger.info(`Fetched offer details for offer ID: ${offer._id}`);
    res.json({ success: true, offers: [offer] });
  } catch (err) {
    errorLogger.error("Error fetching offer by ID", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const {
      discount_type,
      discount_value,
      start_date,
      end_date,
      is_active,
    } = req.body;
    if (!mongoose.isValidObjectId(offerId)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid offer ID" });
    }
    const offer = await Offer.findById(offerId);
    if (!offer)
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ success: false, message: "Offer not found" });
    if (offer.type === "PRODUCT") {
      const product = await Product.findById(offer.product_id);
      if (!product)
        return res
          .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
          .json({ success: false, message: "Product not found" });
      if (product.isDeleted || !product.isListed) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Cannot apply offer to blocked or unlisted product",
          });
      }
      if (discount_type === "FLAT" && discount_value > product.price) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Flat discount exceeds product price",
          });
      }
    } else if (offer.type === "CATEGORY") {
      const category = await Category.findById(offer.category_id);
      if (!category)
        return res
          .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
          .json({ success: false, message: "Category not found" });
      if (category.isDeleted || !category.isListed) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Cannot apply offer to unlisted category",
          });
      }
    }
    if (discount_type === "PERCENTAGE" && discount_value > 100) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Percentage discount must be <= 100",
        });
    }
    Object.assign(offer, {
      discount_type,
      discount_value,
      start_date,
      end_date,
      is_active,
    });
    await offer.save();

    logger.info(`Offer updated successfully: ${offer._id}`);
    res.json({ success: true, message: "Offer updated successfully", offer });
  } catch (err) {
    errorLogger.error("Error updating offer", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
