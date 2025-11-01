import { Router } from 'express';
import bcrypt from 'bcryptjs';
// import prisma from '../prismaClient.js'; // REMOVED: Migrated to MongoDB
import { User, ConnectedDevice } from '../models/mongodb/index.js';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { hybridAuthMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { 
  getSubscriptionStatus, 
  getUserUsageStats, 
  addUsageInfo 
} from '../middleware/subscriptionMiddleware.js';

const router = Router();

// Get current user profile
router.get('/me', hybridAuthMiddleware, async (req, res) => {
  try {
    // Find user by postgresId (for migration compatibility) or _id
    const user = await User.findOne({
      $or: [
        { postgresId: req.user.userId.toString() },
        { _id: req.user.userId }
      ]
    }).select('firstName lastName birthDate gender weight height email phone theme fitnessLevel weeklyGoal preferredDistance sleepHours stressLevel nutritionQuality subscriptionType totalWorkouts loginCount createdAt updatedAt isEmailVerified');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      email: user.email,
      phone: user.phone,
      theme: user.theme,
      fitnessLevel: user.fitnessLevel,
      weeklyGoal: user.weeklyGoal,
      preferredDistance: user.preferredDistance,
      sleepHours: user.sleepHours,
      stressLevel: user.stressLevel,
      nutritionQuality: user.nutritionQuality,
      subscriptionType: user.subscriptionType,
      totalWorkouts: user.totalWorkouts,
      loginCount: user.loginCount,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update theme preference
router.put('/theme', hybridAuthMiddleware, async (req, res) => {
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({ message: 'Invalid theme' });
  }
  try {
    // Find and update user by postgresId or _id
    const result = await User.findOneAndUpdate(
      {
        $or: [
          { postgresId: req.user.userId.toString() },
          { _id: req.user.userId }
        ]
      },
      { theme, updatedAt: new Date() },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Theme updated' });
  } catch (err) {
    console.error('Update theme error:', err);
    res.status(500).json({ message: 'Failed to update theme' });
  }
});

// Change password
router.put('/password', hybridAuthMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password required' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    
    // Find and update user by postgresId or _id
    const result = await User.findOneAndUpdate(
      {
        $or: [
          { postgresId: req.user.userId.toString() },
          { _id: req.user.userId }
        ]
      },
      { password: hashed, updatedAt: new Date() },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Connect wearable device to user profile
router.post('/connect-device', hybridAuthMiddleware, async (req, res) => {
  const { deviceType, manufacturer, model } = req.body;
  if (!deviceType) {
    return res.status(400).json({ message: 'Device type is required' });
  }
  try {
    const connectedDevice = new ConnectedDevice({
      userId: req.user.userId,
      deviceType,
      manufacturer: manufacturer || 'Unknown',
      model: model || 'Unknown',
      connectionStatus: 'CONNECTED',
      lastSync: new Date(),
      capabilities: ['HEART_RATE', 'GPS', 'STEP_COUNT'] // Default capabilities
    });
    
    await connectedDevice.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Device connected successfully', 
      device: {
        id: connectedDevice._id,
        deviceType: connectedDevice.deviceType,
        manufacturer: connectedDevice.manufacturer,
        model: connectedDevice.model,
        status: connectedDevice.connectionStatus
      }
    });
  } catch (err) {
    console.error('Device connection error:', err);
    res.status(500).json({ message: 'Failed to connect device' });
  }
});

// Get connected devices
router.get('/devices', hybridAuthMiddleware, async (req, res) => {
  try {
    const devices = await ConnectedDevice.find({ userId: req.user.userId })
      .select('deviceType manufacturer model connectionStatus lastSync capabilities')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      devices: devices.map(device => ({
        id: device._id,
        deviceType: device.deviceType,
        manufacturer: device.manufacturer,
        model: device.model,
        status: device.connectionStatus,
        lastSync: device.lastSync,
        capabilities: device.capabilities
      }))
    });
  } catch (err) {
    console.error('Get devices error:', err);
    res.status(500).json({ message: 'Failed to get devices' });
  }
});

// Disconnect device
router.delete('/devices/:deviceId', hybridAuthMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await ConnectedDevice.findOneAndDelete({
      _id: deviceId,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json({
      success: true,
      message: 'Device disconnected successfully'
    });
  } catch (err) {
    console.error('Disconnect device error:', err);
    res.status(500).json({ message: 'Failed to disconnect device' });
  }
});

// Get user settings including integrations
router.get('/settings', hybridAuthMiddleware, async (req, res) => {
  try {
    // Find user by postgresId or _id
    const user = await User.findOne({
      $or: [
        { postgresId: req.user.userId.toString() },
        { _id: req.user.userId }
      ]
    }).select('strava googleFit garmin theme preferences notifications privacy');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build settings response
    const settings = {
      notifications: {
        email: user.notifications?.email ?? true,
        push: user.notifications?.push ?? true,
        workout_reminders: user.notifications?.workout_reminders ?? true,
        achievement_alerts: user.notifications?.achievement_alerts ?? true
      },
      privacy: {
        profile_visibility: user.privacy?.profile_visibility ?? 'public',
        activity_visibility: user.privacy?.activity_visibility ?? 'public',
        leaderboard_participation: user.privacy?.leaderboard_participation ?? true
      },
      integrations: {
        strava: {
          connected: user.strava?.isConnected ?? false,
          athlete_id: user.strava?.athleteId,
          username: user.strava?.athlete?.username,
          connected_at: user.strava?.connectedAt
        },
        garmin: {
          connected: user.garmin?.isConnected ?? false,
          device_id: user.garmin?.deviceId,
          connected_at: user.garmin?.connectedAt
        }
      },
      preferences: {
        units: user.preferences?.units ?? 'metric',
        language: user.preferences?.language ?? 'lv',
        timezone: user.preferences?.timezone ?? 'Europe/Riga',
        default_activity_type: user.preferences?.default_activity_type ?? 'running',
        theme: user.theme ?? 'dark'
      }
    };

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user settings' 
    });
  }
});

// Update user settings
router.put('/settings', hybridAuthMiddleware, async (req, res) => {
  try {
    const { notifications, privacy, preferences } = req.body;

    // Build update object
    const updateData = {};
    
    if (notifications) {
      updateData.notifications = notifications;
    }
    
    if (privacy) {
      updateData.privacy = privacy;
    }
    
    if (preferences) {
      updateData.preferences = preferences;
      // Also update theme separately for compatibility
      if (preferences.theme) {
        updateData.theme = preferences.theme;
      }
    }

    // Update user settings
    const result = await User.findOneAndUpdate(
      {
        $or: [
          { postgresId: req.user.userId.toString() },
          { _id: req.user.userId }
        ]
      },
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user settings' 
    });
  }
});

// Get user dashboard configuration
router.get('/dashboard-config', hybridAuthMiddleware, async (req, res) => {
  try {
    // Find user by postgresId or _id
    const user = await User.findOne({
      $or: [
        { postgresId: req.user.userId.toString() },
        { _id: req.user.userId }
      ]
    }).select('dashboardConfig');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      config: user.dashboardConfig || null
    });

  } catch (error) {
    console.error('Get dashboard config error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dashboard configuration' 
    });
  }
});

// Update user dashboard configuration
router.put('/dashboard-config', hybridAuthMiddleware, async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ message: 'Dashboard configuration is required' });
    }

    // Update user dashboard config
    const result = await User.findOneAndUpdate(
      {
        $or: [
          { postgresId: req.user.userId.toString() },
          { _id: req.user.userId }
        ]
      },
      { 
        $set: { 
          dashboardConfig: config,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Dashboard configuration updated successfully'
    });

  } catch (error) {
    console.error('Update dashboard config error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update dashboard configuration' 
    });
  }
});

// Complete onboarding
router.post('/onboarding/complete', hybridAuthMiddleware, async (req, res) => {
  try {
    console.log('🎯 Onboarding complete request:', {
      userId: req.user?.userId,
      userObject: req.user,
      body: req.body
    });

    if (!req.user || !req.user.userId) {
      console.error('❌ No user or userId found in request');
      return res.status(400).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    // Extract onboarding data from request body
    const { onboardingData } = req.body;
    
    // Prepare update object with onboarding data
    const updateData = {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add onboarding data fields if provided
    if (onboardingData) {
      Object.assign(updateData, onboardingData);
    }

    // Find user by postgresId or _id
    const user = await User.findOneAndUpdate(
      {
        $or: [
          { postgresId: req.user.userId.toString() },
          { _id: req.user.userId }
        ]
      },
      { $set: updateData },
      { new: true }
    );
    
    console.log('👤 User found and updated:', {
      found: !!user,
      email: user?.email,
      onboardingCompleted: user?.onboardingCompleted
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    console.error('❌ Complete onboarding error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete onboarding',
      error: error.message
    });
  }
});

// Check if user needs onboarding
router.get('/onboarding/status', hybridAuthMiddleware, async (req, res) => {
  try {
    // Find user by postgresId or _id
    const user = await User.findOne({
      $or: [
        { postgresId: req.user.userId.toString() },
        { _id: req.user.userId }
      ]
    }).select('onboardingCompleted height weight birthDate gender fitnessLevel weeklyGoal preferredDistance sleepHours stressLevel');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if onboarding is needed
    const needsOnboarding = !user.onboardingCompleted && (
      !user.height || !user.weight || !user.birthDate || !user.gender ||
      !user.fitnessLevel || !user.weeklyGoal || !user.preferredDistance
    );

    const completedSteps = {
      profile: !!(user.height && user.weight && user.birthDate && user.gender),
      health: !!(user.fitnessLevel && user.sleepHours && user.stressLevel),
      goals: !!(user.weeklyGoal && user.preferredDistance)
    };

    res.json({
      success: true,
      needsOnboarding,
      completedSteps,
      onboardingCompleted: user.onboardingCompleted || false
    });

  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check onboarding status' 
    });
  }
});

// Update user profile
router.put('/profile', hybridAuthMiddleware, async (req, res) => {
  try {
    const { 
      firstName, lastName, height, weight, birthDate, gender,
      fitnessLevel, sleepHours, stressLevel, nutritionQuality,
      weeklyGoal, preferredDistance
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    
    // Basic profile fields
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (gender !== undefined) updateData.gender = gender;
    
    // Health fields
    if (fitnessLevel !== undefined) updateData.fitnessLevel = fitnessLevel;
    if (sleepHours !== undefined) updateData.sleepHours = sleepHours;
    if (stressLevel !== undefined) updateData.stressLevel = stressLevel;
    if (nutritionQuality !== undefined) updateData.nutritionQuality = nutritionQuality;
    
    // Goals fields
    if (weeklyGoal !== undefined) updateData.weeklyGoal = weeklyGoal;
    if (preferredDistance !== undefined) updateData.preferredDistance = preferredDistance;
    
    updateData.updatedAt = new Date();

    // Find and update user by postgresId or _id
    const result = await User.findOneAndUpdate(
      {
        $or: [
          { postgresId: req.user.userId.toString() },
          { _id: req.user.userId }
        ]
      },
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: result._id,
        firstName: result.firstName,
        lastName: result.lastName,
        height: result.height,
        weight: result.weight,
        birthDate: result.birthDate,
        gender: result.gender,
        fitnessLevel: result.fitnessLevel,
        sleepHours: result.sleepHours,
        stressLevel: result.stressLevel,
        nutritionQuality: result.nutritionQuality,
        weeklyGoal: result.weeklyGoal,
        preferredDistance: result.preferredDistance
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update profile' 
    });
  }
});

// GET /api/user/subscription-status - Get detailed subscription status and usage
router.get('/subscription-status', hybridAuthMiddleware, async (req, res) => {
  try {
    console.log(`🔍 Getting subscription status for user ${req.user.userId}`);

    // Find user
    const user = await User.findOne({
      $or: [
        { postgresId: req.user.userId.toString() },
        { _id: req.user.userId }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get subscription status and usage
    const subscriptionStatus = getSubscriptionStatus(user);
    const usageStats = await getUserUsageStats(user._id);

    // Calculate usage percentages
    const trainingPlanUsage = subscriptionStatus.features.maxTrainingPlans === -1 ? 0 : 
      Math.round((usageStats.activeTrainingPlans / subscriptionStatus.features.maxTrainingPlans) * 100);

    const workoutUsage = subscriptionStatus.features.maxWorkoutsPerMonth === -1 ? 0 : 
      Math.round((usageStats.monthlyWorkouts / subscriptionStatus.features.maxWorkoutsPerMonth) * 100);

    // Calculate days until renewal/expiry
    let daysUntilRenewal = null;
    if (subscriptionStatus.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(subscriptionStatus.expiresAt);
      daysUntilRenewal = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    }

    // Generate upgrade suggestions
    const upgradeRecommendations = [];
    if (subscriptionStatus.level === 'free') {
      if (trainingPlanUsage > 80) {
        upgradeRecommendations.push({
          feature: 'unlimited_training_plans',
          reason: 'You\'re nearing your training plan limit',
          requiredPlan: 'premium'
        });
      }
      if (workoutUsage > 80) {
        upgradeRecommendations.push({
          feature: 'unlimited_workouts',
          reason: 'You\'re nearing your monthly workout limit',
          requiredPlan: 'premium'
        });
      }
      upgradeRecommendations.push({
        feature: 'ai_coaching',
        reason: 'Get AI-powered training recommendations',
        requiredPlan: 'premium'
      });
    }

    if (subscriptionStatus.level === 'premium') {
      upgradeRecommendations.push({
        feature: 'personal_coach',
        reason: 'Get 1-on-1 coaching sessions',
        requiredPlan: 'pro'
      });
    }

    const response = {
      success: true,
      subscription: {
        plan: subscriptionStatus.plan,
        level: subscriptionStatus.level,
        isActive: subscriptionStatus.isActive,
        expiresAt: subscriptionStatus.expiresAt,
        isExpired: subscriptionStatus.isExpired,
        daysUntilRenewal,
        features: subscriptionStatus.features
      },
      usage: {
        trainingPlans: {
          current: usageStats.activeTrainingPlans,
          limit: subscriptionStatus.features.maxTrainingPlans,
          percentage: trainingPlanUsage,
          unlimited: subscriptionStatus.features.maxTrainingPlans === -1
        },
        workouts: {
          monthly: usageStats.monthlyWorkouts,
          limit: subscriptionStatus.features.maxWorkoutsPerMonth,
          percentage: workoutUsage,
          unlimited: subscriptionStatus.features.maxWorkoutsPerMonth === -1,
          resetsOn: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        dataRetention: {
          days: subscriptionStatus.features.dataRetention,
          unlimited: subscriptionStatus.features.dataRetention === -1,
          cutoffDate: subscriptionStatus.features.dataRetention === -1 ? null : 
            new Date(Date.now() - subscriptionStatus.features.dataRetention * 24 * 60 * 60 * 1000)
        }
      },
      limits: {
        approaching: trainingPlanUsage > 80 || workoutUsage > 80,
        trainingPlansLimitReached: subscriptionStatus.features.maxTrainingPlans !== -1 && 
          usageStats.activeTrainingPlans >= subscriptionStatus.features.maxTrainingPlans,
        workoutsLimitReached: subscriptionStatus.features.maxWorkoutsPerMonth !== -1 && 
          usageStats.monthlyWorkouts >= subscriptionStatus.features.maxWorkoutsPerMonth
      },
      recommendations: upgradeRecommendations,
      featureAccess: {
        aiCoaching: subscriptionStatus.features.aiCoaching,
        personalCoach: subscriptionStatus.features.personalCoach,
        advancedAnalytics: subscriptionStatus.features.advancedAnalytics,
        prioritySupport: subscriptionStatus.features.prioritySupport,
        unlimitedPlans: subscriptionStatus.features.maxTrainingPlans === -1,
        unlimitedWorkouts: subscriptionStatus.features.maxWorkoutsPerMonth === -1,
        fullDataHistory: subscriptionStatus.features.dataRetention === -1
      }
    };

    console.log(`✅ Subscription status retrieved for user ${req.user.userId}:`, {
      plan: subscriptionStatus.plan,
      usage: `${usageStats.activeTrainingPlans}/${subscriptionStatus.features.maxTrainingPlans} plans, ${usageStats.monthlyWorkouts}/${subscriptionStatus.features.maxWorkoutsPerMonth} workouts`
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status',
      message: error.message
    });
  }
});

export default router;