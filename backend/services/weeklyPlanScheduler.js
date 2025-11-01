import cron from 'node-cron';
import weeklyPlanGenerator from './weeklyPlanGenerator.js';
import { User } from '../models/mongodb/index.js';

/**
 * Weekly Training Plan Auto-Generation Scheduler
 *
 * Runs every Sunday at 18:00 (6 PM) to generate next week's training plans
 * for all active users with auto-generation enabled
 */
class WeeklyPlanScheduler {

  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.stats = {
      lastRunTime: null,
      totalUsersProcessed: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      errors: []
    };
  }

  /**
   * Start the scheduler
   * Cron expression: '0 18 * * 0' = Every Sunday at 18:00
   */
  start() {
    if (this.cronJob) {
      console.log('⚠️ Weekly plan scheduler already running');
      return;
    }

    // Schedule for every Sunday at 18:00
    this.cronJob = cron.schedule('0 18 * * 0', async () => {
      console.log('🗓️ Weekly plan generation cron job triggered - Sunday 18:00');
      await this.generateWeeklyPlansForAllUsers();
    }, {
      scheduled: true,
      timezone: "Europe/Riga" // Latvian timezone
    });

    console.log('✅ Weekly plan scheduler started - runs every Sunday at 18:00 (Riga time)');
    console.log('📅 Next scheduled run:', this.getNextRunTime());
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Weekly plan scheduler stopped');
    }
  }

  /**
   * Get next scheduled run time
   */
  getNextRunTime() {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
    nextSunday.setHours(18, 0, 0, 0);

    // If it's already past Sunday 18:00, add a week
    if (nextSunday <= now) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }

    return nextSunday;
  }

  /**
   * Generate weekly plans for all eligible users
   */
  async generateWeeklyPlansForAllUsers() {
    if (this.isRunning) {
      console.log('⚠️ Weekly plan generation already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🏃 Starting weekly plan generation for all users...');

      // Find all active users with auto-generation enabled
      const eligibleUsers = await this.getEligibleUsers();

      console.log(`📊 Found ${eligibleUsers.length} eligible users for auto-generation`);

      this.stats = {
        lastRunTime: new Date(),
        totalUsersProcessed: eligibleUsers.length,
        successfulGenerations: 0,
        failedGenerations: 0,
        errors: []
      };

      // Process users in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < eligibleUsers.length; i += batchSize) {
        const batch = eligibleUsers.slice(i, i + batchSize);
        await Promise.all(batch.map(user => this.generatePlanForUser(user)));

        // Small delay between batches
        if (i + batchSize < eligibleUsers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✅ Weekly plan generation completed in ${duration}s`);
      console.log(`   Success: ${this.stats.successfulGenerations}/${this.stats.totalUsersProcessed}`);
      console.log(`   Failed: ${this.stats.failedGenerations}/${this.stats.totalUsersProcessed}`);

      if (this.stats.errors.length > 0) {
        console.log(`   Errors: ${this.stats.errors.length}`);
        this.stats.errors.forEach(error => {
          console.error(`      - ${error.userId}: ${error.message}`);
        });
      }

    } catch (error) {
      console.error('❌ Critical error in weekly plan generation:', error);
      this.stats.errors.push({
        userId: 'system',
        message: error.message,
        stack: error.stack
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get eligible users for auto-generation
   * Users must:
   * - Have an active account
   * - Have auto-generation enabled in settings
   * - Have completed at least one workout in the past 2 weeks (to have baseline data)
   */
  async getEligibleUsers() {
    try {
      // For now, get all active users
      // In future, add settings field for auto-generation preference
      const users = await User.find({
        isActive: true,
        // Add more criteria as needed
        // 'settings.autoGenerateWeeklyPlan': true
      }).select('_id email profile settings').limit(1000);

      return users.filter(user => {
        // Additional filters can be added here
        // For example: check if user has premium subscription
        return true;
      });

    } catch (error) {
      console.error('Error fetching eligible users:', error);
      return [];
    }
  }

  /**
   * Generate plan for individual user
   */
  async generatePlanForUser(user) {
    try {
      console.log(`  🏃 Generating plan for user: ${user._id}`);

      // Get user preferences from their profile/settings
      const userPreferences = {
        fitnessLevel: user.profile?.fitnessLevel || 'intermediate',
        trainingDays: user.settings?.preferredTrainingDays || ['monday', 'wednesday', 'friday', 'sunday'],
        weeklyDistanceGoal: user.profile?.weeklyDistanceGoal || 25,
        language: user.profile?.language || 'lv'
      };

      // Generate the weekly plan
      const result = await weeklyPlanGenerator.generateWeeklyPlan(
        user._id.toString(),
        userPreferences
      );

      if (result.success) {
        this.stats.successfulGenerations++;
        console.log(`  ✅ Plan generated for user ${user._id}: ${result.data.totalWorkouts} workouts`);
      } else {
        this.stats.failedGenerations++;
        console.log(`  ❌ Failed to generate plan for user ${user._id}`);
      }

    } catch (error) {
      this.stats.failedGenerations++;
      this.stats.errors.push({
        userId: user._id.toString(),
        email: user.email,
        message: error.message,
        timestamp: new Date()
      });
      console.error(`  ❌ Error generating plan for user ${user._id}:`, error.message);
    }
  }

  /**
   * Manual trigger for testing or admin action
   */
  async triggerManualGeneration(userId = null) {
    console.log('🔧 Manual weekly plan generation triggered');

    if (userId) {
      // Generate for specific user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      await this.generatePlanForUser(user);
    } else {
      // Generate for all users
      await this.generateWeeklyPlansForAllUsers();
    }
  }

  /**
   * Get scheduler stats
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      nextRunTime: this.getNextRunTime(),
      schedulerActive: !!this.cronJob
    };
  }
}

// Export singleton instance
const weeklyPlanScheduler = new WeeklyPlanScheduler();
export default weeklyPlanScheduler;
