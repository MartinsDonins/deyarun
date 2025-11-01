import admin from 'firebase-admin';
import cron from 'node-cron';
import { User } from '../models/mongodb/index.js';
import path from 'path';
import fs from 'fs/promises';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.scheduledTasks = new Map();
    this.notificationQueue = [];
    this.processingQueue = false;
    this.initialize();
  }

  // Initialize Firebase Admin SDK
  async initialize() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        // Try to load service account key from file first
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || path.join(process.cwd(), 'config', 'firebase-service-account.json');
        
        try {
          await fs.access(serviceAccountPath);
          const serviceAccountContent = await fs.readFile(serviceAccountPath, 'utf8');
          const serviceAccount = JSON.parse(serviceAccountContent);
          
          // Validate private key format
          if (!serviceAccount.private_key) {
            throw new Error('Private key is missing from service account');
          }
          
          if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
            throw new Error('Private key does not start with proper PEM header');
          }
          
          if (!serviceAccount.private_key.includes('-----END PRIVATE KEY-----')) {
            throw new Error('Private key does not end with proper PEM footer');
          }
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
          });
          
          console.log('🔥 Firebase Admin SDK initialized with service account file');
        } catch (error) {
          console.error('❌ Firebase FCM initialization error:', error.message);
          
          // Fallback to environment variables (for cloud deployment)
          if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            console.log('🔄 Falling back to environment variables...');
            
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            
            admin.initializeApp({
              credential: admin.credential.cert({
                type: 'service_account',
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: privateKey,
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
                token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
                universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com'
              }),
              projectId: process.env.FIREBASE_PROJECT_ID
            });
            
            console.log('🔥 Firebase Admin SDK initialized with environment variables');
          } else {
            console.warn('⚠️ Firebase credentials not found. Push notifications will be disabled.');
            return;
          }
        }
      }

      this.isInitialized = true;
      this.startQueueProcessor();
      this.setupScheduledNotifications();
      
      console.log('📱 Notification Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Notification Service:', error);
    }
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && admin.apps.length > 0;
  }

  // Send push notification to specific user
  async sendToUser(userId, notification) {
    try {
      if (!this.isReady()) {
        console.warn('⚠️ Notification service not ready');
        return { success: false, error: 'Service not initialized' };
      }

      // Get user's FCM tokens
      const tokens = await this.getUserTokens(userId);
      if (tokens.length === 0) {
        console.warn(`⚠️ No FCM tokens found for user ${userId}`);
        return { success: false, error: 'No tokens found' };
      }

      // Check user's notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      if (!this.shouldSendNotification(notification.type, preferences)) {
        console.log(`📱 Notification blocked by user preferences: ${notification.type}`);
        return { success: false, error: 'Blocked by preferences' };
      }

      // Build FCM message
      const message = this.buildFCMMessage(notification, tokens);

      // Send notification
      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Process response and clean up invalid tokens
      await this.processResponse(response, tokens, userId);

      // Log notification
      await this.logNotification(userId, notification, response);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      console.error('❌ Send notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, notification) {
    const results = [];
    
    for (const userId of userIds) {
      const result = await this.sendToUser(userId, notification);
      results.push({ userId, ...result });
    }

    return results;
  }

  // Send notification to all users with specific criteria
  async sendToSegment(criteria, notification) {
    try {
      const users = await this.getUsersBySegment(criteria);
      return await this.sendToUsers(users.map(u => u.id), notification);
    } catch (error) {
      console.error('❌ Send to segment error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add notification to queue for batch processing
  queueNotification(userId, notification, scheduleAt = null) {
    this.notificationQueue.push({
      userId,
      notification,
      scheduleAt: scheduleAt || new Date()
    });

    if (!this.processingQueue) {
      this.startQueueProcessor();
    }
  }

  // Process notification queue
  async startQueueProcessor() {
    if (this.processingQueue) return;

    this.processingQueue = true;
    console.log('📱 Starting notification queue processor');

    while (this.notificationQueue.length > 0) {
      const batch = this.notificationQueue.splice(0, 100); // Process in batches of 100
      const now = new Date();

      for (const item of batch) {
        if (item.scheduleAt <= now) {
          await this.sendToUser(item.userId, item.notification);
        } else {
          // Put back in queue if not ready
          this.notificationQueue.push(item);
        }
      }

      // Wait before processing next batch
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processingQueue = false;
  }

  // Schedule recurring notifications
  setupScheduledNotifications() {
    // Daily workout reminders at 7 AM
    cron.schedule('0 7 * * *', async () => {
      console.log('📱 Sending daily workout reminders');
      await this.sendWorkoutReminders();
    });

    // Weekly progress updates on Sundays at 6 PM
    cron.schedule('0 18 * * 0', async () => {
      console.log('📱 Sending weekly progress updates');
      await this.sendWeeklyProgressUpdates();
    });

    // Course completion reminders every 3 days
    cron.schedule('0 10 */3 * *', async () => {
      console.log('📱 Sending course completion reminders');
      await this.sendCourseCompletionReminders();
    });

    console.log('⏰ Scheduled notifications configured');
  }

  // Send workout reminders
  async sendWorkoutReminders() {
    console.warn('sendWorkoutReminders not implemented in MongoDB version');
  }

  // Send weekly progress updates
  async sendWeeklyProgressUpdates() {
    console.warn('sendWeeklyProgressUpdates not implemented in MongoDB version');
  }

  // Send course completion reminders
  async sendCourseCompletionReminders() {
    console.warn('sendCourseCompletionReminders not implemented in MongoDB version');
  }

  // Build FCM message
  buildFCMMessage(notification, tokens) {
    const message = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        type: notification.type,
        ...Object.fromEntries(
          Object.entries(notification.data || {}).map(([key, value]) => [key, String(value)])
        )
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B6B',
          sound: 'default',
          channelId: this.getChannelId(notification.type),
          priority: notification.priority === 'high' ? 'high' : 'normal'
        },
        data: notification.data ? Object.fromEntries(
          Object.entries(notification.data).map(([key, value]) => [key, String(value)])
        ) : {}
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            category: notification.type,
            'thread-id': notification.type
          }
        }
      }
    };

    return message;
  }

  // Get notification channel ID for Android
  getChannelId(notificationType) {
    const channels = {
      workout_reminder: 'workout_reminders',
      achievement: 'achievements',
      course_reminder: 'course_updates',
      weekly_progress: 'progress_updates',
      social_update: 'social',
      system_update: 'system'
    };

    return channels[notificationType] || 'default';
  }

  // Get user's FCM tokens
  async getUserTokens(userId) {
    try {
      const user = await User.findById(userId).select('deviceTokens');
      if (!user || !user.deviceTokens) return [];
      const now = new Date();
      return user.deviceTokens
        .filter(t => t.isActive && (!t.expiresAt || t.expiresAt > now))
        .map(t => t.token);
    } catch (error) {
      console.error('❌ Get user tokens error:', error);
      return [];
    }
  }

  // Get user notification preferences
  async getUserNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId).select('notificationsEnabled');
      const enabled = user?.notificationsEnabled !== false;
      return {
        workoutReminders: enabled,
        friendActivity: enabled,
        achievements: enabled,
        trainingPlanUpdates: enabled
      };
    } catch (error) {
      console.error('❌ Get user preferences error:', error);
      return {
        workoutReminders: true,
        friendActivity: true,
        achievements: true,
        trainingPlanUpdates: true
      };
    }
  }

  // Check if notification should be sent based on preferences
  shouldSendNotification(notificationType, preferences) {
    const typeMapping = {
      workout_reminder: 'workoutReminders',
      achievement: 'achievements',
      course_reminder: 'trainingPlanUpdates',
      weekly_progress: 'achievements',
      social_update: 'friendActivity',
      system_update: true // Always send system updates
    };

    const prefKey = typeMapping[notificationType];
    if (prefKey === true) return true;
    if (!prefKey) return false;

    return preferences[prefKey] !== false;
  }

  // Process FCM response and clean up invalid tokens
  async processResponse(response, tokens, userId) {
    try {
      const invalidTokens = [];

      response.responses.forEach((resp, index) => {
        if (!resp.success && (
          resp.error?.code === 'messaging/invalid-registration-token' ||
          resp.error?.code === 'messaging/registration-token-not-registered'
        )) {
          invalidTokens.push(tokens[index]);
        }
      });

      // Remove invalid tokens
      if (invalidTokens.length > 0) {
        await User.updateOne(
          { _id: userId },
          { $pull: { deviceTokens: { token: { $in: invalidTokens } } } }
        );

        console.log(`🧹 Removed ${invalidTokens.length} invalid tokens for user ${userId}`);
      }
    } catch (error) {
      console.error('❌ Process response error:', error);
    }
  }

  // Log notification for analytics
  async logNotification(userId, notification, response) {
    try {
      console.log('📋 Notification log:', {
        userId,
        type: notification.type,
        title: notification.title,
        success: response.successCount,
        failure: response.failureCount
      });
    } catch (error) {
      console.error('❌ Log notification error:', error);
    }
  }

  // Get users by segment for targeted notifications
  async getUsersBySegment(criteria) {
    try {
      const query = {};
      if (criteria.subscriptionType) {
        query.subscriptionType = criteria.subscriptionType;
      }
      if (criteria.fitnessLevel) {
        query.fitnessLevel = criteria.fitnessLevel;
      }
      if (criteria.lastActiveAfter) {
        query.updatedAt = { $gte: criteria.lastActiveAfter };
      }
      return await User.find(query).select('_id');
    } catch (error) {
      console.error('❌ Get users by segment error:', error);
      return [];
    }
  }

  // Get user weekly stats
  async getUserWeeklyStats(userId) {
    // This would aggregate workout data from MongoDB
    // For now, return mock data
    return {
      workoutsCompleted: Math.floor(Math.random() * 7),
      totalDistance: Math.floor(Math.random() * 50),
      totalTime: Math.floor(Math.random() * 300)
    };
  }

  // Register device token
  async registerDeviceToken(userId, token, platform, deviceInfo = {}) {
    try {
      const user = await User.findById(userId).select('deviceTokens');
      if (!user) return { success: false, error: 'User not found' };
      const index = user.deviceTokens.findIndex(t => t.token === token);
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      if (index >= 0) {
        user.deviceTokens[index].platform = platform;
        user.deviceTokens[index].deviceInfo = deviceInfo;
        user.deviceTokens[index].isActive = true;
        user.deviceTokens[index].addedAt = new Date();
        user.deviceTokens[index].expiresAt = expiresAt;
      } else {
        user.deviceTokens.push({
          token,
          platform,
          deviceInfo,
          isActive: true,
          addedAt: new Date(),
          expiresAt
        });
      }
      await user.save();

      console.log(`📱 Device token registered for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Register device token error:', error);
      return { success: false, error: error.message };
    }
  }

  // Unregister device token
  async unregisterDeviceToken(userId, token) {
    try {
      await User.updateOne(
        { _id: userId },
        { $pull: { deviceTokens: { token } } }
      );

      console.log(`📱 Device token unregistered for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Unregister device token error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send test notification
  async sendTestNotification(userId) {
    return await this.sendToUser(userId, {
      type: 'system_update',
      title: '🧪 Test Notification',
      body: 'This is a test notification from DeyaRun!',
      data: {
        test: true,
        deepLink: '/dashboard'
      },
      priority: 'normal'
    });
  }

  // Get notification statistics
  async getNotificationStats(timeRange = 7) {
    try {
      console.warn('getNotificationStats not implemented in MongoDB version');
      return null;
    } catch (error) {
      console.error('❌ Get notification stats error:', error);
      return null;
    }
  }

  // Cleanup expired tokens
  async cleanupExpiredTokens() {
    try {
      const result = await User.updateMany(
        {},
        {
          $pull: {
            deviceTokens: {
              $or: [
                { expiresAt: { $lte: new Date() } },
                { isActive: false }
              ]
            }
          }
        }
      );
      const count = result.modifiedCount || 0;
      console.log(`🧹 Cleaned up ${count} expired device tokens`);
      return count;
    } catch (error) {
      console.error('❌ Cleanup expired tokens error:', error);
      return 0;
    }
  }
}

// Create and export singleton instance
export default new NotificationService();