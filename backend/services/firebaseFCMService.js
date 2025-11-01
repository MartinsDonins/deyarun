// Firebase Cloud Messaging Service - MongoDB Integration
import admin from 'firebase-admin';
import { User } from '../models/mongodb/index.js';

class FirebaseFCMService {
  constructor() {
    this.isInitialized = false;
    // Use setTimeout to allow notificationService to initialize first
    setTimeout(() => this.checkFirebaseInitialization(), 1000);
  }

  async checkFirebaseInitialization() {
    try {
      // Wait up to 10 seconds for Firebase to be initialized by notificationService
      const maxWait = 10000; // 10 seconds
      const checkInterval = 500; // 0.5 seconds
      let waited = 0;
      
      while (waited < maxWait) {
        if (admin.apps.length > 0) {
          console.log('✅ Firebase Admin SDK already initialized - using existing default instance');
          this.isInitialized = true;
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }
      
      // If we get here, Firebase was never initialized
      console.warn('⚠️ Firebase not initialized after waiting - FCM service unavailable');
      this.isInitialized = false;
    } catch (error) {
      console.error('❌ Firebase FCM initialization error:', error.message);
      this.isInitialized = false;
    }
  }

  // Register FCM token for user
  async registerToken(userId, token, platform = 'unknown') {
    try {
      if (!token || !userId) {
        throw new Error('User ID and FCM token are required');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if token already exists
      const existingToken = user.deviceTokens.find(dt => dt.token === token);
      
      if (existingToken) {
        // Update existing token
        existingToken.platform = platform;
        existingToken.isActive = true;
        existingToken.addedAt = new Date();
      } else {
        // Add new token
        user.deviceTokens.push({
          token,
          platform,
          isActive: true,
          addedAt: new Date()
        });
      }

      await user.save();
      
      console.log(`✅ FCM token registered for user ${user.email} (${platform})`);
      return { success: true, message: 'Token registered successfully' };

    } catch (error) {
      console.error('❌ FCM token registration error:', error.message);
      throw error;
    }
  }

  // Remove FCM token
  async removeToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.deviceTokens = user.deviceTokens.filter(dt => dt.token !== token);
      await user.save();

      console.log(`✅ FCM token removed for user ${user.email}`);
      return { success: true, message: 'Token removed successfully' };

    } catch (error) {
      console.error('❌ FCM token removal error:', error.message);
      throw error;
    }
  }

  // Send notification to specific user
  async sendToUser(userId, notification, data = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ Firebase FCM not initialized - notification not sent');
        return { success: false, message: 'FCM not available' };
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const activeTokens = user.deviceTokens
        .filter(dt => dt.isActive)
        .map(dt => dt.token);

      if (activeTokens.length === 0) {
        console.log(`⚠️ No active FCM tokens for user ${user.email}`);
        return { success: false, message: 'No active tokens' };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png'
        },
        data: {
          ...data,
          click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK',
          userId: userId.toString(),
          timestamp: new Date().toISOString()
        },
        tokens: activeTokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(activeTokens[idx]);
            console.warn(`❌ FCM failed for token: ${activeTokens[idx]}`);
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          user.deviceTokens = user.deviceTokens.filter(dt => 
            !failedTokens.includes(dt.token)
          );
          await user.save();
        }
      }

      console.log(`✅ FCM sent to user ${user.email}: ${response.successCount}/${activeTokens.length} delivered`);
      
      return {
        success: true,
        delivered: response.successCount,
        failed: response.failureCount,
        total: activeTokens.length
      };

    } catch (error) {
      console.error('❌ FCM send to user error:', error.message);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, notification, data = {}) {
    try {
      const results = [];
      
      for (const userId of userIds) {
        try {
          const result = await this.sendToUser(userId, notification, data);
          results.push({ userId, ...result });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ FCM send to users error:', error.message);
      throw error;
    }
  }

  // Send workout reminder notification
  async sendWorkoutReminder(userId, workoutData = {}) {
    const notification = {
      title: '🏃‍♂️ Workout Reminder',
      body: 'Time for your scheduled workout! Ready to run?',
      icon: '/workout-icon.png'
    };

    const data = {
      type: 'workout_reminder',
      click_action: '/workouts',
      ...workoutData
    };

    return this.sendToUser(userId, notification, data);
  }

  // Send workout completion congratulations
  async sendWorkoutComplete(userId, workoutStats = {}) {
    const { distance, duration, pace } = workoutStats;
    let body = 'Great job completing your workout! 🎉';
    
    if (distance && duration) {
      body = `Amazing! You completed ${distance}km in ${duration} minutes. Keep it up! 🏃‍♂️`;
    }

    const notification = {
      title: '🎉 Workout Complete!',
      body,
      icon: '/achievement-icon.png'
    };

    const data = {
      type: 'workout_complete',
      click_action: '/workouts/history',
      ...workoutStats
    };

    return this.sendToUser(userId, notification, data);
  }

  // Send achievement notification
  async sendAchievement(userId, achievement = {}) {
    const notification = {
      title: '🏆 New Achievement Unlocked!',
      body: achievement.description || 'You\'ve earned a new achievement!',
      icon: '/trophy-icon.png'
    };

    const data = {
      type: 'achievement',
      click_action: '/profile/achievements',
      achievementId: achievement.id,
      ...achievement
    };

    return this.sendToUser(userId, notification, data);
  }

  // Send course reminder
  async sendCourseReminder(userId, courseData = {}) {
    const notification = {
      title: '📚 Course Reminder',
      body: courseData.message || 'Continue your running course journey!',
      icon: '/course-icon.png'
    };

    const data = {
      type: 'course_reminder',
      click_action: `/courses/${courseData.courseId}`,
      ...courseData
    };

    return this.sendToUser(userId, notification, data);
  }

  // Test notification
  async sendTestNotification(userId) {
    const notification = {
      title: '🧪 Test Notification',
      body: 'Firebase FCM is working correctly!',
      icon: '/icon-192x192.png'
    };

    const data = {
      type: 'test',
      click_action: '/',
      timestamp: new Date().toISOString()
    };

    return this.sendToUser(userId, notification, data);
  }

  // Get user's active tokens
  async getUserTokens(userId) {
    try {
      const user = await User.findById(userId, 'deviceTokens email');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        email: user.email,
        tokens: user.deviceTokens.filter(dt => dt.isActive),
        totalTokens: user.deviceTokens.length,
        activeTokens: user.deviceTokens.filter(dt => dt.isActive).length
      };
    } catch (error) {
      console.error('❌ Get user tokens error:', error.message);
      throw error;
    }
  }

  // Clean up invalid tokens for all users
  async cleanupInvalidTokens() {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ Firebase FCM not initialized - cleanup skipped');
        return { success: false, message: 'FCM not available' };
      }

      const users = await User.find({ 
        deviceTokens: { $exists: true, $not: { $size: 0 } } 
      });

      let cleanedUsers = 0;
      let removedTokens = 0;

      for (const user of users) {
        const originalTokenCount = user.deviceTokens.length;
        const validTokens = [];

        for (const tokenObj of user.deviceTokens) {
          try {
            // Test token validity by sending a dry-run message
            await admin.messaging().send({
              token: tokenObj.token,
              notification: { title: 'Test', body: 'Test' }
            }, true); // dry-run mode

            validTokens.push(tokenObj);
          } catch (error) {
            console.log(`🧹 Removing invalid token for ${user.email}`);
            removedTokens++;
          }
        }

        if (validTokens.length !== originalTokenCount) {
          user.deviceTokens = validTokens;
          await user.save();
          cleanedUsers++;
        }
      }

      console.log(`✅ Token cleanup complete: ${cleanedUsers} users cleaned, ${removedTokens} invalid tokens removed`);
      
      return {
        success: true,
        cleanedUsers,
        removedTokens,
        totalUsers: users.length
      };

    } catch (error) {
      console.error('❌ Token cleanup error:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
const firebaseFCMService = new FirebaseFCMService();
export default firebaseFCMService;