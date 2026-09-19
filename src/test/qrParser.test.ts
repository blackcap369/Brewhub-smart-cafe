import { describe, it, expect } from 'vitest';
import { parseQRCode, generateQRUrl, isValidUUID, getQRDataFromLocation } from '../utils/qrParser';

describe('QR Code Parser', () => {
  describe('parseQRCode', () => {
    it('should parse valid QR code URL with cafe and table', () => {
      const url = 'https://brewhub.app/menu?cafe=550e8400-e29b-41d4-a716-446655440000&table=5';
      const result = parseQRCode(url);
      
      expect(result).toEqual({
        cafeId: '550e8400-e29b-41d4-a716-446655440000',
        tableNo: 5,
      });
    });

    it('should parse query string only', () => {
      const queryString = '?cafe=550e8400-e29b-41d4-a716-446655440000&table=10';
      const result = parseQRCode(queryString);
      
      expect(result).toEqual({
        cafeId: '550e8400-e29b-41d4-a716-446655440000',
        tableNo: 10,
      });
    });

    it('should return error for missing cafe ID', () => {
      const url = 'https://brewhub.app/menu?table=5';
      const result = parseQRCode(url);
      
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code', 'MISSING_CAFE');
    });

    it('should return error for missing table number', () => {
      const url = 'https://brewhub.app/menu?cafe=550e8400-e29b-41d4-a716-446655440000';
      const result = parseQRCode(url);
      
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code', 'MISSING_TABLE');
    });

    it('should return error for invalid cafe ID format', () => {
      const url = 'https://brewhub.app/menu?cafe=invalid-uuid&table=5';
      const result = parseQRCode(url);
      
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code', 'INVALID_CAFE_ID');
    });

    it('should return error for invalid table number', () => {
      const url = 'https://brewhub.app/menu?cafe=550e8400-e29b-41d4-a716-446655440000&table=abc';
      const result = parseQRCode(url);
      
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code', 'INVALID_TABLE_NO');
    });

    it('should return error for negative table number', () => {
      const url = 'https://brewhub.app/menu?cafe=550e8400-e29b-41d4-a716-446655440000&table=-1';
      const result = parseQRCode(url);
      
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('code', 'INVALID_TABLE_NO');
    });

    it('should handle alternative parameter names', () => {
      const url = 'https://brewhub.app/menu?cafe_id=550e8400-e29b-41d4-a716-446655440000&table_no=5';
      const result = parseQRCode(url);
      
      expect(result).toEqual({
        cafeId: '550e8400-e29b-41d4-a716-446655440000',
        tableNo: 5,
      });
    });
  });

  describe('generateQRUrl', () => {
    it('should generate valid QR code URL', () => {
      const cafeId = '550e8400-e29b-41d4-a716-446655440000';
      const tableNo = 5;
      const baseUrl = 'https://brewhub.app';
      
      const url = generateQRUrl(cafeId, tableNo, baseUrl);
      
      expect(url).toBe('https://brewhub.app/menu?cafe=550e8400-e29b-41d4-a716-446655440000&table=5');
    });

    it('should use current origin if baseUrl not provided', () => {
      const cafeId = '550e8400-e29b-41d4-a716-446655440000';
      const tableNo = 10;
      
      const url = generateQRUrl(cafeId, tableNo);
      
      expect(url).toContain('/menu?cafe=');
      expect(url).toContain('&table=10');
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID format', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('getQRDataFromLocation', () => {
    it('should return null if no QR params in URL', () => {
      // Mock window.location
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        search: '',
      };

      const result = getQRDataFromLocation();
      expect(result).toBeNull();

      // Restore
      (window as any).location = originalLocation;
    });

    it('should parse QR data from current location', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        search: '?cafe=550e8400-e29b-41d4-a716-446655440000&table=5',
      };

      const result = getQRDataFromLocation();
      expect(result).toEqual({
        cafeId: '550e8400-e29b-41d4-a716-446655440000',
        tableNo: 5,
      });

      // Restore
      (window as any).location = originalLocation;
    });
  });
});
