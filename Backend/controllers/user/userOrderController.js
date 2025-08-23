import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Address from "../../models/Address.js";
import Wallet from "../../models/Wallet.js";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF.js";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import Cart from "../../models/Cart.js";
import mongoose from "mongoose";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

const INVOICE_DIR = path.join(process.cwd(), 'invoices');

const generateOrderID = () => {
  return "CHAP" + Date.now() + Math.floor(Math.random() * 1000);
};

export const getPendingOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      user_id: req.user._id,
      status: "Pending",
      isDeleted: false,
    }).lean();
    res.json({ success: true, order });
  } catch (err) {
    console.error("Error fetching pending order:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch pending order", error: err.message });
  }
};

export const createTempOrder = async (req, res) => {
  try {
    const {
      address_id,
      items,
      shipping_chrg = 0,
      discount = 0,
      paymentMethod,
      amount,
      taxes = 0,
      total,
      currency = "INR",
      coupon,
    } = req.body;

    if (!address_id) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Address ID is required" });
    }
    if (!mongoose.isValidObjectId(address_id)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Invalid address ID format" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Items array is required and cannot be empty" });
    }
    if (!paymentMethod || !["COD", "ONLINE", "Wallet"].includes(paymentMethod)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Payment method must be COD, ONLINE, or Wallet" });
    }
    if (amount == null || isNaN(amount) || amount <= 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Amount must be a positive number" });
    }
    if (total == null || isNaN(total) || total <= 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Total must be a positive number" });
    }

    const validatedItems = items.map((item) => {
      if (!mongoose.isValidObjectId(item.product_id)) {
        throw new Error(`Invalid product ID: ${item.product_id}`);
      }
      if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        throw new Error(`Invalid quantity for product ${item.product_id}`);
      }
      if (item.price == null || isNaN(item.price) || item.price <= 0) {
        throw new Error(`Invalid price for product ${item.product_id}`);
      }
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
        status: "Pending",
        refundProcessed: false,
        cancelReason: null,
        returnReason: null,
        returnVerified: false,
        returnDecision: null,
      };
    });

    if (isNaN(shipping_chrg) || shipping_chrg < 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Shipping charge must be a non-negative number" });
    }
    if (isNaN(discount) || discount < 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Discount must be a non-negative number" });
    }
    if (isNaN(taxes) || taxes < 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Taxes must be a non-negative number" });
    }

    const netAmount = total - discount + taxes + shipping_chrg;
    if (isNaN(netAmount) || netAmount <= 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Calculated net amount must be a positive number" });
    }

    if (paymentMethod === "COD" && netAmount > 1000) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Cash on Delivery is not allowed for orders above Rs 1000" });
    }

    const existingOrder = await Order.findOne({
      user_id: req.user._id,
      status: "Pending",
      isDeleted: false,
      paymentStatus: { $ne: "Completed" },
    });

    if (existingOrder) {
      const existingItems = existingOrder.items.map(i => ({
        product_id: i.product_id.toString(),
        quantity: i.quantity,
      }));
      const newItems = validatedItems.map(i => ({
        product_id: i.product_id.toString(),
        quantity: i.quantity,
      }));
      const itemsMatch = existingItems.length === newItems.length &&
        existingItems.every(ei => newItems.some(ni => ni.product_id === ei.product_id && ni.quantity === ni.quantity));

      if (!itemsMatch) {
        await Order.findByIdAndUpdate(existingOrder._id, {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            cancellation_reason: "Mismatched items with new cart",
          },
        });
      } else {
        return res.json({ success: true, message: "Existing temporary order found", order: existingOrder });
      }
    }

    const staleDate = new Date(Date.now() - 1 * 60 * 60 * 1000);
    await Order.updateMany(
      {
        user_id: req.user._id,
        status: "Pending",
        isDeleted: false,
        createdAt: { $lt: staleDate },
        paymentStatus: { $ne: "Completed" },
      },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    const order = new Order({
      orderID: generateOrderID(),
      user_id: req.user._id,
      address_id,
      items: validatedItems,
      shipping_chrg,
      discount,
      paymentMethod,
      amount,
      taxes,
      total,
      netAmount,
      currency,
      coupon: coupon || null,
      status: "Pending",
      isDeleted: false,
    });

    await order.save();
    res.json({ success: true, message: "Temporary order created successfully", order });
  } catch (err) {
    console.error("Error creating temporary order:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to create temporary order", error: err.message });
  }
};

export const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      address_id,
      items,
      shipping_chrg = 0,
      discount = 0,
      paymentMethod,
      razorpay_order_id,
      payment_id,
      amount,
      taxes = 0,
      total,
      currency = "INR",
      coupon,
    } = req.body;


    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "No items to order" });
    }
    if (!mongoose.isValidObjectId(address_id)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid address ID" });
    }
    if (!["COD", "ONLINE", "Wallet"].includes(paymentMethod)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: `Invalid payment method: ${paymentMethod}. Allowed values: COD, ONLINE, Wallet` });
    }
    if (paymentMethod === "ONLINE" && (!razorpay_order_id || !payment_id)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Razorpay order ID and payment ID are required for ONLINE payment" });
    }
    if (paymentMethod === "Wallet" && !payment_id) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Payment ID is required for Wallet payment" });
    }
    if (amount == null || isNaN(amount) || amount <= 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Amount must be a positive number" });
    }
    if (total == null || isNaN(total) || total <= 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Total must be a positive number" });
    }

    const address = await Address.findOne({ _id: address_id, user_id: userId });
    if (!address) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid or unauthorized address" });
    }

    let subtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const item of items) {
      if (!mongoose.isValidObjectId(item.product_id)) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: `Invalid product ID: ${item.product_id}` });
      }
      const product = await Product.findById(item.product_id);
      if (!product || product.isDeleted) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: `Product not available: ${item.product_id}` });
      }
      if (product.available_quantity < item.quantity) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: `Insufficient stock for: ${product.title}` });
      }

      const price = product.price * (1 - (product.discount || 0) / 100);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      stockUpdates.push({ product, quantity: item.quantity });

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price,
        total: itemTotal,
        status: "Pending",
        refundProcessed: false,
        cancelReason: null,
        returnReason: null,
        returnVerified: false,
        returnDecision: null,
      });
    }

    if (isNaN(shipping_chrg) || shipping_chrg < 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Shipping charge must be a non-negative number" });
    }
    if (isNaN(discount) || discount < 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Discount must be a non-negative number" });
    }
    if (isNaN(taxes) || taxes < 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Taxes must be a non-negative number" });
    }

    const netAmount = subtotal + shipping_chrg + taxes - discount;
    if (isNaN(netAmount) || netAmount <= 0) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Invalid order amount" });
    }

    if (paymentMethod === "COD" && netAmount > 1000) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Cash on Delivery is not allowed for orders above Rs 1000" });
    }

    if (paymentMethod === "Wallet") {
      const wallet = await Wallet.findOne({ user_id: userId });
      if (!wallet || wallet.balance < netAmount) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ message: "Insufficient wallet balance" });
      }
      await Wallet.findOneAndUpdate(
        { user_id: userId },
        {
          $inc: { balance: -netAmount },
          $push: {
            transactions: {
              type: "debit",
              amount: netAmount,
              description: `Order ${generateOrderID()}`,
              date: new Date(),
            },
          },
        }
      );
    }

    if (paymentMethod === "ONLINE") {
      const existingOrder = await Order.findOne({
        $or: [
          { razorpay_order_id, isDeleted: false },
          { payment_id, isDeleted: false },
        ],
      });
      if (existingOrder) {
        return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({
          message: `Duplicate order detected: ${existingOrder.razorpay_order_id ? `razorpay_order_id ${razorpay_order_id}` : `payment_id ${payment_id}`}`,
        });
      }
    }

    const order = new Order({
      orderID: generateOrderID(),
      user_id: userId,
      address_id,
      paymentMethod,
      paymentStatus: paymentMethod === "ONLINE" || paymentMethod === "Wallet" ? "Completed" : "Pending",
      status: "Pending",
      razorpay_order_id: paymentMethod === "ONLINE" ? razorpay_order_id : undefined,
      payment_id: paymentMethod === "ONLINE" || paymentMethod === "Wallet" ? payment_id : undefined,
      shipping_chrg,
      discount,
      total: subtotal,
      taxes,
      netAmount,
      items: orderItems,
      currency,
      coupon: coupon || null,
      applied_offers: [],
      order_date: new Date(),
      isDeleted: false,
    });

    try {
      await order.save();
    } catch (err) {
      console.error("Failed to save order:", err);
      for (const { product, quantity } of stockUpdates) {
        product.available_quantity += quantity;
        await product.save();
      }
      return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Failed to save order", error: err.message });
    }

    try {
      await Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } });
    } catch (err) {
      console.error("Failed to clear cart:", err);
      await Order.findByIdAndDelete(order._id);
      for (const { product, quantity } of stockUpdates) {
        product.available_quantity += quantity;
        await product.save();
      }
      return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Failed to clear cart", error: err.message });
    }

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Order placement failed:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error: err.message });
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

