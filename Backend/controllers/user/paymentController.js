import crypto from "crypto";
import razorpay from "../../utils/razorpay.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

export const verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
  
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }
  
      // 🔍 Find order by Razorpay order ID
      const order = await Order.findOne({ razorpay_order_id }).session(session);
      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Order not found" });
      }
  
      // 🛑 Prevent double verification
      if (order.paymentStatus === "Paid") {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ success: true, message: "Payment already verified" });
      }
  
      // ✅ Update payment status
      order.paymentStatus = "Paid";
      order.payment_id = razorpay_payment_id;
      order.status = "confirmed"; // optional - you can change this based on your order lifecycle
  
      await order.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({ success: true, message: "Payment verified and order updated" });
  
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Payment verification failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };