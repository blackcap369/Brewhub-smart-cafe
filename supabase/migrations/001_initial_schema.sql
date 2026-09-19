-- ============================================================================
-- BrewHub SaaS - Complete Database Schema Migration
-- Multi-tenant architecture with Row Level Security (RLS)
-- Target: Supabase (PostgreSQL)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CAFES TABLE
-- Core tenant table - each cafe is an isolated tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS cafes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    settings JSONB DEFAULT '{}'::jsonb,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. USERS TABLE
-- All users across tenants (owners, staff, customers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    dob DATE,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('owner', 'staff', 'customer')),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(phone, cafe_id)
);

-- ============================================================================
-- 3. TABLES TABLE
-- Physical tables in the cafe
-- ============================================================================
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    table_no INT NOT NULL,
    seats INT NOT NULL DEFAULT 4 CHECK (seats > 0),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    qr_code TEXT UNIQUE,
    label TEXT,
    floor TEXT DEFAULT 'ground',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cafe_id, table_no)
);

-- ============================================================================
-- 4. MENU_ITEMS TABLE
-- Menu items per cafe (tenant-isolated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL DEFAULT 'general',
    image_url TEXT,
    is_veg BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    is_spicy BOOLEAN DEFAULT false,
    preparation_time INT DEFAULT 10 CHECK (preparation_time >= 0),
    calories INT,
    allergens TEXT[] DEFAULT '{}',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. ORDERS TABLE
-- Orders per cafe with status workflow
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    table_no INT,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
    total DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'preparing', 'ready', 'served', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partial')),
    order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'pre_order')),
    scheduled_time TIMESTAMPTZ,
    notes TEXT,
    special_instructions TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    prepared_by UUID REFERENCES users(id) ON DELETE SET NULL,
    served_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. PAYMENTS TABLE
-- Payment records linked to orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'upi', 'razorpay', 'wallet', 'other')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    transaction_ref TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. LOYALTY_POINTS TABLE
-- Customer loyalty tracking per cafe
-- ============================================================================
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    orders_count INT NOT NULL DEFAULT 0 CHECK (orders_count >= 0),
    total_spent DECIMAL(12, 2) DEFAULT 0 CHECK (total_spent >= 0),
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    last_redeemed TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(customer_id, cafe_id)
);

-- ============================================================================
-- 8. FEEDBACK TABLE
-- Customer feedback on orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    food_rating INT CHECK (food_rating >= 1 AND food_rating <= 5),
    service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
    ambiance_rating INT CHECK (ambiance_rating >= 1 AND ambiance_rating <= 5),
    is_anonymous BOOLEAN DEFAULT false,
    responded_at TIMESTAMPTZ,
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id)
);

-- ============================================================================
-- 9. BROADCASTS TABLE
-- Cafe announcements and promotions
-- ============================================================================
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'loyalty_members', 'new_customers', 'inactive')),
    channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'push', 'sms', 'email', 'whatsapp')),
    media_url TEXT,
    sent_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    sent_count INT DEFAULT 0,
    read_count INT DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. SETTINGS TABLE
-- Per-cafe key-value settings store
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cafe_id, key)
);

-- ============================================================================
-- 11. ACTIVITY_LOG TABLE
-- Audit trail for all actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- Performance optimization indexes
-- ============================================================================

-- menu_items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_cafe_id ON menu_items(cafe_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(cafe_id, category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(cafe_id, is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_popular ON menu_items(cafe_id, is_popular) WHERE is_popular = true;

-- orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_cafe_id ON orders(cafe_id);
CREATE INDEX IF NOT EXISTS idx_orders_cafe_status ON orders(cafe_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cafe_created ON orders(cafe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(cafe_id, table_no) WHERE table_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_active ON orders(cafe_id, status) WHERE status IN ('received', 'preparing', 'ready');
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(cafe_id, order_number);

-- users indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_cafe_id ON users(cafe_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(cafe_id, role);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_user_id);

-- tables indexes
CREATE INDEX IF NOT EXISTS idx_tables_cafe_id ON tables(cafe_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(cafe_id, status);

-- payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_cafe_id ON payments(cafe_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay ON payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(cafe_id, status);

-- loyalty_points indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cafe ON loyalty_points(cafe_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier ON loyalty_points(cafe_id, tier);

-- feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_order ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_customer ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cafe ON feedback(cafe_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(cafe_id, rating);

-- broadcasts indexes
CREATE INDEX IF NOT EXISTS idx_broadcasts_cafe ON broadcasts(cafe_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(cafe_id, status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled ON broadcasts(scheduled_for) WHERE status = 'scheduled';

-- settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_cafe ON settings(cafe_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(cafe_id, key);

-- activity_log indexes
CREATE INDEX IF NOT EXISTS idx_activity_cafe ON activity_log(cafe_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(cafe_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables for tenant isolation
-- ============================================================================

ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANT ISOLATION POLICIES
-- Uses current_setting('app.current_cafe_id') for multi-tenant isolation
-- ============================================================================

-- Helper function to get current cafe_id from session
CREATE OR REPLACE FUNCTION get_current_cafe_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_cafe_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get current user_id from auth
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to check if user is owner of cafe
CREATE OR REPLACE FUNCTION is_cafe_owner(cafe_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM cafes
        WHERE id = cafe_uuid
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user is staff of cafe
CREATE OR REPLACE FUNCTION is_cafe_staff(cafe_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE cafe_id = cafe_uuid
        AND auth_user_id = auth.uid()
        AND role IN ('owner', 'staff')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user is customer of cafe
CREATE OR REPLACE FUNCTION is_cafe_customer(cafe_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE cafe_id = cafe_uuid
        AND auth_user_id = auth.uid()
        AND role = 'customer'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- CAFES POLICIES
-- ============================================================================

-- Owners can see their own cafes
CREATE POLICY "cafes_select_owner" ON cafes
    FOR SELECT USING (owner_id = auth.uid());

-- Owners can insert their own cafes
CREATE POLICY "cafes_insert_owner" ON cafes
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Owners can update their own cafes
CREATE POLICY "cafes_update_owner" ON cafes
    FOR UPDATE USING (owner_id = auth.uid());

-- Owners can delete their own cafes
CREATE POLICY "cafes_delete_owner" ON cafes
    FOR DELETE USING (owner_id = auth.uid());

-- Staff can view cafes they belong to
CREATE POLICY "cafes_select_staff" ON cafes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.cafe_id = cafes.id
            AND users.auth_user_id = auth.uid()
            AND users.role IN ('owner', 'staff')
            AND users.is_active = true
        )
    );

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Staff/owners can see users in their cafe
CREATE POLICY "users_select_staff" ON users
    FOR SELECT USING (
        is_cafe_staff(cafe_id) OR
        cafe_id = get_current_cafe_id()
    );

-- Users can see their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth_user_id = auth.uid());

-- Owners can insert staff/users in their cafe
CREATE POLICY "users_insert_staff" ON users
    FOR INSERT WITH CHECK (
        is_cafe_owner(cafe_id) OR
        (cafe_id = get_current_cafe_id() AND role = 'customer')
    );

-- Staff can update users in their cafe
CREATE POLICY "users_update_staff" ON users
    FOR UPDATE USING (is_cafe_staff(cafe_id));

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Owners can delete users in their cafe
CREATE POLICY "users_delete_owner" ON users
    FOR DELETE USING (is_cafe_owner(cafe_id));

-- ============================================================================
-- TABLES POLICIES
-- ============================================================================

CREATE POLICY "tables_select_tenant" ON tables
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() OR
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "tables_insert_tenant" ON tables
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "tables_update_tenant" ON tables
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "tables_delete_tenant" ON tables
    FOR DELETE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_owner(cafe_id)
    );

-- ============================================================================
-- MENU_ITEMS POLICIES
-- ============================================================================

-- Anyone (including customers) can view available menu items
CREATE POLICY "menu_items_select_public" ON menu_items
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() OR
        is_cafe_staff(cafe_id)
    );

-- Only staff can manage menu items
CREATE POLICY "menu_items_insert_staff" ON menu_items
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "menu_items_update_staff" ON menu_items
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "menu_items_delete_staff" ON menu_items
    FOR DELETE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================

-- Staff can see all orders in their cafe
CREATE POLICY "orders_select_staff" ON orders
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

-- Customers can see their own orders
CREATE POLICY "orders_select_customer" ON orders
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Staff can create orders
CREATE POLICY "orders_insert_staff" ON orders
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        (is_cafe_staff(cafe_id) OR
         customer_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
    );

-- Staff can update order status
CREATE POLICY "orders_update_staff" ON orders
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

-- Only owners can delete orders (soft delete preferred)
CREATE POLICY "orders_delete_owner" ON orders
    FOR DELETE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_owner(cafe_id)
    );

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

CREATE POLICY "payments_select_staff" ON payments
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "payments_select_customer" ON payments
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM orders o
            JOIN users u ON u.id = o.customer_id
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "payments_insert_staff" ON payments
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "payments_update_staff" ON payments
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

-- ============================================================================
-- LOYALTY_POINTS POLICIES
-- ============================================================================

CREATE POLICY "loyalty_select_staff" ON loyalty_points
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "loyalty_select_own" ON loyalty_points
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "loyalty_insert_staff" ON loyalty_points
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "loyalty_update_staff" ON loyalty_points
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

-- ============================================================================
-- FEEDBACK POLICIES
-- ============================================================================

CREATE POLICY "feedback_select_staff" ON feedback
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "feedback_select_own" ON feedback
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "feedback_insert_customer" ON feedback
    FOR INSERT WITH CHECK (
        customer_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "feedback_update_staff" ON feedback
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

-- ============================================================================
-- BROADCASTS POLICIES
-- ============================================================================

CREATE POLICY "broadcasts_select_tenant" ON broadcasts
    FOR SELECT USING (
        cafe_id = get_current_cafe_id()
    );

CREATE POLICY "broadcasts_select_sent" ON broadcasts
    FOR SELECT USING (
        status = 'sent' AND
        cafe_id = get_current_cafe_id()
    );

CREATE POLICY "broadcasts_insert_staff" ON broadcasts
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "broadcasts_update_staff" ON broadcasts
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "broadcasts_delete_owner" ON broadcasts
    FOR DELETE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_owner(cafe_id)
    );

-- ============================================================================
-- SETTINGS POLICIES
-- ============================================================================

CREATE POLICY "settings_select_tenant" ON settings
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() AND
        (is_public = true OR is_cafe_staff(cafe_id))
    );

CREATE POLICY "settings_insert_owner" ON settings
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        is_cafe_owner(cafe_id)
    );

CREATE POLICY "settings_update_owner" ON settings
    FOR UPDATE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_owner(cafe_id)
    );

CREATE POLICY "settings_delete_owner" ON settings
    FOR DELETE USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_owner(cafe_id)
    );

-- ============================================================================
-- ACTIVITY_LOG POLICIES
-- ============================================================================

CREATE POLICY "activity_select_staff" ON activity_log
    FOR SELECT USING (
        cafe_id = get_current_cafe_id() AND
        is_cafe_staff(cafe_id)
    );

CREATE POLICY "activity_insert_staff" ON activity_log
    FOR INSERT WITH CHECK (
        cafe_id = get_current_cafe_id() AND
        (is_cafe_staff(cafe_id) OR user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        ))
    );

-- Activity logs are immutable - no update or delete policies

-- ============================================================================
-- TRIGGERS
-- Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'cafes', 'users', 'tables', 'menu_items', 'orders',
        'payments', 'loyalty_points', 'feedback', 'broadcasts', 'settings'
    ] LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON %I;',
            t, t
        );
        EXECUTE format(
            'CREATE TRIGGER trigger_update_%I_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
            t, t
        );
    END LOOP;
END;
$$;

-- ============================================================================
-- AUTO-GENERATE ORDER NUMBERS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(order_number FROM 'ORD-(\d+)') AS INT)
        ), 0) + 1
        INTO next_num
        FROM orders
        WHERE cafe_id = NEW.cafe_id
        AND created_at >= CURRENT_DATE;

        NEW.order_number = 'ORD-' || LPAD(next_num::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================================
-- AUTO-GENERATE QR CODES FOR TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_table_qr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
        NEW.qr_code = 'TABLE-' || NEW.cafe_id::TEXT || '-' || NEW.table_no::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_table_qr ON tables;
CREATE TRIGGER trigger_generate_table_qr
    BEFORE INSERT ON tables
    FOR EACH ROW EXECUTE FUNCTION generate_table_qr();

-- ============================================================================
-- VIEWS
-- Useful aggregated views for common queries
-- ============================================================================

-- Daily revenue view
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
    o.cafe_id,
    DATE(o.created_at) AS order_date,
    COUNT(*) AS total_orders,
    SUM(o.total) AS total_revenue,
    AVG(o.total) AS avg_order_value,
    COUNT(*) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY o.cafe_id, DATE(o.created_at)
ORDER BY order_date DESC;

-- Popular items view
CREATE OR REPLACE VIEW v_popular_items AS
SELECT
    o.cafe_id,
    mi.id AS menu_item_id,
    mi.name,
    mi.category,
    COUNT(*) AS times_ordered,
    SUM((item->>'quantity')::INT) AS total_quantity,
    SUM((item->>'quantity')::INT * mi.price) AS total_revenue
FROM orders o,
     jsonb_array_elements(o.items) AS item
JOIN menu_items mi ON mi.id = (item->>'menu_item_id')::UUID
WHERE o.status NOT IN ('cancelled')
GROUP BY o.cafe_id, mi.id, mi.name, mi.category
ORDER BY total_quantity DESC;

-- Customer analytics view
CREATE OR REPLACE VIEW v_customer_analytics AS
SELECT
    u.cafe_id,
    u.id AS customer_id,
    u.name,
    u.phone,
    u.email,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total), 0) AS total_spent,
    COALESCE(AVG(o.total), 0) AS avg_order_value,
    MAX(o.created_at) AS last_order_at,
    lp.points AS loyalty_points,
    lp.tier
FROM users u
LEFT JOIN orders o ON o.customer_id = u.id AND o.status != 'cancelled'
LEFT JOIN loyalty_points lp ON lp.customer_id = u.id AND lp.cafe_id = u.cafe_id
WHERE u.role = 'customer'
GROUP BY u.cafe_id, u.id, u.name, u.phone, u.email, lp.points, lp.tier;

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Insert a sample cafe (uncomment for development)
-- INSERT INTO cafes (id, name, slug, owner_id, subscription_plan)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'BrewHub Demo Cafe',
--     'brewhub-demo',
--     '00000000-0000-0000-0000-000000000000',
--     'professional'
-- );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
