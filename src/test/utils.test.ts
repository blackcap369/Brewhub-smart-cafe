import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, generateOrderNumber, cn, getStatusColor } from '../utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      const result = formatDate(date);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle invalid date', () => {
      const result = formatDate('invalid-date');
      expect(result).toBeTruthy();
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with symbol', () => {
      const result = formatCurrency(100.50);
      expect(result).toContain('100');
      expect(result).toContain('50');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-50.25);
      expect(result).toContain('50');
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate unique order numbers', () => {
      const order1 = generateOrderNumber();
      const order2 = generateOrderNumber();
      
      expect(order1).not.toBe(order2);
    });

    it('should generate order number with correct format', () => {
      const orderNumber = generateOrderNumber();
      
      expect(orderNumber).toMatch(/^ORD-\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should filter out falsy values', () => {
      const result = cn('class1', false, 'class2', null, undefined, 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      
      expect(result).toBe('base-class active-class');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for pending status', () => {
      const result = getStatusColor('pending');
      expect(result).toContain('amber');
    });

    it('should return correct color for confirmed status', () => {
      const result = getStatusColor('confirmed');
      expect(result).toContain('blue');
    });

    it('should return correct color for preparing status', () => {
      const result = getStatusColor('preparing');
      expect(result).toContain('purple');
    });

    it('should return correct color for ready status', () => {
      const result = getStatusColor('ready');
      expect(result).toContain('emerald');
    });

    it('should return correct color for served status', () => {
      const result = getStatusColor('served');
      expect(result).toContain('green');
    });

    it('should return correct color for completed status', () => {
      const result = getStatusColor('completed');
      expect(result).toContain('gray');
    });

    it('should return correct color for cancelled status', () => {
      const result = getStatusColor('cancelled');
      expect(result).toContain('red');
    });

    it('should return default color for unknown status', () => {
      const result = getStatusColor('unknown');
      expect(result).toContain('gray');
    });
  });
});
