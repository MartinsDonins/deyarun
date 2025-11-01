import '../styles/theme.css'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { trackPageView } from '../lib/analytics'
import { Toaster } from 'react-hot-toast'
import { initializeLogRocket, identifyLogRocketUser } from '../services/logRocketService'
import { analytics } from '../utils/analytics'
import { logger } from '../lib/productionLogger'

// Component that uses AuthContext - must be inside AuthProvider
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Track with existing analytics
      trackPageView(url)
      
      // Track with Google Analytics
      analytics.trackPageView(url)
      
      // Track navigation event
      analytics.trackNavigation({
        to_page: url,
        from_page: router.asPath,
        navigation_type: 'click'
      })
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events, router.asPath])

  // Initialize Google Analytics and LogRocket
  useEffect(() => {
    try {
      // Initialize Google Analytics
      analytics.initialize();
      
      // Initialize LogRocket
      initializeLogRocket();
    } catch (error) {
      logger.error('ERROR', 'Failed to initialize analytics services:', { error: error });
    }
  }, []);

  // Identify user with analytics services when authenticated
  useEffect(() => {
    if (user && user.id) {
      try {
        // Identify user with LogRocket
        identifyLogRocketUser({
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role || 'user'
        });

        // Set Google Analytics user properties
        analytics.setUserProperties({
          user_id: user.id,
          email: user.email,
          subscription_tier: (user.subscriptionType as 'free' | 'premium' | 'pro') || 'free',
          preferred_workout_type: 'running' // Default workout type
        });
      } catch (error) {
        logger.error('ERROR', 'Failed to identify user with analytics services:', { error: error });
      }
    }
  }, [user]);

  // Register service worker for Firebase Messaging (with error handling)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register if Firebase is properly configured
      const firebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-firebase-api-key';
                                  
      if (firebaseConfigured) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then((registration) => {
            logger.info('COMPONENT', 'Firebase SW registered:', { registration });
          })
          .catch((error) => {
            logger.warn('WARNING', 'Firebase SW registration failed (non-critical):', { error });
            // Don't throw error - this is optional functionality
          });
      } else {
        logger.info('COMPONENT', 'Firebase not configured, skipping service worker registration');
      }
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
          },
          success: {
            style: {
              background: '#1A1A1A',
              color: '#fff',
              border: '1px solid #FF6B47',
            },
          },
          error: {
            style: {
              background: '#1A1A1A',
              color: '#fff',
              border: '1px solid #ef4444',
            },
          },
        }}
      />
    </>
  )
}

export default function MyApp(appProps: AppProps) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent {...appProps} />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
