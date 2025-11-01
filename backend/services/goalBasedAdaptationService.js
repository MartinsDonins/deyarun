// ✅ Goal Based Adaptation Service - MongoDB Compatible
import { User, Workout, TrainingPlan } from '../models/mongodb/index.js';
import mongoose from 'mongoose';

console.log('✅ Goal Based Adaptation Service enabled with MongoDB support');

class GoalBasedAdaptationService {
  async initialize() {
    console.log('Goal based adaptation service initialized with MongoDB');
    return Promise.resolve();
  }

  async adaptTrainingPlan(userId, goalData) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const recentWorkouts = await Workout.find({ userId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(20);

      const adaptedPlan = {
        userId,
        goalType: goalData.type || '5k',
        targetDate: goalData.targetDate,
        currentFitness: this.assessCurrentFitness(recentWorkouts),
        weeklyPlan: this.generateWeeklyPlan(goalData, recentWorkouts, user),
        adaptations: this.calculateAdaptations(goalData, recentWorkouts)
      };

      return adaptedPlan;
    } catch (error) {
      console.error('Adapt training plan error:', error);
      return null;
    }
  }

  async assessGoalProgress(userId) {
    try {
      const user = await User.findById(userId);
      const workouts = await Workout.find({ userId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(50);

      if (!workouts.length) return null;

      return {
        userId,
        currentPace: this.calculateAveragePace(workouts),
        weeklyDistance: this.calculateWeeklyDistance(workouts),
        consistency: this.calculateConsistency(workouts),
        improvement: this.calculateImprovement(workouts),
        goalProgress: this.assessGoalReadiness(workouts, user.targetEventType)
      };
    } catch (error) {
      console.error('Assess goal progress error:', error);
      return null;
    }
  }

  assessCurrentFitness(workouts) {
    if (!workouts.length) return 'beginner';
    
    const avgDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0) / workouts.length;
    const avgPace = workouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / workouts.length;
    
    if (avgDistance > 8000 && avgPace < 360) return 'advanced';
    if (avgDistance > 5000 && avgPace < 420) return 'intermediate';
    return 'beginner';
  }

  generateWeeklyPlan(goalData, workouts, user) {
    const fitnessLevel = user.fitnessLevel || 'beginner';
    
    const plans = {
      beginner: {
        workoutsPerWeek: 3,
        easyRuns: 2,
        hardRuns: 1,
        weeklyDistance: 15000
      },
      intermediate: {
        workoutsPerWeek: 4,
        easyRuns: 2,
        hardRuns: 2,
        weeklyDistance: 25000
      },
      advanced: {
        workoutsPerWeek: 5,
        easyRuns: 3,
        hardRuns: 2,
        weeklyDistance: 40000
      }
    };

    return plans[fitnessLevel] || plans.beginner;
  }

  calculateAdaptations(goalData, workouts) {
    const adaptations = [];
    
    if (workouts.length < 3) {
      adaptations.push({ type: 'frequency', message: 'Increase workout frequency to 3+ per week' });
    }
    
    const avgPace = workouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / workouts.length;
    if (avgPace > 480) {
      adaptations.push({ type: 'pace', message: 'Focus on building base endurance' });
    }
    
    return adaptations;
  }

  calculateAveragePace(workouts) {
    return workouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / workouts.length;
  }

  calculateWeeklyDistance(workouts) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekWorkouts = workouts.filter(w => w.completedAt >= weekAgo);
    return weekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
  }

  calculateConsistency(workouts) {
    const workoutDays = new Set(workouts.map(w => w.completedAt.toDateString()));
    return workoutDays.size / 30; // rough consistency over 30 days
  }

  calculateImprovement(workouts) {
    if (workouts.length < 6) return 0;
    
    const recent = workouts.slice(0, 3);
    const older = workouts.slice(-3);
    
    const recentPace = recent.reduce((sum, w) => sum + (w.averagePace || 0), 0) / recent.length;
    const olderPace = older.reduce((sum, w) => sum + (w.averagePace || 0), 0) / older.length;
    
    return ((olderPace - recentPace) / olderPace) * 100; // positive = improvement
  }

  assessGoalReadiness(workouts, goalType) {
    const goalRequirements = {
      '5k': { minPace: 420, minDistance: 5000 },
      '10k': { minPace: 450, minDistance: 8000 },
      'half-marathon': { minPace: 480, minDistance: 15000 }
    };
    
    const requirement = goalRequirements[goalType] || goalRequirements['5k'];
    const avgPace = this.calculateAveragePace(workouts);
    const maxDistance = Math.max(...workouts.map(w => w.distance || 0));
    
    const paceReady = avgPace <= requirement.minPace;
    const distanceReady = maxDistance >= requirement.minDistance;
    
    return {
      readiness: (paceReady && distanceReady) ? 'ready' : 'in_progress',
      paceReady,
      distanceReady,
      recommendation: this.getGoalRecommendation(paceReady, distanceReady, goalType)
    };
  }

  getGoalRecommendation(paceReady, distanceReady, goalType) {
    if (paceReady && distanceReady) return `You're ready for your ${goalType} goal!`;
    if (!paceReady && !distanceReady) return 'Focus on building both pace and distance gradually';
    if (!paceReady) return 'Work on speed training and tempo runs';
    return 'Gradually increase your long run distance';
  }
}

export default new GoalBasedAdaptationService();