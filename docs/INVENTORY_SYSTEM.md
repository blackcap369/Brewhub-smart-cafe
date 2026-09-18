# Inventory Management System

## Overview

The Inventory Management System provides comprehensive tracking of ingredients, recipes, stock levels, and costs for BrewHub cafes. It includes auto-deduction when orders are placed, low stock alerts, and detailed reporting.

## Features

### 1. Ingredient Management
- Track all ingredients with units, quantities, and costs
- Set minimum stock levels for alerts
- Organize by categories and suppliers
- Monitor stock value and consumption

### 2. Recipe Management
- Link ingredients to menu items
- Define exact quantities needed per item
- Calculate item costs automatically
- Show profit margins

### 3. Auto-Deduction
- Automatically deduct ingredients when orders are placed
- Real-time stock updates
- Prevent overselling with stock checks
- Transaction logging for audit trail

### 4. Stock Alerts
- Low stock warnings when below minimum
- Out of stock notifications
- Auto-hide unavailable menu items
- Email/push notifications for critical items

### 5. Reporting & Analytics
- Stock consumption reports (daily/weekly/monthly)
- Cost analysis per ingredient and menu item
- Waste tracking
- Reorder suggestions based on consumption
- Supplier-wise purchase summaries

### 6. Transaction Tracking
- Stock-in (receiving inventory)
- Stock-out (usage in orders)
- Adjustments (corrections)
- Waste recording
- Full audit trail with timestamps

## Database Schema

### ingredients Table
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'boxes')),
  quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  last_restocked TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cafe_id, name)
);
```

### recipe_ingredients Table
```sql
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  quantity_required DECIMAL(10,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, ingredient_id)
);
```

### inventory_transactions Table
```sql
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'waste')),
  quantity DECIMAL(10,3) NOT NULL,
  reason TEXT,
  order_id UUID REFERENCES orders(id),
  performed_by UUID REFERENCES users(id),
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### inventory_alerts Table
```sql
CREATE TABLE inventory_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiry')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

## API Reference

### Ingredient Management

#### getIngredients(cafeId)
Get all active ingredients for a cafe.

```typescript
const { data, error } = await getIngredients('cafe-id');
```

#### createIngredient(ingredient)
Create a new ingredient.

```typescript
const { data, error } = await createIngredient({
  cafe_id: 'cafe-id',
  name: 'Tomatoes',
  category: 'vegetables',
  unit: 'kg',
  quantity: 50,
  min_quantity: 10,
  cost_per_unit: 2.50,
  supplier: 'Fresh Farms',
  is_active: true,
});
```

#### updateIngredient(ingredientId, updates)
Update ingredient details.

```typescript
const { data, error } = await updateIngredient('ingredient-id', {
  quantity: 45,
  min_quantity: 15,
});
```

#### deleteIngredient(ingredientId)
Soft delete an ingredient.

```typescript
const { error } = await deleteIngredient('ingredient-id');
```

### Stock Operations

#### stockIn(ingredientId, quantity, reason, performedBy, cost?)
Add stock to an ingredient.

```typescript
const { error } = await stockIn(
  'ingredient-id',
  20, // quantity
  'Weekly restock', // reason
  'user-id', // performed by
  50 // total cost (optional)
);
```

#### stockOut(ingredientId, quantity, reason, performedBy, orderId?)
Remove stock from an ingredient.

```typescript
const { error } = await stockOut(
  'ingredient-id',
  5, // quantity
  'Order #123', // reason
  'user-id', // performed by
  'order-id' // optional
);
```

#### adjustInventory(ingredientId, newQuantity, reason, performedBy)
Adjust inventory quantity (for corrections).

```typescript
const { error } = await adjustInventory(
  'ingredient-id',
  48, // new quantity
  'Physical count correction', // reason
  'user-id' // performed by
);
```

### Recipe Management

#### getRecipe(menuItemId)
Get recipe ingredients for a menu item.

```typescript
const { data, error } = await getRecipe('menu-item-id');
// Returns: [{ ingredient_id, quantity_required, ingredient: {...} }]
```

#### setRecipe(menuItemId, ingredients)
Set recipe for a menu item.

```typescript
const { error } = await setRecipe('menu-item-id', [
  { ingredient_id: 'ing-1', quantity_required: 0.2 }, // 200g
  { ingredient_id: 'ing-2', quantity_required: 0.05 }, // 50g
]);
```

#### calculateMenuItemCost(menuItemId)
Calculate total ingredient cost for a menu item.

```typescript
const { data, error } = await calculateMenuItemCost('menu-item-id');
// Returns: 5.75 (total cost in currency)
```

#### canPrepareMenuItem(menuItemId, quantity?)
Check if a menu item can be prepared with current stock.

```typescript
const { canPrepare, missingIngredients } = await canPrepareMenuItem('menu-item-id', 2);
// Returns: { canPrepare: false, missingIngredients: ['Tomatoes', 'Cheese'] }
```

### Auto-Deduction

#### deductIngredientsForOrder(orderId)
Automatically deduct all ingredients for an order.

```typescript
const { success, error } = await deductIngredientsForOrder('order-id');
```

This function:
1. Checks if all ingredients are available
2. Deducts quantities based on recipes
3. Creates transaction records
4. Generates low stock alerts if needed
5. Auto-hides menu items if ingredients run out

### Reporting

#### getStockConsumptionReport(cafeId, startDate, endDate)
Get consumption report for a date range.

```typescript
const { data, error } = await getStockConsumptionReport(
  'cafe-id',
  '2024-01-01',
  '2024-01-31'
);
// Returns: [{ ingredient_name, unit, total_consumed, total_cost, transaction_count }]
```

#### getTransactions(cafeId, filters?)
Get inventory transactions with optional filters.

```typescript
const { data, error } = await getTransactions('cafe-id', {
  ingredient_id: 'ingredient-id', // optional
  type: 'stock_out', // optional
  start_date: '2024-01-01', // optional
  end_date: '2024-01-31', // optional
});
```

#### getInventorySummary(cafeId)
Get inventory summary statistics.

```typescript
const { data, error } = await getInventorySummary('cafe-id');
// Returns: {
//   total_ingredients: 45,
//   low_stock_count: 5,
//   out_of_stock_count: 2,
//   total_value: 1250.50,
//   unread_alerts: 3
// }
```

#### getLowStockIngredients(cafeId)
Get ingredients below minimum quantity.

```typescript
const { data, error } = await getLowStockIngredients('cafe-id');
// Returns: [{ id, name, unit, quantity, min_quantity, supplier, suggested_order_quantity }]
```

### Alerts

#### getAlerts(cafeId, unreadOnly?)
Get inventory alerts.

```typescript
const { data, error } = await getAlerts('cafe-id', true); // unread only
```

#### markAlertAsRead(alertId)
Mark an alert as read.

```typescript
const { error } = await markAlertAsRead('alert-id');
```

## UI Components

### Inventory Dashboard
Located at: `/admin-dashboard/inventory`

Features:
- Summary cards (total ingredients, low stock, out of stock, total value)
- Low stock alerts banner
- Ingredient list with search and filters
- Color-coded stock status (green/amber/red)
- Quick actions (stock in, adjust, delete)
- Add ingredient modal

### Inventory Reports
Located at: `/admin-dashboard/inventory/reports`

Features:
- Stock consumption report
- Transaction history
- Cost analysis
- Date range selection
- Export capabilities

### Recipe Builder
Integrated into menu management.

Features:
- Visual recipe editor
- Add/remove ingredients
- Set quantities
- Real-time cost calculation
- Profit margin display
- Ingredient availability check

## Auto-Deduction Flow

When an order is placed:

1. **Order Created**
   - Order status set to 'received'
   - Items stored in order

2. **Ingredient Check**
   - System checks if all ingredients are available
   - Calculates required quantities based on recipes
   - If insufficient stock, creates alert and marks items unavailable

3. **Deduction**
   - Deducts ingredients from inventory
   - Creates 'stock_out' transactions
   - Updates ingredient quantities

4. **Alert Generation**
   - Checks if any ingredients fall below minimum
   - Creates low stock alerts
   - Notifies admin via push/email

5. **Menu Item Update**
   - If any ingredient reaches 0, auto-hides related menu items
   - Shows "Out of stock" on customer menu
   - Prevents further orders of unavailable items

## Stock Status Indicators

### Green (In Stock)
- Quantity > min_quantity
- No action needed

### Amber (Low Stock)
- Quantity <= min_quantity AND quantity > 0
- Warning displayed
- Reorder suggested

### Red (Out of Stock)
- Quantity <= 0
- Menu items auto-hidden
- Critical alert sent

## Best Practices

### Setting Up Inventory

1. **Add All Ingredients**
   - Start with base ingredients
   - Set accurate units (kg, g, l, ml, pcs)
   - Enter current stock quantities
   - Set cost per unit for accurate costing

2. **Define Minimum Quantities**
   - Set based on lead time from suppliers
   - Consider usage rate
   - Include safety stock for emergencies

3. **Create Recipes**
   - Link every menu item to ingredients
   - Use precise quantities
   - Test cost calculations
   - Verify profit margins

4. **Regular Stock Takes**
   - Weekly physical counts
   - Adjust for discrepancies
   - Record waste separately
   - Update min quantities as needed

### Daily Operations

1. **Morning Check**
   - Review low stock alerts
   - Place orders for critical items
   - Check for out-of-stock items
   - Update menu if needed

2. **During Service**
   - Monitor auto-deductions
   - Watch for unexpected shortages
   - Handle manual adjustments carefully
   - Record all waste

3. **End of Day**
   - Review daily consumption
   - Check transaction log
   - Plan next day's prep
   - Update reorder list

### Cost Management

1. **Track Supplier Prices**
   - Update cost_per_unit when prices change
   - Monitor cost trends
   - Compare suppliers
   - Adjust menu prices if needed

2. **Monitor Waste**
   - Record all waste transactions
   - Analyze waste patterns
   - Adjust order quantities
   - Improve storage practices

3. **Profit Margins**
   - Review item costs regularly
   - Ensure minimum 60-70% margin
   - Adjust recipes if costs rise
   - Consider portion sizes

## Integration Points

### Order System
- Auto-deduct on order placement
- Check availability before confirming
- Update menu item availability
- Link transactions to orders

### Menu Management
- Recipe builder integration
- Cost display on menu items
- Profit margin calculation
- Availability status

### Kitchen Display
- Show ingredient availability
- Alert on missing ingredients
- Suggest alternatives
- Track preparation time

### Analytics
- Consumption trends
- Cost analysis
- Waste tracking
- Supplier performance

## Security

### Row Level Security
- Staff can view inventory
- Only owners/managers can modify
- Transaction logging for audit
- Role-based access control

### Data Validation
- Prevent negative quantities
- Validate units and measurements
- Check for duplicate ingredients
- Enforce minimum stock levels

## Performance

### Optimization
- Indexed queries for fast lookups
- Cached summary statistics
- Batch transaction processing
- Efficient alert generation

### Scalability
- Handles 1000+ ingredients
- Supports multiple cafes
- Efficient transaction logging
- Fast report generation

## Troubleshooting

### Common Issues

**Ingredients not deducting**
- Check if recipe is defined for menu item
- Verify ingredient quantities are sufficient
- Check transaction logs for errors
- Ensure auto-deduction is enabled

**Low stock alerts not showing**
- Verify min_quantity is set correctly
- Check alert creation function
- Review notification settings
- Ensure user has permission to view alerts

**Cost calculations wrong**
- Verify cost_per_unit is accurate
- Check recipe quantities
- Review unit conversions
- Update costs after price changes

**Menu items showing as available when out of stock**
- Check auto-hide function
- Verify ingredient quantities
- Review menu item availability logic
- Manual override may be active

## Future Enhancements

### Planned Features
- [ ] Barcode scanning for stock-in
- [ ] Supplier portal for ordering
- [ ] Automated reorder suggestions
- [ ] Expiry date tracking
- [ ] Batch/lot tracking
- [ ] Multi-location inventory
- [ ] Purchase order management
- [ ] Vendor price comparison
- [ ] Recipe cost optimization
- [ ] Integration with accounting software

### Advanced Analytics
- [ ] Predictive stock requirements
- [ ] Seasonal trend analysis
- [ ] Waste reduction recommendations
- [ ] Optimal order quantities
- [ ] Supplier performance scoring
- [ ] Cost variance analysis

## Support

For issues or questions:
- Check transaction logs for errors
- Verify database permissions
- Review RLS policies
- Check notification service status
- Contact support team

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: ✅ Production Ready
