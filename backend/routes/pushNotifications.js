// Firebase Cloud Messaging Push Notifications - MongoDB Integration
import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import firebaseFCMService from '../services/firebaseFCMService.js';

const router = express.Router();

// Register FCM token for authenticated user
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { token, platform } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const result = await firebaseFCMService.registerToken(
      req.user.userId, 
      token, 
      platform || 'unknown'
    );

    res.json({
      success: true,
      message: 'FCM token registered successfully',
      data: result
    });

  } catch (error) {
    console.error('FCM token registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Remove FCM token for authenticated user
router.delete('/token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const result = await firebaseFCMService.removeToken(req.user.userId, token);

    res.json({
      success: true,
      message: 'FCM token removed successfully',
      data: result
    });

  } catch (error) {
    console.error('FCM token removal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's FCM tokens (for debugging)
router.get('/tokens', authMiddleware, async (req, res) => {
  try {
    const tokens = await firebaseFCMService.getUserTokens(req.user.userId);

    res.json({
      success: true,
      data: tokens
    });

  } catch (error) {
    console.error('Get FCM tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FCM tokens',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send test notification to authenticated user
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const result = await firebaseFCMService.sendTestNotification(req.user.userId);

    res.json({
      success: true,
      message: 'Test notification sent',
      data: result
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Admin routes
router.use('/admin', adminMiddleware);

// Send notification to specific user (admin only)
router.post('/admin/send-to-user', async (req, res) => {
  try {
    const { userId, notification, data } = req.body;
    
    if (!userId || !notification) {
      return res.status(400).json({
        success: false,
        message: 'User ID and notification content are required'
      });
    }

    const result = await firebaseFCMService.sendToUser(userId, notification, data);

    res.json({
      success: true,
      message: 'Notification sent',
      data: result
    });

  } catch (error) {
    console.error('Admin send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send bulk notifications (admin only)
router.post('/admin/send-bulk', async (req, res) => {
  try {
    const { userIds, notification, data } = req.body;
    
    if (!userIds || !notification) {
      return res.status(400).json({
        success: false,
        message: 'User IDs and notification content are required'
      });
    }

    const results = await firebaseFCMService.sendToUsers(userIds, notification, data);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    res.json({
      success: true,
      message: `Bulk notifications sent: ${successCount} successful, ${failCount} failed`,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failCount
        }
      }
    });

  } catch (error) {
    console.error('Admin bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Clean up invalid tokens (admin only)
router.post('/admin/cleanup-tokens', async (req, res) => {
  try {
    const result = await firebaseFCMService.cleanupInvalidTokens();

    res.json({
      success: true,
      message: 'Token cleanup completed',
      data: result
    });

  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup tokens',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Workout-specific notification endpoints
router.post('/workout/reminder/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const workoutData = req.body;

    // Only allow users to send reminders to themselves or admin to send to anyone
    if (req.user.userId !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send notifications to other users'
      });
    }

    const result = await firebaseFCMService.sendWorkoutReminder(userId, workoutData);

    res.json({
      success: true,
      message: 'Workout reminder sent',
      data: result
    });

  } catch (error) {
    console.error('Workout reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send workout reminder',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/workout/complete/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const workoutStats = req.body;

    // Only allow users to send to themselves or admin to send to anyone
    if (req.user.userId !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send notifications to other users'
      });
    }

    const result = await firebaseFCMService.sendWorkoutComplete(userId, workoutStats);

    res.json({
      success: true,
      message: 'Workout completion notification sent',
      data: result
    });

  } catch (error) {
    console.error('Workout completion notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send workout completion notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Firebase status check endpoint (no auth required for debugging)
router.get('/firebase-status', async (req, res) => {
  try {
    res.json({
      firebase_initialized: firebaseFCMService.isInitialized,
      timestamp: new Date().toISOString(),
      service_available: !!firebaseFCMService,
      method_available: typeof firebaseFCMService.sendTestNotification === 'function'
    });
  } catch (error) {
    res.status(500).json({
      firebase_initialized: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('✅ Firebase FCM Push Notifications routes initialized');
export default router;
