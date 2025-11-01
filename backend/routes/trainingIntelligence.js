// backend/routes/trainingIntelligence.js
import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import progressTrackingService from '../services/progressTrackingService.js';
import goalBasedAdaptationService from '../services/goalBasedAdaptationService.js';
import performancePredictionService from '../services/performancePredictionService.js';
import trainingPlanGenerator from '../services/trainingPlanGenerator.js';

const router = express.Router();

// All training intelligence routes require authentication
router.use(authenticateToken);

// ========================================
// PROGRESS TRACKING ENDPOINTS
// ========================================

// GET /api/training-intelligence/progress/daily/:date - Get daily progress for specific date
router.get('/progress/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    console.log(`📅 Getting daily progress for user ${req.user.userId} on ${date}`);

    // Get workouts for the specific date
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { Workout } = await import('../models/mongodb/index.js');
    const dayWorkouts = await Workout.find({
      userId: req.user.userId,
      createdAt: {
        $gte: dayStart,
        $lt: dayEnd
      },
      status: 'completed'
    });

    // Calculate daily metrics
    const dailyMetrics = progressTrackingService.calculateDailyMetrics(dayWorkouts);

    // Get planned vs actual comparison
    const { PlannedWorkout } = await import('../models/mongodb/index.js');
    const plannedWorkouts = await PlannedWorkout.find({
      userId: req.user.userId,
      scheduledDate: {
        $gte: dayStart,
        $lt: dayEnd
      }
    });

    res.json({
      success: true,
      date: targetDate,
      metrics: dailyMetrics,
      workouts: {
        completed: dayWorkouts.length,
        planned: plannedWorkouts.length,
        adherence: plannedWorkouts.length > 0 ? 
          (dayWorkouts.length / plannedWorkouts.length) * 100 : 100
      },
      details: {
        completedWorkouts: dayWorkouts.map(w => ({
          id: w._id,
          type: w.type || 'running',
          distance: w.totalDistance,
          duration: w.duration,
          pace: w.averagePace,
          calories: w.caloriesBurned
        })),
        plannedWorkouts: plannedWorkouts.map(w => ({
          id: w._id,
          name: w.name,
          type: w.type,
          status: w.status,
          targetDistance: w.targetMetrics?.totalDistance
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error getting daily progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily progress',
      error: error.message
    });
  }
});

// GET /api/training-intelligence/progress/weekly - Get weekly progress report
router.get('/progress/weekly', async (req, res) => {
  try {
    const { week } = req.query; // Optional: specific week, defaults to current week
    
    console.log(`📊 Generating weekly progress report for user ${req.user.userId}`);

    const weeklyReport = await progressTrackingService.generateUserWeeklyReport(req.user.userId);

    res.json({
      success: true,
      report: weeklyReport,
      generated: new Date()
    });
  } catch (error) {
    console.error('❌ Error generating weekly report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly report',
      error: error.message
    });
  }
});

// GET /api/training-intelligence/progress/streaks - Get user streaks
router.get('/progress/streaks', async (req, res) => {
  try {
    console.log(`🔥 Getting streaks for user ${req.user.userId}`);

    // Get recent workouts to calculate current streak
    const { Workout } = await import('../models/mongodb/index.js');
    const recentWorkouts = await Workout.find({
      userId: req.user.userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      status: 'completed'
    }).sort({ createdAt: -1 });

    const currentStreak = progressTrackingService.calculateCurrentStreak(recentWorkouts);
    const longestStreak = progressTrackingService.calculateLongestStreak(recentWorkouts);

    // Get user's stored streak data
    const { prisma } = await import('../config/database.js');
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastStreakUpdate: true
      }
    });

    res.json({
      success: true,
      streaks: {
        current: Math.max(currentStreak, user?.currentStreak || 0),
        longest: Math.max(longestStreak, user?.longestStreak || 0),
        lastUpdate: user?.lastStreakUpdate,
        recentActivity: recentWorkouts.length,
        milestones: {
          next: this.getNextStreakMilestone(currentStreak),
          achieved: this.getAchievedMilestones(longestStreak)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting streaks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get streaks',
      error: error.message
    });
  }
});

// ========================================
// GOAL-BASED ADAPTATION ENDPOINTS
// ========================================

// POST /api/training-intelligence/goals/assess - Assess goal progress and adaptation needs
router.post('/goals/assess', async (req, res) => {
  try {
    const { goals } = req.body;
    
    console.log(`🎯 Assessing goals for user ${req.user.userId}`);

    if (!goals || !Array.isArray(goals)) {
      return res.status(400).json({
        success: false,
        message: 'Goals array is required'
      });
    }

    const assessments = [];
    
    for (const goal of goals) {
      try {
        const assessment = await goalBasedAdaptationService.assessGoalProgress(req.user.userId, goal);
        assessments.push(assessment);
      } catch (error) {
        console.error(`❌ Error assessing goal ${goal.id}:`, error);
        assessments.push({
          goal,
          error: error.message,
          needsAdaptation: false
        });
      }
    }

    // Find goals that need adaptation
    const adaptationNeeded = assessments.filter(a => a.needsAdaptation);

    res.json({
      success: true,
      assessments,
      summary: {
        totalGoals: goals.length,
        needingAdaptation: adaptationNeeded.length,
        onTrack: assessments.filter(a => a.progressRatio >= 0.85).length,
        behindSchedule: assessments.filter(a => a.progressRatio < 0.7).length
      },
      recommendations: adaptationNeeded.length > 0 ? 
        'Consider adapting your training plan to better align with goal progress' : 
        'Your training appears well-aligned with your goals'
    });
  } catch (error) {
    console.error('❌ Error assessing goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assess goals',
      error: error.message
    });
  }
});

// POST /api/training-intelligence/goals/adapt-plan - Trigger goal-based plan adaptation
router.post('/goals/adapt-plan', async (req, res) => {
  try {
    const { goalId, adaptationType, urgency = 'medium' } = req.body;
    
    console.log(`🔄 Triggering goal-based adaptation for user ${req.user.userId}`);

    // Get active training plan
    const { TrainingPlan } = await import('../models/mongodb/index.js');
    const activePlan = await TrainingPlan.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (!activePlan) {
      return res.status(404).json({
        success: false,
        message: 'No active training plan found'
      });
    }

    // Get goal from user profile
    const { prisma } = await import('../config/database.js');
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { goals: true }
    });

    const goal = user?.goals?.find(g => g.id === goalId);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Create mock assessment for adaptation
    const assessment = {
      needsAdaptation: true,
      adaptationType: adaptationType || 'focus',
      urgency,
      reason: 'Manual adaptation triggered via API'
    };

    // Trigger adaptation
    await goalBasedAdaptationService.adaptPlanForGoal(activePlan, goal, assessment);

    res.json({
      success: true,
      message: 'Goal-based adaptation applied successfully',
      adaptation: {
        planId: activePlan._id,
        goalId: goalId,
        type: adaptationType,
        urgency: urgency,
        appliedAt: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Error applying goal-based adaptation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply goal-based adaptation',
      error: error.message
    });
  }
});

// ========================================
// PERFORMANCE PREDICTION ENDPOINTS
// ========================================

// POST /api/training-intelligence/predict/race-performance - Predict race performance
router.post('/predict/race-performance', async (req, res) => {
  try {
    const { raceDistance, targetDate } = req.body;
    
    console.log(`🎯 Predicting ${raceDistance} performance for user ${req.user.userId}`);

    if (!raceDistance) {
      return res.status(400).json({
        success: false,
        message: 'Race distance is required'
      });
    }

    const prediction = await performancePredictionService.predictRacePerformance(
      req.user.userId,
      raceDistance,
      targetDate
    );

    res.json({
      success: true,
      prediction,
      generated: new Date()
    });
  } catch (error) {
    console.error('❌ Error predicting race performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict race performance',
      error: error.message
    });
  }
});

// GET /api/training-intelligence/predict/fitness-progression - Predict fitness progression
router.get('/predict/fitness-progression', async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    
    console.log(`📈 Predicting fitness progression for user ${req.user.userId} over ${weeks} weeks`);

    const progression = await performancePredictionService.predictFitnessProgression(
      req.user.userId,
      parseInt(weeks)
    );

    res.json({
      success: true,
      progression,
      generated: new Date()
    });
  } catch (error) {
    console.error('❌ Error predicting fitness progression:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict fitness progression',
      error: error.message
    });
  }
});

// GET /api/training-intelligence/predict/injury-risk - Predict injury risk
router.get('/predict/injury-risk', async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    
    console.log(`⚠️ Predicting injury risk for user ${req.user.userId} over ${timeframe} days`);

    const riskAssessment = await performancePredictionService.predictInjuryRisk(
      req.user.userId,
      parseInt(timeframe)
    );

    res.json({
      success: true,
      riskAssessment,
      generated: new Date()
    });
  } catch (error) {
    console.error('❌ Error predicting injury risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict injury risk',
      error: error.message
    });
  }
});

// POST /api/training-intelligence/predict/adaptation-response - Predict adaptation response
router.post('/predict/adaptation-response', async (req, res) => {
  try {
    const { adaptation } = req.body;
    
    console.log(`🔄 Predicting adaptation response for user ${req.user.userId}`);

    if (!adaptation) {
      return res.status(400).json({
        success: false,
        message: 'Adaptation details are required'
      });
    }

    const response = await performancePredictionService.predictAdaptationResponse(
      req.user.userId,
      adaptation
    );

    res.json({
      success: true,
      response,
      generated: new Date()
    });
  } catch (error) {
    console.error('❌ Error predicting adaptation response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict adaptation response',
      error: error.message
    });
  }
});

// ========================================
// SMART TRAINING PLAN GENERATION
// ========================================

// POST /api/training-intelligence/generate/smart-plan - Generate AI-enhanced training plan
router.post('/generate/smart-plan', async (req, res) => {
  try {
    const planConfig = req.body;
    
    console.log(`🤖 Generating smart training plan for user ${req.user.userId}`);

    // Enhanced plan configuration with AI features
    const enhancedConfig = {
      ...planConfig,
      aiEnhanced: true,
      intelligenceFeatures: {
        progressTracking: true,
        goalAdaptation: true,
        injuryPrevention: true,
        performancePrediction: true
      }
    };

    const plan = await trainingPlanGenerator.generateAdvancedTrainingPlan(
      req.user.userId,
      enhancedConfig
    );

    res.json({
      success: true,
      message: 'Smart training plan generated successfully',
      plan: {
        id: plan._id,
        name: plan.name,
        description: plan.description,
        duration: plan.duration,
        aiFeatures: plan.aiFeatures,
        adaptationEnabled: plan.adaptationEnabled,
        intelligenceFeatures: enhancedConfig.intelligenceFeatures
      }
    });
  } catch (error) {
    console.error('❌ Error generating smart training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate smart training plan',
      error: error.message
    });
  }
});

// GET /api/training-intelligence/insights/dashboard - Get training intelligence dashboard
router.get('/insights/dashboard', async (req, res) => {
  try {
    console.log(`📊 Generating training intelligence dashboard for user ${req.user.userId}`);

    // Get various insights in parallel
    const [
      weeklyReport,
      currentFitness,
      injuryRisk,
      activePlan
    ] = await Promise.all([
      progressTrackingService.generateUserWeeklyReport(req.user.userId).catch(() => null),
      performancePredictionService.estimateCurrentFitness(req.user.userId).catch(() => null),
      performancePredictionService.predictInjuryRisk(req.user.userId, 14).catch(() => null),
      (async () => {
        const { TrainingPlan } = await import('../models/mongodb/index.js');
        return TrainingPlan.findOne({ userId: req.user.userId, status: 'active' });
      })().catch(() => null)
    ]);

    // Get recent workouts
    const { Workout } = await import('../models/mongodb/index.js');
    const recentWorkouts = await Workout.find({
      userId: req.user.userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: 'completed'
    }).sort({ createdAt: -1 });

    const dashboard = {
      overview: {
        currentFitness: currentFitness?.level || 0.5,
        fitnessConfidence: currentFitness?.confidence || 0.5,
        weeklyWorkouts: recentWorkouts.length,
        injuryRisk: injuryRisk?.overallRisk?.level || 'unknown'
      },
      progress: {
        thisWeek: weeklyReport?.metrics || {},
        improvements: weeklyReport?.improvements || {},
        streakDays: 0 // Would be calculated
      },
      predictions: {
        fitnessLevel: currentFitness?.level || 0.5,
        injuryRisk: injuryRisk?.overallRisk?.score || 0,
        riskFactors: injuryRisk?.riskFactors || {}
      },
      activePlan: activePlan ? {
        id: activePlan._id,
        name: activePlan.name,
        progress: activePlan.stats?.progressPercentage || 0,
        currentWeek: activePlan.stats?.currentWeek || 1,
        totalWeeks: activePlan.duration,
        adaptationEnabled: activePlan.adaptationEnabled
      } : null,
      recommendations: [
        ...(weeklyReport?.recommendations || []),
        ...(injuryRisk?.recommendations || [])
      ].slice(0, 5) // Top 5 recommendations
    };

    res.json({
      success: true,
      dashboard,
      generated: new Date()
    });
  } catch (error) {
    console.error('❌ Error generating training intelligence dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard',
      error: error.message
    });
  }
});

// Helper method to get next streak milestone
function getNextStreakMilestone(currentStreak) {
  const milestones = [7, 14, 21, 30, 50, 100, 200, 365];
  return milestones.find(m => m > currentStreak) || currentStreak + 50;
}

// Helper method to get achieved milestones
function getAchievedMilestones(longestStreak) {
  const milestones = [7, 14, 21, 30, 50, 100, 200, 365];
  return milestones.filter(m => m <= longestStreak);
}

export default router;