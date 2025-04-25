import fs from 'fs';
import PDFDocument from 'pdfkit';

export const generateInvoicePDF = async (order, user, filePath) => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  // Add user and order details
  doc.fontSize(18).text(`Invoice for Order #${order.orderID}`, { align: 'center' });
  doc.fontSize(12).text(`Name: ${user.firstname} ${user.lastname}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Address: ${order.address_id.street}, ${order.address_id.city}`);

  // List order items
  doc.text('Items:');
  order.items.forEach(item => {
    doc.text(`- ${item.product_id.title} x ${item.quantity} @ ${item.price} each`);
  });

  // Total amount
  doc.text(`Total: ${order.netAmount}`);

  doc.end();
};
