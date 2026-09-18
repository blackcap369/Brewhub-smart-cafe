/**
 * QR Code Parser Utility
 * Parses QR code URLs and extracts cafe and table information
 */

import type { QRData, QRError } from '../types';

export type { QRData, QRError };

/**
 * Parse QR code URL and extract cafe_id and table_no
 * Expected format: ?cafe={cafe_id}&table={table_no}
 * 
 * @param url - The URL to parse (can be full URL or just query string)
 * @returns QRData on success, QRError on failure
 */
export function parseQRCode(url: string): QRData | QRError {
  try {
    // Handle both full URLs and query strings
    let searchParams: URLSearchParams;
    
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      searchParams = urlObj.searchParams;
    } else if (url.startsWith('?')) {
      searchParams = new URLSearchParams(url);
    } else {
      searchParams = new URLSearchParams(`?${url}`);
    }

    // Extract parameters
    const cafeId = searchParams.get('cafe') || searchParams.get('cafe_id');
    const tableNoStr = searchParams.get('table') || searchParams.get('table_no');

    // Validate cafe_id
    if (!cafeId) {
      return {
        error: 'Missing cafe ID in QR code',
        code: 'MISSING_CAFE',
      };
    }

    // Validate cafe_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cafeId)) {
      return {
        error: 'Invalid cafe ID format',
        code: 'INVALID_CAFE_ID',
      };
    }

    // Validate table_no
    if (!tableNoStr) {
      return {
        error: 'Missing table number in QR code',
        code: 'MISSING_TABLE',
      };
    }

    const tableNo = parseInt(tableNoStr, 10);
    if (isNaN(tableNo) || tableNo < 1) {
      return {
        error: 'Invalid table number',
        code: 'INVALID_TABLE_NO',
      };
    }

    return {
      cafeId,
      tableNo,
    };
  } catch (err) {
    return {
      error: 'Invalid QR code URL format',
      code: 'INVALID_URL',
    };
  }
}

/**
 * Generate QR code URL from cafe and table data
 * 
 * @param cafeId - The cafe UUID
 * @param tableNo - The table number
 * @param baseUrl - Optional base URL (defaults to current origin)
 * @returns Complete URL string
 */
export function generateQRUrl(
  cafeId: string,
  tableNo: number,
  baseUrl?: string
): string {
  const base = baseUrl || window.location.origin;
  const url = new URL('/menu', base);
  url.searchParams.set('cafe', cafeId);
  url.searchParams.set('table', tableNo.toString());
  return url.toString();
}

/**
 * Validate if a string is a valid UUID
 * 
 * @param uuid - String to validate
 * @returns true if valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extract QR data from current window location
 * 
 * @returns QRData on success, QRError on failure, null if no QR params
 */
export function getQRDataFromLocation(): QRData | QRError | null {
  const searchParams = new URLSearchParams(window.location.search);
  
  // Check if QR params exist
  if (!searchParams.has('cafe') && !searchParams.has('cafe_id')) {
    return null;
  }

  return parseQRCode(window.location.search);
}
