// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

// Check if GA is enabled and available
export const isGAEnabled = () => {
  return GA_MEASUREMENT_ID && typeof window !== 'undefined' && window.gtag
}

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!isGAEnabled()) return
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: title || document.title,
    page_location: url,
  })
}

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!isGAEnabled()) return
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Predefined event tracking functions
export const analytics = {
  // Authentication events
  login: (method: 'email' | 'google') => {
    trackEvent('login', 'auth', method)
  },
  
  logout: () => {
    trackEvent('logout', 'auth')
  },
  
  register: (method: 'email' | 'google') => {
    trackEvent('sign_up', 'auth', method)
  },
  
  // User actions
  profileUpdate: () => {
    trackEvent('profile_update', 'user')
  },
  
  passwordReset: () => {
    trackEvent('password_reset', 'auth')
  },
  
  // Training events
  workoutCreated: () => {
    trackEvent('workout_created', 'training')
  },
  
  workoutCompleted: (duration: number) => {
    trackEvent('workout_completed', 'training', 'duration', duration)
  },
  
  // Course enrollment
  courseEnroll: (courseType: 'free' | 'paid', courseName: string) => {
    trackEvent('course_enroll', 'course', `${courseType}_${courseName}`)
  },
  
  // Lesson completion
  lessonCompleted: (lessonTitle: string) => {
    trackEvent('lesson_completed', 'course', lessonTitle)
  },
  
  // Navigation
  pageView: (pageName: string) => {
    trackEvent('page_view', 'navigation', pageName)
  },
  
  // Admin actions
  adminAction: (action: string) => {
    trackEvent(action, 'admin')
  },
  
  // Subscription events
  subscriptionUpgrade: (plan: string) => {
    trackEvent('subscription_upgrade', 'subscription', plan)
  },
  
  subscriptionCancel: () => {
    trackEvent('subscription_cancel', 'subscription')
  }
}
