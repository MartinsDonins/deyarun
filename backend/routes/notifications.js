// ✅ Notifications route - MongoDB Compatible
import express from 'express';
import mongoose from 'mongoose';
import { User } from '../models/mongodb/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import admin from 'firebase-admin';

const router = express.Router();
console.log('✅ Notifications route enabled with MongoDB support');

// Simple subscription endpoint for tests
router.post('/subscribe', (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ message: 'Token missing' });
  }
  res.json({ success: true });
});

// Notification Schema (embedded in MongoDB)
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  type: { 
    type: String, 
    required: true, 
    enum: ['workout_reminder', 'achievement', 'course_update', 'system', 'coaching_tip'] 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data
  read: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  fcmMessageId: { type: String }, // Firebase message ID
  createdAt: { type: Date, default: Date.now },
  scheduledFor: { type: Date }, // For scheduled notifications
}, { collection: 'notifications' });

const Notification = mongoose.model('Notification', NotificationSchema);

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    
    const query = { userId };
    if (unread_only === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    
    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`📊 Getting unread notification count for user ${userId}`);

    // Get count of unread notifications for the user
    const unreadCount = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      read: false
    });

    console.log(`📊 Found ${unreadCount} unread notifications for user ${userId}`);

    res.json({
      success: true,
      unreadCount: unreadCount || 0
    });

  } catch (error) {
    console.error('❌ Error getting unread notification count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread notification count',
      message: error.message
    });
  }
});

// Send push notification
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { userId, type, title, message, data, scheduledFor } = req.body;
    const senderId = req.user.userId;
    
    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Create notification record
    const notification = new Notification({
      userId,
      type: type || 'system',
      title,
      message,
      data: { ...data, senderId },
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null
    });
    
    await notification.save();
    
    // Send immediate push notification if not scheduled
    if (!scheduledFor && targetUser.deviceTokens && targetUser.deviceTokens.length > 0) {
      try {
        const pushMessage = {
          notification: {
            title,
            body: message
          },
          data: {
            notificationId: notification._id.toString(),
            type: type || 'system',
            ...data
          },
          tokens: targetUser.deviceTokens.filter(token => token && token.length > 0)
        };
        
        if (pushMessage.tokens.length > 0) {
          const response = await admin.messaging().sendMulticast(pushMessage);
          
          // Update notification with delivery status
          notification.delivered = response.successCount > 0;
          notification.fcmMessageId = response.responses[0]?.messageId;
          await notification.save();
          
          console.log(`Push notification sent: ${response.successCount}/${response.responses.length} delivered`);
        }
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError);
        // Continue without failing the request
      }
    }
    
    res.json({
      success: true,
      notification: {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        scheduled: !!scheduledFor
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      message: error.message
    });
  }
});

// Delete notification
router.delete('/:notificationId', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

// Get notification preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Default notification preferences
    const preferences = user.notificationPreferences || {
      workoutReminders: true,
      achievements: true,
      courseUpdates: true,
      coachingTips: true,
      systemUpdates: true,
      pushEnabled: true,
      emailEnabled: true
    };
    
    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      message: error.message
    });
  }
});

// Update notification preferences
router.patch('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      preferences: user.notificationPreferences
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error.message
    });
  }
});
export default router;