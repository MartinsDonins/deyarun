// ✅ Progress Tracking Service - MongoDB Compatible
import { User, Workout, Course, UserProgress, WorkoutAnalytics } from '../models/mongodb/index.js';
import mongoose from 'mongoose';

console.log('✅ Progress Tracking Service enabled with MongoDB support');

class ProgressTrackingService {
  static async initializeProgressTracking() {
    console.log('Progress tracking service initialized with MongoDB');
    return Promise.resolve();
  }

  static async trackDailyProgress(userId) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Get today's workouts
      const todayWorkouts = await Workout.find({
        userId: new mongoose.Types.ObjectId(userId),
        completedAt: { $gte: startOfDay, $lt: endOfDay },
        status: 'completed'
      });

      // Calculate daily metrics
      const dailyProgress = {
        date: startOfDay,
        workoutsCompleted: todayWorkouts.length,
        totalDistance: todayWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
        totalDuration: todayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
        totalCalories: todayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
        averagePace: todayWorkouts.length > 0 
          ? todayWorkouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / todayWorkouts.length 
          : 0,
        workoutTypes: [...new Set(todayWorkouts.map(w => w.type))],
        achievement: this._calculateDailyAchievement(todayWorkouts)
      };

      // Get weekly context
      const weekStart = new Date(startOfDay.getTime() - 6 * 24 * 60 * 60 * 1000);
      const weekWorkouts = await Workout.find({
        userId: new mongoose.Types.ObjectId(userId),
        completedAt: { $gte: weekStart, $lt: endOfDay },
        status: 'completed'
      });

      dailyProgress.weeklyContext = {
        workoutsThisWeek: weekWorkouts.length,
        weeklyDistance: weekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
        consistencyScore: this._calculateConsistencyScore(weekWorkouts)
      };

      return dailyProgress;

    } catch (error) {
      console.error('Track daily progress error:', error);
      return null;
    }
  }

  static async generateWeeklyReport(userId) {
    try {
      const today = new Date();
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get week's workouts
      const weekWorkouts = await Workout.find({
        userId: new mongoose.Types.ObjectId(userId),
        completedAt: { $gte: weekStart, $lte: today },
        status: 'completed'
      }).sort({ completedAt: 1 });

      // Get user info
      const user = await User.findById(userId);

      // Calculate weekly metrics
      const weeklyReport = {
        userId,
        week: {
          start: weekStart,
          end: today
        },
        summary: {
          workoutsCompleted: weekWorkouts.length,
          totalDistance: weekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
          totalDuration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
          totalCalories: weekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
          averagePace: weekWorkouts.length > 0 
            ? weekWorkouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / weekWorkouts.length 
            : 0
        },
        goals: await this._checkWeeklyGoals(userId, weekWorkouts, user),
        improvements: await this._calculateImprovements(userId, weekWorkouts),
        recommendations: await this._generateRecommendations(userId, weekWorkouts, user),
        dailyBreakdown: await this._generateDailyBreakdown(weekWorkouts, weekStart),
        achievements: this._calculateWeeklyAchievements(weekWorkouts),
        nextWeekPlan: await this._suggestNextWeekPlan(userId, weekWorkouts, user)
      };

      return weeklyReport;

    } catch (error) {
      console.error('Generate weekly report error:', error);
      return null;
    }
  }

  static async analyzeProgressTrends(userId) {
    try {
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Get recent workouts for trend analysis
      const workouts = await Workout.find({
        userId: new mongoose.Types.ObjectId(userId),
        completedAt: { $gte: threeMonthsAgo },
        status: 'completed'
      }).sort({ completedAt: 1 });

      if (workouts.length < 5) {
        return {
          message: 'Need more workout data for trend analysis',
          dataPoints: workouts.length,
          minimumRequired: 5
        };
      }

      // Analyze trends
      const trends = {
        distance: this._analyzeTrend(workouts, 'distance'),
        pace: this._analyzeTrend(workouts, 'averagePace', true), // reverse for pace (lower is better)
        duration: this._analyzeTrend(workouts, 'duration'),
        consistency: this._analyzeConsistencyTrend(workouts),
        performance: await this._analyzePerformanceTrend(userId, workouts)
      };

      // Generate insights
      const insights = this._generateTrendInsights(trends);

      return {
        userId,
        analysisDate: new Date(),
        period: {
          start: threeMonthsAgo,
          end: new Date(),
          workoutCount: workouts.length
        },
        trends,
        insights,
        recommendations: this._generateTrendRecommendations(trends)
      };

    } catch (error) {
      console.error('Analyze progress trends error:', error);
      return null;
    }
  }

  // Helper methods
  static _calculateDailyAchievement(workouts) {
    if (workouts.length === 0) return null;
    
    const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    
    if (totalDistance >= 10000) return { type: 'distance', message: '10km+ completed today!' };
    if (workouts.length >= 2) return { type: 'frequency', message: 'Multiple workouts today!' };
    if (workouts.some(w => w.duration >= 3600)) return { type: 'endurance', message: '1+ hour workout!' };
    
    return { type: 'completion', message: 'Workout completed!' };
  }

  static _calculateConsistencyScore(workouts) {
    if (workouts.length === 0) return 0;
    
    // Group by day
    const workoutDays = new Set();
    workouts.forEach(w => {
      const day = w.completedAt.toDateString();
      workoutDays.add(day);
    });
    
    return Math.round((workoutDays.size / 7) * 100);
  }

  static async _checkWeeklyGoals(userId, workouts, user) {
    const weeklyGoal = user?.weeklyGoal || 3;
    const achieved = workouts.length >= weeklyGoal;
    
    return {
      target: weeklyGoal,
      achieved: workouts.length,
      completed: achieved,
      progress: Math.min(Math.round((workouts.length / weeklyGoal) * 100), 100)
    };
  }

  static async _calculateImprovements(userId, currentWeekWorkouts) {
    try {
      // Get previous week for comparison
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const previousWeekWorkouts = await Workout.find({
        userId: new mongoose.Types.ObjectId(userId),
        completedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
        status: 'completed'
      });

      const improvements = {};
      
      if (previousWeekWorkouts.length > 0) {
        const currentAvgPace = currentWeekWorkouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / currentWeekWorkouts.length;
        const previousAvgPace = previousWeekWorkouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / previousWeekWorkouts.length;
        
        improvements.pace = {
          current: currentAvgPace,
          previous: previousAvgPace,
          change: previousAvgPace - currentAvgPace, // positive = improvement
          percentage: Math.round(((previousAvgPace - currentAvgPace) / previousAvgPace) * 100)
        };
        
        const currentDistance = currentWeekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
        const previousDistance = previousWeekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
        
        improvements.distance = {
          current: currentDistance,
          previous: previousDistance,
          change: currentDistance - previousDistance,
          percentage: previousDistance > 0 ? Math.round(((currentDistance - previousDistance) / previousDistance) * 100) : 0
        };
      }
      
      return improvements;
    } catch (error) {
      console.error('Calculate improvements error:', error);
      return {};
    }
  }

  static async _generateRecommendations(userId, workouts, user) {
    const recommendations = [];
    
    if (workouts.length < (user?.weeklyGoal || 3)) {
      recommendations.push({
        type: 'frequency',
        message: 'Try to increase workout frequency to meet your weekly goal',
        priority: 'high'
      });
    }
    
    const avgPace = workouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / workouts.length;
    if (avgPace > 420) { // slower than 7 min/km
      recommendations.push({
        type: 'pace',
        message: 'Focus on building endurance with longer, easier runs',
        priority: 'medium'
      });
    }
    
    const workoutTypes = new Set(workouts.map(w => w.type));
    if (workoutTypes.size === 1) {
      recommendations.push({
        type: 'variety',
        message: 'Try different workout types for balanced training',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  static async _generateDailyBreakdown(workouts, weekStart) {
    const dailyBreakdown = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      
      const dayWorkouts = workouts.filter(w => 
        w.completedAt >= day && w.completedAt < dayEnd
      );
      
      dailyBreakdown.push({
        date: day,
        workouts: dayWorkouts.length,
        distance: dayWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
        duration: dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
      });
    }
    
    return dailyBreakdown;
  }

  static _calculateWeeklyAchievements(workouts) {
    const achievements = [];
    
    const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    if (totalDistance >= 50000) achievements.push({ type: 'distance', message: '50km+ this week!' });
    
    const uniqueDays = new Set(workouts.map(w => w.completedAt.toDateString()));
    if (uniqueDays.size >= 5) achievements.push({ type: 'consistency', message: '5+ workout days!' });
    
    return achievements;
  }

  static async _suggestNextWeekPlan(userId, workouts, user) {
    const avgWeeklyDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const suggestedIncrease = Math.round(avgWeeklyDistance * 0.1); // 10% increase
    
    return {
      suggestedWorkouts: Math.min((user?.weeklyGoal || 3) + 1, 6),
      suggestedDistance: avgWeeklyDistance + suggestedIncrease,
      focus: workouts.length < 3 ? 'consistency' : 'progression'
    };
  }

  static _analyzeTrend(workouts, field, reverse = false) {
    if (workouts.length < 3) return { trend: 'insufficient_data' };
    
    const values = workouts.map(w => w[field] || 0).filter(v => v > 0);
    if (values.length < 3) return { trend: 'insufficient_data' };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const percentChange = Math.round((change / firstAvg) * 100);
    
    let trend;
    if (Math.abs(percentChange) < 5) trend = 'stable';
    else if (reverse ? change < 0 : change > 0) trend = 'improving';
    else trend = 'declining';
    
    return {
      trend,
      change,
      percentChange,
      firstPeriodAvg: firstAvg,
      secondPeriodAvg: secondAvg
    };
  }

  static _analyzeConsistencyTrend(workouts) {
    // Group workouts by week
    const weeklyWorkouts = {};
    workouts.forEach(w => {
      const weekKey = Math.floor(w.completedAt.getTime() / (7 * 24 * 60 * 60 * 1000));
      if (!weeklyWorkouts[weekKey]) weeklyWorkouts[weekKey] = 0;
      weeklyWorkouts[weekKey]++;
    });
    
    const weeklyValues = Object.values(weeklyWorkouts);
    if (weeklyValues.length < 3) return { trend: 'insufficient_data' };
    
    return this._analyzeTrend({ map: () => weeklyValues.map(v => ({ frequency: v })) }, 'frequency');
  }

  static async _analyzePerformanceTrend(userId, workouts) {
    // Calculate performance score for each workout
    const performanceScores = workouts.map(w => {
      let score = 0;
      if (w.distance) score += w.distance * 0.1; // Distance contribution
      if (w.averagePace) score += Math.max(0, 600 - w.averagePace) * 0.5; // Pace contribution (lower is better)
      if (w.duration) score += w.duration * 0.01; // Duration contribution
      return { ...w, performanceScore: score };
    });
    
    return this._analyzeTrend(performanceScores, 'performanceScore');
  }

  static _generateTrendInsights(trends) {
    const insights = [];
    
    if (trends.pace.trend === 'improving') {
      insights.push('Your pace is improving over time - great progress!');
    }
    
    if (trends.distance.trend === 'improving') {
      insights.push('You\'re consistently increasing your workout distances.');
    }
    
    if (trends.consistency.trend === 'declining') {
      insights.push('Your workout consistency has decreased recently. Consider setting reminders.');
    }
    
    return insights;
  }

  static _generateTrendRecommendations(trends) {
    const recommendations = [];
    
    if (trends.pace.trend === 'declining') {
      recommendations.push({
        type: 'pace',
        message: 'Focus on tempo runs and interval training to improve pace',
        priority: 'high'
      });
    }
    
    if (trends.consistency.trend === 'declining') {
      recommendations.push({
        type: 'consistency',
        message: 'Set a consistent workout schedule and stick to it',
        priority: 'high'
      });
    }
    
    return recommendations;
  }
}

export default ProgressTrackingService;