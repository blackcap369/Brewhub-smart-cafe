-- Migration: Add pre-order fields to orders table
-- Adds pre_order_status and notification_sent columns for pre-order functionality

-- Add pre_order_status column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pre_order_status TEXT 
CHECK (pre_order_status IN ('scheduled', 'confirmed', 'preparing', 'ready', 'picked_up', 'cancelled'))
DEFAULT 'scheduled';

-- Add notification_sent column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

-- Add cancellation_reason column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add cancelled_at column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create index for pre-order queries
CREATE INDEX IF NOT EXISTS idx_orders_pre_order_status 
ON orders(pre_order_status) 
WHERE order_type = 'pre_order';

-- Create index for scheduled time queries
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_time 
ON orders(scheduled_time) 
WHERE order_type = 'pre_order' AND pre_order_status NOT IN ('cancelled', 'picked_up');

-- Create index for notification queries
CREATE INDEX IF NOT EXISTS idx_orders_notification_sent 
ON orders(notification_sent, scheduled_time) 
WHERE order_type = 'pre_order' 
AND pre_order_status IN ('scheduled', 'confirmed') 
AND notification_sent = FALSE;

-- Add comments
COMMENT ON COLUMN orders.pre_order_status IS 'Status of pre-order: scheduled, confirmed, preparing, ready, picked_up, cancelled';
COMMENT ON COLUMN orders.notification_sent IS 'Whether notification has been sent for this pre-order';
COMMENT ON COLUMN orders.cancellation_reason IS 'Reason for order cancellation';
COMMENT ON COLUMN orders.cancelled_at IS 'Timestamp when order was cancelled';

-- Create function to get upcoming pre-orders for notifications
CREATE OR REPLACE FUNCTION get_upcoming_preorders()
RETURNS TABLE (
  id UUID,
  cafe_id UUID,
  customer_id UUID,
  scheduled_time TIMESTAMPTZ,
  pre_order_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.cafe_id,
    o.customer_id,
    o.scheduled_time,
    o.pre_order_status
  FROM orders o
  WHERE o.order_type = 'pre_order'
    AND o.pre_order_status IN ('scheduled', 'confirmed')
    AND o.notification_sent = FALSE
    AND o.scheduled_time BETWEEN NOW() AND NOW() + INTERVAL '20 minutes'
  ORDER BY o.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get kitchen pre-orders
CREATE OR REPLACE FUNCTION get_kitchen_preorders(cafe_uuid UUID)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  customer_id UUID,
  items JSONB,
  scheduled_time TIMESTAMPTZ,
  pre_order_status TEXT,
  total DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    o.items,
    o.scheduled_time,
    o.pre_order_status,
    o.total
  FROM orders o
  WHERE o.cafe_id = cafe_uuid
    AND o.order_type = 'pre_order'
    AND o.pre_order_status IN ('scheduled', 'confirmed', 'preparing', 'ready')
  ORDER BY o.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
