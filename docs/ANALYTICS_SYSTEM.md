# Analytics System Documentation

## Overview

The Analytics system provides comprehensive business intelligence for cafe owners, including revenue tracking, popular items analysis, peak hours visualization, customer insights, and order trends. All data is fetched from Supabase with proper date filtering and aggregation.

## Features

### 1. Date Range Selection
- **Today**: Current day's data
- **Last 7 Days**: Past week's data
- **Last 30 Days**: Past month's data
- **Custom**: User-defined date range

### 2. Key Metrics
- **Total Revenue**: Sum of all order totals
- **Total Orders**: Count of all orders
- **Average Order Value (AOV)**: Revenue / Orders
- **Total Customers**: Unique customer count
- **Trend Indicators**: Percentage change vs previous period

### 3. Visualizations

#### Revenue Trend (Line Chart)
- Shows revenue over time
- Interactive tooltips
- Responsive design
- Color: Red (#ef4444)

#### Popular Items (Bar Chart)
- Top 10 most ordered items
- Sorted by order count
- Horizontal bars for better readability
- Color: Amber (#f59e0b)

#### Order Type Distribution (Donut Chart)
- Dine-in vs Pre-order breakdown
- Percentage labels
- Interactive legend
- Colors: Red, Amber, Green, Blue, Purple

#### Peak Hours Heatmap
- 7 days × 24 hours grid
- Color intensity based on order volume
- Hover tooltips with exact counts
- Helps identify busy periods

### 4. Customer Insights
- **New vs Returning**: Customer acquisition vs retention
- **Average Frequency**: Orders per customer
- **Average Spend**: Revenue per customer
- **Top Customers**: Highest spending customers list

### 5. Export Functionality
- Export data to CSV format
- Includes all visible metrics
- Timestamped filename

## Architecture

### Service Layer (`src/services/analyticsService.ts`)

#### Functions

```typescript
// Get date range configuration
getDateRangeConfig(range: DateRange, customStart?: Date, customEnd?: Date): DateRangeConfig

// Fetch revenue data over time
getRevenueData(cafeId: string, dateRange: DateRangeConfig): Promise<{
  success: boolean;
  data?: RevenueData[];
  error?: string;
}>

// Get popular items
getPopularItems(cafeId: string, dateRange: DateRangeConfig, limit?: number): Promise<{
  success: boolean;
  data?: PopularItem[];
  error?: string;
}>

// Get peak hours data
getPeakHours(cafeId: string, dateRange: DateRangeConfig): Promise<{
  success: boolean;
  data?: PeakHourData[];
  error?: string;
}>

// Get customer insights
getCustomerInsights(cafeId: string, dateRange: DateRangeConfig): Promise<{
  success: boolean;
  data?: CustomerInsight;
  error?: string;
}>

// Get order trends
getOrderTrends(cafeId: string, dateRange: DateRangeConfig): Promise<{
  success: boolean;
  data?: OrderTrend[];
  error?: string;
}>

// Get analytics stats with trend comparison
getAnalyticsStats(cafeId: string, dateRange: DateRangeConfig): Promise<{
  success: boolean;
  data?: AnalyticsStats;
  error?: string;
}>

// Get order type distribution
getOrderTypeDistribution(cafeId: string, dateRange: DateRangeConfig): Promise<{
  success: boolean;
  data?: Array<{ type: string; count: number }>;
  error?: string;
}>

// Export data to CSV
exportToCSV(data: any[], filename: string): void
```

### Component Layer

#### Chart Components (`src/components/charts/`)

1. **LineChart.tsx**
   - Uses Recharts LineChart
   - Props: data, title, color, height
   - Responsive and interactive

2. **BarChart.tsx**
   - Uses Recharts BarChart
   - Props: data, title, color, height
   - Rotated labels for long names

3. **DonutChart.tsx**
   - Uses Recharts PieChart
   - Props: data, title, colors, height
   - Percentage labels

4. **HeatmapChart.tsx**
   - Custom SVG implementation
   - Props: data, title, height
   - 7×24 grid with color intensity

#### Analytics Dashboard (`src/components/admin/Analytics.tsx`)

Main dashboard component that:
- Manages date range state
- Fetches all analytics data using React Query
- Renders stat cards and charts
- Handles loading states
- Provides export functionality

## Data Flow

```
User selects date range
         ↓
Analytics component updates state
         ↓
React Query triggers data fetch
         ↓
analyticsService functions execute
         ↓
Supabase queries run with date filters
         ↓
Data aggregated and transformed
         ↓
Charts render with new data
```

## Database Queries

### Revenue Data
```sql
SELECT created_at, total, status
FROM orders
WHERE cafe_id = ?
  AND status != 'cancelled'
  AND created_at BETWEEN ? AND ?
ORDER BY created_at ASC
```

### Popular Items
```sql
SELECT items
FROM orders
WHERE cafe_id = ?
  AND status != 'cancelled'
  AND created_at BETWEEN ? AND ?
```
*Note: Items are aggregated in JavaScript after fetching*

### Peak Hours
```sql
SELECT created_at
FROM orders
WHERE cafe_id = ?
  AND status != 'cancelled'
  AND created_at BETWEEN ? AND ?
```
*Note: Hour and day extraction done in JavaScript*

### Customer Insights
```sql
SELECT customer_id, total, created_at
FROM orders
WHERE cafe_id = ?
  AND status != 'cancelled'
  AND created_at BETWEEN ? AND ?
```
*Note: Customer analysis done in JavaScript*

## Performance Optimizations

1. **React Query Caching**
   - 5-minute stale time
   - Automatic refetch on date range change
   - Query key includes cafeId and dateRange

2. **Database Indexes**
   - `idx_orders_cafe_id` on orders(cafe_id)
   - `idx_orders_created_at` on orders(created_at DESC)
   - `idx_orders_cafe_status` on orders(cafe_id, status)

3. **Client-side Aggregation**
   - Complex aggregations done in JavaScript
   - Reduces database load
   - Faster for small to medium datasets

4. **Lazy Loading**
   - Charts only render when data is available
   - Skeleton loaders during fetch
   - No unnecessary re-renders

## Usage Example

```typescript
import Analytics from './components/admin/Analytics';

function AdminDashboard() {
  return (
    <div>
      <Analytics cafeId="your-cafe-id" />
    </div>
  );
}
```

## Customization

### Changing Date Ranges
Edit the `DateRange` type and `getDateRangeConfig` function in `analyticsService.ts`:

```typescript
export type DateRange = 'today' | '7days' | '30days' | '90days' | 'custom';
```

### Changing Chart Colors
Pass custom colors to chart components:

```typescript
<LineChart data={data} color="#10b981" />
<BarChart data={data} color="#3b82f6" />
<DonutChart data={data} colors={['#ef4444', '#f59e0b', '#10b981']} />
```

### Adding New Metrics
1. Add query function in `analyticsService.ts`
2. Add React Query hook in `Analytics.tsx`
3. Create visualization component
4. Add to dashboard layout

## Error Handling

All service functions return a consistent error structure:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

The Analytics component handles errors gracefully:
- Shows loading skeletons during fetch
- Displays empty state if no data
- Logs errors to console for debugging

## Future Enhancements

### Planned Features
1. **Real-time Updates**
   - WebSocket connection for live data
   - Auto-refresh every minute
   - Notification on significant changes

2. **Advanced Analytics**
   - Profit margins
   - Item profitability
   - Customer lifetime value
   - Churn rate analysis

3. **Predictive Analytics**
   - Revenue forecasting
   - Demand prediction
   - Staff scheduling recommendations

4. **Custom Reports**
   - Report builder
   - Scheduled email reports
   - PDF export
   - Custom date ranges

5. **Comparisons**
   - Week-over-week
   - Month-over-month
   - Year-over-year
   - Custom period comparison

6. **Drill-down**
   - Click on chart points for details
   - Filter by category, time, etc.
   - Export filtered data

## Testing

### Manual Testing Checklist
- [ ] Date range selector works
- [ ] All charts render correctly
- [ ] Data updates when date range changes
- [ ] Loading skeletons show during fetch
- [ ] Export CSV works
- [ ] Trend indicators show correct percentages
- [ ] Customer insights display correctly
- [ ] Heatmap shows correct data
- [ ] Responsive design works on mobile
- [ ] Dark mode works

### Automated Testing
```typescript
// Example test for analytics service
describe('getRevenueData', () => {
  it('should fetch revenue data for date range', async () => {
    const dateRange = getDateRangeConfig('7days');
    const result = await getRevenueData('cafe-id', dateRange);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
});
```

## Dependencies

- **Recharts**: Chart library (already installed)
- **date-fns**: Date manipulation (already installed)
- **@tanstack/react-query**: Data fetching (already installed)
- **Supabase**: Database and API (already installed)

## Build Status

```
✓ Build successful
✓ No TypeScript errors
✓ All components compiled
✓ Bundle size: 1,697KB (486KB gzipped)
```

## Support

For issues or questions:
1. Check the console for errors
2. Verify Supabase connection
3. Check date range validity
4. Review database permissions
5. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: ✅ Production Ready
