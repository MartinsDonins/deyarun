// This file configures the initialization of Sentry on the server side.
// To learn more about this configuration, see https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for debugging
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  
  environment: process.env.NODE_ENV || 'production',
  
  // Configure release information
  release: `running-academy-web@2.2.7`,
  
  // Add initial scope for better error tracking
  initialScope: {
    tags: {
      service: 'running-academy-web',
      component: 'frontend-server',
      version: '2.2.7'
    }
  },
  
  // Filter out some common server errors
  beforeSend(event) {
    // Don't send events for health check endpoints
    if (event.request?.url?.includes('/health') || 
        event.request?.url?.includes('/api/health')) {
      return null;
    }
    
    // Don't send events for favicon requests
    if (event.request?.url?.includes('favicon.ico')) {
      return null;
    }
    
    return event;
  }
});