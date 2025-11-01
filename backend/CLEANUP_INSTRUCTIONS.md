# Backend Cleanup Instructions
**DeyaRun / RunAcademy - Railway → Coolify Migration Cleanup**

---

## 🎯 Overview

This cleanup removes Railway-era files and references after successful migration to Coolify deployment platform (completed August 2025).

**Status:** Safe to execute - all files identified are obsolete or duplicates.

---

## 📋 What Will Be Cleaned

### Files to DELETE (11 obsolete files):

1. **Railway Diagnostic Tools:**
   - `railway-diagnostic.js` (3.6 KB)
   - `server-minimal.js` (4.9 KB)
   - `server-ultra-minimal.js` (2.7 KB)
   - `comprehensive-test.js` (9.9 KB)
   - `test-connections.js` (4.5 KB)

2. **One-Time Debug Scripts:**
   - `debug-subscription-issue.js` (3.7 KB)
   - `debug-user-verification.js` (2.1 KB)
   - `diagnose-mongo.js` (3.6 KB)
   - `fix-admin-dashboard.js` (5.5 KB)
   - `fix-user-martins.js` (4.9 KB)

3. **Obsolete Data:**
   - `test-results.json` (outdated test output)

### Files to MOVE (5 files):

Move to `scripts/manual-tests/`:
- `test-auth-consistency.js`
- `test-mongo-auth.js`
- `test-subscription-api.js`
- `test-production-backend.js`

Move to `scripts/setup/`:
- `create-local-mongo.js`

### Directory to DELETE:

- **`src/` directory (2.1 MB)** - Obsolete duplicate structure not used in production

### Code to UPDATE (5 files):

1. **`server.js`** - Remove `RAILWAY_ENVIRONMENT` checks
2. **`config/database.js`** - Update comments
3. **`routes/admin.js`** - Replace Railway URLs with Coolify
4. **`services/notificationService.js`** - Update comments
5. **`Dockerfile`** - Update Railway reference in comment

---

## 🚀 Automated Cleanup (Option 1)

**Recommended for quick cleanup:**

```bash
# Navigate to backend directory
cd backend

# Make script executable
chmod +x scripts/cleanup-railway-references.sh

# Run cleanup script
./scripts/cleanup-railway-references.sh
```

**What it does:**
- Deletes obsolete files
- Moves test scripts to proper locations
- Removes `backend/src/` duplicate directory
- Updates `.gitignore` for Firebase credentials
- Shows detailed summary

**Time:** ~1 minute

---

## 🛠️ Manual Cleanup (Option 2)

**For full control over each step:**

### Step 1: Delete Obsolete Files

```bash
cd backend

# Delete Railway diagnostic files
rm railway-diagnostic.js
rm server-minimal.js
rm server-ultra-minimal.js
rm comprehensive-test.js
rm test-connections.js

# Delete debug scripts
rm debug-subscription-issue.js
rm debug-user-verification.js
rm diagnose-mongo.js
rm fix-admin-dashboard.js
rm fix-user-martins.js

# Delete obsolete test results
rm test-results.json
```

### Step 2: Organize Test Scripts

```bash
# Create directories
mkdir -p scripts/manual-tests
mkdir -p scripts/setup

# Move test files
mv test-auth-consistency.js scripts/manual-tests/
mv test-mongo-auth.js scripts/manual-tests/
mv test-subscription-api.js scripts/manual-tests/
mv test-production-backend.js scripts/manual-tests/

# Move setup scripts
mv create-local-mongo.js scripts/setup/
```

### Step 3: Delete Duplicate Structure

```bash
# Remove backend/src/ directory (not used in production)
rm -rf src/
```

### Step 4: Update .gitignore

```bash
# Add Firebase credentials to .gitignore
echo "" >> .gitignore
echo "# Firebase service account credentials (security)" >> .gitignore
echo "running-academy-9eff6-firebase-adminsdk-fbsvc-*.json" >> .gitignore
echo "" >> .gitignore
echo "# Sensitive backup files" >> .gitignore
echo ".env.backup.sensitive.*" >> .gitignore
```

### Step 5: Stage and Commit

```bash
git add -A
git commit -m "CLEANUP-001: Remove Railway references and obsolete files"
```

---

## 📝 Code Updates (Manual - After Automated Cleanup)

These changes require manual code editing:

### 1. server.js (4 locations)

**Line 127-129:** Remove Railway environment check
```javascript
// BEFORE:
// Trust proxy for Railway/production deployment
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  app.set('trust proxy', 1);
}

// AFTER:
// Trust proxy for Coolify production deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

**Line 172:** Update comment
```javascript
// BEFORE: // Emergency health check for Railway (no database dependency)
// AFTER:  // Emergency health check for Coolify (no database dependency)
```

**Line 1015:** Update comment
```javascript
// BEFORE: // Memory monitoring for Railway
// AFTER:  // Memory monitoring for production
```

### 2. config/database.js (3 comments)

**Lines 23-34:** Update comments
```javascript
// BEFORE: // MongoDB Atlas connection with Railway-optimized timeouts
// AFTER:  // MongoDB Atlas connection with Coolify production timeouts

// BEFORE: maxPoolSize: 3, // Even smaller pool for Railway
// AFTER:  maxPoolSize: 3, // Optimized pool for production

// BEFORE: // Connection pool settings for Railway
// AFTER:  // Connection pool settings for production

// BEFORE: minPoolSize: 0, // No minimum pool for Railway
// AFTER:  minPoolSize: 0, // No minimum pool for production
```

### 3. routes/admin.js (lines 44-77)

**Update deployment status endpoint:**
```javascript
// Line 44: Update comment
// BEFORE: // GET /api/admin/deployment-status - Proxy Railway/Vercel API calls to avoid CORS
// AFTER:  // GET /api/admin/deployment-status - Proxy Coolify/Vercel API calls to avoid CORS

// Line 49: Update comment
// BEFORE: // Mock deployment status to avoid CORS issues with Railway API
// AFTER:  // Mock deployment status to avoid CORS issues with Coolify API

// Lines 66-77: Replace Railway data with Coolify
// BEFORE:
railway: {
  status: 'healthy',
  latestDeployment: {
    id: 'dep_' + Date.now(),
    status: 'SUCCESS',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    meta: {
      branch: 'main',
      commitSha: '891691c',
      commitMessage: 'Fix bug reports API authentication middleware'
    },
    url: 'runacademyfullproject-production.up.railway.app'
  },
  deployments: [],
  lastChecked: new Date()
},

// AFTER:
coolify: {
  status: 'healthy',
  latestDeployment: {
    id: 'dep_' + Date.now(),
    status: 'SUCCESS',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    meta: {
      branch: 'main',
      commitSha: '891691c',
      commitMessage: 'Fix bug reports API authentication middleware'
    },
    url: 'api.runacademy.lv'
  },
  deployments: [],
  lastChecked: new Date()
},
```

### 4. services/notificationService.js (line 51)

**Update comment:**
```javascript
// BEFORE: // Fallback to environment variables (for Railway deployment)
// AFTER:  // Fallback to environment variables (for cloud deployment)
```

### 5. Dockerfile (line 17)

**Update comment:**
```javascript
// BEFORE: # Use Railway's PORT environment variable or fallback to 3001
// AFTER:  # Use Coolify's PORT environment variable or fallback to 3001
```

---

## ✅ Post-Cleanup Verification

### 1. Verify Git Status
```bash
git status
```

**Expected output:**
- 11 deleted files
- 5 moved files
- `backend/src/` deleted
- `.gitignore` modified

### 2. Run Tests
```bash
npm test
```

**Expected:** All tests pass (cleanup doesn't affect functionality)

### 3. Start Backend Locally
```bash
npm start
```

**Expected:** Server starts without errors

### 4. Health Check
```bash
curl http://localhost:3001/health
```

**Expected:** 200 OK response

### 5. Check for Remaining Railway References
```bash
grep -r "railway" . --include="*.js" | grep -v node_modules | grep -v ".git"
```

**Expected after code updates:** No results (except possibly in comments)

---

## 🔒 Security: Firebase Credentials Cleanup

**CRITICAL:** Firebase service account credentials are in git history!

### Step 1: Remove from Git History

```bash
# Install git-filter-repo (if not installed)
# macOS: brew install git-filter-repo
# Ubuntu: apt install git-filter-repo

# Remove file from entire git history
git filter-repo --path running-academy-9eff6-firebase-adminsdk-fbsvc-3409ac547e.json --invert-paths
```

**WARNING:** This rewrites git history. Coordinate with team before doing this on shared branches.

### Step 2: Rotate Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate new private key
4. Update `.env` file with new credentials
5. Update Coolify environment variables
6. Delete old service account key from Firebase

---

## 📊 Space Recovered

**After cleanup:**
- Obsolete files: ~50 KB
- `backend/src/` duplicate: 2.1 MB
- **Total: ~2.15 MB**

---

## 🚨 Rollback (If Needed)

If something goes wrong:

```bash
# Undo last commit (cleanup commit)
git reset --hard HEAD~1

# Or restore specific file from last commit
git checkout HEAD~1 -- path/to/file.js
```

**Note:** Automated script creates a single commit, making rollback easy.

---

## 📚 Related Documents

- **Detailed Analysis:** `BRAIN/BACKEND_CLEANUP_REPORT.md` (700+ lines, technical deep dive)
- **Summary (Latvian):** `BRAIN/BACKEND_CLEANUP_SUMMARY_LV.md` (executive summary)
- **Cleanup Script:** `backend/scripts/cleanup-railway-references.sh` (automated cleanup)

---

## 🎯 Estimated Time

| Task | Time |
|------|------|
| Automated cleanup script | 1 minute |
| Manual code updates | 15-30 minutes |
| Testing and verification | 15 minutes |
| Firebase credentials cleanup | 30 minutes |
| **Total (complete cleanup)** | **1-2 hours** |

---

## ❓ FAQ

**Q: Is it safe to delete these files?**
A: Yes. All identified files are from Railway migration period (August 2025) and are no longer used.

**Q: Will this break production?**
A: No. Production uses `backend/server.js` which is not deleted. Only obsolete diagnostic files are removed.

**Q: What about backend/src/?**
A: Confirmed obsolete. Production Dockerfile runs `npm start` which executes `backend/server.js` (root level), not `backend/src/server.js`.

**Q: Can I run the cleanup on production?**
A: Run cleanup locally, test, then commit and push. Coolify will auto-deploy after git push.

**Q: What if I need those test files later?**
A: They're moved to `scripts/manual-tests/`, not deleted. Still accessible for debugging.

---

## 📞 Support

**Questions or issues?**
- Check detailed report: `BRAIN/BACKEND_CLEANUP_REPORT.md`
- Review code changes before committing
- Run tests after cleanup
- Contact project maintainer if unsure

---

**Generated by:** Security and Static Analysis Agent
**Date:** 2025-11-01
**Version:** v1.17.16

