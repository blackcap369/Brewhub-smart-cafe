-- Migration: Birthday Marketing Automation
-- Adds birthday tracking, offer configuration, and redemption tracking

-- Add birthday_offer_config to settings table (if not exists)
-- This is handled by the settings table structure already

-- Create birthday_redemptions table for tracking
CREATE TABLE IF NOT EXISTS birthday_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  offer_type TEXT NOT NULL,
  offer_details JSONB,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_birthday_redemptions_customer_id 
ON birthday_redemptions(customer_id);

CREATE INDEX IF NOT EXISTS idx_birthday_redemptions_cafe_id 
ON birthday_redemptions(cafe_id);

CREATE INDEX IF NOT EXISTS idx_birthday_redemptions_redeemed_at 
ON birthday_redemptions(redeemed_at DESC);

-- Enable Row Level Security
ALTER TABLE birthday_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view their own redemptions
CREATE POLICY "Customers can view own birthday redemptions"
  ON birthday_redemptions
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can view all redemptions for their cafe
CREATE POLICY "Staff can view cafe birthday redemptions"
  ON birthday_redemptions
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'staff')
    )
  );

-- System can insert redemptions (via service role)
CREATE POLICY "System can insert birthday redemptions"
  ON birthday_redemptions
  FOR INSERT
  WITH CHECK (true);

-- Function to get birthday customers for a date range
CREATE OR REPLACE FUNCTION get_birthday_customers(
  cafe_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  dob DATE,
  total_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.phone,
    u.email,
    u.dob,
    COUNT(o.id) AS total_orders
  FROM users u
  LEFT JOIN orders o ON o.customer_id = u.id AND o.status != 'cancelled'
  WHERE u.cafe_id = cafe_uuid
    AND u.role = 'customer'
    AND u.dob IS NOT NULL
    AND (
      -- Match month and day only (ignore year)
      (EXTRACT(MONTH FROM u.dob) BETWEEN EXTRACT(MONTH FROM start_date) AND EXTRACT(MONTH FROM end_date))
      AND (
        (EXTRACT(MONTH FROM u.dob) = EXTRACT(MONTH FROM start_date) AND EXTRACT(DAY FROM u.dob) >= EXTRACT(DAY FROM start_date))
        OR (EXTRACT(MONTH FROM u.dob) = EXTRACT(MONTH FROM end_date) AND EXTRACT(DAY FROM u.dob) <= EXTRACT(DAY FROM end_date))
        OR (EXTRACT(MONTH FROM u.dob) > EXTRACT(MONTH FROM start_date) AND EXTRACT(MONTH FROM u.dob) < EXTRACT(MONTH FROM end_date))
      )
    )
  GROUP BY u.id, u.name, u.phone, u.email, u.dob
  ORDER BY EXTRACT(MONTH FROM u.dob), EXTRACT(DAY FROM u.dob);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track birthday redemption
CREATE OR REPLACE FUNCTION track_birthday_redemption(
  p_customer_id UUID,
  p_cafe_id UUID,
  p_order_id UUID,
  p_offer_type TEXT,
  p_offer_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_redemption_id UUID;
BEGIN
  INSERT INTO birthday_redemptions (
    customer_id,
    cafe_id,
    order_id,
    offer_type,
    offer_details
  ) VALUES (
    p_customer_id,
    p_cafe_id,
    p_order_id,
    p_offer_type,
    p_offer_details
  ) RETURNING id INTO v_redemption_id;

  -- Also log in activity_log
  INSERT INTO activity_log (
    cafe_id,
    user_id,
    action,
    details
  ) VALUES (
    p_cafe_id,
    p_customer_id,
    'birthday_redemption',
    jsonb_build_object(
      'redemption_id', v_redemption_id,
      'order_id', p_order_id,
      'offer_type', p_offer_type,
      'offer_details', p_offer_details
    )
  );

  RETURN v_redemption_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get birthday statistics
CREATE OR REPLACE FUNCTION get_birthday_stats(cafe_uuid UUID)
RETURNS TABLE (
  total_customers_with_dob BIGINT,
  birthdays_this_month BIGINT,
  birthdays_this_week BIGINT,
  redemptions_this_year BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM users WHERE cafe_id = cafe_uuid AND role = 'customer' AND dob IS NOT NULL) AS total_customers_with_dob,
    (SELECT COUNT(*) FROM users WHERE cafe_id = cafe_uuid AND role = 'customer' AND dob IS NOT NULL 
     AND EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)) AS birthdays_this_month,
    (SELECT COUNT(*) FROM get_birthday_customers(cafe_uuid, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')) AS birthdays_this_week,
    (SELECT COUNT(*) FROM birthday_redemptions WHERE cafe_id = cafe_uuid AND EXTRACT(YEAR FROM redeemed_at) = EXTRACT(YEAR FROM CURRENT_DATE)) AS redemptions_this_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE birthday_redemptions IS 'Tracks birthday offer redemptions by customers';
COMMENT ON COLUMN birthday_redemptions.offer_type IS 'Type of offer: free_item or discount';
COMMENT ON COLUMN birthday_redemptions.offer_details IS 'JSON details of the offer (item_name, discount_percentage, etc.)';

-- Insert default birthday offer config for existing cafes
INSERT INTO settings (cafe_id, key, value, description)
SELECT 
  id,
  'birthday_offer',
  '{"type": "free_item", "item_name": "Free Dessert", "valid_hours": 24}'::jsonb,
  'Birthday offer configuration'
FROM cafes
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE cafe_id = cafes.id AND key = 'birthday_offer'
);
