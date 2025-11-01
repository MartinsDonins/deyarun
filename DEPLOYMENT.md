# DeyaRun - Deployment Guide

This guide covers production deployment for all DeyaRun components: Backend API, Web Frontend, and Mobile App.

---

## Table of Contents

1. [Production Environment Overview](#production-environment-overview)
2. [Backend Deployment (Coolify)](#backend-deployment-coolify)
3. [Frontend Web Deployment (Coolify)](#frontend-web-deployment-coolify)
4. [Mobile App Deployment (Google Play)](#mobile-app-deployment-google-play)
5. [Environment Variables](#environment-variables)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Production Environment Overview

### Current Infrastructure

| Component | Platform | URL | Auto-Deploy |
|-----------|----------|-----|-------------|
| Backend API | Coolify (Docker) | https://api.deyarun.com | ✅ Yes (main branch) |
| Web Frontend | Coolify (Docker) | https://deyarun.com | ✅ Yes (main branch) |
| Mobile App | Google Play | Internal Testing | ⚠️ Manual |
| Database | MongoDB Atlas | M10 Cluster | N/A |

### Deployment Flow

```
Developer → Git Push → GitHub → Coolify Webhook → Build → Deploy
                                    ↓
                           Automated Health Checks
                                    ↓
                             Zero-Downtime Deploy
                                    ↓
                           Production Environment
```

---

## Backend Deployment (Coolify)

### Prerequisites

1. **Coolify Instance** configured and running
2. **GitHub Repository** connected to Coolify
3. **Production Environment Variables** configured
4. **MongoDB Atlas** cluster accessible
5. **Domain** configured (api.deyarun.com)

### Deployment Configuration

#### Dockerfile (backend/Dockerfile)

```dockerfile
FROM node:20-alpine3.18

WORKDIR /app

# Install dependencies for bcrypt and other native modules
RUN apk add --no-cache openssl1.1-compat curl

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health-simple || exit 1

# Start application
CMD ["npm", "start"]
```

### Coolify Setup

#### 1. Create New Application

1. Login to Coolify dashboard
2. Click "New Application"
3. Select "Public Repository" or connect GitHub
4. Repository: `https://github.com/your-org/deyarun`
5. Branch: `main`
6. Base Directory: `backend`
7. Build Pack: `Dockerfile`

#### 2. Configure Build Settings

```yaml
Build Command: npm ci
Build Directory: /app
Port: 3001
Dockerfile Path: backend/Dockerfile
```

#### 3. Environment Variables

Add production environment variables (see [Environment Variables](#environment-variables) section).

#### 4. Domain Configuration

1. Domains → Add Domain
2. Domain: `api.deyarun.com`
3. Enable HTTPS: Yes
4. SSL Certificate: Let's Encrypt (auto-renew)

#### 5. Health Checks

```yaml
Health Check Path: /health-simple
Health Check Interval: 30s
Health Check Timeout: 10s
Startup Period: 40s
```

### Manual Deployment

```bash
# 1. Update version (REQUIRED)
cd backend
node scripts/update-version.js patch

# 2. Commit changes
git add .
git commit -m "chore: bump version to X.Y.Z"

# 3. Push to GitHub (triggers auto-deploy)
git push origin main

# 4. Monitor Coolify dashboard for deployment status

# 5. Verify deployment
curl https://api.deyarun.com/health
```

### Post-Deployment Verification

```bash
# 1. Check health endpoint
curl https://api.deyarun.com/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-01T...",
#   "database": "connected",
#   "version": "1.17.124"
# }

# 2. Test authentication
curl https://api.deyarun.com/api/auth/me

# 3. Check Sentry for errors
# Visit Sentry dashboard: https://sentry.io/organizations/your-org/
```

---

## Frontend Web Deployment (Coolify)

### Prerequisites

1. **Coolify Instance** configured
2. **Production API URL** configured
3. **Firebase** production config
4. **Domain** configured (deyarun.com)

### Deployment Configuration

#### Dockerfile (frontend/web/Dockerfile)

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Coolify Setup

#### 1. Create New Application

1. Coolify dashboard → New Application
2. Repository: Same as backend
3. Branch: `main`
4. Base Directory: `frontend/web`
5. Build Pack: `Dockerfile`

#### 2. Configure Build Settings

```yaml
Build Command: npm run build
Build Directory: /app
Port: 3000
Dockerfile Path: frontend/web/Dockerfile
```

#### 3. Environment Variables

See [Environment Variables](#environment-variables) section for frontend config.

#### 4. Domain Configuration

1. Domain: `deyarun.com`
2. Additional: `www.deyarun.com` (redirect to primary)
3. Enable HTTPS: Yes
4. SSL: Let's Encrypt

### Manual Deployment

```bash
# 1. Update version
cd frontend/web
npm version patch

# 2. Commit and push
git add .
git commit -m "chore: bump version to X.Y.Z"
git push origin main

# 3. Verify deployment
curl https://deyarun.com
open https://deyarun.com
```

---

## Mobile App Deployment (Google Play)

### Prerequisites

1. **Google Play Console** account
2. **App signing key** configured
3. **Internal Testing track** setup
4. **Android Studio** with Kotlin

### Build Configuration

#### 1. Version Management

Update version in multiple files:

**frontend/Mobile/app/build.gradle.kts:**
```kotlin
android {
    defaultConfig {
        versionCode = 73  // Increment for each release
        versionName = "1.17.43"  // Semantic version
    }
}
```

**frontend/Mobile/gradle.properties:**
```properties
VERSION_NAME=1.17.43
VERSION_CODE=73
```

### Build Process

#### 1. Prepare for Release

```bash
cd frontend/Mobile

# 1. Update version
# Edit app/build.gradle.kts and gradle.properties

# 2. Clean project
./gradlew clean

# 3. Build release APK
./gradlew assembleRelease

# 4. Build AAB (Android App Bundle) for Play Store
./gradlew bundleRelease
```

#### 2. Sign APK/AAB

**Using Android Studio:**
1. Build → Generate Signed Bundle / APK
2. Select "Android App Bundle"
3. Choose existing keystore or create new
4. Select release variant
5. Output: `app/release/app-release.aab`

**Using Command Line:**
```bash
# Build signed AAB
./gradlew bundleRelease

# AAB located at:
# app/build/outputs/bundle/release/app-release.aab
```

#### 3. Upload to Google Play Console

**Manual Upload:**
1. Go to https://play.google.com/console/
2. Select DeyaRun app
3. Release → Testing → Internal Testing
4. Create New Release
5. Upload AAB file
6. Add Release Notes:
   ```
   Version 1.17.43
   - Bug fixes and performance improvements
   - (Add specific changes here)
   ```
7. Review → Start rollout to Internal Testing

**Automated Upload (Optional - Fastlane):**

Install Fastlane:
```bash
gem install fastlane
```

**Fastfile** configuration:
```ruby
platform :android do
  desc "Deploy to Internal Testing"
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/release/app-release.aab",
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
end
```

Deploy:
```bash
fastlane beta
```

#### 4. Version Bumping (CRITICAL)

**ALWAYS increment versionCode before deployment:**

```bash
# Current version
versionCode = 73

# Next deployment (MUST increment)
versionCode = 74
```

**NEVER use "-test" tags:**
```bash
# ❌ WRONG:
versionName = "1.17.43-test"

# ✅ CORRECT:
versionName = "1.17.43"
```

### Testing & Distribution

#### Internal Testing
- **Track**: Internal Testing (default)
- **Distribution**: Link-based (testers click link to install)
- **Review Time**: Instant (no review required)

#### Get Testing Link

1. Google Play Console → Testing → Internal Testing
2. Copy "Copy link" URL
3. Share with testers
4. Testers must be added to "Testers" list

#### Telegram Notification (After Deployment)

```bash
# Send notification to team
node ~/.claude/telegram/askUser.js notify "deployment" "
✅ DeyaRun Mobile v1.17.43 (Build 73) deployed to Internal Testing

📥 Download: [Google Play Internal Testing Link]

🔄 Changes:
- Bug fixes
- Performance improvements

🧪 Test both WEB + MOBILE before marking complete
"
```

---

## Environment Variables

### Backend Production (.env)

```env
# Server
NODE_ENV="production"
PORT=3001
API_BASE_URL="https://api.deyarun.com"
FRONTEND_URL="https://deyarun.com"
CORS_ORIGIN="https://deyarun.com,https://www.deyarun.com"

# Database
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/deyarun_production"

# Authentication
JWT_SECRET="production-secret-key-64-chars-min"
SESSION_SECRET="production-session-secret"
JWT_EXPIRES_IN="7d"

# Firebase
FIREBASE_PROJECT_ID="deyarun-prod"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@deyarun-prod.iam.gserviceaccount.com"

# External Services
STRAVA_CLIENT_ID="production-client-id"
STRAVA_CLIENT_SECRET="production-secret"
GOOGLE_CLIENT_ID="production-google-client-id"
GOOGLE_CLIENT_SECRET="production-google-secret"
GOOGLE_MAPS_API_KEY="production-maps-key"

# Monitoring
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"

# Email
SENDGRID_API_KEY="SG.production-key"
FROM_EMAIL="noreply@deyarun.com"
```

### Frontend Web Production (.env.local)

```env
# API
NEXT_PUBLIC_API_URL="https://api.deyarun.com"

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="production-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="deyarun-prod.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="deyarun-prod"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="deyarun-prod.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
NEXT_PUBLIC_LOGROCKET_APP_ID="your-app/deyarun"

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="production-maps-key"
```

---

## Monitoring & Health Checks

### Health Check Endpoints

```bash
# Simple health check (no database)
GET https://api.deyarun.com/health-simple

# Comprehensive health check
GET https://api.deyarun.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00Z",
  "version": "1.17.124",
  "database": "connected",
  "uptime": 86400
}
```

### Monitoring Services

#### 1. Sentry (Error Tracking)
- **Backend**: https://sentry.io/organizations/your-org/projects/deyarun-backend/
- **Frontend**: https://sentry.io/organizations/your-org/projects/deyarun-web/
- **Alerts**: Real-time error notifications

#### 2. Coolify Logs
```bash
# View backend logs
# Coolify dashboard → Applications → DeyaRun Backend → Logs

# View frontend logs
# Coolify dashboard → Applications → DeyaRun Web → Logs
```

#### 3. MongoDB Atlas Monitoring
- **Dashboard**: https://cloud.mongodb.com/
- **Metrics**: CPU, Memory, Connections, Operations/sec
- **Alerts**: Performance degradation, disk space

### Performance Metrics

```bash
# Get performance summary
curl https://api.deyarun.com/api/performance/summary

# Cache statistics
curl https://api.deyarun.com/api/performance/cache

# Security statistics
curl https://api.deyarun.com/api/performance/security
```

---

## Rollback Procedures

### Backend Rollback

#### Via Coolify Dashboard

1. Go to Coolify → Applications → DeyaRun Backend
2. Deployments → History
3. Select previous successful deployment
4. Click "Redeploy"

#### Via Git

```bash
# 1. Find last working commit
git log --oneline

# 2. Revert to previous commit
git revert HEAD

# 3. Push (triggers auto-deploy)
git push origin main
```

### Frontend Rollback

Same process as backend:
1. Coolify dashboard → Deployments → Redeploy previous
2. Or git revert → push

### Mobile Rollback

**Google Play Console:**
1. Release → Production/Internal Testing
2. Releases → Manage
3. Select previous release
4. Promote to track

**Note:** Cannot rollback to lower versionCode, must create new release.

---

## Troubleshooting

### Deployment Failures

#### Coolify Build Failed

**Check logs:**
```bash
# Coolify dashboard → Application → Logs
# Look for npm install or build errors
```

**Common issues:**
- **Missing environment variables**: Add to Coolify env config
- **Build timeout**: Increase timeout in Coolify settings
- **Out of memory**: Increase container memory limit

#### Health Check Failed

**Symptoms:** Deployment completes but service marked unhealthy

**Solution:**
```bash
# 1. Check if server is running
curl https://api.deyarun.com/health-simple

# 2. If not responding, check logs
# 3. Verify PORT environment variable
# 4. Check MongoDB connection

# 5. Manual health check
docker exec -it <container-id> curl localhost:3001/health
```

### Database Connection Issues

**Problem:** `MongoNetworkError` or connection timeout

**Solution:**
```bash
# 1. Verify MongoDB Atlas IP whitelist
# - Add Coolify server IP
# - Or allow 0.0.0.0/0 (all IPs)

# 2. Test connection string
mongosh "mongodb+srv://..."

# 3. Check MongoDB Atlas status
# https://status.mongodb.com/
```

### SSL/HTTPS Issues

**Problem:** SSL certificate errors

**Solution:**
```bash
# 1. Verify domain DNS points to Coolify server
dig api.deyarun.com

# 2. Regenerate Let's Encrypt certificate
# Coolify → Domains → Regenerate SSL

# 3. Check certificate expiry
echo | openssl s_client -connect api.deyarun.com:443 -servername api.deyarun.com 2>/dev/null | openssl x509 -noout -dates
```

### Mobile Deployment Issues

#### Upload to Play Console Failed

**Problem:** Upload rejected

**Common causes:**
- **versionCode not incremented**: Must be higher than previous
- **APK/AAB not signed**: Must be signed with release keystore
- **Missing permissions**: Check Google Play Console access

**Solution:**
```bash
# 1. Increment versionCode in build.gradle.kts
versionCode = 74  # Previous was 73

# 2. Clean and rebuild
./gradlew clean
./gradlew bundleRelease

# 3. Verify AAB signed correctly
jarsigner -verify -verbose app/build/outputs/bundle/release/app-release.aab
```

#### App Not Installing on Devices

**Problem:** Testers can't install from Internal Testing

**Solution:**
1. Verify testers added to "Testers" list
2. Check app signing configuration
3. Ensure testers using correct Google account
4. Try re-generating testing link

---

## Deployment Checklist

### Before Deployment

- [ ] Update version numbers (backend, web, mobile)
- [ ] Run tests locally (`npm test`, `npm run test`)
- [ ] Check linting (`npm run lint`)
- [ ] Review changes (`git diff`)
- [ ] Verify environment variables configured
- [ ] Test build locally (`npm run build`)

### During Deployment

- [ ] Commit with descriptive message
- [ ] Push to main branch
- [ ] Monitor Coolify build logs
- [ ] Wait for health checks to pass
- [ ] Verify deployment status (green checkmark)

### After Deployment

- [ ] Test health endpoint
- [ ] Verify version number in response
- [ ] Test critical user flows (login, workouts, etc.)
- [ ] Check Sentry for new errors
- [ ] Monitor performance metrics
- [ ] Send deployment notification (Telegram/Slack)
- [ ] Update CHANGELOG.md

---

## CI/CD Automation (Future)

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          cd backend
          npm install
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deployment
        run: |
          curl -X POST ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

---

**Last Updated**: 2025-11-01
**Deployment Version**: Backend v1.17.124 | Web v1.17.117
**Next Review**: Monthly deployment process review
