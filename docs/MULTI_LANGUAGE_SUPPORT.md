# Multi-Language Support System

## Overview

BrewHub now supports 6 Indian languages with comprehensive translation coverage across all user interfaces. The system uses react-i18next for internationalization with automatic language detection and persistence.

## Supported Languages

| Language | Code | Native Name | Flag |
|----------|------|-------------|------|
| English | en | English | 🇬🇧 |
| Hindi | hi | हिन्दी | 🇮🇳 |
| Tamil | ta | தமிழ் | 🇮🇳 |
| Telugu | te | తెలుగు | 🇮🇳 |
| Kannada | kn | ಕನ್ನಡ | 🇮🇳 |
| Malayalam | ml | മലയാളം | 🇮🇳 |

## Architecture

### Translation Structure

Each language file follows a consistent structure:

```json
{
  "common": { ... },      // Common UI elements
  "menu": { ... },        // Menu-related strings
  "cart": { ... },        // Cart and checkout
  "order": { ... },       // Order tracking
  "auth": { ... },        // Authentication
  "admin": { ... },       // Admin dashboard
  "payment": { ... },     // Payment processing
  "feedback": { ... },    // Customer feedback
  "loyalty": { ... },     // Loyalty program
  "birthday": { ... },    // Birthday automation
  "preorder": { ... },    // Pre-order system
  "kitchen": { ... },     // Kitchen display
  "broadcast": { ... },   // Broadcast messaging
  "errors": { ... }       // Error messages
}
```

### File Structure

```
src/
├── i18n/
│   ├── index.ts                    # i18n configuration
│   └── locales/
│       ├── en.json                 # English (default)
│       ├── hi.json                 # Hindi
│       ├── ta.json                 # Tamil
│       ├── te.json                 # Telugu
│       ├── kn.json                 # Kannada
│       └── ml.json                 # Malayalam
├── components/
│   └── LanguageSwitcher.tsx        # Language selection UI
└── utils/
    └── translations.ts            # Translation utilities
```

## Configuration

### i18n Setup (`src/i18n/index.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'brewhub-language',
    },
  });
```

### Features

- **Automatic Detection**: Detects browser language on first visit
- **Persistence**: Saves language preference in localStorage
- **Fallback**: Falls back to English if translation missing
- **Debug Mode**: Shows missing translations in development

## Usage

### In Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('menu.title')}</h1>
      <p>{t('common.welcome')}</p>
      <button>{t('cart.checkout')}</button>
    </div>
  );
}
```

### With Interpolation

```typescript
// Translation file
{
  "auth": {
    "resendIn": "Resend in {{seconds}} seconds"
  }
}

// Component
t('auth.resendIn', { seconds: 30 })
// Output: "Resend in 30 seconds"
```

### With Pluralization

```typescript
// Translation file
{
  "loyalty": {
    "ordersUntilReward": "{{count}} order until reward",
    "ordersUntilReward_plural": "{{count}} orders until reward"
  }
}

// Component
t('loyalty.ordersUntilReward', { count: 1 })
// Output: "1 order until reward"

t('loyalty.ordersUntilReward', { count: 5 })
// Output: "5 orders until reward"
```

### Changing Language

```typescript
import { useTranslation } from 'react-i18next';

function LanguageButton() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  
  return (
    <button onClick={() => changeLanguage('hi')}>
      हिन्दी
    </button>
  );
}
```

## Language Switcher Component

The `LanguageSwitcher` component provides a dropdown UI for language selection:

```typescript
import LanguageSwitcher from './components/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

### Features

- **Flag Icons**: Visual language identification
- **Native Names**: Shows language in its native script
- **Current Selection**: Highlights active language
- **Smooth Animation**: Animated dropdown transitions
- **Click Outside**: Closes when clicking outside

## Menu Item Translations

### Database Schema

Menu items now support translations via a JSONB field:

```sql
ALTER TABLE menu_items 
ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;
```

### Translation Structure

```json
{
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
  }
}
```

### Helper Functions

```typescript
import { 
  getTranslatedName, 
  getTranslatedDescription,
  getTranslatedMenuItem 
} from './utils/translations';

// Get translated name
const name = getTranslatedName(item, 'hi');

// Get translated description
const description = getTranslatedDescription(item, 'hi');

// Get fully translated item
const translatedItem = getTranslatedMenuItem(item, 'hi');
```

### Database Functions

```sql
-- Get single translated menu item
SELECT * FROM get_translated_menu_item('item-uuid', 'hi');

-- Get all translated menu items for a cafe
SELECT * FROM get_translated_menu_items('cafe-uuid', 'hi');
```

## Admin Translation Management

### Adding Translations

Admins can add translations for menu items through the admin dashboard:

```typescript
// Update menu item with translations
await supabase
  .from('menu_items')
  .update({
    translations: {
      en: { name: 'Coffee', description: 'Hot brewed coffee' },
      hi: { name: 'कॉफी', description: 'गर्म बनाई कॉफी' },
      ta: { name: 'காபி', description: 'சூடான காபி' },
    }
  })
  .eq('id', itemId);
```

### Translation UI

The admin interface should provide:
- Multi-language input fields
- Side-by-side translation view
- Translation completeness indicator
- Bulk translation import/export

## Testing

### Manual Testing Checklist

- [ ] Switch between all 6 languages
- [ ] Verify all UI elements are translated
- [ ] Check menu items display correctly
- [ ] Test language persistence across sessions
- [ ] Verify fallback to English for missing translations
- [ ] Test date/number formatting per locale
- [ ] Check text overflow in different languages
- [ ] Verify RTL support (for future Arabic support)

### Automated Testing

```typescript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

describe('Multi-language support', () => {
  it('should display translated text', () => {
    i18n.changeLanguage('hi');
    render(<MyComponent />);
    expect(screen.getByText('मेनू')).toBeInTheDocument();
  });

  it('should fallback to English', () => {
    i18n.changeLanguage('fr'); // Unsupported language
    render(<MyComponent />);
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Bundle Size

- Translation files are loaded on demand
- Only active language is loaded initially
- Other languages loaded when switched
- Total size: ~50KB for all 6 languages

### Caching

- Language preference cached in localStorage
- Translation files cached by browser
- No server requests after initial load

### Optimization

- Use `useMemo` for expensive translations
- Lazy load language files
- Minimize re-renders on language change

## Accessibility

### Best Practices

- Use semantic HTML
- Provide aria-labels for icons
- Ensure sufficient color contrast
- Support keyboard navigation
- Test with screen readers

### Language Attribute

```html
<html lang="hi">
```

The `lang` attribute should be updated when language changes:

```typescript
useEffect(() => {
  document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

## Future Enhancements

### Phase 2
- **Arabic Support**: RTL layout support
- **Voice Input**: Voice search in multiple languages
- **Auto-translate**: Machine translation for menu items
- **Language-specific formatting**: Date, time, currency

### Phase 3
- **User-generated translations**: Community contributions
- **Translation marketplace**: Professional translation services
- **A/B testing**: Test different translations
- **Analytics**: Track language usage patterns

## Troubleshooting

### Missing Translations

If translations are missing:
1. Check the translation file exists
2. Verify the key path is correct
3. Check for typos in the key
4. Ensure the language code is correct

### Language Not Persisting

If language preference is not saved:
1. Check localStorage is enabled
2. Verify the key `brewhub-language` is set
3. Check browser privacy settings
4. Clear browser cache and retry

### Text Overflow

If text overflows in certain languages:
1. Use `line-clamp` for multi-line text
2. Adjust font sizes for different languages
3. Use responsive typography
4. Test with longest translations

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Language Detector](https://github.com/i18next/i18next-browser-languageDetector)
- [Translation Best Practices](https://www.i18next.com/principles/translation-best-practices)

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: ✅ Production Ready  
**Languages Supported**: 6 (English, Hindi, Tamil, Telugu, Kannada, Malayalam)
