import Coupon from "../../models/Coupon.js";
import Order from "../../models/Order.js";  // Assuming you have an Order model

// Apply coupon to order during checkout
export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon code" });
    }

    // Check if the coupon is expired
    if (coupon.expirationDate && new Date() > coupon.expirationDate) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    // Check if the coupon has been used up
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon usage limit exceeded" });
    }

    // Apply coupon discount to the order
    const discount = (order.total * coupon.discountPercentage) / 100;
    order.netAmount = order.total - discount;

    // Save coupon usage count and order updates
    coupon.usedCount += 1;
    await coupon.save();

    order.coupon = couponCode;  // Add the coupon code to the order
    await order.save();

    res.json({ success: true, message: "Coupon applied successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error applying coupon" });
  }
};

// Remove applied coupon
export const removeCoupon = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.coupon) {
      return res.status(400).json({ success: false, message: "No coupon applied" });
    }

    const coupon = await Coupon.findOne({ code: order.coupon });

    // Revert the discount
    const discount = (order.total * coupon.discountPercentage) / 100;
    order.netAmount = order.total;

    // Save order and reset coupon field
    order.coupon = null;
    await order.save();

    res.json({ success: true, message: "Coupon removed successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error removing coupon" });
  }
};
