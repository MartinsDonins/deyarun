// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getPerformance, trace as createTrace, PerformanceTrace } from "firebase/performance";

import { logger } from '../lib/productionLogger'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBXRjFgdxnBk7U1DQVG6YLcUiKow-2OzNQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "running-academy-9eff6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "running-academy-9eff6",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "running-academy-9eff6.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "757275609167",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:757275609167:web:35605d27129400de94023a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XYYDD8XVNH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (only in browser environment)
let analytics: Analytics | null = null;
let performance: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  performance = getPerformance(app);
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Messaging
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Firebase Cloud Messaging functions
export const firebaseMessaging = {
  // Request notification permission and get FCM token
  async requestPermission(): Promise<string | null> {
    if (!messaging) {
      logger.warn('WARNING', 'Firebase Messaging not supported in this environment');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          logger.info('COMPONENT', '🔑 FCM Token obtained:', { token });
          return token;
        } else {
          logger.warn('WARNING', '⚠️ No registration token available');
          return null;
        }
      } else {
        logger.warn('WARNING', '⚠️ Notification permission denied');
        return null;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error getting FCM token:', { error: error });
      return null;
    }
  },

  // Listen for foreground messages
  onForegroundMessage(callback: (payload: any) => void) {
    if (!messaging) {
      logger.warn('WARNING', 'Firebase Messaging not supported');
      return () => {};
    }
    
    return onMessage(messaging, (payload) => {
      logger.info('COMPONENT', '🔔 Message received in foreground:', { payload });
      callback(payload);
    });
  },

  // Register FCM token with backend
  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push-notifications/register-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          token,
          platform: 'web',
          tokenType: 'fcm',
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: 'web'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        logger.info('COMPONENT', '✅ FCM token registered with backend');
        return true;
      } else {
        logger.warn('WARNING', '⚠️ Failed to register FCM token:', { error: result.error });
        return false;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error registering FCM token with backend:', { error: error });
      return false;
    }
  },

  // Initialize web push notifications
  async initialize(): Promise<string | null> {
    try {
      // Request permission and get token
      const token = await this.requestPermission();
      
      if (token) {
        // Register token with backend
        await this.registerTokenWithBackend(token);
        
        // Set up foreground message listener
        this.onForegroundMessage((payload) => {
          // Show notification if app is in foreground
          this.showForegroundNotification(payload);
        });
        
        return token;
      }
      
      return null;
    } catch (error) {
      logger.error('ERROR', '❌ Error initializing Firebase Messaging:', { error: error });
      return null;
    }
  },

  // Show notification when app is in foreground
  showForegroundNotification(payload: any) {
    const { notification } = payload;
    
    if (notification) {
      // You can customize this to show your own notification UI
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: payload.data?.type || 'default',
          data: payload.data
        });
      }
    }
  },

  // Unregister FCM token
  async unregisterToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/push-notifications/unregister-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        logger.info('COMPONENT', '✅ FCM token unregistered');
        return true;
      } else {
        logger.warn('WARNING', '⚠️ Failed to unregister FCM token:', { error: result.error });
        return false;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error unregistering FCM token:', { error: error });
      return false;
    }
  }
};

// Firebase Analytics functions
export const firebaseAnalytics = {
  // Log custom events
  logEvent(eventName: string, parameters?: { [key: string]: any }) {
    if (analytics) {
      import('firebase/analytics').then(({ logEvent }) => {
        logEvent(analytics!, eventName, parameters);
      });
    }
  },

  // Set user properties
  setUserProperties(properties: { [key: string]: any }) {
    if (analytics) {
      import('firebase/analytics').then(({ setUserProperties }) => {
        setUserProperties(analytics!, properties);
      });
    }
  },

  // Set user ID
  setUserId(userId: string) {
    if (analytics) {
      import('firebase/analytics').then(({ setUserId }) => {
        setUserId(analytics!, userId);
      });
    }
  }
};

// Firebase Performance Monitoring functions
export const firebasePerformance = {
  startTrace(name: string): PerformanceTrace | null {
    if (!performance) {
      return null;
    }
    const trace = createTrace(performance, name);
    trace.start();
    return trace;
  },

  async trace<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const t = this.startTrace(name);
    try {
      return await fn();
    } finally {
      t?.stop();
    }
  }
};

// Export the app instance
export default app;
export { analytics, performance };