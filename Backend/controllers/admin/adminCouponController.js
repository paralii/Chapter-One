import Coupon from "../../models/Coupon.js";

// Create new coupon
export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, expirationDate, usageLimit } = req.body;

    // Validate input
    if (!code || !discountPercentage) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = new Coupon({
      code,
      discountPercentage,
      expirationDate,
      usageLimit,
    });

    await coupon.save();
    res.json({ success: true, message: "Coupon created successfully", coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating coupon" });
  }
};

// Update existing coupon
export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { discountPercentage, expirationDate, usageLimit, isActive } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (discountPercentage) coupon.discountPercentage = discountPercentage;
    if (expirationDate) coupon.expirationDate = expirationDate;
    if (usageLimit) coupon.usageLimit = usageLimit;
    if (typeof isActive !== "undefined") coupon.isActive = isActive;

    await coupon.save();
    res.json({ success: true, message: "Coupon updated successfully", coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating coupon" });
  }
};

// Delete coupon (disable it)
export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = false;
    await coupon.save();

    res.json({ success: true, message: "Coupon deactivated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting coupon" });
  }
};

// Fetch all coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true });
    res.json({ success: true, coupons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching coupons" });
  }
};

// Fetch coupon by ID
export const getCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching coupon" });
  }
};
