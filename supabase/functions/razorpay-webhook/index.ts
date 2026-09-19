// Supabase Edge Function: razorpay-webhook
// Location: supabase/functions/razorpay-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    // Validate webhook signature
    const webhookSignature = req.headers.get('x-razorpay-signature');
    if (!webhookSignature) {
      throw new Error('Missing webhook signature');
    }

    const requestBody = await req.text();
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET!)
      .update(requestBody)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    // Parse webhook payload
    const webhook = JSON.parse(requestBody);
    const { event, payload } = webhook;

    console.log('Webhook event:', event);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        // Find payment record by Razorpay order ID
        const { data: paymentRecord } = await supabase
          .from('payments')
          .select('*')
          .eq('razorpay_order_id', payment.order_id)
          .single();

        if (paymentRecord) {
          // Update payment record
          await supabase
            .from('payments')
            .update({
              razorpay_payment_id: payment.id,
              status: 'captured',
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentRecord.id);

          // Update order payment status
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentRecord.order_id);

          // Trigger customer notification (optional)
          // await sendNotification(paymentRecord.customer_id, 'payment_success');
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        // Find payment record
        const { data: paymentRecord } = await supabase
          .from('payments')
          .select('*')
          .eq('razorpay_order_id', payment.order_id)
          .single();

        if (paymentRecord) {
          // Update payment record
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentRecord.id);

          // Update order payment status
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentRecord.order_id);

          // Trigger customer notification (optional)
          // await sendNotification(paymentRecord.customer_id, 'payment_failed');
        }
        break;
      }

      case 'order.paid': {
        const order = payload.order?.entity;
        if (!order) break;

        console.log('Order paid:', order.id);
        // Additional logic if needed
        break;
      }

      default:
        console.log('Unhandled webhook event:', event);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in razorpay-webhook:', error);
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
