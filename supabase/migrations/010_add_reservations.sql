-- Migration: Add table reservation system
-- Creates reservations table and related functionality

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  special_requests TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  duration_minutes INTEGER DEFAULT 90,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  reminder_sent_2hr BOOLEAN DEFAULT false,
  reminder_sent_30min BOOLEAN DEFAULT false,
  no_show_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  marked_no_show_at TIMESTAMPTZ
);

-- Create reservation reminders table for tracking
CREATE TABLE IF NOT EXISTS reservation_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('2hr', '30min', 'confirmation', 'cancellation')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_via TEXT NOT NULL CHECK (sent_via IN ('sms', 'email', 'push', 'in_app')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  error_message TEXT
);

-- Create waitlist table for popular times
CREATE TABLE IF NOT EXISTS reservation_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired')),
  notified_at TIMESTAMPTZ,
  converted_to_reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_cafe_date ON reservations(cafe_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_cafe_date_time ON reservations(cafe_id, reservation_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_cafe_date ON reservation_waitlist(cafe_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON reservation_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_reminders_reservation ON reservation_reminders(reservation_id);

-- Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservations
CREATE POLICY "Customers can view own reservations"
  ON reservations
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view cafe reservations"
  ON reservations
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Customers can create reservations"
  ON reservations
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
    OR customer_id IS NULL
  );

CREATE POLICY "Staff can manage cafe reservations"
  ON reservations
  FOR ALL
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- RLS Policies for reminders
CREATE POLICY "Customers can view own reminders"
  ON reservation_reminders
  FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM reservations
      WHERE customer_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can view cafe reminders"
  ON reservation_reminders
  FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM reservations
      WHERE cafe_id IN (
        SELECT cafe_id FROM users
        WHERE auth_user_id = auth.uid()
        AND role IN ('owner', 'manager', 'staff')
      )
    )
  );

-- RLS Policies for waitlist
CREATE POLICY "Customers can view own waitlist entries"
  ON reservation_waitlist
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view cafe waitlist"
  ON reservation_waitlist
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Customers can join waitlist"
  ON reservation_waitlist
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
    OR customer_id IS NULL
  );

-- Function to check table availability
CREATE OR REPLACE FUNCTION check_table_availability(
  p_cafe_id UUID,
  p_date DATE,
  p_time_slot TIME,
  p_guests INTEGER,
  p_duration_minutes INTEGER DEFAULT 90,
  p_buffer_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  table_id UUID,
  table_no INTEGER,
  seats INTEGER,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS table_id,
    t.table_no,
    t.seats,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.table_id = t.id
        AND r.reservation_date = p_date
        AND r.status IN ('confirmed', 'checked_in')
        AND r.time_slot <= p_time_slot + (p_duration_minutes || ' minutes')::INTERVAL + (p_buffer_minutes || ' minutes')::INTERVAL
        AND r.time_slot + (r.duration_minutes || ' minutes')::INTERVAL > p_time_slot - (p_buffer_minutes || ' minutes')::INTERVAL
      ) THEN false
      ELSE true
    END AS is_available
  FROM tables t
  WHERE t.cafe_id = p_cafe_id
    AND t.is_active = true
    AND t.seats >= p_guests
  ORDER BY t.seats ASC, t.table_no ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available time slots
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_cafe_id UUID,
  p_date DATE,
  p_guests INTEGER,
  p_opening_time TIME DEFAULT '08:00:00',
  p_closing_time TIME DEFAULT '22:00:00',
  p_slot_duration_minutes INTEGER DEFAULT 30,
  p_reservation_duration_minutes INTEGER DEFAULT 90,
  p_buffer_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  time_slot TIME,
  available_tables INTEGER,
  total_tables INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH time_slots AS (
    SELECT generate_series(
      p_opening_time::TIMESTAMP,
      p_closing_time::TIMESTAMP - (p_reservation_duration_minutes || ' minutes')::INTERVAL,
      (p_slot_duration_minutes || ' minutes')::INTERVAL
    )::TIME AS slot
  ),
  table_counts AS (
    SELECT 
      ts.slot AS time_slot,
      COUNT(*) FILTER (WHERE availability.is_available) AS available_tables,
      COUNT(*) AS total_tables
    FROM time_slots ts
    CROSS JOIN LATERAL (
      SELECT * FROM check_table_availability(
        p_cafe_id,
        p_date,
        ts.slot,
        p_guests,
        p_reservation_duration_minutes,
        p_buffer_minutes
      )
    ) availability
    GROUP BY ts.slot
  )
  SELECT * FROM table_counts
  WHERE available_tables > 0
  ORDER BY time_slot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark no-shows
CREATE OR REPLACE FUNCTION mark_no_shows()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE reservations
  SET 
    status = 'no_show',
    marked_no_show_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'confirmed'
    AND reservation_date = CURRENT_DATE
    AND time_slot + (duration_minutes || ' minutes')::INTERVAL < NOW() - INTERVAL '15 minutes';
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get reservation statistics
CREATE OR REPLACE FUNCTION get_reservation_stats(
  p_cafe_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_reservations BIGINT,
  confirmed_count BIGINT,
  checked_in_count BIGINT,
  completed_count BIGINT,
  cancelled_count BIGINT,
  no_show_count BIGINT,
  total_guests BIGINT,
  avg_guests_per_reservation DECIMAL,
  no_show_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_reservations,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_count,
    COUNT(*) FILTER (WHERE status = 'checked_in') AS checked_in_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
    COUNT(*) FILTER (WHERE status = 'no_show') AS no_show_count,
    COALESCE(SUM(guests), 0) AS total_guests,
    CASE 
      WHEN COUNT(*) > 0 THEN AVG(guests)::DECIMAL
      ELSE 0
    END AS avg_guests_per_reservation,
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'no_show')::DECIMAL / COUNT(*)) * 100
      ELSE 0
    END AS no_show_rate
  FROM reservations
  WHERE 
    cafe_id = p_cafe_id
    AND reservation_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE reservations IS 'Table reservations for customers';
COMMENT ON COLUMN reservations.duration_minutes IS 'Expected duration of reservation in minutes';
COMMENT ON COLUMN reservations.deposit_amount IS 'Deposit amount for large groups';
COMMENT ON COLUMN reservations.no_show_count IS 'Number of times customer was marked as no-show';

COMMENT ON TABLE reservation_reminders IS 'Tracks reminder notifications sent for reservations';
COMMENT ON TABLE reservation_waitlist IS 'Waitlist for fully booked time slots';
