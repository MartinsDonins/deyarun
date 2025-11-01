# Language Selection Implementation - DeyaRun Mobile V2

## Overview
This document describes the language selection feature implementation for the DeyaRun Android mobile application.

## Supported Languages
- **Latvian (LV)** - Default language
- **English (EN)**

## Implementation Components

### 1. String Resources
- **Location**: `app/src/main/res/`
- **Files**:
  - `values/strings.xml` - English strings (default)
  - `values-lv/strings.xml` - Latvian strings

### 2. Language Preference Manager
- **File**: `data/storage/LanguagePreferenceManager.kt`
- **Responsibilities**:
  - Store and retrieve language preference using SharedPreferences
  - Provide StateFlow for reactive language updates
  - Validate language codes
  - Default language: Latvian (lv)

### 3. Language Helper
- **File**: `utils/LanguageHelper.kt`
- **Responsibilities**:
  - Apply locale to Context and Activity
  - Update app locale at runtime
  - Support both old and new Android API versions
  - Provide utility functions for locale management

### 4. Language Selector UI Component
- **File**: `presentation/components/LanguageSelector.kt`
- **Features**:
  - Card-based language selector
  - Dialog for language selection
  - Visual indication of current language
  - Material Design 3 styling

### 5. Profile Integration
- **File**: `presentation/profile/ProfileEditScreen.kt`
- **Changes**:
  - Added LanguageSelector component
  - Integrated language change logic
  - Activity recreation on language change

### 6. MainActivity Initialization
- **File**: `MainActivity.kt`
- **Changes**:
  - Apply saved language preference on app start
  - Override `attachBaseContext()` for proper locale initialization
  - Ensure consistent language across app sessions

## Usage

### User Flow
1. Open Profile/Settings screen
2. Scroll to "Valoda / Language" section
3. Tap on language selector card
4. Select desired language (Latvian or English)
5. App recreates activity to apply changes immediately

### Developer Usage

#### Get Current Language
```kotlin
val languagePreferenceManager = LanguagePreferenceManager(context)
val currentLanguage = languagePreferenceManager.getCurrentLanguage() // "lv" or "en"
```

#### Change Language
```kotlin
languagePreferenceManager.setLanguage("en") // or "lv"
```

#### Apply Language to Activity
```kotlin
LanguageHelper.updateActivityLocale(activity, "lv")
LanguageHelper.recreateActivity(activity)
```

## Technical Details

### SharedPreferences Storage
- **Preference Name**: `language_preferences`
- **Key**: `language_code`
- **Values**: `"lv"` or `"en"`

### Android API Compatibility
- **API 24+ (Android N+)**: Runtime locale changes supported
- **API < 24**: Activity recreation required for best results

### String Resource Naming Convention
- Use descriptive names with category prefixes
- Examples:
  - `login_title` - Authentication related
  - `nav_dashboard` - Navigation related
  - `dashboard_welcome` - Dashboard specific
  - `language_settings` - Language settings

## Future Enhancements
1. Add more languages (e.g., Russian, German)
2. Automatic language detection based on device locale
3. In-app language preview without restart
4. Language-specific formatting (dates, numbers)

## Testing Checklist
- [x] Language preference is persisted across app restarts
- [x] UI updates immediately after language change
- [x] All screens show correct language strings
- [x] Default language (Latvian) works on first app launch
- [x] Language selection dialog displays both options
- [x] ProfileEditScreen shows current language correctly

## File Structure
```
app/src/main/
├── java/com/deyarun/mobile/
│   ├── data/storage/
│   │   └── LanguagePreferenceManager.kt
│   ├── utils/
│   │   └── LanguageHelper.kt
│   ├── presentation/
│   │   ├── components/
│   │   │   └── LanguageSelector.kt
│   │   └── profile/
│   │       └── ProfileEditScreen.kt (modified)
│   └── MainActivity.kt (modified)
└── res/
    ├── values/
    │   └── strings.xml (English - default)
    └── values-lv/
        └── strings.xml (Latvian)
```

## Version
- **Implemented in**: v1.17.97
- **Feature Code**: MOBILE-049
- **Date**: October 8, 2025
