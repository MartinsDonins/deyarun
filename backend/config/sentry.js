import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry error tracking and performance monitoring
 * Configured for DeyaRun backend production monitoring
 */
export function initializeSentry() {
  // Only initialize Sentry if DSN is configured
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    console.log('⚠️ Sentry DSN not configured - error tracking disabled');
    console.log('   Set SENTRY_DSN environment variable to enable Sentry monitoring');
    return false;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      
      // Environment configuration
      environment: process.env.NODE_ENV || 'production',
      
      // Release tracking for better debugging
      release: `runacademy@${process.env.npm_package_version || '1.8.33'}`,
      
      // Performance monitoring - sample 10% of transactions in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Profiling - sample 10% of profiles in production  
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      integrations: [
        // Profiling integration for performance insights
        nodeProfilingIntegration(),
        
        // HTTP integration to track API requests
        Sentry.httpIntegration({
          tracing: {
            // Don't create spans for health check requests
            ignoreIncomingRequests: (url) => {
              return url.includes('/health') || url.includes('/api-docs');
            },
          },
        }),
        
        // Express integration for better Express.js support
        Sentry.expressIntegration({
          shouldAddDefaultRoutes: true,
        }),
      ],
      
      // Configure what data to send
      beforeSend(event, hint) {
        // Don't send health check errors
        if (event.request?.url?.includes('/health')) {
          return null;
        }
        
        // Don't send 404 errors for static files
        if (event.request?.url?.includes('/favicon.ico') || 
            event.request?.url?.includes('.js.map')) {
          return null;
        }
        
        // Log error locally for debugging
        console.error('🚨 Sentry Error:', {
          message: hint.originalException?.message || event.message,
          level: event.level,
          url: event.request?.url,
          timestamp: new Date().toISOString()
        });
        
        return event;
      },
      
      // Security - don't send sensitive data
      beforeSendTransaction(event) {
        // Remove query parameters from URLs that might contain sensitive data
        if (event.request?.url) {
          event.request.url = event.request.url.split('?')[0];
        }
        
        return event;
      },
      
      // Tag all events with service info
      initialScope: {
        tags: {
          service: 'runacademy-backend',
          component: 'api-server',
          version: process.env.npm_package_version || '1.8.33'
        },
        level: 'info'
      }
    });

    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`   Release: runacademy@${process.env.npm_package_version || '1.8.33'}`);
    console.log(`   DSN: ${sentryDsn.substring(0, 50)}...`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error.message);
    return false;
  }
}

/**
 * Add Sentry context for better error tracking
 */
export function setSentryContext(context) {
  if (!Sentry.getCurrentHub().getClient()) return;
  
  Sentry.configureScope((scope) => {
    scope.setContext('custom', context);
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user) {
  if (!Sentry.getCurrentHub().getClient()) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role
  });
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
  if (!Sentry.getCurrentHub().getClient()) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * Manually capture exception with additional context
 */
export function captureException(error, context = {}) {
  if (!Sentry.getCurrentHub().getClient()) {
    console.error('🚨 Error (Sentry disabled):', error);
    return;
  }
  
  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setTag(key, context[key]);
    });
    
    // Capture the exception
    Sentry.captureException(error);
  });
}

/**
 * Capture message with custom level
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!Sentry.getCurrentHub().getClient()) {
    console.log(`📝 Message (Sentry disabled): ${message}`);
    return;
  }
  
  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setTag(key, context[key]);
    });
    
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

// Export Sentry instance for direct access if needed
export { Sentry };