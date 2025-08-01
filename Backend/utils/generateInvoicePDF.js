import fs from 'fs';
import PDFDocumentWithTables from 'pdfkit-table';

const generateInvoiceID = (orderID) => {
  return `INV-${orderID || 'UNKNOWN'}`;
};

function numberToWords(num) {
  if (!Number.isFinite(num) || num < 0) return 'Zero only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['Thousand', 'Million', 'Billion'];

  if (num === 0) return 'Zero only';

  let result = '';
  let thousandIndex = 0;

  while (num > 0) {
    let chunk = num % 1000;
    let chunkStr = '';

    if (chunk > 0) {
      if (chunk >= 100) {
        chunkStr += `${units[Math.floor(chunk / 100)]} Hundred `;
        chunk %= 100;
      }
      if (chunk >= 20) {
        chunkStr += `${tens[Math.floor(chunk / 10)]} `;
        chunk %= 10;
        if (chunk > 0) chunkStr += `${units[chunk]} `;
      } else if (chunk >= 10) {
        chunkStr += `${teens[chunk - 10]} `;
      } else if (chunk > 0) {
        chunkStr += `${units[chunk]} `;
      }
      if (thousandIndex > 0) {
        chunkStr += `${thousands[thousandIndex - 1]} `;
      }
      result = chunkStr + result;
    }

    num = Math.floor(num / 1000);
    thousandIndex++;
  }

  return `${result.trim()} only`;
}

export const generateInvoicePDF = async (order, user, address, productMap, filePath) => {
  const doc = new PDFDocumentWithTables({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);



  if (!order || !user || !address || !productMap) {
    console.error('Missing required inputs');
    throw new Error('Missing required inputs for invoice generation');
  }

  const pageWidth = doc.page.width || 612; 
  const leftColumnX = 50;
  const rightColumnX = Number.isFinite(pageWidth / 2) ? pageWidth / 2 : 306;


  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .fillColor('#696969')
    .text('CHAPTER ONE', 50, 50)
    .fillColor('black')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Tax Invoice/Bill of Supply/Cash Memo', pageWidth - 250, 50, { align: 'right' })
    .text('(Original for Recipient)', pageWidth - 250, doc.y, { align: 'right' })
    .moveDown(2);

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Sold By:', leftColumnX, doc.y)
    .font('Helvetica')
    .text('ChapterOne', leftColumnX)
    .text('24 D Street', leftColumnX)
    .text('Dubai, Al Rashidiya', leftColumnX)
    .text('Dubai, United Arab Emirates', leftColumnX);

  const safeAddress = {
    firstname: user.firstname || 'Unknown',
    lastname: user.lastname || '',
    place: address.place || 'N/A',
    city: address.city || 'N/A',
    district: address.district || 'N/A',
    state: address.state || 'N/A',
    country: address.country || 'N/A',
    pin: Number.isFinite(address.pin) ? address.pin : 0,
  };

  doc
    .font('Helvetica-Bold')
    .text('Billing Address:', rightColumnX, doc.y - 50)
    .font('Helvetica')
    .text(`${safeAddress.firstname} ${safeAddress.lastname}`, rightColumnX)
    .text(`${safeAddress.place}`, rightColumnX)
    .text(`${safeAddress.city}, ${safeAddress.district}, ${safeAddress.state}, ${safeAddress.country} - ${safeAddress.pin}`, rightColumnX)
    .text(`State/UT Code: ${safeAddress.pin.toString().slice(0, 2)}`, rightColumnX);

  doc.moveDown(2);

  doc
    .font('Helvetica-Bold')
    .text('PAN No: ABCDE1234F', leftColumnX, doc.y)
    .font('Helvetica')
    .text('GST Registration No: 29ABCDE1234F1Z5', leftColumnX);

  doc
    .font('Helvetica-Bold')
    .text('Shipping Address:', rightColumnX, doc.y - 30)
    .font('Helvetica')
    .text(`${safeAddress.firstname} ${safeAddress.lastname}`, rightColumnX)
    .text(`${safeAddress.place}`, rightColumnX)
    .text(`${safeAddress.city}, ${safeAddress.district}, ${safeAddress.state}, ${safeAddress.country} - ${safeAddress.pin}`, rightColumnX)
    .text(`State/UT Code: ${safeAddress.pin.toString().slice(0, 2)}`, rightColumnX)
    .text(`Place of Supply: ${safeAddress.state}`, rightColumnX)
    .text(`Place of Delivery: ${safeAddress.state}`, rightColumnX);

  doc.moveDown(2);


  const startY = doc.y;
  doc
    .font('Helvetica-Bold')
    .text(`Order Number: ${order.orderID || 'UNKNOWN'}`, leftColumnX, startY)
    .font('Helvetica')
    .text(`Order Date: ${order.order_date ? new Date(order.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.') : 'N/A'}`, leftColumnX);

  const invoiceID = generateInvoiceID(order.orderID);
  doc
    .font('Helvetica-Bold')
    .text(`Invoice Number: ${invoiceID}`, rightColumnX, startY)
    .font('Helvetica')
    .text(`Invoice Details: ${invoiceID}-2425`, rightColumnX)
    .text(`Invoice Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.')}`, rightColumnX);

  const leftColumnHeight = doc.y - startY;
  doc.y = startY + leftColumnHeight + 20; 
  doc.x = leftColumnX; 

  const tableData = [];
  (order.items || []).forEach((item, index) => {
    const productId = item.product_id?._id?.toString() || item.product_id?.toString() || 'UNKNOWN';
    const product = productMap[productId] || { title: 'Unknown Product' };
    tableData.push({
      siNo: index + 1,
      title: product.title,
      unitPrice: `Rs.${Number.isFinite(item.price) ? item.price : 0}`,
      quantity: Number.isFinite(item.quantity) ? item.quantity : 0,
      total: `Rs.${Number.isFinite(item.total) ? item.total : 0}`,
    });
  });

  const headers = [
    { label: 'SI No', property: 'siNo', width: 50, align: 'center' },
    { label: 'Title', property: 'title', width: 250 },
    { label: 'Unit Price', property: 'unitPrice', width: 80, align: 'right' },
    { label: 'Qty', property: 'quantity', width: 50, align: 'center' },
    { label: 'Total', property: 'total', width: 80, align: 'right' },
  ];

  await doc.table(
    {
      title: 'Items Purchased',
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

  const safeTotal = Number.isFinite(order.total) ? order.total : 0;
  const safeShipping = Number.isFinite(order.shipping_chrg) ? order.shipping_chrg : 0;
  const safeDiscount = Number.isFinite(order.discount) ? order.discount : 0;
  const safeNetAmount = Number.isFinite(order.netAmount) ? order.netAmount : 0;

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(`Subtotal: Rs.${safeTotal}`, { align: 'right' })
    .text(`Shipping Charges: Rs.${safeShipping}`, { align: 'right' })
    .text(`Discount: Rs.${safeDiscount}`, { align: 'right' })
    .text(`Net Amount: Rs.${safeNetAmount}`, { align: 'right' })
    .moveDown(1);

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Amount in Words: ${numberToWords(safeNetAmount)}`, { align: 'right' });

  doc.moveDown(2);

  doc
    .fontSize(10)
    .font('Helvetica-Oblique')
    .text('Thank you for shopping with us!', { align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
};