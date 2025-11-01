import { logger } from '../lib/productionLogger'
// Environment configuration validation for Next.js
// This file validates that all required environment variables are present

interface EnvironmentConfig {
  // Firebase Configuration
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
    vapidKey?: string;
  };
  
  // API Configuration
  api: {
    baseUrl: string;
  };
  
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

// Validate and export environment configuration
export const env: EnvironmentConfig = {
  firebase: {
    apiKey: getRequiredEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getRequiredEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getRequiredEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getRequiredEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getRequiredEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getRequiredEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID'),
    measurementId: getRequiredEnvVar('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
    vapidKey: getOptionalEnvVar('NEXT_PUBLIC_FIREBASE_VAPID_KEY'),
  },
  
  api: {
    baseUrl: getRequiredEnvVar('NEXT_PUBLIC_API_URL'),
  },
  
  supabase: {
    url: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  },
  
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate configuration on import
if (typeof window === 'undefined') {
  // Server-side validation
  logger.info('COMPONENT', '🔧 Environment configuration validated');
  
  // Log configuration status (without sensitive values)
  logger.info('COMPONENT', 'Environment config:', {
    firebase: {
      projectId: env.firebase.projectId,
      hasApiKey: !!env.firebase.apiKey,
      hasVapidKey: !!env.firebase.vapidKey,
    },
    api: {
      baseUrl: env.api.baseUrl,
    },
    environment: process.env.NODE_ENV,
  });
}

export default env;