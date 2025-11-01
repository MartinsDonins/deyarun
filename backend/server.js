// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
import "./instrument.js";

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// All other imports below
import * as Sentry from "@sentry/node";

// Make Sentry available globally for detailed error reporting
global.Sentry = Sentry;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { initializeDatabases, closeConnections, checkDatabaseHealth } from './config/database.js';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import versionReader from './utils/versionReader.js';
import { validateJwtConfig } from './utils/jwtUtils.js';
import { getSessionConfig, validateSessionConfig } from './utils/sessionUtils.js';

// Route imports
import authRoutes from './routes/auth.js';
// Supabase auth routes removed - using standard auth only
import workoutRoutes from './routes/workouts.js';
import userRoutes from './routes/user.js';
import trainingPlanRoutes from './routes/trainingPlans.js';
import testPlannedWorkoutsRoutes from './routes/testPlannedWorkouts.js';
import trainingScheduleRoutes from './routes/trainingSchedule.js';
import subscriptionRoutes from './routes/subscriptions.js';
import leaderboardRoutes from './routes/leaderboard.js';
import coachTipsRoutes from './routes/coachTips.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import coursesRoutes from './routes/courses.js';
import lessonsRoutes from './routes/lessons.js';
import lessonCommentsRoutes from './routes/lessonComments.js';
import certificatesRoutes from './routes/certificates.js';
import resourcesRoutes from './routes/resources.js';
import quizzesRoutes from './routes/quizzes.js';
import analyticsRoutes from './routes/analytics.js';
import advancedAnalyticsRoutes from './routes/advancedAnalytics.js';
import advancedWorkoutAnalyticsRoutes from './routes/advancedWorkoutAnalytics.js';
import trainingIntelligenceRoutes from './routes/trainingIntelligence.js';
import emailRoutes from './routes/email.js';
import pushNotificationsRoutes from './routes/pushNotifications.js';
import adminNotificationsRoutes from './routes/adminNotifications.js';
import userNotificationPreferencesRoutes from './routes/userNotificationPreferences.js';
import adminAnalyticsRoutes from './routes/adminAnalytics.js';
import dashboardRoutes from './routes/dashboard.js';
import googleAuthRoutes from './routes/googleAuth.js';
import stravaAuthRoutes from './routes/stravaAuth.js';
import stravaActivitiesRoutes from './routes/stravaActivities.js';
import stravaWebhooksRoutes from './routes/stravaWebhooks.js';
import bugReportsRoutes from './routes/bugReports.js';
import exercisesRoutes from './routes/exercises.js';
import goalsRoutes from './routes/goals.js';
import dataExportRoutes from './routes/dataExport.js';
import aiConfigRoutes from './routes/aiConfig.js';
import aiUsageRoutes from './routes/aiUsage.js';
import deploymentRoutes from './routes/deployment.js';
import aiTrainingRoutes from './routes/aiTraining.js';
import googleFitRoutes from './routes/googleFit.js';
import userStatsRoutes from './routes/userStats.js';
import debugWorkoutsRoutes from './routes/debugWorkouts.js';
import aiConversationsRoutes from './routes/aiConversations.js';
import authDebugRoutes from './routes/authDebug.js';
import adminMonitoringRoutes from './routes/adminMonitoring.js';
import adminExportsRoutes from './routes/adminExports.js';
import performanceRoutes from './routes/performanceRoutes.js';
import newsRoutes from './routes/news.js';
import serverInfoRoutes from './routes/serverInfo.js';
import achievementsRoutes from './routes/achievements.js';
import session from 'express-session';

// Performance and Security middleware imports
import cacheMiddleware from './middleware/cacheMiddleware.js';
import securityMiddleware from './middleware/securityMiddlewareSimple.js';
import performanceMonitoringService from './services/performanceMonitoringService.js';

// WebSocket imports
import { initializeWebSocketServer } from './routes/websocket.js';

// Sentry is now initialized via instrument.js

// Service imports
import './services/scheduleUpdateService.js'; // Initialize the schedule update service
import './services/subscriptionService.js'; // Initialize the subscription service
import './services/dataAggregationService.js'; // Initialize the data aggregation service
import './services/stravaSyncService.js'; // Initialize the Strava automatic sync service
import progressTrackingService from './services/progressTrackingService.js';
import goalBasedAdaptationService from './services/goalBasedAdaptationService.js';
import performancePredictionService from './services/performancePredictionService.js';
import weeklyReportService from './services/weeklyReportService.js';
import stravaService from './services/stravaService.js';
import weeklyPlanScheduler from './services/weeklyPlanScheduler.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// All your controllers should live here

console.log('✅ Sentry initialized via instrument.js');

// Validate security configuration at startup
try {
  validateJwtConfig();
  validateSessionConfig();
} catch (error) {
  console.error('❌ Critical security error:', error.message);
  process.exit(1);
}

// Start performance monitoring
performanceMonitoringService.startPerformanceMonitoring();
console.log('✅ Performance monitoring started');

// Trust proxy for Coolify/production deployment
// This fixes express-rate-limit X-Forwarded-For header validation
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
  console.log('✅ Trust proxy enabled for production deployment');
} else {
  // For local development, also enable trust proxy to prevent issues
  app.set('trust proxy', 1);
  console.log('✅ Trust proxy enabled for local development');
}

// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Add response time tracking
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Log slow responses
    if (responseTime > 1000) {
      console.warn(`⚠️  Slow response: ${req.method} ${req.path} took ${responseTime}ms`);
      
      // Send to Sentry for monitoring
      Sentry.addBreadcrumb({
        message: `Slow response: ${req.method} ${req.path}`,
        level: 'warning',
        data: {
          method: req.method,
          path: req.path,
          responseTime: responseTime,
          statusCode: res.statusCode
        }
      });
    }

    // Track API usage metrics
    if (process.env.NODE_ENV === 'production' && responseTime > 2000) {
      Sentry.captureMessage(`Critical slow response: ${req.method} ${req.path} - ${responseTime}ms`, 'warning');
    }
  });
  
  next();
});

// Emergency health check for Coolify (no database dependency)
app.get('/health-simple', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Running Academy API',
    timestamp: new Date().toISOString(),
    startup: 'ready',
    port: PORT,
    env: process.env.NODE_ENV || 'production'
  });
});


// Load Swagger documentation
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Load OpenAPI specification
let swaggerSpec;
try {
  const specPath = join(__dirname, 'docs', 'openapi.yaml');
  swaggerSpec = yaml.load(readFileSync(specPath, 'utf8'));
  console.log('✅ OpenAPI specification loaded successfully');
} catch (error) {
  console.warn('⚠️ Could not load OpenAPI spec:', error.message);
  swaggerSpec = {
    openapi: '3.0.3',
    info: { title: 'Running Academy API', version: versionReader.getVersion('backend') },
    paths: {}
  };
}


// Enhanced Security Middleware
app.use(securityMiddleware.enhancedHelmet());
app.use(securityMiddleware.requestFingerprinting());
app.use(securityMiddleware.threatDetectionMiddleware());
app.use(securityMiddleware.xssProtection());
app.use(securityMiddleware.loginAttemptTracker());

// CORS configuration - Dynamic based on environment
const getAllowedOrigins = () => {
  const localOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
  
  const prodOrigins = [
    'https://deyarun.com',
    'https://deyarun.com/',
    'https://www.deyarun.com',
    'https://api.deyarun.com'
  ];
  
  // Add environment-specific origins
  if (process.env.CORS_ORIGIN) {
    const envOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    prodOrigins.push(...envOrigins);
  }
  
  return [...localOrigins, ...prodOrigins];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};
app.use(cors(corsOptions));

// Production rate limiting - More permissive for auth endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 50 to 200 for better user experience
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Improved key generation for proxy environments
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Skip rate limiting if we can't identify the user properly
  skip: (req) => {
    return !req.ip && !req.connection.remoteAddress;
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      // Log the raw request body for debugging
      console.log('JSON verification debug:', {
        url: req.url,
        method: req.method,
        contentType: req.get('Content-Type'),
        bodyLength: buf.length,
        rawBody: buf.toString('utf8')
      });
      
      if (buf.length === 0) {
        // Empty body is valid for some requests
        return;
      }
      
      JSON.parse(buf);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      res.status(400).json({ 
        error: 'Invalid JSON format',
        message: 'Request body must be valid JSON',
        debug: {
          bodyLength: buf.length,
          contentType: req.get('Content-Type'),
          error: e.message
        }
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session middleware for Google OAuth
app.use(session(getSessionConfig()));

// Initialize Passport conditionally (only if Google OAuth is configured)
const isGoogleOAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (isGoogleOAuthConfigured) {
  console.log('🔧 Initializing Passport with Google OAuth');
  // Import passport only if Google OAuth is configured
  const { default: passport } = await import('./config/passport.js');
  app.use(passport.initialize());
  app.use(passport.session());
} else {
  console.log('⚠️ Passport not initialized - Google OAuth not configured');
}

// Production logging - Security focused with Sentry context
app.use((req, res, next) => {
  // Add Sentry context for authenticated requests
  if (req.user) {
    Sentry.setUser({
      id: req.user.id || req.user.userId,
      email: req.user.email,
      role: req.user.role
    });
  }
  
  // Add breadcrumb for important requests
  if (req.method !== 'GET' || req.path.includes('/admin') || req.path.includes('/auth')) {
    Sentry.addBreadcrumb({
      message: `${req.method} ${req.path}`,
      category: 'http',
      level: 'info',
      data: {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
  }
  
  // Log only errors and security-relevant requests
  if (req.method !== 'GET' || req.path.includes('/admin') || req.path.includes('/auth')) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.path} - IP: ${req.ip}`);
  }
  next();
});

// Health check endpoint with database status (overwrite the simple one)
app.get('/health', async (req, res) => {
  try {
    const health = await checkDatabaseHealth();
    const isHealthy = health.mongodb.status === 'connected';
    const versionInfo = versionReader.getVersions();
    
    const response = {
      status: isHealthy ? 'OK' : 'DEGRADED',
      service: 'Running Academy API',
      timestamp: new Date().toISOString(),
      version: versionInfo.backend,
      versions: {
        backend: versionInfo.backend,
        frontend: versionInfo.frontend, 
        mobile: versionInfo.mobile
      },
      databases: {
        mongodb: health.mongodb.status
      }
    };

    res.status(isHealthy ? 200 : 503).json(response);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      service: 'Running Academy API',
      timestamp: new Date().toISOString(),
      message: 'Service unavailable'
    });
  }
});

// Versions endpoint - required by frontend
app.get('/api/versions', (req, res) => {
  try {
    const versionInfo = versionReader.getVersions();
    res.json({
      success: true,
      data: {
        backend: versionInfo.backend,
        frontend: versionInfo.frontend,
        mobile: versionInfo.mobile
      }
    });
  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get version information'
    });
  }
});

// Server IP endpoint - required by frontend dashboard
app.get('/api/server/ip', async (req, res) => {
  try {
    const os = await import('os');
    const networkInterfaces = os.networkInterfaces();
    const ips = {
      ipv4: [],
      ipv6: [],
      internal: {
        ipv4: [],
        ipv6: []
      }
    };

    // Get both external and internal IPs
    Object.values(networkInterfaces).forEach(addresses => {
      if (addresses) {
        addresses.forEach(addr => {
          if (addr.internal) {
            // Internal/local IPs
            if (addr.family === 'IPv4') {
              ips.internal.ipv4.push(addr.address);
            } else if (addr.family === 'IPv6') {
              ips.internal.ipv6.push(addr.address);
            }
          } else {
            // External IPs
            if (addr.family === 'IPv4') {
              ips.ipv4.push(addr.address);
            } else if (addr.family === 'IPv6') {
              ips.ipv6.push(addr.address);
            }
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        hostname: os.hostname(),
        primaryIPs: ips,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting server IP info:', error);
    res.status(404).json({
      success: false,
      message: 'Failed to get server IP information'
    });
  }
});

console.log('🔧 Setting up Swagger UI at /api-docs');

// API Routes
app.use('/api/auth', authDebugRoutes); // Debug routes (REMOVE IN PRODUCTION)
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes); // Google OAuth routes under /api/auth
app.use('/api/strava', stravaAuthRoutes); // Strava OAuth routes under /api/strava
app.use('/api/strava', stravaActivitiesRoutes); // Strava activities routes under /api/strava
app.use('/api/strava', stravaWebhooksRoutes); // Strava webhook routes under /api/strava
app.use('/api/google-fit', googleFitRoutes); // Google Fit routes under /api/google-fit
// Supabase auth routes removed - using /api/auth only
app.use('/api/user', userRoutes);
app.use('/api/user/notification-preferences', userNotificationPreferencesRoutes);
app.use('/api/user', userStatsRoutes); // User statistics and dashboard data
app.use('/api/user', achievementsRoutes); // Achievement system
app.use('/api', achievementsRoutes); // Achievement seeding endpoint
app.use('/api/workouts', userStatsRoutes); // Recent workouts endpoint
app.use('/api/workouts', workoutRoutes);
app.use('/api/training-plans', trainingPlanRoutes);
app.use('/api/test-planned-workouts', testPlannedWorkoutsRoutes);
app.use('/api/training-schedule', trainingScheduleRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/coach-tips', coachTipsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-conversations', aiConversationsRoutes);
app.use('/api/admin-notifications', adminNotificationsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/ai-config', aiConfigRoutes);
app.use('/api/ai-usage', aiUsageRoutes);
app.use('/api/ai-training', aiTrainingRoutes);
app.use('/api/admin', adminMonitoringRoutes);
app.use('/api/admin', adminExportsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/deployment', deploymentRoutes);
app.use('/api/server', serverInfoRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', coursesRoutes);

// Apply caching to frequently accessed routes - MUST be after routes that need authentication
app.use('/api/user/dashboard', cacheMiddleware.cacheResponse(cacheMiddleware.cacheConfigs.userProfile));
app.use('/api/workouts', cacheMiddleware.cacheResponse(cacheMiddleware.cacheConfigs.workouts));
app.use('/api/analytics', cacheMiddleware.cacheResponse(cacheMiddleware.cacheConfigs.analytics));
app.use('/api/leaderboard', cacheMiddleware.cacheResponse(cacheMiddleware.cacheConfigs.static));
app.use('/api/admin', cacheMiddleware.cacheResponse(cacheMiddleware.cacheConfigs.admin));
app.use('/api/lessons', lessonsRoutes);
app.use('/api/lessons', lessonCommentsRoutes);
app.use('/api/lessons', quizzesRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/advanced-analytics', advancedWorkoutAnalyticsRoutes);
app.use('/api/training-intelligence', trainingIntelligenceRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/push-notifications', pushNotificationsRoutes);
app.use('/api/bug-reports', bugReportsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/debug', debugWorkoutsRoutes);

// Emergency admin promotion endpoint (public, one-time use)
app.post('/emergency-admin-setup', async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    // Simple secret key check
    if (secretKey !== 'setup-runacademy-admin-2024') {
      return res.status(403).json({
        success: false,
        message: 'Invalid secret key'
      });
    }

    const { User } = await import('./models/mongodb/index.js');
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found: ${email}`
      });
    }

    // Promote to super_admin
    user.role = 'super_admin';
    user.subscriptionType = 'pro';
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.updatedAt = new Date();

    await user.save();

    console.log(`🚀 EMERGENCY: Promoted ${email} to super_admin`);

    res.json({
      success: true,
      message: `User ${email} promoted to super_admin`,
      user: {
        email: user.email,
        role: user.role,
        subscriptionType: user.subscriptionType,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('❌ Emergency admin setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup admin',
      message: error.message
    });
  }
});

// Quick user fix endpoint (temporary for debugging)
app.post('/quick-fix-user', async (req, res) => {
  try {
    const { email, newPassword, debugKey } = req.body;

    if (debugKey !== 'fix-runacademy-user-2024') {
      return res.status(403).json({ success: false, message: 'Invalid debug key' });
    }

    const bcrypt = await import('bcryptjs');
    const { User } = await import('./models/mongodb/index.js');
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fix user account
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.authProvider = 'email';
    
    if (newPassword) {
      user.password = await bcrypt.default.hash(newPassword, 12);
    }
    
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: `User ${email} fixed`,
      user: {
        email: user.email,
        firstName: user.firstName,
        isEmailVerified: user.isEmailVerified,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  const versionInfo = versionReader.getVersions();
  res.json({
    message: '🏃‍♂️ DeyaRun API',
    version: versionInfo.backend || '1.17.95',
    versions: versionInfo,
    documentation: {
      postman: '/api/docs',
      swagger: '/api-docs',
      interactive: '/api-docs'
    },
    endpoints: {
      health: '/health',
      authentication: '/api/auth',
      workouts: '/api/workouts',
      user: '/api/user',
      leaderboard: '/api/leaderboard',
      coachTips: '/api/coach-tips',
      notifications: '/api/notifications'
    },
    status: 'Running'
  });
});

// Version info endpoint
app.get('/api/versions', (req, res) => {
  const versionInfo = versionReader.getVersions();
  const syncStatus = versionReader.getVersionSyncStatus();
  
  res.json({
    success: true,
    data: versionInfo,
    sync: syncStatus,
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Running Academy API Documentation',
    version: versionReader.getVersion('backend'),
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'User login',
        'GET /auth/me': 'Get current user profile',
        'PUT /auth/me': 'Update user profile',
        'PUT /auth/change-password': 'Change password',
        'DELETE /auth/account': 'Delete account'
      },
      workouts: {
        'POST /workouts/start': 'Start new workout',
        'POST /workouts/:id/gps': 'Save GPS point',
        'PUT /workouts/:id/pause': 'Pause workout',
        'PUT /workouts/:id/resume': 'Resume workout',
        'PUT /workouts/:id/complete': 'Complete workout',
        'GET /workouts': 'Get workout history',
        'GET /workouts/:id': 'Get workout details',
        'DELETE /workouts/:id': 'Delete workout'
      },
      user: {
        'GET /user/dashboard': 'Get user dashboard data',
        'GET /user/achievements': 'Get user achievements',
        'GET /user/stats': 'Get user statistics'
      },
      trainingIntelligence: {
        'GET /training-intelligence/progress/daily/:date': 'Get daily progress report',
        'GET /training-intelligence/progress/weekly': 'Get weekly progress report', 
        'GET /training-intelligence/progress/streaks': 'Get workout streaks',
        'POST /training-intelligence/goals/assess': 'Assess goal progress',
        'POST /training-intelligence/goals/adapt-plan': 'Trigger goal-based adaptation',
        'POST /training-intelligence/predict/race-performance': 'Predict race performance',
        'GET /training-intelligence/predict/fitness-progression': 'Predict fitness progression',
        'GET /training-intelligence/predict/injury-risk': 'Predict injury risk',
        'POST /training-intelligence/generate/smart-plan': 'Generate AI-enhanced training plan',
        'GET /training-intelligence/insights/dashboard': 'Get training intelligence dashboard'
      },
      strava: {
        'GET /strava/auth': 'Start Strava OAuth flow',
        'GET /strava/callback': 'Handle Strava OAuth callback',
        'GET /strava/status': 'Check Strava connection status',
        'POST /strava/disconnect': 'Disconnect Strava account',
        'POST /strava/refresh-token': 'Refresh Strava token',
        'GET /strava/activities': 'Get user\'s Strava activities',
        'GET /strava/activities/:id': 'Get detailed Strava activity',
        'GET /strava/activities/:id/streams': 'Get activity streams (GPS, heart rate, etc.)',
        'POST /strava/sync': 'Sync user\'s recent activities',
        'POST /strava/import/:activityId': 'Convert Strava activity to DeyaRun workout',
        'GET /strava/stats': 'Get user\'s Strava statistics',
        'GET /strava/profile': 'Get athlete profile',
        'GET /strava/webhook': 'Strava webhook verification',
        'POST /strava/webhook': 'Handle Strava webhook events'
      },
      subscriptions: {
        'GET /subscriptions/plans': 'Get all available subscription plans',
        'GET /subscriptions/current': 'Get user\'s current subscription',
        'POST /subscriptions/create': 'Create new subscription',
        'POST /subscriptions/upgrade': 'Upgrade subscription',
        'POST /subscriptions/cancel': 'Cancel subscription',
        'GET /subscriptions/history': 'Get user\'s payment history',
        'POST /subscriptions/usage': 'Update subscription usage'
      },
      exercises: {
        'GET /exercises': 'Get all exercises with filtering and pagination',
        'GET /exercises/:id': 'Get single exercise details',
        'POST /exercises': 'Create new exercise (Admin only)',
        'PUT /exercises/:id': 'Update exercise (Admin only)',
        'DELETE /exercises/:id': 'Delete exercise (Admin only)',
        'POST /exercises/:id/upload-video': 'Upload video to Firebase (Admin only)',
        'PUT /exercises/:id/video-provider': 'Change video provider (Admin only)',
        'PUT /exercises/:id/toggle-status': 'Toggle active status (Admin only)',
        'GET /exercises/categories/stats': 'Get category statistics (Admin only)',
        'POST /exercises/migrate-videos': 'Migrate video provider (Admin only)',
        'GET /exercises/for-training': 'Get exercises for AI training plan generation'
      }
    }
  });
});

// Sentry test endpoint - This snippet contains an intentional error for testing
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Log Swagger UI access
app.use('/api-docs', (req, res, next) => {
  console.log('📚 Swagger UI accessed:', req.path);
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Running Academy API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));


// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    message: 'Check /api/docs for available endpoints',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Page not found',
    path: req.originalUrl,
    message: 'This is an API server. Check /api/docs for available endpoints',
    timestamp: new Date().toISOString()
  });
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // Capture error in Sentry with additional context
  Sentry.captureException(err, {
    contexts: {
      http: {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: req.headers,
        status_code: res.statusCode
      },
      user: {
        id: req.user?.userId,
        email: req.user?.email
      }
    },
    tags: {
      component: 'express-error-handler',
      endpoint: req.path
    }
  });

  // Log error for debugging
  console.error('🚨 Unhandled error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this information already exists',
      timestamp: new Date().toISOString()
    });
  }

  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong. Please try again later.',
    sentryId: res.sentry,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Close WebSocket server
    if (wsServer) {
      console.log('🔌 Closing WebSocket server...');
      wsServer.close(() => {
        console.log('✅ WebSocket server closed');
      });
    }
    
    // Stop performance monitoring
    performanceMonitoringService.stopPerformanceMonitoring();
    console.log('✅ Performance monitoring stopped');
    
    // Close database connections
    await closeConnections();
    
    // Close HTTP server
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle various shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
let server;
let wsServer;

const startServer = async () => {
  try {
    console.log('🚀 Starting Running Academy Backend...');
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔧 Node.js: ${process.version}`);
    console.log(`🔌 Port: ${PORT}`);
    
    // Start HTTP server first (so health check works)
    server = createServer(app);
    
    server.listen(PORT, '0.0.0.0', async () => {
      console.log('\n🎉 Server Started - Initializing Databases...');
      console.log('━'.repeat(50));
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`📊 Simple Health: http://localhost:${PORT}/health-simple`);
      console.log(`📊 Full Health: http://localhost:${PORT}/health`);
      console.log('━'.repeat(50));
      
      try {
        // Initialize databases after server starts
        await initializeDatabases();
        
        // Initialize Training Intelligence services
        console.log('🤖 Initializing Training Intelligence services...');
        await Promise.all([
          progressTrackingService.initializeProgressTracking(),
          goalBasedAdaptationService.initialize(),
          performancePredictionService.initialize(),
          stravaService.initialize()
        ]);
        console.log('✅ Training Intelligence services initialized');
        
        // Initialize Email services
        console.log('📧 Initializing Email services...');
        weeklyReportService.init();
        console.log('✅ Email services initialized');

        // Initialize Weekly Plan Scheduler
        console.log('🗓️ Initializing Weekly Plan Auto-Generation...');
        weeklyPlanScheduler.start();
        console.log('✅ Weekly plan scheduler started - runs every Sunday at 18:00');

        // Initialize WebSocket server
        console.log('🔌 Initializing WebSocket server...');
        wsServer = initializeWebSocketServer(server);
        console.log('✅ WebSocket server initialized');
        
        console.log('\n🎉 Running Academy Backend Fully Initialized!');
        console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
        console.log(`📚 Docs: http://localhost:${PORT}/api/docs`);
        console.log(`🔑 Auth: http://localhost:${PORT}/api/auth`);
        console.log(`💪 Workouts: http://localhost:${PORT}/api/workouts`);
        console.log(`👤 User: http://localhost:${PORT}/api/user`);
        console.log('🟢 Fully ready to receive requests!\n');
        
      } catch (initError) {
        console.error('❌ Failed to initialize services:', initError.message);
        console.log('⚠️ Server running in degraded mode - some features may not work');
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try a different port or stop the existing process');
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied to bind to port ${PORT}`);
        console.log('💡 Try using a port number greater than 1024');
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Environment:', process.env.NODE_ENV);
    console.error('❌ Memory usage:', process.memoryUsage());
    
    if (error.message.includes('database')) {
      console.log('💡 Database connection issue detected');
      console.log('💡 Using cloud databases: Supabase + MongoDB Atlas');
    }
    
    // Graceful shutdown instead of immediate exit
    setTimeout(() => process.exit(1), 1000);
  }
};

// Memory monitoring for production
process.on('warning', (warning) => {
  console.warn('⚠️ Process warning:', warning.name, warning.message);
});

// Start the server with memory monitoring
console.log('🚀 Initial memory usage:', process.memoryUsage());
startServer();