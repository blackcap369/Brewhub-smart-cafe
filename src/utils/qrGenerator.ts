import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface QRCodeOptions {
  cafeId: string;
  cafeName: string;
  tableNo: number;
  logoUrl?: string;
  baseUrl?: string;
}

interface GeneratedQR {
  tableNo: number;
  dataUrl: string;
  url: string;
}

/**
 * Generate QR code for a specific table
 */
export async function generateTableQR(options: QRCodeOptions): Promise<string> {
  const { cafeId, tableNo, baseUrl = 'https://brewhub.app' } = options;
  
  const url = `${baseUrl}/customer?cafe=${cafeId}&table=${tableNo}`;
  
  const dataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H', // High error correction for better scanning
  });
  
  return dataUrl;
}

/**
 * Generate QR codes for all tables
 */
export async function generateAllTableQRs(
  cafeId: string,
  cafeName: string,
  tableCount: number,
  baseUrl?: string
): Promise<GeneratedQR[]> {
  const qrCodes: GeneratedQR[] = [];
  
  for (let i = 1; i <= tableCount; i++) {
    const url = `${baseUrl || 'https://brewhub.app'}/customer?cafe=${cafeId}&table=${i}`;
    const dataUrl = await generateTableQR({
      cafeId,
      cafeName,
      tableNo: i,
      baseUrl,
    });
    
    qrCodes.push({
      tableNo: i,
      dataUrl,
      url,
    });
  }
  
  return qrCodes;
}

/**
 * Download QR code as PNG
 */
export async function downloadQRAsPNG(
  options: QRCodeOptions,
  filename?: string
): Promise<void> {
  const dataUrl = await generateTableQR(options);
  
  const link = document.createElement('a');
  link.download = filename || `table-${options.tableNo}-qr.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Download all QR codes as a single PDF
 */
export async function downloadAllQRsAsPDF(
  cafeId: string,
  cafeName: string,
  tableCount: number,
  baseUrl?: string
): Promise<void> {
  const qrCodes = await generateAllTableQRs(cafeId, cafeName, tableCount, baseUrl);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const qrSize = 60; // mm
  const margin = 10; // mm
  const qrPerRow = 3;
  const qrPerCol = 4;
  
  // Add title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${cafeName} - Table QR Codes`, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
  
  let currentY = 40;
  let currentX = margin;
  let count = 0;
  
  for (const qr of qrCodes) {
    // Add QR code
    pdf.addImage(qr.dataUrl, 'PNG', currentX, currentY, qrSize, qrSize);
    
    // Add table number
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Table ${qr.tableNo}`, currentX + qrSize / 2, currentY + qrSize + 5, { align: 'center' });
    
    // Add URL (smaller)
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const shortUrl = qr.url.replace('https://', '').substring(0, 30) + '...';
    pdf.text(shortUrl, currentX + qrSize / 2, currentY + qrSize + 9, { align: 'center' });
    
    count++;
    
    // Move to next position
    if (count % qrPerRow === 0) {
      // Move to next row
      currentX = margin;
      currentY += qrSize + 20;
      
      // Check if we need a new page
      if (count % (qrPerRow * qrPerCol) === 0 && count < qrCodes.length) {
        pdf.addPage();
        currentY = 20;
      }
    } else {
      // Move to next column
      currentX += qrSize + margin;
    }
  }
  
  // Save PDF
  pdf.save(`${cafeName.replace(/\s+/g, '-')}-qr-codes.pdf`);
}

/**
 * Download single table QR as PDF
 */
export async function downloadSingleQRAsPDF(
  options: QRCodeOptions
): Promise<void> {
  const dataUrl = await generateTableQR(options);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add cafe name
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(options.cafeName, pageWidth / 2, 40, { align: 'center' });
  
  // Add table number
  pdf.setFontSize(32);
  pdf.text(`Table ${options.tableNo}`, pageWidth / 2, 60, { align: 'center' });
  
  // Add QR code (centered)
  const qrSize = 120;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 80;
  pdf.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  
  // Add instructions
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Scan to Order', pageWidth / 2, qrY + qrSize + 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text('Point your phone camera at the QR code', pageWidth / 2, qrY + qrSize + 25, { align: 'center' });
  pdf.text('to view our menu and place orders', pageWidth / 2, qrY + qrSize + 32, { align: 'center' });
  
  // Add branding
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Powered by BrewHub', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Save PDF
  pdf.save(`table-${options.tableNo}-qr.pdf`);
}

/**
 * Generate QR code as base64 string
 */
export async function generateQRAsBase64(
  url: string,
  size: number = 400
): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRAsSVG(url: string): Promise<string> {
  return await QRCode.toString(url, {
    type: 'svg',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Validate QR code URL
 */
export function validateQRUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Get QR code URL for a table
 */
export function getTableQRUrl(cafeId: string, tableNo: number, baseUrl?: string): string {
  return `${baseUrl || 'https://brewhub.app'}/customer?cafe=${cafeId}&table=${tableNo}`;
}
