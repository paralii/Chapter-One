import Order from "../../models/Order.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// 🔁 Common report logic
const getFilteredOrders = async (type, fromDate, toDate) => {
  const now = new Date();
  const matchStage = { status: { $nin: ["Cancelled", "Returned"] } };

  if (type === "daily") {
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    matchStage.createdAt = { $gte: start, $lte: end };
  } else if (type === "weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    matchStage.createdAt = { $gte: start };
  } else if (type === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    matchStage.createdAt = { $gte: start, $lte: end };
  } else if (type === "yearly") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    matchStage.createdAt = { $gte: start, $lte: end };
  } else if (type === "custom" && fromDate && toDate) {
    matchStage.createdAt = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  return await Order.find(matchStage).populate("user_id", "name email");
};

// 📊 View sales report (in admin dashboard)
export const getSalesReport = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
    const totalDiscount = orders.reduce((acc, order) => acc + order.discount, 0);
    const netRevenue = orders.reduce((acc, order) => acc + order.netAmount, 0);

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalSales,
        totalDiscount,
        netRevenue,
        orders,
      },
    });
  } catch (err) {
    console.error("Error in getSalesReport:", err);
    res.status(500).json({ success: false, message: "Error fetching report" });
  }
};

// 📄 Download as PDF
export const generateSalesReportPDF = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report-${type || "custom"}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown();

    orders.forEach((order, i) => {
      doc.fontSize(12).text(`${i + 1}. Order ID: ${order.orderID}`);
      doc.text(`   User: ${order.user_id?.name || "N/A"} (${order.user_id?.email || "-"})`);
      doc.text(`   Date: ${order.createdAt.toISOString().split("T")[0]}`);
      doc.text(`   Total: ₹${order.total}`);
      doc.text(`   Discount: ₹${order.discount}`);
      doc.text(`   Net Payable: ₹${order.netAmount}`);
      doc.text(`   Status: ${order.status}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ success: false, message: "PDF download failed" });
  }
};

// 📊 Download as Excel
export const generateSalesReportExcel = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderID", width: 20 },
      { header: "User", key: "user", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Total", key: "total", width: 10 },
      { header: "Discount", key: "discount", width: 10 },
      { header: "Net Payable", key: "net", width: 12 },
      { header: "Status", key: "status", width: 15 },
    ];

    orders.forEach((order) => {
      sheet.addRow({
        orderID: order.orderID,
        user: order.user_id?.name || "N/A",
        email: order.user_id?.email || "-",
        date: order.createdAt.toISOString().split("T")[0],
        total: order.total,
        discount: order.discount,
        net: order.netAmount,
        status: order.status,
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report-${type || "custom"}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel error:", err);
    res.status(500).json({ success: false, message: "Excel download failed" });
  }
};
