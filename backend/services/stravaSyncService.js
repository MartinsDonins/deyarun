import cron from 'node-cron';
import { User } from '../models/mongodb/index.js';
import stravaService from './stravaService.js';

class StravaSyncService {
  constructor() {
    this.isRunning = false;
    this.syncStats = {
      lastRun: null,
      usersProcessed: 0,
      activitiesSynced: 0,
      errors: 0
    };
    this.initScheduler();
  }

  initScheduler() {
    // Sync every 2 hours during active hours (6 AM to 10 PM)
    cron.schedule('0 6-22/2 * * *', async () => {
      console.log('🏃‍♂️ Starting automatic Strava sync...');
      await this.performAutomaticSync();
    }, {
      scheduled: true,
      timezone: "Europe/Riga"
    });

    // Daily comprehensive sync at 5 AM
    cron.schedule('0 5 * * *', async () => {
      console.log('🔄 Starting daily comprehensive Strava sync...');
      await this.performComprehensiveSync();
    }, {
      scheduled: true,
      timezone: "Europe/Riga"
    });

    console.log('⏰ Strava automatic sync service initialized');
    console.log('📅 Schedule: Every 2 hours (6 AM - 10 PM) + Daily at 5 AM');
  }

  async performAutomaticSync() {
    if (this.isRunning) {
      console.log('⏳ Strava sync already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    let stats = {
      usersProcessed: 0,
      activitiesSynced: 0,
      errors: 0
    };

    try {
      console.log('🔍 Finding users with active Strava connections...');
      
      // Find users with Strava connected and recent activity
      const stravaUsers = await User.find({
        'strava.isConnected': true,
        'strava.accessToken': { $exists: true },
        $or: [
          { 'strava.lastSyncAt': { $exists: false } }, // Never synced
          { 'strava.lastSyncAt': { $lte: new Date(Date.now() - 2 * 60 * 60 * 1000) } } // Last sync > 2 hours ago
        ]
      }).limit(50); // Process max 50 users per run to avoid API rate limits

      console.log(`👥 Found ${stravaUsers.length} users for Strava sync`);

      for (const user of stravaUsers) {
        try {
          console.log(`🔄 Syncing activities for user ${user._id}...`);
          
          // Sync recent activities (last 7 days or since last sync)
          const result = await stravaService.syncUserActivities(user._id, {
            limit: 20, // Limit to avoid rate limits
            since: user.strava?.lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            autoCreateWorkouts: true // Enable automatic workout creation
          });

          stats.usersProcessed++;
          stats.activitiesSynced += result.syncedCount;

          console.log(`✅ Synced ${result.syncedCount} activities for user ${user._id}`);
          
          // Small delay to respect rate limits
          await this.delay(500);
          
        } catch (userError) {
          stats.errors++;
          console.error(`❌ Failed to sync user ${user._id}:`, userError.message);
          
          // If token is invalid, mark as disconnected
          if (userError.message?.includes('authorization_revoked') || 
              userError.message?.includes('invalid_token')) {
            await User.updateOne(
              { _id: user._id },
              { 
                $set: { 
                  'strava.isConnected': false,
                  'strava.lastError': userError.message,
                  'strava.errorAt': new Date()
                }
              }
            );
            console.log(`🔒 Marked user ${user._id} as disconnected from Strava`);
          }
        }
      }

      // Update sync statistics
      this.syncStats = {
        lastRun: startTime,
        ...stats
      };

      const duration = new Date() - startTime;
      console.log(`🎯 Strava sync completed in ${duration}ms`);
      console.log(`📊 Stats: ${stats.usersProcessed} users, ${stats.activitiesSynced} activities, ${stats.errors} errors`);

    } catch (error) {
      console.error('❌ Failed to perform automatic Strava sync:', error);
      stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  async performComprehensiveSync() {
    if (this.isRunning) {
      console.log('⏳ Strava sync already running, skipping comprehensive sync...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    let stats = {
      usersProcessed: 0,
      activitiesSynced: 0,
      errors: 0
    };

    try {
      console.log('🌅 Starting comprehensive daily Strava sync...');
      
      // Find all users with Strava connected for comprehensive sync
      const stravaUsers = await User.find({
        'strava.isConnected': true,
        'strava.accessToken': { $exists: true }
      });

      console.log(`👥 Found ${stravaUsers.length} users for comprehensive sync`);

      for (const user of stravaUsers) {
        try {
          console.log(`🔄 Comprehensive sync for user ${user._id}...`);
          
          // Sync more activities for comprehensive daily sync
          const result = await stravaService.syncUserActivities(user._id, {
            limit: 50, // More activities for daily sync
            since: user.strava?.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            autoCreateWorkouts: true // Enable automatic workout creation
          });

          stats.usersProcessed++;
          stats.activitiesSynced += result.syncedCount;

          console.log(`✅ Comprehensively synced ${result.syncedCount} activities for user ${user._id}`);
          
          // Longer delay for comprehensive sync to be respectful to API
          await this.delay(1000);
          
        } catch (userError) {
          stats.errors++;
          console.error(`❌ Failed comprehensive sync for user ${user._id}:`, userError.message);
          
          // Mark invalid tokens
          if (userError.message?.includes('authorization_revoked') || 
              userError.message?.includes('invalid_token')) {
            await User.updateOne(
              { _id: user._id },
              { 
                $set: { 
                  'strava.isConnected': false,
                  'strava.lastError': userError.message,
                  'strava.errorAt': new Date()
                }
              }
            );
            console.log(`🔒 Marked user ${user._id} as disconnected from Strava`);
          }
        }
      }

      // Update sync statistics
      this.syncStats = {
        lastRun: startTime,
        ...stats
      };

      const duration = new Date() - startTime;
      console.log(`🎯 Comprehensive Strava sync completed in ${duration}ms`);
      console.log(`📊 Stats: ${stats.usersProcessed} users, ${stats.activitiesSynced} activities, ${stats.errors} errors`);

    } catch (error) {
      console.error('❌ Failed to perform comprehensive Strava sync:', error);
      stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  // Manual sync trigger for admin
  async triggerManualSync(options = {}) {
    console.log('🚀 Manual Strava sync triggered...');
    
    if (options.comprehensive) {
      await this.performComprehensiveSync();
    } else {
      await this.performAutomaticSync();
    }
    
    return this.syncStats;
  }

  // Get current sync statistics
  getSyncStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      nextRun: this.getNextScheduledRun()
    };
  }

  getNextScheduledRun() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next scheduled run (every 2 hours from 6 AM to 10 PM)
    let nextHour = currentHour;
    if (currentHour < 6) {
      nextHour = 6;
    } else if (currentHour >= 22) {
      nextHour = 6; // Next day at 6 AM
    } else {
      // Find next even hour from 6-22
      for (let h = currentHour + 1; h <= 22; h++) {
        if ((h - 6) % 2 === 0) {
          nextHour = h;
          break;
        }
      }
      if (nextHour === currentHour) {
        nextHour = 6; // Next day
      }
    }
    
    const nextRun = new Date(now);
    nextRun.setHours(nextHour, 0, 0, 0);
    if (nextHour <= currentHour) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun;
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stop all scheduled tasks (for graceful shutdown)
  stopScheduler() {
    console.log('🛑 Stopping Strava sync scheduler...');
    // Node-cron tasks are automatically destroyed when the process exits
  }
}

// Export singleton instance
const stravaSyncService = new StravaSyncService();
export default stravaSyncService;