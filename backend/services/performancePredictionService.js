// ✅ Performance Prediction Service - MongoDB Compatible
import { User, Workout, WorkoutAnalytics } from '../models/mongodb/index.js';
import mongoose from 'mongoose';

console.log('✅ Performance Prediction Service enabled with MongoDB support');

class PerformancePredictionService {
  async initialize() {
    console.log('Performance prediction service initialized with MongoDB');
    return Promise.resolve();
  }

  async predictRacePerformance(userId, raceDistance) {
    try {
      const workouts = await Workout.find({ userId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(30);

      if (workouts.length < 5) {
        return { error: 'Insufficient workout data for prediction' };
      }

      const recentPace = this.calculateRecentPace(workouts);
      const enduranceScore = this.calculateEnduranceScore(workouts);
      const consistencyScore = this.calculateConsistencyScore(workouts);

      const prediction = this.calculateRacePrediction(raceDistance, recentPace, enduranceScore, consistencyScore);

      return {
        userId,
        raceDistance,
        predictedTime: prediction.time,
        predictedPace: prediction.pace,
        confidence: prediction.confidence,
        factors: {
          recentPace,
          enduranceScore,
          consistencyScore
        },
        recommendations: this.generatePerformanceRecommendations(prediction, workouts)
      };

    } catch (error) {
      console.error('Predict race performance error:', error);
      return null;
    }
  }

  async predictFitnessProgression(userId) {
    try {
      const workouts = await Workout.find({ userId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(60);

      if (workouts.length < 10) {
        return { error: 'Insufficient data for fitness progression prediction' };
      }

      const trend = this.analyzeFitnessTrend(workouts);
      const projection = this.projectFitnessProgression(trend, workouts);

      return {
        userId,
        currentFitness: trend.currentLevel,
        projectedImprovement: projection.improvement,
        timeframe: projection.timeframe,
        trend: trend.direction,
        recommendations: this.generateProgressionRecommendations(trend, projection)
      };

    } catch (error) {
      console.error('Predict fitness progression error:', error);
      return null;
    }
  }

  async predictInjuryRisk(userId) {
    try {
      const workouts = await Workout.find({ userId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(30);

      const user = await User.findById(userId);

      if (workouts.length < 5) {
        return { error: 'Insufficient data for injury risk assessment' };
      }

      const riskFactors = this.analyzeInjuryRiskFactors(workouts, user);
      const overallRisk = this.calculateOverallInjuryRisk(riskFactors);

      return {
        userId,
        riskLevel: overallRisk.level,
        riskScore: overallRisk.score,
        riskFactors,
        recommendations: this.generateInjuryPreventionRecommendations(riskFactors)
      };

    } catch (error) {
      console.error('Predict injury risk error:', error);
      return null;
    }
  }

  calculateRecentPace(workouts) {
    const recent = workouts.slice(0, 10);
    return recent.reduce((sum, w) => sum + (w.averagePace || 0), 0) / recent.length;
  }

  calculateEnduranceScore(workouts) {
    const longRuns = workouts.filter(w => (w.distance || 0) > 8000);
    if (longRuns.length === 0) return 50;
    
    const avgLongRunDistance = longRuns.reduce((sum, w) => sum + w.distance, 0) / longRuns.length;
    return Math.min(100, (avgLongRunDistance / 1000) * 5); // Rough endurance scoring
  }

  calculateConsistencyScore(workouts) {
    const workoutDays = new Set(workouts.map(w => w.completedAt.toDateString()));
    const daysCovered = Math.min(30, workouts.length > 0 ? 
      Math.ceil((Date.now() - workouts[workouts.length - 1].completedAt) / (1000 * 60 * 60 * 24)) : 30);
    
    return Math.round((workoutDays.size / daysCovered) * 100);
  }

  calculateRacePrediction(distance, pace, endurance, consistency) {
    // Simple prediction model - in reality would use more sophisticated algorithms
    const basePace = pace;
    
    // Adjust for race distance
    const distanceFactors = {
      5000: 0.95,   // 5K - slightly faster than training pace
      10000: 1.05,  // 10K - slightly slower
      21097: 1.15,  // Half marathon
      42195: 1.25   // Marathon
    };
    
    const distanceFactor = distanceFactors[distance] || 1.1;
    const predictedPace = basePace * distanceFactor;
    
    // Adjust for fitness factors
    const enduranceAdjustment = (endurance - 70) * 0.001; // Small adjustment based on endurance
    const consistencyAdjustment = (consistency - 70) * 0.002; // Small adjustment based on consistency
    
    const adjustedPace = predictedPace * (1 - enduranceAdjustment - consistencyAdjustment);
    const predictedTime = (distance / 1000) * adjustedPace;
    
    // Calculate confidence based on data quality
    const confidence = Math.min(95, 60 + (consistency * 0.3) + (endurance * 0.1));
    
    return {
      time: Math.round(predictedTime),
      pace: Math.round(adjustedPace),
      confidence: Math.round(confidence)
    };
  }

  analyzeFitnessTrend(workouts) {
    if (workouts.length < 6) return { direction: 'insufficient_data', currentLevel: 50 };
    
    const recent = workouts.slice(0, 10);
    const older = workouts.slice(-10);
    
    const recentAvgPace = recent.reduce((sum, w) => sum + (w.averagePace || 0), 0) / recent.length;
    const olderAvgPace = older.reduce((sum, w) => sum + (w.averagePace || 0), 0) / older.length;
    
    const paceImprovement = ((olderAvgPace - recentAvgPace) / olderAvgPace) * 100;
    
    let direction;
    if (paceImprovement > 5) direction = 'improving';
    else if (paceImprovement < -5) direction = 'declining';
    else direction = 'stable';
    
    // Calculate current fitness level (0-100)
    const currentLevel = Math.max(20, Math.min(100, 100 - ((recentAvgPace - 300) / 3)));
    
    return { direction, currentLevel: Math.round(currentLevel), paceImprovement };
  }

  projectFitnessProgression(trend, workouts) {
    const currentPace = this.calculateRecentPace(workouts);
    const consistency = this.calculateConsistencyScore(workouts);
    
    // Project improvement over 12 weeks
    let projectedImprovement;
    if (trend.direction === 'improving') {
      projectedImprovement = Math.min(15, trend.paceImprovement * 2);
    } else if (trend.direction === 'stable') {
      projectedImprovement = consistency > 70 ? 8 : 4;
    } else {
      projectedImprovement = consistency > 70 ? 2 : -2;
    }
    
    return {
      improvement: Math.round(projectedImprovement),
      timeframe: 12, // weeks
      projectedPace: Math.round(currentPace * (1 - projectedImprovement / 100))
    };
  }

  analyzeInjuryRiskFactors(workouts, user) {
    const factors = {};
    
    // Training load analysis
    const weeklyDistances = this.calculateWeeklyDistances(workouts);
    factors.trainingLoad = this.assessTrainingLoad(weeklyDistances);
    
    // Recovery analysis
    factors.recovery = this.assessRecoveryPattern(workouts);
    
    // Progression rate
    factors.progression = this.assessProgressionRate(weeklyDistances);
    
    // Age factor
    const age = user.age || 30;
    factors.age = age > 40 ? 'elevated' : age > 50 ? 'high' : 'low';
    
    // Experience level
    factors.experience = user.runningExperience || 'beginner';
    
    return factors;
  }

  calculateWeeklyDistances(workouts) {
    const weeks = {};
    workouts.forEach(workout => {
      const weekKey = Math.floor(workout.completedAt.getTime() / (7 * 24 * 60 * 60 * 1000));
      if (!weeks[weekKey]) weeks[weekKey] = 0;
      weeks[weekKey] += workout.distance || 0;
    });
    return Object.values(weeks);
  }

  assessTrainingLoad(weeklyDistances) {
    if (weeklyDistances.length < 2) return 'unknown';
    
    const avgWeekly = weeklyDistances.reduce((s, d) => s + d, 0) / weeklyDistances.length;
    const maxWeekly = Math.max(...weeklyDistances);
    
    if (maxWeekly > avgWeekly * 1.5) return 'high';
    if (avgWeekly > 50000) return 'elevated';
    return 'normal';
  }

  assessRecoveryPattern(workouts) {
    // Simple recovery assessment based on workout frequency
    const dailyWorkouts = {};
    workouts.forEach(w => {
      const day = w.completedAt.toDateString();
      dailyWorkouts[day] = (dailyWorkouts[day] || 0) + 1;
    });
    
    const consecutiveDays = Object.values(dailyWorkouts).filter(count => count > 0).length;
    const restDays = 30 - consecutiveDays; // Assuming 30-day period
    
    if (restDays < 8) return 'insufficient';
    if (restDays < 15) return 'adequate';
    return 'good';
  }

  assessProgressionRate(weeklyDistances) {
    if (weeklyDistances.length < 3) return 'unknown';
    
    const increases = [];
    for (let i = 1; i < weeklyDistances.length; i++) {
      const increase = (weeklyDistances[i] - weeklyDistances[i-1]) / weeklyDistances[i-1];
      increases.push(increase);
    }
    
    const avgIncrease = increases.reduce((s, i) => s + i, 0) / increases.length;
    
    if (avgIncrease > 0.15) return 'too_fast';
    if (avgIncrease > 0.1) return 'aggressive';
    return 'appropriate';
  }

  calculateOverallInjuryRisk(factors) {
    let score = 0;
    
    // Training load risk
    if (factors.trainingLoad === 'high') score += 30;
    else if (factors.trainingLoad === 'elevated') score += 15;
    
    // Recovery risk
    if (factors.recovery === 'insufficient') score += 25;
    else if (factors.recovery === 'adequate') score += 10;
    
    // Progression risk
    if (factors.progression === 'too_fast') score += 20;
    else if (factors.progression === 'aggressive') score += 10;
    
    // Age risk
    if (factors.age === 'high') score += 15;
    else if (factors.age === 'elevated') score += 8;
    
    // Experience risk
    if (factors.experience === 'beginner') score += 10;
    
    let level;
    if (score >= 60) level = 'high';
    else if (score >= 30) level = 'moderate';
    else level = 'low';
    
    return { score, level };
  }

  generatePerformanceRecommendations(prediction, workouts) {
    const recommendations = [];
    
    if (prediction.confidence < 75) {
      recommendations.push({
        type: 'data',
        message: 'Increase workout consistency for more accurate predictions'
      });
    }
    
    if (workouts.filter(w => (w.distance || 0) > 10000).length < 3) {
      recommendations.push({
        type: 'endurance',
        message: 'Include more long runs to improve race performance'
      });
    }
    
    return recommendations;
  }

  generateProgressionRecommendations(trend, projection) {
    const recommendations = [];
    
    if (trend.direction === 'declining') {
      recommendations.push({
        type: 'recovery',
        message: 'Consider adding more rest days and focusing on easy runs'
      });
    }
    
    if (projection.improvement < 5) {
      recommendations.push({
        type: 'variety',
        message: 'Add interval training and tempo runs to boost improvement'
      });
    }
    
    return recommendations;
  }

  generateInjuryPreventionRecommendations(factors) {
    const recommendations = [];
    
    if (factors.trainingLoad === 'high') {
      recommendations.push({
        type: 'volume',
        message: 'Reduce weekly training volume by 20-30%',
        priority: 'high'
      });
    }
    
    if (factors.recovery === 'insufficient') {
      recommendations.push({
        type: 'recovery',
        message: 'Add at least 2 complete rest days per week',
        priority: 'high'
      });
    }
    
    if (factors.progression === 'too_fast') {
      recommendations.push({
        type: 'progression',
        message: 'Limit weekly mileage increases to 10% or less',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }
}

export default new PerformancePredictionService();