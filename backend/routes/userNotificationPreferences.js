// User Notification Preferences Routes
import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { User } from '../models/mongodb/index.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user notification preferences
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('notificationsEnabled');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Default preferences structure
    const defaultPreferences = {
      notificationsEnabled: user.notificationsEnabled !== false,
      workoutReminders: true,
      achievementAlerts: true,
      courseUpdates: true,
      weeklyProgress: true,
      socialUpdates: false,
      systemUpdates: true,
      emailNotifications: true,
      pushNotifications: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    // If user has detailed preferences, merge them
    const userPreferences = user.notificationPreferences || {};
    const preferences = { ...defaultPreferences, ...userPreferences };

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('❌ Get user notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user notification preferences
router.put('/', async (req, res) => {
  try {
    const { 
      notificationsEnabled,
      workoutReminders,
      achievementAlerts,
      courseUpdates,
      weeklyProgress,
      socialUpdates,
      systemUpdates,
      emailNotifications,
      pushNotifications,
      quietHours
    } = req.body;

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the main notification toggle
    user.notificationsEnabled = notificationsEnabled;

    // Update detailed preferences
    const preferences = {
      workoutReminders: workoutReminders !== undefined ? workoutReminders : true,
      achievementAlerts: achievementAlerts !== undefined ? achievementAlerts : true,
      courseUpdates: courseUpdates !== undefined ? courseUpdates : true,
      weeklyProgress: weeklyProgress !== undefined ? weeklyProgress : true,
      socialUpdates: socialUpdates !== undefined ? socialUpdates : false,
      systemUpdates: systemUpdates !== undefined ? systemUpdates : true,
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      quietHours: quietHours || {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    user.notificationPreferences = preferences;

    await user.save();

    console.log(`⚙️ User ${user.email} updated notification preferences`);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        notificationsEnabled: user.notificationsEnabled,
        ...preferences
      }
    });

  } catch (error) {
    console.error('❌ Update user notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get notification statistics for user
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('deviceTokens notificationsEnabled email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const activeTokens = user.deviceTokens ? user.deviceTokens.filter(token => token.isActive) : [];
    const platforms = {};
    
    activeTokens.forEach(token => {
      const platform = token.platform || 'unknown';
      platforms[platform] = (platforms[platform] || 0) + 1;
    });

    const stats = {
      notificationsEnabled: user.notificationsEnabled !== false,
      totalDeviceTokens: user.deviceTokens ? user.deviceTokens.length : 0,
      activeDeviceTokens: activeTokens.length,
      platforms,
      canReceiveNotifications: user.notificationsEnabled !== false && activeTokens.length > 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get user notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

console.log('✅ User notification preferences routes initialized');
export default router;