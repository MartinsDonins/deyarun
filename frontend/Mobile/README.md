# DeyaRun Mobile - Kotlin Compose

DeyaRun running & fitness tracking mobile application built with Kotlin and Jetpack Compose.

## 📱 Current Version
- **Version**: v1.17.25 (versionCode: 325)
- **Platform**: Android (Native Kotlin)
- **UI Framework**: Jetpack Compose + Material Design 3
- **Architecture**: MVVM with StateFlow
- **Status**: ✅ Production Ready

## 🚀 Latest Deployment
- **Channel**: Google Play Internal Testing
- **Date**: 2025-01-14
- **Status**: ✅ Successfully Deployed

## ✅ Completed Features

### 🔐 Authentication System
- ✅ Real backend API integration (https://api.deyarun.com)
- ✅ JWT token management with DataStore
- ✅ Login/Logout/Registration flows
- ✅ Session persistence across app restarts
- ✅ Secure token storage

### 🧭 Navigation System
- ✅ Bottom navigation with 4 main sections:
  - 🏠 Dashboard
  - 🏃 Workouts
  - 📊 Statistics
  - 👤 Profile
- ✅ Clean UI design without "background spots"
- ✅ Proper route handling and state management

### 👤 User Profile Management
- ✅ Comprehensive user data model (50+ fields)
- ✅ Profile editing capabilities
- ✅ Image picker integration
- ✅ Permission management
- ✅ Crash-safe implementation

### 🔄 Cloud Sync Architecture
- ✅ SyncManager implementation
- ✅ Local SQLite database (Room)
- ✅ Background sync workers
- ✅ Conflict resolution strategies
- ✅ Offline-first architecture

## 🏗️ Technical Architecture

### Backend Integration
- **API Base URL**: `https://api.deyarun.com/`
- **Authentication**: JWT Bearer tokens
- **Network**: Retrofit2 + OkHttp3
- **Serialization**: Gson

### Local Storage
- **Authentication**: DataStore (encrypted preferences)
- **Database**: Room SQLite
- **File Storage**: Internal app storage

### UI Components
- **Theme**: DeyaRun custom dark theme
- **Icons**: Material Design icons
- **Navigation**: Navigation Compose
- **State Management**: StateFlow + Compose State

## 📂 Project Structure

```
app/src/main/java/com/deyarun/mobile/
├── data/
│   ├── api/           # Retrofit API interfaces
│   ├── local/         # Room database
│   ├── model/         # Data classes
│   ├── repository/    # Repository pattern
│   ├── storage/       # DataStore & preferences
│   └── sync/          # Cloud sync logic
├── presentation/
│   ├── auth/          # Login/Registration screens
│   ├── dashboard/     # Main dashboard
│   ├── navigation/    # Bottom navigation
│   ├── profile/       # Profile management
│   ├── splash/        # Splash screen
│   ├── statistics/    # Stats & analytics
│   ├── theme/         # UI theme & colors
│   ├── viewmodel/     # MVVM ViewModels
│   └── workout/       # Workout screens
└── utils/             # Utilities & helpers
```

## 🔧 Build Configuration

### Requirements
- **Android Studio**: Latest version
- **Java**: JDK 17
- **Android SDK**: API 35 (target), API 24 (minimum)
- **Kotlin**: 1.9+

### Build Commands
```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew bundleRelease

# Run tests
./gradlew test
```

### Signing Configuration
- Release builds are automatically signed with production keystore
- AAB files ready for Google Play deployment

## 🛠️ Development Status

### ✅ Completed (v1.17.25)
1. ✅ Cloud Sync arhitektūra izveidota un integrēta
2. ✅ Labot authentication saglabāšanas problēmu
3. ✅ Atrisināt bottom navigation rādīšanas problēmu
4. ✅ Testēt aplikāciju ar autentifikācijas saglabāšanu
5. ✅ Deployment uz Internal Testing kanālu
6. ✅ Pievienot backend API datus par ielogoto lietotāju
7. ✅ Labot profils pogas crash problēmu
8. ✅ Uzlabot menu ikonu dizainu un aktīvo stāvokli

### 🔄 In Progress
- 📝 Dokumentācijas atjaunināšana

### 📋 Pending Tasks
- 📱 Cloud Sync funkcionalitātes testēšana
- ⚙️ Backend API integrācijas pārbaude

## 🚀 Deployment Information

### Google Play Console
- **Package**: `com.deyarun.mobileapp`
- **Target Track**: Internal Testing (default)
- **Signing**: Production keystore configured
- **Permissions**: Location, Internet, Network State

### Version History
- **v1.17.25**: UI bug fixes, menu icons, profile crash resolution
- **v1.17.24**: Backend API integration, real user data
- **v1.17.23**: Authentication persistence, navigation fixes
- **v1.17.22**: Initial Cloud Sync implementation

## 🔒 Security & Privacy

### Data Protection
- ✅ All user data encrypted at rest
- ✅ HTTPS-only API communications
- ✅ Local token encryption with DataStore
- ✅ No sensitive data logging

### Permissions
- `ACCESS_FINE_LOCATION`: For GPS tracking during workouts
- `ACCESS_COARSE_LOCATION`: For general location features
- `INTERNET`: API communications
- `ACCESS_NETWORK_STATE`: Network connectivity checks

## 📞 Support & Contact

For technical issues or questions regarding Mobile:
- **Project**: DeyaRun Fitness Tracking App
- **Platform**: Android Native (Kotlin + Compose)
- **Deployment**: Google Play Internal Testing

---

*Last updated: 2025-01-14 - v1.17.25*