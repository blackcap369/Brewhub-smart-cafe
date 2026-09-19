import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export interface QRCodeOptions {
  cafeId: string;
  tableNo: number;
  cafeName: string;
  logo?: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface QRCodeData {
  tableNo: number;
  url: string;
  qrCode: string;
}

/**
 * Generate QR code URL for a table
 */
export function generateQRUrl(cafeId: string, tableNo: number): string {
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://brewhub.com';
  return `${baseUrl}/menu?cafe=${cafeId}&table=${tableNo}`;
}

/**
 * Generate QR code as data URL (base64)
 */
export async function generateQRCode(options: QRCodeOptions): Promise<string> {
  const {
    cafeId,
    tableNo,
    size = 300,
    errorCorrectionLevel = 'H',
  } = options;

  const url = generateQRUrl(cafeId, tableNo);

  try {
    const qrCode = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR codes for all tables
 */
export async function generateAllQRCodes(
  cafeId: string,
  totalTables: number,
  cafeName: string
): Promise<QRCodeData[]> {
  const qrCodes: QRCodeData[] = [];

  for (let tableNo = 1; tableNo <= totalTables; tableNo++) {
    const url = generateQRUrl(cafeId, tableNo);
    const qrCode = await generateQRCode({
      cafeId,
      tableNo,
      cafeName,
    });

    qrCodes.push({
      tableNo,
      url,
      qrCode,
    });
  }

  return qrCodes;
}

/**
 * Download QR code as PNG
 */
export async function downloadQRCodePNG(
  options: QRCodeOptions,
  filename?: string
): Promise<void> {
  const qrCode = await generateQRCode(options);
  
  const link = document.createElement('a');
  link.download = filename || `table-${options.tableNo}-qr.png`;
  link.href = qrCode;
  link.click();
}

/**
 * Download all QR codes as PDF
 */
export async function downloadQRCodesPDF(
  cafeId: string,
  cafeName: string,
  totalTables: number
): Promise<void> {
  const qrCodes = await generateAllQRCodes(cafeId, totalTables, cafeName);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const qrSize = 60; // mm
  const margin = 20; // mm
  const qrPerPage = 4; // 2x2 grid

  // Title page
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('QR Codes for', pageWidth / 2, 50, { align: 'center' });
  pdf.text(cafeName, pageWidth / 2, 65, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total Tables: ${totalTables}`, pageWidth / 2, 85, { align: 'center' });
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 95, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text('Instructions:', pageWidth / 2, 120, { align: 'center' });
  pdf.text('1. Print this document', pageWidth / 2, 130, { align: 'center' });
  pdf.text('2. Cut out each QR code', pageWidth / 2, 137, { align: 'center' });
  pdf.text('3. Place at corresponding table', pageWidth / 2, 144, { align: 'center' });
  pdf.text('4. Customers can scan to order', pageWidth / 2, 151, { align: 'center' });

  // QR code pages
  let currentPage = 1;
  let currentSlot = 0;

  for (let i = 0; i < qrCodes.length; i++) {
    const { tableNo, qrCode } = qrCodes[i];

    // Add new page if needed
    if (currentSlot === 0 && i > 0) {
      pdf.addPage();
      currentPage++;
    }

    // Calculate position (2x2 grid)
    const row = Math.floor(currentSlot / 2);
    const col = currentSlot % 2;
    const x = margin + col * (qrSize + margin);
    const y = margin + row * (qrSize + margin + 20);

    // Add QR code
    pdf.addImage(qrCode, 'PNG', x, y, qrSize, qrSize);

    // Add table number
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Table ${tableNo}`, x + qrSize / 2, y + qrSize + 8, { align: 'center' });

    // Add URL (small)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const url = generateQRUrl(cafeId, tableNo);
    pdf.text(url, x + qrSize / 2, y + qrSize + 14, { align: 'center' });

    currentSlot++;
    if (currentSlot >= qrPerPage) {
      currentSlot = 0;
    }
  }

  // Save PDF
  pdf.save(`${cafeName.replace(/\s+/g, '-')}-qr-codes.pdf`);
}

/**
 * Generate QR code with logo overlay
 */
export async function generateQRCodeWithLogo(
  options: QRCodeOptions
): Promise<string> {
  const { cafeId, tableNo, logo, size = 300 } = options;
  const url = generateQRUrl(cafeId, tableNo);

  try {
    // Generate QR code
    const qrCode = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // If no logo, return plain QR code
    if (!logo) {
      return qrCode;
    }

    // Create canvas to overlay logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return qrCode;

    // Load QR code
    const qrImg = new Image();
    qrImg.src = qrCode;
    await new Promise((resolve) => {
      qrImg.onload = resolve;
    });

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Draw QR code
    ctx.drawImage(qrImg, 0, 0, size, size);

    // Load and draw logo
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = logo;
    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });

    // Calculate logo size (20% of QR code)
    const logoSize = size * 0.2;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;

    // Draw white background for logo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

    // Draw logo
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating QR code with logo:', error);
    throw new Error('Failed to generate QR code with logo');
  }
}

/**
 * Validate QR code URL
 */
export function validateQRUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === 'https:' &&
      parsedUrl.searchParams.has('cafe') &&
      parsedUrl.searchParams.has('table')
    );
  } catch {
    return false;
  }
}

/**
 * Parse QR code URL
 */
export function parseQRUrl(url: string): { cafeId: string; tableNo: number } | null {
  try {
    const parsedUrl = new URL(url);
    const cafeId = parsedUrl.searchParams.get('cafe');
    const tableNo = parsedUrl.searchParams.get('table');

    if (!cafeId || !tableNo) {
      return null;
    }

    return {
      cafeId,
      tableNo: parseInt(tableNo, 10),
    };
  } catch {
    return null;
  }
}
