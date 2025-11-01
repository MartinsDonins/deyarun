# DeyaRun Backend API

**Project:** Running Academy / DeyaRun
**Version:** 1.17.124
**Node.js:** 20+ (Alpine 3.18)
**Framework:** Express.js
**Database:** MongoDB (Mongoose ORM)
**Deployment:** Coolify (Production)

---

## Quick Start

### Prerequisites
- Node.js 20+ installed
- MongoDB Atlas account (or local MongoDB)
- Environment variables configured (.env file)

### Installation

```bash
# Install dependencies
cd backend && npm install

# Copy environment template
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Start production server
npm start
```

### Verify Installation
```bash
curl http://localhost:3001/health
# Expected: {"status":"healthy","timestamp":"..."}
```

---

## Architecture Overview

### Design Pattern: Route → Controller → Service → Model

```
Routes (endpoints) → Controllers (HTTP) → Services (logic) → Models (database)
```

### Key Technologies

| Technology | Purpose |
|------------|---------|
| Express.js | Web framework |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| Bcrypt | Password hashing (12 rounds) |
| Helmet | Security headers |
| Sentry | Error tracking |
| Firebase Admin | Push notifications |

### Architecture Principles
1. **Separation of Concerns**: Clear layer boundaries
2. **Async/Await**: All async operations use try/catch (466 blocks)
3. **Security-First**: Helmet, CORS, rate limiting, validation
4. **Monitoring**: Sentry integration, health checks

---

## Directory Structure

```
backend/
├── config/              # Configuration files
│   ├── database.js     # MongoDB connection
│   ├── passport.js     # Auth strategies
│   ├── sentry.js       # Error tracking
│   └── strava.js       # Strava API
│
├── middleware/          # Express middleware
│   ├── adminMiddleware.js
│   ├── authMiddleware.js
│   ├── cacheMiddleware.js
│   ├── errorHandler.js
│   ├── rateLimitMiddleware.js
│   └── securityMiddleware.js
│
├── models/mongodb/      # Mongoose schemas
│   ├── user/
│   ├── training/
│   ├── course/
│   └── settings/
│
├── routes/              # API endpoints (30+ files)
│   ├── auth.js
│   ├── workouts.js
│   ├── trainingPlans.js
│   ├── stravaAuth.js
│   ├── googleFit.js
│   └── admin.js
│
├── services/            # Business logic
│   ├── achievementService.js
│   ├── aiTrainingService.js
│   ├── stravaService.js
│   ├── googleFitService.js
│   ├── notificationService.js
│   └── trainingPlanGenerator.js
│
├── scripts/             # Development tools
│   ├── update-version.js
│   └── sync-versions.js
│
├── .env.example        # Environment template (200+ lines)
├── .eslintrc.js        # Code quality rules
├── Dockerfile          # Container configuration
├── server.js           # Application entry point
└── README.md           # This file
```

---

## Environment Configuration

### Required Variables

See `.env.example` for complete documentation (200+ lines with detailed comments).

**Critical variables:**

```env
# Database
MONGODB_URI="mongodb+srv://..."

# Authentication
JWT_SECRET="your-secret-key-64-chars-min"
SESSION_SECRET="your-session-secret"

# Server
NODE_ENV="development"
PORT=3001
API_BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."

# Strava Integration
STRAVA_CLIENT_ID="..."
STRAVA_CLIENT_SECRET="..."

# Google Services
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_MAPS_API_KEY="..."

# Monitoring
SENTRY_DSN="..."
```

### Optional Variables
- **Email**: `SENDGRID_API_KEY`
- **AI**: `OPENAI_API_KEY`
- **Deployment**: `COOLIFY_API_TOKEN`
- **Webhooks**: `DISCORD_WEBHOOK_URL`, `SLACK_WEBHOOK_URL`

---

## API Documentation

### Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://api.runacademy.lv`

### Authentication
Protected endpoints require JWT token:
```bash
Authorization: Bearer <jwt_token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset

#### Workouts
- `GET /api/workouts` - List user workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts/:id` - Get workout details
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

#### Training Plans
- `GET /api/training-plans` - List training plans
- `POST /api/training-plans` - Create custom plan
- `POST /api/training-plans/:id/enroll` - Enroll in plan

#### Strava Integration
- `GET /api/strava/auth` - Initiate OAuth
- `GET /api/strava/callback` - OAuth callback
- `POST /api/strava/sync` - Sync activities

#### Google Fit Integration
- `GET /api/google-fit/auth` - Initiate OAuth
- `GET /api/google-fit/callback` - OAuth callback
- `POST /api/google-fit/sync` - Sync data

#### Admin Panel (Admin Only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/statistics` - System statistics
- `GET /api/admin/deployment-status` - Deployment info

#### Health Checks
- `GET /health` - Comprehensive check (with DB)
- `GET /health-simple` - Simple check (no DB)

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

### Status Codes
- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Auth required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Database Models

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (enum: ['user', 'admin', 'coach']),
  subscription: {
    plan: String,
    status: String,
    expiresAt: Date
  },
  integrations: {
    strava: { connected, accessToken, ... },
    googleFit: { connected, accessToken, ... }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Workout Model
```javascript
{
  userId: ObjectId,
  type: String (enum: ['running', 'cycling', ...]),
  date: Date,
  duration: Number (seconds),
  distance: Number (meters),
  pace: Number (min/km),
  avgHeartRate: Number,
  source: String (enum: ['manual', 'strava', 'googleFit']),
  route: GeoJSON LineString,
  createdAt: Date
}
```

### Training Plan Model
```javascript
{
  name: String,
  goal: String (enum: ['5K', '10K', 'halfMarathon', ...]),
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  duration: Number (weeks),
  weeksData: [{ weekNumber, workouts: [...] }],
  isPublic: Boolean,
  createdAt: Date
}
```

---

## Security

### Authentication Flow
1. User submits credentials
2. Password validated with bcrypt (12 rounds)
3. JWT token generated (7-day expiry)
4. Token stored in httpOnly cookie

### Security Layers
1. **Helmet.js** - Security headers (CSP, HSTS, XSS protection)
2. **CORS** - Dynamic origin validation
3. **Rate Limiting** - 100 requests / 15 minutes
4. **Input Validation** - express-validator on all inputs
5. **NoSQL Injection Protection** - Mongoose parameterization

### Password Security
- Bcrypt with 12 rounds
- Minimum 8 characters
- Reset tokens expire in 1 hour
- Brute force protection via rate limiting

---

## External Integrations

### 1. Strava API
**Purpose**: Sync running/cycling activities
**OAuth Flow**: `/api/strava/auth` → Strava authorization → `/api/strava/callback`
**Webhook**: `POST /api/strava/webhook` for real-time updates
**Docs**: https://developers.strava.com/

### 2. Google Fit API
**Purpose**: Sync health data
**OAuth Flow**: `/api/google-fit/auth` → Google authorization → callback
**Scopes**: fitness.activity.read, fitness.body.read, fitness.location.read
**Docs**: https://developers.google.com/fit

### 3. Firebase Cloud Messaging
**Purpose**: Push notifications
**Setup**: Service account JSON or environment variables
**Usage**: `notificationService.sendPushNotification(userId, { title, body })`
**Docs**: https://firebase.google.com/docs/cloud-messaging

### 4. SendGrid (Email)
**Purpose**: Transactional emails
**Use Cases**: Welcome emails, password reset, weekly reports
**Docs**: https://sendgrid.com/docs/

### 5. Sentry (Error Tracking)
**Purpose**: Production error monitoring
**Setup**: `instrument.js` loaded before app
**Dashboard**: Real-time error traces and grouping
**Docs**: https://docs.sentry.io/platforms/node/

### 6. OpenAI API (Optional)
**Purpose**: AI training plan generation
**Usage**: `aiTrainingService.generatePlan({ goal, level, weeks })`
**Docs**: https://platform.openai.com/docs/

---

## Deployment

### Production: Coolify
- **Platform**: Coolify (self-hosted PaaS)
- **Domain**: https://api.runacademy.lv
- **Auto-Deploy**: Push to `main` branch triggers deployment

### Deployment Process
```bash
# 1. Push to GitHub
git push origin main

# 2. Coolify auto-deploys:
#    - Pulls latest code
#    - Builds Docker image
#    - Runs health checks
#    - Deploys with zero downtime

# 3. Verify deployment
curl https://api.runacademy.lv/health
```

### Docker Configuration
```dockerfile
FROM node:20-alpine3.18
WORKDIR /app
RUN apk add --no-cache openssl1.1-compat curl
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3001
HEALTHCHECK CMD curl -f http://localhost:3001/health-simple || exit 1
CMD ["npm", "start"]
```

### Rollback
**Via Coolify**: Select previous deployment and redeploy
**Via Git**: `git revert HEAD && git push`

---

## Testing

### Test Files
```
testing/
├── ai-testing-app.js    # AI endpoint tests
└── loadTesting.js       # Performance tests
```

### Running Tests
```bash
npm test                  # Unit tests
npm run test:integration  # Integration tests
node testing/loadTesting.js  # Load tests
```

### Testing Checklist
- [ ] Authentication endpoints work
- [ ] Strava OAuth completes
- [ ] Google Fit OAuth completes
- [ ] Push notifications send
- [ ] Database queries < 100ms
- [ ] Health check returns 200
- [ ] Rate limiting activates

---

## Troubleshooting

### Common Issues

**MongoDB Connection Timeout**
- Verify `MONGODB_URI` correctness
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for Coolify)
- Confirm database user permissions

**JWT Token Invalid**
- Check `JWT_SECRET` matches across environments
- Verify token not expired
- Ensure `Authorization: Bearer <token>` format

**Strava OAuth Fails**
- Verify `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
- Check redirect URI in Strava app settings
- Ensure required scopes granted

**Firebase Push Notifications Not Sending**
- Verify Firebase service account JSON exists or env vars set
- Check Firebase project has Cloud Messaging enabled

**CORS Errors**
- Add frontend domain to `CORS_ORIGIN` env variable
- Format: `https://deyarun.com,https://www.deyarun.com`
- Restart backend after env change

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

### Performance Debugging
```javascript
mongoose.set('debug', true); // Enable query logging
```

---

## Development Workflow

### Daily Development
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies (if package.json changed)
npm install

# 3. Start dev server
npm run dev

# 4. Make changes...

# 5. Run linter
npm run lint

# 6. Pre-commit checks
node scripts/security-console-verification.js
node scripts/validate-imports.js

# 7. Update version (REQUIRED before commit)
node scripts/update-version.js patch

# 8. Commit with conventional format
git commit -m "feat: add new feature"

# 9. Push (triggers auto-deploy)
git push origin main
```

### Code Quality Standards (ESLint)
- ✅ No `console.log` (allows `console.warn/error`)
- ✅ No unused variables
- ✅ Prefer `const` over `let`
- ✅ Strict equality (`===`)
- ✅ No `eval()` or implied eval
- ✅ Async functions must have `try/catch`

### Commit Message Format
```
<type>: <description>

Types: feat, fix, docs, style, refactor, test, chore
```

### Version Management
- **Patch**: Bug fixes (`node scripts/update-version.js patch`)
- **Minor**: New features (`node scripts/update-version.js minor`)
- **Major**: Breaking changes (`node scripts/update-version.js major`)

---

## Additional Resources

### Internal Documentation
- **Root HANDOVER.md**: Comprehensive project guide (755 lines)
- **REPOSITORY_HANDOVER_SUMMARY.md**: Cleanup history
- **CODE_QUALITY_REPORT.md**: Quality analysis
- **scripts/README.md**: Development scripts (378 lines)
- **BRAIN/**: AI context documents

### External Links
- **Strava API**: https://developers.strava.com/
- **Google Fit API**: https://developers.google.com/fit
- **Firebase Docs**: https://firebase.google.com/docs
- **Mongoose Docs**: https://mongoosejs.com/docs/
- **Express.js**: https://expressjs.com/
- **Sentry**: https://docs.sentry.io/platforms/node/

### Support
- **GitHub**: https://github.com/MartinsDonins/runacademy_full_project
- **Archon Project ID**: c0bdedf6-772c-44e1-a5e1-89f1b4d4c8b8

---

## Changelog

**Version 1.17.124** (2025-11-01)
- Backend cleanup completed (Railway → Coolify migration)
- 15 obsolete test files removed
- backend/src/ duplicate structure deleted (2.1 MB saved)
- .env.example enhanced with 50+ new variables
- README.md created (this file)
- All Railway references updated to Coolify

---

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code quality standards
3. Update tests and documentation
4. Run pre-commit checks
5. Create Pull Request to `main`
6. Wait for CI/CD checks
7. Request code review

---

**Last Updated**: 2025-11-01
**Maintained By**: Development Team
**Backend Version**: 1.17.124
