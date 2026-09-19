-- Migration: Enhance feedback table with response tracking and categories
-- Adds response fields, categories array, and improves indexing

-- Add new columns to feedback table
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_cafe_id_rating 
ON feedback(cafe_id, rating);

CREATE INDEX IF NOT EXISTS idx_feedback_cafe_id_created_at 
ON feedback(cafe_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_order_id 
ON feedback(order_id);

CREATE INDEX IF NOT EXISTS idx_feedback_customer_id 
ON feedback(customer_id);

-- Add comments
COMMENT ON COLUMN feedback.response IS 'Owner response to the feedback';
COMMENT ON COLUMN feedback.responded_at IS 'Timestamp when owner responded';
COMMENT ON COLUMN feedback.responded_by IS 'User ID of the owner who responded';
COMMENT ON COLUMN feedback.categories IS 'Array of feedback categories (food_quality, service, ambience, value)';

-- Create function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats(cafe_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL,
  total_reviews BIGINT,
  rating_1_count BIGINT,
  rating_2_count BIGINT,
  rating_3_count BIGINT,
  rating_4_count BIGINT,
  rating_5_count BIGINT,
  response_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating::DECIMAL), 0) AS average_rating,
    COUNT(*)::BIGINT AS total_reviews,
    COUNT(*) FILTER (WHERE rating = 1)::BIGINT AS rating_1_count,
    COUNT(*) FILTER (WHERE rating = 2)::BIGINT AS rating_2_count,
    COUNT(*) FILTER (WHERE rating = 3)::BIGINT AS rating_3_count,
    COUNT(*) FILTER (WHERE rating = 4)::BIGINT AS rating_4_count,
    COUNT(*) FILTER (WHERE rating = 5)::BIGINT AS rating_5_count,
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE response IS NOT NULL)::DECIMAL / COUNT(*)) * 100
      ELSE 0
    END AS response_rate
  FROM feedback
  WHERE cafe_id = cafe_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get recent positive feedback (4+ stars)
CREATE OR REPLACE FUNCTION get_recent_positive_feedback(cafe_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  customer_id UUID,
  rating INTEGER,
  comment TEXT,
  categories TEXT[],
  is_anonymous BOOLEAN,
  response TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.order_id,
    f.customer_id,
    f.rating,
    f.comment,
    f.categories,
    f.is_anonymous,
    f.response,
    f.created_at
  FROM feedback f
  WHERE f.cafe_id = cafe_uuid
    AND f.rating >= 4
  ORDER BY f.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get category breakdown
CREATE OR REPLACE FUNCTION get_feedback_category_breakdown(cafe_uuid UUID)
RETURNS TABLE (
  category TEXT,
  review_count BIGINT,
  average_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    UNNEST(categories) AS category,
    COUNT(*)::BIGINT AS review_count,
    AVG(rating::DECIMAL) AS average_rating
  FROM feedback
  WHERE cafe_id = cafe_uuid
    AND categories IS NOT NULL
    AND array_length(categories, 1) > 0
  GROUP BY UNNEST(categories)
  ORDER BY review_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
