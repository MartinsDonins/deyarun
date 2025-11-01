import { useEffect, useState } from 'react';
import { auth, firebaseMessaging, firebaseAnalytics, firebasePerformance } from '../lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { logger } from '../lib/productionLogger'

// Custom hook for Firebase functionality
export const useFirebase = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
      
      if (user) {
        // Set user properties for analytics
        firebaseAnalytics.setUserId(user.uid);
        firebaseAnalytics.setUserProperties({
          email: user.email,
          email_verified: user.emailVerified
        });
        
        // Initialize FCM when user is authenticated
        initializeFCM();
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize Firebase Cloud Messaging
  const initializeFCM = async () => {
    try {
      const token = await firebasePerformance.trace('initialize_fcm', () => firebaseMessaging.initialize());
      if (token) {
        setFcmToken(token);
        
        // Store token in localStorage for persistence
        localStorage.setItem('fcm_token', token);
        
        toast.success('Push notifications enabled');
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to initialize FCM:', { error: error });
      toast.error('Failed to enable push notifications');
    }
  };

  // Request notification permissions
  const requestNotificationPermission = async () => {
    try {
      const token = await firebaseMessaging.requestPermission();
      if (token) {
        setFcmToken(token);
        localStorage.setItem('fcm_token', token);
        
        // Register with backend
        await firebaseMessaging.registerTokenWithBackend(token);
        
        toast.success('Notifications enabled successfully');
        return true;
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      logger.error('ERROR', 'Error requesting notification permission:', { error: error });
      toast.error('Failed to enable notifications');
      return false;
    }
  };

  // Disable notifications
  const disableNotifications = async () => {
    try {
      await firebaseMessaging.unregisterToken();
      setFcmToken(null);
      localStorage.removeItem('fcm_token');
      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      logger.error('ERROR', 'Error disabling notifications:', { error: error });
      toast.error('Failed to disable notifications');
      return false;
    }
  };

  // Log analytics event
  const logEvent = (eventName: string, parameters?: { [key: string]: any }) => {
    firebaseAnalytics.logEvent(eventName, parameters);
  };

  // Log page view
  const logPageView = (page: string) => {
    firebaseAnalytics.logEvent('page_view', {
      page_title: page,
      page_location: window.location.href
    });
  };

  return {
    // Auth state
    user,
    isLoading,
    isAuthenticated: !!user,
    
    // FCM state
    fcmToken,
    hasNotificationPermission: !!fcmToken,
    
    // Methods
    requestNotificationPermission,
    disableNotifications,
    logEvent,
    logPageView,
    
    // Firebase instances
    auth,
    firebaseMessaging,
    firebaseAnalytics,
    firebasePerformance
  };
};

// Hook specifically for analytics
export const useFirebaseAnalytics = () => {
  const logEvent = (eventName: string, parameters?: { [key: string]: any }) => {
    firebaseAnalytics.logEvent(eventName, parameters);
  };

  const logPageView = (page: string) => {
    firebaseAnalytics.logEvent('page_view', {
      page_title: page,
      page_location: window.location.href
    });
  };

  const logUserAction = (action: string, details?: { [key: string]: any }) => {
    firebaseAnalytics.logEvent('user_action', {
      action_name: action,
      ...details
    });
  };

  const logError = (error: string, details?: { [key: string]: any }) => {
    firebaseAnalytics.logEvent('error_occurred', {
      error_message: error,
      ...details
    });
  };

  return {
    logEvent,
    logPageView,
    logUserAction,
    logError
  };
};

// Hook specifically for push notifications
export const useFirebaseMessaging = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      
      // Check for existing token
      const existingToken = localStorage.getItem('fcm_token');
      if (existingToken) {
        setFcmToken(existingToken);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    try {
      const token = await firebaseMessaging.requestPermission();
      if (token) {
        setFcmToken(token);
        localStorage.setItem('fcm_token', token);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('ERROR', 'Error requesting FCM permission:', { error: error });
      return false;
    }
  };

  const unregister = async () => {
    try {
      await firebaseMessaging.unregisterToken();
      setFcmToken(null);
      localStorage.removeItem('fcm_token');
      return true;
    } catch (error) {
      logger.error('ERROR', 'Error unregistering FCM token:', { error: error });
      return false;
    }
  };

  return {
    fcmToken,
    isSupported,
    hasPermission: !!fcmToken,
    requestPermission,
    unregister
  };
};