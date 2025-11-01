// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://4e980db01b6d911266b9b85a3494f11b@o4509779750944768.ingest.de.sentry.io/4509779863470160",
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for debugging
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable logs to be sent to Sentry
  enableLogs: true,
  
  // For production, we want to replay errors and track performance
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  
  environment: process.env.NODE_ENV || 'production',
  
  // Configure release information
  release: `running-academy-web@2.8.1`,
  
  // Add initial scope for better error tracking
  initialScope: {
    tags: {
      service: 'running-academy-web',
      component: 'frontend',
      version: '2.8.1'
    }
  },
  
  // Filter out some common browser errors
  beforeSend(event) {
    // Don't send events for common browser extension errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('extension') || 
          error?.value?.includes('chrome-extension') ||
          error?.value?.includes('Script error')) {
        return null;
      }
    }
    
    // Don't send events for dev server hot reload errors
    if (event.request?.url?.includes('_next/webpack-hmr')) {
      return null;
    }
    
    return event;
  },
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;