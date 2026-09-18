-- Migration: Add multi-language support to menu items
-- Adds translations JSONB field for storing translations in multiple languages

-- Add translations column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Create index for faster translation lookups
CREATE INDEX IF NOT EXISTS idx_menu_items_translations 
ON menu_items USING GIN (translations);

-- Add comments
COMMENT ON COLUMN menu_items.translations IS 'JSON object containing translations for name and description in multiple languages. Structure: { "en": { "name": "...", "description": "..." }, "hi": { "name": "...", "description": "..." }, ... }';

-- Create function to get translated menu item
CREATE OR REPLACE FUNCTION get_translated_menu_item(
  item_id UUID,
  lang TEXT DEFAULT 'en'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  category TEXT,
  image_url TEXT,
  is_veg BOOLEAN,
  is_available BOOLEAN,
  is_popular BOOLEAN,
  is_spicy BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    COALESCE(
      m.translations->lang->>'name',
      m.translations->'en'->>'name',
      m.name
    ) AS name,
    COALESCE(
      m.translations->lang->>'description',
      m.translations->'en'->>'description',
      m.description
    ) AS description,
    m.price,
    m.category,
    m.image_url,
    m.is_veg,
    m.is_available,
    m.is_popular,
    m.is_spicy
  FROM menu_items m
  WHERE m.id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all translated menu items for a cafe
CREATE OR REPLACE FUNCTION get_translated_menu_items(
  cafe_uuid UUID,
  lang TEXT DEFAULT 'en'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  category TEXT,
  image_url TEXT,
  is_veg BOOLEAN,
  is_available BOOLEAN,
  is_popular BOOLEAN,
  is_spicy BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    COALESCE(
      m.translations->lang->>'name',
      m.translations->'en'->>'name',
      m.name
    ) AS name,
    COALESCE(
      m.translations->lang->>'description',
      m.translations->'en'->>'description',
      m.description
    ) AS description,
    m.price,
    m.category,
    m.image_url,
    m.is_veg,
    m.is_available,
    m.is_popular,
    m.is_spicy
  FROM menu_items m
  WHERE m.cafe_id = cafe_uuid
    AND m.is_available = true
  ORDER BY m.category, m.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Insert sample translations for existing menu items
-- This is just an example and should be customized based on actual menu items
/*
UPDATE menu_items
SET translations = '{
  "en": {
    "name": "Espresso",
    "description": "Rich and bold single shot espresso"
  },
  "hi": {
    "name": "एस्प्रेसो",
    "description": "समृद्ध और साहसपूर्ण एकल शॉट एस्प्रेसो"
  },
  "ta": {
    "name": "எஸ்பிரெஸோ",
    "description": "செழுமையான மற்றும் தைரியமான ஒற்றை ஷாட் எஸ்பிரெஸோ"
  },
  "te": {
    "name": "ఎస్ప్రెస్సో",
    "description": "సమృద్ధిగా మరియు ధైర్యంగా ఒకే షాట్ ఎస్ప్రెస్సో"
  },
  "kn": {
    "name": "ಎಸ್ಪ್ರೆಸ್ಸೊ",
    "description": "ಸಮೃದ್ಧ ಮತ್ತು ಧೈರಿಯ ಏಕ ಶಾಟ್ ಎಸ್ಪ್ರೆಸ್ಸೊ"
  },
  "ml": {
    "name": "എസ്പ്രെസോ",
    "description": "സമ്പുഷ്ടവും ധൈര്യമുള്ളതുമായ ഒറ്റ ഷോട്ട് എസ്പ്രെസോ"
  }
}'::jsonb
WHERE name = 'Espresso';
*/
