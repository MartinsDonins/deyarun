import { Goal } from '../models/mongodb/goal.model.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';

export class GoalTrackingService {

  /**
   * Calculate comprehensive analytics for a specific goal
   */
  static async calculateGoalAnalytics(goalId) {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) throw new Error('Goal not found');

      const analytics = {
        progress: this.calculateProgressAnalytics(goal),
        performance: await this.calculatePerformanceAnalytics(goal),
        prediction: this.calculatePredictionAnalytics(goal),
        consistency: this.calculateConsistencyAnalytics(goal),
        milestones: this.calculateMilestoneAnalytics(goal),
        efficiency: this.calculateEfficiencyAnalytics(goal)
      };

      return analytics;
    } catch (error) {
      console.error('Error calculating goal analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics summary for all user goals
   */
  static async getGoalsAnalyticsSummary(userId, period = '1month') {
    try {
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      const goals = await Goal.find({
        userId,
        createdAt: { $gte: startDate }
      });

      const summary = {
        overview: {
          totalGoals: goals.length,
          activeGoals: goals.filter(g => g.status === 'active').length,
          completedGoals: goals.filter(g => g.status === 'completed').length,
          failedGoals: goals.filter(g => g.status === 'failed').length,
          averageProgress: this.calculateAverageProgress(goals)
        },
        categories: this.calculateCategoryBreakdown(goals),
        types: this.calculateTypeBreakdown(goals),
        performance: {
          completionRate: this.calculateCompletionRate(goals),
          averageTimeToComplete: await this.calculateAverageCompletionTime(userId),
          mostSuccessfulType: this.getMostSuccessfulGoalType(goals),
          trends: this.calculateGoalTrends(goals)
        },
        upcoming: {
          dueSoon: goals.filter(g => 
            g.status === 'active' && 
            g.daysRemaining <= 7 && 
            g.daysRemaining > 0
          ).length,
          overdue: goals.filter(g => 
            g.status === 'active' && 
            g.daysRemaining <= 0
          ).length,
          nextMilestones: this.getUpcomingMilestones(goals)
        },
        insights: await this.generateGoalInsights(userId, goals)
      };

      return summary;
    } catch (error) {
      console.error('Error getting goals analytics summary:', error);
      throw error;
    }
  }

  /**
   * Sync goal progress from workout data
   */
  static async syncGoalProgressFromWorkouts(userId, goalIds = null) {
    try {
      console.log(`🔄 Syncing goal progress from workouts for user ${userId}`);

      // Get goals to sync
      const query = { userId, status: 'active' };
      if (goalIds && goalIds.length > 0) {
        query._id = { $in: goalIds };
      }

      const goals = await Goal.find(query);
      console.log(`Found ${goals.length} goals to sync`);

      const results = {
        synced: 0,
        updated: 0,
        errors: []
      };

      for (const goal of goals) {
        try {
          const updated = await this.syncSingleGoalProgress(goal);
          results.synced++;
          if (updated) results.updated++;
        } catch (error) {
          console.error(`Error syncing goal ${goal._id}:`, error);
          results.errors.push({
            goalId: goal._id,
            error: error.message
          });
        }
      }

      console.log(`✅ Goal sync completed:`, results);
      return results;
    } catch (error) {
      console.error('Error syncing goal progress from workouts:', error);
      throw error;
    }
  }

  /**
   * Create goal from predefined template
   */
  static async createGoalFromTemplate(userId, templateId, customizations = {}) {
    try {
      const template = this.getGoalTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const goal = Goal.createFromTemplate(userId, template, customizations);
      await goal.save();

      console.log(`📋 Created goal from template ${templateId} for user ${userId}`);
      return goal;
    } catch (error) {
      console.error('Error creating goal from template:', error);
      throw error;
    }
  }

  /**
   * Sync progress for a single goal based on workout data
   */
  static async syncSingleGoalProgress(goal) {
    try {
      let newProgress = null;

      // Different sync strategies based on goal type
      switch (goal.type) {
        case 'distance':
          newProgress = await this.calculateDistanceProgress(goal);
          break;
        case 'pace':
          newProgress = await this.calculatePaceProgress(goal);
          break;
        case 'duration':
          newProgress = await this.calculateDurationProgress(goal);
          break;
        case 'frequency':
          newProgress = await this.calculateFrequencyProgress(goal);
          break;
        case 'consistency':
          newProgress = await this.calculateConsistencyProgress(goal);
          break;
        default:
          // Custom goals require manual tracking
          return false;
      }

      if (newProgress !== null && newProgress !== goal.current.value) {
        await goal.updateProgress(newProgress, 'automatic');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error syncing single goal progress:', error);
      throw error;
    }
  }

  /**
   * Calculate distance-based goal progress from workouts
   */
  static async calculateDistanceProgress(goal) {
    try {
      let startDate, endDate;

      // Determine date range based on goal category
      if (goal.category === 'daily') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      } else if (goal.category === 'weekly') {
        const now = new Date();
        const dayOfWeek = now.getDay();
        startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (goal.category === 'monthly') {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Use goal timeline
        startDate = goal.timeline.startDate;
        endDate = goal.timeline.endDate;
      }

      const workouts = await Workout.find({
        userId: goal.userId,
        status: 'completed',
        startedAt: { $gte: startDate, $lte: endDate }
      });

      const totalDistance = workouts.reduce((sum, workout) => {
        return sum + (workout.distance || 0);
      }, 0);

      // Convert to goal unit if needed
      let progress = totalDistance;
      if (goal.target.unit === 'km' && totalDistance) {
        progress = totalDistance / 1000; // Convert meters to km
      } else if (goal.target.unit === 'miles' && totalDistance) {
        progress = totalDistance / 1609.34; // Convert meters to miles
      }

      return Math.round(progress * 100) / 100;
    } catch (error) {
      console.error('Error calculating distance progress:', error);
      return null;
    }
  }

  /**
   * Calculate pace-based goal progress from workouts
   */
  static async calculatePaceProgress(goal) {
    try {
      const recentWorkouts = await Workout.find({
        userId: goal.userId,
        status: 'completed',
        avgPace: { $exists: true, $ne: null },
        startedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).sort({ startedAt: -1 }).limit(10);

      if (recentWorkouts.length === 0) return null;

      const averagePace = recentWorkouts.reduce((sum, workout) => {
        return sum + workout.avgPace;
      }, 0) / recentWorkouts.length;

      // For pace goals, progress is inverse (lower pace = better)
      // Calculate how close we are to the target pace
      const targetPace = goal.target.value;
      const improvement = Math.max(0, (goal.current.value || averagePace) - averagePace);
      
      return Math.round(averagePace * 100) / 100;
    } catch (error) {
      console.error('Error calculating pace progress:', error);
      return null;
    }
  }

  /**
   * Calculate frequency-based goal progress (workouts per period)
   */
  static async calculateFrequencyProgress(goal) {
    try {
      let startDate;

      if (goal.category === 'weekly') {
        const now = new Date();
        const dayOfWeek = now.getDay();
        startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
        startDate.setHours(0, 0, 0, 0);
      } else if (goal.category === 'monthly') {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = goal.timeline.startDate;
      }

      const workouts = await Workout.find({
        userId: goal.userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      });

      return workouts.length;
    } catch (error) {
      console.error('Error calculating frequency progress:', error);
      return null;
    }
  }

  /**
   * Get predefined goal templates
   */
  static getGoalTemplate(templateId) {
    const templates = {
      '5k_training': {
        title: '5K Training Goal',
        description: 'Complete a 5K run in under 30 minutes',
        type: 'race_time',
        category: 'milestone',
        target: { value: 30, unit: 'minutes' },
        defaultDurationDays: 60,
        difficulty: 'moderate',
        milestones: [
          { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), description: 'Complete 3K without stopping' },
          { date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), description: 'Complete 4K under 25 minutes' },
          { date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), description: 'Complete 5K under 32 minutes' }
        ],
        tags: ['running', '5k', 'race']
      },
      'weekly_distance': {
        title: 'Weekly Distance Goal',
        description: 'Run a specific distance each week',
        type: 'distance',
        category: 'weekly',
        target: { value: 25, unit: 'km' },
        defaultDurationDays: 7,
        difficulty: 'moderate',
        tags: ['distance', 'weekly']
      },
      'consistency_30_days': {
        title: '30-Day Consistency Challenge',
        description: 'Exercise at least 4 times per week for 30 days',
        type: 'consistency',
        category: 'milestone',
        target: { value: 4, unit: 'count' },
        defaultDurationDays: 30,
        difficulty: 'challenging',
        tags: ['consistency', 'challenge']
      },
      'pace_improvement': {
        title: 'Pace Improvement Goal',
        description: 'Improve average running pace',
        type: 'pace',
        category: 'milestone',
        target: { value: 5.5, unit: 'minutes' }, // minutes per km
        defaultDurationDays: 90,
        difficulty: 'challenging',
        tags: ['pace', 'improvement']
      }
    };

    return templates[templateId] || null;
  }

  // Helper methods for analytics calculations
  static calculateProgressAnalytics(goal) {
    return {
      percentage: goal.progress.percentage,
      trend: goal.progress.trend,
      daysRemaining: goal.daysRemaining,
      requiredProgressPerDay: goal.requiredProgressPerDay,
      isOnTrack: goal.progress.percentage >= (
        ((Date.now() - goal.timeline.startDate) / 
         (goal.timeline.endDate - goal.timeline.startDate)) * 100
      )
    };
  }

  static async calculatePerformanceAnalytics(goal) {
    const recentHistory = goal.history
      .filter(h => h.action === 'progress_updated')
      .slice(-7);

    return {
      recentUpdates: recentHistory.length,
      averageProgressPerUpdate: recentHistory.length > 0 ?
        recentHistory.reduce((sum, h) => sum + (h.newValue - (h.oldValue || 0)), 0) / recentHistory.length : 0,
      updateFrequency: recentHistory.length > 0 ?
        (Date.now() - new Date(recentHistory[0].date)) / recentHistory.length / (24 * 60 * 60 * 1000) : 0
    };
  }

  static calculatePredictionAnalytics(goal) {
    const progressHistory = goal.history
      .filter(h => h.action === 'progress_updated')
      .slice(-10);

    if (progressHistory.length < 3) {
      return {
        completionProbability: goal.completionLikelihood,
        estimatedCompletionDate: null,
        confidence: 'low'
      };
    }

    // Simple linear regression for prediction
    const progressRate = this.calculateProgressRate(progressHistory);
    const remaining = goal.target.value - goal.current.value;
    const daysToComplete = remaining / progressRate;

    return {
      completionProbability: goal.completionLikelihood,
      estimatedCompletionDate: new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000),
      confidence: progressHistory.length >= 7 ? 'high' : 'medium',
      progressRate
    };
  }

  static calculateConsistencyAnalytics(goal) {
    const updates = goal.history.filter(h => h.action === 'progress_updated');
    
    if (updates.length < 2) return { score: 0, pattern: 'insufficient_data' };

    const daysBetweenUpdates = updates.slice(1).map((update, index) => {
      const prevUpdate = updates[index];
      return (new Date(update.date) - new Date(prevUpdate.date)) / (24 * 60 * 60 * 1000);
    });

    const avgDaysBetween = daysBetweenUpdates.reduce((a, b) => a + b, 0) / daysBetweenUpdates.length;
    const variance = daysBetweenUpdates.reduce((sum, days) => sum + Math.pow(days - avgDaysBetween, 2), 0) / daysBetweenUpdates.length;
    
    // Lower variance = higher consistency score
    const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) * 10));

    return {
      score: Math.round(consistencyScore),
      averageDaysBetweenUpdates: Math.round(avgDaysBetween * 10) / 10,
      pattern: consistencyScore > 70 ? 'consistent' : consistencyScore > 40 ? 'irregular' : 'inconsistent'
    };
  }

  static calculateMilestoneAnalytics(goal) {
    const milestones = goal.timeline.milestones;
    const achieved = milestones.filter(m => m.achieved).length;
    
    return {
      total: milestones.length,
      achieved,
      remaining: milestones.length - achieved,
      completionRate: milestones.length > 0 ? (achieved / milestones.length) * 100 : 0,
      nextMilestone: milestones.find(m => !m.achieved && m.date >= new Date()) || null
    };
  }

  static calculateEfficiencyAnalytics(goal) {
    const totalDays = (Date.now() - goal.timeline.startDate) / (24 * 60 * 60 * 1000);
    const progressPerDay = goal.current.value / Math.max(1, totalDays);
    const targetProgressPerDay = goal.target.value / 
      ((goal.timeline.endDate - goal.timeline.startDate) / (24 * 60 * 60 * 1000));

    return {
      actualProgressPerDay: Math.round(progressPerDay * 100) / 100,
      targetProgressPerDay: Math.round(targetProgressPerDay * 100) / 100,
      efficiency: Math.round((progressPerDay / targetProgressPerDay) * 100),
      timeUtilization: Math.min(100, (totalDays / 
        ((goal.timeline.endDate - goal.timeline.startDate) / (24 * 60 * 60 * 1000))) * 100)
    };
  }

  // Additional helper methods
  static parsePeriodToDays(period) {
    const periods = {
      '1week': 7,
      '2weeks': 14,
      '1month': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365
    };
    return periods[period] || 30;
  }

  static calculateAverageProgress(goals) {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress.percentage, 0);
    return Math.round(totalProgress / goals.length);
  }

  static calculateCategoryBreakdown(goals) {
    const breakdown = {};
    goals.forEach(goal => {
      breakdown[goal.category] = (breakdown[goal.category] || 0) + 1;
    });
    return breakdown;
  }

  static calculateTypeBreakdown(goals) {
    const breakdown = {};
    goals.forEach(goal => {
      breakdown[goal.type] = (breakdown[goal.type] || 0) + 1;
    });
    return breakdown;
  }

  static calculateCompletionRate(goals) {
    if (goals.length === 0) return 0;
    const completed = goals.filter(g => g.status === 'completed').length;
    return Math.round((completed / goals.length) * 100);
  }

  static async calculateAverageCompletionTime(userId) {
    const completedGoals = await Goal.find({
      userId,
      status: 'completed'
    });

    if (completedGoals.length === 0) return null;

    const completionTimes = completedGoals.map(goal => {
      const completedEntry = goal.history.find(h => h.action === 'completed');
      if (completedEntry) {
        return new Date(completedEntry.date) - goal.timeline.startDate;
      }
      return goal.timeline.endDate - goal.timeline.startDate;
    });

    const avgTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    return Math.round(avgTime / (24 * 60 * 60 * 1000)); // Days
  }

  static getMostSuccessfulGoalType(goals) {
    const typeStats = {};
    
    goals.forEach(goal => {
      if (!typeStats[goal.type]) {
        typeStats[goal.type] = { total: 0, completed: 0 };
      }
      typeStats[goal.type].total++;
      if (goal.status === 'completed') {
        typeStats[goal.type].completed++;
      }
    });

    let bestType = null;
    let bestRate = 0;

    for (const [type, stats] of Object.entries(typeStats)) {
      const rate = stats.completed / stats.total;
      if (rate > bestRate) {
        bestRate = rate;
        bestType = type;
      }
    }

    return bestType ? { type: bestType, successRate: Math.round(bestRate * 100) } : null;
  }

  static calculateGoalTrends(goals) {
    // Placeholder for trend analysis
    return {
      totalGoalsOverTime: 'increasing',
      completionRateOverTime: 'stable',
      averageGoalDifficulty: 'moderate'
    };
  }

  static getUpcomingMilestones(goals) {
    const upcoming = [];
    
    goals.forEach(goal => {
      goal.timeline.milestones.forEach(milestone => {
        if (!milestone.achieved && milestone.date >= new Date()) {
          upcoming.push({
            goalId: goal._id,
            goalTitle: goal.title,
            description: milestone.description,
            date: milestone.date,
            daysUntil: Math.ceil((milestone.date - new Date()) / (24 * 60 * 60 * 1000))
          });
        }
      });
    });

    return upcoming.sort((a, b) => a.date - b.date).slice(0, 5);
  }

  static async generateGoalInsights(userId, goals) {
    // Placeholder for AI-generated insights
    return [
      'You have been most successful with weekly distance goals',
      'Consider setting more milestones for better progress tracking',
      'Your goal completion rate is above average'
    ];
  }

  static calculateProgressRate(progressHistory) {
    if (progressHistory.length < 2) return 0;
    
    const recent = progressHistory.slice(-5);
    const timeSpan = new Date(recent[recent.length - 1].date) - new Date(recent[0].date);
    const progressDiff = recent[recent.length - 1].newValue - recent[0].newValue;
    
    return progressDiff / (timeSpan / (24 * 60 * 60 * 1000)); // Progress per day
  }

  // Additional goal type calculations
  static async calculateDurationProgress(goal) {
    // Similar to distance but tracking workout duration
    return null; // Placeholder
  }

  static async calculateConsistencyProgress(goal) {
    // Track consistency of workout frequency
    return null; // Placeholder
  }
}