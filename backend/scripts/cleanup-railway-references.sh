#!/bin/bash
# Backend Cleanup Script - Remove Railway References
# Project: DeyaRun / RunAcademy
# Date: 2025-11-01
# Version: v1.17.16

# This script performs comprehensive backend cleanup:
# 1. Removes Railway-era diagnostic and test files
# 2. Deletes obsolete backend/src/ duplicate structure
# 3. Reorganizes test scripts into proper directories
# 4. Updates .gitignore for Firebase credentials

set -e  # Exit on any error

echo "🚀 Backend Cleanup Script - Railway References Removal"
echo "======================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "server.js" ]; then
  echo "${RED}❌ Error: Must run from backend/ directory${NC}"
  exit 1
fi

echo "${YELLOW}⚠️ WARNING: This script will delete files and modify .gitignore${NC}"
echo "Please ensure you have committed any important changes."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cleanup cancelled."
  exit 0
fi

echo ""
echo "Starting cleanup process..."
echo ""

# Track deleted files
deleted_count=0
deleted_size=0

# Function to safely delete file
delete_file() {
  local file=$1
  if [ -f "$file" ]; then
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
    rm "$file"
    echo "${GREEN}✅ Deleted:${NC} $file ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "$size bytes"))"
    ((deleted_count++))
    deleted_size=$((deleted_size + size))
  else
    echo "${YELLOW}⚠️ Not found:${NC} $file"
  fi
}

# 1. Delete Railway-specific diagnostic files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1: Removing Railway Diagnostic Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

delete_file "railway-diagnostic.js"
delete_file "server-minimal.js"
delete_file "server-ultra-minimal.js"
delete_file "comprehensive-test.js"
delete_file "test-connections.js"

echo ""

# 2. Delete debug scripts
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Step 2: Removing Debug Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

delete_file "debug-subscription-issue.js"
delete_file "debug-user-verification.js"
delete_file "diagnose-mongo.js"
delete_file "fix-admin-dashboard.js"
delete_file "fix-user-martins.js"

echo ""

# 3. Delete obsolete test results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Step 3: Removing Obsolete Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

delete_file "test-results.json"

echo ""

# 4. Move test scripts to proper location
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 Step 4: Organizing Test Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create directories if they don't exist
mkdir -p scripts/manual-tests
mkdir -p scripts/setup

# Move test files
test_files=(
  "test-auth-consistency.js"
  "test-mongo-auth.js"
  "test-subscription-api.js"
  "test-production-backend.js"
)

for file in "${test_files[@]}"; do
  if [ -f "$file" ]; then
    mv "$file" "scripts/manual-tests/"
    echo "${GREEN}✅ Moved:${NC} $file → scripts/manual-tests/"
  else
    echo "${YELLOW}⚠️ Not found:${NC} $file"
  fi
done

# Move setup scripts
if [ -f "create-local-mongo.js" ]; then
  mv "create-local-mongo.js" "scripts/setup/"
  echo "${GREEN}✅ Moved:${NC} create-local-mongo.js → scripts/setup/"
fi

echo ""

# 5. Delete backend/src/ duplicate structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗂️ Step 5: Removing Duplicate backend/src/ Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "src" ]; then
  src_size=$(du -sh src | cut -f1)
  echo "${YELLOW}⚠️ Deleting backend/src/ directory ($src_size)${NC}"
  rm -rf src/
  echo "${GREEN}✅ Deleted:${NC} backend/src/ directory"
else
  echo "${YELLOW}⚠️ backend/src/ directory not found${NC}"
fi

echo ""

# 6. Update .gitignore
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 Step 6: Updating .gitignore (Firebase Credentials)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! grep -q "running-academy-9eff6-firebase-adminsdk" .gitignore 2>/dev/null; then
  echo "# Firebase service account credentials (security)" >> .gitignore
  echo "running-academy-9eff6-firebase-adminsdk-fbsvc-*.json" >> .gitignore
  echo "${GREEN}✅ Added Firebase credentials to .gitignore${NC}"
else
  echo "${YELLOW}⚠️ Firebase credentials already in .gitignore${NC}"
fi

# Also add backup env files
if ! grep -q ".env.backup.sensitive" .gitignore 2>/dev/null; then
  echo "# Sensitive backup files" >> .gitignore
  echo ".env.backup.sensitive.*" >> .gitignore
  echo "${GREEN}✅ Added backup env files to .gitignore${NC}"
else
  echo "${YELLOW}⚠️ Backup env files already in .gitignore${NC}"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Cleanup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Files deleted: $deleted_count"
echo "✅ Space recovered: $(numfmt --to=iec-i --suffix=B $deleted_size 2>/dev/null || echo "$deleted_size bytes") (excluding src/)"
echo "✅ Test files organized: ${#test_files[@]}"
echo "✅ .gitignore updated"
echo ""
echo "${GREEN}🎉 Cleanup completed successfully!${NC}"
echo ""

# Next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Review changes:"
echo "   ${YELLOW}git status${NC}"
echo ""
echo "2. Stage changes:"
echo "   ${YELLOW}git add -A${NC}"
echo ""
echo "3. Commit cleanup:"
echo "   ${YELLOW}git commit -m \"CLEANUP-001: Remove Railway references and obsolete files\"${NC}"
echo ""
echo "4. Run tests to verify nothing broke:"
echo "   ${YELLOW}npm test${NC}"
echo ""
echo "5. Update Railway references in code (manual step):"
echo "   - server.js (4 locations)"
echo "   - config/database.js (3 comments)"
echo "   - routes/admin.js (lines 44-77)"
echo "   - services/notificationService.js (line 51)"
echo "   - Dockerfile (lines 17-18)"
echo ""
echo "See BRAIN/BACKEND_CLEANUP_REPORT.md for detailed instructions."
echo ""

echo "${YELLOW}⚠️ SECURITY WARNING:${NC}"
echo "Firebase credentials file still exists in git history!"
echo "Run this command to remove from git history:"
echo ""
echo "${RED}git filter-repo --path running-academy-9eff6-firebase-adminsdk-fbsvc-3409ac547e.json --invert-paths${NC}"
echo ""
echo "Then rotate Firebase credentials immediately!"
echo ""
