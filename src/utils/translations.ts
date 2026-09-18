import type { Database } from '../types/database';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface TranslationData {
  name?: string;
  description?: string;
}

/**
 * Get translated name for a menu item
 */
export function getTranslatedName(
  item: MenuItem,
  language: string = 'en'
): string {
  const translations = item.translations as Record<string, TranslationData> | null;
  
  if (translations && translations[language]?.name) {
    return translations[language].name!;
  }
  
  // Fallback to English
  if (translations && translations['en']?.name) {
    return translations['en'].name!;
  }
  
  // Fallback to original name
  return item.name;
}

/**
 * Get translated description for a menu item
 */
export function getTranslatedDescription(
  item: MenuItem,
  language: string = 'en'
): string | null {
  const translations = item.translations as Record<string, TranslationData> | null;
  
  if (translations && translations[language]?.description) {
    return translations[language].description!;
  }
  
  // Fallback to English
  if (translations && translations['en']?.description) {
    return translations['en'].description!;
  }
  
  // Fallback to original description
  return item.description;
}

/**
 * Get fully translated menu item
 */
export function getTranslatedMenuItem(
  item: MenuItem,
  language: string = 'en'
): MenuItem {
  return {
    ...item,
    name: getTranslatedName(item, language),
    description: getTranslatedDescription(item, language),
  };
}

/**
 * Get all translated menu items
 */
export function getTranslatedMenuItems(
  items: MenuItem[],
  language: string = 'en'
): MenuItem[] {
  return items.map(item => getTranslatedMenuItem(item, language));
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  const supportedLanguages = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];
  return supportedLanguages.includes(language);
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  const languageNames: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    ml: 'Malayalam',
  };
  return languageNames[code] || code;
}

/**
 * Get language native name
 */
export function getLanguageNativeName(code: string): string {
  const nativeNames: Record<string, string> = {
    en: 'English',
    hi: 'हिन्दी',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
  };
  return nativeNames[code] || code;
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(code: string): string {
  // All Indian languages use the Indian flag
  const flags: Record<string, string> = {
    en: '🇬🇧',
    hi: '🇮🇳',
    ta: '🇮🇳',
    te: '🇮🇳',
    kn: '🇮🇳',
    ml: '🇮🇳',
  };
  return flags[code] || '🌐';
}
