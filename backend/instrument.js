// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://38480274b8f04b7487637332f7a19585@glitchtip.coredigify.com/15",
  
  // Tracing - Capture 100% of the transactions in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Send structured logs to Sentry
  enableLogs: true,

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'production',
  
  // Release tracking for better debugging
  release: `runacademy-backend@2.2.8`,
  
  // Additional configuration for Express.js
  integrations: [
    // Add profiling integration
    nodeProfilingIntegration(),
    
    // HTTP integration for tracking API requests
    Sentry.httpIntegration(),
    
    // Express integration for better Express.js support
    Sentry.expressIntegration(),
  ],
  
  // Security - Filter out sensitive data
  beforeSend(event) {
    // Don't send health check errors
    if (event.request?.url?.includes('/health')) {
      return null;
    }
    
    // Don't send 404 errors for static files
    if (event.request?.url?.includes('/favicon.ico') || 
        event.request?.url?.includes('.js.map')) {
      return null;
    }
    
    return event;
  },
  
  // Tag all events with service info
  initialScope: {
    tags: {
      service: 'runacademy-backend',
      component: 'api-server',
      version: '1.8.33'
    }
  }
});

console.log('✅ Sentry initialized with new configuration');
console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`   DSN: https://455b5586426f768f522cb2b63cad1462@...`);