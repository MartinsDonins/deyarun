// Subscription-based access control middleware - MongoDB implementation
import { User, Workout, TrainingPlan } from '../models/mongodb/index.js';

console.log('✅ Subscription middleware enabled with MongoDB support');

/**
 * Check if user has an active subscription
 */
export const checkActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        accessLevel: 'none'
      });
    }

    // Check subscription status
    const subscriptionStatus = getSubscriptionStatus(user);
    req.user.subscription = subscriptionStatus;

    // Allow request to continue with subscription info attached
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify subscription status',
      accessLevel: 'none'
    });
  }
};

/**
 * Middleware to require premium subscription
 */
export const requirePremium = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        requiredPlan: 'premium'
      });
    }

    const subscriptionStatus = getSubscriptionStatus(user);

    if (subscriptionStatus.level === 'free') {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        message: 'This feature is available for Premium and Pro users only',
        currentPlan: subscriptionStatus.plan,
        requiredPlan: 'premium',
        subscriptionStatus: subscriptionStatus
      });
    }

    req.user.subscription = subscriptionStatus;
    next();
  } catch (error) {
    console.error('Premium access check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify premium access',
      requiredPlan: 'premium'
    });
  }
};

/**
 * Middleware to require pro subscription
 */
export const requirePro = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        requiredPlan: 'pro'
      });
    }

    const subscriptionStatus = getSubscriptionStatus(user);

    if (subscriptionStatus.level !== 'pro') {
      return res.status(403).json({
        success: false,
        error: 'Pro subscription required',
        message: 'This feature is available for Pro users only',
        currentPlan: subscriptionStatus.plan,
        requiredPlan: 'pro',
        subscriptionStatus: subscriptionStatus
      });
    }

    req.user.subscription = subscriptionStatus;
    next();
  } catch (error) {
    console.error('Pro access check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify pro access',
      requiredPlan: 'pro'
    });
  }
};

/**
 * Utility function to get user subscription status
 */
export const getSubscriptionStatus = (user) => {
  const now = new Date();
  const subscriptionType = user.subscriptionType || 'free';
  const expiresAt = user.subscriptionExpiresAt;

  // Free users never expire
  if (subscriptionType === 'free') {
    return {
      plan: 'free',
      level: 'free',
      isActive: true,
      expiresAt: null,
      isExpired: false,
      features: {
        maxTrainingPlans: 2,
        maxWorkoutsPerMonth: 20,
        aiCoaching: false,
        personalCoach: false,
        advancedAnalytics: false,
        dataRetention: 30, // days
        prioritySupport: false
      }
    };
  }

  // Check if subscription has expired
  const isExpired = expiresAt && new Date(expiresAt) < now;
  
  if (isExpired) {
    return {
      plan: 'free', // Downgrade to free
      level: 'free',
      isActive: false,
      expiresAt: expiresAt,
      isExpired: true,
      features: {
        maxTrainingPlans: 2,
        maxWorkoutsPerMonth: 20,
        aiCoaching: false,
        personalCoach: false,
        advancedAnalytics: false,
        dataRetention: 30, // days
        prioritySupport: false
      }
    };
  }

  // Premium subscription features
  if (subscriptionType === 'premium') {
    return {
      plan: 'premium',
      level: 'premium',
      isActive: true,
      expiresAt: expiresAt,
      isExpired: false,
      features: {
        maxTrainingPlans: -1, // unlimited
        maxWorkoutsPerMonth: -1, // unlimited
        aiCoaching: true,
        personalCoach: false,
        advancedAnalytics: true,
        dataRetention: -1, // unlimited
        prioritySupport: true
      }
    };
  }

  // Pro subscription features
  if (subscriptionType === 'pro') {
    return {
      plan: 'pro',
      level: 'pro',
      isActive: true,
      expiresAt: expiresAt,
      isExpired: false,
      features: {
        maxTrainingPlans: -1, // unlimited
        maxWorkoutsPerMonth: -1, // unlimited
        aiCoaching: true,
        personalCoach: true,
        advancedAnalytics: true,
        dataRetention: -1, // unlimited
        prioritySupport: true
      }
    };
  }

  // Default to free if unknown subscription type
  return {
    plan: 'free',
    level: 'free',
    isActive: true,
    expiresAt: null,
    isExpired: false,
    features: {
      maxTrainingPlans: 2,
      maxWorkoutsPerMonth: 20,
      aiCoaching: false,
      personalCoach: false,
      advancedAnalytics: false,
      dataRetention: 30, // days
      prioritySupport: false
    }
  };
};

/**
 * Middleware to check user's subscription status and limits
 */
export const checkSubscriptionLimits = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const subscriptionStatus = getSubscriptionStatus(user);
      req.userSubscription = subscriptionStatus;

      // Check feature access
      if (!hasFeatureAccess(subscriptionStatus, feature)) {
        return res.status(403).json({
          success: false,
          error: `${feature} requires premium subscription`,
          currentPlan: subscriptionStatus.plan,
          subscriptionStatus: subscriptionStatus
        });
      }

      next();
    } catch (error) {
      console.error('Subscription limits check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify subscription limits'
      });
    }
  };
};

/**
 * Middleware to add subscription info to all authenticated requests
 */
export const addSubscriptionInfo = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const subscriptionStatus = getSubscriptionStatus(user);
        req.userSubscription = subscriptionStatus;
        req.user.subscription = subscriptionStatus;
      }
    }

    next();
  } catch (error) {
    console.error('Add subscription info error:', error);
    next(); // Continue without subscription info
  }
};

/**
 * Helper function to check if user has feature access
 */
export const hasFeatureAccess = (subscription, feature) => {
  if (!subscription || !subscription.features) {
    return false;
  }

  switch (feature) {
    case 'ai_coaching':
      return subscription.features.aiCoaching;
    case 'personal_coach':
      return subscription.features.personalCoach;
    case 'advanced_analytics':
      return subscription.features.advancedAnalytics;
    case 'priority_support':
      return subscription.features.prioritySupport;
    case 'unlimited_plans':
      return subscription.features.maxTrainingPlans === -1;
    case 'unlimited_workouts':
      return subscription.features.maxWorkoutsPerMonth === -1;
    default:
      return true; // Allow unknown features
  }
};

/**
 * Get user's current usage statistics
 */
export const getUserUsageStats = async (userId) => {
  try {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count active training plans
    const activeTrainingPlans = await TrainingPlan.countDocuments({
      userId,
      isActive: true
    });

    // Count workouts this month
    const monthlyWorkouts = await Workout.countDocuments({
      userId,
      createdAt: { $gte: monthStart }
    });

    // Count total workouts (for retention limits)
    const totalWorkouts = await Workout.countDocuments({ userId });

    // Get data retention date (30 days for free users)
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 30);

    return {
      activeTrainingPlans,
      monthlyWorkouts,
      totalWorkouts,
      currentMonth,
      retentionDate
    };
  } catch (error) {
    console.error('Get usage stats error:', error);
    return {
      activeTrainingPlans: 0,
      monthlyWorkouts: 0,
      totalWorkouts: 0,
      currentMonth: new Date().toISOString().slice(0, 7),
      retentionDate: new Date()
    };
  }
};

/**
 * Middleware to check training plan creation limits
 */
export const checkTrainingPlanLimit = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const subscriptionStatus = getSubscriptionStatus(user);
    const usageStats = await getUserUsageStats(userId);

    // Check if user has reached training plan limit
    const maxPlans = subscriptionStatus.features.maxTrainingPlans;
    
    if (maxPlans !== -1 && usageStats.activeTrainingPlans >= maxPlans) {
      return res.status(403).json({
        success: false,
        error: 'Training plan limit reached',
        message: `Your ${subscriptionStatus.plan} plan allows up to ${maxPlans} active training plans. You currently have ${usageStats.activeTrainingPlans}.`,
        currentPlan: subscriptionStatus.plan,
        usage: {
          current: usageStats.activeTrainingPlans,
          limit: maxPlans
        },
        upgradeRequired: true,
        suggestedPlan: subscriptionStatus.level === 'free' ? 'premium' : 'pro'
      });
    }

    req.userSubscription = subscriptionStatus;
    req.userUsage = usageStats;
    next();
  } catch (error) {
    console.error('Training plan limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify training plan limits'
    });
  }
};

/**
 * Middleware to check monthly workout limits
 */
export const checkWorkoutLimit = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const subscriptionStatus = getSubscriptionStatus(user);
    const usageStats = await getUserUsageStats(userId);

    // Check if user has reached monthly workout limit
    const maxWorkouts = subscriptionStatus.features.maxWorkoutsPerMonth;
    
    if (maxWorkouts !== -1 && usageStats.monthlyWorkouts >= maxWorkouts) {
      return res.status(403).json({
        success: false,
        error: 'Monthly workout limit reached',
        message: `Your ${subscriptionStatus.plan} plan allows up to ${maxWorkouts} workouts per month. You currently have ${usageStats.monthlyWorkouts}.`,
        currentPlan: subscriptionStatus.plan,
        usage: {
          current: usageStats.monthlyWorkouts,
          limit: maxWorkouts,
          resetsOn: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        upgradeRequired: true,
        suggestedPlan: subscriptionStatus.level === 'free' ? 'premium' : 'pro'
      });
    }

    req.userSubscription = subscriptionStatus;
    req.userUsage = usageStats;
    next();
  } catch (error) {
    console.error('Workout limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify workout limits'
    });
  }
};

/**
 * Middleware to check data retention access (for historical data)
 */
export const checkDataRetentionAccess = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const subscriptionStatus = getSubscriptionStatus(user);
    
    // If unlimited data retention, allow access
    if (subscriptionStatus.features.dataRetention === -1) {
      req.userSubscription = subscriptionStatus;
      return next();
    }

    // For free users, check if data is within retention period
    const retentionDays = subscriptionStatus.features.dataRetention;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    // Add retention filter to request
    req.dataRetentionFilter = {
      createdAt: { $gte: retentionDate }
    };
    req.retentionDate = retentionDate;
    req.userSubscription = subscriptionStatus;

    next();
  } catch (error) {
    console.error('Data retention check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify data retention access'
    });
  }
};

/**
 * Add usage information to response for frontend display
 */
export const addUsageInfo = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (userId && req.userSubscription) {
      const usageStats = req.userUsage || await getUserUsageStats(userId);
      
      // Add usage info to response
      const originalJson = res.json;
      res.json = function(data) {
        if (data && typeof data === 'object' && data.success !== false) {
          data.subscriptionInfo = {
            plan: req.userSubscription.plan,
            features: req.userSubscription.features,
            usage: {
              trainingPlans: {
                current: usageStats.activeTrainingPlans,
                limit: req.userSubscription.features.maxTrainingPlans
              },
              workouts: {
                monthly: usageStats.monthlyWorkouts,
                limit: req.userSubscription.features.maxWorkoutsPerMonth,
                resetsOn: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
              }
            },
            needsUpgrade: false // Will be set by individual checks
          };
        }
        return originalJson.call(this, data);
      };
    }

    next();
  } catch (error) {
    console.error('Add usage info error:', error);
    next(); // Continue without usage info
  }
};

export default {
  checkActiveSubscription,
  requirePremium,
  requirePro,
  checkSubscriptionLimits,
  addSubscriptionInfo,
  hasFeatureAccess,
  getUserUsageStats,
  getSubscriptionStatus,
  checkTrainingPlanLimit,
  checkWorkoutLimit,
  checkDataRetentionAccess,
  addUsageInfo
};