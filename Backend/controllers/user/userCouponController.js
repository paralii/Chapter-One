import Coupon from "../../models/Coupon.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";

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
    res.status(500).json({ success: false, message: "Failed to fetch coupons due to a server error", error: err.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, orderId } = req.body;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID format" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Coupons can only be applied to pending orders" });
    }
    if (!order.items.length) {
      return res.status(400).json({ success: false, message: "Order has no items" });
    }
    if (order.coupon === couponCode.toUpperCase()) {
      return res.status(400).json({ success: false, message: "This coupon is already applied to the order" });
    }

    const coupon = await Coupon.findOneAndUpdate(
      {
        code: couponCode.toUpperCase(),
        isActive: true,
        expirationDate: { $gte: new Date() },
        $expr: { $lt: ["$usedCount", "$usageLimit"] },
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Coupon is invalid, expired, or usage limit exceeded", });
    }

    if (order.total < coupon.minOrderValue) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: -1 } });
      return res.status(400).json({ success: false, message: `Minimum order value of ₹${coupon.minOrderValue} is required for this coupon` });
    }
    if (coupon.usedBy?.map(id => id.toString()).includes(order.user_id.toString())) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: -1 } });
      return res.status(400).json({ success: false, message: "You have already used this coupon." });
    }


let discount = (order.total * coupon.discountPercentage) / 100;
if (coupon.maxDiscountAmount) {
  discount = Math.min(discount, coupon.maxDiscountAmount);
}
    const netAmount = order.total + (order.taxes || 0) + (order.shipping_chrg || 0) - discount;
    if (netAmount < 0) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: -1 } });
      return res.status(400).json({ success: false, message: "Discount cannot exceed order total" });
    }

    order.discount = discount;
    order.netAmount = netAmount;
    order.coupon = couponCode.toUpperCase();
    await Coupon.findByIdAndUpdate(coupon._id, {
  $addToSet: { usedBy: order.user_id },
});

    await order.save();

    const checkoutDetails = {
      subtotal: order.total || 0,
      taxes: order.taxes || 0,
      shippingCost: order.shipping_chrg || 0,
      discount: order.discount || 0,
      finalPrice: order.netAmount || order.total,
    };

    if (
      checkoutDetails.finalPrice !==
      checkoutDetails.subtotal + checkoutDetails.taxes + checkoutDetails.shippingCost - checkoutDetails.discount
    ) {
      console.warn("Price calculation mismatch:", checkoutDetails);
      return res.status(500).json({ success: false, message: "Price calculation error" });
    }

    res.json({ success: true, message: "Coupon applied successfully", checkoutDetails });
  } catch (err) {
    console.error("Error applying coupon:", err.stack);
    res.status(500).json({ success: false, message: "Failed to apply coupon due to a server error", error: err.message });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID format" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.coupon) {
      return res.status(400).json({ success: false, message: "No coupon applied to this order" });
    }

    const coupon = await Coupon.findOneAndUpdate(
      { code: order.coupon },
      { $inc: { usedCount: -1 },
        $pull: { usedBy: order.user_id },
      },
      { new: true }
    );
    if (!coupon) {
      console.warn(`Coupon ${order.coupon} not found during removal`);
    }

      order.discount = 0;
    order.netAmount = order.total;
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
      return res.status(500).json({ success: false, message: "Price calculation error" });
    }

    res.json({ success: true, message: "Coupon removed successfully", checkoutDetails });
  } catch (err) {
    console.error("Error removing coupon:", err.stack);
    res.status(500).json({ success: false, message: "Failed to remove coupon due to a server error", error: err.message });
  }
};