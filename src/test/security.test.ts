import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeHtml,
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidOTP,
  isValidUUID,
  isValidPrice,
  isValidQuantity,
  RateLimiter,
  generateCSRFToken,
  isStrongPassword,
  sanitizeFileName,
  isValidFileType,
  isValidFileSize,
  isValidRedirectUrl,
  maskSensitiveData,
  isValidJSON,
  escapeSQL,
} from '../utils/security';

describe('Security Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should allow safe tags', () => {
      const input = '<p>Paragraph with <strong>bold</strong> and <em>italic</em></p>';
      const result = sanitizeHtml(input);
      expect(result).toBe(input);
    });

    it('should remove dangerous attributes', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove javascript protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onload=alert(1)';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onload=');
    });

    it('should trim whitespace', () => {
      const input = '  test input  ';
      const result = sanitizeInput(input);
      expect(result).toBe('test input');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should accept valid Indian phone numbers', () => {
      expect(isValidPhone('+911234567890')).toBe(true);
      expect(isValidPhone('+919876543210')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(false);
      expect(isValidPhone('+9112345')).toBe(false);
      expect(isValidPhone('+11234567890')).toBe(false);
      expect(isValidPhone('+91abcdefghij')).toBe(false);
    });
  });

  describe('isValidOTP', () => {
    it('should accept valid 6-digit OTPs', () => {
      expect(isValidOTP('123456')).toBe(true);
      expect(isValidOTP('000000')).toBe(true);
      expect(isValidOTP('999999')).toBe(true);
    });

    it('should reject invalid OTPs', () => {
      expect(isValidOTP('12345')).toBe(false);
      expect(isValidOTP('1234567')).toBe(false);
      expect(isValidOTP('abcdef')).toBe(false);
      expect(isValidOTP('12345a')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('invalid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    });
  });

  describe('isValidPrice', () => {
    it('should accept valid prices', () => {
      expect(isValidPrice(10.99)).toBe(true);
      expect(isValidPrice(0.01)).toBe(true);
      expect(isValidPrice(999.99)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(isValidPrice(-10)).toBe(false);
      expect(isValidPrice(0)).toBe(false);
      expect(isValidPrice(10.999)).toBe(false);
    });
  });

  describe('isValidQuantity', () => {
    it('should accept valid quantities', () => {
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(100)).toBe(true);
    });

    it('should reject invalid quantities', () => {
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(1.5)).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000);
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('test-key')).toBe(true);
      expect(rateLimiter.isAllowed('test-key')).toBe(true);
      expect(rateLimiter.isAllowed('test-key')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      rateLimiter.isAllowed('test-key');
      rateLimiter.isAllowed('test-key');
      rateLimiter.isAllowed('test-key');
      expect(rateLimiter.isAllowed('test-key')).toBe(false);
    });

    it('should track remaining attempts', () => {
      expect(rateLimiter.getRemainingAttempts('test-key')).toBe(3);
      rateLimiter.isAllowed('test-key');
      expect(rateLimiter.getRemainingAttempts('test-key')).toBe(2);
    });

    it('should reset attempts', () => {
      rateLimiter.isAllowed('test-key');
      rateLimiter.isAllowed('test-key');
      rateLimiter.reset('test-key');
      expect(rateLimiter.getRemainingAttempts('test-key')).toBe(3);
    });

    it('should handle different keys independently', () => {
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key1');
      expect(rateLimiter.isAllowed('key1')).toBe(false);
      expect(rateLimiter.isAllowed('key2')).toBe(true);
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate 64-character hex token', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('isStrongPassword', () => {
    it('should accept strong passwords', () => {
      expect(isStrongPassword('Password1!')).toBe(true);
      expect(isStrongPassword('Str0ng@Pass')).toBe(true);
      expect(isStrongPassword('C0mpl3x#Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false);
      expect(isStrongPassword('PASSWORD')).toBe(false);
      expect(isStrongPassword('12345678')).toBe(false);
      expect(isStrongPassword('Pass1')).toBe(false);
      expect(isStrongPassword('password1')).toBe(false);
      expect(isStrongPassword('PASSWORD1')).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace special characters', () => {
      expect(sanitizeFileName('file name.txt')).toBe('file_name.txt');
      expect(sanitizeFileName('file@name.txt')).toBe('file_name.txt');
    });

    it('should remove directory traversal', () => {
      expect(sanitizeFileName('../file.txt')).toBe('.._file.txt');
      expect(sanitizeFileName('folder/../file.txt')).toBe('folder_.._file.txt');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('isValidFileType', () => {
    it('should accept allowed file types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isValidFileType(file, ['image/jpeg', 'image/png'])).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const file = new File([''], 'test.exe', { type: 'application/exe' });
      expect(isValidFileType(file, ['image/jpeg', 'image/png'])).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept files within size limit', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isValidFileSize(file, 5)).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      expect(isValidFileSize(file, 5)).toBe(false);
    });
  });

  describe('isValidRedirectUrl', () => {
    it('should accept URLs from allowed domains', () => {
      expect(isValidRedirectUrl('https://example.com/page', ['example.com'])).toBe(true);
      expect(isValidRedirectUrl('https://brewhub.app/menu', ['brewhub.app'])).toBe(true);
    });

    it('should reject URLs from disallowed domains', () => {
      expect(isValidRedirectUrl('https://malicious.com/page', ['example.com'])).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidRedirectUrl('not-a-url', ['example.com'])).toBe(false);
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask data showing only last characters', () => {
      expect(maskSensitiveData('1234567890', 4)).toBe('******7890');
      expect(maskSensitiveData('secret-key', 3)).toBe('*******key');
    });

    it('should handle short strings', () => {
      expect(maskSensitiveData('123', 4)).toBe('123');
      expect(maskSensitiveData('ab', 4)).toBe('ab');
    });
  });

  describe('isValidJSON', () => {
    it('should accept valid JSON', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isValidJSON('{key: value}')).toBe(false);
      expect(isValidJSON('undefined')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('escapeSQL', () => {
    it('should escape special SQL characters', () => {
      expect(escapeSQL("test'value")).toBe("test\\'value");
      expect(escapeSQL('test"value')).toBe('test\\"value');
      expect(escapeSQL('test\\value')).toBe('test\\\\value');
    });

    it('should escape newlines and carriage returns', () => {
      expect(escapeSQL('test\nvalue')).toBe('test\\nvalue');
      expect(escapeSQL('test\rvalue')).toBe('test\\rvalue');
    });

    it('should escape null bytes', () => {
      expect(escapeSQL('test\0value')).toBe('test\\0value');
    });
  });
});
