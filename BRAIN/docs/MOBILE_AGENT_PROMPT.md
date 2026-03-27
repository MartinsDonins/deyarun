# DeyaRun Mobile Application — AI Agent Prompt

> **Purpose**: Hand this document to an AI agent to build or extend the DeyaRun mobile application.
> **Date**: 2026-03-27
> **Version reference**: Android v1.18.06 (versionCode 406)

---

## 🎯 MISSION

You are building the **DeyaRun** cross-platform mobile application — a running and fitness tracking app.
The app must work on **both Android and iOS**.

The current codebase has a **native Kotlin/Jetpack Compose Android app** (partially complete) and a **production backend API** at `https://api.deyarun.com`. There is **no iOS app yet**.

Your primary goal: **deliver a fully functional cross-platform mobile app** (Android + iOS) that satisfies all requirements listed below.

---

## 📐 TECHNOLOGY DECISION

**Recommended approach: Expo (React Native) — new cross-platform codebase**

Rationale:
- The existing Kotlin app covers Android only. iOS is missing entirely.
- Rewriting in Expo/React Native gives one codebase for both platforms.
- The production backend API is already complete — no backend work needed.
- Expo supports Google Pay, Apple Pay, GPS, camera, maps, push notifications natively.

**If the team prefers keeping the Kotlin Android app**, the agent must additionally build a **Swift/SwiftUI iOS app** as a separate project with feature parity.

**Tech stack for Expo approach:**
- Framework: **Expo SDK 52** (managed workflow)
- Language: **TypeScript**
- Navigation: **Expo Router** (file-based routing)
- State: **Zustand** + React Query (TanStack Query)
- Maps: **react-native-maps** + **expo-location**
- Payments: **react-native-purchases** (RevenueCat) for Apple Pay / Google Pay subscriptions
- Video: **expo-av** or **react-native-video**
- Auth: JWT tokens stored in **expo-secure-store**
- Push notifications: **expo-notifications** + FCM/APNs
- UI: **NativeWind** (Tailwind CSS for React Native) or custom theme

---

## 🔌 BACKEND API

**Base URL (Production):** `https://api.deyarun.com`
**Auth:** JWT Bearer token in `Authorization` header
**Response format:**
```json
{ "success": true, "data": { ... }, "message": "..." }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Key endpoints you will use:

| Feature | Method | Endpoint |
|---------|--------|----------|
| Register | POST | `/api/auth/register` |
| Login | POST | `/api/auth/login` |
| Google OAuth | POST | `/api/auth/google` |
| Get profile | GET | `/api/user/profile` |
| Update profile | PUT | `/api/user/profile` |
| Training plans | GET | `/api/training-plans` |
| Plan detail | GET | `/api/training-plans/:id` |
| Workouts | GET | `/api/workouts` |
| Create workout | POST | `/api/workouts` |
| Save route/activity | POST | `/api/workouts/complete` |
| Completed routes | GET | `/api/workouts/history` |
| Subscription plans | GET | `/api/subscriptions/plans` |
| User subscription | GET | `/api/subscriptions/my` |
| Statistics | GET | `/api/user/stats` |

> **Note**: The payments route is currently disabled on the backend (migrating to EveryPay).
> Use **RevenueCat** (react-native-purchases) to handle Apple Pay / Google Pay — it manages subscriptions natively and calls the backend to validate receipts.

---

## 📋 REQUIRED FEATURES (ALL MANDATORY)

### 1. Language Selection
- Show language picker on first app launch (before onboarding).
- Supported languages: **Latvian (lv)**, **English (en)**, **Russian (ru)**.
- Persist selection with `expo-secure-store`.
- All UI strings must use i18n (`i18next` + `react-i18next`).
- Language can be changed later in Settings.

### 2. Onboarding Slides
- 3–5 full-screen slides shown once after language selection.
- Each slide: illustration/image, headline, short description.
- "Skip" button on all slides, "Get Started" on last slide.
- After onboarding → Registration/Login screen.
- Mark `onboardingCompleted: true` in secure storage — never show again.

### 3. Registration / Authentication
Three methods must work:

**a) Email + Password**
- Fields: First name, Last name, Email, Password (min 8 chars, must include number).
- POST `/api/auth/register` → store JWT token.
- Forgot password flow: POST `/api/auth/forgot-password` → email link.

**b) Google Sign-In**
- Use `expo-auth-session` with Google OAuth.
- POST `/api/auth/google` with the Google token → get JWT.

**c) Apple Sign-In** (iOS mandatory, Android optional)
- Use `expo-apple-authentication`.
- POST `/api/auth/apple` with Apple credential → get JWT.

After auth: store JWT in `expo-secure-store`. Auto-refresh on 401.

### 4. Subscriptions & Payments

**Plans (fetch from `/api/subscriptions/plans`):**
- Free tier: access to Demo workout only.
- Premium tier: full access to all training plans.

**Payment implementation:**
- Use **RevenueCat** (`react-native-purchases`) SDK.
- On iOS: Apple Pay (in-app purchases via App Store).
- On Android: Google Pay (in-app purchases via Google Play).
- Show paywall screen when user tries to access premium content without subscription.
- Paywall must show plan price, features list, and "Subscribe" CTA.
- After successful purchase: call `/api/subscriptions/activate` to sync with backend.
- Show subscription status in Profile screen.

### 5. Demo Workout
- Available to ALL users (free + premium) without subscription.
- A single pre-defined workout with video/photo content showcasing the app.
- Fetched from backend OR hardcoded as a promotional entry.
- Must include: title, description, video/image, exercise list with reps.
- CTA at end: "Unlock all workouts — Subscribe".

### 6. Training Plans (Premium)
Training plans contain videos, photos, or GPS route workouts.

**List screen:**
- Grid/list of available training plans from `/api/training-plans`.
- Each plan card: thumbnail, title, duration, difficulty, lock icon if premium.
- Free users see plans but tapping shows paywall.

**Plan detail screen:**
- Plan overview: description, number of workouts, duration.
- Weekly schedule: list of workouts per day.
- Each workout item: tap to open workout detail.

**Workout detail screen (3 types):**

*Type A — Video/Photo workout:*
- Video player (full-screen capable) using `expo-av`.
- Exercise list below video: name, sets × reps, rest time.
- "Start workout" button → timer-based workout session screen.

*Type B — GPS Route workout:*
- Map showing the pre-planned route (polyline).
- Route stats: distance, estimated time, elevation.
- "Start route" button → Active workout tracking screen.

### 7. Active Workout / Route Tracking
This is the CORE feature — real-time GPS tracking.

**Active workout screen must show:**
- Live map with current position (blue dot) and traveled path (red/orange polyline).
- Current coordinates updated every 2 seconds via `expo-location` (high accuracy).
- Real-time stats panel:
  - ⏱ Elapsed time (counting up, HH:MM:SS)
  - 📏 Distance covered (km, 2 decimal places)
  - ⚡ Current pace (min/km)
  - 💓 Average pace (min/km)
- Pause / Resume / Stop buttons.
- On **Stop**: confirm dialog → save workout.

**On save, POST to `/api/workouts/complete`:**
```json
{
  "startTime": "ISO8601",
  "endTime": "ISO8601",
  "totalDuration": 3600000,
  "totalDistance": 5200,
  "avgPace": 360,
  "route": [
    { "lat": 56.946, "lng": 24.105, "timestamp": 1234567890, "speed": 2.5 },
    ...
  ],
  "workoutType": "run"
}
```

**Permissions required:**
- `expo-location` with `FOREGROUND` permission (show explanation dialog before requesting).
- Background location for long runs: request `BACKGROUND` permission separately.
- Location tracking must continue when screen is locked (background task via `expo-task-manager`).

### 8. Completed Routes / Activity History
Screen: list of all past workouts from `/api/workouts/history`.

**Each item in the list shows:**
- Date and time
- Total distance (km)
- Total duration (HH:MM:SS)
- Average pace (min/km)
- Map thumbnail (small static map of the route)

**Tapping a history item opens detail screen:**
- Full map with the complete route polyline.
- Full stats (distance, time, pace, calories if available).
- Option to share (image export of map + stats).
- Delete workout option.

### 9. Admin Panel Access
- Admin panel is a **web application** (Next.js) at the web frontend — NOT part of the mobile app.
- The mobile app does NOT need admin screens.
- Admins manage users, training plans, workouts, and routes via the web.

---

## 🎨 DESIGN REQUIREMENTS

**Theme:** Dark theme primary (like Strava, Nike Run Club).
**Colors:**
- Background: `#0A0A0A` (near black)
- Surface: `#1A1A1A` (dark card)
- Primary accent: `#FF4500` (orange-red — DeyaRun brand)
- Secondary accent: `#FF6B35` (lighter orange)
- Text primary: `#FFFFFF`
- Text secondary: `#9E9E9E`
- Success: `#4CAF50`
- Error: `#F44336`

**Typography:** System font (SF Pro on iOS, Roboto on Android). No custom fonts required.

**Key UX rules:**
- Bottom tab navigation with 4 tabs: Home, Workouts, History, Profile.
- All loading states must show skeleton screens or spinners — never blank screens.
- All error states must show retry button + error message.
- Haptic feedback on key actions (workout start/stop, payment success).
- Support both light and dark system theme (primary is dark, but respect system setting).

---

## 📱 NAVIGATION STRUCTURE

```
App
├── (auth)                    # Auth stack — shown if not logged in
│   ├── language-select       # Language picker (first launch only)
│   ├── onboarding            # Slides (first launch only)
│   ├── login                 # Login screen
│   ├── register              # Registration screen
│   └── forgot-password       # Forgot password
│
└── (app)                     # Main app — shown when logged in
    ├── (tabs)
    │   ├── index             # Home / Dashboard
    │   ├── workouts          # Training plans list
    │   ├── history           # Completed routes list
    │   └── profile           # User profile + settings
    │
    ├── training-plan/[id]    # Plan detail
    ├── workout/[id]          # Workout detail (video/GPS)
    ├── active-workout        # Live GPS tracking screen (full screen, no tabs)
    ├── activity/[id]         # Completed activity detail
    ├── paywall               # Subscription paywall
    └── settings/language     # Language change
```

---

## 🔒 SECURITY REQUIREMENTS

- JWT tokens stored ONLY in `expo-secure-store` — never in AsyncStorage.
- Auto-logout on token expiry (401 response).
- Certificate pinning recommended for production (optional for MVP).
- No sensitive data (tokens, user PII) in app logs.
- GDPR: provide "Delete my account" option in Profile → Settings.
  - Call `DELETE /api/user/account` — backend handles data deletion.

---

## 📦 VERSION MANAGEMENT

- App version must be defined in a single place (`app.config.ts`).
- Android `versionCode` and iOS `buildNumber` must be incremented on every build.
- Current Android version reference: `1.18.06` (versionCode 406).
- New Expo project should start at version `2.0.0` (build 1) — major version bump because of platform migration.

**`app.config.ts` structure:**
```typescript
export default {
  expo: {
    name: "DeyaRun",
    slug: "deyarun",
    version: "2.0.0",
    android: {
      versionCode: 1,
      package: "com.deyarun.mobileapp",
    },
    ios: {
      buildNumber: "1",
      bundleIdentifier: "com.deyarun.mobileapp",
    },
  },
};
```

---

## 🧪 TESTING CHECKLIST

Before marking any feature as complete, verify:

- [ ] Feature works on Android (physical device or emulator API 24+)
- [ ] Feature works on iOS (simulator iOS 16+)
- [ ] Offline state: app shows proper error, no crash
- [ ] Empty state: no data → shows empty state UI (not blank screen)
- [ ] Auth token expired: app redirects to login without crash
- [ ] GPS permission denied: shows explanation, graceful fallback
- [ ] Subscription paywall shown for premium content (free user)
- [ ] Language switch updates ALL strings immediately
- [ ] All text is translated in lv/en/ru

---

## 🚀 DEPLOYMENT TARGETS

| Platform | Store | Channel | Who approves |
|----------|-------|---------|-------------|
| Android | Google Play | Internal Testing | Auto after CI |
| iOS | App Store | TestFlight | Auto after CI |
| Production Android | Google Play | Production | Explicit human approval required |
| Production iOS | App Store | Production | Explicit human approval required |

**Build tool:** EAS Build (`eas build --platform all`)
**Submit tool:** EAS Submit (`eas submit`)

---

## ⚠️ KNOWN ISSUES / CONSTRAINTS

1. **Payments backend is disabled**: The `/api/payments` endpoint returns 503. Use RevenueCat for all payment processing — it works independently of the backend payments route.
2. **Subscriptions migrating to EveryPay**: The backend `/api/subscriptions` works for plan listing. Actual payment processing is via RevenueCat → Apple/Google → backend webhook.
3. **GPS background tracking**: Requires special handling on both platforms. iOS needs `UIBackgroundModes: location` in `app.config.ts`. Android needs foreground service notification.
4. **Apple Sign-In**: Mandatory on iOS if any other social login is offered (App Store requirement). Must be implemented.
5. **Video content**: Training plan videos are served from the backend (`/api/training-plans/:id` includes `videoUrl`). Use `expo-av` for playback with proper loading states.

---

## 📁 EXISTING CODEBASE REFERENCE

The existing Kotlin Android app is at: `frontend/Mobile/`
You may reference it for:
- API response structures (see `data/model/*.kt`)
- Business logic (see `data/repository/*.kt`)
- Existing API client setup (see `data/api/ApiClient.kt`)

Do NOT copy Kotlin code directly — use it only as reference for understanding data shapes.

The backend source is at: `backend/`
Key files:
- `backend/routes/auth.js` — auth endpoints
- `backend/routes/workouts.js` — workout endpoints
- `backend/routes/trainingPlans.js` — training plan endpoints
- `backend/routes/subscriptions.js` — subscription plan listing
- `backend/models/` — MongoDB schemas (understand data shapes)

---

## ✅ DEFINITION OF DONE

The mobile app is considered complete when:

1. ✅ App builds successfully for both Android and iOS via EAS Build
2. ✅ All 9 features listed above are implemented and tested
3. ✅ 3 languages work (lv/en/ru) across all screens
4. ✅ Auth flow works: email, Google, Apple Sign-In
5. ✅ GPS tracking works in foreground and background
6. ✅ Subscription paywall blocks premium content for free users
7. ✅ Completed routes show in history with map thumbnails
8. ✅ App submitted to Google Play Internal Testing
9. ✅ App submitted to App Store TestFlight
10. ✅ No crashes on happy path flows (verified on physical device)
