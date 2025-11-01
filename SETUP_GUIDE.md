# DeyaRun - Complete Setup Guide

This guide provides step-by-step instructions for setting up the DeyaRun development environment from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Web Setup](#frontend-web-setup)
4. [Mobile App Setup](#mobile-app-setup)
5. [External Services Configuration](#external-services-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

#### 1. Node.js (v20+ LTS)
```bash
# Check if installed
node --version  # Should be v20.x or higher
npm --version   # Should be v10.x or higher

# Install from https://nodejs.org/
# Recommended: Use nvm (Node Version Manager)
```

#### 2. Git
```bash
# Check if installed
git --version

# Install from https://git-scm.com/
```

#### 3. MongoDB Atlas Account
- Sign up at https://cloud.mongodb.com/
- Create a free M0 cluster (or paid cluster for production)
- Note your connection string

#### 4. Firebase Project
- Create project at https://console.firebase.google.com/
- Enable Authentication (Email/Password, Google)
- Enable Cloud Messaging (FCM)
- Download service account JSON

#### 5. Android Studio (for mobile development)
- Download from https://developer.android.com/studio
- Install Android SDK 34+
- Install Kotlin plugin

### Optional Tools

- **Postman/Insomnia** - API testing
- **MongoDB Compass** - Database GUI
- **VS Code** - Code editor (recommended extensions below)

#### Recommended VS Code Extensions
```
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Kotlin
```

---

## Backend Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd deyarun/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

Expected output: ~300 packages installed

### Step 3: Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Open .env in your editor
nano .env  # or code .env
```

**Minimum required configuration:**

```env
# Database (REQUIRED)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/deyarun"

# Authentication (REQUIRED)
JWT_SECRET="generate-a-strong-secret-key-at-least-64-characters-long"
SESSION_SECRET="another-strong-secret-key-at-least-64-characters-long"

# Server (REQUIRED)
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
API_BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Firebase (REQUIRED for auth)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
```

**Generate strong secrets:**
```bash
# On Linux/Mac
openssl rand -hex 64

# On Windows (PowerShell)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 4: Start Development Server

```bash
npm run dev
```

Expected output:
```
🚀 Server running on port 3001
🗄️  MongoDB connected successfully
🔐 Firebase initialized
```

### Step 5: Verify Backend

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","timestamp":"...","database":"connected"}
```

---

## Frontend Web Setup

### Step 1: Navigate to Frontend Directory

```bash
cd frontend/web
```

### Step 2: Install Dependencies

```bash
npm install
```

Expected output: ~500 packages installed

### Step 3: Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Open .env.local in your editor
nano .env.local  # or code .env.local
```

**Required configuration:**

```env
# Backend API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Firebase (must match backend Firebase project)
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"

# Google Maps (optional for local development)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-maps-api-key"

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_LOGROCKET_APP_ID="your-logrocket-id"
```

**Get Firebase config:**
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Click web app (</> icon)
4. Copy configuration values

### Step 4: Start Development Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.2.30
- Local:        http://localhost:3000
- Ready in 3.2s
```

### Step 5: Verify Frontend

```bash
# Open browser
open http://localhost:3000

# Or curl
curl http://localhost:3000
```

---

## Mobile App Setup

### Prerequisites

1. **Android Studio** installed
2. **Java JDK 17** or higher
3. **Android SDK 34** or higher

### Step 1: Open Project in Android Studio

```bash
# Navigate to mobile directory
cd frontend/Mobile

# Open in Android Studio
# File → Open → Select frontend/Mobile folder
```

### Step 2: Configure Gradle

Wait for Gradle sync to complete (may take 5-10 minutes first time).

If sync fails:
```bash
# Clean and rebuild
./gradlew clean
./gradlew build
```

### Step 3: Configure API URL

Edit `app/src/main/res/values/strings.xml` or equivalent config:

```xml
<string name="api_base_url">http://10.0.2.2:3001</string>
```

Note: `10.0.2.2` is Android emulator's way to access `localhost`

For physical device:
```xml
<string name="api_base_url">http://YOUR_COMPUTER_IP:3001</string>
```

### Step 4: Run on Emulator/Device

**Using Android Emulator:**
1. Tools → Device Manager
2. Create Virtual Device (Pixel 6, API 34+)
3. Click "Run" (green play button)

**Using Physical Device:**
1. Enable Developer Options on device
2. Enable USB Debugging
3. Connect via USB
4. Click "Run"

### Step 5: Verify Mobile App

1. App should launch on device/emulator
2. Test login screen appears
3. Check logcat for API connection logs

---

## External Services Configuration

### 1. MongoDB Atlas Setup

#### Create Cluster
1. Go to https://cloud.mongodb.com/
2. Click "Build a Database"
3. Choose FREE (M0) tier
4. Select region (closest to your users)
5. Name cluster: `deyarun-dev`

#### Configure Network Access
1. Network Access → Add IP Address
2. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
3. For production: Add specific IPs

#### Create Database User
1. Database Access → Add New Database User
2. Choose "Password" authentication
3. Username: `deyarun_user`
4. Generate strong password
5. Database User Privileges: "Read and write to any database"

#### Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string:
   ```
   mongodb+srv://deyarun_user:<password>@cluster.mongodb.net/deyarun
   ```
4. Replace `<password>` with your actual password
5. Add to backend `.env` as `MONGODB_URI`

### 2. Firebase Setup

#### Create Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: `DeyaRun Dev`
4. Disable Google Analytics (optional for dev)

#### Enable Authentication
1. Authentication → Get Started
2. Enable sign-in methods:
   - Email/Password ✓
   - Google ✓

#### Generate Service Account
1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save JSON file securely
4. Extract values to backend `.env`:
   ```env
   FIREBASE_PROJECT_ID="deyarun-dev"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk@deyarun-dev.iam.gserviceaccount.com"
   ```

#### Get Web Config
1. Project Settings → General
2. Scroll to "Your apps" → Web app
3. Copy config to frontend `.env.local`

#### Enable Cloud Messaging (FCM)
1. Project Settings → Cloud Messaging
2. Enable Cloud Messaging API
3. Note Server Key (for backend if needed)

### 3. Google Cloud Platform Setup

#### Create Project
1. Go to https://console.cloud.google.com/
2. Create new project: `DeyaRun Dev`

#### Enable APIs
1. APIs & Services → Library
2. Enable:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Fitness API (for Google Fit)

#### Create API Key (Maps)
1. APIs & Services → Credentials
2. Create Credentials → API Key
3. Restrict key:
   - Application restrictions: HTTP referrers
   - API restrictions: Select enabled APIs
4. Add to frontend `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

#### Create OAuth Client (Google Fit)
1. APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs:
   ```
   http://localhost:3001/api/google-fit/callback
   https://api.deyarun.com/api/google-fit/callback
   ```
5. Copy Client ID and Secret to backend `.env`

### 4. Strava API Setup (Optional)

1. Go to https://www.strava.com/settings/api
2. Create new application
3. Authorization Callback Domain: `localhost:3001,api.deyarun.com`
4. Copy Client ID and Secret to backend `.env`:
   ```env
   STRAVA_CLIENT_ID="your-client-id"
   STRAVA_CLIENT_SECRET="your-client-secret"
   ```

### 5. SendGrid Setup (Optional - for emails)

1. Sign up at https://app.sendgrid.com/
2. Create API key: Settings → API Keys
3. Permissions: Full Access (or Mail Send)
4. Add to backend `.env`:
   ```env
   SENDGRID_API_KEY="SG.xxxxxxxxxxxxx"
   FROM_EMAIL="noreply@deyarun.com"
   ```

### 6. Sentry Setup (Optional - for error tracking)

1. Sign up at https://sentry.io/
2. Create new project (Node.js for backend, Next.js for frontend)
3. Copy DSN to respective `.env` files:
   ```env
   # Backend
   SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"

   # Frontend
   NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
   ```

---

## Verification

### Complete System Check

Run all services and verify connectivity:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend/web
npm run dev

# Terminal 3: Mobile (Android Studio)
# Run app on emulator

# Terminal 4: Test API
curl http://localhost:3001/health
curl http://localhost:3001/api/auth/me
```

### Test Authentication Flow

1. Open http://localhost:3000
2. Click "Sign Up"
3. Register with email/password
4. Verify email (check backend logs)
5. Login
6. Check user profile loads

### Test Database Connection

```bash
# Check MongoDB connection
curl http://localhost:3001/health

# Response should show:
# "database": "connected"
```

### Test External Integrations

```bash
# Test Strava OAuth (if configured)
curl http://localhost:3001/api/strava/auth

# Test Google Fit OAuth (if configured)
curl http://localhost:3001/api/google-fit/auth
```

---

## Troubleshooting

### Backend Issues

#### MongoDB Connection Timeout

**Problem:** `MongoTimeoutError: Server selection timed out`

**Solution:**
```bash
# 1. Verify connection string in .env
# 2. Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
# 3. Test connection with MongoDB Compass
# 4. Verify network/firewall settings
```

#### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find and kill process using port 3001
# Linux/Mac:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

#### JWT Token Invalid

**Problem:** `401 Unauthorized` errors

**Solution:**
```bash
# 1. Verify JWT_SECRET in backend .env
# 2. Clear browser cookies/localStorage
# 3. Re-login
# 4. Check token expiry (JWT_EXPIRES_IN in .env)
```

### Frontend Issues

#### API Connection Failed

**Problem:** `Network Error` or `CORS` errors

**Solution:**
```bash
# 1. Verify backend is running (curl http://localhost:3001/health)
# 2. Check NEXT_PUBLIC_API_URL in .env.local
# 3. Verify CORS_ORIGIN in backend .env includes frontend URL
CORS_ORIGIN="http://localhost:3000"
# 4. Restart both servers
```

#### Firebase Not Initialized

**Problem:** `Firebase: Error (auth/invalid-api-key)`

**Solution:**
```bash
# 1. Verify all NEXT_PUBLIC_FIREBASE_* variables in .env.local
# 2. Check Firebase console for correct config
# 3. Ensure Firebase project exists and is active
# 4. Restart dev server after changing .env.local
```

#### Build Errors

**Problem:** TypeScript or ESLint errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Mobile Issues

#### Gradle Sync Failed

**Problem:** Gradle sync errors in Android Studio

**Solution:**
```bash
# 1. Clean project
./gradlew clean

# 2. Invalidate caches (Android Studio)
File → Invalidate Caches and Restart

# 3. Check gradle.properties for correct settings
# 4. Verify Java JDK 17+ installed
```

#### Cannot Connect to Backend

**Problem:** API requests timeout from app

**Solution:**
```bash
# For Emulator:
# Use 10.0.2.2:3001 instead of localhost:3001

# For Physical Device:
# 1. Connect device and computer to same WiFi
# 2. Find computer's IP: ipconfig (Windows) or ifconfig (Mac/Linux)
# 3. Use http://YOUR_COMPUTER_IP:3001
# 4. Ensure backend server allows connections from network

# Backend .env:
API_BASE_URL="http://0.0.0.0:3001"  # Allow external connections
```

#### App Crashes on Launch

**Problem:** App crashes immediately

**Solution:**
```bash
# 1. Check Logcat in Android Studio
# 2. Look for stack traces
# 3. Common issues:
#    - Missing permissions in AndroidManifest.xml
#    - ProGuard/R8 issues in release builds
#    - Missing native libraries

# Build debug variant first:
./gradlew assembleDebug
```

### Database Issues

#### Cannot Create User

**Problem:** Duplicate key error or validation errors

**Solution:**
```bash
# 1. Check MongoDB unique indexes
# 2. Drop and recreate collection (dev only!)

# Connect to MongoDB
mongosh "mongodb+srv://..."

# Drop users collection (CAREFUL!)
use deyarun
db.users.drop()

# Restart backend to recreate indexes
```

#### Slow Queries

**Problem:** API responses very slow

**Solution:**
```bash
# 1. Check database indexes
# 2. Enable MongoDB query profiling
# 3. Review backend logs for slow queries
# 4. Use MongoDB Compass to analyze query performance

# Add indexes if needed (backend/models/mongodb/)
```

---

## Next Steps

After successful setup:

1. **Read [ARCHITECTURE.md](ARCHITECTURE.md)** - Understand system design
2. **Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Learn API endpoints
3. **Check [CONTRIBUTING.md](CONTRIBUTING.md)** - Development workflow
4. **Explore codebase** - Familiarize yourself with structure

---

## Getting Help

### Documentation
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment

### External Resources
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Kotlin Android Docs](https://developer.android.com/kotlin)

### Support
- Create GitHub issue for bugs
- Email: support@deyarun.com

---

**Last Updated**: 2025-11-01
**Tested On**: Node.js v20.11.0 | npm v10.2.4 | Android Studio Hedgehog
