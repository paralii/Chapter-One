import crypto from "crypto";
import razorpay from "../../utils/razorpay.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Wallet from "../../models/Wallet.js";

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, order_id } = req.body;


    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: `Invalid amount: ${amount}` });
    }
    if (!mongoose.isValidObjectId(order_id)) {
      return res.status(400).json({ message: `Invalid order ID: ${order_id}` });
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.paymentStatus === "Completed") {
      return res.status(400).json({ message: "Order already paid" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${order_id}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order: razorpayOrder });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    let {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = req.body;


    razorpay_order_id = razorpay_order_id.trim();
    razorpay_payment_id = razorpay_payment_id.trim();
    razorpay_signature = razorpay_signature.trim();

    if (!mongoose.isValidObjectId(order_id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (generatedSignature !== razorpay_signature) {
      await Order.findByIdAndUpdate(order_id, { paymentStatus: "Failed" });

      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // 🔍 Find order by Razorpay order ID
    const order = await Order.findOne({ _id: order_id });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    // 🛑 Prevent double verification
    if (order.paymentStatus === "Completed") {
      return res
        .status(200)
        .json({ success: true, message: "Payment already verified" });
    }

    // ✅ Update payment status
    order.paymentStatus = "Completed";
    order.payment_id = razorpay_payment_id;
    order.razorpay_order_id = razorpay_order_id;

    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Payment verified and order updated" });
  } catch (err) {
    console.error("Payment verification failed:", err);
    if (mongoose.isValidObjectId(req.body.order_id)) {
      const order = await Order.findById(req.body.order_id);
      if (order) {
        await Order.findByIdAndUpdate(req.body.order_id, { paymentStatus: "Failed" });
        for (const item of order.items) {
          const product = await Product.findById(item.product_id);
          if (product) {
            product.available_quantity += item.quantity;
            await product.save();
          }
        }
    }
    res.status(500).json({ message: "Internal server error" });
  }
  }}