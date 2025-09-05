import Order from "../../models/Order.js";
import User from "../../models/User.js"
import Product from "../../models/Product.js";
import Address from "../../models/Address.js";
import Cart from "../../models/Cart.js";
import Offer from "../../models/Offer.js";
import Wallet from "../../models/Wallet.js";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF.js";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

const INVOICE_DIR = path.join(process.cwd(), 'invoices');

export const getPendingOrder = async (req, res) => {
  try {
    // Get any pending order
    const order = await Order.findOne({
      user_id: req.user._id,
      status: { $in: ["Pending", "Processing"] },
      isDeleted: false,
    }).lean();

    if (!order) {
      return res.json({ success: true, order: null });
    }

    // Check if the order is expired (30 minutes old)
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const timeDiff = (now - orderDate) / (1000 * 60); // difference in minutes

    if (timeDiff > 30) {
      // Mark the order as expired
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: "Expired",
          cancellation_reason: "Order expired due to inactivity"
        }
      });

      // Return no pending order
      return res.json({ success: true, order: null });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Error fetching pending order:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: "Failed to fetch pending order", 
      error: err.message 
    });
  }
};

export const placeOrder = async (req, res) => {
  const { orderId, paymentMethod } = req.body;
  const userId = req.user._id;

  try {
    const pendingOrder = await Order.findOne({
      _id: orderId,
      user_id: userId,
      paymentStatus: "Pending",
      isDeleted: false,
    }).populate("items.product_id");

    if (!pendingOrder) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "No pending checkout order found" });
    }

    if (!paymentMethod || !["COD", "ONLINE", "Wallet"].includes(paymentMethod)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Payment method must be COD, ONLINE, or Wallet",
        });
    }

    if (paymentMethod === "COD" && pendingOrder.netAmount > 1000) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({
          success: false,
          message: "Cash on Delivery is not allowed for orders above Rs 1000",
        });
    }

    for (const item of pendingOrder.items) {
      if (item.product_id.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product_id.name} is out of stock`,
        });
      }
    }

    if (paymentMethod === "Wallet") {
      const wallet = await Wallet.findOne({user_id:userId});
      console.log(`wallet`,wallet);
      if (wallet.balance < pendingOrder.netAmount) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient wallet balance" });
      }
      wallet.balance -= pendingOrder.netAmount;
      wallet.transactions.push({
        type: "debit",
        amount: pendingOrder.netAmount,
        description: `Order payment - ${pendingOrder.orderID}`,
      });
      await wallet.save();
      pendingOrder.paymentStatus = "Completed";
    }

    if (paymentMethod === "COD") {
      pendingOrder.paymentStatus = "Completed";
    }

    if (paymentMethod === "ONLINE") {
      pendingOrder.paymentStatus = "Pending"; // will update after verify
    }

    pendingOrder.status = "Processing";
    pendingOrder.paymentMethod = paymentMethod;
    pendingOrder.status = paymentMethod === "ONLINE" ? "Pending" : "Processing";
    pendingOrder.order_date = new Date();

    await pendingOrder.save();

    if (paymentMethod !== "ONLINE") {
      for (const item of pendingOrder.items) {
        item.product_id.stock -= item.quantity;
        await item.product_id.save();
      }
      await Cart.findOneAndUpdate({ user_id: userId }, { items: [] });
    }
    res.json({
      success: true,
      message: paymentMethod === "ONLINE"
        ? "Razorpay order initialized. Proceed with payment."
        : "Order placed successfully",
      order: pendingOrder,
    });
  } catch (err) {
    console.error("Error placing order:", err);
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to place order" });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search = '', page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: 'Invalid page or limit' });
    }

    const skip = (pageNum - 1) * limitNum;
    const filter = {
      user_id: userId,
      orderID: { $regex: search, $options: 'i' },
      isDeleted: false,
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product_id', 'title price product_imgs')
        .sort({ order_date: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching orders' });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;

        if (!mongoose.isValidObjectId(orderId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: orderId, user_id: userId })
      .populate("items.product_id")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Error fetching order details" });
  }
};

export const cancelOrderOrItem = async (req, res) => {
  try {
    const { orderId, itemId, reason } = req.body;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Invalid order ID format" });
    }
    const order = await Order.findById(orderId).populate("items.product_id");
    if (!order || order.user_id.toString() !== req.user._id.toString()) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found or unauthorized" });
    }
    if (["Delivered", "Returned", "Cancelled"].includes(order.status)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: `Order cannot be cancelled, current status: ${order.status}` });
    }
    if (itemId) {
      const item = order.items.find(i => i._id.toString() === itemId);
      if (!item) {
        return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Item not found in order" });
      }
      item.status = "Cancelled";
      item.cancellation_reason = reason || "No reason provided";
      order.total -= item.price * item.quantity;
      order.netAmount = order.total + (order.taxes || 0) + (order.shipping_chrg || 0) - (order.discount || 0);
      await Product.findByIdAndUpdate(item.product_id._id, {
        $inc: { available_quantity: item.quantity },
      });
      if (order.items.every(i => i.status === "Cancelled")) {
        order.status = "Cancelled";
      }
    } else {
      order.status = "Cancelled";
      order.cancellation_reason = reason || "No reason provided";
for (const item of order.items) {
    item.status = "Cancelled";
    item.cancellation_reason = reason || "No reason provided";
    await Product.findByIdAndUpdate(item.product_id._id, {
      $inc: { available_quantity: item.quantity },
    });
      };
    }
    await order.save();
    res.json({ success: true, message: "Cancellation processed successfully" });
  } catch (err) {
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to cancel order", error: err.message });
  }
};

export const returnOrderItem = async (req, res) => {
  try {
    const { orderId, itemId, reason } = req.body;

    if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(itemId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Invalid order or item ID format" });
    }

    if (!reason || !reason.trim()) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Return reason is required" });
    }

    const order = await Order.findById(orderId).populate("items.product_id");

    if (!order || order.user_id.toString() !== req.user._id.toString()) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found or unauthorized" });
    }

    if (order.status !== "Delivered") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Only delivered orders can be returned" });
    }

    const item = order.items.find(i => i._id.toString() === itemId);

    if (!item) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Item not found in order" });
    }

    if (item.status !== "Delivered") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Item is not eligible for return" });
    }

    item.status = "Returned";
    item.returnReason = reason;

    await Product.findByIdAndUpdate(item.product_id._id, {
      $inc: { available_quantity: item.quantity },
    });

    await order.save();

    res.json({ success: true, message: "Return request submitted" });

  } catch (err) {
    console.error("❌ Step Error:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to process return", error: err.message });
  }
};


export const refundToWallet = async (userId, amount, description = "Refund") => {
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

export const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user_id: userId })
      .populate("items.product_id")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ message: "Order not found" });

    const productMap = {};
    order.items.forEach(item => {
      if (item.product_id) {
        productMap[item.product_id._id.toString()] = {
          title: item.product_id.title,
          price: item.product_id.price,
          product_imgs: item.product_id.product_imgs || [],
        };
      }
    });

    const address = order.address_id;

    if (!fs.existsSync(INVOICE_DIR)) {
      fs.mkdirSync(INVOICE_DIR, { recursive: true });
    }

    const invoicePath = path.join(
      INVOICE_DIR,
      `invoice_${order.orderID}_${userId}.pdf`
    );

    await generateInvoicePDF(order, order.user_id, address, productMap, invoicePath);

    if (!fs.existsSync(invoicePath)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invoice file not generated" });
    }

    const pdfBuffer = await fsPromises.readFile(invoicePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderID}.pdf`);
    res.send(pdfBuffer);

    await fsPromises.unlink(invoicePath).catch(err => console.warn('Invoice cleanup failed:', err));
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Error generating invoice" });
  }
};

