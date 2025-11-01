# DeyaRun - Running & Fitness Platform

**Version:** v1.17.124
**Status:** Production Ready
**Last Updated:** 2025-11-01

DeyaRun is a comprehensive running and fitness platform with real-time activity tracking, personalized training plans, and seamless integration with popular fitness services (Strava, Google Fit).

---

## Quick Overview

| Component | Technology | Status | Version |
|-----------|-----------|--------|---------|
| Backend API | Node.js + Express + MongoDB | ✅ Production | v1.17.124 |
| Web Frontend | Next.js 14 + TypeScript | ✅ Production | v1.17.117 |
| Mobile App | Kotlin/Android Native | ✅ Active Development | - |
| Database | MongoDB Atlas | ✅ Production | - |
| Deployment | Coolify (Self-hosted) | ✅ Production | - |

---

## Project Structure

```
deyarun/
├── backend/                   # Node.js/Express API
│   ├── config/               # Database, Firebase, Strava configs
│   ├── middleware/           # Auth, security, caching
│   ├── models/mongodb/       # Mongoose schemas
│   ├── routes/               # API endpoints (30+ files)
│   ├── services/             # Business logic
│   ├── scripts/              # Version management, utilities
│   ├── docs/                 # API documentation
│   │   ├── openapi.yaml     # OpenAPI spec
│   │   └── PERFORMANCE_SECURITY.md
│   ├── .env.example          # Environment template (200+ lines)
│   ├── Dockerfile            # Container configuration
│   └── server.js             # Application entry point
│
├── frontend/
│   ├── web/                  # Next.js web application
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (auth, theme)
│   │   ├── pages/           # Next.js pages
│   │   ├── e2e/             # Playwright tests
│   │   ├── .env.example     # Environment template
│   │   └── Dockerfile       # Container configuration
│   │
│   └── Mobile/              # Kotlin/Android native app
│       ├── app/             # Android app module
│       ├── gradle/          # Gradle configuration
│       ├── build.gradle.kts # Build configuration
│       └── README.md        # Mobile setup guide
│
├── .git/                     # Git repository
├── README.md                 # This file
├── CLAUDE.md                 # AI development rules
├── SETUP_GUIDE.md           # Detailed setup instructions
├── ARCHITECTURE.md          # System architecture
├── API_DOCUMENTATION.md     # API reference
├── DEPLOYMENT.md            # Deployment guide
└── INTEGRATIONS.md          # External services setup
```

---

## Key Features

### Backend
- **Authentication**: JWT + Firebase Auth (Google OAuth)
- **Database**: MongoDB with Mongoose ORM
- **Integrations**: Strava API, Google Fit API
- **Security**: Helmet, CORS, rate limiting, input validation
- **Monitoring**: Sentry error tracking
- **Caching**: Redis-like in-memory caching
- **Performance**: Optimized database queries, connection pooling

### Web Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth + JWT cookies
- **Maps**: Google Maps integration
- **Testing**: Playwright E2E tests
- **State Management**: React Context API
- **Monitoring**: Sentry, LogRocket

### Mobile App
- **Platform**: Android (Kotlin)
- **Architecture**: MVVM pattern
- **Features**: GPS tracking, workout recording, analytics
- **Deployment**: Google Play Internal Testing

---

## Quick Start

### Prerequisites
- **Node.js** 20+ (LTS recommended)
- **MongoDB Atlas** account (or local MongoDB)
- **Firebase** project (for auth & push notifications)
- **Android Studio** (for mobile development)
- **Git** for version control

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd deyarun

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# 3. Frontend web setup (new terminal)
cd frontend/web
npm install
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev

# 4. Mobile setup (Android Studio)
# Open frontend/Mobile in Android Studio
# See frontend/Mobile/README.md for detailed instructions
```

### Verify Installation

```bash
# Backend health check
curl http://localhost:3001/health

# Web frontend
open http://localhost:3000
```

---

## Environment Configuration

### Backend (.env)
```env
# Database
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/deyarun"

# Authentication
JWT_SECRET="your-secret-key-64-chars-min"
SESSION_SECRET="your-session-secret"

# Server
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# Firebase
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"

# Integrations
STRAVA_CLIENT_ID="your-strava-client-id"
STRAVA_CLIENT_SECRET="your-strava-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
GOOGLE_MAPS_API_KEY="your-maps-api-key"
```

See `backend/.env.example` for complete configuration (200+ documented variables).

### Frontend Web (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
```

See `frontend/web/.env.example` for complete configuration.

---

## API Endpoints

### Base URLs
- **Development**: `http://localhost:3001`
- **Production**: `https://api.deyarun.com`

### Authentication
```bash
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
POST /api/auth/logout      # Logout
```

### Workouts
```bash
GET    /api/workouts           # List user workouts
POST   /api/workouts           # Create workout
GET    /api/workouts/:id       # Get workout details
PUT    /api/workouts/:id       # Update workout
DELETE /api/workouts/:id       # Delete workout
```

### Integrations
```bash
GET  /api/strava/auth          # Strava OAuth
POST /api/strava/sync          # Sync Strava activities
GET  /api/google-fit/auth      # Google Fit OAuth
POST /api/google-fit/sync      # Sync Google Fit data
```

### Health Checks
```bash
GET /health                    # Comprehensive health check
GET /health-simple             # Simple health check
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

---

## Deployment

### Production Deployment (Coolify)
- **Backend API**: `https://api.deyarun.com`
- **Web Frontend**: `https://deyarun.com`
- **Auto-deploy**: Push to `main` branch triggers deployment

### Mobile Deployment
- **Platform**: Google Play Internal Testing
- **Process**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

---

## Development Workflow

### Version Management (CRITICAL)
```bash
# ALWAYS update version before commit
node scripts/update-version.js patch   # Bug fixes
node scripts/update-version.js minor   # New features
node scripts/update-version.js major   # Breaking changes

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin main
```

### Code Quality
```bash
# Backend
cd backend
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix issues
npm test                  # Run tests

# Frontend Web
cd frontend/web
npm run lint              # Next.js linting
npm run test              # Playwright tests
```

### Testing
```bash
# Backend API tests
cd backend
npm test

# Frontend E2E tests
cd frontend/web
npm run test              # Playwright tests
npm run test:ui           # Interactive mode
```

---

## External Services & Integrations

### Required Services
1. **MongoDB Atlas** - Primary database ([Setup Guide](https://cloud.mongodb.com))
2. **Firebase** - Auth, FCM, Analytics ([Setup Guide](https://console.firebase.google.com))
3. **Google Cloud** - Maps, OAuth, Fit API ([Setup Guide](https://console.cloud.google.com))

### Optional Services
4. **Strava API** - Activity sync ([Developer Portal](https://developers.strava.com))
5. **SendGrid** - Transactional emails ([API Keys](https://app.sendgrid.com))
6. **Sentry** - Error tracking ([Dashboard](https://sentry.io))

See [INTEGRATIONS.md](INTEGRATIONS.md) for detailed setup instructions.

---

## Security & Compliance

### Security Features
- **Authentication**: JWT tokens + httpOnly cookies
- **Password Security**: Bcrypt hashing (12 rounds)
- **API Security**: Helmet headers, CORS, rate limiting
- **Input Validation**: express-validator on all inputs
- **NoSQL Injection Protection**: Mongoose parameterization

### GDPR Compliance
- All personal/health data encrypted at rest + in transit
- Data minimization principle applied
- User data export/deletion support
- Privacy-first architecture

---

## Performance

### Optimization Features
- **Database**: Connection pooling, query optimization, indexes
- **Caching**: In-memory LRU cache with intelligent invalidation
- **API**: Response compression, pagination
- **Monitoring**: Real-time performance metrics

### Performance Targets
- Response time: < 500ms average
- Error rate: < 1%
- Uptime: 99.9%

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB URI in .env
# Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for Coolify)
```

**CORS Errors**
```bash
# Add frontend domain to CORS_ORIGIN in backend/.env
CORS_ORIGIN="https://deyarun.com,http://localhost:3000"
```

**Firebase Auth Not Working**
```bash
# Verify Firebase config in both backend/.env and frontend/web/.env.local
# Check Firebase console for project settings
```

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | This file - project overview |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Detailed installation instructions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture & design |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Complete API reference |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |
| [INTEGRATIONS.md](INTEGRATIONS.md) | External services setup |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow & standards |
| [backend/README.md](backend/README.md) | Backend-specific documentation |
| [frontend/Mobile/README.md](frontend/Mobile/README.md) | Mobile app documentation |

---

## Project Context

### AI Development
- **Claude Integration**: See [CLAUDE.md](CLAUDE.md) for AI development rules
- **Archon Project ID**: `c0bdedf6-772c-44e1-a5e1-89f1b4d4c8b8`

### Version History
- **v1.17.124** (2025-11-01) - Backend cleanup, documentation improvements
- **v1.17.117** (2025-11-01) - Frontend web updates
- Focus: Native Android mobile development, Strava/Google Fit integrations

---

## Support & Resources

### Repository
- **GitHub**: (Add your repository URL here)
- **Issues**: Report bugs via GitHub Issues

### Contact
- **Email**: support@deyarun.com
- **Project Owner**: (Add owner contact)

---

## License

(Add your license information here)

---

**Last Updated**: 2025-11-01
**Maintained By**: Development Team
**Current Version**: Backend v1.17.124 | Web v1.17.117

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
