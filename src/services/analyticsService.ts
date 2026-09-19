import { supabase } from './supabase';

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface PopularItem {
  id: string;
  name: string;
  category: string;
  order_count: number;
  total_revenue: number;
  image_url?: string;
}

export interface PeakHourData {
  hour: number;
  day_of_week: number;
  order_count: number;
}

export interface CustomerInsight {
  new_customers: number;
  returning_customers: number;
  avg_frequency: number;
  avg_spend: number;
  top_customers: Array<{
    id: string;
    name: string;
    total_orders: number;
    total_spent: number;
  }>;
}

export interface OrderTrend {
  date: string;
  order_count: number;
}

export interface AnalyticsStats {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_customers: number;
  revenue_trend: number; // percentage change
  orders_trend: number;
}

export type DateRange = 'today' | '7days' | '30days' | 'custom';

export interface DateRangeConfig {
  start: Date;
  end: Date;
}

/**
 * Get date range configuration
 */
export function getDateRangeConfig(range: DateRange, customStart?: Date, customEnd?: Date): DateRangeConfig {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (range) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case '30days':
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      start = customStart || new Date(now);
      if (customEnd) {
        end.setTime(customEnd.getTime());
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

/**
 * Get revenue data over time
 */
export async function getRevenueData(
  cafeId: string,
  dateRange: DateRangeConfig
): Promise<{ success: boolean; data?: RevenueData[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total, status')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped = new Map<string, { revenue: number; orders: number }>();

    data?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const existing = grouped.get(date) || { revenue: 0, orders: 0 };
      grouped.set(date, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1,
      });
    });

    const result: RevenueData[] = Array.from(grouped.entries()).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      orders: stats.orders,
    }));

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error fetching revenue data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get popular items
 */
export async function getPopularItems(
  cafeId: string,
  dateRange: DateRangeConfig,
  limit: number = 10
): Promise<{ success: boolean; data?: PopularItem[]; error?: string }> {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('items')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (ordersError) throw ordersError;

    // Aggregate items
    const itemStats = new Map<string, {
      name: string;
      category: string;
      image_url?: string;
      order_count: number;
      total_revenue: number;
    }>();

    orders?.forEach((order) => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      items.forEach((item: any) => {
        const existing = itemStats.get(item.menu_item_id) || {
          name: item.name,
          category: item.category || 'Other',
          image_url: item.image_url,
          order_count: 0,
          total_revenue: 0,
        };
        itemStats.set(item.menu_item_id, {
          ...existing,
          order_count: existing.order_count + item.quantity,
          total_revenue: existing.total_revenue + (item.price * item.quantity),
        });
      });
    });

    const result: PopularItem[] = Array.from(itemStats.entries())
      .map(([id, stats]) => ({
        id,
        ...stats,
      }))
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, limit);

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error fetching popular items:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get peak hours data
 */
export async function getPeakHours(
  cafeId: string,
  dateRange: DateRangeConfig
): Promise<{ success: boolean; data?: PeakHourData[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (error) throw error;

    // Group by hour and day of week
    const heatmap = new Map<string, number>();

    data?.forEach((order) => {
      const date = new Date(order.created_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}-${hour}`;
      heatmap.set(key, (heatmap.get(key) || 0) + 1);
    });

    const result: PeakHourData[] = Array.from(heatmap.entries()).map(([key, count]) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      return { hour, day_of_week: dayOfWeek, order_count: count };
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error fetching peak hours:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get customer insights
 */
export async function getCustomerInsights(
  cafeId: string,
  dateRange: DateRangeConfig
): Promise<{ success: boolean; data?: CustomerInsight; error?: string }> {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_id, total, created_at')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (ordersError) throw ordersError;

    // Analyze customers
    const customerStats = new Map<string, {
      order_count: number;
      total_spent: number;
      first_order: Date;
      last_order: Date;
    }>();

    orders?.forEach((order) => {
      if (!order.customer_id) return;
      
      const existing = customerStats.get(order.customer_id);
      const orderDate = new Date(order.created_at);

      if (existing) {
        existing.order_count += 1;
        existing.total_spent += order.total;
        if (orderDate < existing.first_order) existing.first_order = orderDate;
        if (orderDate > existing.last_order) existing.last_order = orderDate;
      } else {
        customerStats.set(order.customer_id, {
          order_count: 1,
          total_spent: order.total,
          first_order: orderDate,
          last_order: orderDate,
        });
      }
    });

    // Calculate metrics
    let newCustomers = 0;
    let returningCustomers = 0;
    let totalFrequency = 0;
    let totalSpend = 0;

    customerStats.forEach((stats) => {
      if (stats.order_count === 1) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
      totalFrequency += stats.order_count;
      totalSpend += stats.total_spent;
    });

    const totalCustomers = customerStats.size;
    const avgFrequency = totalCustomers > 0 ? totalFrequency / totalCustomers : 0;
    const avgSpend = totalCustomers > 0 ? totalSpend / totalCustomers : 0;

    // Get top customers
    const topCustomers = Array.from(customerStats.entries())
      .map(([id, stats]) => ({
        id,
        name: `Customer ${id.slice(0, 8)}`, // Placeholder name
        total_orders: stats.order_count,
        total_spent: stats.total_spent,
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);

    return {
      success: true,
      data: {
        new_customers: newCustomers,
        returning_customers: returningCustomers,
        avg_frequency: avgFrequency,
        avg_spend: avgSpend,
        top_customers: topCustomers,
      },
    };
  } catch (error: any) {
    console.error('Error fetching customer insights:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get order trends
 */
export async function getOrderTrends(
  cafeId: string,
  dateRange: DateRangeConfig
): Promise<{ success: boolean; data?: OrderTrend[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (error) throw error;

    // Group by date
    const grouped = new Map<string, number>();

    data?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    const result: OrderTrend[] = Array.from(grouped.entries()).map(([date, count]) => ({
      date,
      order_count: count,
    }));

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error fetching order trends:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get analytics stats with trend comparison
 */
export async function getAnalyticsStats(
  cafeId: string,
  dateRange: DateRangeConfig
): Promise<{ success: boolean; data?: AnalyticsStats; error?: string }> {
  try {
    // Get current period data
    const { data: currentOrders, error: currentError } = await supabase
      .from('orders')
      .select('total, customer_id')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (currentError) throw currentError;

    // Calculate previous period
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    const previousStart = new Date(dateRange.start.getTime() - periodLength);
    const previousEnd = new Date(dateRange.start.getTime() - 1);

    const { data: previousOrders, error: previousError } = await supabase
      .from('orders')
      .select('total')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', previousStart.toISOString())
      .lte('created_at', previousEnd.toISOString());

    if (previousError) throw previousError;

    // Calculate current stats
    const currentRevenue = currentOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
    const currentOrderCount = currentOrders?.length || 0;
    const currentAOV = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const currentCustomers = new Set(currentOrders?.map((o) => o.customer_id).filter(Boolean)).size;

    // Calculate previous stats
    const previousRevenue = previousOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
    const previousOrderCount = previousOrders?.length || 0;

    // Calculate trends
    const revenueTrend = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
    const ordersTrend = previousOrderCount > 0
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
      : 0;

    return {
      success: true,
      data: {
        total_revenue: currentRevenue,
        total_orders: currentOrderCount,
        average_order_value: currentAOV,
        total_customers: currentCustomers,
        revenue_trend: revenueTrend,
        orders_trend: ordersTrend,
      },
    };
  } catch (error: any) {
    console.error('Error fetching analytics stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get order type distribution
 */
export async function getOrderTypeDistribution(
  cafeId: string,
  dateRange: DateRangeConfig
): Promise<{ success: boolean; data?: Array<{ type: string; count: number }>; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('order_type')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (error) throw error;

    const distribution = new Map<string, number>();
    data?.forEach((order) => {
      const type = order.order_type || 'dine_in';
      distribution.set(type, (distribution.get(type) || 0) + 1);
    });

    const result = Array.from(distribution.entries()).map(([type, count]) => ({
      type: type === 'dine_in' ? 'Dine-in' : type === 'pre_order' ? 'Pre-order' : type,
      count,
    }));

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error fetching order type distribution:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export analytics report as CSV
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
