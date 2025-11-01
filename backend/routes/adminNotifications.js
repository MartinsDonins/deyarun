// Admin Push Notifications Management - MongoDB Integration
import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import notificationService from '../services/notificationService.js';
import firebaseFCMService from '../services/firebaseFCMService.js';
import { User } from '../models/mongodb/index.js';

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Test notification sending interface
router.post('/test-notification', async (req, res) => {
  try {
    const { userId, title, body, type, data, platform } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and body are required'
      });
    }

    // Find user to get basic info
    const user = await User.findById(userId).select('email name deviceTokens');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notification = {
      type: type || 'test',
      title,
      body,
      data: {
        ...data,
        sentBy: 'admin',
        adminUserId: req.user.userId,
        timestamp: new Date().toISOString()
      },
      priority: 'normal'
    };

    let result;
    if (platform === 'web') {
      // Send web push notification (will implement web service)
      result = await notificationService.sendToUser(userId, notification);
    } else {
      // Send mobile push notification
      result = await firebaseFCMService.sendToUser(userId, notification, notification.data);
    }

    // Log admin action
    console.log(`📱 Admin ${req.user.email} sent test notification to ${user.email}`);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        targetUser: {
          id: user._id,
          email: user.email,
          name: user.name,
          deviceTokens: user.deviceTokens.length
        },
        notification,
        result
      }
    });

  } catch (error) {
    console.error('❌ Admin test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bulk notification sending
router.post('/send-bulk', async (req, res) => {
  try {
    const { userIds, title, body, type, data, criteria } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    let targetUserIds = userIds || [];

    // If criteria provided, find matching users
    if (criteria && !userIds) {
      const query = {};
      
      if (criteria.subscriptionType) {
        query.subscriptionType = criteria.subscriptionType;
      }
      if (criteria.fitnessLevel) {
        query.fitnessLevel = criteria.fitnessLevel;
      }
      if (criteria.lastActiveAfter) {
        query.updatedAt = { $gte: new Date(criteria.lastActiveAfter) };
      }
      if (criteria.hasDeviceTokens) {
        query.deviceTokens = { $exists: true, $not: { $size: 0 } };
      }

      const users = await User.find(query).select('_id');
      targetUserIds = users.map(u => u._id.toString());
    }

    if (targetUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No target users found'
      });
    }

    const notification = {
      type: type || 'admin_broadcast',
      title,
      body,
      data: {
        ...data,
        sentBy: 'admin',
        adminUserId: req.user.userId,
        timestamp: new Date().toISOString(),
        broadcast: true
      },
      priority: 'normal'
    };

    // Send notifications
    const results = await firebaseFCMService.sendToUsers(targetUserIds, notification, notification.data);

    // Calculate stats
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    // Log admin action
    console.log(`📱 Admin ${req.user.email} sent bulk notification to ${targetUserIds.length} users`);

    res.json({
      success: true,
      message: `Bulk notification sent: ${successCount} successful, ${failureCount} failed`,
      data: {
        totalTargeted: targetUserIds.length,
        successful: successCount,
        failed: failureCount,
        notification,
        results: results.slice(0, 10), // Show first 10 results
        criteria: criteria || null
      }
    });

  } catch (error) {
    console.error('❌ Admin bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get notification templates
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      workout_reminder: {
        title: '🏃‍♂️ Workout Reminder',
        body: 'Time for your scheduled workout! Ready to run?',
        type: 'workout_reminder',
        data: { click_action: '/workouts' }
      },
      achievement: {
        title: '🏆 New Achievement!',
        body: 'Congratulations! You\'ve unlocked a new achievement.',
        type: 'achievement',
        data: { click_action: '/profile/achievements' }
      },
      course_update: {
        title: '📚 Course Update',
        body: 'New content is available in your running course.',
        type: 'course_update',
        data: { click_action: '/courses' }
      },
      weekly_progress: {
        title: '📊 Weekly Progress Report',
        body: 'Your weekly running summary is ready!',
        type: 'weekly_progress',
        data: { click_action: '/progress' }
      },
      social_update: {
        title: '👥 Social Update',
        body: 'Check out what your friends have been up to!',
        type: 'social_update',
        data: { click_action: '/social' }
      },
      system_update: {
        title: '🔧 System Update',
        body: 'Important system information for DeyaRun users.',
        type: 'system_update',
        data: { click_action: '/notifications' }
      },
      maintenance: {
        title: '⚠️ Maintenance Notice',
        body: 'Scheduled maintenance will begin shortly. Thank you for your patience.',
        type: 'system_update',
        data: { click_action: '/notifications', priority: 'high' }
      }
    };

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ Get notification templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification templates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user notification stats
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('email name deviceTokens notificationsEnabled');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const tokenInfo = await firebaseFCMService.getUserTokens(userId);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          notificationsEnabled: user.notificationsEnabled !== false
        },
        tokens: tokenInfo,
        canReceiveNotifications: tokenInfo.activeTokens > 0 && user.notificationsEnabled !== false
      }
    });

  } catch (error) {
    console.error('❌ Get user notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user notification stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get platform statistics
router.get('/platform-stats', async (req, res) => {
  try {
    // Get all users with device tokens
    const users = await User.find({
      deviceTokens: { $exists: true, $not: { $size: 0 } }
    }).select('deviceTokens notificationsEnabled');

    let totalUsers = users.length;
    let enabledUsers = 0;
    let totalTokens = 0;
    let activeTokens = 0;
    let platformStats = {
      ios: 0,
      android: 0,
      web: 0,
      unknown: 0
    };

    users.forEach(user => {
      if (user.notificationsEnabled !== false) {
        enabledUsers++;
      }

      user.deviceTokens.forEach(token => {
        totalTokens++;
        if (token.isActive) {
          activeTokens++;
          const platform = token.platform || 'unknown';
          platformStats[platform] = (platformStats[platform] || 0) + 1;
        }
      });
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          enabledUsers,
          disabledUsers: totalUsers - enabledUsers,
          totalTokens,
          activeTokens,
          inactiveTokens: totalTokens - activeTokens
        },
        platforms: platformStats,
        percentages: {
          usersWithNotifications: totalUsers > 0 ? Math.round((enabledUsers / totalUsers) * 100) : 0,
          activeTokensPercentage: totalTokens > 0 ? Math.round((activeTokens / totalTokens) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Scheduled notification management
router.post('/schedule-notification', async (req, res) => {
  try {
    const { userIds, title, body, type, data, scheduledFor, recurring } = req.body;
    
    if (!title || !body || !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'Title, body, and scheduled time are required'
      });
    }

    const scheduleDate = new Date(scheduledFor);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    // For now, queue the notification (would implement proper job scheduling)
    const notification = {
      type: type || 'scheduled',
      title,
      body,
      data: {
        ...data,
        sentBy: 'admin',
        adminUserId: req.user.userId,
        scheduled: true,
        scheduledFor: scheduleDate.toISOString()
      },
      priority: 'normal'
    };

    // Queue notification for each user
    if (userIds && userIds.length > 0) {
      userIds.forEach(userId => {
        notificationService.queueNotification(userId, notification, scheduleDate);
      });
    }

    console.log(`📅 Admin ${req.user.email} scheduled notification for ${scheduleDate}`);

    res.json({
      success: true,
      message: 'Notification scheduled successfully',
      data: {
        notification,
        scheduledFor: scheduleDate,
        targetUsers: userIds ? userIds.length : 0,
        recurring
      }
    });

  } catch (error) {
    console.error('❌ Schedule notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Clean up invalid tokens
router.post('/cleanup-tokens', async (req, res) => {
  try {
    const result = await firebaseFCMService.cleanupInvalidTokens();

    console.log(`🧹 Admin ${req.user.email} initiated token cleanup`);

    res.json({
      success: true,
      message: 'Token cleanup completed',
      data: result
    });

  } catch (error) {
    console.error('❌ Token cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup tokens',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Admin notification preferences
router.get('/admin-preferences', async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId).select('adminNotificationPreferences email');
    
    const defaultPreferences = {
      receiveUserSignups: true,
      receiveErrorAlerts: true,
      receiveSystemUpdates: true,
      receiveWeeklyReports: true,
      receiveSecurityAlerts: true,
      emailNotifications: true,
      pushNotifications: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    const preferences = admin?.adminNotificationPreferences || defaultPreferences;

    res.json({
      success: true,
      data: {
        adminEmail: admin?.email,
        preferences
      }
    });

  } catch (error) {
    console.error('❌ Get admin preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update admin notification preferences
router.put('/admin-preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Preferences are required'
      });
    }

    await User.findByIdAndUpdate(
      req.user.userId,
      { adminNotificationPreferences: preferences },
      { new: true, upsert: true }
    );

    console.log(`⚙️ Admin ${req.user.email} updated notification preferences`);

    res.json({
      success: true,
      message: 'Admin notification preferences updated',
      data: { preferences }
    });

  } catch (error) {
    console.error('❌ Update admin preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send admin alert notification
router.post('/admin-alert', async (req, res) => {
  try {
    const { title, body, type, priority, data } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    // Find all admin users
    const adminUsers = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      adminNotificationPreferences: { $ne: null }
    }).select('_id email adminNotificationPreferences');

    const notification = {
      type: type || 'admin_alert',
      title: `[ADMIN] ${title}`,
      body,
      data: {
        ...data,
        isAdminAlert: true,
        sentBy: req.user.email,
        timestamp: new Date().toISOString()
      },
      priority: priority || 'high'
    };

    const results = [];
    for (const admin of adminUsers) {
      const prefs = admin.adminNotificationPreferences;
      if (prefs?.pushNotifications !== false) {
        const result = await firebaseFCMService.sendToUser(admin._id, notification, notification.data);
        results.push({ adminId: admin._id, email: admin.email, ...result });
      }
    }

    console.log(`🚨 Admin alert sent by ${req.user.email} to ${results.length} admins`);

    res.json({
      success: true,
      message: 'Admin alert sent successfully',
      data: {
        notification,
        targetAdmins: results.length,
        results
      }
    });

  } catch (error) {
    console.error('❌ Send admin alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send admin alert',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

console.log('✅ Admin notification management routes initialized');
export default router;