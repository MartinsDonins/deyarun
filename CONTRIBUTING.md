# DeyaRun - Contributing Guide

Welcome! This guide explains the development workflow, coding standards, and best practices for contributing to DeyaRun.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Version Management](#version-management)
5. [Testing Requirements](#testing-requirements)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Code Review](#code-review)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have completed:

1. **Initial Setup**: Follow [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. **Architecture Understanding**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Development Environment**: Working local dev environment

### First-Time Contributors

```bash
# 1. Clone repository
git clone <repository-url>
cd deyarun

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Install dependencies
cd backend && npm install
cd ../frontend/web && npm install

# 4. Run development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend/web && npm run dev

# 5. Make changes and test
# 6. Commit following guidelines below
# 7. Push and create Pull Request
```

---

## Development Workflow

### Branch Strategy

**Single Branch Model**: `main` branch only
- All development happens on `main`
- Feature branches for larger features (optional)
- Coolify auto-deploys on push to `main`

### Feature Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch (optional for larger features)
git checkout -b feature/workout-analytics

# 3. Make changes
# ... code, code, code ...

# 4. Test locally
npm run lint
npm test
npm run build

# 5. Update version (CRITICAL - see Version Management)
node scripts/update-version.js patch

# 6. Commit changes
git add .
git commit -m "feat: add workout analytics dashboard"

# 7. Push to GitHub
git push origin feature/workout-analytics
# Or push directly to main for small changes:
git push origin main
```

### Development Server

```bash
# Backend (Port 3001)
cd backend
npm run dev

# Frontend Web (Port 3000)
cd frontend/web
npm run dev

# Mobile (Android Studio)
# Open frontend/Mobile in Android Studio
# Run on emulator/device
```

---

## Code Standards

### General Principles

1. **TypeScript First**: All new code in TypeScript
2. **Functional Programming**: Prefer functional over OOP where possible
3. **DRY Principle**: Don't Repeat Yourself
4. **KISS Principle**: Keep It Simple, Stupid
5. **SOLID Principles**: For class-based code

### TypeScript Guidelines

```typescript
// ✅ GOOD: Use explicit types
function calculatePace(distance: number, duration: number): number {
  return duration / distance;
}

// ❌ BAD: Avoid 'any'
function calculatePace(distance: any, duration: any) {
  return duration / distance;
}

// ✅ GOOD: Use interfaces for objects
interface Workout {
  id: string;
  type: 'running' | 'cycling' | 'walking';
  distance: number;
  duration: number;
}

// ✅ GOOD: Use enums for constants
enum WorkoutType {
  RUNNING = 'running',
  CYCLING = 'cycling',
  WALKING = 'walking'
}
```

### Backend Code Standards

#### Route → Controller → Service → Model Pattern

```typescript
// routes/workouts.js
router.get('/', authMiddleware, workoutController.getWorkouts);

// controllers/workoutController.js
export const getWorkouts = async (req, res, next) => {
  try {
    const workouts = await workoutService.getUserWorkouts(req.user.id);
    res.json({ success: true, data: workouts });
  } catch (error) {
    next(error);
  }
};

// services/workoutService.js
export const getUserWorkouts = async (userId) => {
  return await Workout.find({ userId }).lean().sort('-date');
};

// models/mongodb/Workout.js
const WorkoutSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['running', 'cycling', 'walking'], required: true },
  // ... more fields
});
```

#### Error Handling

```typescript
// ✅ GOOD: Always use try/catch for async functions
export const createWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.create(req.body);
    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};

// ✅ GOOD: Use custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

throw new ValidationError('Invalid workout type');
```

#### No console.log in Production

```typescript
// ❌ BAD: Never use console.log
console.log('User logged in:', user);

// ✅ GOOD: Use logger
import logger from './utils/logger';
logger.info('User logged in', { userId: user.id });

// Allowed:
console.warn('Warning message');
console.error('Error message');
```

### Frontend Code Standards

#### React Component Structure

```typescript
// ✅ GOOD: Functional components with TypeScript
import { FC } from 'react';

interface WorkoutCardProps {
  workout: Workout;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const WorkoutCard: FC<WorkoutCardProps> = ({ workout, onEdit, onDelete }) => {
  return (
    <div className="workout-card">
      <h3>{workout.type}</h3>
      <p>Distance: {workout.distance}m</p>
      {onEdit && <button onClick={() => onEdit(workout.id)}>Edit</button>}
    </div>
  );
};

// ❌ BAD: Class components (avoid for new code)
class WorkoutCard extends React.Component { ... }
```

#### State Management

```typescript
// ✅ GOOD: Use React Context for global state
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // ... login logic
  };

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

#### Styling with Tailwind CSS

```tsx
// ✅ GOOD: Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h3 className="text-lg font-semibold text-gray-900">Workout Title</h3>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Edit
  </button>
</div>

// ✅ GOOD: Extract complex classes to component
const buttonClasses = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition";

// ❌ AVOID: Inline styles (use only when dynamic)
<div style={{ backgroundColor: 'red' }}>Bad</div>
```

### Mobile (Kotlin) Code Standards

```kotlin
// ✅ GOOD: Use data classes
data class Workout(
    val id: String,
    val type: WorkoutType,
    val distance: Double,
    val duration: Int
)

// ✅ GOOD: Use sealed classes for states
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

// ✅ GOOD: Use coroutines for async
viewModelScope.launch {
    val workouts = withContext(Dispatchers.IO) {
        repository.getWorkouts()
    }
    _workouts.value = UiState.Success(workouts)
}
```

### ESLint Rules

Backend and frontend use ESLint for code quality:

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-unused-vars": "error",
    "prefer-const": "error",
    "eqeqeq": ["error", "always"],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Run linter:**
```bash
# Backend
cd backend
npm run lint
npm run lint:fix  # Auto-fix issues

# Frontend
cd frontend/web
npm run lint
npm run lint:fix
```

---

## Version Management

### 🚨 CRITICAL REQUIREMENT 🚨

**ALWAYS update version before committing!**

### Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH`

- **PATCH** (X.Y.Z+1): Bug fixes, small changes
- **MINOR** (X.Y+1.0): New features, backward compatible
- **MAJOR** (X+1.0.0): Breaking changes

### Version Update Process

#### Automated (Recommended)

```bash
# From project root
node scripts/update-version.js patch   # Bug fixes (1.17.5 → 1.17.6)
node scripts/update-version.js minor   # New features (1.17.5 → 1.18.0)
node scripts/update-version.js major   # Breaking changes (1.17.5 → 2.0.0)
```

This script updates:
- `backend/package.json`
- `backend/server.js` (3 locations)
- `frontend/web/package.json`
- `frontend/Mobile/app/build.gradle.kts`
- `frontend/Mobile/gradle.properties`

#### Manual Update (If Script Fails)

Update version in ALL these files:

1. **Backend**: `backend/package.json` → `"version": "1.17.X"`
2. **Backend**: `backend/server.js` → `const version = 'v1.17.X'` (3 locations)
3. **Frontend Web**: `frontend/web/package.json` → `"version": "1.17.X"`
4. **Mobile**: `frontend/Mobile/app/build.gradle.kts` → `versionName = "1.17.X"`
5. **Mobile**: `frontend/Mobile/gradle.properties` → `VERSION_NAME=1.17.X`

### Version Verification

```bash
# Check version is displayed
curl http://localhost:3001/health

# Response includes:
# "version": "1.17.124"
```

---

## Testing Requirements

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Minimum coverage requirements:**
- **Unit tests**: 80% coverage
- **Integration tests**: Critical endpoints covered
- **All new features**: Must include tests

### Frontend Tests (Playwright)

```bash
cd frontend/web

# Run E2E tests
npm run test

# Run in headed mode (see browser)
npm run test:headed

# Run in UI mode (interactive)
npm run test:ui

# Run specific test file
npx playwright test auth.spec.ts
```

**Test coverage requirements:**
- **Critical flows**: Login, registration, workout creation
- **Happy paths**: All main user journeys
- **Error handling**: Invalid inputs, API failures

### Mobile Tests

```bash
cd frontend/Mobile

# Run unit tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest
```

### Pre-Commit Checklist

Before committing, ensure:

- [ ] Code compiles without errors
- [ ] All tests pass locally
- [ ] Linting passes (`npm run lint`)
- [ ] No `console.log` statements
- [ ] Version updated
- [ ] Changes tested manually
- [ ] Documentation updated (if needed)

---

## Commit Guidelines

### Conventional Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add workout analytics dashboard` |
| `fix` | Bug fix | `fix: resolve login timeout issue` |
| `docs` | Documentation | `docs: update API documentation` |
| `style` | Formatting | `style: fix ESLint warnings` |
| `refactor` | Code refactoring | `refactor: simplify workout service` |
| `test` | Add tests | `test: add unit tests for auth service` |
| `chore` | Maintenance | `chore: bump version to 1.17.125` |
| `perf` | Performance | `perf: optimize database queries` |

### Commit Examples

```bash
# ✅ GOOD: Clear, descriptive commits
git commit -m "feat: add Strava activity sync"
git commit -m "fix: resolve Google Maps API key error"
git commit -m "docs: update setup guide with Firebase config"
git commit -m "chore: bump version to 1.17.125"

# ❌ BAD: Vague commits
git commit -m "updates"
git commit -m "fix bug"
git commit -m "changes"
```

### Commit Body (Optional)

For complex changes, add a body:

```
feat: add workout analytics dashboard

Implemented new analytics dashboard with:
- Weekly/monthly distance charts
- Pace trends over time
- Personal records tracking

Closes #42
```

---

## Pull Request Process

### Creating a Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature
   ```

2. **Create PR on GitHub**:
   - Go to repository on GitHub
   - Click "New Pull Request"
   - Base: `main` ← Compare: `feature/your-feature`
   - Fill in PR template

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Manual testing completed
   - [ ] Added new tests

   ## Checklist
   - [ ] Version updated
   - [ ] Linting passes
   - [ ] Documentation updated
   - [ ] Deployment tested (if applicable)
   ```

### PR Review Checklist

Reviewers should check:

- [ ] Code follows style guide
- [ ] Tests included and passing
- [ ] Version updated correctly
- [ ] No security vulnerabilities
- [ ] No performance regressions
- [ ] Documentation updated
- [ ] Commit messages clear

### After PR Approved

```bash
# 1. Merge to main (on GitHub or locally)
git checkout main
git merge feature/your-feature

# 2. Push to main (triggers auto-deploy)
git push origin main

# 3. Monitor deployment
# Check Coolify dashboard for deployment status

# 4. Verify production
curl https://api.deyarun.com/health
open https://deyarun.com

# 5. Delete feature branch
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

---

## Code Review

### Reviewing Code

When reviewing PRs:

1. **Functionality**: Does code work as intended?
2. **Tests**: Are tests adequate and passing?
3. **Style**: Follows coding standards?
4. **Security**: No vulnerabilities introduced?
5. **Performance**: No obvious performance issues?
6. **Documentation**: Code is well-commented?

### Review Comments

```markdown
# ✅ GOOD: Constructive feedback
Consider using `Promise.all()` here for parallel API calls:
```typescript
const [users, workouts] = await Promise.all([
  User.find(),
  Workout.find()
]);
```

# ❌ BAD: Vague or negative
This is wrong. Fix it.
```

### Approval Process

- **1 approval** required for merge (small changes)
- **2 approvals** required for breaking changes
- **CI/CD checks** must pass

---

## Development Best Practices

### Security

1. **Never commit secrets**: Use `.env` files
2. **Validate all inputs**: Use express-validator
3. **Sanitize data**: Prevent XSS/SQL injection
4. **Use HTTPS**: Always in production
5. **Regular dependency updates**: `npm audit fix`

### Performance

1. **Database queries**: Use indexes, lean queries
2. **API responses**: Implement caching
3. **Frontend**: Code splitting, lazy loading
4. **Images**: Optimize and compress
5. **Bundle size**: Monitor with `next build`

### Error Handling

```typescript
// ✅ GOOD: Proper error handling
try {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
} catch (error) {
  logger.error('Error fetching user', { error, userId: id });
  throw error;
}

// ✅ GOOD: Error logging with Sentry
Sentry.captureException(error, {
  user: { id: userId },
  tags: { component: 'userService' }
});
```

### Documentation

- **Code comments**: Explain "why", not "what"
- **Function docs**: JSDoc for complex functions
- **API changes**: Update API_DOCUMENTATION.md
- **README updates**: Keep documentation current

---

## Getting Help

### Resources

- **Documentation**: [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues**: Create GitHub issue for bugs/features
- **Discussions**: Use GitHub Discussions for questions

### Support Channels

- **Email**: dev@deyarun.com
- **GitHub Issues**: For bugs and feature requests

---

## License

By contributing to DeyaRun, you agree that your contributions will be licensed under the same license as the project.

---

**Last Updated**: 2025-11-01
**Version**: 1.0
**Maintainers**: DeyaRun Development Team
