// backend/routes/trainingPlans.js
import express from 'express';
import { TrainingPlan, PlannedWorkout, Workout } from '../models/mongodb/index.js';
import trainingPlanGenerator from '../services/trainingPlanGenerator.js';
import weeklyPlanGenerator from '../services/weeklyPlanGenerator.js';

console.log('✅ TrainingPlans routes module loaded');
import authenticateToken from '../middleware/authMiddleware.js';
import { 
  checkTrainingPlanLimit, 
  checkDataRetentionAccess, 
  addUsageInfo,
  requirePremium,
  getSubscriptionStatus
} from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// All training plan routes require authentication
router.use(authenticateToken);

/**
 * Get previous week's workout data for AI-enhanced planning
 */
async function getPreviousWeekWorkoutData(userId) {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Get workouts from previous week (7-14 days ago)
    const previousWeekWorkouts = await Workout.find({
      userId: userId,
      completedAt: {
        $gte: twoWeeksAgo,
        $lt: oneWeekAgo
      },
      status: 'completed'
    }).sort({ completedAt: 1 });

    // Calculate summary metrics
    const summary = {
      workoutCount: previousWeekWorkouts.length,
      weeklyDistance: previousWeekWorkouts.reduce((sum, w) => sum + (w.totalDistance || 0), 0) / 1000, // Convert to km
      totalDuration: previousWeekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      averagePace: previousWeekWorkouts.length > 0 
        ? previousWeekWorkouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / previousWeekWorkouts.length 
        : 0,
      longestRun: Math.max(...previousWeekWorkouts.map(w => w.totalDistance || 0), 0) / 1000, // Convert to km
      workoutTypes: [...new Set(previousWeekWorkouts.map(w => w.type || 'running'))],
      averageHeartRate: previousWeekWorkouts.length > 0 
        ? previousWeekWorkouts.reduce((sum, w) => sum + (w.averageHeartRate || 0), 0) / previousWeekWorkouts.length 
        : 0,
      caloriesBurned: previousWeekWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
      trainingLoad: calculateTrainingLoad(previousWeekWorkouts),
      completionRate: await calculateCompletionRate(userId, twoWeeksAgo, oneWeekAgo),
      recoveryMetrics: calculateRecoveryMetrics(previousWeekWorkouts)
    };

    // Analyze performance trends
    const performanceAnalysis = {
      paceConsistency: calculatePaceConsistency(previousWeekWorkouts),
      intensityDistribution: calculateIntensityDistribution(previousWeekWorkouts),
      recommendedAdjustments: generateTrainingAdjustments(summary)
    };

    return {
      summary,
      workouts: previousWeekWorkouts.map(w => ({
        date: w.completedAt,
        type: w.type || 'running',
        distance: w.totalDistance / 1000,
        duration: w.duration,
        pace: w.averagePace,
        heartRate: w.averageHeartRate,
        effort: w.perceivedEffort
      })),
      performanceAnalysis,
      aiInsights: generateAIInsights(summary, performanceAnalysis)
    };
  } catch (error) {
    console.error('Error getting previous week data:', error);
    return {
      summary: {
        workoutCount: 0,
        weeklyDistance: 0,
        longestRun: 0,
        averagePace: 0
      },
      workouts: [],
      performanceAnalysis: {},
      aiInsights: ['No previous week data available - using default planning parameters']
    };
  }
}

/**
 * Calculate training load based on workouts
 */
function calculateTrainingLoad(workouts) {
  return workouts.reduce((load, workout) => {
    const duration = workout.duration || 0; // in minutes
    const intensity = getIntensityMultiplier(workout.perceivedEffort || 5);
    return load + (duration * intensity);
  }, 0);
}

/**
 * Get intensity multiplier based on perceived effort
 */
function getIntensityMultiplier(effort) {
  const multipliers = {
    1: 0.5, 2: 0.6, 3: 0.7, 4: 0.8, 5: 1.0,
    6: 1.2, 7: 1.4, 8: 1.6, 9: 1.8, 10: 2.0
  };
  return multipliers[effort] || 1.0;
}

/**
 * Calculate completion rate for planned vs completed workouts
 */
async function calculateCompletionRate(userId, startDate, endDate) {
  try {
    const plannedWorkouts = await PlannedWorkout.countDocuments({
      userId: userId,
      scheduledDate: { $gte: startDate, $lt: endDate }
    });
    
    const completedWorkouts = await Workout.countDocuments({
      userId: userId,
      completedAt: { $gte: startDate, $lt: endDate },
      status: 'completed'
    });

    return plannedWorkouts > 0 ? (completedWorkouts / plannedWorkouts) * 100 : 100;
  } catch (error) {
    return 100; // Default to 100% if can't calculate
  }
}

/**
 * Calculate recovery metrics
 */
function calculateRecoveryMetrics(workouts) {
  const restDays = calculateRestDays(workouts);
  const averageEffort = workouts.length > 0 
    ? workouts.reduce((sum, w) => sum + (w.perceivedEffort || 5), 0) / workouts.length 
    : 5;

  return {
    restDaysCount: restDays,
    averageEffort: averageEffort,
    recoveryScore: calculateRecoveryScore(restDays, averageEffort)
  };
}

/**
 * Calculate rest days between workouts
 */
function calculateRestDays(workouts) {
  if (workouts.length < 2) return 0;

  const sortedWorkouts = workouts.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  let totalRestDays = 0;

  for (let i = 1; i < sortedWorkouts.length; i++) {
    const daysBetween = Math.floor((new Date(sortedWorkouts[i].completedAt) - new Date(sortedWorkouts[i-1].completedAt)) / (1000 * 60 * 60 * 24));
    totalRestDays += Math.max(0, daysBetween - 1);
  }

  return totalRestDays;
}

/**
 * Calculate recovery score (0-100)
 */
function calculateRecoveryScore(restDays, averageEffort) {
  const restScore = Math.min(restDays * 10, 50); // Max 50 points for rest
  const effortScore = Math.max(0, 50 - (averageEffort - 5) * 10); // Lower effort = higher score
  return Math.min(100, restScore + effortScore);
}

/**
 * Calculate pace consistency
 */
function calculatePaceConsistency(workouts) {
  const paces = workouts.map(w => w.averagePace).filter(p => p > 0);
  if (paces.length < 2) return 100;

  const avgPace = paces.reduce((a, b) => a + b, 0) / paces.length;
  const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - avgPace, 2), 0) / paces.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to percentage (lower deviation = higher consistency)
  return Math.max(0, 100 - (standardDeviation / avgPace) * 100);
}

/**
 * Calculate intensity distribution
 */
function calculateIntensityDistribution(workouts) {
  const efforts = workouts.map(w => w.perceivedEffort || 5);
  const distribution = { easy: 0, moderate: 0, hard: 0 };

  efforts.forEach(effort => {
    if (effort <= 4) distribution.easy++;
    else if (effort <= 7) distribution.moderate++;
    else distribution.hard++;
  });

  const total = efforts.length || 1;
  return {
    easy: (distribution.easy / total) * 100,
    moderate: (distribution.moderate / total) * 100,
    hard: (distribution.hard / total) * 100
  };
}

/**
 * Generate training adjustments based on previous week
 */
function generateTrainingAdjustments(summary) {
  const adjustments = [];

  if (summary.workoutCount < 3) {
    adjustments.push('increase_frequency');
  } else if (summary.workoutCount > 6) {
    adjustments.push('add_recovery');
  }

  if (summary.weeklyDistance < 10) {
    adjustments.push('build_base');
  } else if (summary.weeklyDistance > 50) {
    adjustments.push('monitor_overtraining');
  }

  return adjustments;
}

/**
 * Generate AI insights based on previous week data
 */
function generateAIInsights(summary, performanceAnalysis) {
  const insights = [];

  if (summary.workoutCount === 0) {
    insights.push('Starting fresh - will create beginner-friendly plan with gradual progression');
  } else {
    insights.push(`Based on ${summary.workoutCount} workouts last week, adjusting training load accordingly`);
    
    if (summary.weeklyDistance > 0) {
      insights.push(`Previous weekly distance: ${summary.weeklyDistance.toFixed(1)}km - using as baseline for progression`);
    }

    if (performanceAnalysis.paceConsistency > 80) {
      insights.push('Good pace consistency detected - can include varied intensity training');
    } else if (performanceAnalysis.paceConsistency < 60) {
      insights.push('Pace variability noted - will focus on building consistent aerobic base');
    }

    if (performanceAnalysis.intensityDistribution.hard > 30) {
      insights.push('High intensity detected - adding more recovery and easy runs');
    } else if (performanceAnalysis.intensityDistribution.easy > 80) {
      insights.push('Good aerobic base training - ready for some intensity progression');
    }
  }

  return insights;
}

// POST /api/training-plans/generate - Generate AI-powered training plan
router.post('/generate', checkTrainingPlanLimit, addUsageInfo, async (req, res) => {
  try {
    console.log('🎯 Generating AI-powered training plan for user:', req.user.userId);
    
    const {
      targetRace,
      fitnessLevel,
      currentWeeklyMileage,
      longestRecentRun,
      preferredTrainingDays,
      timeGoal,
      age,
      restingHeartRate,
      maxHeartRate,
      injuryHistory,
      availableTime,
      experience,
      preferredIntensity
    } = req.body;

    // Validate required fields
    if (!targetRace || !targetRace.distance || !targetRace.date) {
      return res.status(400).json({
        success: false,
        message: 'Target race distance and date are required'
      });
    }

    if (!fitnessLevel) {
      return res.status(400).json({
        success: false,
        message: 'Fitness level is required'
      });
    }

    // Get previous week's workout data for enhanced AI planning
    const previousWeekData = await getPreviousWeekWorkoutData(req.user.userId);
    console.log('📊 Previous week data:', previousWeekData.summary);

    // Enhanced plan generation with AI considerations and previous week data
    const plan = await trainingPlanGenerator.generateAdvancedTrainingPlan(req.user.userId, {
      targetRace,
      fitnessLevel,
      currentWeeklyMileage: currentWeeklyMileage || previousWeekData.summary.weeklyDistance || 10,
      longestRecentRun: longestRecentRun || previousWeekData.summary.longestRun,
      preferredTrainingDays,
      timeGoal,
      age,
      restingHeartRate,
      maxHeartRate,
      injuryHistory: injuryHistory || [],
      availableTime: availableTime || 'moderate',
      experience: experience || 'beginner',
      preferredIntensity: preferredIntensity || 'moderate',
      // Enhanced AI features using previous week data
      previousWeekData: previousWeekData
    });

    console.log('✅ AI-enhanced training plan generated:', plan._id);

    res.status(201).json({
      success: true,
      message: 'AI-powered training plan generated successfully',
      plan: {
        id: plan._id,
        name: plan.name,
        description: plan.description,
        targetRace: plan.targetRace,
        duration: plan.duration,
        startDate: plan.startDate,
        endDate: plan.endDate,
        status: plan.status,
        phases: plan.phases,
        aiFeatures: plan.aiFeatures,
        adaptationEnabled: plan.adaptationEnabled,
        previousWeekInsights: plan.previousWeekInsights || []
      },
      previousWeekAnalysis: previousWeekData ? {
        workoutsAnalyzed: previousWeekData.summary.workoutCount,
        weeklyDistance: previousWeekData.summary.weeklyDistance,
        trainingLoad: previousWeekData.summary.trainingLoad,
        completionRate: previousWeekData.summary.completionRate,
        aiInsights: previousWeekData.aiInsights
      } : null
    });
  } catch (error) {
    console.error('❌ Error generating training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate training plan',
      error: error.message
    });
  }
});

// PUT /api/training-plans/:id/adapt - Adaptive plan modification
router.put('/:id/adapt', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      performanceData, 
      feedbackType, 
      adjustmentReason,
      userFeedback 
    } = req.body;
    
    console.log(`🔄 Adapting training plan ${id} based on performance data`);
    
    // Verify plan ownership
    const plan = await TrainingPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Training plan not found'
      });
    }

    if (!plan.adaptationEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Plan adaptation is not enabled for this plan'
      });
    }

    // Perform AI-powered adaptation
    const adaptationResult = await trainingPlanGenerator.adaptTrainingPlan(
      plan,
      performanceData,
      feedbackType,
      adjustmentReason,
      userFeedback
    );

    console.log('✅ Training plan adapted successfully');

    res.json({
      success: true,
      message: 'Training plan adapted successfully',
      adaptations: adaptationResult.changes,
      nextWorkouts: adaptationResult.upcomingWorkouts,
      reasoning: adaptationResult.reasoning
    });
  } catch (error) {
    console.error('❌ Error adapting training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adapt training plan',
      error: error.message
    });
  }
});

// GET /api/training-plans/templates - Get training plan templates
router.get('/templates', async (req, res) => {
  try {
    const { 
      distance = 'all', 
      level = 'all', 
      duration = 'all' 
    } = req.query;
    
    console.log('📋 Getting training plan templates');
    
    const templates = await trainingPlanGenerator.getTrainingPlanTemplates({
      distance,
      level,
      duration
    });

    res.json({
      success: true,
      templates,
      total: templates.length
    });
  } catch (error) {
    console.error('❌ Error getting training plan templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training plan templates',
      error: error.message
    });
  }
});

// POST /api/training-plans/:id/analyze - Analyze plan effectiveness
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Analyzing training plan effectiveness for ${id}`);
    
    // Verify plan ownership
    const plan = await TrainingPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Training plan not found'
      });
    }

    const analysis = await trainingPlanGenerator.analyzePlanEffectiveness(plan);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ Error analyzing training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze training plan',
      error: error.message
    });
  }
});

// GET /api/training-plans - Get training plans (with data retention filtering)
router.get('/', checkDataRetentionAccess, addUsageInfo, async (req, res) => {
  try {
    const { 
      difficulty = 'all', 
      targetType = 'all', 
      enrolled = false,
      limit = 20, 
      offset = 0 
    } = req.query;
    
    console.log(`📋 Getting training plans (enrolled: ${enrolled})`);
    
    // For now, return static training plans data that matches our frontend interface
    // In a real implementation, this would query a TrainingPlan collection
    const staticPlans = [
      {
        id: 'plan-1',
        name: 'Iesācēju 5K plāns',
        description: 'Perfekts plāns tiem, kas sāk skriet un vēlas piedalīties 5K sacensībās',
        difficulty: 'beginner',
        duration: 8, // weeks
        workoutsPerWeek: 3,
        targetType: 'distance',
        goal: 'Pabeidz savu pirmo 5K skrējienu bez apstāšanās',
        createdBy: {
          id: 'coach-1',
          firstName: 'Līga',
          lastName: 'Ozoliņa',
          role: 'coach'
        },
        weeks: [
          {
            weekNumber: 1,
            description: 'Iepazīšanās ar skriešanu un ritmu',
            workouts: [
              {
                id: 'workout-1-1',
                dayOfWeek: 1,
                name: 'Viegls skrējiens',
                type: 'running',
                duration: 20,
                intensity: 'easy',
                description: 'Viegls 20 min skrējiens ar iespējamām pauzēm staigāšanai'
              },
              {
                id: 'workout-1-2',
                dayOfWeek: 3,
                name: 'Intervālu treniņš',
                type: 'running',
                duration: 25,
                intensity: 'moderate',
                description: '5x1 min skriešana ar 2 min staigāšanas pauzēm'
              },
              {
                id: 'workout-1-3',
                dayOfWeek: 5,
                name: 'Garais skrējiens',
                type: 'running',
                duration: 25,
                intensity: 'easy',
                description: 'Nepārtraukts 25 min skrējiens vieglā tempā'
              }
            ]
          }
        ],
        isActive: true,
        enrolledCount: 156,
        rating: 4.8,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      },
      {
        id: 'plan-2',
        name: '10K uzlabošanas plāns',
        description: 'Vidēja līmeņa plāns 10K laika uzlabošanai',
        difficulty: 'intermediate',
        duration: 12,
        workoutsPerWeek: 4,
        targetType: 'time',
        goal: 'Uzlabo savu 10K laiku par 2-3 minūtēm',
        createdBy: {
          id: 'coach-2',
          firstName: 'Jānis',
          lastName: 'Bērziņš',
          role: 'coach'
        },
        weeks: [
          {
            weekNumber: 1,
            description: 'Izturības celšana un ātruma darbs',
            workouts: [
              {
                id: 'workout-2-1',
                dayOfWeek: 1,
                name: 'Viegls skrējiens',
                type: 'running',
                duration: 35,
                intensity: 'easy',
                description: '35 min viegls skrējiens aerobā zonā'
              },
              {
                id: 'workout-2-2',
                dayOfWeek: 3,
                name: 'Tempa treniņš',
                type: 'running',
                duration: 40,
                intensity: 'hard',
                description: '3x8 min tempā skrējiens ar 3 min atpūtu'
              },
              {
                id: 'workout-2-3',
                dayOfWeek: 5,
                name: 'Intervāli',
                type: 'running',
                duration: 45,
                intensity: 'interval',
                description: '6x800m ar 400m jogging atpūtu'
              },
              {
                id: 'workout-2-4',
                dayOfWeek: 0,
                name: 'Garais skrējiens',
                type: 'running',
                duration: 60,
                intensity: 'easy',
                description: '60 min nepārtraukts skrējiens vieglā tempā'
              }
            ]
          }
        ],
        isActive: true,
        enrolledCount: 89,
        rating: 4.6,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z'
      }
    ];

    // Apply filters
    let filteredPlans = staticPlans;
    
    if (difficulty !== 'all') {
      filteredPlans = filteredPlans.filter(plan => plan.difficulty === difficulty);
    }
    
    if (targetType !== 'all') {
      filteredPlans = filteredPlans.filter(plan => plan.targetType === targetType);
    }

    // Mock enrollments for current user
    const mockEnrollments = enrolled ? [
      {
        planId: 'plan-1',
        currentWeek: 3,
        startDate: '2024-01-01T00:00:00Z',
        completedWorkouts: ['workout-1-1', 'workout-1-2'],
        isActive: true
      }
    ] : [];

    if (enrolled) {
      const enrolledPlanIds = mockEnrollments.map(e => e.planId);
      filteredPlans = filteredPlans.filter(plan => enrolledPlanIds.includes(plan.id));
    }

    console.log(`✅ Found ${filteredPlans.length} training plans`);

    res.json({
      plans: filteredPlans,
      enrollments: mockEnrollments,
      total: filteredPlans.length
    });
  } catch (error) {
    console.error('❌ Error getting training plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training plans',
      error: error.message
    });
  }
});

// GET /api/training-plans/upcoming - Get upcoming workouts from active training plan
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    console.log(`📅 Getting upcoming workouts for user ${req.user.userId}`);
    
    // Find active training plan
    const activePlan = await TrainingPlan.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (!activePlan) {
      return res.json({
        success: true,
        workouts: [],
        message: 'No active training plan found'
      });
    }

    // Get upcoming workouts (next few days)
    const upcomingWorkouts = await PlannedWorkout.find({
      trainingPlanId: activePlan._id,
      scheduledDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Next 14 days
      },
      status: 'scheduled'
    })
    .sort({ scheduledDate: 1 })
    .limit(parseInt(limit));

    console.log(`✅ Found ${upcomingWorkouts.length} upcoming workouts`);

    res.json({
      success: true,
      workouts: upcomingWorkouts.map(workout => ({
        id: workout._id,
        name: workout.name,
        type: workout.type,
        scheduledDate: workout.scheduledDate,
        description: workout.description,
        duration: workout.targetMetrics?.duration || null,
        distance: workout.targetMetrics?.distance || null,
        intensity: workout.targetMetrics?.intensity || 'moderate',
        planName: activePlan.name
      })),
      planName: activePlan.name,
      total: upcomingWorkouts.length
    });
  } catch (error) {
    console.error('❌ Error getting upcoming workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming workouts',
      error: error.message
    });
  }
});

// GET /api/training-plans/active - Get active training plan
router.get('/active', addUsageInfo, async (req, res) => {
  try {
    console.log(`🏃 Getting active training plan for user ${req.user.userId}`);
    
    const activePlan = await TrainingPlan.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (!activePlan) {
      return res.json({
        success: true,
        plan: null,
        message: 'No active training plan found'
      });
    }

    // Get upcoming workouts (next 7 days)
    const upcomingWorkouts = await PlannedWorkout.find({
      trainingPlanId: activePlan._id,
      scheduledDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      status: 'scheduled'
    }).sort({ scheduledDate: 1 });

    console.log(`✅ Found active plan with ${upcomingWorkouts.length} upcoming workouts`);

    res.json({
      success: true,
      plan: {
        id: activePlan._id,
        name: activePlan.name,
        description: activePlan.description,
        targetRace: activePlan.targetRace,
        duration: activePlan.duration,
        startDate: activePlan.startDate,
        endDate: activePlan.endDate,
        status: activePlan.status,
        phases: activePlan.phases,
        stats: activePlan.stats,
        userProfile: activePlan.userProfile,
        upcomingWorkouts: upcomingWorkouts.map(workout => ({
          id: workout._id,
          scheduledDate: workout.scheduledDate,
          type: workout.type,
          name: workout.name,
          description: workout.description,
          targetMetrics: workout.targetMetrics
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error getting active training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active training plan',
      error: error.message
    });
  }
});

// GET /api/training-plans/:id - Get specific training plan
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 Getting training plan details for ${id}`);
    
    const plan = await TrainingPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Training plan not found'
      });
    }

    // Get workout count by status
    const workoutStats = await PlannedWorkout.aggregate([
      { $match: { trainingPlanId: plan._id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    console.log('✅ Found training plan with workout stats');

    res.json({
      success: true,
      plan: {
        id: plan._id,
        name: plan.name,
        description: plan.description,
        targetRace: plan.targetRace,
        userProfile: plan.userProfile,
        duration: plan.duration,
        startDate: plan.startDate,
        endDate: plan.endDate,
        status: plan.status,
        phases: plan.phases,
        stats: plan.stats,
        adaptationEnabled: plan.adaptationEnabled,
        workoutStats: workoutStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error getting training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training plan',
      error: error.message
    });
  }
});

// PUT /api/training-plans/:id/activate - Activate a training plan
router.put('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🚀 Activating training plan ${id}`);
    
    // Deactivate any currently active plans
    await TrainingPlan.updateMany(
      { userId: req.user.userId, status: 'active' },
      { status: 'paused' }
    );

    // Activate the selected plan
    const plan = await TrainingPlan.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { status: 'active' },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Training plan not found'
      });
    }

    console.log('✅ Training plan activated');

    res.json({
      success: true,
      message: 'Training plan activated successfully',
      plan: {
        id: plan._id,
        name: plan.name,
        status: plan.status
      }
    });
  } catch (error) {
    console.error('❌ Error activating training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate training plan',
      error: error.message
    });
  }
});

// GET /api/training-plans/:id/workouts - Get workouts for a training plan
router.get('/:id/workouts', async (req, res) => {
  try {
    const { id } = req.params;
    const { week, status, limit = 50, offset = 0 } = req.query;
    
    console.log(`📅 Getting workouts for training plan ${id}`);
    
    // Verify plan ownership
    const plan = await TrainingPlan.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Training plan not found'
      });
    }

    // Build query
    const query = { trainingPlanId: id };
    if (week) {
      query.week = parseInt(week);
    }
    if (status) {
      query.status = status;
    }

    const workouts = await PlannedWorkout.find(query)
      .sort({ scheduledDate: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await PlannedWorkout.countDocuments(query);

    console.log(`✅ Found ${workouts.length} workouts`);

    res.json({
      success: true,
      workouts: workouts.map(workout => ({
        id: workout._id,
        scheduledDate: workout.scheduledDate,
        week: workout.week,
        dayOfWeek: workout.dayOfWeek,
        type: workout.type,
        name: workout.name,
        description: workout.description,
        mainSet: workout.mainSet,
        targetMetrics: workout.targetMetrics,
        status: workout.status,
        completedWorkoutId: workout.completedWorkoutId,
        completionMetrics: workout.completionMetrics
      })),
      total,
      hasMore: offset + workouts.length < total
    });
  } catch (error) {
    console.error('❌ Error getting plan workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get plan workouts',
      error: error.message
    });
  }
});

// PUT /api/training-plans/:planId/workouts/:workoutId/complete - Mark planned workout as completed
router.put('/:planId/workouts/:workoutId/complete', async (req, res) => {
  try {
    const { planId, workoutId } = req.params;
    const { completedWorkoutId, actualMetrics } = req.body;
    
    console.log(`✅ Marking planned workout ${workoutId} as completed`);
    
    // Verify plan ownership
    const plan = await TrainingPlan.findOne({
      _id: planId,
      userId: req.user.id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Training plan not found'
      });
    }

    // Update planned workout
    const plannedWorkout = await PlannedWorkout.findOneAndUpdate(
      { _id: workoutId, trainingPlanId: planId },
      {
        status: 'completed',
        completedWorkoutId,
        completionMetrics: actualMetrics,
        'completionMetrics.completionDate': new Date()
      },
      { new: true }
    );

    if (!plannedWorkout) {
      return res.status(404).json({
        success: false,
        message: 'Planned workout not found'
      });
    }

    // Update plan statistics
    await TrainingPlan.findByIdAndUpdate(planId, {
      $inc: { 'stats.completedWorkouts': 1 },
      $set: { 
        'stats.completionRate': (plan.stats.completedWorkouts + 1) / plan.stats.totalWorkouts 
      }
    });

    console.log('✅ Planned workout marked as completed');

    res.json({
      success: true,
      message: 'Workout marked as completed',
      workout: plannedWorkout
    });
  } catch (error) {
    console.error('❌ Error completing planned workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete planned workout',
      error: error.message
    });
  }
});

// POST /api/training-plans/:id/enroll - Enroll in a training plan
router.post('/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Enrolling user ${req.user.userId} in training plan ${id}`);
    
    // For now, just return success
    // In a real implementation, this would create an enrollment record
    res.json({
      success: true,
      message: 'Successfully enrolled in training plan',
      enrollment: {
        planId: id,
        userId: req.user.userId,
        currentWeek: 1,
        startDate: new Date().toISOString(),
        isActive: true,
        completedWorkouts: []
      }
    });
  } catch (error) {
    console.error('❌ Error enrolling in training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in training plan',
      error: error.message
    });
  }
});

// DELETE /api/training-plans/:id/unenroll - Unenroll from a training plan
router.delete('/:id/unenroll', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🚫 Unenrolling user ${req.user.userId} from training plan ${id}`);
    
    // For now, just return success
    // In a real implementation, this would delete/deactivate the enrollment record
    res.json({
      success: true,
      message: 'Successfully unenrolled from training plan'
    });
  } catch (error) {
    console.error('❌ Error unenrolling from training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unenroll from training plan',
      error: error.message
    });
  }
});

// DELETE /api/training-plans/:id - Delete a training plan
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting training plan ${id}`);
    
    // Delete the plan and all associated workouts
    const [plan, workouts] = await Promise.all([
      TrainingPlan.findOneAndDelete({ _id: id, userId: req.user.userId }),
      PlannedWorkout.deleteMany({ trainingPlanId: id })
    ]);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Training plan not found'
      });
    }

    console.log(`✅ Deleted training plan and ${workouts.deletedCount} workouts`);

    res.json({
      success: true,
      message: 'Training plan deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting training plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete training plan',
      error: error.message
    });
  }
});

// POST /api/training-plans/weekly/generate - Generate weekly training plan
router.post('/weekly/generate', async (req, res) => {
  try {
    console.log('📅 Generating weekly training plan for user:', req.user.userId);
    
    const { userPreferences = {} } = req.body;
    
    // Generate weekly plan using the service
    const result = await weeklyPlanGenerator.generateWeeklyPlan(req.user.userId, userPreferences);
    
    console.log('✅ Weekly training plan generated successfully');
    
    res.status(201).json({
      success: true,
      message: 'Nedēļas treniņplāns izveidots veiksmīgi',
      ...result
    });
  } catch (error) {
    console.error('❌ Error generating weekly plan:', error);
    res.status(500).json({
      success: false,
      message: 'Neizdevās izveidot nedēļas treniņplānu',
      error: error.message
    });
  }
});

// POST /api/training-plans/weekly/ai-suggestions - Generate AI coaching suggestions for current week
router.post('/weekly/ai-suggestions', async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nepieciešama autentificēšana'
      });
    }

    console.log('🤖 Generating AI coaching suggestions for user:', userId);

    const { userPreferences = {} } = req.body;

    // Get current week's workouts
    const workouts = await weeklyPlanGenerator.getCurrentWeekWorkouts(userId);

    // Generate AI coaching suggestions
    const aiSuggestions = await weeklyPlanGenerator.generateAICoachingSuggestions(
      userId,
      { workouts },
      userPreferences
    );

    res.json({
      success: true,
      message: 'AI coaching ieteikumi veiksmīgi ģenerēti',
      ...aiSuggestions
    });

  } catch (error) {
    console.error('❌ Error generating AI coaching suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Neizdevās ģenerēt AI coaching ieteikumus',
      error: error.message
    });
  }
});

// GET /api/training-plans/weekly/current - Get current week's planned workouts
router.get('/weekly/current', async (req, res) => {
  console.log('🚀 Weekly current endpoint hit!');
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nepieciešama autentificēšana'
      });
    }
    console.log('📋 Getting current week workouts for user:', userId);
    
    const workouts = await weeklyPlanGenerator.getCurrentWeekWorkouts(userId);
    
    res.json({
      success: true,
      workouts: workouts.map(workout => ({
        id: workout._id,
        scheduledDate: workout.scheduledDate,
        dayOfWeek: workout.dayOfWeek,
        type: workout.type,
        name: workout.name,
        description: workout.description,
        targetMetrics: workout.targetMetrics,
        status: workout.status,
        completionMetrics: workout.completionMetrics
      })),
      total: workouts.length
    });
  } catch (error) {
    console.error('❌ Error getting current week workouts:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Neizdevās iegūt šīs nedēļas treniņus',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/training-plans/weekly/workouts/:workoutId/status - Update workout status (completed/skipped)
router.put('/weekly/workouts/:workoutId/status', async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { status, completionData = {} } = req.body;
    
    console.log(`📝 API: Updating workout ${workoutId} status to ${status}`);
    console.log(`📝 API: Request body:`, req.body);
    console.log(`📝 API: User:`, req.user?.userId);
    
    // Validate required parameters
    if (!workoutId) {
      return res.status(400).json({
        success: false,
        message: 'Nepieciešams darba ID (workoutId)'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Nepieciešams statuss'
      });
    }
    
    // Validate status
    if (!['completed', 'skipped'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Nederīgs statuss. Atļauti: completed, skipped'
      });
    }
    
    // Update workout status using the service
    const updatedWorkout = await weeklyPlanGenerator.updateWorkoutStatus(workoutId, status, completionData);
    
    console.log('✅ API: Workout status updated successfully');
    
    res.json({
      success: true,
      message: status === 'completed' ? 'Treniņš atzīmēts kā pabeigts' : 'Treniņš atzīmēts kā izlaists',
      workout: {
        id: updatedWorkout._id,
        status: updatedWorkout.status,
        completionMetrics: updatedWorkout.completionMetrics
      }
    });
  } catch (error) {
    console.error('❌ API Error updating workout status:', error.message);
    console.error('❌ API Full error:', error);
    
    // Return specific error messages for common issues
    let statusCode = 500;
    let errorMessage = 'Neizdevās atjaunināt treniņa statusu';
    
    if (error.message.includes('Invalid workout ID')) {
      statusCode = 400;
      errorMessage = 'Nederīgs treniņa ID';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = 'Treniņš nav atrasts';
    } else if (error.message.includes('Invalid status')) {
      statusCode = 400;
      errorMessage = 'Nederīgs statuss';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        workoutId,
        status: req.body.status,
        stack: error.stack
      } : undefined
    });
  }
});

export default router;