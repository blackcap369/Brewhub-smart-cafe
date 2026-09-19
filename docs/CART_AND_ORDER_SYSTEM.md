# BrewHub Cart & Order System

Complete cart management and order placement flow with real-time tracking.

## 🏗️ Architecture

```
src/
├── stores/
│   └── cartStore.ts              # Zustand cart store with persistence
├── services/
│   └── orderService.ts           # Order CRUD operations with Supabase
├── components/
│   ├── CartDrawer.tsx            # Slide-in cart drawer
│   └── OrderConfirmation.tsx     # Order success modal with confetti
├── contexts/
│   └── ToastContext.tsx          # Toast notification system
├── types/
│   └── database.ts               # Supabase database types
└── pages/
    ├── CustomerApp.tsx           # Updated with cart integration
    └── OrderTracking.tsx         # Real-time order tracking
```

## 📦 Cart Store (Zustand)

### Features
- **Persistent Storage**: Cart data saved to localStorage
- **Item Management**: Add, remove, update quantity
- **Special Instructions**: Per-item notes
- **Price Calculations**: Subtotal, tax (5% GST), total
- **Type Safety**: Full TypeScript support

### Usage

```typescript
import { useCartStore } from '../stores/cartStore';

function MyComponent() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
  } = useCartStore();

  // Add item
  addItem({
    menuItemId: '123',
    name: 'Cappuccino',
    price: 4.5,
    image: 'https://...',
    isVeg: true,
    isSpicy: false,
  });

  // Update quantity
  updateQuantity('item-id', 3);

  // Add notes
  updateNotes('item-id', 'Extra hot, no sugar');

  // Get totals
  const subtotal = getSubtotal(); // ₹13.50
  const tax = getTax(); // ₹0.68
  const total = getTotal(); // ₹14.18
}
```

### Cart Item Structure

```typescript
interface CartItem {
  id: string;              // Unique cart item ID
  menuItemId: string;      // Menu item reference
  name: string;            // Item name
  price: number;           // Unit price
  quantity: number;        // Quantity
  image?: string;          // Item image URL
  notes?: string;          // Special instructions
  isVeg: boolean;          // Vegetarian flag
  isSpicy: boolean;        // Spicy flag
}
```

## 🛒 Cart Drawer

### Features
- **Responsive Design**: Bottom sheet on mobile, side drawer on desktop
- **Item Management**: Quantity controls, remove items
- **Special Instructions**: Textarea for each item
- **Price Breakdown**: Subtotal, tax, total
- **Animations**: Smooth slide-in/out with Framer Motion
- **Empty State**: Friendly message when cart is empty

### Usage

```typescript
import CartDrawer from '../components/CartDrawer';

function CustomerApp() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      {/* Cart button */}
      <button onClick={() => setIsCartOpen(true)}>
        View Cart ({cart.getItemCount()})
      </button>

      {/* Cart drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </>
  );
}
```

## 📝 Order Service

### Functions

#### `createOrder(params)`
Creates a new order in Supabase.

```typescript
import { createOrder } from '../services/orderService';

const result = await createOrder({
  cafeId: 'cafe-uuid',
  tableNo: 5,
  items: cartItems,
  subtotal: 100,
  tax: 5,
  total: 105,
  orderType: 'dine_in',
  customerId: 'customer-uuid', // optional
  notes: 'Birthday celebration', // optional
});

if (result.success) {
  console.log('Order ID:', result.orderId);
} else {
  console.error('Error:', result.error);
}
```

#### `getOrder(orderId)`
Fetches a single order with items.

```typescript
const result = await getOrder('order-uuid');
if (result.success) {
  console.log('Order:', result.order);
}
```

#### `getOrders(cafeId, options)`
Fetches orders for a cafe with filtering.

```typescript
const result = await getOrders('cafe-uuid', {
  status: 'preparing',
  limit: 10,
  offset: 0,
});
```

#### `updateOrderStatus(orderId, status)`
Updates order status.

```typescript
const result = await updateOrderStatus('order-uuid', 'preparing');
```

#### `subscribeToOrderStatus(orderId, callback)`
Real-time subscription to order status changes.

```typescript
const unsubscribe = subscribeToOrderStatus('order-uuid', (newStatus) => {
  console.log('Status updated:', newStatus);
});

// Later: unsubscribe();
```

#### `subscribeToCafeOrders(cafeId, callback)`
Real-time subscription to all orders for a cafe.

```typescript
const unsubscribe = subscribeToCafeOrders('cafe-uuid', (orders) => {
  console.log('Orders updated:', orders);
});
```

## 🎉 Order Confirmation

### Features
- **Confetti Animation**: Celebratory confetti on success
- **Order Details**: Order number, estimated time, table
- **Share Functionality**: Native share API or clipboard fallback
- **Track Order**: Navigate to tracking page
- **Smooth Animations**: Framer Motion transitions

### Usage

```typescript
import OrderConfirmation from '../components/OrderConfirmation';

function CustomerApp() {
  const [confirmation, setConfirmation] = useState(null);

  return (
    <>
      {confirmation && (
        <OrderConfirmation
          orderId={confirmation.orderId}
          orderNumber={confirmation.orderNumber}
          estimatedTime={15}
          tableNo={5}
          onClose={() => setConfirmation(null)}
        />
      )}
    </>
  );
}
```

## 🔔 Toast Notifications

### Features
- **Multiple Types**: Success, error, warning, info
- **Auto-dismiss**: Configurable duration
- **Animations**: Smooth slide-in/out
- **Stackable**: Multiple toasts at once
- **Manual Dismiss**: Close button

### Usage

```typescript
import { useToast } from '../contexts/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Order placed successfully!');
  };

  const handleError = () => {
    toast.error('Failed to place order');
  };

  const handleWarning = () => {
    toast.warning('Cart will expire in 5 minutes');
  };

  const handleInfo = () => {
    toast.info('New items added to menu');
  };

  // Custom duration (default: 3000ms)
  toast.success('Saved!', 5000);
}
```

### Setup

Wrap your app with `ToastProvider`:

```typescript
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}
```

## 📊 Order Tracking

### Features
- **Real-time Updates**: WebSocket subscription via Supabase Realtime
- **Visual Progress**: Step-by-step status indicator
- **Estimated Time**: Countdown timer
- **Order Details**: Items, quantities, notes, totals
- **Call Kitchen**: Notification button
- **Responsive Design**: Mobile-first approach

### Status Flow

```
Received → Preparing → Ready → Served
```

### Usage

```typescript
// Navigate to tracking page
navigate(`/order/${orderId}`);

// Or use the component directly
import OrderTracking from './pages/OrderTracking';

<OrderTracking orderId="order-uuid" />
```

## 🔄 Complete Order Flow

### 1. Customer Browses Menu
```typescript
// CustomerApp.tsx
const addToCart = (item: DatabaseMenuItem) => {
  cart.addItem({
    menuItemId: item.id,
    name: item.name,
    price: item.price,
    image: item.image_url,
    isVeg: item.is_veg,
    isSpicy: item.is_spicy,
  });
  toast.success(`${item.name} added to cart`);
};
```

### 2. Customer Views Cart
```typescript
// CartDrawer opens
<CartDrawer
  isOpen={isCartOpen}
  onClose={() => setIsCartOpen(false)}
  onCheckout={handleCheckout}
/>
```

### 3. Customer Places Order
```typescript
const handleCheckout = async () => {
  setIsPlacingOrder(true);

  const result = await createOrder({
    cafeId: qrData.cafeId,
    tableNo: qrData.tableNo,
    items: cart.items,
    subtotal: cart.getSubtotal(),
    tax: cart.getTax(),
    total: cart.getTotal(),
    orderType: 'dine_in',
  });

  if (result.success) {
    setOrderConfirmation({
      orderId: result.orderId,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      estimatedTime: 15,
      tableNo: qrData.tableNo,
    });
    cart.clearCart();
    toast.success('Order placed successfully!');
  } else {
    toast.error(result.error || 'Failed to place order');
  }

  setIsPlacingOrder(false);
};
```

### 4. Order Confirmation Shown
```typescript
{orderConfirmation && (
  <OrderConfirmation
    orderId={orderConfirmation.orderId}
    orderNumber={orderConfirmation.orderNumber}
    estimatedTime={orderConfirmation.estimatedTime}
    tableNo={orderConfirmation.tableNo}
    onClose={() => setOrderConfirmation(null)}
  />
)}
```

### 5. Customer Tracks Order
```typescript
// Navigate to tracking page
navigate(`/order/${orderId}`);

// Real-time updates via subscription
useEffect(() => {
  const unsubscribe = subscribeToOrderStatus(orderId, (newStatus) => {
    setOrder((prev) => ({ ...prev, status: newStatus }));
  });
  return () => unsubscribe();
}, [orderId]);
```

## 🗄️ Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES cafes(id),
  order_number TEXT,
  table_no INT,
  customer_id UUID REFERENCES users(id),
  items JSONB,              -- Array of order items
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  status TEXT CHECK (status IN ('received', 'preparing', 'ready', 'served', 'cancelled')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_type TEXT CHECK (order_type IN ('dine_in', 'pre_order')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Items JSONB Structure
```json
[
  {
    "menu_item_id": "uuid",
    "name": "Cappuccino",
    "quantity": 2,
    "price": 4.50,
    "notes": "Extra hot",
    "is_veg": true,
    "is_spicy": false
  }
]
```

## 🎨 UI Components

### Cart Item Card
- Item image (optional)
- Name and dietary indicators
- Special instructions display
- Quantity controls (+/-)
- Remove button
- Price display

### Order Status Card
- Gradient background
- Current status label
- Estimated time badge
- Status description

### Progress Steps
- Vertical timeline
- Completed steps (green)
- Current step (primary color with ring)
- Pending steps (gray)
- Connecting lines

## 🔐 Security & Validation

### Cart Validation
- Item must exist in menu
- Quantity must be > 0
- Price must be positive

### Order Validation
- Cafe ID must be valid UUID
- Table number must be positive
- Items array must not be empty
- Totals must match calculation

### RLS Policies
```sql
-- Customers can only see their own orders
CREATE POLICY orders_select_customer ON orders
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can see all orders in their cafe
CREATE POLICY orders_select_staff ON orders
  FOR SELECT USING (
    cafe_id = current_setting('app.current_cafe_id')::UUID AND
    is_cafe_staff(cafe_id)
  );
```

## 🧪 Testing

### Cart Store
```typescript
import { useCartStore } from './stores/cartStore';

test('should add item to cart', () => {
  const { addItem, items } = useCartStore.getState();
  
  addItem({
    menuItemId: '123',
    name: 'Test Item',
    price: 10,
    isVeg: true,
    isSpicy: false,
  });

  expect(items).toHaveLength(1);
  expect(items[0].name).toBe('Test Item');
});

test('should calculate totals correctly', () => {
  const { addItem, getSubtotal, getTax, getTotal } = useCartStore.getState();
  
  addItem({
    menuItemId: '123',
    name: 'Test Item',
    price: 100,
    quantity: 2,
    isVeg: true,
    isSpicy: false,
  });

  expect(getSubtotal()).toBe(200);
  expect(getTax()).toBe(10); // 5%
  expect(getTotal()).toBe(210);
});
```

### Order Service
```typescript
import { createOrder } from './services/orderService';

test('should create order successfully', async () => {
  const result = await createOrder({
    cafeId: 'valid-cafe-id',
    tableNo: 5,
    items: [/* cart items */],
    subtotal: 100,
    tax: 5,
    total: 105,
  });

  expect(result.success).toBe(true);
  expect(result.orderId).toBeDefined();
});
```

## 📱 Mobile Optimization

### Cart Drawer
- Bottom sheet on mobile (< 768px)
- Side drawer on desktop (>= 768px)
- Touch-friendly controls
- Swipe to dismiss (future)

### Order Tracking
- Full-width layout on mobile
- Large touch targets
- Readable font sizes
- Sticky header

## 🚀 Performance

### Optimizations
- **React Query**: 5-minute cache for menu items
- **Zustand**: Minimal re-renders with selectors
- **Memoization**: Filtered items memoized
- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: For large menus (future)

### Bundle Size
- Cart store: ~2KB
- Order service: ~3KB
- Cart drawer: ~5KB
- Order confirmation: ~4KB
- Toast system: ~3KB

## 🔄 Future Enhancements

### Cart Features
- [ ] Item recommendations
- [ ] Combo deals
- [ ] Saved carts
- [ ] Cart sharing
- [ ] Expiry timer

### Order Features
- [ ] Order history
- [ ] Reorder functionality
- [ ] Order cancellation
- [ ] Rating & review
- [ ] Loyalty points integration

### Payment Integration
- [ ] Razorpay integration
- [ ] Multiple payment methods
- [ ] Split payments
- [ ] Tips
- [ ] Digital receipts

## 📚 Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Framer Motion](https://www.framer.com/motion/)
- [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- [React Query](https://tanstack.com/query/latest)
