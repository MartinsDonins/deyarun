// Analytics Service
// Advanced statistical analysis and performance calculations

import { Workout, GpsPoint } from '../models/mongodb/index.js';

export class AnalyticsService {

  /**
   * Calculate performance trends over a given period
   */
  static async calculatePerformanceTrends(userId, period = '3months', metric = 'all') {
    try {
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      }).sort({ startedAt: 1 });

      const trends = {
        distance: this.calculateDistanceTrend(workouts),
        pace: this.calculatePaceTrend(workouts),
        frequency: this.calculateFrequencyTrend(workouts, periodDays),
        duration: this.calculateDurationTrend(workouts),
        elevation: this.calculateElevationTrend(workouts),
        consistency: this.calculateConsistencyScore(workouts)
      };

      // Return specific metric if requested
      if (metric !== 'all' && trends[metric]) {
        return { [metric]: trends[metric] };
      }

      return trends;
    } catch (error) {
      console.error('Error calculating performance trends:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered performance predictions
   */
  static async generatePerformancePredictions(userId, timeframe = '1month', goals) {
    try {
      // Get historical data for prediction model
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: sixMonthsAgo }
      }).sort({ startedAt: 1 });

      if (workouts.length < 10) {
        return {
          message: 'Need more workout data for accurate predictions',
          minWorkouts: 10,
          currentWorkouts: workouts.length
        };
      }

      const predictions = {
        distance: this.predictDistanceProgress(workouts, timeframe),
        pace: this.predictPaceImprovement(workouts, timeframe),
        performance: this.predictPerformanceMetrics(workouts, timeframe),
        goals: goals ? this.assessGoalAchievability(workouts, goals) : null
      };

      return predictions;
    } catch (error) {
      console.error('Error generating performance predictions:', error);
      throw error;
    }
  }

  /**
   * Generate personalized performance insights
   */
  static async generatePerformanceInsights(userId, category = 'all') {
    try {
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: threeMonthsAgo }
      }).sort({ startedAt: 1 });

      const insights = {
        strengths: this.identifyStrengths(workouts),
        improvements: this.identifyImprovementAreas(workouts),
        patterns: this.identifyTrainingPatterns(workouts),
        recommendations: this.generateRecommendations(workouts)
      };

      if (category !== 'all' && insights[category]) {
        return { [category]: insights[category] };
      }

      return insights;
    } catch (error) {
      console.error('Error generating performance insights:', error);
      throw error;
    }
  }

  /**
   * Generate comparative analysis between users
   */
  static async generateComparativeAnalysis(userIds, metric = 'distance', period = '1month') {
    try {
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      const comparisons = await Promise.all(
        userIds.map(async (userId) => {
          const workouts = await Workout.find({
            userId,
            status: 'completed',
            startedAt: { $gte: startDate }
          });

          return {
            userId,
            metrics: this.calculateUserMetrics(workouts, metric),
            workoutCount: workouts.length
          };
        })
      );

      return {
        metric,
        period,
        users: comparisons,
        rankings: this.calculateRankings(comparisons, metric),
        insights: this.generateComparisonInsights(comparisons)
      };
    } catch (error) {
      console.error('Error generating comparative analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate personal records for a user
   */
  static async calculatePersonalRecords(userId, category = 'all') {
    try {
      const workouts = await Workout.find({
        userId,
        status: 'completed'
      }).sort({ startedAt: 1 });

      const records = {
        distance: {
          longest: this.findMaxRecord(workouts, 'distance'),
          fastest5k: this.findFastestDistance(workouts, 5000),
          fastest10k: this.findFastestDistance(workouts, 10000),
          fastestHalfMarathon: this.findFastestDistance(workouts, 21097),
          fastestMarathon: this.findFastestDistance(workouts, 42195)
        },
        pace: {
          fastest: this.findMaxRecord(workouts, 'bestPace', 'min'),
          averageBest: this.calculateAverageBestPace(workouts)
        },
        duration: {
          longest: this.findMaxRecord(workouts, 'duration'),
          total: this.calculateTotalDuration(workouts)
        },
        elevation: {
          highest: this.findMaxRecord(workouts, 'elevationGain'),
          totalGain: this.calculateTotalElevation(workouts)
        }
      };

      if (category !== 'all' && records[category]) {
        return { [category]: records[category] };
      }

      return records;
    } catch (error) {
      console.error('Error calculating personal records:', error);
      throw error;
    }
  }

  /**
   * Analyze training consistency
   */
  static async analyzeTrainingConsistency(userId, period = '6months') {
    try {
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      }).sort({ startedAt: 1 });

      return {
        weeklyAverage: this.calculateWeeklyAverage(workouts),
        consistencyScore: this.calculateConsistencyScore(workouts),
        streaks: this.calculateStreaks(workouts),
        patterns: this.analyzeWeeklyPatterns(workouts),
        recommendations: this.generateConsistencyRecommendations(workouts)
      };
    } catch (error) {
      console.error('Error analyzing training consistency:', error);
      throw error;
    }
  }

  /**
   * Analyze performance zones (pace, heart rate, etc.)
   */
  static async analyzePerformanceZones(userId, type = 'pace') {
    try {
      const workouts = await Workout.find({
        userId,
        status: 'completed'
      }).sort({ startedAt: -1 }).limit(50); // Last 50 workouts

      switch (type) {
        case 'pace':
          return this.analyzePaceZones(workouts);
        case 'heartRate':
          return this.analyzeHeartRateZones(workouts);
        case 'effort':
          return this.analyzeEffortZones(workouts);
        default:
          return this.analyzePaceZones(workouts);
      }
    } catch (error) {
      console.error('Error analyzing performance zones:', error);
      throw error;
    }
  }

  /**
   * Analyze training load and intensity
   */
  static async analyzeTrainingLoad(userId, weeks = 12) {
    try {
      const startDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      }).sort({ startedAt: 1 });

      return {
        weeklyLoad: this.calculateWeeklyTrainingLoad(workouts),
        loadTrend: this.calculateLoadTrend(workouts),
        acuteChronicRatio: this.calculateACWR(workouts),
        intensity: this.analyzeIntensityDistribution(workouts),
        recovery: this.assessRecoveryNeeds(workouts)
      };
    } catch (error) {
      console.error('Error analyzing training load:', error);
      throw error;
    }
  }

  /**
   * Analyze recovery patterns
   */
  static async analyzeRecovery(userId) {
    try {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: twoMonthsAgo }
      }).sort({ startedAt: 1 });

      return {
        recoveryScore: this.calculateRecoveryScore(workouts),
        patterns: this.analyzeRecoveryPatterns(workouts),
        recommendations: this.generateRecoveryRecommendations(workouts),
        restDays: this.analyzeRestDays(workouts)
      };
    } catch (error) {
      console.error('Error analyzing recovery:', error);
      throw error;
    }
  }

  /**
   * Generate custom analytics report
   */
  static async generateCustomReport(config) {
    try {
      const { userIds, metrics, period, filters, reportType } = config;
      
      const report = {
        metadata: {
          generatedAt: new Date(),
          userCount: userIds.length,
          period,
          reportType
        },
        data: {}
      };

      for (const userId of userIds) {
        const userData = await this.generateUserAnalytics(userId, metrics, period, filters);
        report.data[userId] = userData;
      }

      // Add aggregated insights for multi-user reports
      if (userIds.length > 1) {
        report.aggregated = this.generateAggregatedInsights(report.data);
      }

      return report;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  }

  // Helper methods for calculations

  static parsePeriodToDays(period) {
    const periods = {
      '1week': 7,
      '2weeks': 14,
      '1month': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365
    };
    return periods[period] || 90;
  }

  static calculateDistanceTrend(workouts) {
    if (workouts.length < 2) return null;
    
    const weeklyDistances = this.groupByWeek(workouts)
      .map(week => week.reduce((sum, w) => sum + (w.distance || 0), 0));
    
    return {
      current: weeklyDistances[weeklyDistances.length - 1] || 0,
      average: weeklyDistances.reduce((sum, d) => sum + d, 0) / weeklyDistances.length,
      trend: this.calculateLinearTrend(weeklyDistances),
      data: weeklyDistances
    };
  }

  static calculatePaceTrend(workouts) {
    const pacedWorkouts = workouts.filter(w => w.averagePace && w.averagePace > 0);
    if (pacedWorkouts.length < 2) return null;

    const weeklyPaces = this.groupByWeek(pacedWorkouts)
      .map(week => {
        const validPaces = week.filter(w => w.averagePace).map(w => w.averagePace);
        return validPaces.length > 0 ? 
          validPaces.reduce((sum, p) => sum + p, 0) / validPaces.length : null;
      })
      .filter(pace => pace !== null);

    return {
      current: weeklyPaces[weeklyPaces.length - 1] || 0,
      average: weeklyPaces.reduce((sum, p) => sum + p, 0) / weeklyPaces.length,
      trend: this.calculateLinearTrend(weeklyPaces.map(p => -p)), // Negative for "improvement"
      data: weeklyPaces
    };
  }

  static calculateFrequencyTrend(workouts, totalDays) {
    const weeklyWorkouts = this.groupByWeek(workouts)
      .map(week => week.length);
    
    return {
      current: weeklyWorkouts[weeklyWorkouts.length - 1] || 0,
      average: weeklyWorkouts.reduce((sum, c) => sum + c, 0) / weeklyWorkouts.length,
      trend: this.calculateLinearTrend(weeklyWorkouts),
      totalWorkouts: workouts.length,
      data: weeklyWorkouts
    };
  }

  static groupByWeek(workouts) {
    const weeks = {};
    
    workouts.forEach(workout => {
      const date = new Date(workout.startedAt);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(workout);
    });
    
    return Object.values(weeks);
  }

  static calculateLinearTrend(data) {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + (val * index), 0);
    const sumXX = data.reduce((sum, val, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  static findMaxRecord(workouts, field, type = 'max') {
    const validWorkouts = workouts.filter(w => w[field] && w[field] > 0);
    if (validWorkouts.length === 0) return null;
    
    const values = validWorkouts.map(w => w[field]);
    const value = type === 'max' ? Math.max(...values) : Math.min(...values);
    const workout = validWorkouts.find(w => w[field] === value);
    
    return {
      value,
      workout: {
        id: workout._id,
        date: workout.startedAt,
        type: workout.type
      }
    };
  }

  static calculateConsistencyScore(workouts) {
    if (workouts.length < 4) return 0;
    
    const weeklyFrequency = this.groupByWeek(workouts).map(week => week.length);
    const mean = weeklyFrequency.reduce((sum, f) => sum + f, 0) / weeklyFrequency.length;
    const variance = weeklyFrequency.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / weeklyFrequency.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consistency score: lower variance = higher consistency
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    return Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));
  }

  // Additional helper methods would continue here...
  // This is a comprehensive foundation for the analytics service

}

export default AnalyticsService;