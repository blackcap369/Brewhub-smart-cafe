-- Migration: Add inventory management system
-- Creates ingredients, recipes, and transaction tracking

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'boxes')),
  quantity DECIMAL(10,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity DECIMAL(10,3) NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost_per_unit >= 0),
  supplier TEXT,
  last_restocked TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cafe_id, name)
);

-- Create recipe_ingredients table (maps menu items to ingredients)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10,3) NOT NULL CHECK (quantity_required > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, ingredient_id)
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'waste')),
  quantity DECIMAL(10,3) NOT NULL,
  reason TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiry')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingredients_cafe_id ON ingredients(cafe_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(cafe_id, category);
CREATE INDEX IF NOT EXISTS idx_ingredients_quantity ON ingredients(cafe_id, quantity);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_menu_item ON recipe_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cafe_date ON inventory_transactions(cafe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ingredient ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_alerts_cafe_unread ON inventory_alerts(cafe_id, is_read);

-- Enable Row Level Security
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ingredients
CREATE POLICY "Staff can view cafe ingredients"
  ON ingredients
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Owners/Managers can manage ingredients"
  ON ingredients
  FOR ALL
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- RLS Policies for recipe_ingredients
CREATE POLICY "Staff can view recipes"
  ON recipe_ingredients
  FOR SELECT
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items
      WHERE cafe_id IN (
        SELECT cafe_id FROM users
        WHERE auth_user_id = auth.uid()
        AND role IN ('owner', 'manager', 'staff')
      )
    )
  );

CREATE POLICY "Owners/Managers can manage recipes"
  ON recipe_ingredients
  FOR ALL
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items
      WHERE cafe_id IN (
        SELECT cafe_id FROM users
        WHERE auth_user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Staff can view transactions"
  ON inventory_transactions
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "System can insert transactions"
  ON inventory_transactions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for alerts
CREATE POLICY "Staff can view cafe alerts"
  ON inventory_alerts
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "System can manage alerts"
  ON inventory_alerts
  FOR ALL
  USING (true);

-- Function to deduct ingredients for an order
CREATE OR REPLACE FUNCTION deduct_ingredients_for_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_cafe_id UUID;
  v_items JSONB;
  v_item JSONB;
  v_menu_item_id UUID;
  v_quantity INTEGER;
  v_recipe RECORD;
  v_ingredient RECORD;
  v_new_quantity DECIMAL(10,3);
  v_can_deduct BOOLEAN := true;
BEGIN
  -- Get order details
  SELECT cafe_id, items INTO v_cafe_id, v_items
  FROM orders
  WHERE id = p_order_id;
  
  IF v_items IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if all ingredients are available
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_menu_item_id := (v_item->>'menu_item_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Get recipe for this menu item
    FOR v_recipe IN 
      SELECT ri.*, i.quantity as current_stock, i.name as ingredient_name
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.menu_item_id = v_menu_item_id
    LOOP
      v_ingredient := v_recipe;
      v_new_quantity := v_ingredient.current_stock - (v_recipe.quantity_required * v_quantity);
      
      IF v_new_quantity < 0 THEN
        v_can_deduct := false;
        -- Create alert for out of stock
        INSERT INTO inventory_alerts (cafe_id, ingredient_id, alert_type, message)
        VALUES (
          v_cafe_id,
          v_recipe.ingredient_id,
          'out_of_stock',
          format('Cannot prepare order: %s is out of stock', v_ingredient.ingredient_name)
        );
      END IF;
    END LOOP;
  END LOOP;
  
  IF NOT v_can_deduct THEN
    RETURN false;
  END IF;
  
  -- Deduct ingredients
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_menu_item_id := (v_item->>'menu_item_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    FOR v_recipe IN 
      SELECT ri.*, i.quantity as current_stock, i.cost_per_unit
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.menu_item_id = v_menu_item_id
    LOOP
      v_new_quantity := v_recipe.current_stock - (v_recipe.quantity_required * v_quantity);
      
      -- Update ingredient quantity
      UPDATE ingredients
      SET quantity = v_new_quantity,
          updated_at = NOW()
      WHERE id = v_recipe.ingredient_id;
      
      -- Create transaction record
      INSERT INTO inventory_transactions (
        cafe_id,
        ingredient_id,
        type,
        quantity,
        reason,
        order_id,
        cost
      ) VALUES (
        v_cafe_id,
        v_recipe.ingredient_id,
        'stock_out',
        v_recipe.quantity_required * v_quantity,
        format('Order #%s', p_order_id),
        p_order_id,
        v_recipe.cost_per_unit * v_recipe.quantity_required * v_quantity
      );
      
      -- Check for low stock alert
      IF v_new_quantity <= (SELECT min_quantity FROM ingredients WHERE id = v_recipe.ingredient_id) THEN
        INSERT INTO inventory_alerts (cafe_id, ingredient_id, alert_type, message)
        VALUES (
          v_cafe_id,
          v_recipe.ingredient_id,
          'low_stock',
          format('Low stock alert: %s is running low', (SELECT name FROM ingredients WHERE id = v_recipe.ingredient_id))
        );
      END IF;
      
      -- Auto-hide menu item if ingredient is out of stock
      IF v_new_quantity <= 0 THEN
        UPDATE menu_items
        SET is_available = false,
            updated_at = NOW()
        WHERE id = v_menu_item_id;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stock consumption report
CREATE OR REPLACE FUNCTION get_stock_consumption_report(
  p_cafe_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  ingredient_id UUID,
  ingredient_name TEXT,
  unit TEXT,
  total_consumed DECIMAL,
  total_cost DECIMAL,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.ingredient_id,
    i.name AS ingredient_name,
    i.unit,
    SUM(it.quantity) AS total_consumed,
    SUM(it.cost) AS total_cost,
    COUNT(*) AS transaction_count
  FROM inventory_transactions it
  JOIN ingredients i ON i.id = it.ingredient_id
  WHERE 
    it.cafe_id = p_cafe_id
    AND it.type = 'stock_out'
    AND it.created_at::DATE BETWEEN p_start_date AND p_end_date
  GROUP BY it.ingredient_id, i.name, i.unit
  ORDER BY total_consumed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get low stock ingredients
CREATE OR REPLACE FUNCTION get_low_stock_ingredients(p_cafe_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  unit TEXT,
  quantity DECIMAL,
  min_quantity DECIMAL,
  supplier TEXT,
  suggested_order_quantity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.unit,
    i.quantity,
    i.min_quantity,
    i.supplier,
    CASE 
      WHEN i.quantity <= i.min_quantity THEN i.min_quantity * 2
      ELSE 0
    END AS suggested_order_quantity
  FROM ingredients i
  WHERE 
    i.cafe_id = p_cafe_id
    AND i.is_active = true
    AND i.quantity <= i.min_quantity
  ORDER BY i.quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate menu item cost
CREATE OR REPLACE FUNCTION calculate_menu_item_cost(p_menu_item_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_cost DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(ri.quantity_required * i.cost_per_unit), 0)
  INTO v_total_cost
  FROM recipe_ingredients ri
  JOIN ingredients i ON i.id = ri.ingredient_id
  WHERE ri.menu_item_id = p_menu_item_id;
  
  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inventory summary
CREATE OR REPLACE FUNCTION get_inventory_summary(p_cafe_id UUID)
RETURNS TABLE (
  total_ingredients BIGINT,
  low_stock_count BIGINT,
  out_of_stock_count BIGINT,
  total_value DECIMAL,
  unread_alerts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE is_active = true) AS total_ingredients,
    COUNT(*) FILTER (WHERE quantity <= min_quantity AND quantity > 0) AS low_stock_count,
    COUNT(*) FILTER (WHERE quantity <= 0) AS out_of_stock_count,
    COALESCE(SUM(quantity * cost_per_unit), 0) AS total_value,
    (SELECT COUNT(*) FROM inventory_alerts WHERE cafe_id = p_cafe_id AND is_read = false) AS unread_alerts
  FROM ingredients
  WHERE cafe_id = p_cafe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE ingredients IS 'Inventory ingredients for each cafe';
COMMENT ON TABLE recipe_ingredients IS 'Maps menu items to required ingredients';
COMMENT ON TABLE inventory_transactions IS 'Tracks all inventory movements';
COMMENT ON TABLE inventory_alerts IS 'Alerts for low stock, out of stock, etc.';

COMMENT ON COLUMN ingredients.min_quantity IS 'Minimum quantity before alert is triggered';
COMMENT ON COLUMN ingredients.cost_per_unit IS 'Cost per unit for cost calculation';
COMMENT ON COLUMN inventory_transactions.type IS 'Type of transaction: stock_in, stock_out, adjustment, waste';
