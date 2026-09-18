# BrewHub Customer-Facing QR Code Menu System

## Overview

Complete customer-facing experience for QR code-based menu browsing and ordering. Customers scan a QR code at their table to access the digital menu, browse items, and add them to cart.

## Architecture

```
src/
├── utils/
│   └── qrParser.ts              # QR code URL parsing and validation
├── components/
│   ├── MenuItemCard.tsx         # Individual menu item card component
│   └── CategoryTabs.tsx         # Horizontal scrollable category tabs
└── pages/
    └── CustomerApp.tsx          # Main customer menu browsing page
```

## Features

### 1. **QR Code Parser** (`src/utils/qrParser.ts`)

Parses QR code URLs and extracts cafe/table information.

**Functions:**

```typescript
// Parse QR code URL
parseQRCode(url: string): QRData | QRError

// Generate QR code URL
generateQRUrl(cafeId: string, tableNo: number, baseUrl?: string): string

// Validate UUID format
isValidUUID(uuid: string): boolean

// Get QR data from current location
getQRDataFromLocation(): QRData | QRError | null
```

**URL Format:**
```
https://brewhub.app/customer?cafe={cafe_id}&table={table_no}
```

**Example:**
```
https://brewhub.app/customer?cafe=550e8400-e29b-41d4-a716-446655440000&table=5
```

**Validation:**
- Validates cafe_id as UUID format
- Validates table_no as positive integer
- Returns structured error with error code for debugging

### 2. **Menu Item Card** (`src/components/MenuItemCard.tsx`)

Displays individual menu items with all visual elements.

**Features:**
- Image with fallback (shows placeholder if image fails to load)
- Veg indicator (green dot in green border)
- Non-veg indicator (red dot in red border)
- Popular badge (golden star with "Popular" text)
- Spicy indicator (flame icon in red circle)
- Price display in ₹ (Indian Rupees)
- Add to cart button with quantity selector
- Framer Motion tap animations

**Props:**
```typescript
interface MenuItemCardProps {
  item: DatabaseMenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}
```

**Visual Elements:**
- **Veg/Non-Veg**: Standard FSSAI-compliant indicators
- **Popular Badge**: Appears on top-right for popular items
- **Spicy Indicator**: Flame icon on bottom-right for spicy items
- **Price**: Large, bold price display
- **Add Button**: 
  - Shows "ADD" button when quantity is 0
  - Shows quantity selector (- number +) when quantity > 0

### 3. **Category Tabs** (`src/components/CategoryTabs.tsx`)

Horizontal scrollable category tabs with sticky positioning.

**Features:**
- Horizontal scroll with hidden scrollbar
- Active tab indicator with smooth animation
- Auto-scroll to active tab
- Sticky positioning (stays visible on scroll)
- Smooth transitions with Framer Motion

**Props:**
```typescript
interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}
```

### 4. **Customer App Page** (`src/pages/CustomerApp.tsx`)

Main customer-facing menu browsing experience.

**Features:**

#### QR Code Integration
- Parses QR code data from URL on load
- Validates cafe_id and table_no
- Shows error screen for invalid QR codes
- Displays table number in header

#### Menu Display
- Fetches menu items from Supabase filtered by cafe_id
- Displays items in responsive grid (1/2/3 columns)
- Category-based filtering with tabs
- Real-time search functionality
- Veg/Non-veg filtering
- Sort options (default, price low-high, price high-low, popular)

#### Cart Functionality
- Add/remove items with quantity selector
- Floating cart button showing:
  - Item count
  - Total amount in ₹
- Cart persists in component state
- Smooth animations for cart updates

#### Loading States
- Skeleton loading for header, search, tabs, and menu items
- Animated pulse effect
- Maintains layout during loading

#### Error Handling
- Invalid QR code error screen
- Network error with retry button
- Empty state for no items
- Search/filter no results state

#### Performance
- React Query caching (5 minutes stale time, 10 minutes GC time)
- Memoized computations for filtered items
- Optimized re-renders with useMemo

## Usage

### 1. Generate QR Code for Table

```typescript
import { generateQRUrl } from './utils/qrParser';

const qrUrl = generateQRUrl(
  '550e8400-e29b-41d4-a716-446655440000', // cafe_id
  5, // table_no
  'https://brewhub.app' // optional base URL
);

// Result: https://brewhub.app/customer?cafe=550e8400-e29b-41d4-a716-446655440000&table=5
```

### 2. Access Customer Menu

Customer scans QR code → Opens URL → Sees menu for that cafe/table

**URL Parameters:**
- `cafe` or `cafe_id`: UUID of the cafe
- `table` or `table_no`: Table number (positive integer)

### 3. Browse Menu

**Categories:**
- "All" tab shows all items
- Category tabs filter by item category
- Tabs are extracted from menu items dynamically

**Search:**
- Real-time search across name and description
- Clear button to reset search
- Case-insensitive matching

**Filters:**
- **Diet**: All / Veg / Non-Veg
- **Sort**: Default / Price Low-High / Price High-Low / Most Popular

### 4. Add to Cart

**Add Item:**
1. Click "ADD" button on menu item card
2. Item added to cart with quantity 1
3. Floating cart button appears

**Update Quantity:**
1. Click "+" to increase quantity
2. Click "-" to decrease quantity
3. Cart automatically updates

**View Cart:**
1. Click floating cart button
2. Shows item count and total amount
3. (Future) Navigate to cart/checkout page

## Database Integration

### Menu Items Query

```typescript
const { data: menuItems } = useQuery({
  queryKey: ['menuItems', cafeId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('cafe_id', cafeId)
      .eq('is_available', true)
      .order('category', { ascending: true })
      .order('is_popular', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },
  enabled: !!cafeId,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
});
```

### Menu Item Structure

```typescript
interface DatabaseMenuItem {
  id: string;
  cafe_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  is_popular: boolean;
  is_spicy: boolean;
  preparation_time: number;
  calories: number | null;
  allergens: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

## UI/UX Details

### Color Scheme
- **Primary**: Red-500 (#ef4444) for CTAs and active states
- **Veg**: Green-600 (#16a34a) for vegetarian indicator
- **Non-Veg**: Red-600 (#dc2626) for non-vegetarian indicator
- **Popular**: Amber-400 to Amber-500 gradient for popular badge
- **Spicy**: Red-500 (#ef4444) for spicy indicator

### Animations
- **Card Entry**: Fade in with slide up (200ms)
- **Card Exit**: Fade out with slide up (200ms)
- **Tab Switch**: Smooth spring animation (300ms)
- **Cart Button**: Slide up from bottom (300ms)
- **Filter Panel**: Expand/collapse with height animation
- **Tap Feedback**: Scale down to 0.95 on tap

### Responsive Design
- **Mobile**: Single column grid
- **Tablet**: Two column grid
- **Desktop**: Three column grid
- **Sticky Elements**: Header and category tabs stay visible

### Accessibility
- Proper ARIA labels for buttons
- Keyboard navigation support
- Focus indicators on interactive elements
- Screen reader friendly structure
- High contrast ratios

## Error Handling

### Invalid QR Code
```
Error Screen:
- Red alert icon
- "Invalid QR Code" heading
- Specific error message
- Instructions to contact staff
```

### Network Error
```
Error Screen:
- Red alert icon
- "Error Loading Menu" heading
- Error message
- Retry button
```

### No Items Found
```
Empty State:
- Leaf icon
- "No items found" heading
- Contextual message (search vs category)
```

## Performance Optimizations

### React Query
- **Stale Time**: 5 minutes (data considered fresh)
- **GC Time**: 10 minutes (data kept in cache)
- **Refetch**: Disabled on window focus
- **Retry**: 2 retries on failure

### Memoization
- `filteredItems`: Memoized based on filters and search
- `categories`: Memoized based on menu items
- `cartTotal`: Memoized based on cart
- `cartItemCount`: Memoized based on cart

### Lazy Loading
- Images use native lazy loading
- Components loaded on demand
- Route-based code splitting

## Future Enhancements

### Cart Features
- [ ] Persistent cart (localStorage)
- [ ] Cart page with item details
- [ ] Special instructions per item
- [ ] Item notes/allergens display
- [ ] Cart sharing between devices

### Ordering Features
- [ ] Checkout flow
- [ ] Payment integration (Razorpay)
- [ ] Order confirmation
- [ ] Order tracking
- [ ] Real-time order status updates

### Menu Features
- [ ] Item detail modal/page
- [ ] Image gallery
- [ ] Nutritional information
- [ ] Allergen warnings
- [ ] Related items suggestions
- [ ] Item reviews/ratings

### Personalization
- [ ] Recently viewed items
- [ ] Favorite items
- [ ] Dietary preferences
- [ ] Order history
- [ ] Personalized recommendations

## Testing

### QR Code Testing
```typescript
// Valid QR code
parseQRCode('?cafe=550e8400-e29b-41d4-a716-446655440000&table=5')
// Returns: { cafeId: '550e8400-...', tableNo: 5 }

// Missing cafe
parseQRCode('?table=5')
// Returns: { error: 'Missing cafe ID', code: 'MISSING_CAFE' }

// Invalid UUID
parseQRCode('?cafe=invalid&table=5')
// Returns: { error: 'Invalid cafe ID format', code: 'INVALID_CAFE_ID' }
```

### Component Testing
```typescript
// Test MenuItemCard
<MenuItemCard
  item={mockMenuItem}
  quantity={2}
  onAdd={() => console.log('add')}
  onRemove={() => console.log('remove')}
/>

// Test CategoryTabs
<CategoryTabs
  categories={['All', 'Coffee', 'Tea', 'Food']}
  activeCategory="Coffee"
  onCategoryChange={(cat) => console.log(cat)}
/>
```

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile Safari: 14+
- Chrome Android: 90+

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
