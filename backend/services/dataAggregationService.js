// Data Aggregation Service
// Background processing for workout statistics and analytics

import cron from 'node-cron';
import { Workout } from '../models/mongodb/index.js';
import AnalyticsService from './analyticsService.js';

export class DataAggregationService {
  
  constructor() {
    this.isRunning = false;
    this.lastUpdate = null;
    this.stats = {
      processedUsers: 0,
      processedWorkouts: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Initialize the data aggregation service with scheduled tasks
   */
  static initialize() {
    const service = new DataAggregationService();
    
    console.log('📊 Initializing Data Aggregation Service...');
    
    // Daily aggregation at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Starting daily data aggregation...');
      await service.runDailyAggregation();
    });
    
    // Weekly aggregation on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('🗓️ Starting weekly data aggregation...');
      await service.runWeeklyAggregation();
    });
    
    // Monthly aggregation on the 1st at 4 AM
    cron.schedule('0 4 1 * *', async () => {
      console.log('📅 Starting monthly data aggregation...');
      await service.runMonthlyAggregation();
    });
    
    // Real-time stats update every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await service.updateRealtimeStats();
    });
    
    console.log('✅ Data Aggregation Service initialized with scheduled tasks');
    return service;
  }

  /**
   * Run daily data aggregation
   */
  async runDailyAggregation() {
    if (this.isRunning) {
      console.log('⚠️ Daily aggregation already running, skipping...');
      return;
    }
    
    try {
      this.isRunning = true;
      this.stats.startTime = new Date();
      this.stats.processedUsers = 0;
      this.stats.processedWorkouts = 0;
      this.stats.errors = 0;
      
      console.log('🔄 Starting daily data aggregation...');
      
      // Get all users who have completed workouts in the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentWorkouts = await Workout.find({
        status: 'completed',
        finishedAt: { $gte: yesterday }
      }).distinct('userId');
      
      console.log(`📊 Processing ${recentWorkouts.length} users with recent workouts`);
      
      // Process each user's data
      for (const userId of recentWorkouts) {
        try {
          await this.processUserDailyStats(userId);
          this.stats.processedUsers++;
        } catch (error) {
          console.error(`❌ Error processing user ${userId}:`, error.message);
          this.stats.errors++;
        }
      }
      
      // Calculate system-wide statistics
      await this.calculateSystemStats();
      
      this.stats.endTime = new Date();
      this.lastUpdate = this.stats.endTime;
      
      console.log('✅ Daily aggregation completed:', {
        duration: (this.stats.endTime - this.stats.startTime) / 1000 + 's',
        processedUsers: this.stats.processedUsers,
        errors: this.stats.errors
      });
      
    } catch (error) {
      console.error('❌ Daily aggregation failed:', error);
      this.stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run weekly data aggregation
   */
  async runWeeklyAggregation() {
    try {
      console.log('🔄 Starting weekly data aggregation...');
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Calculate weekly trends for all active users
      const activeUsers = await Workout.find({
        status: 'completed',
        finishedAt: { $gte: oneWeekAgo }
      }).distinct('userId');
      
      for (const userId of activeUsers) {
        await this.processUserWeeklyStats(userId);
      }
      
      // Update leaderboards
      await this.updateWeeklyLeaderboards();
      
      // Calculate achievement unlocks
      await this.processWeeklyAchievements();
      
      console.log('✅ Weekly aggregation completed');
      
    } catch (error) {
      console.error('❌ Weekly aggregation failed:', error);
    }
  }

  /**
   * Run monthly data aggregation
   */
  async runMonthlyAggregation() {
    try {
      console.log('🔄 Starting monthly data aggregation...');
      
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Calculate monthly performance trends
      const monthlyUsers = await Workout.find({
        status: 'completed',
        finishedAt: { $gte: oneMonthAgo }
      }).distinct('userId');
      
      for (const userId of monthlyUsers) {
        await this.processUserMonthlyStats(userId);
      }
      
      // Update monthly leaderboards
      await this.updateMonthlyLeaderboards();
      
      // Generate monthly insights
      await this.generateMonthlyInsights();
      
      console.log('✅ Monthly aggregation completed');
      
    } catch (error) {
      console.error('❌ Monthly aggregation failed:', error);
    }
  }

  /**
   * Update real-time statistics
   */
  async updateRealtimeStats() {
    try {
      // Update current week statistics
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);
      
      const thisWeekWorkouts = await Workout.countDocuments({
        status: 'completed',
        finishedAt: { $gte: thisWeekStart }
      });
      
      console.log(`📊 Real-time stats updated: ${thisWeekWorkouts} workouts this week`);
      
    } catch (error) {
      console.error('❌ Error updating real-time stats:', error);
    }
  }

  /**
   * Process daily statistics for a specific user
   */
  async processUserDailyStats(userId) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const todaysWorkouts = await Workout.find({
      userId,
      status: 'completed',
      finishedAt: { $gte: yesterday }
    });
    
    if (todaysWorkouts.length === 0) return;
    
    // Calculate daily totals
    const dailyStats = {
      workouts: todaysWorkouts.length,
      totalDistance: todaysWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      totalDuration: todaysWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      totalCalories: todaysWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
      averagePace: this.calculateWeightedAverage(todaysWorkouts, 'averagePace', 'distance'),
      totalElevation: todaysWorkouts.reduce((sum, w) => sum + (w.elevationGain || 0), 0)
    };
    
    console.log(`📊 Daily stats for user ${userId}:`, dailyStats);
    
    // Here you could save daily stats to a dedicated collection
    // await DailyStats.create({ userId, date: yesterday, ...dailyStats });
    
    this.stats.processedWorkouts += todaysWorkouts.length;
  }

  /**
   * Process weekly statistics for a specific user
   */
  async processUserWeeklyStats(userId) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyWorkouts = await Workout.find({
      userId,
      status: 'completed',
      finishedAt: { $gte: oneWeekAgo }
    });
    
    if (weeklyWorkouts.length === 0) return;
    
    // Calculate performance trends
    const trends = await AnalyticsService.calculatePerformanceTrends(userId, '1week');
    
    // Check for personal records
    const personalRecords = await AnalyticsService.calculatePersonalRecords(userId);
    
    console.log(`📈 Weekly trends for user ${userId} calculated`);
  }

  /**
   * Process monthly statistics for a specific user
   */
  async processUserMonthlyStats(userId) {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const monthlyWorkouts = await Workout.find({
      userId,
      status: 'completed',
      finishedAt: { $gte: oneMonthAgo }
    });
    
    if (monthlyWorkouts.length === 0) return;
    
    // Generate comprehensive monthly insights
    const insights = await AnalyticsService.generatePerformanceInsights(userId);
    
    // Calculate training consistency
    const consistency = await AnalyticsService.analyzeTrainingConsistency(userId, '1month');
    
    console.log(`📊 Monthly insights for user ${userId} generated`);
  }

  /**
   * Calculate system-wide statistics
   */
  async calculateSystemStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const systemStats = {
        totalWorkouts: await Workout.countDocuments({ status: 'completed' }),
        todayWorkouts: await Workout.countDocuments({
          status: 'completed',
          finishedAt: { $gte: today }
        }),
        activeUsers: await Workout.distinct('userId', {
          status: 'completed',
          finishedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).then(users => users.length),
        totalDistance: await this.calculateTotalDistance(),
        averageWorkoutDuration: await this.calculateAverageWorkoutDuration()
      };
      
      console.log('🌍 System stats calculated:', systemStats);
      
      // Here you could save system stats to cache or database
      // await SystemStats.create({ date: today, ...systemStats });
      
    } catch (error) {
      console.error('❌ Error calculating system stats:', error);
    }
  }

  /**
   * Update weekly leaderboards
   */
  async updateWeeklyLeaderboards() {
    try {
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);
      
      // Distance leaderboard
      const distanceLeaders = await Workout.aggregate([
        {
          $match: {
            status: 'completed',
            finishedAt: { $gte: thisWeekStart }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalDistance: { $sum: '$distance' },
            workoutCount: { $sum: 1 }
          }
        },
        {
          $sort: { totalDistance: -1 }
        },
        {
          $limit: 100
        }
      ]);
      
      console.log(`🏆 Weekly distance leaderboard updated: ${distanceLeaders.length} entries`);
      
    } catch (error) {
      console.error('❌ Error updating weekly leaderboards:', error);
    }
  }

  /**
   * Update monthly leaderboards
   */
  async updateMonthlyLeaderboards() {
    try {
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      // Consistency leaderboard
      const consistencyLeaders = await Workout.aggregate([
        {
          $match: {
            status: 'completed',
            finishedAt: { $gte: thisMonthStart }
          }
        },
        {
          $group: {
            _id: '$userId',
            workoutDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$finishedAt' } } },
            totalWorkouts: { $sum: 1 }
          }
        },
        {
          $addFields: {
            consistencyScore: { $size: '$workoutDays' }
          }
        },
        {
          $sort: { consistencyScore: -1 }
        },
        {
          $limit: 100
        }
      ]);
      
      console.log(`📅 Monthly consistency leaderboard updated: ${consistencyLeaders.length} entries`);
      
    } catch (error) {
      console.error('❌ Error updating monthly leaderboards:', error);
    }
  }

  /**
   * Process weekly achievements
   */
  async processWeeklyAchievements() {
    try {
      // Check for weekly distance achievements
      const weeklyDistanceThresholds = [10000, 25000, 50000, 100000]; // meters
      
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);
      
      const weeklyTotals = await Workout.aggregate([
        {
          $match: {
            status: 'completed',
            finishedAt: { $gte: thisWeekStart }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalDistance: { $sum: '$distance' }
          }
        }
      ]);
      
      for (const userTotal of weeklyTotals) {
        for (const threshold of weeklyDistanceThresholds) {
          if (userTotal.totalDistance >= threshold) {
            console.log(`🏆 User ${userTotal._id} achieved weekly ${threshold}m distance`);
            // Here you would unlock the achievement
            // await AchievementService.unlockAchievement(userTotal._id, `weekly_distance_${threshold}`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing weekly achievements:', error);
    }
  }

  /**
   * Generate monthly insights
   */
  async generateMonthlyInsights() {
    try {
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const monthlyWorkouts = await Workout.find({
        status: 'completed',
        finishedAt: { $gte: thisMonthStart }
      });
      
      const insights = {
        totalWorkouts: monthlyWorkouts.length,
        averageDistance: this.calculateAverage(monthlyWorkouts, 'distance'),
        averageDuration: this.calculateAverage(monthlyWorkouts, 'duration'),
        mostActiveDay: this.findMostActiveDay(monthlyWorkouts),
        topWorkoutType: this.findTopWorkoutType(monthlyWorkouts)
      };
      
      console.log('💡 Monthly insights generated:', insights);
      
    } catch (error) {
      console.error('❌ Error generating monthly insights:', error);
    }
  }

  // Utility methods

  calculateWeightedAverage(workouts, field, weightField) {
    const validWorkouts = workouts.filter(w => w[field] && w[weightField]);
    if (validWorkouts.length === 0) return 0;
    
    const totalWeighted = validWorkouts.reduce((sum, w) => sum + (w[field] * w[weightField]), 0);
    const totalWeight = validWorkouts.reduce((sum, w) => sum + w[weightField], 0);
    
    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  }

  calculateAverage(workouts, field) {
    const validWorkouts = workouts.filter(w => w[field]);
    if (validWorkouts.length === 0) return 0;
    
    return validWorkouts.reduce((sum, w) => sum + w[field], 0) / validWorkouts.length;
  }

  async calculateTotalDistance() {
    const result = await Workout.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$distance' } } }
    ]);
    
    return result.length > 0 ? result[0].total : 0;
  }

  async calculateAverageWorkoutDuration() {
    const result = await Workout.aggregate([
      { $match: { status: 'completed', duration: { $gt: 0 } } },
      { $group: { _id: null, average: { $avg: '$duration' } } }
    ]);
    
    return result.length > 0 ? result[0].average : 0;
  }

  findMostActiveDay(workouts) {
    const dayCount = {};
    
    workouts.forEach(workout => {
      const day = new Date(workout.finishedAt).getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });
    
    return Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b, 'Monday');
  }

  findTopWorkoutType(workouts) {
    const typeCount = {};
    
    workouts.forEach(workout => {
      typeCount[workout.type] = (typeCount[workout.type] || 0) + 1;
    });
    
    return Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, 'running');
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      stats: this.stats
    };
  }
}

// Initialize the service
const dataAggregationService = DataAggregationService.initialize();

export default dataAggregationService;