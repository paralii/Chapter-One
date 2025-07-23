import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';

// Get dashboard stats (total users, orders, sales) with filters
export const getDashboardStats = async (req, res) => {
  try {
    const { filter = 'yearly', year = new Date().getFullYear(), month } = req.query;

    // Define date range for filtering
    const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(year, parseInt(month), 0) // Last day of the month
      : new Date(year + 1, 0, 0); // End of the year

    // Total Users
    const totalUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Total Orders
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['Processing', 'Completed'] },
    });

    // Total Sales
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Completed',
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
        },
      },
    ]);

    const totalSales = salesData[0]?.totalSales || 0;

    res.status(200).json({
      success: true,
      data: { totalUsers, totalOrders, totalSales },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get top 10 best-selling products
export const getTopProducts = async (req, res) => {
  try {
    const { filter = 'yearly', year = new Date().getFullYear(), month } = req.query;

    const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(year, parseInt(month), 0)
      : new Date(year + 1, 0, 0);

    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Completed',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.title',
          totalSold: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({ success: true, data: topProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get top 10 best-selling categories
export const getTopCategories = async (req, res) => {
  try {
    const { filter = 'yearly', year = new Date().getFullYear(), month } = req.query;

    const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(year, parseInt(month), 0)
      : new Date(year + 1, 0, 0);

    const topCategories = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Completed',
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category_id',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          totalSold: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({ success: true, data: topCategories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate ledger book (PDF)
export const generateLedgerBook = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Completed',
    }).populate('user_id', 'firstname lastname email');

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'No orders found for the selected year' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ledger-book-${year}.pdf`);
    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#696969')
      .text('CHAPTER ONE', 50, 50)
      .fillColor('black')
      .fontSize(14)
      .text('Ledger Book', 400, 50, { align: 'right' })
      .text(`Year: ${year}`, 400, 70, { align: 'right' })
      .text(`Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.')}`, 400, 90, { align: 'right' })
      .moveDown(2);

    // Company Details
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Company:', 400, doc.y)
      .font('Helvetica')
      .text('ChapterOne', 400)
      .text('24 D Street', 400)
      .text('Dubai, Al Rashidiya', 400)
      .text('Dubai, United Arab Emirates', 400)
      .text('PAN No: ABCDE1234F', 400)
      .text('GST Registration No: 29ABCDE1234F1Z5', 400)
      .moveDown(2);

    // Orders Table
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Transaction Summary', 50, doc.y, { underline: true })
      .moveDown(0.5);

    const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Amount (Rs)'];
    const headerY = doc.y;
    const columnWidth = 100;
    headers.forEach((header, index) => {
      doc.text(header, 50 + index * columnWidth, headerY, { width: columnWidth, align: index === 4 ? 'right' : 'left' });
    });

    doc.moveDown(0.5);
    doc
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    orders.forEach((order, index) => {
      const rowY = doc.y + 10;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(order.orderID, 50, rowY, { width: columnWidth })
        .text(`${order.user_id.firstname} ${order.user_id.lastname}`, 50 + columnWidth, rowY, { width: columnWidth })
        .text(order.user_id.email, 50 + 2 * columnWidth, rowY, { width: columnWidth })
        .text(
          order.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.'),
          50 + 3 * columnWidth,
          rowY,
          { width: columnWidth }
        )
        .text(`Rs.${order.netAmount.toFixed(2)}`, 50 + 4 * columnWidth, rowY, { width: columnWidth, align: 'right' });
      doc.moveDown(0.5);
      if (index < orders.length - 1) {
        doc
          .lineWidth(0.3)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();
      }
    });

    doc.moveDown(1);

    // Summary
    const totalNetAmount = orders.reduce((acc, order) => acc + (Number.isFinite(order.netAmount) ? order.netAmount : 0), 0);
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Total Orders: ${orders.length}`, 400, doc.y, { align: 'right' })
      .text(`Total Net Amount: Rs.${totalNetAmount.toFixed(2)}`, 400, doc.y, { align: 'right' })
      .moveDown(1);

    // Footer
    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('Generated by ChapterOne', 50, doc.y, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ success: false, message: 'PDF download failed' });
  }
};