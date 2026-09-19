// Supabase Edge Function: create-razorpay-order
// Location: supabase/functions/create-razorpay-order/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface CreateOrderRequest {
  orderId: string;
  amount: number;
}

serve(async (req) => {
  try {
    // Validate environment variables
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    // Parse request body
    const { orderId, amount }: CreateOrderRequest = await req.json();

    if (!orderId || !amount) {
      throw new Error('Missing required fields: orderId, amount');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify order exists and belongs to authenticated user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Create Razorpay order
    const razorpayOrder = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${orderId.slice(-8)}`,
        notes: {
          order_id: orderId,
          customer_id: order.customer_id,
        },
      }),
    });

    if (!razorpayOrder.ok) {
      const errorData = await razorpayOrder.json();
      throw new Error(errorData.error?.description || 'Failed to create Razorpay order');
    }

    const razorpayData = await razorpayOrder.json();

    // Store Razorpay order ID in payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        customer_id: order.customer_id,
        amount: amount,
        method: 'razorpay',
        razorpay_order_id: razorpayData.id,
        status: 'pending',
      });

    if (paymentError) {
      console.error('Error storing payment record:', paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: razorpayData.id,
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          receipt: razorpayData.receipt,
          status: razorpayData.status,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-razorpay-order:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
