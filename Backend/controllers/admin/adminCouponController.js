import Coupon from "../../models/Coupon.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../../utils/logger.js";

async function deactivateExpiredCoupons(coupons) {
  let deactivatedCount = 0;
  for (const coupon of coupons) {
    if (
      coupon.isActive &&
      coupon.expirationDate &&
      new Date(coupon.expirationDate) < new Date()
    ) {
      const activeOrders = await Order.countDocuments({
        coupon: coupon.code,
        status: "Pending",
        isDeleted: false,
      });
      if (activeOrders > 0) {
        console.log(
          `Coupon ${coupon.code} is applied to ${activeOrders} pending order(s). Skipping deactivation.`
        );
        continue;
      }
      coupon.isActive = false;
      await coupon.save();
      deactivatedCount++;
      console.log(`Coupon ${coupon.code} deactivated due to expiration.`);
    }
  }
  return deactivatedCount;
}

export const getCoupons = async (req, res) => {
  try {
    const { includeInactive = "false" } = req.query;
    const query = includeInactive === "true" ? {} : { isActive: true };
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    await deactivateExpiredCoupons(coupons);

    const updatedCoupons =
      includeInactive === "true"
        ? await Coupon.find(query).sort({ createdAt: -1 })
        : coupons.filter((c) => c.isActive);

    logger.info(`Fetched ${updatedCoupons.length} coupons successfully`);
    res.json({ success: true, coupons: updatedCoupons });
  } catch (err) {
    errorLogger.error("Error fetching coupons", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Failed to fetch coupons due to a server error",
        error: err.message,
      });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid coupon ID format" });
    }
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ success: false, message: "Coupon not found" });
    }

    if (
      coupon.isActive &&
      coupon.expirationDate &&
      new Date(coupon.expirationDate) < new Date()
    ) {
      const activeOrders = await Order.countDocuments({
        coupon: coupon.code,
        status: "Pending",
        isDeleted: false,
      });
      if (activeOrders === 0) {
        coupon.isActive = false;
        await coupon.save();
        console.log(`Coupon ${coupon.code} deactivated due to expiration.`);
      } else {
        console.log(
          `Coupon ${coupon.code} is applied to ${activeOrders} pending order(s). Skipping deactivation.`
        );
      }
    }

    logger.info(`Fetched coupon ${coupon.code} successfully`);
    res.json({ success: true, coupon });
  } catch (err) {
    errorLogger.error("Error fetching coupon", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Failed to fetch coupon due to a server error",
        error: err.message,
      });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountPercentage,
      expirationDate,
      usageLimit,
      minOrderValue,
      maxDiscountAmount,
    } = req.body;

    if (!code || discountPercentage == null) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Coupon code and discount percentage are required",
        });
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Discount percentage must be between 0 and 100",
        });
    }
    if (
      usageLimit != null &&
      (usageLimit < 1 || !Number.isInteger(usageLimit))
    ) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Usage limit must be a positive integer",
        });
    }
    if (expirationDate && isNaN(new Date(expirationDate).getTime())) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid expiration date" });
    }
    if (
      minOrderValue != null &&
      (typeof minOrderValue !== "number" || minOrderValue < 0)
    ) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Minimum order value must be a non-negative number",
        });
    }
    if (
      maxDiscountAmount != null &&
      (typeof maxDiscountAmount !== "number" || maxDiscountAmount < 0)
    ) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Max discount amount must be a non-negative number",
        });
    }

    const caseSensitiveCode = code.toUpperCase().trim();
    const existingCoupon = await Coupon.findOne({ code: caseSensitiveCode });
    if (existingCoupon) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Coupon code already exists" });
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
    logger.info(`Coupon ${coupon.code} created successfully`);
    res.json({ success: true, message: "Coupon created successfully", coupon });
  } catch (err) {
    errorLogger.error("Error creating coupon", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Failed to create coupon due to a server error",
        error: err.message,
      });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const {
      code,
      discountPercentage,
      expirationDate,
      usageLimit,
      minOrderValue,
      maxDiscountAmount,
      isActive,
    } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Coupon not found" });
    }

    if (code) {
      const caseSensitiveCode = code.toUpperCase().trim();
      const existingCoupon = await Coupon.findOne({
        code: caseSensitiveCode,
        _id: { $ne: couponId },
      });
      if (existingCoupon) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({ success: false, message: "Coupon code already exists" });
      }
      coupon.code = caseSensitiveCode;
    }

    if (discountPercentage != null) {
      if (discountPercentage < 0 || discountPercentage > 100) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Discount percentage must be between 0 and 100",
          });
      }
      coupon.discountPercentage = discountPercentage;
    }

    if (usageLimit != null) {
      if (usageLimit < 1 || !Number.isInteger(usageLimit)) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Usage limit must be a positive integer",
          });
      }
      coupon.usageLimit = usageLimit;
    }

    if (expirationDate) {
      if (isNaN(new Date(expirationDate).getTime())) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({ success: false, message: "Invalid expiration date" });
      }
      coupon.expirationDate = expirationDate;
    }

    if (minOrderValue != null) {
      if (typeof minOrderValue !== "number" || minOrderValue < 0) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Minimum order value must be a non-negative number",
          });
      }
      coupon.minOrderValue = minOrderValue;
    }

    if (maxDiscountAmount != null) {
      if (typeof maxDiscountAmount !== "number" || maxDiscountAmount < 0) {
        return res
          .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
          .json({
            success: false,
            message: "Max discount amount must be a non-negative number",
          });
      }
      coupon.maxDiscountAmount = maxDiscountAmount;
    }

    if (typeof isActive === "boolean") {
      if (!isActive && coupon.isActive) {
        const activeOrders = await Order.countDocuments({
          coupon: coupon.code,
          status: "Pending",
          isDeleted: false,
        });
        if (activeOrders > 0) {
          return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({
            success: false,
            message: `Cannot deactivate coupon. It is applied to ${activeOrders} pending order(s).`,
          });
        }
      }
      coupon.isActive = isActive;
    } else if (isActive !== undefined) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "isActive must be a boolean value" });
    }

    logger.info(`Updating coupon ${coupon.code} with ID ${couponId}`);
    await coupon.save();
    res.json({
      success: true,
      message: `Coupon ${isActive ? "activated" : "deactivated"} successfully`,
      coupon,
    });
  } catch (err) {
    errorLogger.error("Error updating coupon", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Failed to update coupon due to a server error",
        error: err.message,
      });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    if (!mongoose.isValidObjectId(couponId)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid coupon ID format" });
    }
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ success: false, message: "Coupon not found" });
    }
    if (!coupon.isActive) {
      return res
        .status(STATUS_CODES.SUCCESS.OK)
        .json({ success: true, message: "Coupon is already deactivated" });
    }
    const activeOrders = await Order.countDocuments({
      coupon: coupon.code,
      status: "Pending",
      isDeleted: false,
    });
    if (activeOrders > 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({
        success: false,
        message: `Coupon is applied to ${activeOrders} pending order(s). Consider updating instead.`,
      });
    }
    coupon.isActive = false;
    await coupon.save();
    logger.info(`Coupon ${coupon.code} deactivated successfully`);
    res.json({ success: true, message: "Coupon deactivated successfully" });
  } catch (err) {
    errorLogger.error("Error deactivating coupon", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Failed to deactivate coupon due to a server error",
        error: err.message,
      });
  }
};
