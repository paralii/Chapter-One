import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Product from "../models/Product.js";
import { creditWallet } from "./user/userWalletController.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const INVOICE_DIR = path.resolve("invoices");

// Utility to generate and save invoice
const generateAndSaveInvoice = async (order, user) => {
  if (!fs.existsSync(INVOICE_DIR)) {
    fs.mkdirSync(INVOICE_DIR, { recursive: true });
  }

  const invoicePath = path.join(INVOICE_DIR, `invoice_${order.orderID}_admin.pdf`);
  await generateInvoicePDF(order, user, invoicePath);
  return invoicePath;
};

// List all active orders with pagination and search
export const listAllOrders = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const userMatch = await User.find({
      $or: [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }).select("_id");

    const filter = {
      isDeleted: false,
      $or: [
        { orderID: { $regex: search, $options: "i" } },
        { user_id: { $in: userMatch.map(u => u._id) } }
      ]
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ order_date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user_id", "firstname lastname email"),
      Order.countDocuments(filter)
    ]);

    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

// Get full order details by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
      .populate("items.product_id", "title price")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching order details" });
  }
};

// Admin update overall order status
export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false }).session(session);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status === "cancelled") return res.status(400).json({ success: false, message: "Cancelled orders can't be updated" });

    order.status = status;
    await order.save({ session });

    await session.commitTransaction();
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Error updating order status" });
  } finally {
    session.endSession();
  }
};

// Mark item as delivered
export const markItemDelivered = async (req, res) => {
  try {
    const { orderId, productId } = req.body;
    const order = await Order.findOne({ _id: orderId, isDeleted: false });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const item = order.items.find(i => i.product_id.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    if (["cancelled", "returned", "delivered"].includes(item.status)) {
      return res.status(400).json({ success: false, message: `Item already ${item.status}` });
    }

    item.status = "delivered";
    await order.save();

    const allDelivered = order.items.every(i => i.status === "delivered");
    if (allDelivered && order.status !== "delivered") {
      order.status = "delivered";
      await order.save();
    }

    res.json({ success: true, message: "Item marked as delivered" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error marking item delivered" });
  }
};

// Admin invoice download
export const downloadAdminInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
      .populate("items.product_id", "title price")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const invoicePath = await generateAndSaveInvoice(order, order.user_id);

    if (!fs.existsSync(invoicePath)) {
      return res.status(400).json({ success: false, message: "Invoice generation failed" });
    }

    res.download(invoicePath, async err => {
      if (err) return res.status(500).json({ success: false, message: "Download failed" });
      await fsPromises.unlink(invoicePath).catch(() => {});
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error generating invoice" });
  }
};

// Admin soft delete order
export const softDeleteOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).session(session);

    if (!order || order.isDeleted) {
      return res.status(404).json({ success: false, message: "Order not found or already deleted" });
    }

    if (order.status === "delivered") {
      return res.status(400).json({ success: false, message: "Delivered orders can't be deleted" });
    }

    for (const item of order.items) {
      if (item.status === "ordered") {
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { available_quantity: item.quantity }
        });
        item.status = "cancelled";
        item.cancelReason = "Admin soft delete";
      }
    }

    order.isDeleted = true;
    order.deletedAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    res.json({ success: true, message: "Order soft deleted" });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Error deleting order" });
  } finally {
    session.endSession();
  }
};

// Admin verifies return request
export const verifyReturnRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, productId, returnApproved } = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const item = order.items.find(item => item.product_id.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in order" });

    if (item.status !== "returned") {
      return res.status(400).json({ success: false, message: "Item is not marked as returned" });
    }

    if (returnApproved) {
      const creditResult = await creditWallet(order.user_id, item.total, `Refund for returned item from Order ${order.orderID}`);
      if (!creditResult.success) {
        throw new Error("Wallet credit failed");
      }

      item.returnVerified = true;
      item.returnDecision = "approved";
      await order.save({ session });

      await session.commitTransaction();
      res.json({ success: true, message: "Return approved and wallet refunded" });
    } else {
      item.returnVerified = true;
      item.returnDecision = "rejected";
      await order.save({ session });

      await session.commitTransaction();
      res.json({ success: true, message: "Return request rejected" });
    }
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Error verifying return", error: err.message });
  } finally {
    session.endSession();
  }
};
 