import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ReceiptData {
  cafeName: string;
  cafeLogo?: string;
  cafeAddress?: string;
  cafePhone?: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  tableNo?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName?: string;
  customerPhone?: string;
}

/**
 * Generate PDF receipt
 */
export function generateReceipt(data: ReceiptData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let yPos = margin;

  // Header - Cafe Name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.cafeName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Cafe Address
  if (data.cafeAddress) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(data.cafeAddress, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  }

  // Cafe Phone
  if (data.cafePhone) {
    doc.text(`Phone: ${data.cafePhone}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }

  // Divider
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Receipt Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Order Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Order #: ${data.orderNumber}`, margin, yPos);
  yPos += 5;

  doc.text(`Date: ${data.orderDate}`, margin, yPos);
  doc.text(`Time: ${data.orderTime}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  if (data.tableNo) {
    doc.text(`Table: ${data.tableNo}`, margin, yPos);
  }
  yPos += 5;

  if (data.customerName) {
    doc.text(`Customer: ${data.customerName}`, margin, yPos);
    yPos += 5;
  }

  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, margin, yPos);
    yPos += 5;
  }

  yPos += 3;

  // Divider
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Items Table
  const tableColumn = [
    { header: 'Item', dataKey: 'item' },
    { header: 'Qty', dataKey: 'qty' },
    { header: 'Price', dataKey: 'price' },
    { header: 'Total', dataKey: 'total' },
  ];

  const tableRows = data.items.map((item) => ({
    item: item.name + (item.notes ? ` (${item.notes})` : ''),
    qty: item.quantity.toString(),
    price: `₹${item.price.toFixed(2)}`,
    total: `₹${(item.price * item.quantity).toFixed(2)}`,
  }));

  (doc as any).autoTable({
    startY: yPos,
    head: [tableColumn.map((col) => col.header)],
    body: tableRows.map((row) => [row.item, row.qty, row.price, row.total]),
    theme: 'plain',
    headStyles: {
      fillColor: [239, 68, 68], // Primary red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'normal' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Divider
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Totals
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', pageWidth - 50, yPos);
  doc.text(`₹${data.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  doc.text('Tax (5% GST):', pageWidth - 50, yPos);
  doc.text(`₹${data.tax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  if (data.discount && data.discount > 0) {
    doc.text('Discount:', pageWidth - 50, yPos);
    doc.text(`-₹${data.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
  }

  // Divider
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 55, yPos - 2, pageWidth - margin, yPos - 2);
  yPos += 3;

  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 50, yPos);
  doc.text(`₹${data.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  // Payment Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${data.paymentMethod}`, margin, yPos);
  yPos += 5;

  doc.text(
    `Payment Status: ${data.paymentStatus.charAt(0).toUpperCase() + data.paymentStatus.slice(1)}`,
    margin,
    yPos
  );
  yPos += 8;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Thank You Message
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You!', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('We appreciate your business', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Visit us again soon!', pageWidth / 2, yPos, { align: 'center' });

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  // Save PDF
  doc.save(`receipt-${data.orderNumber}.pdf`);
}

/**
 * Generate HTML receipt for printing
 */
export function generateHTMLReceipt(data: ReceiptData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}${item.notes ? `<br><small style="color: #666;">${item.notes}</small>` : ''}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${data.orderNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #ef4444;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .cafe-name {
      font-size: 24px;
      font-weight: bold;
      color: #ef4444;
      margin-bottom: 5px;
    }
    .cafe-details {
      font-size: 12px;
      color: #666;
    }
    .receipt-title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 15px 0;
    }
    .order-details {
      margin-bottom: 15px;
    }
    .order-details div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th {
      background-color: #ef4444;
      color: white;
      padding: 8px;
      text-align: left;
      font-size: 12px;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #eee;
      font-size: 12px;
    }
    .totals {
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 10px;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 13px;
    }
    .total-final {
      font-size: 16px;
      font-weight: bold;
      border-top: 1px solid #333;
      padding-top: 8px;
      margin-top: 8px;
    }
    .payment-details {
      margin-top: 15px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 5px;
      font-size: 12px;
    }
    .thank-you {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #ef4444;
    }
    .thank-you h3 {
      color: #ef4444;
      margin-bottom: 5px;
    }
    .thank-you p {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body {
        margin: 0;
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="cafe-name">${data.cafeName}</div>
    ${data.cafeAddress ? `<div class="cafe-details">${data.cafeAddress}</div>` : ''}
    ${data.cafePhone ? `<div class="cafe-details">Phone: ${data.cafePhone}</div>` : ''}
  </div>

  <div class="receipt-title">RECEIPT</div>

  <div class="order-details">
    <div><span>Order #:</span><span>${data.orderNumber}</span></div>
    <div><span>Date:</span><span>${data.orderDate}</span></div>
    <div><span>Time:</span><span>${data.orderTime}</span></div>
    ${data.tableNo ? `<div><span>Table:</span><span>${data.tableNo}</span></div>` : ''}
    ${data.customerName ? `<div><span>Customer:</span><span>${data.customerName}</span></div>` : ''}
    ${data.customerPhone ? `<div><span>Phone:</span><span>${data.customerPhone}</span></div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal:</span><span>₹${data.subtotal.toFixed(2)}</span></div>
    <div><span>Tax (5% GST):</span><span>₹${data.tax.toFixed(2)}</span></div>
    ${data.discount && data.discount > 0 ? `<div><span>Discount:</span><span>-₹${data.discount.toFixed(2)}</span></div>` : ''}
    <div class="total-final"><span>Total:</span><span>₹${data.total.toFixed(2)}</span></div>
  </div>

  <div class="payment-details">
    <div><strong>Payment Method:</strong> ${data.paymentMethod}</div>
    <div><strong>Payment Status:</strong> ${data.paymentStatus.charAt(0).toUpperCase() + data.paymentStatus.slice(1)}</div>
  </div>

  <div class="thank-you">
    <h3>Thank You!</h3>
    <p>We appreciate your business<br>Visit us again soon!</p>
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleString()}
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Print HTML receipt
 */
export function printReceipt(data: ReceiptData): void {
  const html = generateHTMLReceipt(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Download receipt (PDF or HTML)
 */
export function downloadReceipt(
  data: ReceiptData,
  format: 'pdf' | 'html' = 'pdf'
): void {
  if (format === 'pdf') {
    generateReceipt(data);
  } else {
    const html = generateHTMLReceipt(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${data.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
