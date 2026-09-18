import { supabase } from './supabase';
import type { Database } from '../types/database';
import type { CartItem } from '../stores/cartStore';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderItem = Database['public']['Tables']['order_items']['Insert'];

export interface CreateOrderParams {
  cafeId: string;
  tableNo: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType?: 'dine_in' | 'pre_order';
  customerId?: string;
  notes?: string;
}

export interface OrderWithItems extends Order {
  order_items?: Array<{
    id: string;
    menu_item_id: string;
    quantity: number;
    price: number;
    notes: string | null;
    menu_items: {
      id: string;
      name: string;
      image_url: string | null;
      is_veg: boolean;
      is_spicy: boolean;
    };
  }>;
}

/**
 * Create a new order with items
 */
export async function createOrder(params: CreateOrderParams): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    // Prepare order items as JSONB
    const orderItems = params.items.map((item) => ({
      menu_item_id: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes || null,
      is_veg: item.isVeg,
      is_spicy: item.isSpicy,
    }));

    // Create order
    const orderData: OrderInsert = {
      cafe_id: params.cafeId,
      table_no: params.tableNo,
      customer_id: params.customerId || null,
      items: orderItems as any, // JSONB field
      subtotal: params.subtotal,
      tax: params.tax,
      total: params.total,
      status: 'received',
      payment_status: 'pending',
      order_type: params.orderType || 'dine_in',
      notes: params.notes || null,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) throw orderError;

    return {
      success: true,
      orderId: order.id,
    };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create order',
    };
  }
}

/**
 * Get orders for a cafe
 */
export async function getOrders(
  cafeId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  orders?: OrderWithItems[];
  error?: string;
}> {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          price,
          notes,
          menu_items (
            id,
            name,
            image_url,
            is_veg,
            is_spicy
          )
        )
      `)
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      orders: data as OrderWithItems[],
    };
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch orders',
    };
  }
}

/**
 * Get a single order by ID
 */
export async function getOrder(
  orderId: string
): Promise<{
  success: boolean;
  order?: OrderWithItems;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          price,
          notes,
          menu_items (
            id,
            name,
            image_url,
            is_veg,
            is_spicy
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return {
      success: true,
      order: data as OrderWithItems,
    };
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch order',
    };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set completed_at when order is served
    if (status === 'served') {
      updateData.completed_at = new Date().toISOString();
    }

    // Set cancelled_at when order is cancelled
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update order status',
    };
  }
}

/**
 * Subscribe to order status changes via Supabase Realtime
 */
export function subscribeToOrderStatus(
  orderId: string,
  callback: (status: string) => void
): () => void {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        const newStatus = payload.new.status as string;
        callback(newStatus);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all orders for a cafe (for kitchen display)
 */
export function subscribeToCafeOrders(
  cafeId: string,
  callback: (orders: Order[]) => void
): () => void {
  const channel = supabase
    .channel(`cafe-orders-${cafeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `cafe_id=eq.${cafeId}`,
      },
      async () => {
        // Refetch orders when any change occurs
        const result = await getOrders(cafeId);
        if (result.success && result.orders) {
          callback(result.orders);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  paymentMethod?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentMethod) {
      updateData.payment_method = paymentMethod;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment status',
    };
  }
}
