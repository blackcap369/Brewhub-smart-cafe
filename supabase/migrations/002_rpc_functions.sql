-- ============================================================================
-- BrewHub SaaS - RPC Functions & Additional Utilities
-- Migration 002: Client-accessible functions for tenant context
-- ============================================================================

-- ============================================================================
-- SET CAFE CONTEXT
-- Allows authenticated users to set their active cafe context
-- This is called from the client before making queries
-- ============================================================================

CREATE OR REPLACE FUNCTION set_cafe_context(cafe_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verify the user has access to this cafe
    IF NOT (
        -- User is the owner
        EXISTS (SELECT 1 FROM cafes WHERE id = cafe_id AND owner_id = auth.uid())
        OR
        -- User is staff/customer of this cafe
        EXISTS (
            SELECT 1 FROM users
            WHERE cafe_id = set_cafe_context.cafe_id
            AND auth_user_id = auth.uid()
            AND is_active = true
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to cafe %', cafe_id USING ERRCODE = '42501';
    END IF;

    -- Set the session variable
    PERFORM set_config('app.current_cafe_id', cafe_id::TEXT, TRUE);
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GET CURRENT CAFE INFO
-- Returns the current cafe details based on session context
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_cafe_info()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    subscription_plan TEXT,
    logo_url TEXT,
    settings JSONB
) AS $$
DECLARE
    current_cafe UUID;
BEGIN
    current_cafe := NULLIF(current_setting('app.current_cafe_id', TRUE), '')::UUID;

    IF current_cafe IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::JSONB;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT c.id, c.name, c.slug, c.subscription_plan, c.logo_url, c.settings
    FROM cafes c
    WHERE c.id = current_cafe;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- GET USER ROLE
-- Returns the current user's role in the active cafe
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    current_cafe UUID;
    user_role TEXT;
BEGIN
    current_cafe := NULLIF(current_setting('app.current_cafe_id', TRUE), '')::UUID;

    IF current_cafe IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check if owner
    IF EXISTS (SELECT 1 FROM cafes WHERE id = current_cafe AND owner_id = auth.uid()) THEN
        RETURN 'owner';
    END IF;

    -- Get role from users table
    SELECT u.role INTO user_role
    FROM users u
    WHERE u.cafe_id = current_cafe
    AND u.auth_user_id = auth.uid()
    AND u.is_active = true;

    RETURN user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- CREATE ORDER
-- Atomically creates an order with items and updates inventory/status
-- ============================================================================

CREATE OR REPLACE FUNCTION create_order(
    p_cafe_id UUID,
    p_table_no INT DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_items JSONB,
    p_order_type TEXT DEFAULT 'dine_in',
    p_notes TEXT DEFAULT NULL,
    p_scheduled_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_order_id UUID;
    v_subtotal DECIMAL(10,2) := 0;
    v_tax DECIMAL(10,2) := 0;
    v_total DECIMAL(10,2) := 0;
    item JSONB;
    item_price DECIMAL(10,2);
    item_qty INT;
BEGIN
    -- Validate cafe access
    PERFORM set_cafe_context(p_cafe_id);

    -- Calculate totals from items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        item_qty := (item->>'quantity')::INT;
        SELECT mi.price INTO item_price
        FROM menu_items mi
        WHERE mi.id = (item->>'menu_item_id')::UUID
        AND mi.cafe_id = p_cafe_id
        AND mi.is_available = true;

        IF item_price IS NULL THEN
            RAISE EXCEPTION 'Menu item not found or unavailable: %', item->>'menu_item_id';
        END IF;

        v_subtotal := v_subtotal + (item_price * item_qty);
    END LOOP;

    -- Calculate tax (e.g., 5% GST)
    v_tax := ROUND(v_subtotal * 0.05, 2);
    v_total := v_subtotal + v_tax;

    -- Insert order
    INSERT INTO orders (
        cafe_id, table_no, customer_id, items,
        subtotal, tax, total, status, payment_status,
        order_type, notes, scheduled_time
    ) VALUES (
        p_cafe_id, p_table_no, p_customer_id, p_items,
        v_subtotal, v_tax, v_total, 'received', 'pending',
        p_order_type, p_notes, p_scheduled_time
    ) RETURNING id INTO new_order_id;

    -- Log activity
    INSERT INTO activity_log (cafe_id, user_id, action, entity_type, entity_id, details)
    VALUES (
        p_cafe_id,
        (SELECT id FROM users WHERE auth_user_id = auth.uid() AND cafe_id = p_cafe_id LIMIT 1),
        'order.created',
        'orders',
        new_order_id,
        jsonb_build_object('total', v_total, 'items_count', jsonb_array_length(p_items), 'order_type', p_order_type)
    );

    -- Update loyalty points if customer
    IF p_customer_id IS NOT NULL THEN
        INSERT INTO loyalty_points (customer_id, cafe_id, points, orders_count, total_spent)
        VALUES (p_customer_id, p_cafe_id, FLOOR(v_total)::INT, 1, v_total)
        ON CONFLICT (customer_id, cafe_id) DO UPDATE SET
            orders_count = loyalty_points.orders_count + 1,
            total_spent = loyalty_points.total_spent + v_total,
            points = loyalty_points.points + FLOOR(v_total)::INT,
            updated_at = NOW();
    END IF;

    RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE ORDER STATUS
-- Updates order status with validation and activity logging
-- ============================================================================

CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_cafe_id UUID;
    v_old_status TEXT;
    v_user_id UUID;
BEGIN
    -- Get order details
    SELECT o.cafe_id, o.status INTO v_cafe_id, v_old_status
    FROM orders o
    WHERE o.id = p_order_id;

    IF v_cafe_id IS NULL THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Validate status transition
    IF p_new_status = 'cancelled' AND v_old_status IN ('served', 'cancelled') THEN
        RAISE EXCEPTION 'Cannot cancel order in status: %', v_old_status;
    END IF;

    IF p_new_status = 'received' AND v_old_status != 'cancelled' THEN
        RAISE EXCEPTION 'Cannot reset order to received from: %', v_old_status;
    END IF;

    -- Get user
    SELECT u.id INTO v_user_id
    FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.cafe_id = v_cafe_id AND u.is_active = true
    LIMIT 1;

    -- Update order
    UPDATE orders SET
        status = p_new_status,
        updated_at = NOW(),
        completed_at = CASE WHEN p_new_status = 'served' THEN NOW() ELSE completed_at END,
        cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN NOW() ELSE cancelled_at END
    WHERE id = p_order_id;

    -- Log activity
    INSERT INTO activity_log (cafe_id, user_id, action, entity_type, entity_id, details)
    VALUES (
        v_cafe_id,
        v_user_id,
        'order.status_changed',
        'orders',
        p_order_id,
        jsonb_build_object('old_status', v_old_status, 'new_status', p_new_status)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROCESS PAYMENT
-- Records payment and updates order payment status
-- ============================================================================

CREATE OR REPLACE FUNCTION process_payment(
    p_order_id UUID,
    p_amount DECIMAL,
    p_method TEXT,
    p_razorpay_order_id TEXT DEFAULT NULL,
    p_razorpay_payment_id TEXT DEFAULT NULL,
    p_razorpay_signature TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_cafe_id UUID;
    v_order_total DECIMAL;
BEGIN
    -- Get order
    SELECT o.cafe_id, o.total INTO v_cafe_id, v_order_total
    FROM orders o
    WHERE o.id = p_order_id;

    IF v_cafe_id IS NULL THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Validate amount
    IF p_amount > v_order_total THEN
        RAISE EXCEPTION 'Payment amount exceeds order total';
    END IF;

    -- Insert payment
    INSERT INTO payments (
        order_id, cafe_id, amount, method,
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        status
    ) VALUES (
        p_order_id, v_cafe_id, p_amount, p_method,
        p_razorpay_order_id, p_razorpay_payment_id, p_razorpay_signature,
        CASE
            WHEN p_method = 'cash' THEN 'captured'
            WHEN p_razorpay_payment_id IS NOT NULL THEN 'captured'
            ELSE 'pending'
        END
    ) RETURNING id INTO v_payment_id;

    -- Update order payment status
    UPDATE orders SET
        payment_status = CASE
            WHEN p_amount >= v_order_total THEN 'paid'
            WHEN p_amount > 0 THEN 'partial'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Log activity
    INSERT INTO activity_log (cafe_id, action, entity_type, entity_id, details)
    VALUES (
        v_cafe_id,
        'payment.processed',
        'payments',
        v_payment_id,
        jsonb_build_object('amount', p_amount, 'method', p_method, 'order_id', p_order_id)
    );

    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUBMIT FEEDBACK
-- Creates feedback and updates cafe analytics
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_feedback(
    p_order_id UUID,
    p_rating INT,
    p_comment TEXT DEFAULT NULL,
    p_food_rating INT DEFAULT NULL,
    p_service_rating INT DEFAULT NULL,
    p_ambiance_rating INT DEFAULT NULL,
    p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_feedback_id UUID;
    v_cafe_id UUID;
    v_customer_id UUID;
BEGIN
    -- Get order details
    SELECT o.cafe_id, o.customer_id INTO v_cafe_id, v_customer_id
    FROM orders o
    WHERE o.id = p_order_id;

    IF v_cafe_id IS NULL THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Get customer
    IF v_customer_id IS NULL THEN
        SELECT u.id INTO v_customer_id
        FROM users u
        WHERE u.auth_user_id = auth.uid() AND u.cafe_id = v_cafe_id
        LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer not found for this order';
    END IF;

    -- Insert feedback
    INSERT INTO feedback (
        order_id, customer_id, cafe_id, rating, comment,
        food_rating, service_rating, ambiance_rating, is_anonymous
    ) VALUES (
        p_order_id, v_customer_id, v_cafe_id, p_rating, p_comment,
        p_food_rating, p_service_rating, p_ambiance_rating, p_is_anonymous
    ) RETURNING id INTO v_feedback_id;

    RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DASHBOARD STATS
-- Returns aggregated stats for the current cafe dashboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_orders BIGINT,
    today_orders BIGINT,
    total_revenue DECIMAL,
    today_revenue DECIMAL,
    average_order_value DECIMAL,
    active_orders BIGINT,
    total_customers BIGINT,
    avg_rating DECIMAL
) AS $$
DECLARE
    current_cafe UUID;
BEGIN
    current_cafe := NULLIF(current_setting('app.current_cafe_id', TRUE), '')::UUID;

    IF current_cafe IS NULL THEN
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::DECIMAL, 0::DECIMAL, 0::DECIMAL, 0::BIGINT, 0::BIGINT, 0::DECIMAL;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE o.status != 'cancelled')::BIGINT AS total_orders,
        COUNT(*) FILTER (WHERE o.status != 'cancelled' AND o.created_at >= CURRENT_DATE)::BIGINT AS today_orders,
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) AS total_revenue,
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled' AND o.created_at >= CURRENT_DATE), 0) AS today_revenue,
        COALESCE(AVG(o.total) FILTER (WHERE o.status != 'cancelled'), 0) AS average_order_value,
        COUNT(*) FILTER (WHERE o.status IN ('received', 'preparing', 'ready'))::BIGINT AS active_orders,
        (SELECT COUNT(*) FROM users WHERE cafe_id = current_cafe AND role = 'customer')::BIGINT AS total_customers,
        COALESCE((SELECT AVG(rating::DECIMAL) FROM feedback WHERE cafe_id = current_cafe), 0) AS avg_rating
    FROM orders o
    WHERE o.cafe_id = current_cafe;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- MIGRATION 002 COMPLETE
-- ============================================================================
