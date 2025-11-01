# DeyaRun - System Architecture

This document provides a comprehensive overview of the DeyaRun system architecture, design patterns, and technical decisions.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Web Architecture](#frontend-web-architecture)
4. [Mobile App Architecture](#mobile-app-architecture)
5. [Database Design](#database-design)
6. [External Integrations](#external-integrations)
7. [Security Architecture](#security-architecture)
8. [Performance & Caching](#performance--caching)

---

## System Overview

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Web Client    │         │  Mobile Client  │         │   Admin Panel   │
│   (Next.js)     │         │    (Kotlin)     │         │   (Next.js)     │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     │ HTTPS/REST
                                     │
                         ┌───────────▼───────────┐
                         │   Backend API         │
                         │   (Node.js/Express)   │
                         │   - JWT Auth          │
                         │   - Rate Limiting     │
                         │   - Input Validation  │
                         └───────────┬───────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
         ┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
         │   MongoDB      │  │  Firebase   │  │  External APIs  │
         │   Atlas        │  │  (Auth/FCM) │  │  (Strava/Fit)   │
         └────────────────┘  └─────────────┘  └─────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Web** | Next.js 14, TypeScript, Tailwind CSS | User interface, SSR/CSR |
| **Frontend Mobile** | Kotlin, Android SDK 34 | Native Android app |
| **Backend API** | Node.js 20, Express.js, TypeScript | Business logic, API endpoints |
| **Database** | MongoDB Atlas (Mongoose) | Primary data storage |
| **Authentication** | JWT + Firebase Auth | User authentication |
| **Caching** | In-memory LRU Cache | Performance optimization |
| **Deployment** | Coolify (Docker) | Container orchestration |
| **Monitoring** | Sentry, LogRocket | Error tracking, analytics |

---

## Backend Architecture

### Design Pattern: Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  Routes (API Endpoints) → Express Router                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    MIDDLEWARE LAYER                         │
│  Auth → Validation → Rate Limiting → Security → Caching    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                      │
│  Services → Controllers → Business Rules                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   DATA ACCESS LAYER                         │
│  Models → Mongoose Schemas → MongoDB Queries                │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
backend/
├── config/                    # Configuration files
│   ├── database.js           # MongoDB connection & pooling
│   ├── passport.js           # Authentication strategies
│   ├── sentry.js             # Error tracking config
│   └── strava.js             # Strava API config
│
├── middleware/                # Express middleware
│   ├── authMiddleware.js     # JWT verification
│   ├── adminMiddleware.js    # Admin role check
│   ├── cookieAuthMiddleware.js # Cookie-based auth
│   ├── hybridAuthMiddleware.js # JWT + Cookie auth
│   ├── securityMiddleware.js # Security headers, CORS
│   ├── rateLimitMiddleware.js # API rate limiting
│   ├── cacheMiddleware.js    # Response caching
│   ├── errorHandler.js       # Global error handling
│   └── validationMiddleware.js # Input validation
│
├── models/mongodb/            # Mongoose schemas
│   ├── user/
│   │   ├── User.js           # User model & schema
│   │   └── UserSettings.js   # User preferences
│   ├── training/
│   │   ├── Workout.js        # Workout records
│   │   ├── TrainingPlan.js   # Training plans
│   │   └── Achievement.js    # User achievements
│   ├── course/
│   │   └── Course.js         # Educational courses
│   └── settings/
│       └── SystemSettings.js # App configuration
│
├── routes/                    # API endpoints
│   ├── auth.js               # Authentication endpoints
│   ├── users.js              # User management
│   ├── workouts.js           # Workout CRUD
│   ├── trainingPlans.js      # Training plan management
│   ├── stravaAuth.js         # Strava OAuth
│   ├── googleFit.js          # Google Fit integration
│   ├── admin.js              # Admin panel APIs
│   └── health.js             # Health check endpoints
│
├── services/                  # Business logic
│   ├── achievementService.js # Achievement calculation
│   ├── aiTrainingService.js  # AI training plans
│   ├── stravaService.js      # Strava data sync
│   ├── googleFitService.js   # Google Fit data sync
│   ├── notificationService.js # Push notifications
│   ├── performanceMonitoringService.js # Performance metrics
│   └── trainingPlanGenerator.js # Training plan creation
│
├── utils/                     # Utility functions
│   ├── logger.js             # Winston logging
│   ├── validators.js         # Input validators
│   └── helpers.js            # Helper functions
│
├── scripts/                   # Development scripts
│   ├── update-version.js     # Version bumping
│   └── sync-versions.js      # Cross-platform version sync
│
├── docs/                      # API documentation
│   ├── openapi.yaml          # OpenAPI 3.0 spec
│   └── PERFORMANCE_SECURITY.md # Performance guide
│
├── server.js                  # Application entry point
├── instrument.js              # Sentry instrumentation
├── .env.example               # Environment template
└── Dockerfile                 # Container configuration
```

### Request Flow

1. **Client Request** → Express Router
2. **Security Middleware** → Helmet headers, CORS
3. **Rate Limiting** → Check request limits
4. **Authentication** → Verify JWT/Cookie
5. **Validation** → Validate input data
6. **Cache Check** → Return cached response if available
7. **Controller** → Process business logic
8. **Service Layer** → Execute business rules
9. **Database** → Query MongoDB
10. **Response** → Send JSON response
11. **Error Handling** → Catch and log errors

### Authentication Flow

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Client  │                │ Backend │                │Firebase │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │  1. Login Request        │                          │
     ├─────────────────────────>│                          │
     │  (email, password)       │                          │
     │                          │  2. Verify Credentials   │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │  3. Firebase Token       │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │  4. Generate JWT         │
     │                          │  (internal logic)        │
     │                          │                          │
     │  5. Login Response       │                          │
     │<─────────────────────────┤                          │
     │  (JWT + httpOnly cookie) │                          │
     │                          │                          │
     │  6. Authenticated Request│                          │
     ├─────────────────────────>│                          │
     │  (JWT in cookie)         │                          │
     │                          │  7. Verify JWT           │
     │                          │  (authMiddleware)        │
     │                          │                          │
     │  8. Protected Resource   │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
```

---

## Frontend Web Architecture

### Framework: Next.js 14 (App Router)

```
frontend/web/
├── app/                       # Next.js 14 App Router (if used)
│   └── (routes)
│
├── pages/                     # Next.js Pages Router
│   ├── index.tsx             # Landing page
│   ├── login.tsx             # Login page
│   ├── dashboard.tsx         # User dashboard
│   ├── workouts/             # Workout pages
│   ├── training-plans/       # Training plan pages
│   ├── profile.tsx           # User profile
│   └── api/                  # API routes (proxy)
│
├── components/                # React components
│   ├── layout/
│   │   ├── Navbar.tsx        # Navigation bar
│   │   ├── Footer.tsx        # Footer component
│   │   └── Sidebar.tsx       # Sidebar navigation
│   ├── auth/
│   │   ├── LoginForm.tsx     # Login form
│   │   └── RegisterForm.tsx  # Registration form
│   ├── dashboard/
│   │   ├── StatsCard.tsx     # Statistics cards
│   │   └── ActivityFeed.tsx  # Activity timeline
│   ├── workouts/
│   │   ├── WorkoutCard.tsx   # Workout display
│   │   ├── WorkoutForm.tsx   # Workout creation
│   │   └── WorkoutMap.tsx    # Google Maps display
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx        # Button component
│   │   ├── Input.tsx         # Input component
│   │   ├── Card.tsx          # Card component
│   │   └── Modal.tsx         # Modal dialog
│   └── shared/
│       └── LoadingSpinner.tsx # Loading indicator
│
├── contexts/                  # React Context API
│   ├── AuthContext.tsx       # Authentication state
│   ├── ThemeContext.tsx      # Theme state (light/dark)
│   └── UserContext.tsx       # User data state
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts            # Authentication hook
│   ├── useAPI.ts             # API requests hook
│   └── useWorkouts.ts        # Workouts data hook
│
├── lib/                       # Utility libraries
│   ├── firebase.ts           # Firebase client config
│   ├── api.ts                # API client (axios)
│   └── utils.ts              # Helper functions
│
├── styles/                    # Stylesheets
│   ├── globals.css           # Global styles
│   └── tailwind.css          # Tailwind imports
│
├── e2e/                       # Playwright E2E tests
│   ├── auth.spec.ts          # Auth flow tests
│   └── workouts.spec.ts      # Workout tests
│
├── public/                    # Static assets
│   ├── images/
│   └── icons/
│
├── .env.example               # Environment template
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS config
└── tsconfig.json              # TypeScript config
```

### State Management: React Context + SWR

```typescript
// Authentication Context Example
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

// Usage in components
const { user, login, logout } = useAuth();
```

### Data Fetching Strategy

- **SWR** for client-side data fetching with caching
- **getServerSideProps** for SSR when SEO required
- **getStaticProps** for static pages
- **API Routes** as proxy to backend (when needed)

---

## Mobile App Architecture

### Framework: Native Android (Kotlin)

```
frontend/Mobile/app/src/main/
├── java/com/deyarun/
│   ├── ui/                    # UI layer (Activities, Fragments)
│   │   ├── auth/
│   │   │   ├── LoginActivity.kt
│   │   │   └── RegisterActivity.kt
│   │   ├── main/
│   │   │   ├── MainActivity.kt
│   │   │   └── DashboardFragment.kt
│   │   ├── workout/
│   │   │   ├── WorkoutListFragment.kt
│   │   │   ├── WorkoutDetailActivity.kt
│   │   │   └── WorkoutRecordActivity.kt
│   │   └── profile/
│   │       └── ProfileFragment.kt
│   │
│   ├── viewmodel/             # ViewModel layer (MVVM)
│   │   ├── AuthViewModel.kt
│   │   ├── WorkoutViewModel.kt
│   │   └── ProfileViewModel.kt
│   │
│   ├── repository/            # Data layer
│   │   ├── AuthRepository.kt
│   │   ├── WorkoutRepository.kt
│   │   └── UserRepository.kt
│   │
│   ├── network/               # Network layer
│   │   ├── ApiService.kt      # Retrofit interface
│   │   ├── AuthInterceptor.kt # JWT token injection
│   │   └── NetworkModule.kt   # Dagger/Hilt module
│   │
│   ├── model/                 # Data models
│   │   ├── User.kt
│   │   ├── Workout.kt
│   │   └── TrainingPlan.kt
│   │
│   ├── utils/                 # Utilities
│   │   ├── LocationUtils.kt   # GPS tracking
│   │   ├── PrefsUtils.kt      # SharedPreferences
│   │   └── DateUtils.kt       # Date formatting
│   │
│   └── DeyaRunApplication.kt  # Application class
│
└── res/                       # Resources
    ├── layout/                # XML layouts
    ├── drawable/              # Images, icons
    ├── values/                # Strings, colors, themes
    └── navigation/            # Navigation graphs
```

### Architecture Pattern: MVVM (Model-View-ViewModel)

```
┌─────────────┐
│    View     │ (Activity/Fragment)
│  (UI Layer) │
└──────┬──────┘
       │ observes
       │ LiveData/StateFlow
┌──────▼──────┐
│  ViewModel  │ (Business Logic)
│             │
└──────┬──────┘
       │ calls
┌──────▼──────┐
│ Repository  │ (Data Layer)
│             │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│ API │ │Local│
│     │ │ DB  │
└─────┘ └─────┘
```

### Key Android Components

- **Retrofit** - HTTP client for API calls
- **Dagger/Hilt** - Dependency injection
- **LiveData/Flow** - Reactive data streams
- **Room** (optional) - Local database
- **WorkManager** - Background tasks
- **Firebase FCM** - Push notifications

---

## Database Design

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  role: String (enum: ['user', 'admin', 'coach']),
  avatar: String (URL),

  // Profile
  dateOfBirth: Date,
  gender: String,
  height: Number (cm),
  weight: Number (kg),

  // Subscription
  subscription: {
    plan: String (enum: ['free', 'premium', 'coach']),
    status: String (enum: ['active', 'cancelled', 'expired']),
    startDate: Date,
    expiresAt: Date
  },

  // Integrations
  integrations: {
    strava: {
      connected: Boolean,
      accessToken: String (encrypted),
      refreshToken: String (encrypted),
      athleteId: String,
      connectedAt: Date
    },
    googleFit: {
      connected: Boolean,
      accessToken: String (encrypted),
      refreshToken: String (encrypted),
      connectedAt: Date
    }
  },

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

#### Workouts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),

  // Workout Details
  type: String (enum: ['running', 'cycling', 'walking']),
  date: Date (indexed),
  duration: Number (seconds),
  distance: Number (meters),
  pace: Number (min/km),
  avgHeartRate: Number (bpm),
  maxHeartRate: Number (bpm),
  calories: Number,

  // Route Data
  route: {
    type: "LineString",
    coordinates: [[lng, lat], ...] // GeoJSON
  },
  elevationGain: Number (meters),

  // Source
  source: String (enum: ['manual', 'strava', 'googleFit', 'app']),
  externalId: String (Strava/Fit activity ID),

  // Metadata
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Training Plans Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  goal: String (enum: ['5K', '10K', 'halfMarathon', 'marathon', 'fitness']),
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  duration: Number (weeks),

  // Weekly Structure
  weeksData: [
    {
      weekNumber: Number,
      workouts: [
        {
          day: Number (1-7),
          type: String,
          distance: Number,
          duration: Number,
          intensity: String,
          description: String
        }
      ]
    }
  ],

  // Visibility
  isPublic: Boolean,
  createdBy: ObjectId (ref: 'User'),

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ "integrations.strava.athleteId": 1 })

// Workouts
db.workouts.createIndex({ userId: 1, date: -1 })
db.workouts.createIndex({ source: 1 })
db.workouts.createIndex({ route: "2dsphere" }) // Geospatial

// Training Plans
db.trainingPlans.createIndex({ isPublic: 1, level: 1 })
db.trainingPlans.createIndex({ createdBy: 1 })
```

---

## External Integrations

### Strava Integration Flow

```
User → Backend → Strava API
  1. User clicks "Connect Strava"
  2. Backend redirects to Strava OAuth
  3. User authorizes app
  4. Strava redirects back with auth code
  5. Backend exchanges code for access token
  6. Backend stores tokens (encrypted)
  7. Backend fetches Strava activities
  8. Backend syncs to MongoDB workouts collection
```

### Google Fit Integration Flow

```
User → Backend → Google Fit API
  1. User clicks "Connect Google Fit"
  2. Backend redirects to Google OAuth
  3. User grants fitness data permissions
  4. Google redirects with auth code
  5. Backend exchanges for access token
  6. Backend fetches fitness data
  7. Backend transforms and stores workouts
```

---

## Security Architecture

### Authentication Layers

1. **JWT Tokens** - Stateless authentication
2. **httpOnly Cookies** - XSS protection
3. **Refresh Tokens** - Long-term sessions
4. **Firebase Auth** - Social login (Google)

### Security Measures

```
┌─────────────────────────────────────────────────┐
│  INPUT VALIDATION                               │
│  - express-validator on all inputs              │
│  - Type checking with TypeScript                │
│  - SQL/NoSQL injection prevention               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  RATE LIMITING                                  │
│  - 100 requests / 15 minutes per IP             │
│  - Adaptive limits for authenticated users      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  SECURITY HEADERS (Helmet.js)                   │
│  - Content Security Policy (CSP)                │
│  - HTTP Strict Transport Security (HSTS)        │
│  - X-Frame-Options, X-Content-Type-Options      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  ENCRYPTION                                     │
│  - Passwords: bcrypt (12 rounds)                │
│  - Tokens: encrypted at rest                    │
│  - HTTPS: TLS 1.3 in production                 │
└─────────────────────────────────────────────────┘
```

---

## Performance & Caching

### Caching Strategy

```
┌─────────────────────────────────────────────────┐
│  LEVEL 1: In-Memory Cache (LRU)                 │
│  - User profiles: 10 min TTL                    │
│  - Workouts: 5 min TTL                          │
│  - Static data: 1 hour TTL                      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  LEVEL 2: Database Optimization                 │
│  - Connection pooling (max 10)                  │
│  - Query result caching                         │
│  - Lean queries (select only needed fields)     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  LEVEL 3: CDN (Future)                          │
│  - Static assets                                │
│  - Image optimization                           │
└─────────────────────────────────────────────────┘
```

### Performance Targets

- **API Response Time**: < 500ms average
- **Database Queries**: < 100ms
- **Page Load Time**: < 2s (web)
- **App Launch Time**: < 1s (mobile)

---

## Deployment Architecture

### Production Environment (Coolify)

```
┌─────────────────────────────────────────────────┐
│  Coolify (Self-hosted PaaS)                     │
│                                                 │
│  ┌─────────────┐       ┌─────────────┐         │
│  │  Backend    │       │  Frontend   │         │
│  │  Container  │       │  Container  │         │
│  │  (Node.js)  │       │  (Next.js)  │         │
│  │  Port 3001  │       │  Port 3000  │         │
│  └──────┬──────┘       └──────┬──────┘         │
│         │                     │                 │
│         └──────────┬──────────┘                 │
│                    │                            │
│              ┌─────▼─────┐                      │
│              │  Traefik  │                      │
│              │  (Proxy)  │                      │
│              └─────┬─────┘                      │
│                    │                            │
└────────────────────┼────────────────────────────┘
                     │
                     │ HTTPS
                     │
              ┌──────▼──────┐
              │   Internet  │
              └─────────────┘
```

### CI/CD Pipeline

```
Git Push → GitHub → Coolify Webhook → Build → Deploy
  1. Developer pushes to main branch
  2. GitHub triggers Coolify webhook
  3. Coolify pulls latest code
  4. Builds Docker images
  5. Runs health checks
  6. Deploys with zero downtime
  7. Sends deployment notification
```

---

## Design Decisions & Rationale

### Why MongoDB?
- **Flexible schema** - Fitness data varies by source
- **Geospatial queries** - Route/location data
- **Horizontal scaling** - Future growth
- **JSON-native** - Matches API responses

### Why Next.js?
- **SEO-friendly** - Server-side rendering
- **Performance** - Automatic code splitting
- **Developer experience** - Hot reloading, TypeScript
- **API routes** - Backend proxy when needed

### Why Native Android (Kotlin)?
- **Performance** - Better than React Native for GPS
- **Offline support** - Room database integration
- **Native features** - Better access to sensors
- **User experience** - Platform-specific UI

### Why JWT + Cookies?
- **Stateless** - No server-side session storage
- **Secure** - httpOnly cookies prevent XSS
- **Scalable** - Works across multiple servers
- **Flexible** - Supports web + mobile clients

---

**Last Updated**: 2025-11-01
**Architecture Version**: 2.0
**Review Date**: 2026-01-01
