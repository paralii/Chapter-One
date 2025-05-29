import Coupon from "../../models/Coupon.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";

export const getCoupons = async (req, res) => {
  try {
    const { includeInactive = "false" } = req.query;
    const query = includeInactive === "true" ? {} : { isActive: true };
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    console.error("Error fetching coupons:", err.stack);
    res.status(500).json({ success: false, message: "Failed to fetch coupons due to a server error", error: err.message });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID format" });
    }
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, coupon });
  } catch (err) {
    console.error(`Error fetching coupon with ID ${req.params.couponId}:`, err.stack);
    res.status(500).json({ success: false, message: "Failed to fetch coupon due to a server error", error: err.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, expirationDate, usageLimit, minOrderValue, maxDiscountAmount } = req.body;

    if (!code || discountPercentage == null) {
      return res.status(400).json({ success: false, message: "Coupon code and discount percentage are required" });
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(400).json({ success: false, message: "Discount percentage must be between 0 and 100" });
    }
    if (usageLimit != null && (usageLimit < 1 || !Number.isInteger(usageLimit))) {
      return res.status(400).json({ success: false, message: "Usage limit must be a positive integer" });
    }
    if (expirationDate && isNaN(new Date(expirationDate).getTime())) {
      return res.status(400).json({ success: false, message: "Invalid expiration date" });
    }
    if (minOrderValue != null && (typeof minOrderValue !== 'number' || minOrderValue < 0)) {
      return res.status(400).json({ success: false, message: "Minimum order value must be a non-negative number" });
    }
    if (maxDiscountAmount != null && (typeof maxDiscountAmount !== 'number' || maxDiscountAmount < 0)) {
      return res.status(400).json({ success: false, message: "Max discount amount must be a non-negative number" });
    }

    const caseSensitiveCode = code.toUpperCase().trim();
    const existingCoupon = await Coupon.findOne({ code: caseSensitiveCode });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = new Coupon({
      code: caseSensitiveCode,
      discountPercentage,
      expirationDate: expirationDate || undefined,
      usageLimit: usageLimit || 1,
      isActive: true,
      minOrderValue: minOrderValue || 0,
      maxDiscountAmount: maxDiscountAmount || null,
    });
    await coupon.save();
    res.json({ success: true, message: "Coupon created successfully", coupon });
  } catch (err) {
    console.error("Error creating coupon:", err.stack);
    res.status(500).json({ success: false, message: "Failed to create coupon due to a server error", error: err.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { code, discountPercentage, expirationDate, usageLimit, minOrderValue, maxDiscountAmount } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    if (code) {
      const caseSensitiveCode = code.toUpperCase().trim();
      const existingCoupon = await Coupon.findOne({ code: caseSensitiveCode, _id: { $ne: couponId } });
      if (existingCoupon) {
        return res.status(400).json({ success: false, message: "Coupon code already exists" });
      }
      coupon.code = caseSensitiveCode;
    }
    if (discountPercentage != null) {
      if (discountPercentage < 0 || discountPercentage > 100) {
        return res.status(400).json({ success: false, message: "Discount percentage must be between 0 and 100" });
      }
      coupon.discountPercentage = discountPercentage;
    }
    if (usageLimit != null) {
      if (usageLimit < 1 || !Number.isInteger(usageLimit)) {
        return res.status(400).json({ success: false, message: "Usage limit must be a positive integer" });
      }
      coupon.usageLimit = usageLimit;
    }
    if (expirationDate) {
      if (isNaN(new Date(expirationDate).getTime())) {
        return res.status(400).json({ success: false, message: "Invalid expiration date" });
      }
      coupon.expirationDate = expirationDate;
    }
    if (minOrderValue != null) {
      if (typeof minOrderValue !== 'number' || minOrderValue < 0) {
        return res.status(400).json({ success: false, message: "Minimum order value must be a non-negative number" });
      }
      coupon.minOrderValue = minOrderValue;
    }
    if (maxDiscountAmount != null) {
      if (typeof maxDiscountAmount !== 'number' || maxDiscountAmount < 0) {
        return res.status(400).json({ success: false, message: "Max discount amount must be a non-negative number" });
      }
      coupon.maxDiscountAmount = maxDiscountAmount;
    }
    if (typeof isActive !== "undefined") {
      coupon.isActive = isActive;
    }

    await coupon.save();
    res.json({ success: true, message: "Coupon updated successfully", coupon });
  } catch (err) {
    console.error("Error updating coupon:", err.stack);
    res.status(500).json({ success: false, message: "Failed to update coupon due to a server error", error: err.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    if (!mongoose.isValidObjectId(couponId)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID format" });
    }
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    if (!coupon.isActive) {
      return res.status(200).json({ success: true, message: "Coupon is already deactivated" });
    }
    const activeOrders = await Order.countDocuments({ coupon: coupon.code, status: "Pending", isDeleted: false });
    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Coupon is applied to ${activeOrders} pending order(s). Consider updating instead.`,
      });
    }
    coupon.isActive = false;
    await coupon.save();
    res.json({ success: true, message: "Coupon deactivated successfully" });
  } catch (err) {
    console.error("Error deactivating coupon:", err.stack);
    res.status(500).json({ success: false, message: "Failed to deactivate coupon due to a server error", error: err.message });
  }
};
