import Offer from "../../models/Offer.js";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import Coupon from "../../models/Coupon.js";
import mongoose from "mongoose";

export const createOffer = async (req, res) => {
  const { type, product_id, category_id, discount_type, discount_value, start_date, end_date } = req.body;
  try {
    if (!["PRODUCT", "CATEGORY"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid offer type" });
    }
    if (type === "PRODUCT" && !mongoose.isValidObjectId(product_id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    if (type === "CATEGORY" && !mongoose.isValidObjectId(category_id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
    if (discount_type === "PERCENTAGE" && discount_value > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount must be <= 100" });
    }
    if (type === "PRODUCT") {
      const product = await Product.findById(product_id);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      if (discount_type === "FLAT" && discount_value > product.price) {
        return res.status(400).json({ success: false, message: "Flat discount exceeds product price" });
      }
    } else {
      const category = await Category.findById(category_id);
      if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    }
    const offer = new Offer({
      type,
      product_id: type === "PRODUCT" ? product_id : null,
      category_id: type === "CATEGORY" ? category_id : null,
      discount_type,
      discount_value,
      start_date,
      end_date
    });
    await offer.save();
    res.json({ success: true, message: "Offer created successfully", offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: err.message });
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
      (offer) => new Date(offer.start_date) <= currentDate && new Date(offer.end_date) >= currentDate
    );
    res.json({ success: true, offers: includeInactive === "true" ? offers : filteredOffers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const getOfferById = async (req, res) => {
  try {
    const { offerId } = req.params;
    if (!mongoose.isValidObjectId(offerId)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }
    const offer = await Offer.findById(offerId)
      .populate("product_id", "title price")
      .populate("category_id", "name")
      .populate("user_id", "firstname email");
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    res.json({ success: true, offers: [offer] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { discount_type, discount_value, start_date, end_date, is_active, referral_code } = req.body;
    if (!mongoose.isValidObjectId(offerId)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }
    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.type === "PRODUCT") {
      const product = await Product.findById(offer.product_id);
      if (discount_type === "FLAT" && discount_value > product.price) {
        return res.status(400).json({ success: false, message: "Flat discount exceeds product price" });
      }
    }
    if (discount_type === "PERCENTAGE" && discount_value > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount must be <= 100" });
    }
    if (offer.type === "REFERRAL" && referral_code && !/^[A-Z0-9-]+$/.test(referral_code)) {
      return res.status(400).json({ success: false, message: "Invalid referral code format" });
    }
    Object.assign(offer, { discount_type, discount_value, start_date, end_date, is_active, referral_code });
    await offer.save();
    res.json({ success: true, message: "Offer updated successfully", offer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const toggleReferralOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { is_active, block_message } = req.body;
    if (!mongoose.isValidObjectId(offerId)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }
    const offer = await Offer.findById(offerId);
    if (!offer || offer.type !== "REFERRAL") {
      return res.status(404).json({ success: false, message: "Referral offer not found" });
    }
    offer.is_active = is_active;
    offer.block_message = is_active ? null : block_message || "Referral code is currently disabled";
    await offer.save();
    res.json({ success: true, message: `Referral offer ${is_active ? "activated" : "deactivated"}`, offer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const getReferralOffers = async (req, res) => {
  try {
    const { offerId, search = "", page = 1, limit = 10 } = req.body;
    const query = { type: "REFERRAL" };

    if (offerId) {
      if (!mongoose.isValidObjectId(offerId)) {
        return res.status(400).json({ success: false, message: "Invalid offer ID" });
      }
      query._id = offerId;
    }

    if (search) {
      query.$or = [
        { referral_code: { $regex: search, $options: "i" } },
      ];
    }

    const offers = await Offer.find(query)
      .populate("user_id", "firstname email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Offer.countDocuments(query);

    res.json({ success: true, offers, total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};