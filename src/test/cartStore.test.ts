import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../stores/cartStore';

// Helper function to create test items
const createTestItem = (overrides: Partial<{
  menuItemId: string;
  name: string;
  price: number;
  isVeg: boolean;
  isSpicy: boolean;
}> = {}) => ({
  menuItemId: overrides.menuItemId || 'menu-1',
  name: overrides.name || 'Test Item',
  price: overrides.price || 10.0,
  isVeg: overrides.isVeg !== undefined ? overrides.isVeg : true,
  isSpicy: overrides.isSpicy !== undefined ? overrides.isSpicy : false,
});

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.getState().clearCart();
  });

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const { addItem, items } = useCartStore.getState();
      
      addItem(createTestItem({ name: 'Cappuccino', price: 4.5 }));

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Cappuccino');
      expect(items[0].quantity).toBe(1);
    });

    it('should increment quantity if item already exists', () => {
      const { addItem, items } = useCartStore.getState();
      
      const item = createTestItem({ menuItemId: 'menu-1', name: 'Cappuccino', price: 4.5 });

      addItem(item);
      addItem(item);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const { addItem, removeItem, items } = useCartStore.getState();
      
      addItem(createTestItem({ name: 'Cappuccino', price: 4.5 }));

      const itemId = items[0].id;
      removeItem(itemId);

      expect(items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { addItem, updateQuantity, items } = useCartStore.getState();
      
      addItem(createTestItem({ name: 'Cappuccino', price: 4.5 }));

      const itemId = items[0].id;
      updateQuantity(itemId, 3);

      expect(items[0].quantity).toBe(3);
    });

    it('should remove item if quantity is 0 or negative', () => {
      const { addItem, updateQuantity, items } = useCartStore.getState();
      
      addItem(createTestItem({ name: 'Cappuccino', price: 4.5 }));

      const itemId = items[0].id;
      updateQuantity(itemId, 0);

      expect(items).toHaveLength(0);
    });
  });

  describe('updateNotes', () => {
    it('should update item notes', () => {
      const { addItem, updateNotes, items } = useCartStore.getState();
      
      addItem(createTestItem({ name: 'Cappuccino', price: 4.5 }));

      const itemId = items[0].id;
      updateNotes(itemId, 'Extra hot, no sugar');

      expect(items[0].notes).toBe('Extra hot, no sugar');
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      const { addItem, clearCart, items } = useCartStore.getState();
      
      addItem(createTestItem({ menuItemId: 'menu-1', name: 'Cappuccino', price: 4.5 }));
      addItem(createTestItem({ menuItemId: 'menu-2', name: 'Croissant', price: 3.0 }));

      clearCart();

      expect(items).toHaveLength(0);
    });
  });

  describe('getSubtotal', () => {
    it('should calculate correct subtotal', () => {
      const { addItem, getSubtotal } = useCartStore.getState();
      
      addItem(createTestItem({ menuItemId: 'menu-1', name: 'Cappuccino', price: 4.5 }));
      useCartStore.getState().updateQuantity(useCartStore.getState().items[0].id, 2);
      
      addItem(createTestItem({ menuItemId: 'menu-2', name: 'Croissant', price: 3.0 }));
      useCartStore.getState().updateQuantity(useCartStore.getState().items[1].id, 1);

      const subtotal = getSubtotal();
      expect(subtotal).toBe(12.0); // (4.5 * 2) + (3.0 * 1)
    });

    it('should return 0 for empty cart', () => {
      const { getSubtotal } = useCartStore.getState();
      expect(getSubtotal()).toBe(0);
    });
  });

  describe('getTax', () => {
    it('should calculate 5% GST', () => {
      const { addItem, getTax } = useCartStore.getState();
      
      addItem(createTestItem({ name: 'Cappuccino', price: 100 }));

      const tax = getTax();
      expect(tax).toBe(5.0); // 5% of 100
    });
  });

  describe('getTotal', () => {
    it('should calculate subtotal + tax', () => {
      const { addItem, getTotal } = useCartStore.getState();
      
      addItem(createTestItem({ name: 'Cappuccino', price: 100 }));

      const total = getTotal();
      expect(total).toBe(105.0); // 100 + 5 (5% tax)
    });
  });

  describe('getItemCount', () => {
    it('should return total quantity of all items', () => {
      const { addItem, getItemCount } = useCartStore.getState();
      
      addItem(createTestItem({ menuItemId: 'menu-1', name: 'Cappuccino', price: 4.5 }));
      useCartStore.getState().updateQuantity(useCartStore.getState().items[0].id, 2);
      
      addItem(createTestItem({ menuItemId: 'menu-2', name: 'Croissant', price: 3.0 }));
      useCartStore.getState().updateQuantity(useCartStore.getState().items[1].id, 3);

      const count = getItemCount();
      expect(count).toBe(5); // 2 + 3
    });
  });
});
