import { supabase } from './supabase';

export interface PreOrder {
  id: string;
  cafe_id: string;
  customer_id: string;
  order_number: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  scheduled_time: string;
  pre_order_status: 'scheduled' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'cancelled';
  payment_status: string;
  notification_sent: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string; // HH:mm format
  label: string; // e.g., "10:00 AM"
  available: boolean;
  popular?: boolean;
  past?: boolean;
}

/**
 * Generate time slots for a specific date
 * 10-minute intervals from 8:00 AM to 10:00 PM
 */
export function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  // Generate slots from 8:00 AM to 10:00 PM (14 hours = 84 slots at 10-min intervals)
  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);

      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const label = slotTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Check if slot is in the past
      const isPast = isToday && slotTime < now;

      // Mark popular slots (lunch and dinner times)
      const isPopular =
        (hour >= 12 && hour <= 13) || // Lunch: 12:00 - 13:59
        (hour >= 18 && hour <= 19); // Dinner: 18:00 - 19:59

      slots.push({
        time: timeStr,
        label,
        available: !isPast,
        popular: isPopular,
        past: isPast,
      });
    }
  }

  return slots;
}

/**
 * Create a pre-order
 */
export async function createPreOrder(params: {
  cafeId: string;
  customerId: string;
  items: any[];
  scheduledTime: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          cafe_id: params.cafeId,
          customer_id: params.customerId,
          items: params.items,
          subtotal: params.subtotal,
          tax: params.tax,
          total: params.total,
          scheduled_time: params.scheduledTime,
          order_type: 'pre_order',
          status: 'received',
          payment_status: 'pending',
          pre_order_status: 'scheduled',
          notification_sent: false,
          notes: params.notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      orderId: data.id,
    };
  } catch (error: any) {
    console.error('Error creating pre-order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create pre-order',
    };
  }
}

/**
 * Get pre-orders for a customer
 */
export async function getPreOrders(
  customerId: string,
  status?: string
): Promise<{ success: boolean; orders?: PreOrder[]; error?: string }> {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('order_type', 'pre_order')
      .order('scheduled_time', { ascending: true });

    if (status) {
      query = query.eq('pre_order_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      orders: data as PreOrder[],
    };
  } catch (error: any) {
    console.error('Error fetching pre-orders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch pre-orders',
    };
  }
}

/**
 * Cancel a pre-order
 */
export async function cancelPreOrder(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        pre_order_status: 'cancelled',
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling pre-order:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel pre-order',
    };
  }
}

/**
 * Update pre-order status
 */
export async function updatePreOrderStatus(
  orderId: string,
  status: 'scheduled' | 'confirmed' | 'preparing' | 'ready' | 'picked_up'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        pre_order_status: status,
        status: status === 'picked_up' ? 'completed' : status === 'preparing' ? 'preparing' : 'received',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating pre-order status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update pre-order status',
    };
  }
}

/**
 * Reschedule a pre-order
 */
export async function reschedulePreOrder(
  orderId: string,
  newScheduledTime: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        scheduled_time: newScheduledTime,
        pre_order_status: 'scheduled',
        notification_sent: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error rescheduling pre-order:', error);
    return {
      success: false,
      error: error.message || 'Failed to reschedule pre-order',
    };
  }
}

/**
 * Mark notification as sent
 */
export async function markNotificationSent(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        notification_sent: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification sent:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark notification sent',
    };
  }
}

/**
 * Get pre-orders for kitchen display
 */
export async function getKitchenPreOrders(
  cafeId: string
): Promise<{ success: boolean; orders?: PreOrder[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('cafe_id', cafeId)
      .eq('order_type', 'pre_order')
      .in('pre_order_status', ['scheduled', 'confirmed', 'preparing', 'ready'])
      .order('scheduled_time', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      orders: data as PreOrder[],
    };
  } catch (error: any) {
    console.error('Error fetching kitchen pre-orders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch kitchen pre-orders',
    };
  }
}

/**
 * Check if pre-order can be cancelled
 * Can cancel if scheduled time is more than 30 minutes away
 */
export function canCancelPreOrder(scheduledTime: string): boolean {
  const scheduled = new Date(scheduledTime);
  const now = new Date();
  const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60);
  return diffMinutes > 30;
}

/**
 * Check if pre-order can be rescheduled
 * Can reschedule if scheduled time is more than 1 hour away
 */
export function canReschedulePreOrder(scheduledTime: string): boolean {
  const scheduled = new Date(scheduledTime);
  const now = new Date();
  const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60);
  return diffMinutes > 60;
}

/**
 * Get countdown to scheduled time
 */
export function getCountdown(scheduledTime: string): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  isPast: boolean;
} {
  const scheduled = new Date(scheduledTime);
  const now = new Date();
  const diff = scheduled.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0, isPast: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const totalMinutes = Math.floor(diff / (1000 * 60));

  return { hours, minutes, seconds, totalMinutes, isPast: false };
}
