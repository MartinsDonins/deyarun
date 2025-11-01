# 🌐 Web Frontend Environment Setup Guide

**Version:** 2.0.3  
**Updated:** 2025-08-02

---

## 📋 Environment Files Overview

### Local Development
- **File:** `.env.local`
- **Purpose:** Local development with localhost backend
- **API URL:** `http://localhost:3001`

### Production Essential
- **File:** `.env`
- **Purpose:** Minimālā konfigurācija production vajadzībām
- **Content:** Tikai API URL un NODE_ENV

### Vercel Deployment (Private)
- **File:** `.env.vercel` 🔒
- **Purpose:** Īstas vērtības kopēšanai uz Vercel (git ignored)
- **Security:** Satur īstas API atslēgas, nav versioned

---

## 🚀 Production Deployment Setup

### Step 1: Vercel Dashboard Configuration

1. **Navigate to Vercel Dashboard:**
   - URL: https://vercel.com/dashboard/runacademy-full-fronend/settings/environment-variables

2. **Add Required Variables:**
   ```bash
   NEXT_PUBLIC_API_URL=https://runacademyfullproject-production.up.coolify.app
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-google-maps-api-key
   NODE_ENV=production
   ```

3. **Optional Firebase Variables:**
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBXRjFgdxnBk7U1DQVG6YLcUiKow-2OzNQ
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=running-academy-9eff6.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=running-academy-9eff6
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=running-academy-9eff6.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=757275609167
   NEXT_PUBLIC_FIREBASE_APP_ID=1:757275609167:web:35605d27129400de94023a
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XYYDD8XVNH
   ```

### Step 2: Redeploy Application

After adding environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Verify new environment variables are active

---

## 🔧 Local Development

### Prerequisites
```bash
cd frontend/web
npm install
```

### Environment Setup
1. **Copy template:**
   ```bash
   cp .env.local.example .env.local  # If exists
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Verify API connection:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001 (should be running)

---

## ✅ Environment Variables Reference

### Required Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://runacademyfullproject-production.up.coolify.app` | Backend API URL |
| `NODE_ENV` | `development` | `production` | Environment mode |

### Optional Variables

| Variable | Value | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `your-google-maps-api-key` | Google Maps integration |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-firebase-project-id` | Firebase analytics |

---

## 🚨 Important Notes

### ⚠️ SECURITY WARNING
- **NEVER commit real API keys** to git repository
- **All template files** contain placeholder values only
- **Replace placeholders** with actual keys in Vercel Dashboard
- **Frontend variables** are public (NEXT_PUBLIC_ prefix)
- **Environment files** are for templates and development only

### Security Best Practices
- **Use Vercel Dashboard** for production secrets
- **Rotate API keys** regularly
- **Limit API key** permissions and domains
- **Monitor usage** of API keys

### Deployment
- **Production API URL** must match Coolify backend
- **CORS configuration** in backend includes Vercel domain
- **Environment changes** require Vercel redeploy

### Troubleshooting
1. **Password reset not working:** Check `NEXT_PUBLIC_API_URL`
2. **API errors:** Verify Coolify backend is running
3. **Maps not loading:** Check Google Maps API key

---

## 📞 Support

### Quick Verification
```bash
# Test API connection
curl https://runacademyfullproject-production.up.coolify.app/health

# Check frontend deployment
curl https://runacademy-full-fronend.vercel.app
```

### Common Issues
- **Environment variables not updating:** Redeploy in Vercel
- **CORS errors:** Check backend CORS configuration
- **Build failures:** Verify all required variables are set

---

**Last Updated:** 2025-08-02  
**Status:** 🟢 Production Ready  
**Backend:** Coolify - https://runacademyfullproject-production.up.coolify.app  
**Frontend:** Vercel - https://runacademy-full-fronend.vercel.app