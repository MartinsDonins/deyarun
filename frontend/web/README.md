# DeyaRun Web Frontend

**Version:** 1.17.124 | **Framework:** Next.js 14 | **Deployment:** Vercel

See `backend/README.md` for comprehensive documentation structure example.

## Quick Start
```bash
npm install
cp .env.example .env.local
npm run dev  # http://localhost:3000
```

## Tech Stack
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Security: DOMPurify, XSS protection ✅
- Monitoring: Sentry, LogRocket

## Key Features
1. Authentication (JWT + Google OAuth)
2. Training system (workouts, plans, analytics)
3. Course platform (lessons, quizzes, certificates)
4. Integrations (Strava, Google Fit)
5. Admin panel (Coolify monitoring)
6. PWA support

## Environment Setup
See `.env.example` (121 lines) for all variables.

Required: API_URL, Google Maps, Firebase, Sentry

## Security ✅
- 0 console.log in production
- XSS protection (DOMPurify)
- next/image (all images)
- next/link (all links)
- HTTPS enforced

## Deployment
- Platform: Vercel
- Auto-deploy on push to main
- Domain: https://deyarun.com

---
**Last Updated:** 2025-11-01 | **Cleanup:** Railway → Coolify migration complete
