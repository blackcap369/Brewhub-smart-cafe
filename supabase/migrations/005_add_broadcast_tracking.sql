-- Migration: Enhance broadcasts table and add broadcast_notifications
-- Adds tracking fields and notification delivery records

-- Add new columns to broadcasts table
ALTER TABLE broadcasts 
ADD COLUMN IF NOT EXISTS audience_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create broadcast_notifications table for per-customer tracking
CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'in_app', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_broadcast_id 
ON broadcast_notifications(broadcast_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_customer_id 
ON broadcast_notifications(customer_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_status 
ON broadcast_notifications(status);

CREATE INDEX IF NOT EXISTS idx_broadcasts_status 
ON broadcasts(status);

CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled_at 
ON broadcasts(scheduled_at) 
WHERE status = 'scheduled';

-- Enable Row Level Security
ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broadcast_notifications
-- Customers can view their own notifications
CREATE POLICY "Customers can view own notifications"
  ON broadcast_notifications
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can view notifications for their cafe
CREATE POLICY "Staff can view cafe notifications"
  ON broadcast_notifications
  FOR SELECT
  USING (
    broadcast_id IN (
      SELECT id FROM broadcasts
      WHERE cafe_id IN (
        SELECT cafe_id FROM users
        WHERE auth_user_id = auth.uid()
        AND role IN ('owner', 'staff')
      )
    )
  );

-- System can insert notifications (via service role)
CREATE POLICY "System can insert notifications"
  ON broadcast_notifications
  FOR INSERT
  WITH CHECK (true);

-- System can update notifications (via service role)
CREATE POLICY "System can update notifications"
  ON broadcast_notifications
  FOR UPDATE
  USING (true);

-- Function to increment broadcast opened count
CREATE OR REPLACE FUNCTION increment_broadcast_opened(broadcast_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE broadcasts
  SET opened_count = opened_count + 1,
      updated_at = NOW()
  WHERE id = broadcast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get broadcast stats
CREATE OR REPLACE FUNCTION get_broadcast_stats(broadcast_id UUID)
RETURNS TABLE (
  sent_count INTEGER,
  delivered_count INTEGER,
  opened_count INTEGER,
  delivery_rate DECIMAL,
  open_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.sent_count,
    b.delivered_count,
    b.opened_count,
    CASE 
      WHEN b.sent_count > 0 THEN (b.delivered_count::DECIMAL / b.sent_count) * 100
      ELSE 0
    END AS delivery_rate,
    CASE 
      WHEN b.delivered_count > 0 THEN (b.opened_count::DECIMAL / b.delivered_count) * 100
      ELSE 0
    END AS open_rate
  FROM broadcasts b
  WHERE b.id = broadcast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE broadcast_notifications IS 'Tracks individual notification delivery for each broadcast';
COMMENT ON COLUMN broadcast_notifications.channel IS 'Notification channel: push, in_app, or sms';
COMMENT ON COLUMN broadcast_notifications.status IS 'Delivery status: pending, sent, delivered, opened, failed';

COMMENT ON COLUMN broadcasts.audience_count IS 'Total number of recipients in the audience segment';
COMMENT ON COLUMN broadcasts.sent_count IS 'Number of notifications successfully sent';
COMMENT ON COLUMN broadcasts.delivered_count IS 'Number of notifications successfully delivered';
COMMENT ON COLUMN broadcasts.opened_count IS 'Number of notifications opened by recipients';
