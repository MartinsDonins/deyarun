import { logger } from '../lib/productionLogger'
// Google Analytics 4 Integration
// Provides comprehensive event tracking and user analytics for DeyaRun web application

// Global gtag function type declaration
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Helper function to safely access gtag
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

// Google Analytics configuration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Initialize Google Analytics
export const initializeGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
    
    logger.info('COMPONENT', '🔍 Google Analytics initialized:', { GA_MEASUREMENT_ID });
  }
};

// Page view tracking
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: title || document.title,
      page_location: url,
    });
  }
};

// Enhanced ecommerce and custom event interfaces
interface UserProperties {
  user_id?: string;
  email?: string;
  subscription_tier?: 'free' | 'premium' | 'pro';
  account_age_days?: number;
  preferred_workout_type?: string;
}

interface WorkoutEventProperties {
  workout_type?: string;
  duration_minutes?: number;
  distance_km?: number;
  calories_burned?: number;
  difficulty_level?: string;
  completion_rate?: number;
}

interface NavigationEventProperties {
  from_page?: string;
  to_page?: string;
  navigation_type?: 'click' | 'back' | 'direct';
}

interface EngagementEventProperties {
  content_type?: string;
  content_id?: string;
  engagement_time_msec?: number;
  scroll_depth?: number;
}

// User identification and properties
export const setUserProperties = (properties: UserProperties) => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    gtag('config', GA_MEASUREMENT_ID, {
      user_id: properties.user_id,
      custom_map: {
        subscription_tier: properties.subscription_tier,
        account_age_days: properties.account_age_days,
        preferred_workout_type: properties.preferred_workout_type
      }
    });
    
    // Set user properties
    gtag('set', {
      user_properties: {
        subscription_tier: properties.subscription_tier,
        account_age_days: properties.account_age_days,
        preferred_workout_type: properties.preferred_workout_type
      }
    });
  }
};

// Core analytics events
export const trackEvent = (
  action: string,
  category: string = 'general',
  label?: string,
  value?: number,
  customParameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParameters,
    });
  }
};

// Authentication events
export const trackLogin = (method: string = 'email') => {
  trackEvent('login', 'authentication', method);
};

export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', 'authentication', method);
};

export const trackLogout = () => {
  trackEvent('logout', 'authentication');
};

// Workout-related events
export const trackWorkoutStart = (properties: WorkoutEventProperties) => {
  trackEvent('workout_start', 'fitness', properties.workout_type, properties.duration_minutes, {
    workout_type: properties.workout_type,
    difficulty_level: properties.difficulty_level,
    estimated_duration: properties.duration_minutes
  });
};

export const trackWorkoutComplete = (properties: WorkoutEventProperties) => {
  trackEvent('workout_complete', 'fitness', properties.workout_type, properties.duration_minutes, {
    workout_type: properties.workout_type,
    duration_minutes: properties.duration_minutes,
    distance_km: properties.distance_km,
    calories_burned: properties.calories_burned,
    completion_rate: properties.completion_rate,
    difficulty_level: properties.difficulty_level
  });
};

export const trackWorkoutPause = (workoutType: string, currentDuration: number) => {
  trackEvent('workout_pause', 'fitness', workoutType, currentDuration, {
    workout_type: workoutType,
    pause_at_minutes: currentDuration
  });
};

export const trackWorkoutResume = (workoutType: string, pausedDuration: number) => {
  trackEvent('workout_resume', 'fitness', workoutType, pausedDuration, {
    workout_type: workoutType,
    paused_for_minutes: pausedDuration
  });
};

// Training plan events
export const trackTrainingPlanView = (planId: string, planType: string) => {
  trackEvent('view_training_plan', 'training', planType, undefined, {
    plan_id: planId,
    plan_type: planType
  });
};

export const trackTrainingPlanStart = (planId: string, planType: string, duration: number) => {
  trackEvent('start_training_plan', 'training', planType, duration, {
    plan_id: planId,
    plan_type: planType,
    plan_duration_weeks: duration
  });
};

// Navigation and engagement events
export const trackNavigation = (properties: NavigationEventProperties) => {
  trackEvent('page_navigation', 'navigation', properties.to_page, undefined, {
    from_page: properties.from_page,
    to_page: properties.to_page,
    navigation_type: properties.navigation_type
  });
};

export const trackEngagement = (properties: EngagementEventProperties) => {
  trackEvent('engagement', 'user_engagement', properties.content_type, properties.engagement_time_msec, {
    content_type: properties.content_type,
    content_id: properties.content_id,
    engagement_time_msec: properties.engagement_time_msec,
    scroll_depth: properties.scroll_depth
  });
};

// Admin and analytics events
export const trackAdminAction = (action: string, target: string, value?: string | number) => {
  trackEvent('admin_action', 'administration', `${action}_${target}`, typeof value === 'number' ? value : undefined, {
    admin_action: action,
    target_type: target,
    action_value: value
  });
};

export const trackAnalyticsView = (dashboardType: string, timeRange: string) => {
  trackEvent('view_analytics', 'analytics', dashboardType, undefined, {
    dashboard_type: dashboardType,
    time_range: timeRange
  });
};

// Performance monitoring events
export const trackPerformance = (metricName: string, value: number, category: string = 'performance') => {
  trackEvent('performance_metric', category, metricName, value, {
    metric_name: metricName,
    metric_value: value,
    timestamp: Date.now()
  });
};

// Error tracking
export const trackError = (error: string, category: string = 'javascript_error', fatal: boolean = false) => {
  trackEvent('exception', 'error', category, undefined, {
    description: error,
    fatal: fatal,
    error_category: category
  });
};

// Subscription and monetization events
export const trackSubscriptionUpgrade = (fromTier: string, toTier: string, price: number) => {
  trackEvent('purchase', 'ecommerce', 'subscription_upgrade', price, {
    transaction_id: `sub_${Date.now()}`,
    affiliation: 'DeyaRun',
    value: price,
    currency: 'USD',
    item_category: 'subscription',
    from_tier: fromTier,
    to_tier: toTier
  });
};

export const trackSubscriptionCancel = (tier: string, reason?: string) => {
  trackEvent('subscription_cancel', 'ecommerce', tier, undefined, {
    subscription_tier: tier,
    cancel_reason: reason
  });
};

// Content engagement events
export const trackContentView = (contentType: string, contentId: string, contentTitle: string) => {
  trackEvent('select_content', 'content', contentType, undefined, {
    content_type: contentType,
    content_id: contentId,
    content_title: contentTitle
  });
};

export const trackVideoPlay = (videoId: string, videoTitle: string, duration?: number) => {
  trackEvent('video_start', 'video', videoId, duration, {
    video_id: videoId,
    video_title: videoTitle,
    video_duration: duration
  });
};

export const trackVideoComplete = (videoId: string, watchTime: number, totalDuration: number) => {
  trackEvent('video_complete', 'video', videoId, watchTime, {
    video_id: videoId,
    watch_time: watchTime,
    completion_rate: totalDuration > 0 ? (watchTime / totalDuration) * 100 : 0
  });
};

// Search and discovery events
export const trackSearch = (searchTerm: string, category?: string, resultsCount?: number) => {
  trackEvent('search', 'discovery', category || 'general', resultsCount, {
    search_term: searchTerm,
    search_category: category,
    results_count: resultsCount
  });
};

export const trackFilterUse = (filterType: string, filterValue: string, resultsCount?: number) => {
  trackEvent('filter_use', 'discovery', filterType, resultsCount, {
    filter_type: filterType,
    filter_value: filterValue,
    results_count: resultsCount
  });
};

// Social and sharing events
export const trackShare = (contentType: string, contentId: string, shareMethod: string) => {
  trackEvent('share', 'social', shareMethod, undefined, {
    content_type: contentType,
    content_id: contentId,
    share_method: shareMethod
  });
};

// Goal and achievement events
export const trackGoalSet = (goalType: string, goalValue: number, timeframe: string) => {
  trackEvent('set_goal', 'goals', goalType, goalValue, {
    goal_type: goalType,
    goal_value: goalValue,
    timeframe: timeframe
  });
};

export const trackGoalAchieved = (goalType: string, goalValue: number, actualValue: number) => {
  trackEvent('goal_achieved', 'goals', goalType, actualValue, {
    goal_type: goalType,
    target_value: goalValue,
    actual_value: actualValue,
    achievement_rate: goalValue > 0 ? (actualValue / goalValue) * 100 : 0
  });
};

// Custom conversion events
export const trackConversion = (conversionType: string, value?: number, currency: string = 'USD') => {
  trackEvent('conversion', 'business', conversionType, value, {
    conversion_type: conversionType,
    value: value,
    currency: currency
  });
};

// Export all tracking functions
export const analytics = {
  initialize: initializeGA,
  setUserProperties,
  trackPageView,
  trackEvent,
  
  // Authentication
  trackLogin,
  trackSignUp,
  trackLogout,
  
  // Workouts
  trackWorkoutStart,
  trackWorkoutComplete,
  trackWorkoutPause,
  trackWorkoutResume,
  
  // Training
  trackTrainingPlanView,
  trackTrainingPlanStart,
  
  // Navigation
  trackNavigation,
  trackEngagement,
  
  // Admin
  trackAdminAction,
  trackAnalyticsView,
  
  // Performance
  trackPerformance,
  trackError,
  
  // Subscription
  trackSubscriptionUpgrade,
  trackSubscriptionCancel,
  
  // Content
  trackContentView,
  trackVideoPlay,
  trackVideoComplete,
  
  // Search
  trackSearch,
  trackFilterUse,
  
  // Social
  trackShare,
  
  // Goals
  trackGoalSet,
  trackGoalAchieved,
  
  // Conversion
  trackConversion
};

export default analytics;
