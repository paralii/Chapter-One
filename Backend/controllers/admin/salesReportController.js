import Order from "../../models/Order.js";
import PDFDocumentWithTables from "pdfkit-table";
import ExcelJS from "exceljs";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { logger, errorLogger } from "../../utils/logger.js";

const getFilteredOrders = async (type, fromDate, toDate) => {
  const now = new Date();
  const matchStage = { status: { $nin: ["Cancelled", "Returned"] } };

  if (type === "custom" && fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime()))
      throw new Error("Invalid date format");
    if (from > now || to > now)
      throw new Error("Dates cannot be in the future");
    if (to < from) throw new Error("To date must be after from date");
    matchStage.createdAt = { $gte: from, $lte: to };
  } else if (type === "daily") {
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    matchStage.createdAt = { $gte: start, $lte: end };
  } else if (type === "weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    matchStage.createdAt = { $gte: start };
  } else if (type === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    matchStage.createdAt = { $gte: start, $lte: end };
  } else if (type === "yearly") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    matchStage.createdAt = { $gte: start, $lte: end };
  } else {
    throw new Error("Invalid report type");
  }

  logger.info(
    `Fetching orders for type: ${type}, fromDate: ${fromDate}, toDate: ${toDate}`
  );
  return await Order.find(matchStage).select("-__v").populate("user_id", "firstname lastname email");
};

export const getSalesReport = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    const totalPrice = orders.reduce((acc, order) => acc + (order.amount || 0), 0);
    const totalSales = orders.reduce((acc, order) => acc + (order.total || 0), 0);
    const totalDiscount = orders.reduce((acc, order) => acc + (order.discount || 0), 0);
    const totalShipping = orders.reduce((acc, order) => acc + (order.shipping_chrg || 0), 0);
    const totalGST = orders.reduce((acc, order) => acc + (order.taxes || 0), 0);
    const netRevenue = orders.reduce((acc, order) => acc + (order.netAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalPrice,
        totalSales,
        totalDiscount,
        totalShipping,
        totalGST,
        netRevenue,
        orders,
      },
    });
  } catch (err) {
    errorLogger.error("Error generating sales report", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Error fetching report" });
  }
};

export const generateSalesReportPDF = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    if (!orders.length) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ success: false, message: "No orders found" });
    }

    const doc = new PDFDocumentWithTables({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${type || "custom"}.pdf`
    );
    doc.pipe(res);

    const pageWidth = doc.page.width || 612;
    const leftColumnX = 30;

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#696969")
      .text("CHAPTER ONE", leftColumnX, 50)
      .fillColor("black")
      .fontSize(14)
      .text("Sales Report", pageWidth - 250, 50, { align: "right" })
      .text(
        `Generated on: ${new Date().toLocaleDateString("en-GB").split("/").join(".")}`,
        pageWidth - 250,
        doc.y,
        { align: "right" }
      )
      .moveDown(2);

    // Report Details
    const reportTypeText = type.charAt(0).toUpperCase() + type.slice(1) || "Custom";
    let dateRangeText = fromDate && toDate
      ? `${new Date(fromDate).toLocaleDateString("en-GB").split("/").join(".")} - ${new Date(toDate).toLocaleDateString("en-GB").split("/").join(".")}`
      : "All Time";

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Report Type: ${reportTypeText}`, leftColumnX)
      .text(`Date Range: ${dateRangeText}`, leftColumnX);

    doc.moveDown(2);

    // Table Data (order-level)
    const tableData = orders.map((order, index) => ({
      siNo: index + 1,
      orderID: order.orderID || "UNKNOWN",
      email: order.user_id?.email || "-",
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB").split("/").join(".") : "N/A",
      price: parseFloat((order.amount || 0).toFixed(2)),
      salePrice: parseFloat((order.total || 0).toFixed(2)),
      discount: parseFloat((order.discount || 0).toFixed(2)),
      GST: parseFloat((order.taxes || 0).toFixed(2)),
      netAmount: parseFloat((order.netAmount || 0).toFixed(2)),
      status: order.status || "N/A",
    }));

    // Table Headers with proper widths & alignment
    const headers = [
      { label: "SI No", property: "siNo", width: 30, align: "center" },
      { label: "Order ID", property: "orderID", width: 80 },
      { label: "User - Email", property: "email", width: 100 },
      { label: "Date", property: "date", width: 50, align: "center" },
      { label: "Price (Rs.)", property: "price", width: 50, align: "right" },
      { label: "Discount (Rs.)", property: "discount", width: 50, align: "right" },
      { label: "Sale Price (Rs.)", property: "salePrice", width: 50, align: "right" },
      { label: "GST (Rs.)", property: "GST", width: 50, align: "right" },
      { label: "Net Payable (Rs.)", property: "netAmount", width: 70, align: "right" },
      { label: "Status", property: "status", width: 70, align: "center" },
    ];

    // Render Table
    await doc.table(
      {
        title: "Sales Report - Orders",
        headers,
        datas: tableData,
      },
      {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9),
        prepareRow: () => doc.font("Helvetica").fontSize(8),
        divider: {
          header: { disabled: false, width: 0.5, opacity: 0.5 },
          horizontal: { disabled: false, width: 0.5, opacity: 0.3 },
        },
        columnSpacing: 8,
        padding: 5,
        width: pageWidth - 100,
      }
    );

    // Totals
    const totalSales = orders.reduce((acc, order) => acc + (order.total || 0), 0);
    const totalDiscount = orders.reduce((acc, order) => acc + (order.discount || 0), 0);
    const totalShipping = orders.reduce((acc, order) => acc + (order.shipping_chrg || 0), 0);
    const totalGST = orders.reduce((acc, order) => acc + (order.taxes || 0), 0);
    const netRevenue = orders.reduce((acc, order) => acc + (order.netAmount || 0), 0);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total Orders: ${orders.length}`, { align: "left" })
      .text(`Total Sales: Rs.${totalSales.toFixed(2)}`, { align: "left" })
      .text(`Total Discount: Rs.${totalDiscount.toFixed(2)}`, { align: "left" })
      .text(`Total Shipping: Rs.${totalShipping.toFixed(2)}`, { align: "left" })
      .text(`Total GST: Rs.${totalGST.toFixed(2)}`, { align: "left" })
      .text(`Net Revenue: Rs.${netRevenue.toFixed(2)}`, { align: "left" })
      .moveDown(2);

    doc.fontSize(10).font("Helvetica-Oblique").text("Generated by ChapterOne", { align: "center" });

    doc.end();
    logger.info(`PDF report generated successfully for type: ${type}`);
  } catch (err) {
    errorLogger.error("Error generating sales report PDF", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "PDF download failed" });
  }
};

export const generateSalesReportExcel = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    if (!orders.length) {
      return res
        .status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND)
        .json({ success: false, message: "No orders found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderID", width: 20 },
      { header: "User", key: "user", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Total", key: "total", width: 12 },
      { header: "Discount", key: "discount", width: 12 },
      { header: "Shipping", key: "shipping", width: 12 },
      { header: "GST", key: "GST", width: 12 },
      { header: "Net Payable", key: "net", width: 12 },
      { header: "Status", key: "status", width: 15 },
    ];

    orders.forEach((order) => {
      sheet.addRow({
        orderID: order.orderID,
        user: `${order.user_id?.firstname || "N/A"} ${order.user_id?.lastname || ""}`,
        email: order.user_id?.email || "-",
        date: order.createdAt.toISOString().split("T")[0],
        total: order.total || 0,
        discount: order.discount || 0,
        shipping: order.shipping_chrg || 0,
        GST: order.taxes || 0,
        net: order.netAmount || 0,
        status: order.status,
      });
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell("total").numFmt = '₹#,##0.00';
        row.getCell("discount").numFmt = '₹#,##0.00';
        row.getCell("shipping").numFmt = '₹#,##0.00';
        row.getCell("GST").numFmt = '₹#,##0.00';
        row.getCell("net").numFmt = '₹#,##0.00';
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      .setHeader(
        "Content-Disposition",
        `attachment; filename="Sales-Report-${type || "custom"}.xlsx"`
      )
      .status(STATUS_CODES.SUCCESS.OK)
      .send(buffer);

    logger.info(`Excel report generated successfully for type: ${type}`);
  } catch (err) {
    errorLogger.error("Error generating sales report Excel", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res
      .status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Excel download failed" });
  }
};

