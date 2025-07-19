import Offer from "../../models/Offer.js";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import Coupon from "../../models/Coupon.js";
import User from "../../models/User.js";

export const getReferralOffer = async (req, res) => {
  try {
    let offer = await Offer.findOne({ user_id: req.user._id, type: "REFERRAL" });
    if (!offer) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      offer = new Offer({
        type: "REFERRAL",
        user_id: req.user._id,
        referral_code: user.referral_code,
        discount_type: "PERCENTAGE",
        discount_value: 10,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        is_active: true,
      });
      await offer.save();
    }
    if (!offer.is_active) {
      return res.status(403).json({ success: false, message: offer.block_message || "Referral offer is disabled" });
    }
    const referralLink = `${process.env.CORS_URL}/signup?ref=${offer.referral_code}`;
    res.json({ success: true, referralCode: offer.referral_code, referralLink });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const getReferralStats = async (req, res) => {
  try {
    const referrals = await User.countDocuments({ referred_by: req.user._id });
    res.json({ success: true, referrals });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


export const getReferralCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      usedBy: req.user._id,
      isActive: true,
      expirationDate: { $gte: new Date() },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const validateReferral = async (req, res) => {
  try {
    const { referral_code } = req.body;
    if (!referral_code || !referral_code.match(/^[A-Z0-9-]+$/)) {
      return res.status(400).json({ success: false, message: "Invalid referral code format" });
    }
    const referrerOffer = await Offer.findOne({
      referral_code,
      type: "REFERRAL",
      is_active: true,
      end_date: { $gte: new Date() },
    });
    if (!referrerOffer) {
      return res.status(400).json({ success: false, message: "Invalid or inactive referral code" });
    }
    if (referrerOffer.user_id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot refer yourself" });
    }
    res.json({ success: true, message: "Referral code validated", offer: referrerOffer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const getActiveOffers = async (req, res) => {
  try {
    const { type, productId, categoryId } = req.query;
    const query = { is_active: true, end_date: { $gte: new Date() } };
    if (type && ["PRODUCT", "CATEGORY", "REFERRAL"].includes(type)) query.type = type;
    if (productId) query.product_id = productId;
    if (categoryId) query.category_id = categoryId;

    const offers = await Offer.find(query)
      .populate("product_id", "title price")
      .populate("category_id", "name")
      .populate("user_id", "email");
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const applyReferralOffer = async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode.match(/^[A-Z0-9-]+$/)) {
      return res.status(400).json({ success: false, message: "Invalid referral code format" });
    }
    const offer = await Offer.findOne({
      type: "REFERRAL",
      referral_code: referralCode,
      is_active: true,
      end_date: { $gte: new Date() },
    }).populate("user_id", "email");
    if (!offer) return res.status(404).json({ success: false, message: "Invalid or inactive referral code" });
    res.json({ success: true, offer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};