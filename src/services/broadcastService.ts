import { supabase } from './supabase';

export type AudienceSegment = 
  | 'all' 
  | 'today_customers' 
  | 'week_customers' 
  | 'loyalty_members' 
  | 'birthday_this_week'
  | 'inactive_30_days';

export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface Broadcast {
  id: string;
  cafe_id: string;
  title: string;
  message: string;
  audience: AudienceSegment;
  audience_count: number;
  status: BroadcastStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BroadcastNotification {
  id: string;
  broadcast_id: string;
  customer_id: string;
  channel: 'push' | 'in_app' | 'sms';
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  error_message: string | null;
}

export interface BroadcastTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  icon: string;
}

export const BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  {
    id: 'happy_hour',
    name: 'Happy Hour',
    title: 'Happy Hour! 🎉',
    message: 'Enjoy 20% off on all beverages today! Visit us now and refresh your day.',
    icon: '🎉',
  },
  {
    id: 'new_items',
    name: 'New Menu Items',
    title: 'New Items Added! 🍕',
    message: 'Check out our exciting new menu items! Fresh flavors waiting for you.',
    icon: '🍕',
  },
  {
    id: 'birthday',
    name: 'Birthday Special',
    title: 'Happy Birthday! 🎂',
    message: 'It\'s your special day! Enjoy a FREE dessert on us. Celebrate with us!',
    icon: '🎂',
  },
  {
    id: 'loyalty_reward',
    name: 'Loyalty Reward',
    title: 'You\'ve Earned a Reward! 🎁',
    message: 'Congratulations! You\'ve earned a free item. Claim it on your next visit!',
    icon: '🎁',
  },
  {
    id: 'we_miss_you',
    name: 'We Miss You',
    title: 'We Miss You! 💝',
    message: 'It\'s been a while! Come back and enjoy 15% off your next order.',
    icon: '💝',
  },
];

/**
 * Create a new broadcast
 */
export async function createBroadcast(params: {
  cafeId: string;
  title: string;
  message: string;
  audience: AudienceSegment;
  scheduledAt?: string;
  createdBy: string;
}): Promise<{ success: boolean; broadcast?: Broadcast; error?: string }> {
  try {
    // Get audience count
    const audienceCount = await getAudienceCount(params.cafeId, params.audience);

    const status: BroadcastStatus = params.scheduledAt ? 'scheduled' : 'draft';

    const { data, error } = await supabase
      .from('broadcasts')
      .insert([{
        cafe_id: params.cafeId,
        title: params.title,
        message: params.message,
        target_audience: params.audience,
        audience_count: audienceCount,
        status,
        scheduled_at: params.scheduledAt || null,
        created_by: params.createdBy,
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, broadcast: data };
  } catch (error: any) {
    console.error('Error creating broadcast:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all broadcasts for a cafe
 */
export async function getBroadcasts(
  cafeId: string,
  status?: BroadcastStatus
): Promise<{ success: boolean; broadcasts?: Broadcast[]; error?: string }> {
  try {
    let query = supabase
      .from('broadcasts')
      .select('*')
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, broadcasts: data };
  } catch (error: any) {
    console.error('Error fetching broadcasts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get single broadcast by ID
 */
export async function getBroadcast(
  broadcastId: string
): Promise<{ success: boolean; broadcast?: Broadcast; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (error) throw error;

    return { success: true, broadcast: data };
  } catch (error: any) {
    console.error('Error fetching broadcast:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a broadcast immediately
 */
export async function sendBroadcast(
  broadcastId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update status to sending
    await supabase
      .from('broadcasts')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', broadcastId);

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (broadcastError || !broadcast) throw new Error('Broadcast not found');

    // Get target customers
    const customers = await getAudienceCustomers(broadcast.cafe_id, broadcast.target_audience as AudienceSegment);

    // Send notifications
    let sentCount = 0;
    let deliveredCount = 0;

    for (const customer of customers) {
      try {
        // Try push notification first
        const pushResult = await sendPushNotification(customer.id, broadcast.title, broadcast.message, broadcast.cafe_id);
        
        if (pushResult.success) {
          deliveredCount++;
        }

        // Create notification record
        await supabase.from('broadcast_notifications').insert([{
          broadcast_id: broadcastId,
          customer_id: customer.id,
          channel: 'push',
          status: pushResult.success ? 'delivered' : 'failed',
          sent_at: new Date().toISOString(),
          delivered_at: pushResult.success ? new Date().toISOString() : null,
          error_message: pushResult.error || null,
        }]);

        sentCount++;
      } catch (err) {
        console.error('Error sending to customer:', customer.id, err);
      }
    }

    // Update broadcast stats
    await supabase
      .from('broadcasts')
      .update({
        status: 'sent',
        sent_count: sentCount,
        delivered_count: deliveredCount,
      })
      .eq('id', broadcastId);

    return { success: true };
  } catch (error: any) {
    console.error('Error sending broadcast:', error);
    
    // Update status to failed
    await supabase
      .from('broadcasts')
      .update({ status: 'failed' })
      .eq('id', broadcastId);

    return { success: false, error: error.message };
  }
}

/**
 * Get broadcast stats
 */
export async function getBroadcastStats(
  broadcastId: string
): Promise<{ success: boolean; stats?: { sent: number; delivered: number; opened: number }; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('sent_count, delivered_count, opened_count')
      .eq('id', broadcastId)
      .single();

    if (error) throw error;

    return {
      success: true,
      stats: {
        sent: data.sent_count,
        delivered: data.delivered_count,
        opened: data.opened_count,
      },
    };
  } catch (error: any) {
    console.error('Error fetching broadcast stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get audience count for a segment
 */
export async function getAudienceCount(
  cafeId: string,
  audience: AudienceSegment
): Promise<number> {
  const customers = await getAudienceCustomers(cafeId, audience);
  return customers.length;
}

/**
 * Get customers for an audience segment
 */
async function getAudienceCustomers(
  cafeId: string,
  audience: AudienceSegment
): Promise<Array<{ id: string; phone?: string; name?: string }>> {
  const now = new Date();
  let query = supabase
    .from('users')
    .select('id, phone, name')
    .eq('cafe_id', cafeId)
    .eq('role', 'customer')
    .eq('is_active', true);

  switch (audience) {
    case 'today_customers':
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('cafe_id', cafeId)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .neq('status', 'cancelled');
      
      const todayCustomerIds = [...new Set(todayOrders?.map(o => o.customer_id).filter(Boolean))];
      query = query.in('id', todayCustomerIds);
      break;

    case 'week_customers':
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      
      const { data: weekOrders } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('cafe_id', cafeId)
        .gte('created_at', weekStart.toISOString())
        .neq('status', 'cancelled');
      
      const weekCustomerIds = [...new Set(weekOrders?.map(o => o.customer_id).filter(Boolean))];
      query = query.in('id', weekCustomerIds);
      break;

    case 'loyalty_members':
      const { data: loyaltyMembers } = await supabase
        .from('loyalty_points')
        .select('customer_id')
        .eq('cafe_id', cafeId)
        .gt('points', 0);
      
      const loyaltyIds = loyaltyMembers?.map(l => l.customer_id) || [];
      query = query.in('id', loyaltyIds);
      break;

    case 'birthday_this_week':
      const birthdayStart = new Date(now);
      birthdayStart.setHours(0, 0, 0, 0);
      const birthdayEnd = new Date(now);
      birthdayEnd.setDate(birthdayEnd.getDate() + 7);
      
      query = query.gte('dob', birthdayStart.toISOString()).lte('dob', birthdayEnd.toISOString());
      break;

    case 'inactive_30_days':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('cafe_id', cafeId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .neq('status', 'cancelled');
      
      const activeCustomerIds = [...new Set(activeOrders?.map(o => o.customer_id).filter(Boolean))];
      
      // Get all customers and exclude active ones
      const { data: allCustomers } = await supabase
        .from('users')
        .select('id')
        .eq('cafe_id', cafeId)
        .eq('role', 'customer')
        .eq('is_active', true);
      
      const inactiveIds = allCustomers
        ?.map(c => c.id)
        .filter(id => !activeCustomerIds.includes(id)) || [];
      
      query = query.in('id', inactiveIds);
      break;

    case 'all':
    default:
      // No additional filtering needed
      break;
  }

  const { data } = await query;
  return data || [];
}

/**
 * Send push notification via Firebase Cloud Messaging
 */
async function sendPushNotification(
  customerId: string,
  title: string,
  body: string,
  cafeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get customer's FCM token
    const { data: customer } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('id', customerId)
      .single();

    if (!customer?.fcm_token) {
      return { success: false, error: 'No FCM token found' };
    }

    // In production, this would call Firebase Admin SDK
    // For now, we'll simulate the call
    console.log('Sending push notification to:', customerId, { title, body, cafeId });

    // Simulate API call to FCM
    // const response = await fetch('https://fcm.googleapis.com/fcm/send', { ... });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update broadcast
 */
export async function updateBroadcast(
  broadcastId: string,
  updates: Partial<Broadcast>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('broadcasts')
      .update(updates)
      .eq('id', broadcastId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating broadcast:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete broadcast
 */
export async function deleteBroadcast(
  broadcastId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('id', broadcastId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting broadcast:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Resend a broadcast
 */
export async function resendBroadcast(
  broadcastId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Reset stats
    await supabase
      .from('broadcasts')
      .update({
        status: 'draft',
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        sent_at: null,
      })
      .eq('id', broadcastId);

    // Delete old notifications
    await supabase
      .from('broadcast_notifications')
      .delete()
      .eq('broadcast_id', broadcastId);

    // Send again
    return await sendBroadcast(broadcastId);
  } catch (error: any) {
    console.error('Error resending broadcast:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark notification as opened
 */
export async function markNotificationOpened(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update notification
    await supabase
      .from('broadcast_notifications')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    // Get broadcast ID
    const { data: notification } = await supabase
      .from('broadcast_notifications')
      .select('broadcast_id')
      .eq('id', notificationId)
      .single();

    if (notification) {
      // Increment opened count
      await supabase.rpc('increment_broadcast_opened', { broadcast_id: notification.broadcast_id });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification opened:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get audience segment label
 */
export function getAudienceLabel(audience: AudienceSegment): string {
  const labels: Record<AudienceSegment, string> = {
    all: 'All Customers',
    today_customers: 'Today\'s Customers',
    week_customers: 'This Week\'s Customers',
    loyalty_members: 'Loyalty Members',
    birthday_this_week: 'Birthday This Week',
    inactive_30_days: 'Inactive (30+ days)',
  };
  return labels[audience];
}

/**
 * Get status color
 */
export function getStatusColor(status: BroadcastStatus): string {
  const colors: Record<BroadcastStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-amber-100 text-amber-700',
    sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return colors[status];
}
