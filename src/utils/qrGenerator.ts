import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export interface QRCodeOptions {
  cafeId: string;
  tableNo: number;
  cafeName?: string;
  logo?: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate QR code data URL for a table
 */
export async function generateQRCode(options: QRCodeOptions): Promise<string> {
  const { 
    cafeId, 
    tableNo, 
    size = 300,
    errorCorrectionLevel = 'H'
  } = options;

  const url = `${window.location.origin}/menu?cafe=${cafeId}&table=${tableNo}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel,
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code with cafe branding
 */
export async function generateBrandedQRCode(options: QRCodeOptions): Promise<string> {
  const { cafeName, tableNo } = options;
  
  // Generate base QR code
  const qrCodeDataUrl = await generateQRCode(options);
  
  // Create canvas to add branding
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const qrImage = new Image();
  
  return new Promise((resolve, reject) => {
    qrImage.onload = () => {
      const padding = 40;
      const headerHeight = 60;
      const footerHeight = 40;
      
      canvas.width = qrImage.width + padding * 2;
      canvas.height = qrImage.height + padding * 2 + headerHeight + footerHeight;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header - Cafe Name
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(cafeName || 'BrewHub Cafe', canvas.width / 2, padding + 30);

      // QR Code
      ctx.drawImage(qrImage, padding, padding + headerHeight);

      // Footer - Table Number
      ctx.fillStyle = '#6b7280';
      ctx.font = '18px Arial';
      ctx.fillText(`Table ${tableNo}`, canvas.width / 2, canvas.height - padding - 10);

      resolve(canvas.toDataURL('image/png'));
    };

    qrImage.onerror = () => {
      reject(new Error('Failed to load QR code image'));
    };

    qrImage.src = qrCodeDataUrl;
  });
}

/**
 * Generate QR codes for all tables and export as PDF
 */
export async function generateQRCodesPDF(
  cafeId: string,
  totalTables: number,
  cafeName: string,
  startTableNo: number = 1
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const qrSize = 60; // mm
  const padding = 10;
  const qrPerPage = 4; // 2x2 grid

  let currentQr = 0;

  for (let tableNo = startTableNo; tableNo < startTableNo + totalTables; tableNo++) {
    // Check if we need a new page
    if (currentQr > 0 && currentQr % qrPerPage === 0) {
      pdf.addPage();
    }

    // Calculate position (2x2 grid)
    const positionInPage = currentQr % qrPerPage;
    const col = positionInPage % 2;
    const row = Math.floor(positionInPage / 2);

    const x = padding + col * (qrSize + padding);
    const y = padding + row * (qrSize + padding + 20);

    // Generate QR code
    const qrDataUrl = await generateBrandedQRCode({
      cafeId,
      tableNo,
      cafeName,
      size: 300,
    });

    // Add QR code to PDF
    pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);

    // Add table label
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Table ${tableNo}`, x + qrSize / 2, y + qrSize + 5, { align: 'center' });

    currentQr++;
  }

  // Save PDF
  pdf.save(`${cafeName.replace(/\s+/g, '_')}_QR_Codes.pdf`);
}

/**
 * Download single QR code as PNG
 */
export async function downloadQRCodePNG(
  options: QRCodeOptions,
  filename: string = 'qr-code.png'
): Promise<void> {
  const qrDataUrl = await generateBrandedQRCode(options);
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = qrDataUrl;
  link.click();
}

/**
 * Generate QR code for cafe (main entrance)
 */
export async function generateCafeQRCode(
  cafeId: string,
  cafeName: string
): Promise<string> {
  const url = `${window.location.origin}/menu?cafe=${cafeId}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating cafe QR code:', error);
    throw new Error('Failed to generate cafe QR code');
  }
}

/**
 * Validate QR code URL format
 */
export function validateQRCodeURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);
    
    return params.has('cafe') && params.has('table');
  } catch {
    return false;
  }
}

/**
 * Parse QR code URL to extract cafe and table info
 */
export function parseQRCodeURL(url: string): { cafeId: string; tableNo: number } | null {
  try {
    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);
    
    const cafeId = params.get('cafe');
    const tableNo = params.get('table');
    
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
