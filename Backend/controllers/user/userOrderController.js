import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Wallet from "../models/Wallet.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import mongoose from "mongoose";

const INVOICE_DIR = path.resolve("invoices");

// Generate a unique readable order ID
const generateOrderID = () => {
  return "CHAP" + Date.now() + Math.floor(Math.random() * 1000);
};

// 1. Place Order 
export const placeOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const userId = req.user._id;
      const {
        address_id,
        items,
        shipping_chrg = 0,
        discount = 0,
        paymentMethod,
        razorpay_order_id, // For online payments
      } = req.body;
  
      // 1. Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items to order" });
      }
  
      // 2. Validate address
      const address = await Address.findOne({ _id: address_id, user_id: userId }).session(session);
      if (!address) {
        return res.status(400).json({ message: "Invalid or unauthorized address" });
      }
  
      // 3. Process items: validate stock, calculate totals
      let subtotal = 0;
      const orderItems = [];
  
      for (const item of items) {
        const product = await Product.findById(item.product_id).session(session);
        if (!product || product.isDeleted) {
          return res.status(400).json({ message: `Product not available: ${item.product_id}` });
        }
  
        if (product.available_quantity < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for: ${product.title}` });
        }
  
        const price = product.price;
        const total = price * item.quantity;
        subtotal += total;
  
        // Deduct stock
        product.available_quantity -= item.quantity;
        await product.save({ session });
  
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price,
          total,
        });
      }
  
      // 4. Calculate net amount
      const netAmount = subtotal + shipping_chrg - discount;
  
      // 5. Create order document
      const order = new Order({
        orderID: generateOrderID(),
        user_id: userId,
        address_id,
        paymentMethod: paymentMethod || "COD",
        paymentStatus: paymentMethod === "ONLINE" ? "Pending" : "Paid",
        razorpay_order_id: paymentMethod === "ONLINE" ? razorpay_order_id : undefined,
        shipping_chrg,
        discount,
        total: subtotal,
        netAmount,
        items: orderItems,
      });
  
      await order.save({ session });
  
      // 6. Commit the transaction
      await session.commitTransaction();
      session.endSession();
  
      res.status(201).json({ message: "Order placed successfully", order });
    } catch (err) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      console.error("Order placement failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

// 2. List Orders for User
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search = "", page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      user_id: userId,
      orderID: { $regex: search, $options: "i" },
    };

    const orders = await Order.find(filter)
      .sort({ order_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// 3. Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId, user_id: userId })
      .populate("items.product_id", "title price")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order details" });
  }
};

// 4. Cancel Order or Item
export const cancelOrderOrItem = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (productId) {
      const item = order.items.find(item => item.product_id.toString() === productId);
      if (!item) {
        return res.status(404).json({ message: "Item not found in order" });
      }
      if (item.status !== 'placed') {
        return res.status(400).json({ success: false, message: 'Only items not yet shipped can be cancelled' });
      }
      if (["cancelled", "returned"].includes(item.status)) {
        return res.status(400).json({ message: `Item already ${item.status}` });
      }
      if (item.status !== "ordered") {
        return res.status(400).json({ message: "Item not cancellable" });
      }
      item.status = "cancelled";
      item.cancelReason = reason;
      await Product.findByIdAndUpdate(productId, { $inc: { available_quantity: item.quantity } });

      if (order.paymentMethod === "ONLINE" && order.paymentStatus === "Paid") {
        await refundToWallet(userId, item.total, `Refund for cancelled item from Order ${order.orderID}`);
      }

    } else {
      if (order.status === "cancelled" || order.status === "delivered") {
        return res.status(400).json({ message: "Order already processed" });
      }
      order.status = "cancelled";
      for (const item of order.items) {
        if (item.status === "ordered") {
          item.status = "cancelled";
          item.cancelReason = reason;
          await Product.findByIdAndUpdate(item.product_id, { $inc: { available_quantity: item.quantity } });

          if (order.paymentMethod === "ONLINE" && order.paymentStatus === "Paid") {
            const refundableAmount = order.items.reduce((sum, item) => {
              return item.status === "cancelled" ? sum + item.total : sum;
            }, 0);
            if (refundableAmount > 0) {
              await refundToWallet(userId, refundableAmount, `Refund for cancelled Order ${order.orderID}`);
            }
          }
        }
      }
    }

    await order.save();
    res.json({ message: "Cancellation processed" });
  } catch (err) {
    res.status(500).json({ message: "Error processing cancellation" });
  }
};

// 5. Return Delivered Item
export const returnOrderItem = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    const userId = req.user._id;

    if (!reason) return res.status(400).json({ message: "Return reason required" });

    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.items.find(item => item.product_id.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }
    if (item.status === "returned") {
      return res.status(400).json({ success: false, message: 'Item already in return process or returned' });
    }
    if (item.status !== "delivered") {
      return res.status(400).json({  success: false, message: 'Only delivered items can be returned' });
    }

    item.status = "returned";
    item.returnReason = reason;

    if (order.paymentMethod === "ONLINE" && order.paymentStatus === "Paid") {
        await refundToWallet(userId, item.total, `Refund for returned item from Order ${order.orderID}`);
      }

    await order.save();
    res.json({ message: "Return request submitted" });
  } catch (err) {
    res.status(500).json({ message: "Error submitting return request" });
  }
};

const refundToWallet = async (userId, amount, description = "Refund") => {
    const wallet = await Wallet.findOneAndUpdate(
      { user_id: userId },
      {
        $inc: { balance: amount },
        $push: {
          transactions: {
            type: "credit",
            amount,
            description,
            date: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );
    return wallet;
  };

// 6. Download Invoice
export const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user_id: userId })
      .populate("items.product_id", "title price")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!fs.existsSync(INVOICE_DIR)) {
      fs.mkdirSync(INVOICE_DIR, { recursive: true });
    }

    const invoicePath = path.join(INVOICE_DIR, `invoice_${order.orderID}_${userId}.pdf`);
    await generateInvoicePDF(order, order.user_id, invoicePath);

    if (!fs.existsSync(invoicePath)) {
      return res.status(400).json({ message: "Invoice file not generated" });
    }

    res.download(invoicePath, async err => {
      if (err) {
        return res.status(500).json({ message: "Failed to download invoice" });
      }
      try {
        await fsPromises.unlink(invoicePath);
      } catch (unlinkErr) {
        console.warn("Invoice file cleanup failed:", unlinkErr.message);
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error generating invoice" });
  }
};

