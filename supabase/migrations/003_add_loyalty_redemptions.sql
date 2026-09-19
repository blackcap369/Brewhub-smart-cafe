-- Migration: Add loyalty redemptions table
-- This table tracks when customers redeem their loyalty rewards

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_customer ON loyalty_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_cafe ON loyalty_redemptions(cafe_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_redeemed_at ON loyalty_redemptions(redeemed_at DESC);

-- Enable Row Level Security
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view their own redemptions
CREATE POLICY "Customers can view own redemptions"
  ON loyalty_redemptions
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can view all redemptions for their cafe
CREATE POLICY "Staff can view cafe redemptions"
  ON loyalty_redemptions
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'staff')
    )
  );

-- System can insert redemptions (via service role)
CREATE POLICY "System can insert redemptions"
  ON loyalty_redemptions
  FOR INSERT
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_loyalty_redemptions_updated_at
  BEFORE UPDATE ON loyalty_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE loyalty_redemptions IS 'Tracks loyalty reward redemptions by customers';
COMMENT ON COLUMN loyalty_redemptions.items IS 'JSON array of item IDs or names that were redeemed';
COMMENT ON COLUMN loyalty_redemptions.order_id IS 'Optional link to the order where reward was applied';
