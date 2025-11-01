// Web Push Notification Service
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { getAuthToken } from '../utils/auth';

import { logger } from '../lib/productionLogger'

// Firebase config (should match your project)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
}

interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class WebPushService {
  private messaging: any = null;
  private isInitialized = false;
  private currentToken: string | null = null;
  private vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  constructor() {
    this.initialize();
  }

  // Initialize Firebase messaging
  private async initialize(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        logger.warn('WARNING', '⚠️ Web Push Service only works in browser environment');
        return;
      }

      if (!this.isSupported()) {
        logger.warn('WARNING', '⚠️ Push notifications not supported in this browser');
        return;
      }

      // Initialize Firebase app
      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);

      // Setup service worker
      await this.setupServiceWorker();

      // Setup message handler
      this.setupMessageHandler();

      this.isInitialized = true;
      logger.info('COMPONENT', '✅ Web Push Service initialized');

    } catch (error) {
      logger.error('ERROR', '❌ Failed to initialize Web Push Service:', { error: error });
    }
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' && 
      'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window
    );
  }

  // Setup service worker
  private async setupServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        logger.info('COMPONENT', '✅ Service Worker registered:', { registration });

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Service Worker registration failed:', { error: error });
    }
  }

  // Setup message handler for foreground messages
  private setupMessageHandler(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      logger.info('COMPONENT', '📱 Foreground message received:', { payload });
      this.handleForegroundMessage(payload);
    });
  }

  // Handle foreground messages
  private handleForegroundMessage(payload: any): void {
    const { notification, data } = payload;
    
    if (notification) {
      this.showBrowserNotification({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: data || {},
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icons/view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/close.png'
          }
        ]
      });
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        logger.warn('WARNING', '⚠️ Push notifications not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        logger.info('COMPONENT', '✅ Notification permission granted');
        return true;
      } else {
        logger.info('COMPONENT', '❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error requesting notification permission:', { error: error });
      return false;
    }
  }

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      if (!this.messaging || !this.vapidKey) {
        logger.warn('WARNING', '⚠️ Firebase messaging or VAPID key not configured');
        return null;
      }

      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        this.currentToken = token;
        logger.info('COMPONENT', '✅ FCM token obtained:', { tokenPreview: token.substring(0, 20) + '...' });
        return token;
      } else {
        logger.warn('WARNING', '⚠️ No FCM token received');
        return null;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error getting FCM token:', { error: error });
      return null;
    }
  }

  // Check if user has granted permission
  async hasPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    return Notification.permission === 'granted';
  }

  // Register token with backend
  async registerToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push-notifications/register', {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookie auth
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          platform: 'web'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        logger.info('COMPONENT', '✅ Token registered with backend');
        localStorage.setItem('webPushToken', token);
        return true;
      } else {
        logger.error('ERROR', '❌ Failed to register token:', { error: result.message });
        return false;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error registering token:', { error: error });
      return false;
    }
  }

  // Unregister token from backend
  async unregisterToken(token?: string): Promise<boolean> {
    try {
      const tokenToRemove = token || this.currentToken;
      if (!tokenToRemove) return true;

      const response = await fetch('/api/push-notifications/token', {
        method: 'DELETE',
        credentials: 'include', // Use httpOnly cookie auth
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: tokenToRemove
        })
      });

      const result = await response.json();
      
      if (result.success) {
        logger.info('COMPONENT', '✅ Token unregistered from backend');
        localStorage.removeItem('webPushToken');
        this.currentToken = null;
        return true;
      } else {
        logger.error('ERROR', '❌ Failed to unregister token:', { error: result.message });
        return false;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error unregistering token:', { error: error });
      return false;
    }
  }

  // Show browser notification
  private async showBrowserNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (!this.isSupported() || !(await this.hasPermission())) {
        logger.warn('WARNING', '⚠️ Cannot show notification: no permission or not supported');
        return;
      }

      // Check if page is visible
      if (document.visibilityState === 'visible') {
        // Page is visible, show in-app notification instead
        this.showInAppNotification(payload);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const notificationOptions: any = {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        data: payload.data,
        requireInteraction: true,
        tag: payload.data?.type || 'default'
      };

      // Add actions if provided
      if (payload.actions && payload.actions.length > 0) {
        notificationOptions.actions = payload.actions.map(action => ({
          action: action.action,
          title: action.title,
          icon: action.icon
        }));
      }

      // Add image if supported (some browsers support it)
      if (payload.image) {
        notificationOptions.image = payload.image;
      }

      await registration.showNotification(payload.title, notificationOptions);

    } catch (error) {
      logger.error('ERROR', '❌ Error showing browser notification:', { error: error });
    }
  }

  // Show in-app notification for visible pages
  private showInAppNotification(payload: NotificationPayload): void {
    if (typeof document === 'undefined') return;

    // Create and show custom in-app notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-coral-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'ml-2 text-white hover:text-gray-200';
    closeButton.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;
    closeButton.onclick = () => notification.remove();

    const content = document.createElement('div');
    content.className = 'flex items-start';
    content.innerHTML = `
      <div class="flex-1">
        <h4 class="font-bold text-sm">${payload.title}</h4>
        <p class="text-sm opacity-90 mt-1">${payload.body}</p>
      </div>
    `;
    content.appendChild(closeButton);
    
    notification.appendChild(content);
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);

    // Handle click
    notification.addEventListener('click', (e) => {
      if (e.target !== closeButton && payload.data?.click_action) {
        window.location.href = payload.data.click_action;
      }
      notification.remove();
    });
  }

  // Send test notification
  async sendTestNotification(): Promise<boolean> {
    try {
      const response = await fetch('/api/push-notifications/test', {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookie auth
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        logger.info('COMPONENT', '✅ Test notification sent');
        return true;
      } else {
        logger.error('ERROR', '❌ Failed to send test notification:', { error: result.message });
        return false;
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error sending test notification:', { error: error });
      return false;
    }
  }

  // Enable notifications
  async enableNotifications(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      const token = await this.getFCMToken();
      if (!token) return false;

      const registered = await this.registerToken(token);
      return registered;
    } catch (error) {
      logger.error('ERROR', '❌ Error enabling notifications:', { error: error });
      return false;
    }
  }

  // Disable notifications
  async disableNotifications(): Promise<boolean> {
    try {
      const success = await this.unregisterToken();
      return success;
    } catch (error) {
      logger.error('ERROR', '❌ Error disabling notifications:', { error: error });
      return false;
    }
  }

  // Get current token
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Check if initialized
  isReady(): boolean {
    return this.isInitialized && this.isSupported();
  }
}

// Create and export singleton instance
export const webPushService = new WebPushService();
export default webPushService;