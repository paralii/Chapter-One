import PDFDocument from "pdfkit";
import fs from "fs";

export const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();

      const filePath = `./invoices/invoice-${order.orderID}.pdf`;
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Add Title
      doc.fontSize(18).text(`Invoice for Order ID: ${order.orderID}`, { align: "center" }).moveDown(1);

      // Add Order Date
      doc.fontSize(12).text(`Order Date: ${order.order_date.toLocaleString()}`, { align: "left" }).moveDown(1);

      // Add Billing Address (for simplicity, assuming it's a simple address field)
      const address = order.address_id ? order.address_id.place : "Not provided";
      doc.text(`Shipping Address: ${address}`, { align: "left" }).moveDown(1);

      // Add Items
      doc.text("Items:", { underline: true }).moveDown(0.5);
      order.items.forEach(item => {
        doc.text(`- ${item.product_id.name}: ${item.quantity} x ₹${item.price}`, { align: "left" }).moveDown(0.5);
      });

      // Add Total
      doc.text(`Total Amount: ₹${order.total}`, { align: "left" }).moveDown(1);

      // Add Payment Method
      doc.text(`Payment Method: ${order.paymentMethod}`, { align: "left" }).moveDown(1);

      // Add Signature
      doc.text("Thank you for shopping with us!", { align: "center" }).moveDown(2);
      doc.text("Authorized Signature", { align: "center" });

      doc.end();

      // Once the file is written, resolve the promise
      writeStream.on("finish", () => {
        resolve(filePath);
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};
