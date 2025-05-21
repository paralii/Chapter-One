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

const INVOICE_DIR = path.join(process.cwd(), 'invoices');

// Generate a unique readable order ID
const generateOrderID = () => {
  return "CHAP" + Date.now() + Math.floor(Math.random() * 1000);
};

export const createTempOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      address_id,
      items,
      shipping_chrg,
      discount,
      paymentMethod,
      amount,
      taxes,
      total,
      currency,
    } = req.body;


    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items to order" });
    }

    const address = await Address.findOne({ _id: address_id, user_id: userId });
    if (!address) {
      return res.status(400).json({ message: "Invalid or unauthorized address" });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!mongoose.isValidObjectId(item.product_id)) {
        return res.status(400).json({ message: `Invalid product ID: ${item.product_id}` });
      }
      const product = await Product.findById(item.product_id);
      if (!product || product.isDeleted) {
        return res.status(400).json({ message: `Product not available: ${item.product_id}` });
      }

      if (product.available_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for: ${product.title}` });
      }

      const price = product.price;
      const total = price * item.quantity;
      subtotal += total;
      product.available_quantity -= item.quantity;
      await product.save();
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price,
        total,
        refundProcessed: false,
      });
    }

    const netAmount = subtotal + (shipping_chrg || 0) + (taxes || 0) - (discount || 0);
    if (netAmount < 0) {
      return res.status(400).json({ message: 'Invalid order amount' });
    }

    const order = new Order({
      orderID: generateOrderID(),
      user_id: userId,
      address_id,
      paymentMethod,
      paymentStatus: "Pending",
      status: "Pending",
      shipping_chrg: shipping_chrg || 0,
      discount: discount || 0,
      total: subtotal,
      taxes: taxes || 0,
      netAmount,
      items: orderItems,
      currency: currency || "INR",
    });

    await order.save();
    res.status(201).json({ message: "Temporary order created", order });
  } catch (err) {
    console.error("Temporary order creation failed:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
// 1. Place Order
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      _id,
      address_id,
      items,
      shipping_chrg,
      discount,
      paymentMethod,
      razorpay_order_id,
      amount,
      taxes,
      total,
      currency,
    } = req.body;


    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items to order" });
    }

        if (!mongoose.isValidObjectId(address_id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    let order;
    if (_id && mongoose.isValidObjectId(_id)) {
      order = await Order.findOne({ _id, user_id: userId });
      if (!order) {
        return res.status(404).json({ message: "Temporary order not found" });
      }
      if (order.paymentStatus === "Completed") {
        order.status = "Pending";
        order.razorpay_order_id = razorpay_order_id;
        await order.save();
        await Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } });
        return res.status(200).json({ message: "Order already paid, status updated", order });
      }
    } 
    
    if(!order) {
      const address = await Address.findOne({ _id: address_id, user_id: userId });
      if (!address) {
        return res.status(400).json({ message: "Invalid or unauthorized address" });
      }

      if (!["COD", "ONLINE"].includes(paymentMethod)) {
        return res.status(400).json({ message: `Invalid payment method: ${paymentMethod}. Allowed values: COD, ONLINE` });
      }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
            if (!mongoose.isValidObjectId(item.product_id)) {
        return res.status(400).json({ message: `Invalid product ID: ${item.product_id}` });
      }
      const product = await Product.findById(item.product_id);
      if (!product || product.isDeleted) {
        return res
          .status(400)
          .json({ message: `Product not available: ${item.product_id}` });
      }

      if (product.available_quantity < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for: ${product.title}` });
      }

      const price = product.price;
      const total = price * item.quantity;
      subtotal += total;

              if (paymentMethod === "COD") {
          product.available_quantity -= item.quantity;
          await product.save();
        }

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price,
        total,
        status: "Pending",
        refundProcessed: false,
      });
    }

    // 4. Calculate net amount
        const netAmount = subtotal + (shipping_chrg || 0) + (taxes || 0) - (discount || 0);
    if (netAmount < 0) {
      return res.status(400).json({ message: 'Invalid order amount' });
    }

    // 5. Create order document
     order = new Order({
      orderID: generateOrderID(),
      user_id: userId,
      address_id,
      paymentMethod,
      paymentStatus: paymentMethod === "ONLINE" ? "Pending" : "Completed",
      status: "Pending",
      razorpay_order_id: paymentMethod === "ONLINE" ? razorpay_order_id : undefined,
      shipping_chrg: shipping_chrg || 0,
      discount: discount || 0,
      total: subtotal,
      taxes: taxes || 0,
      netAmount,
      items: orderItems,
      currency: currency || "INR",
    });

  }
    if (!order) {
      console.error("Order is still undefined after initialization");
      return res.status(500).json({ message: "Failed to initialize order" });
    }

        if (paymentMethod === "COD") {
      order.paymentStatus = "Completed";
      order.status = "Pending";
    } else if (paymentMethod === "ONLINE") {
         if (!razorpay_order_id) {
        return res.status(400).json({ message: "Missing razorpay_order_id for ONLINE payment" });
      }
      order.razorpay_order_id = razorpay_order_id;
      order.status = "Pending";
    }

    await order.save();

    await Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } });

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Order placement failed:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// 2. List Orders for User
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search = '', page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ message: 'Invalid page or limit' });
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
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// 3. Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;

        if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: orderId, user_id: userId })
      .populate("items.product_id")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ message: "Error fetching order details" });
  }
};

// 4. Cancel Order or Item
export const cancelOrderOrItem = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    const userId = req.user._id;

        if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: orderId, user_id: userId, isDeleted: false });
    if (!order) return res.status(404).json({ message: "Order not found" });

        const hoursSinceOrder = (Date.now() - new Date(order.order_date)) / (1000 * 60 * 60);
    if (hoursSinceOrder > 24) {
      return res.status(400).json({ message: 'Cancellation period (24 hours) expired' });
    }
    
    if (productId) {
            if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const item = order.items.find(
        (item) => item.product_id.toString() === productId
      );
      if (!item) {
        return res.status(404).json({ message: "Item not found in order" });
      }
      if (item.status !== "Pending") {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Only items that are still "Pending" can be cancelled',
          });
      }

      item.status = "Cancelled";
      if (reason && typeof reason === 'string' && reason.trim()) {
        item.cancelReason = reason.trim();
      }
      item.refundProcessed = false;
      
      await Product.findByIdAndUpdate(productId, {
        $inc: { available_quantity: item.quantity },
      });

      // Handle refund if online payment
      if (order.paymentMethod === "ONLINE" && order.paymentStatus === "Completed" && !item.refundProcessed) {
        const refundResult = await refundToWallet(
          userId,
          item.total,
          `Refund for cancelled item from Order ${order.orderID}`
        );
        if(!refundResult) {
          console.error('Refund failed:', refundResult);
          return res.status(500).json({ message: 'Refund failed' });
        }
        item.refundProcessed = true;
      }
    } else {
            if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Order is already cancelled' });
      }
      if (order.status === 'Delivered' || order.status === 'OutForDelivery' ) {
        return res.status(400).json({ message: `Cannot cancel order in ${order.status} status` });
      }

      let refundableAmount = 0;
      for (const item of order.items) {
        if (item.status === "Pending") {
          item.status = "Cancelled";
          item.cancelReason = reason && typeof reason === 'string' ? reason.trim() : 'User cancelled';
          item.refundProcessed = false;

          await Product.findByIdAndUpdate(item.product_id, {
            $inc: { available_quantity: item.quantity },
          });

          if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'Completed' && !item.refundProcessed) {
            refundableAmount += item.total;
          }
        }
      }

      const allCancelled = order.items.every((item) => item.status === 'Cancelled');
      if (allCancelled) {
        order.status = 'Cancelled';
      }

      if (refundableAmount > 0) {
        const refundResult = await refundToWallet(
          userId,
          refundableAmount,
          `Refund for cancelled Order ${order.orderID}`
        );
        if(!refundResult) {
          console.error('Refund failed:', refundResult);
          return res.status(500).json({ message: 'Refund failed' });
        }
        order.items.forEach(item => {
          if (item.status === 'Cancelled') {
            item.refundProcessed = true;
          }
        });
      }
    }

    await order.save();
    res.json({ message: 'Cancellation processed successfully' });
  } catch (err) {
    console.error('Error processing cancellation:', err);
    res.status(500).json({ message: 'Error processing cancellation', error: err.message });
  }
};

// 5. Return Delivered Item
export const returnOrderItem = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return res.status(400).json({ message: 'Return reason is required' });
    }

    const order = await Order.findOne({ _id: orderId, user_id: userId, isDeleted: false });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const item = order.items.find((item) => item.product_id.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not found in order' });

    if (item.status === 'Returned') {
      return res.status(400).json({ message: 'Item already in return process or returned' });
    }
    if (item.status !== 'Delivered') {
      return res.status(400).json({ message: 'Only delivered items can be returned' });
    }

    const deliveryDate = item.deliveryDate || order.updated_at;
    const daysSinceDelivery = (Date.now() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ message: 'Return period (7 days) expired' });
    }

    item.status = 'Returned';
    item.returnReason = reason.trim();
    item.returnVerified = false;
    item.returnDecision = null;
    item.refundProcessed = false;

    await order.save();
    res.json({ message: "Return request submitted" });
  } catch (err) {
    console.error('Error submitting return request:', err);
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
      .populate("items.product_id")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Create productMap: { productId: productData }
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
      return res.status(400).json({ message: "Invoice file not generated" });
    }

    const pdfBuffer = await fsPromises.readFile(invoicePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderID}.pdf`);
    res.send(pdfBuffer);

    await fsPromises.unlink(invoicePath).catch(err => console.warn('Invoice cleanup failed:', err));
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ message: "Error generating invoice" });
  }
};

