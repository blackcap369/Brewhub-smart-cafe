# BrewHub Loyalty Program - Complete Implementation

## Overview

The BrewHub Loyalty Program is a comprehensive customer retention system that rewards repeat customers with free items after every 7 orders. The system features visual progress tracking, tier-based rewards, and seamless integration with the ordering system.

## Features

### 🎯 Core Features
- **Order-based Rewards**: Earn a free item after every 7 orders
- **Visual Progress Tracking**: Stamp card visualization with animated progress
- **Tier System**: Bronze, Silver, Gold, and Platinum tiers based on spending
- **Cooldown Enforcement**: 6-hour cooldown between redemptions
- **Per-Cafe Tracking**: Loyalty points are tracked separately for each cafe
- **Real-time Updates**: Instant progress updates after each order

### 🎨 UI Components
- **LoyaltyCard**: Visual stamp card with progress bar and tier badge
- **LoyaltyBanner**: Notification banner when close to earning a reward
- **FreeItemSelector**: Modal for selecting free items when eligible

### 🔧 Technical Features
- **Zustand Store**: Client-side state management with localStorage persistence
- **Supabase Integration**: Server-side loyalty tracking and redemption history
- **Optimistic Updates**: Instant UI feedback with background sync
- **Type Safety**: Full TypeScript support with proper type definitions

## Architecture

### Database Schema

```sql
-- loyalty_points table (already exists)
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  last_redeemed TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, cafe_id)
);

-- loyalty_redemptions table (new)
CREATE TABLE loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### State Management

#### Zustand Store (`src/stores/loyaltyStore.ts`)

```typescript
interface LoyaltyState {
  cafes: Record<string, CafeLoyalty>;
  initializeCafe: (cafeId: string) => void;
  incrementOrder: (cafeId: string) => void;
  addPoints: (cafeId: string, points: number) => void;
  redeemReward: (cafeId: string) => void;
  getLoyaltyStatus: (cafeId: string) => CafeLoyalty | null;
  isEligibleForReward: (cafeId: string) => boolean;
  getOrdersUntilReward: (cafeId: string) => number;
  isInCooldown: (cafeId: string) => boolean;
  getCooldownRemaining: (cafeId: string) => number;
  calculateTier: (ordersCount: number, totalSpent: number) => Tier;
}
```

**Key Features:**
- Persistent storage in localStorage
- Per-cafe loyalty tracking
- Automatic tier calculation
- Cooldown enforcement
- Eligibility checking

### Service Layer

#### Loyalty Service (`src/services/loyaltyService.ts`)

```typescript
// Fetch loyalty status from database
getLoyaltyStatus(customerId: string, cafeId: string)

// Add loyalty point after order completion
addLoyaltyPoint(customerId: string, cafeId: string, orderAmount: number)

// Redeem reward and record redemption
redeemReward(customerId: string, cafeId: string, orderId: string, selectedItems: string[])

// Get redemption history
getRedemptionHistory(customerId: string, cafeId: string)
```

## Business Rules

### Reward Structure
- **Every 7th order**: Customer earns 1-2 free items (configurable)
- **Points System**: 10 points per order
- **Cooldown**: 6 hours between redemptions
- **Per-Cafe**: Loyalty is tracked separately for each cafe

### Tier System

| Tier | Requirements | Benefits |
|------|--------------|----------|
| **Bronze** | Default tier | Basic rewards |
| **Silver** | 10+ orders OR $500+ spent | Priority support |
| **Gold** | 25+ orders OR $2000+ spent | Exclusive offers |
| **Platinum** | 50+ orders OR $5000+ spent | VIP treatment |

### Eligibility Rules
1. Customer must have completed 7 orders at the cafe
2. No redemption in the last 6 hours
3. Customer must be authenticated
4. Cafe must have loyalty program enabled

## UI Components

### LoyaltyCard Component

**Location**: `src/components/LoyaltyCard.tsx`

**Features:**
- Visual stamp card with 7 circles
- Animated progress bar
- Tier badge with gradient
- Redeem button (when eligible)
- Cooldown timer (when in cooldown)
- Orders remaining counter

**Props:**
```typescript
interface LoyaltyCardProps {
  cafeId: string;
  onRedeem?: () => void;
}
```

**Usage:**
```tsx
<LoyaltyCard 
  cafeId={cafeId} 
  onRedeem={() => setShowFreeItemSelector(true)} 
/>
```

### LoyaltyBanner Component

**Location**: `src/components/LoyaltyBanner.tsx`

**Features:**
- Shows when 1-2 orders away from reward
- Animated gift icon
- Progress bar
- Dismissible
- Gradient background

**Props:**
```typescript
interface LoyaltyBannerProps {
  cafeId: string;
  onDismiss?: () => void;
}
```

**Usage:**
```tsx
<LoyaltyBanner 
  cafeId={cafeId} 
  onDismiss={() => setShowBanner(false)} 
/>
```

### FreeItemSelector Component

**Location**: `src/components/FreeItemSelector.tsx`

**Features:**
- Modal overlay with backdrop
- Grid of menu items
- Multi-select (up to 2 items)
- Visual selection indicators
- Total value display
- Confirm/Cancel buttons

**Props:**
```typescript
interface FreeItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: DatabaseMenuItem[];
  onConfirm: (selectedItems: DatabaseMenuItem[]) => void;
  maxItems?: number;
}
```

**Usage:**
```tsx
<FreeItemSelector
  isOpen={showFreeItemSelector}
  onClose={() => setShowFreeItemSelector(false)}
  menuItems={menuItems}
  maxItems={2}
  onConfirm={(items) => handleFreeItemSelection(items)}
/>
```

## Integration Guide

### 1. Initialize Loyalty on App Load

```typescript
useEffect(() => {
  if (qrData?.cafeId) {
    initializeCafe(qrData.cafeId);
  }
}, [qrData?.cafeId, initializeCafe]);
```

### 2. Increment Loyalty After Order

```typescript
const handlePaymentSuccess = () => {
  if (createdOrder && qrData) {
    // ... existing code ...
    
    // Increment loyalty counter
    incrementOrder(qrData.cafeId);
    
    // ... rest of the code ...
  }
};
```

### 3. Show Loyalty UI

```tsx
{/* Loyalty Card Section */}
<AnimatePresence>
  {showLoyaltyCard && qrData?.cafeId && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <LoyaltyCard
        cafeId={qrData.cafeId}
        onRedeem={() => setShowFreeItemSelector(true)}
      />
    </motion.div>
  )}
</AnimatePresence>

{/* Loyalty Banner */}
{qrData?.cafeId && showBanner && (
  <LoyaltyBanner
    cafeId={qrData.cafeId}
    onDismiss={() => setShowBanner(false)}
  />
)}
```

### 4. Handle Free Item Selection

```typescript
<FreeItemSelector
  isOpen={showFreeItemSelector}
  onClose={() => setShowFreeItemSelector(false)}
  menuItems={menuItems}
  maxItems={2}
  onConfirm={async (selectedItems) => {
    // Redeem reward
    const result = await redeemReward(
      customerId,
      cafeId,
      orderId,
      selectedItems.map(item => item.id)
    );
    
    if (result.success) {
      toast.success('Reward redeemed successfully!');
      // Update local state
      redeemRewardFromStore(cafeId);
    } else {
      toast.error(result.error || 'Failed to redeem reward');
    }
  }}
/>
```

## Database Migration

### Apply Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/003_add_loyalty_redemptions.sql
```

### Migration File

**Location**: `supabase/migrations/003_add_loyalty_redemptions.sql`

This migration:
- Creates `loyalty_redemptions` table
- Adds indexes for performance
- Enables Row Level Security
- Creates RLS policies for customers and staff
- Adds updated_at trigger

## Testing

### Manual Testing Checklist

- [ ] Loyalty card displays correctly
- [ ] Progress bar animates smoothly
- [ ] Stamp circles fill correctly
- [ ] Tier badge shows correct tier
- [ ] Redeem button appears when eligible
- [ ] Cooldown timer shows when in cooldown
- [ ] Loyalty banner shows when 1-2 orders away
- [ ] Banner can be dismissed
- [ ] Free item selector opens correctly
- [ ] Can select up to 2 items
- [ ] Selection indicators work
- [ ] Confirm button works
- [ ] Loyalty counter increments after order
- [ ] Progress persists across page reloads
- [ ] Tier updates correctly based on spending

### Automated Testing

```typescript
// Test loyalty store
describe('Loyalty Store', () => {
  it('should initialize cafe loyalty', () => {
    const { initializeCafe, getLoyaltyStatus } = useLoyaltyStore.getState();
    initializeCafe('cafe-123');
    const status = getLoyaltyStatus('cafe-123');
    expect(status).toBeDefined();
    expect(status.ordersCount).toBe(0);
  });

  it('should increment order count', () => {
    const { initializeCafe, incrementOrder, getLoyaltyStatus } = useLoyaltyStore.getState();
    initializeCafe('cafe-123');
    incrementOrder('cafe-123');
    const status = getLoyaltyStatus('cafe-123');
    expect(status.ordersCount).toBe(1);
  });

  it('should check eligibility correctly', () => {
    const { initializeCafe, incrementOrder, isEligibleForReward } = useLoyaltyStore.getState();
    initializeCafe('cafe-123');
    
    // Not eligible initially
    expect(isEligibleForReward('cafe-123')).toBe(false);
    
    // Increment 7 times
    for (let i = 0; i < 7; i++) {
      incrementOrder('cafe-123');
    }
    
    // Now eligible
    expect(isEligibleForReward('cafe-123')).toBe(true);
  });
});
```

## Configuration

### Environment Variables

No additional environment variables are required. The loyalty program uses the existing Supabase configuration.

### Customization

#### Change Reward Threshold

Edit `src/stores/loyaltyStore.ts`:

```typescript
const ORDERS_PER_REWARD = 7; // Change this value
```

#### Change Cooldown Period

Edit `src/stores/loyaltyStore.ts`:

```typescript
const COOLDOWN_HOURS = 6; // Change this value
```

#### Change Tier Thresholds

Edit `src/stores/loyaltyStore.ts`:

```typescript
calculateTier: (ordersCount: number, totalSpent: number) => {
  if (totalSpent >= 5000 || ordersCount >= 50) return 'platinum';
  if (totalSpent >= 2000 || ordersCount >= 25) return 'gold';
  if (totalSpent >= 500 || ordersCount >= 10) return 'silver';
  return 'bronze';
}
```

## Performance Considerations

### Client-Side
- **localStorage**: Loyalty data persisted locally for instant access
- **Optimistic Updates**: UI updates immediately, syncs in background
- **Memoization**: Expensive calculations memoized with useMemo

### Server-Side
- **Indexed Queries**: Database queries use indexed columns
- **RLS Policies**: Efficient row-level security policies
- **Batch Operations**: Multiple updates batched when possible

## Security

### Data Protection
- **RLS Enabled**: All loyalty tables have Row Level Security
- **Customer Isolation**: Customers can only see their own data
- **Staff Access**: Staff can view cafe-wide loyalty data
- **Audit Trail**: All redemptions recorded in loyalty_redemptions

### Authentication
- **Supabase Auth**: Uses existing authentication system
- **User Verification**: All operations verify user identity
- **Cafe Verification**: Operations verify cafe access

## Analytics & Reporting

### Available Metrics
- Total loyalty members per cafe
- Redemption rate
- Average orders per customer
- Tier distribution
- Redemption history
- Popular free items

### Query Examples

```sql
-- Get loyalty stats for a cafe
SELECT 
  tier,
  COUNT(*) as member_count,
  AVG(orders_count) as avg_orders,
  AVG(total_spent) as avg_spent
FROM loyalty_points
WHERE cafe_id = 'cafe-uuid'
GROUP BY tier;

-- Get redemption history
SELECT 
  lr.redeemed_at,
  u.name as customer_name,
  lr.items,
  o.order_number
FROM loyalty_redemptions lr
JOIN users u ON lr.customer_id = u.id
LEFT JOIN orders o ON lr.order_id = o.id
WHERE lr.cafe_id = 'cafe-uuid'
ORDER BY lr.redeemed_at DESC;
```

## Future Enhancements

### Planned Features
- [ ] Birthday rewards
- [ ] Referral bonuses
- [ ] Points expiration
- [ ] Tier-specific discounts
- [ ] Loyalty leaderboards
- [ ] Social sharing
- [ ] Mobile app integration
- [ ] Push notifications for rewards
- [ ] QR code scanning for in-store redemption
- [ ] Multi-cafe loyalty (global points)

### Advanced Features
- [ ] AI-powered reward recommendations
- [ ] Predictive analytics for customer retention
- [ ] Gamification elements (badges, achievements)
- [ ] Seasonal promotions
- [ ] Partner rewards
- [ ] Charity donations with points

## Troubleshooting

### Common Issues

#### Loyalty card not showing
- Check if cafeId is properly passed
- Verify initializeCafe is called
- Check browser console for errors

#### Progress not updating
- Verify incrementOrder is called after payment
- Check localStorage is enabled
- Clear browser cache and reload

#### Redeem button not appearing
- Check if ordersCount >= 7
- Verify cooldown period has passed
- Check isEligibleForReward returns true

#### Free items not being added to order
- Verify onConfirm callback is working
- Check redeemReward service call
- Verify database permissions

### Debug Mode

Enable debug logging:

```typescript
// In loyaltyStore.ts
const debug = true;

if (debug) {
  console.log('Loyalty State:', get().cafes);
  console.log('Eligibility:', get().isEligibleForReward(cafeId));
}
```

## Support

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Framer Motion Docs](https://www.framer.com/motion/)

### Contact
For issues or questions, please contact the development team.

## License

This implementation is part of the BrewHub SaaS platform.

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: ✅ Production Ready
