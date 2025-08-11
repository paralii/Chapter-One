import mongoose from "mongoose";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import { creditWallet } from "../user/userWalletController.js";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF.js";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../../utils/logger.js";

const INVOICE_DIR = path.resolve("invoices");

const generateAndSaveInvoice = async (order, user, address, invoicePath) => {
  try {
    if (!invoicePath || typeof invoicePath !== 'string' || invoicePath.trim() === '') {
      throw new Error('Invalid or missing invoice path');
    }

    if (!fs.existsSync(INVOICE_DIR)) {
      fs.mkdirSync(INVOICE_DIR, { recursive: true });
    }
    try {
      await fsPromises.access(INVOICE_DIR, fs.constants.W_OK);
    } catch (err) {
      throw new Error(`Invoice directory is not writable: ${err.message}`);
    }

    const productMap = {};
    order.items.forEach(item => {
      const key = item.product_id?._id?.toString() || item._id.toString();
      productMap[key] = {
        title: item.product_id?.title || 'Deleted Product',
        price: item.product_id?.price || item.price || 0,
        product_imgs: item.product_id?.product_imgs || [],
        status: item.status || 'N/A',
      };
    });

    const seller = {
      name: 'ChapterOne',
      address: '24 D Street, Dubai, Al Rashidiya, Dubai, United Arab Emirates',
      pan: 'ABCDE1234F',
      gst: '29ABCDE1234F1Z5',
    };

    await generateInvoicePDF(order, user, address, productMap, invoicePath, seller);
    logger.info(`Invoice generated successfully at ${invoicePath}`);
    return invoicePath;
  } catch (err) {
    errorLogger.error("Error generating invoice", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    throw new Error(`Failed to generate invoice: ${err.message}`);
  }
};

export const listAllOrders = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, sort = 'order_date', sortOrder = 'desc', status, paymentMethod } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: 'Invalid page or limit' });
    }

    const skip = (pageNum - 1) * limitNum;
    const filter = { isDeleted: false };
    if (search) {
      const userMatch = await User.find({
        $or: [
          { firstname: { $regex: search, $options: 'i' } },
          { lastname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.$or = [
        { orderID: { $regex: search, $options: 'i' } },
        { user_id: { $in: userMatch.map(u => u._id) } },
      ];
    }
    if (status) {
      filter.status = { $in: status.split(',') };
    }
    if (paymentMethod) {
      filter.paymentMethod = { $in: paymentMethod.split(',') };
    }

    const sortOptions = {};
    const validSortFields = ['order_date', 'status', 'netAmount'];
    const field = validSortFields.includes(sort) ? sort : 'order_date';
    sortOptions[field] = sortOrder === 'asc' ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('user_id', 'firstname lastname email')
        .lean(),
      Order.countDocuments(filter),
    ]);

    logger.info(
      `Fetched ${orders.length} orders with search: "${search}", page: ${pageNum}, limit: ${limitNum}, sort: ${sort}, sortOrder: ${sortOrder}`
    );
    res.json({ success: true, orders, total });
  } catch (err) {
    errorLogger.error("Error fetching orders", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status().json({ success: false, message: 'Error fetching orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
      .populate("items.product_id", "title price")
      .populate("address_id")
      .populate("user_id", "firstname lastname email");

    if (!order) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found" });

    logger.info(`Fetched order details for order ID: ${order._id}`);
    res.json({ success: true, order });
  } catch (err) {
    errorLogger.error("Error fetching order by ID", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error fetching order details" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: 'Invalid order ID' });
    }

    const validOrderStatuses = ["Pending", "Shipped", "OutForDelivery", "Delivered", "Cancelled", "Returned"];
    if (!validOrderStatuses.includes(status)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Invalid order status" });
    }
    
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Cancelled orders can't be updated" });
    }
    if (order.status === 'Delivered' && status !== 'Cancelled') {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: 'Delivered orders can only be cancelled' });
    }

    const validTransitions = {
      Pending: ['Shipped', 'Cancelled'],
      Shipped: ['OutForDelivery', 'Cancelled'],
      OutForDelivery: ['Delivered', 'Cancelled'],
      Delivered: ['Cancelled'],
      Cancelled: [],
    };
    if (!validTransitions[order.status].includes(status)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: `Cannot transition from ${order.status} to ${status}` });
    }

    if (status === 'Cancelled') {
      for (const item of order.items) {
        if (item.status === 'Pending') {
          item.status = 'Cancelled';
          item.cancelReason = 'Admin cancelled order';
          await Product.findByIdAndUpdate(
            item.product_id,
            { $inc: { available_quantity: item.quantity } }
          );
        }
      }
      if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'Completed' && !order.items.every(item => item.refundProcessed)) {
        const refundableAmount = order.items.reduce((sum, item) => {
          return item.status === 'Cancelled' && !item.refundProcessed ? sum + item.total : sum;
        }, 0);
        if (refundableAmount > 0) {
          const creditResult = await creditWallet(
            order.user_id,
            refundableAmount,
            `Refund for cancelled Order ${order.orderID}`,
          );
          if (!creditResult.success) {
            throw new Error('Wallet credit failed');
          }
          order.items.forEach(item => {
            if (item.status === 'Cancelled' && !item.refundProcessed) {
              item.refundProcessed = true;
            }
          });
        }
      }
    }

    order.status = status;
    if (['Shipped', 'OutForDelivery', 'Delivered'].includes(status)) {
      order.items.forEach(item => {
        if (!['Cancelled', 'Returned'].includes(item.status)) {
          item.status = status;
        }
      });
    }

    await order.save();
    logger.info(`Order ${orderId} status updated to ${status}`);
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    errorLogger.error("Error updating order status", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error updating order status' });
  } 
};

export const markItemDelivered = async (req, res) => {
  try {
    const { orderId, productId } = req.body;

    const order = await Order.findOne({ _id: orderId, isDeleted: false });
    if (!order) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found" });

    const item = order.items.find(i => i.product_id.toString() === productId);
    if (!item) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Item not found" });

    if (["Cancelled", "Returned", "Delivered"].includes(item.status)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: `Item already ${item.status}` });
    }

    if (order.status === "Cancelled") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Order is cancelled, items can't be delivered" });
    }

    item.status = "Delivered";
    item.deliveryDate = new Date();
    const allDelivered = order.items.every(i => ['Delivered', 'Cancelled', 'Returned'].includes(i.status));
    if (allDelivered && order.status !== 'Delivered') {
      order.status = 'Delivered';
    }

    await order.save();

    logger.info(`Item ${productId} in order ${orderId} marked as delivered`);
    res.json({ success: true, message: "Item marked as delivered" });
  } catch (err) {
    errorLogger.error("Error marking item delivered", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error marking item delivered" });
  }
};

export const downloadAdminInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: orderId, isDeleted: false })
      .populate({
        path: 'items.product_id',
        match: { isDeleted: false },
        select: 'title price product_imgs',
      })
      .populate('address_id')
      .populate('user_id', 'firstname lastname email');

    if (!order) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: 'Order not found' });
    }
    if (!order.address_id) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: 'Order missing address information' });
    }
    if (!order.user_id) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: 'Order missing user information' });
    }

    let invoicePath;
    if (!order.orderID || typeof order.orderID !== 'string' || order.orderID.trim() === '') {
      console.warn('Invalid orderID, using _id as fallback', { orderId, orderID: order.orderID });
      invoicePath = path.join(INVOICE_DIR, `invoice_${order._id}_admin_${Date.now()}.pdf`);
    } else {
      invoicePath = path.join(INVOICE_DIR, `invoice_${order.orderID}_admin_${Date.now()}.pdf`);
    }

    await generateAndSaveInvoice(order, order.user_id, order.address_id, invoicePath);

    if (!fs.existsSync(invoicePath)) {
      return res.status().json({ success: false, message: 'Invoice file not generated' });
    }

    const pdfBuffer = await fsPromises.readFile(invoicePath);
    if (!pdfBuffer || pdfBuffer.length === 0) {
      await fsPromises.unlink(invoicePath).catch(() => {});
      return res.status().json({ success: false, message: 'Generated invoice is empty or corrupted' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderID || order._id}.pdf`);
    res.send(pdfBuffer);

    const retryUnlink = async (filePath, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          await fsPromises.unlink(filePath);
          return;
        } catch (err) {
          console.warn(`Attempt ${i + 1} to delete ${filePath} failed:`, err);
          if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
    await retryUnlink(invoicePath);
    logger.info(`Invoice ${invoicePath} downloaded and deleted successfully`);
  } catch (err) {
    errorLogger.error("Error downloading admin invoice", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: `Failed to generate invoice: ${err.message}` });
  }
};

export const softDeleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order || order.isDeleted) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found or already deleted" });
    }

    if (order.status === "delivered") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Delivered orders can't be deleted" });
    }

    if (['Delivered', 'OutForDelivery'].includes(order.status)) {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: `Cannot delete order in ${order.status} status` });
    }

    for (const item of order.items) {
      if (item.status === 'Pending') {
        await Product.findByIdAndUpdate(
          item.product_id,
          { $inc: { available_quantity: item.quantity } },
        );
        item.status = 'Cancelled';
        item.cancelReason = 'Admin soft delete';
      }
    }

    order.isDeleted = true;
    order.deletedAt = new Date();
    order.status = 'Cancelled';

    if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'Paid') {
      const refundableAmount = order.items.reduce((sum, item) => {
        return item.status === 'Cancelled' ? sum + item.total : sum;
      }, 0);
      if (refundableAmount > 0) {
        await creditWallet(
          order.user_id,
          refundableAmount,
          `Refund for soft-deleted Order ${order.orderID}`,
        );
      }
    }
    await order.save();

    logger.info(`Order ${orderId} soft deleted successfully`);
    res.json({ success: true, message: "Order soft deleted" });
  } catch (err) {
    errorLogger.error("Error soft deleting order", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error deleting order" });
  }
};

export const verifyReturnRequest = async (req, res) => {
  try {
    const { orderId, productId, approve } = req.body;

    const order = await Order.findOne({ _id: orderId, isDeleted: false });
    if (!order) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Order not found" });

    const item = order.items.find(i => i.product_id.toString() === productId);
    if (!item) return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "Item not found in order" });

    if (!item.returnReason || item.status !== "Returned") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Item not marked for return" });
    }
    if (item.status !== "Delivered" && item.status !== "Returned") {
      return res.status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST).json({ success: false, message: "Return can only be approved for delivered items" });
    }
    if (approve) {
      item.returnVerified = true;
      item.returnDecision = "Approved";

      if (
        order.paymentMethod === "ONLINE" &&
        order.paymentStatus === "Completed" &&
        !item.refundProcessed
      ) {
        const creditResult = await creditWallet(
          order.user_id,
          item.total,
          `Refund for returned product in Order ${order.orderID}`
        );

        if (!creditResult.success) {
          return res.status(STATUS_CODES.SERVER_ERROR.SERVICE_UNAVAILABLE).json({ success: false, message: "Wallet refund failed" });
        }

        item.refundProcessed = true;
      }
    } else {
      item.returnVerified = true;
      item.returnDecision = "Rejected";
    }

    await order.save();

    logger.info(`Return request for item ${productId} in order ${orderId} ${approve ? "approved" : "rejected"}`);
    return res.json({ success: true, message: `Return ${approve ? "approved" : "rejected"}` });
  } catch (err) {
    errorLogger.error("Error verifying return request", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    return res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal error verifying return" });
  }
};
