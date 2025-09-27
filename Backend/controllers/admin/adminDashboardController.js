import PDFDocument from "pdfkit";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../../utils/logger.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(year, parseInt(month), 0)
      : new Date(year + 1, 0, 0);

    const totalUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ["Pending", "Processing", "Shipped", "OutForDelivery", "Delivered"] },
    });

    const salesData = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: "Completed",
      isDeleted: false,
    },
  },
  {
    $group: {
      _id: null,
      totalSales: { $sum: "$netAmount" },
    },
  },
]);

const totalSales = salesData[0]?.totalSales || 0;

    logger.info(
      `Dashboard stats for ${year}-${
        month || "All Months"
      }: Users: ${totalUsers}, Orders: ${totalOrders}, Sales: Rs.${totalSales}`
    );
    res.status(STATUS_CODES.SUCCESS.OK).json({
      success: true,
      data: { totalUsers, totalOrders, totalSales },
    });
  } catch (err) {
    errorLogger.error("Error fetching dashboard stats", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: err.message });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(year, parseInt(month), 0)
      : new Date(year + 1, 0, 0);

    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "Delivered",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.title",
          totalSold: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);
    logger.info(
      `Fetched top products for ${year}-${month || "All Months"}: ${
        topProducts.length
      } products`
    );
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ success: true, data: topProducts });
  } catch (err) {
    errorLogger.error("Error fetching top products", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: err.message });
  }
};

export const getTopCategories = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    // Parse year/month safely
    const parsedYear = parseInt(year);
    const parsedMonth = month ? parseInt(month) : null;

    if (isNaN(parsedYear)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid year parameter" });
    }

    if (parsedMonth !== null && (parsedMonth < 1 || parsedMonth > 12)) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.BAD_REQUEST)
        .json({ success: false, message: "Invalid month parameter" });
    }

    // Set start and end dates
    const startDate = new Date(parsedYear, parsedMonth ? parsedMonth - 1 : 0, 1);
    const endDate = parsedMonth
      ? new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999)
      : new Date(parsedYear + 1, 0, 0, 23, 59, 59, 999);

    // Aggregate top categories
    const topCategories = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } }, // only delivered items
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$product.category_id",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$category.name", "Unknown Category"] },
          totalSold: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.status(STATUS_CODES.SUCCESS.OK).json({
      success: true,
      data: topCategories.length ? topCategories : [],
      message: topCategories.length
        ? undefined
        : "No categories found for the specified period",
    });
  } catch (err) {
    errorLogger.error("Error fetching top categories", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Internal error fetching top categories",
      });
  }
};


export const getRecentOrders = async (req, res) => {
  try {
    // Fetch recent orders, sorted by order_date descending, limit to 10
    const recentOrders = await Order.find({ isDeleted: false })
      .sort({ order_date: -1 })
      .limit(10).select("-__v")
      .populate("user_id", "firstname lastname email")
      .populate("address_id", "name phone place city district state country pin type");

    res.status(STATUS_CODES.SUCCESS.OK).json({
      success: true,
      data: recentOrders,
    });

    logger.info(`Fetched ${recentOrders.length} recent orders`);
  } catch (err) {
    errorLogger.error("Error fetching recent orders", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal error fetching recent orders",
    });
  }
};

export const generateLedgerBook = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "Delivered",
    }).select("-__v").populate("user_id", "firstname lastname email");

    if (!orders.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No orders found for the selected year",
        });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ledger-book-${year}.pdf`
    );
    doc.pipe(res);

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#696969")
      .text("CHAPTER ONE", 50, 50)
      .fillColor("black")
      .fontSize(14)
      .text("Ledger Book", 400, 50, { align: "right" })
      .text(`Year: ${year}`, 400, 70, { align: "right" })
      .text(
        `Generated on: ${new Date()
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .join(".")}`,
        400,
        90,
        { align: "right" }
      )
      .moveDown(2);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Company:", 400, doc.y)
      .font("Helvetica")
      .text("ChapterOne", 400)
      .text("24 D Street", 400)
      .text("Dubai, Al Rashidiya", 400)
      .text("Dubai, United Arab Emirates", 400)
      .text("PAN No: ABCDE1234F", 400)
      .text("GST Registration No: 29ABCDE1234F1Z5", 400)
      .moveDown(2);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Transaction Summary", 50, doc.y, { underline: true })
      .moveDown(0.5);

    const headers = ["Order ID", "Customer", "Email", "Date", "Amount (Rs)"];
    const headerY = doc.y;
    const columnWidth = 100;
    headers.forEach((header, index) => {
      doc.text(header, 50 + index * columnWidth, headerY, {
        width: columnWidth,
        align: index === 4 ? "right" : "left",
      });
    });

    doc.moveDown(0.5);
    doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    orders.forEach((order, index) => {
      const rowY = doc.y + 10;
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(order.orderID, 50, rowY, { width: columnWidth })
        .text(
          `${order.user_id.firstname} ${order.user_id.lastname}`,
          50 + columnWidth,
          rowY,
          { width: columnWidth }
        )
        .text(order.user_id.email, 50 + 2 * columnWidth, rowY, {
          width: columnWidth,
        })
        .text(
          order.createdAt
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .split("/")
            .join("."),
          50 + 3 * columnWidth,
          rowY,
          { width: columnWidth }
        )
        .text(`Rs.${order.netAmount.toFixed(2)}`, 50 + 4 * columnWidth, rowY, {
          width: columnWidth,
          align: "right",
        });
      doc.moveDown(0.5);
      if (index < orders.length - 1) {
        doc.lineWidth(0.3).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      }
    });

    doc.moveDown(1);

    const totalNetAmount = orders.reduce(
      (acc, order) =>
        acc + (Number.isFinite(order.netAmount) ? order.netAmount : 0),
      0
    );
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Total Orders: ${orders.length}`, 400, doc.y, { align: "right" })
      .text(`Total Net Amount: Rs.${totalNetAmount.toFixed(2)}`, 400, doc.y, {
        align: "right",
      })
      .moveDown(1);

    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text("Generated by ChapterOne", 50, doc.y, { align: "center" });

    doc.end();
    logger.info(
      `Ledger book generated for year ${year} with ${orders.length} orders`
    );
  } catch (err) {
    errorLogger.error("Error generating ledger book", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Error generating ledger book" });
  }
};
