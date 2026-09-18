import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Sets the current cafe context for RLS tenant isolation.
 * Must be called before making any queries that require tenant context.
 * 
 * @param cafeId - The UUID of the cafe to set as active
 * @returns Promise<boolean> - true if context was set successfully
 */
export async function setCafeContext(cafeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('set_cafe_context', {
    cafe_id: cafeId,
  });

  if (error) {
    console.error('Failed to set cafe context:', error);
    throw error;
  }

  return data as boolean;
}

/**
 * Gets the current cafe info based on session context.
 * @returns Current cafe details or null
 */
export async function getCurrentCafeInfo() {
  const { data, error } = await supabase.rpc('get_current_cafe_info');

  if (error) {
    console.error('Failed to get cafe info:', error);
    return null;
  }

  return data;
}

/**
 * Gets the current user's role in the active cafe.
 * @returns 'owner' | 'staff' | 'customer' | null
 */
export async function getUserRole(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_user_role');

  if (error) {
    console.error('Failed to get user role:', error);
    return null;
  }

  return data as string | null;
}

/**
 * Creates a new order with items atomically.
 */
export async function createOrder(params: {
  cafeId: string;
  tableNo?: number;
  customerId?: string;
  items: Array<{ menu_item_id: string; quantity: number; notes?: string }>;
  orderType?: 'dine_in' | 'pre_order';
  notes?: string;
  scheduledTime?: string;
}) {
  const { data, error } = await supabase.rpc('create_order', {
    p_cafe_id: params.cafeId,
    p_table_no: params.tableNo ?? null,
    p_customer_id: params.customerId ?? null,
    p_items: JSON.stringify(params.items),
    p_order_type: params.orderType ?? 'dine_in',
    p_notes: params.notes ?? null,
    p_scheduled_time: params.scheduledTime ?? null,
  });

  if (error) {
    console.error('Failed to create order:', error);
    throw error;
  }

  return data as string; // Returns order UUID
}

/**
 * Updates an order's status with validation.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
  });

  if (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }

  return data as boolean;
}

/**
 * Processes a payment for an order.
 */
export async function processPayment(params: {
  orderId: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'razorpay' | 'wallet' | 'other';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}) {
  const { data, error } = await supabase.rpc('process_payment', {
    p_order_id: params.orderId,
    p_amount: params.amount,
    p_method: params.method,
    p_razorpay_order_id: params.razorpayOrderId ?? null,
    p_razorpay_payment_id: params.razorpayPaymentId ?? null,
    p_razorpay_signature: params.razorpaySignature ?? null,
  });

  if (error) {
    console.error('Failed to process payment:', error);
    throw error;
  }

  return data as string; // Returns payment UUID
}

/**
 * Submits feedback for an order.
 */
export async function submitFeedback(params: {
  orderId: string;
  rating: number;
  comment?: string;
  foodRating?: number;
  serviceRating?: number;
  ambianceRating?: number;
  isAnonymous?: boolean;
}) {
  const { data, error } = await supabase.rpc('submit_feedback', {
    p_order_id: params.orderId,
    p_rating: params.rating,
    p_comment: params.comment ?? null,
    p_food_rating: params.foodRating ?? null,
    p_service_rating: params.serviceRating ?? null,
    p_ambiance_rating: params.ambianceRating ?? null,
    p_is_anonymous: params.isAnonymous ?? false,
  });

  if (error) {
    console.error('Failed to submit feedback:', error);
    throw error;
  }

  return data as string; // Returns feedback UUID
}

/**
 * Gets dashboard statistics for the current cafe.
 */
export async function getDashboardStats() {
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    console.error('Failed to get dashboard stats:', error);
    return null;
  }

  return data;
}

export default supabase;
