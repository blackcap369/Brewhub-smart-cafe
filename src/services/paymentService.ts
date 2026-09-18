import { supabase } from './supabase';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    contact: string;
    email?: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  status: string;
  created_at: string;
}

/**
 * Load Razorpay checkout script dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Create Razorpay order via Supabase Edge Function
 */
export async function createPaymentOrder(
  orderId: string,
  amount: number
): Promise<{ success: boolean; order?: RazorpayOrder; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { orderId, amount },
    });

    if (error) throw error;

    return {
      success: true,
      order: data.order,
    };
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment order',
    };
  }
}

/**
 * Verify Razorpay payment signature via Supabase Edge Function
 */
export async function verifyPayment(
  paymentResponse: RazorpayResponse
): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: paymentResponse,
    });

    if (error) throw error;

    return {
      success: true,
      payment: data.payment,
    };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify payment',
    };
  }
}

/**
 * Initiate Razorpay payment
 */
export async function initiatePayment(options: {
  orderId: string;
  amount: number;
  cafeName: string;
  customerPhone: string;
  customerEmail?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    // Create Razorpay order
    const orderResult = await createPaymentOrder(options.orderId, options.amount);
    if (!orderResult.success || !orderResult.order) {
      throw new Error(orderResult.error || 'Failed to create order');
    }

    // Configure Razorpay checkout
    const razorpayOptions: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderResult.order.amount,
      currency: orderResult.order.currency,
      name: options.cafeName,
      description: `Order #${options.orderId.slice(-8)}`,
      order_id: orderResult.order.id,
      handler: async (response: RazorpayResponse) => {
        // Verify payment
        const verifyResult = await verifyPayment(response);
        if (verifyResult.success) {
          // Payment successful - dispatch custom event
          window.dispatchEvent(
            new CustomEvent('payment-success', {
              detail: { orderId: options.orderId, payment: verifyResult.payment },
            })
          );
        } else {
          // Payment verification failed
          window.dispatchEvent(
            new CustomEvent('payment-failure', {
              detail: { orderId: options.orderId, error: verifyResult.error },
            })
          );
        }
      },
      prefill: {
        contact: options.customerPhone,
        email: options.customerEmail,
      },
      theme: {
        color: '#ef4444', // Primary red color
      },
      modal: {
        ondismiss: () => {
          // User closed payment modal
          window.dispatchEvent(
            new CustomEvent('payment-cancelled', {
              detail: { orderId: options.orderId },
            })
          );
        },
      },
    };

    // Open Razorpay checkout
    const rzp = new (window as any).Razorpay(razorpayOptions);
    rzp.open();

    return { success: true };
  } catch (error: any) {
    console.error('Error initiating payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment',
    };
  }
}

/**
 * Mark order as cash payment
 */
export async function markAsCashPayment(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'pending',
        payment_method: 'cash',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error marking as cash payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark as cash payment',
    };
  }
}

/**
 * Mark cash payment as received (admin only)
 */
export async function markCashPaymentReceived(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error marking cash payment received:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark payment received',
    };
  }
}

/**
 * Get payment history for a customer
 */
export async function getPaymentHistory(
  customerId: string
): Promise<{ success: boolean; payments?: PaymentRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      payments: data,
    };
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payment history',
    };
  }
}

/**
 * Get payment details for an order
 */
export async function getPaymentByOrderId(
  orderId: string
): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) throw error;

    return {
      success: true,
      payment: data,
    };
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payment',
    };
  }
}
