import Order from "../../models/Order.js";
import PDFDocumentWithTables from "pdfkit-table";
import ExcelJS from "exceljs";
import STATUS_CODES from "../../utils/constants/statusCodes.js";

const getFilteredOrders = async (type, fromDate, toDate) => {
  const now = new Date();
  const matchStage = { status: { $nin: ["Cancelled", "Returned"] } };

  if (type === "custom" && fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error("Invalid date format");
    }
    if (from > now || to > now) {
      throw new Error("Dates cannot be in the future");
    }
    if (to < from) {
      throw new Error("To date must be after from date");
    }
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
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    matchStage.createdAt = { $gte: start, $lte: end };
  } else if (type === "yearly") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    matchStage.createdAt = { $gte: start, $lte: end };
  } else {
    throw new Error("Invalid report type");
  }

  return await Order.find(matchStage).populate("user_id", "name email");
};

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
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error fetching report" });
  }
};

export const generateSalesReportPDF = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    if (!orders.length) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "No orders found" });
    }

    const doc = new PDFDocumentWithTables({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report-${type || "custom"}.pdf`);
    doc.pipe(res);

    const pageWidth = doc.page.width || 612; 
    const leftColumnX = 50;
    const rightColumnX = pageWidth / 2;

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#696969')
      .text('CHAPTER ONE', leftColumnX, 50)
      .fillColor('black')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Sales Report', pageWidth - 250, 50, { align: 'right' })
      .text(`Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.')}`, pageWidth - 250, doc.y, { align: 'right' })
      .moveDown(2);

    const reportTypeText = type.charAt(0).toUpperCase() + type.slice(1) || "Custom";
    let dateRangeText = "";
    if (type === "daily") {
      dateRangeText = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.');
    } else if (type === "custom" && fromDate && toDate) {
      dateRangeText = `${new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.')} - ${new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.')}`;
    } else {
      const start = orders[0]?.createdAt ? new Date(orders[0].createdAt) : new Date();
      const end = type === "weekly" ? new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000) :
                  type === "monthly" ? new Date(start.getFullYear(), start.getMonth(), 1) :
                  type === "yearly" ? new Date(start.getFullYear(), 0, 1) : start;
      dateRangeText = `${end.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.')} - ${start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.')}`;
    }

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Report Details:', leftColumnX, doc.y)
      .font('Helvetica')
      .text(`Report Type: ${reportTypeText}`, leftColumnX)
      .text(`Date Range: ${dateRangeText}`, leftColumnX);

    doc
      .font('Helvetica-Bold')
      .text('Company:', rightColumnX, doc.y - 30)
      .font('Helvetica')
      .text('ChapterOne', rightColumnX)
      .text('24 D Street', rightColumnX)
      .text('Dubai, Al Rashidiya', rightColumnX)
      .text('Dubai, United Arab Emirates', rightColumnX)
      .text('PAN No: ABCDE1234F', rightColumnX)
      .text('GST Registration No: 29ABCDE1234F1Z5', rightColumnX);

    doc.moveDown(2);

    const tableData = orders.map((order, index) => ({
      siNo: index + 1,
      orderID: order.orderID || 'UNKNOWN',
      user: order.user_id?.name || 'N/A',
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.') : 'N/A',
      total: `Rs.${Number.isFinite(order.total) ? order.total.toFixed(2) : '0.00'}`,
      discount: `Rs.${Number.isFinite(order.discount) ? order.discount.toFixed(2) : '0.00'}`,
      netAmount: `Rs.${Number.isFinite(order.netAmount) ? order.netAmount.toFixed(2) : '0.00'}`,
      status: order.status || 'N/A',
    }));

    const headers = [
      { label: 'SI No', property: 'siNo', width: 40, align: 'center' },
      { label: 'Order ID', property: 'orderID', width: 80 },
      { label: 'User', property: 'user', width: 100 },
      { label: 'Date', property: 'date', width: 80, align: 'center' },
      { label: 'Total', property: 'total', width: 80, align: 'right' },
      { label: 'Discount', property: 'discount', width: 80, align: 'right' },
      { label: 'Net Payable', property: 'netAmount', width: 80, align: 'right' },
      { label: 'Status', property: 'status', width: 80, align: 'center' },
    ];

    await doc.table(
      {
        title: 'Sales Report - Orders',
        headers,
        datas: tableData,
      },
      {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: () => doc.font('Helvetica').fontSize(9),
        divider: {
          header: { disabled: false, width: 0.5, opacity: 0.5 },
          horizontal: { disabled: false, width: 0.5, opacity: 0.3 },
        },
        columnSpacing: 10,
        padding: 5,
        width: pageWidth - 100,
      }
    );

    doc.moveDown(1.5);

    const totalSales = orders.reduce((acc, order) => acc + (Number.isFinite(order.total) ? order.total : 0), 0);
    const totalDiscount = orders.reduce((acc, order) => acc + (Number.isFinite(order.discount) ? order.discount : 0), 0);
    const netRevenue = orders.reduce((acc, order) => acc + (Number.isFinite(order.netAmount) ? order.netAmount : 0), 0);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`Total Orders: ${orders.length}`, { align: 'right' })
      .text(`Total Sales: Rs.${totalSales.toFixed(2)}`, { align: 'right' })
      .text(`Total Discount: Rs.${totalDiscount.toFixed(2)}`, { align: 'right' })
      .text(`Net Revenue: Rs.${netRevenue.toFixed(2)}`, { align: 'right' })
      .moveDown(1);

    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('Generated by ChapterOne', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "PDF download failed" });
  }
};

export const generateSalesReportExcel = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;
    const orders = await getFilteredOrders(type, fromDate, toDate);

    if (!orders.length) {
      return res.status(STATUS_CODES.CLIENT_ERROR.NOT_FOUND).json({ success: false, message: "No orders found" });
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
    res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({ success: false, message: "Excel download failed" });
  }
};