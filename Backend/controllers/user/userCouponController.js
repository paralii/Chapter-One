import Coupon from "../../models/Coupon.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

export const getAvailableCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expirationDate: { $gte: new Date() },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    });
    res.json({ success: true, coupons });
  } catch (err) {
    console.error("Error fetching available coupons:", err.stack);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch coupons due to a server error", error: err.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, orderId } = req.body;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Invalid order ID format" });
    }
    if (!couponCode || typeof couponCode !== "string" || !couponCode.trim()) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Coupon code is required" });
    }

    const order = await Order.findById(orderId).populate("items.product_id");
    if (!order) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "Pending") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Coupons can only be applied to pending orders" });
    }
    if (!order.items.length) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Order has no items" });
    }
    if (order.coupon === couponCode.toUpperCase()) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "This coupon is already applied to the order" });
    }

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expirationDate: { $gte: new Date() },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    });

    if (!coupon) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Coupon is invalid, expired, or usage limit exceeded" });
    }

    if (order.total < (coupon.minOrderValue || 0)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} is required for this coupon (current total: ₹${order.total.toFixed(2)})`,
      });
    }
    if (coupon.usedBy?.map(id => id.toString()).includes(order.user_id.toString())) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "You have already used this coupon" });
    }

    const productDiscount = order.discount || 0;

let couponBase = order.amount - productDiscount;
let couponDiscount = (couponBase * coupon.discountPercentage) / 100;

if (coupon.maxDiscountAmount) {
  couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
}

const totalDiscount = productDiscount + couponDiscount;

order.discount = totalDiscount;
const netAmount = order.total + (order.taxes || 0) + (order.shipping_chrg || 0) - totalDiscount;

if (netAmount < 0) {
  return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({
    success: false,
    message: "Discount cannot exceed order total"
  });
}

order.netAmount = netAmount;


    const checkoutDetails = {
  address: order.address_id,
  paymentMethod: order.paymentMethod,
  items: order.items.map(item => ({
    product_id: item.product_id._id,
    title: item.product_id.title,
    quantity: item.quantity,
    itemTotal: item.product_id.price * item.quantity,
    taxes:
      ((item.product_id.price * item.quantity) -
        ((item.product_id.price * item.quantity) *
          item.product_id.discount) / 100) * 0.18,
    finalItemTotal:
      (item.product_id.price * item.quantity) *
      (1 - (item.product_id.discount || 0) / 100),
    applied_offer: item.applied_offer || null,
    refundProcessed: false,
  })),
  amount: order.amount,
  subtotal: order.amount - productDiscount, 
  taxes: order.taxes || 0,
  shippingCost: order.shipping_chrg || 0,
  discount: order.discount || 0, 
  finalPrice: order.netAmount,
};


    const expectedFinal =
  checkoutDetails.subtotal +
  checkoutDetails.taxes +
  checkoutDetails.shippingCost -
  checkoutDetails.discount;

if (Math.abs(checkoutDetails.finalPrice - expectedFinal) > 0.01) {
  console.warn("Price calculation mismatch:", checkoutDetails, { expectedFinal });
  return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Price calculation error"
  });
}

    order.coupon = couponCode.toUpperCase();
    await Coupon.findByIdAndUpdate(coupon._id, {
      $inc: { usedCount: 1 },
      $addToSet: { usedBy: order.user_id },
    });
    console.log(`order coupon :`,order)
    await order.save();

    res.json({ success: true, message: "Coupon applied successfully", checkoutDetails });
  } catch (err) {
    console.error("Error applying coupon:", err.stack);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to apply coupon due to a server error", error: err.message });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Invalid order ID format" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (!order.coupon) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "No coupon applied to this order" });
    }

    const coupon = await Coupon.findOneAndUpdate(
      { code: order.coupon },
      { $inc: { usedCount: -1 }, $pull: { usedBy: order.user_id } },
      { new: true }
    );
    if (!coupon) {
      console.warn(`Coupon ${order.coupon} not found during removal`);
    }

    order.discount = 0;
    order.netAmount = order.total + (order.taxes || 0) + (order.shipping_chrg || 0);
    order.coupon = null;
    await order.save();

    const checkoutDetails = {
      subtotal: order.total || 0,
      taxes: order.taxes || 0,
      shippingCost: order.shipping_chrg || 0,
      discount: 0,
      finalPrice: order.netAmount || order.total,
    };

    if (
      checkoutDetails.finalPrice !==
      checkoutDetails.subtotal + checkoutDetails.taxes + checkoutDetails.shippingCost - checkoutDetails.discount
    ) {
      console.warn("Price calculation mismatch:", checkoutDetails);
      return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Price calculation error" });
    }

    res.json({ success: true, message: "Coupon removed successfully", checkoutDetails });
  } catch (err) {
    console.error("Error removing coupon:", err.stack);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to remove coupon due to a server error", error: err.message });
  }
};