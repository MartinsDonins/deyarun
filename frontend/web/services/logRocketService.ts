import LogRocket from 'logrocket';
import { logger } from '../lib/productionLogger'

/**
 * LogRocket service for DeyaRun web frontend
 * Provides session recording and debugging capabilities for web application
 */

interface LogRocketConfig {
  appId: string;
  enabled: boolean;
  environment: string;
}

// Configuration based on environment
const getLogRocketConfig = (): LogRocketConfig => {
  // Check if LogRocket should be enabled (only in production by default)
  const isProduction = process.env.NODE_ENV === 'production';
  const enabledEnv = process.env.NEXT_PUBLIC_LOGROCKET_ENABLED;
  
  return {
    appId: 'd2nxam/runacademy',
    enabled: enabledEnv === 'true' || (isProduction && enabledEnv !== 'false'),
    environment: isProduction ? 'production' : 'development'
  };
};

// Track if LogRocket has been initialized to prevent multiple initialization
let isLogRocketInitialized = false;

/**
 * Initialize LogRocket with proper configuration
 */
export const initializeLogRocket = (): boolean => {
  // Only run on client side
  if (typeof window === 'undefined') {
    logger.info('COMPONENT', '📹 LogRocket skipped - server-side rendering');
    return false;
  }

  // Prevent multiple initialization
  if (isLogRocketInitialized) {
    logger.info('COMPONENT', '📹 LogRocket already initialized - skipping duplicate initialization');
    return true;
  }

  const config = getLogRocketConfig();
  
  if (!config.enabled) {
    logger.info('COMPONENT', '📹 LogRocket disabled - session recording not active');
    logger.info('COMPONENT', '   Set NEXT_PUBLIC_LOGROCKET_ENABLED=true to enable LogRocket');
    isLogRocketInitialized = true; // Mark as "initialized" to prevent future attempts
    return false;
  }

  try {
    logger.info('COMPONENT', '📹 Initializing LogRocket...');
    
    LogRocket.init(config.appId, {
      // Release tracking for better debugging
      release: '2.8.1',
      
      // Network settings
      network: {
        requestSanitizer: (request) => {
          // Remove sensitive data from network requests
          if (request.url.includes('/auth/') || request.url.includes('/login')) {
            if (request.body) {
              try {
                const body = JSON.parse(request.body);
                if (body.password) body.password = '[REDACTED]';
                if (body.token) body.token = '[REDACTED]';
                request.body = JSON.stringify(body);
              } catch (e) {
                // If not JSON, just redact the whole body for auth endpoints
                request.body = '[REDACTED]';
              }
            }
          }
          return request;
        },
        
        responseSanitizer: (response) => {
          // Remove sensitive data from responses
          if (response.url.includes('/auth/') || response.url.includes('/login')) {
            try {
              const body = JSON.parse(response.body);
              if (body.token) body.token = '[REDACTED]';
              if (body.accessToken) body.accessToken = '[REDACTED]';
              if (body.refreshToken) body.refreshToken = '[REDACTED]';
              response.body = JSON.stringify(body);
            } catch (e) {
              // If not JSON, leave as is
            }
          }
          return response;
        }
      }
    });

    logger.info('COMPONENT', '✅ LogRocket initialized successfully');
    logger.info('COMPONENT', '   App ID: ${config.appId }');
    logger.info('COMPONENT', '   Environment: ${config.environment }');
    logger.info('COMPONENT', '   Release: 2.8.1');
    
    // Mark as initialized to prevent future attempts
    isLogRocketInitialized = true;
    
    return true;
    
  } catch (error) {
    logger.error('ERROR', '❌ Failed to initialize LogRocket:', { error: error });
    return false;
  }
};

/**
 * Identify user for LogRocket session tracking
 */
export const identifyLogRocketUser = (user: {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}) => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    LogRocket.identify(user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
      // Add custom traits
      platform: 'web',
      app: 'runacademy'
    });
    
    logger.info('COMPONENT', '👤 LogRocket user identified:', { id: user.id });
  } catch (error) {
    logger.error('ERROR', '❌ LogRocket identify failed:', { error: error });
  }
};

/**
 * Add custom event to LogRocket session
 */
export const logRocketEvent = (eventName: string, properties: Record<string, any> = {}) => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    LogRocket.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      platform: 'web'
    });
    
    logger.info('COMPONENT', '📊 LogRocket event:', { eventName, properties });
  } catch (error) {
    logger.error('ERROR', '❌ LogRocket event failed:', { error: error });
  }
};

/**
 * Add tags to LogRocket session (if supported)
 */
export const addLogRocketTags = (tags: string[]) => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Use LogRocket.track for tagging instead
    LogRocket.track('session_tags', { tags });
    logger.info('COMPONENT', '🏷️ LogRocket tags added:', { tags });
  } catch (error) {
    logger.error('ERROR', '❌ LogRocket tags failed:', { error: error });
  }
};

/**
 * Capture exception in LogRocket
 */
export const logRocketCaptureException = (error: Error, context: Record<string, any> = {}) => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Use LogRocket.track for error logging
    LogRocket.track('error_captured', {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString(),
      platform: 'web'
    });
    
    logger.info('COMPONENT', '🚨 LogRocket exception captured:', { message: error.message });
  } catch (e) {
    logger.error('ERROR', '❌ LogRocket capture exception failed:', { error: e });
  }
};

/**
 * Get LogRocket session URL for debugging
 */
export const getLogRocketSessionURL = (): Promise<string | null> => {
  return new Promise((resolve) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    try {
      LogRocket.getSessionURL((url) => {
        logger.info('COMPONENT', '🔗 LogRocket session URL:', { url });
        resolve(url);
      });
    } catch (error) {
      logger.error('ERROR', '❌ LogRocket get session URL failed:', { error: error });
      resolve(null);
    }
  });
};

// Export LogRocket instance for direct access
export { LogRocket };

export default {
  initialize: initializeLogRocket,
  identifyUser: identifyLogRocketUser,
  trackEvent: logRocketEvent,
  addTags: addLogRocketTags,
  captureException: logRocketCaptureException,
  getSessionURL: getLogRocketSessionURL
};