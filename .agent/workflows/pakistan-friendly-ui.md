---
description: Pakistan-friendly UI improvements for uneducated users
---

# Pakistan-Friendly UI Improvements

This workflow makes the FixKar app accessible for uneducated/illiterate users in Pakistan.

## Step 1: Add Language Toggle to Splash Screen

Update `app/splash-screen.tsx` to:

- Show language toggle at top (EN | اردو)
- Use i18n translations
- Make toggle prominent and easy to tap

```typescript
// Add import
import { useTranslation } from "react-i18next";

// In component
const { t, i18n } = useTranslation();
const toggleLanguage = () =>
  i18n.changeLanguage(i18n.language === "en" ? "ur" : "en");
```

## Step 2: Update Role Selection Screen

File: `app/(auth)/role-selection.tsx`

Changes:

- Use `useTranslation()` hook
- Replace hardcoded English text with `t('key')` calls
- Make buttons LARGER (minimum 100x100 for icons)
- Add bigger fonts (minimum 20px for descriptions)

## Step 3: Add Category Icons with Urdu Labels

File: `constants/categories.ts` (if exists) or create

```typescript
export const CATEGORIES = [
  { id: "car_mechanic", icon: "🚗", urdu: "گاڑی کا مستری" },
  { id: "bike_mechanic", icon: "🏍️", urdu: "موٹر سائیکل" },
  { id: "electrician", icon: "⚡", urdu: "الیکٹریشن" },
  { id: "plumber", icon: "🚰", urdu: "پلمبر" },
  { id: "ac_technician", icon: "❄️", urdu: "اے سی" },
  { id: "painter", icon: "🖌️", urdu: "پینٹر" },
  { id: "carpenter", icon: "🪑", urdu: "بڑھئی" },
];
```

## Step 4: Increase Touch Targets

Update common styles:

- Minimum button height: 56px
- Minimum touch area: 48x48px
- Font size for buttons: 18px minimum

## Step 5: Add Color Coding

Use familiar colors:

- 🟢 Green = Success/Confirm (WhatsApp style)
- 🔴 Red = Cancel/Danger
- 🟡 Yellow = Warning/Pending
- 🔵 Blue = Info/Primary action

## Step 6: Add Voice Input (Optional Advanced)

For service description, add voice input option:

- Use expo-speech for text-to-speech feedback
- Consider react-native-voice for voice input

## Step 7: Test with Target Users

- Test with actual users who are not tech-savvy
- Get feedback on icon clarity
- Ensure Urdu text is readable

## Key UI Principles

1. **Icons + Text Always**: Never use icon alone
2. **Large Touch Areas**: Minimum 48x48px
3. **Simple Flow**: Max 3 clicks to complete any action
4. **Clear Feedback**: Every action shows response
5. **Error Recovery**: Easy way to go back
6. **Urdu RTL Support**: Right-to-left text direction

## Files to Update

1. `app/splash-screen.tsx` - Add language toggle
2. `app/(auth)/role-selection.tsx` - Use translations
3. `app/(auth)/onboarding.tsx` - Use translations
4. `app/(customer)/home.tsx` - Big category buttons
5. `components/ui/Button.tsx` - Increase default size
6. `constants/theme.ts` - Update font sizes

## Testing Checklist

- [ ] Language switch works on first screen
- [ ] All text is translated to Urdu
- [ ] Buttons are large enough for easy tapping
- [ ] Icons are clear and recognizable
- [ ] Payment flow is simple (JazzCash/EasyPaisa)
- [ ] Phone number login works
- [ ] Maps show Pakistani locations
