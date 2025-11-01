// This file configures the initialization of Sentry for edge runtime.
// To learn more about this configuration, see https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for debugging
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  environment: process.env.NODE_ENV || 'production',
  
  // Configure release information
  release: `running-academy-web@2.2.7`,
  
  // Add initial scope for better error tracking
  initialScope: {
    tags: {
      service: 'running-academy-web',
      component: 'frontend-edge',
      version: '2.2.7'
    }
  }
});