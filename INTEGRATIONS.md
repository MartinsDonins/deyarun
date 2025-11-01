# DeyaRun - External Integrations Setup

Complete guide for configuring all external services and integrations used by DeyaRun.

---

## Table of Contents

1. [MongoDB Atlas](#mongodb-atlas)
2. [Firebase](#firebase)
3. [Google Cloud Platform](#google-cloud-platform)
4. [Strava API](#strava-api)
5. [SendGrid Email](#sendgrid-email)
6. [Sentry Error Tracking](#sentry-error-tracking)
7. [Testing Integrations](#testing-integrations)

---

## MongoDB Atlas

MongoDB Atlas is the primary database for all application data.

### Setup Steps

#### 1. Create Account & Cluster

1. Go to https://cloud.mongodb.com/
2. Sign up or log in
3. Click "Build a Database"
4. Choose tier:
   - **Development**: M0 (Free)
   - **Production**: M10 or higher (Recommended: M10 for ~$57/month)
5. Select region: Choose closest to your users
6. Cluster Name: `deyarun-production`
7. Click "Create Cluster"

#### 2. Configure Network Access

1. Security → Network Access → Add IP Address
2. For development: Allow from anywhere (0.0.0.0/0)
3. For production: Add Coolify server IP + 0.0.0.0/0 (for backups)

#### 3. Create Database User

1. Security → Database Access → Add New Database User
2. Authentication Method: Password
3. Username: `deyarun_app`
4. Password: Generate strong password (save securely!)
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

#### 4. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Node.js
4. Version: 6.0 or later
5. Copy connection string:
   ```
   mongodb+srv://deyarun_app:<password>@cluster.mongodb.net/deyarun?retryWrites=true&w=majority
   ```
6. Replace `<password>` with actual password
7. Add to `.env`:
   ```env
   MONGODB_URI="mongodb+srv://deyarun_app:YOUR_PASSWORD@cluster.mongodb.net/deyarun?retryWrites=true&w=majority"
   ```

#### 5. Create Database & Collections

Collections are created automatically by Mongoose on first use:
- `users`
- `workouts`
- `trainingplans`
- `achievements`
- `courses`

#### 6. Enable Backups (Production)

1. Cluster → Backup
2. Enable Continuous Cloud Backup
3. Configure retention policy (default: 7 days)

### Connection Verification

```bash
# Test connection from backend
cd backend
npm run dev

# Check logs for:
# ✅ MongoDB connected successfully
```

---

## Firebase

Firebase provides authentication, push notifications, and analytics.

### Required Services
- **Authentication** - User login (Email/Password, Google OAuth)
- **Cloud Messaging (FCM)** - Push notifications
- **Analytics** - User behavior tracking
- **Crashlytics** - Error reporting (mobile)

### Setup Steps

#### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Project name: `DeyaRun Production`
4. Enable/Disable Google Analytics (recommended: enable)
5. Choose Analytics account or create new
6. Click "Create project"

#### 2. Enable Authentication

1. Build → Authentication → Get Started
2. Sign-in method → Enable:
   - **Email/Password** ✓
   - **Google** ✓
3. For Google sign-in:
   - Click "Google"
   - Enable toggle
   - Project support email: your-email@example.com
   - Save

#### 3. Generate Service Account Key (Backend)

1. Project Settings (⚙️) → Service Accounts
2. Click "Generate new private key"
3. Save `serviceAccountKey.json` securely
4. Extract values to backend `.env`:

```env
FIREBASE_PROJECT_ID="deyarun-production"
FIREBASE_PRIVATE_KEY_ID="abc123..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@deyarun-production.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="123456789..."
FIREBASE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
FIREBASE_TOKEN_URI="https://oauth2.googleapis.com/token"
FIREBASE_AUTH_PROVIDER_X509_CERT_URL="https://www.googleapis.com/oauth2/v1/certs"
FIREBASE_CLIENT_X509_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40deyarun-production.iam.gserviceaccount.com"
FIREBASE_UNIVERSE_DOMAIN="googleapis.com"
```

#### 4. Get Web App Config (Frontend)

1. Project Settings → General
2. Your apps → Add app → Web (</> icon)
3. App nickname: `DeyaRun Web`
4. Firebase Hosting: No (using Coolify)
5. Copy config to frontend `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="deyarun-production.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="deyarun-production"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="deyarun-production.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXX"
```

#### 5. Enable Cloud Messaging (Push Notifications)

1. Project Settings → Cloud Messaging
2. Click "Manage Service Accounts" (opens Google Cloud Console)
3. Enable "Cloud Messaging API"
4. Server Key available in Firebase Console → Cloud Messaging

#### 6. Add Mobile App (Android)

1. Project Settings → Add app → Android
2. Android package name: `com.deyarun.app` (from `build.gradle.kts`)
3. Download `google-services.json`
4. Place in `frontend/Mobile/app/`
5. Follow Firebase Android setup guide

### Testing Firebase

```bash
# Backend: Test Firebase Admin SDK
cd backend
npm run dev

# Check logs for:
# ✅ Firebase initialized successfully

# Frontend: Test Firebase Auth
cd frontend/web
npm run dev
# Open http://localhost:3000
# Try registering/logging in
```

---

## Google Cloud Platform

Google Cloud provides Maps, OAuth, and Google Fit APIs.

### Required APIs
- **Maps JavaScript API** - Map display
- **Geocoding API** - Address to coordinates
- **Places API** - Location search
- **Fitness API** - Google Fit integration
- **OAuth 2.0** - Google sign-in

### Setup Steps

#### 1. Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Select or create project: `DeyaRun`
3. Billing: Link billing account (required for APIs)

#### 2. Enable APIs

1. APIs & Services → Library
2. Search and enable:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Fitness API
   - Google+ API (for OAuth)

#### 3. Create API Key (Maps)

1. APIs & Services → Credentials
2. Create Credentials → API Key
3. Copy key immediately
4. Click "Restrict Key":
   - Application restrictions: HTTP referrers
   - Website restrictions:
     ```
     https://deyarun.com/*
     https://www.deyarun.com/*
     http://localhost:3000/*
     ```
   - API restrictions: Restrict key
   - Select APIs:
     - Maps JavaScript API
     - Geocoding API
     - Places API
5. Save
6. Add to frontend `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
   ```

#### 4. Create OAuth 2.0 Client (Google Sign-In)

1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Configure consent screen (if not done):
   - User Type: External
   - App name: DeyaRun
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
   - Save and continue
   - Scopes: Add:
     - `openid`
     - `profile`
     - `email`
   - Test users: Add your email
   - Save
4. Back to Create OAuth client ID:
   - Application type: Web application
   - Name: `DeyaRun Web`
   - Authorized JavaScript origins:
     ```
     https://deyarun.com
     https://www.deyarun.com
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     https://api.deyarun.com/api/auth/google/callback
     http://localhost:3001/api/auth/google/callback
     ```
5. Copy Client ID and Secret
6. Add to backend `.env`:
   ```env
   GOOGLE_CLIENT_ID="123456789-abc...apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-abc..."
   ```

#### 5. Configure Google Fit Integration

1. Use same OAuth client from step 4
2. Add additional redirect URI:
   ```
   https://api.deyarun.com/api/google-fit/callback
   http://localhost:3001/api/google-fit/callback
   ```
3. Add scopes in OAuth consent screen:
   - `https://www.googleapis.com/auth/fitness.activity.read`
   - `https://www.googleapis.com/auth/fitness.body.read`
   - `https://www.googleapis.com/auth/fitness.location.read`
   - `https://www.googleapis.com/auth/fitness.nutrition.read`
4. Add test users (while app in testing mode)

#### 6. Enable Production Access

1. OAuth consent screen → PUBLISH APP
2. Submit for verification (if needed)
3. Or keep in testing mode with limited users

---

## Strava API

Strava integration allows users to sync running/cycling activities.

### Setup Steps

#### 1. Create Strava App

1. Go to https://www.strava.com/settings/api
2. Click "Create App"
3. Fill in details:
   - **Application Name**: DeyaRun
   - **Category**: Health & Fitness
   - **Club**: (optional)
   - **Website**: https://deyarun.com
   - **Application Description**: Running and fitness tracking platform
   - **Authorization Callback Domain**: `api.deyarun.com,localhost`
4. Agree to terms
5. Create

#### 2. Get API Credentials

1. After creation, note:
   - **Client ID**: 123456
   - **Client Secret**: abc123...
2. Add to backend `.env`:
   ```env
   STRAVA_CLIENT_ID="123456"
   STRAVA_CLIENT_SECRET="abc123..."
   ```

#### 3. Configure OAuth Redirect

Backend handles OAuth automatically:
- Auth endpoint: `GET /api/strava/auth`
- Callback: `GET /api/strava/callback`

No additional configuration needed.

#### 4. Set Webhook (Optional - Real-time Updates)

1. Strava API Settings → Webhook Events Subscription
2. Callback URL: `https://api.deyarun.com/api/strava/webhook`
3. Verify Token: (generate random string, save in `.env`)
   ```env
   STRAVA_WEBHOOK_VERIFY_TOKEN="random-secret-token"
   ```

### Testing Strava

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Open browser
open http://localhost:3001/api/strava/auth

# 3. Authorize app on Strava
# 4. Check backend logs for successful token exchange
# 5. Test sync:
curl -X POST http://localhost:3001/api/strava/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## SendGrid Email

SendGrid handles transactional emails (welcome, password reset, notifications).

### Setup Steps

#### 1. Create SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Verify email address

#### 2. Sender Authentication

1. Settings → Sender Authentication
2. Authenticate Your Domain (recommended):
   - Domain: `deyarun.com`
   - Follow DNS setup instructions
   - Add DNS records to domain registrar
   - Verify domain
3. Or Single Sender Verification:
   - From Email: `noreply@deyarun.com`
   - Reply To: `support@deyarun.com`
   - Verify email

#### 3. Create API Key

1. Settings → API Keys → Create API Key
2. API Key Name: `DeyaRun Backend`
3. API Key Permissions: Full Access (or Restricted: Mail Send)
4. Copy API key immediately (shown only once!)
5. Add to backend `.env`:
   ```env
   SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
   FROM_EMAIL="noreply@deyarun.com"
   FROM_NAME="DeyaRun"
   ADMIN_EMAIL="support@deyarun.com"
   ```

#### 4. Email Templates (Optional)

1. Email API → Dynamic Templates
2. Create templates for:
   - Welcome email
   - Password reset
   - Weekly summary
3. Note template IDs:
   ```env
   SENDGRID_TEMPLATE_WELCOME="d-abc123..."
   SENDGRID_TEMPLATE_PASSWORD_RESET="d-def456..."
   ```

### Testing SendGrid

```bash
# Test email sending
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"Test","text":"Test email"}'

# Check SendGrid Activity Feed:
# https://app.sendgrid.com/email_activity
```

---

## Sentry Error Tracking

Sentry provides real-time error tracking and performance monitoring.

### Setup Steps

#### 1. Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up (free tier available)
3. Create organization: `DeyaRun`

#### 2. Create Projects

Create separate projects for each component:

**Backend:**
1. Projects → Create Project
2. Platform: Node.js
3. Project name: `deyarun-backend`
4. Copy DSN: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
5. Add to backend `.env`:
   ```env
   SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
   ```

**Frontend Web:**
1. Projects → Create Project
2. Platform: Next.js
3. Project name: `deyarun-web`
4. Copy DSN
5. Add to frontend `.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
   ```

**Mobile (optional):**
1. Platform: Android
2. Project name: `deyarun-mobile`
3. Follow Android setup guide

#### 3. Configure Alerts

1. Alerts → Create Alert Rule
2. Conditions:
   - New issue created
   - Error rate exceeds threshold
3. Actions:
   - Send email
   - Send Slack notification (if configured)

### Testing Sentry

```bash
# Backend: Trigger test error
curl http://localhost:3001/api/test-sentry-error

# Frontend: Open browser console
window.Sentry.captureException(new Error('Test error'));

# Check Sentry dashboard for errors
```

---

## Integration Checklist

Use this checklist to verify all integrations are configured:

### Database
- [ ] MongoDB Atlas cluster created
- [ ] Network access configured (IP whitelist)
- [ ] Database user created with read/write permissions
- [ ] Connection string added to `.env`
- [ ] Connection tested successfully

### Firebase
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password, Google)
- [ ] Service account key generated (backend)
- [ ] Web app config copied (frontend)
- [ ] Cloud Messaging enabled
- [ ] Android app added (mobile)

### Google Cloud
- [ ] Google Cloud project created
- [ ] APIs enabled (Maps, Geocoding, Places, Fitness)
- [ ] Maps API key created and restricted
- [ ] OAuth client created with correct redirect URIs
- [ ] Google Fit scopes added
- [ ] Test users added (if in testing mode)

### Strava
- [ ] Strava app created
- [ ] Client ID and Secret saved
- [ ] Callback domain configured
- [ ] OAuth flow tested

### SendGrid
- [ ] SendGrid account created
- [ ] Sender authentication configured
- [ ] API key created
- [ ] Test email sent successfully

### Sentry
- [ ] Sentry organization created
- [ ] Backend project created with DSN
- [ ] Frontend project created with DSN
- [ ] Test errors sent successfully
- [ ] Alerts configured

---

## Testing All Integrations

### End-to-End Integration Test

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Start frontend
cd frontend/web
npm run dev

# 3. Open app
open http://localhost:3000

# 4. Test flow:
# - Register with email (SendGrid + Firebase)
# - Login
# - Connect Strava (Strava OAuth)
# - Connect Google Fit (Google OAuth)
# - Sync activities
# - View on map (Google Maps)
# - Check Sentry for errors (should be none)
# - Verify data in MongoDB Atlas
```

---

## Security Best Practices

### API Keys & Secrets
- ✅ Store in `.env` (never commit to git)
- ✅ Use different keys for dev/prod
- ✅ Restrict keys by domain/IP
- ✅ Rotate keys periodically (every 90 days)

### OAuth
- ✅ Use HTTPS in production
- ✅ Validate redirect URIs
- ✅ Store tokens encrypted
- ✅ Implement token refresh

### Database
- ✅ Use strong passwords (16+ chars)
- ✅ Enable IP whitelist
- ✅ Regular backups
- ✅ Monitor access logs

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection with mongosh
mongosh "mongodb+srv://..."

# Common issues:
# - IP not whitelisted → Add IP in Network Access
# - Wrong password → Reset user password
# - Connection timeout → Check firewall/network
```

### Firebase Auth Not Working
```bash
# Check Firebase console logs
# Common issues:
# - API key mismatch → Verify FIREBASE_API_KEY
# - Domain not authorized → Add to Authorized domains
# - Wrong project → Verify PROJECT_ID
```

### Google Maps Not Loading
```bash
# Check browser console for errors
# Common issues:
# - API key not restricted correctly
# - Billing not enabled on Google Cloud
# - Referrer not authorized
```

---

**Last Updated**: 2025-11-01
**Review Frequency**: Quarterly (or when services update)
