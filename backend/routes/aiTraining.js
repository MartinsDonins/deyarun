import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePremium, requirePro, checkSubscriptionLimits } from '../middleware/subscriptionMiddleware.js';
import { aiTrainingService } from '../services/aiTrainingService.js';
import { openAIService } from '../services/openAIService.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * AI Training Routes - Endpoints for AI-powered training features
 */

// Generate AI-powered training plan - Premium feature
router.post('/generate-plan', 
  verifyToken,
  requirePremium, // Require premium subscription
  [
    body('userProfile').notEmpty().withMessage('User profile is required'),
    body('userProfile.age').isInt({ min: 13, max: 100 }).withMessage('Valid age is required'),
    body('userProfile.fitnessLevel').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Valid fitness level required'),
    body('targetRace').notEmpty().withMessage('Target race information is required'),
    body('targetRace.distance').isIn(['5K', '10K', 'half-marathon', 'marathon', 'other']).withMessage('Valid race distance required'),
    body('preferences').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userProfile, targetRace, preferences = {} } = req.body;
      
      console.log(`🤖 AI Training Plan Request for user ${req.user.userId}`);
      console.log(`Target: ${targetRace.distance} race`);

      const result = await aiTrainingService.generatePersonalizedPlan(
        { ...userProfile, userId: req.user.userId },
        targetRace,
        preferences
      );

      res.json({
        success: true,
        data: result,
        message: 'Training plan generated successfully',
        aiEnabled: aiTrainingService.aiModels.enabled
      });

    } catch (error) {
      console.error('❌ AI Training Plan Generation Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate training plan',
        message: error.message
      });
    }
  }
);

// Generate PRO personalized training program - PRO exclusive feature
router.post('/generate-pro-program', 
  verifyToken,
  requirePro, // Require PRO subscription
  [
    body('userProfile').notEmpty().withMessage('User profile is required'),
    body('userProfile.age').isInt({ min: 13, max: 100 }).withMessage('Valid age is required'),
    body('userProfile.fitnessLevel').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Valid fitness level required'),
    body('userProfile.height').isFloat({ min: 100, max: 250 }).withMessage('Valid height required (cm)'),
    body('userProfile.weight').isFloat({ min: 30, max: 300 }).withMessage('Valid weight required (kg)'),
    body('targetRace').notEmpty().withMessage('Target race information is required'),
    body('targetRace.distance').isIn(['5K', '10K', 'half-marathon', 'marathon', 'ultramarathon']).withMessage('Valid race distance required'),
    body('targetRace.targetTime').optional().isString(),
    body('targetRace.date').optional().isISO8601(),
    body('healthProfile').optional().isObject(),
    body('injuryHistory').optional().isArray(),
    body('preferences').optional().isObject(),
    body('coachingStyle').optional().isIn(['supportive', 'challenging', 'data-driven', 'holistic'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { 
        userProfile, 
        targetRace, 
        healthProfile = {}, 
        injuryHistory = [], 
        preferences = {},
        coachingStyle = 'supportive'
      } = req.body;
      
      console.log(`🏆 PRO Training Program Request for user ${req.user.userId}`);
      console.log(`Target: ${targetRace.distance} race with PRO features`);

      // Enhanced PRO features
      const enhancedPreferences = {
        ...preferences,
        includePersonalizedCoaching: true,
        includeInjuryPrevention: true,
        includeNutritionGuidance: true,
        includeRecoveryPlans: true,
        includeMentalTraining: true,
        coachingStyle: coachingStyle,
        adaptationFrequency: 'weekly'
      };

      // Generate comprehensive PRO program
      const result = await aiTrainingService.generateProPersonalizedProgram(
        { 
          ...userProfile, 
          userId: req.user.userId,
          healthProfile,
          injuryHistory
        },
        targetRace,
        enhancedPreferences
      );

      res.json({
        success: true,
        data: result,
        message: 'PRO training program generated successfully',
        aiEnabled: aiTrainingService.aiModels.enabled,
        proFeatures: {
          personalCoaching: true,
          injuryPrevention: true,
          nutritionGuidance: true,
          recoveryPlans: true,
          mentalTraining: true,
          weeklyAdaptations: true
        }
      });

    } catch (error) {
      console.error('❌ PRO Training Program Generation Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate PRO training program',
        message: error.message
      });
    }
  }
);

// Generate AI coaching advice - Premium feature
router.post('/coaching-advice',
  verifyToken,
  requirePremium, // Require premium subscription
  [
    body('recentData').notEmpty().withMessage('Recent performance data is required'),
    body('upcomingSchedule').notEmpty().withMessage('Upcoming schedule is required'),
    body('specificQuestion').optional().isString().isLength({ max: 500 }).withMessage('Question too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { recentData, upcomingSchedule, specificQuestion } = req.body;
      
      console.log(`🧠 AI Coaching Request for user ${req.user.userId}`);
      if (specificQuestion) {
        console.log(`Question: "${specificQuestion}"`);
      }

      const result = await aiTrainingService.generateCoachingTips(
        req.user.userId,
        recentData,
        upcomingSchedule,
        specificQuestion
      );

      res.json({
        success: true,
        data: result,
        message: 'Coaching advice generated successfully',
        aiEnabled: aiTrainingService.aiModels.enabled
      });

    } catch (error) {
      console.error('❌ AI Coaching Advice Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate coaching advice',
        message: error.message
      });
    }
  }
);

// Analyze performance and generate adaptations - Premium feature
router.post('/analyze-performance',
  verifyToken,
  requirePremium, // Require premium subscription
  [
    body('performanceData').notEmpty().withMessage('Performance data is required'),
    body('performanceData.completionRate').isFloat({ min: 0, max: 100 }).withMessage('Valid completion rate required'),
    body('performanceData.avgFatigue').optional().isFloat({ min: 0, max: 10 }).withMessage('Fatigue must be 0-10'),
    body('currentPlan').notEmpty().withMessage('Current plan data is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { performanceData, currentPlan } = req.body;
      
      console.log(`📊 Enhanced AI Performance Analysis for user ${req.user.userId}`);
      console.log(`Completion rate: ${performanceData.completionRate}%`);
      console.log(`Average fatigue: ${performanceData.avgFatigue}/10`);

      // Get enhanced progress analysis
      const progressAnalysis = await aiTrainingService.analyzeProgressTrends(
        req.user.userId,
        '4weeks'
      );

      const result = await aiTrainingService.generateAdaptations(
        req.user.userId,
        performanceData,
        currentPlan
      );

      // Add progress analysis to result
      result.progressAnalysis = progressAnalysis;

      res.json({
        success: true,
        data: result,
        message: 'Performance analysis completed successfully',
        aiEnabled: aiTrainingService.aiModels.enabled
      });

    } catch (error) {
      console.error('❌ AI Performance Analysis Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze performance',
        message: error.message
      });
    }
  }
);

// Get AI service status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const aiServiceStatus = openAIService.getStatus();
    const trainingServiceStatus = aiTrainingService.assessAIReadiness();
    
    res.json({
      success: true,
      data: {
        openAI: aiServiceStatus,
        trainingService: trainingServiceStatus,
        endpoints: {
          planGeneration: '/api/ai-training/generate-plan',
          coachingAdvice: '/api/ai-training/coaching-advice',
          performanceAnalysis: '/api/ai-training/analyze-performance'
        }
      },
      message: 'AI service status retrieved successfully'
    });

  } catch (error) {
    console.error('❌ AI Status Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI status',
      message: error.message
    });
  }
});

// Test AI connection
router.post('/test-connection', verifyToken, async (req, res) => {
  try {
    // Only allow admins to test connection
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log(`🧪 AI Connection Test by admin ${req.user.userId}`);

    // Test OpenAI connection
    const testResult = await openAIService.testConnection();
    
    // Get detailed status
    const status = openAIService.getStatus();

    res.json({
      success: true,
      data: {
        connectionTest: testResult,
        status: status,
        message: 'AI connection is working properly'
      },
      message: 'AI connection test completed successfully'
    });

  } catch (error) {
    console.error('❌ AI Connection Test Error:', error);
    res.status(500).json({
      success: false,
      error: 'AI connection test failed',
      message: error.message,
      details: {
        hasApiKey: Boolean(process.env.OPENAI_API_KEY),
        initialized: openAIService.isInitialized
      }
    });
  }
});

// Clear AI cache (admin only)
router.post('/clear-cache', verifyToken, async (req, res) => {
  try {
    // Only allow admins to clear cache
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log(`🧹 AI Cache Clear by admin ${req.user.userId}`);

    openAIService.clearCache();

    res.json({
      success: true,
      message: 'AI cache cleared successfully'
    });

  } catch (error) {
    console.error('❌ AI Cache Clear Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear AI cache',
      message: error.message
    });
  }
});

// Analyze progress trends with enhanced metrics - Premium feature
router.get('/progress-analysis', verifyToken, requirePremium, async (req, res) => {
  try {
    const { timeframe = '4weeks' } = req.query;
    
    console.log(`📈 Progress Analysis Request for user ${req.user.userId} (${timeframe})`);

    const progressAnalysis = await aiTrainingService.analyzeProgressTrends(
      req.user.userId,
      timeframe
    );

    res.json({
      success: true,
      data: progressAnalysis,
      message: 'Progress analysis completed successfully',
      aiEnabled: aiTrainingService.aiModels.enabled
    });

  } catch (error) {
    console.error('❌ Progress Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze progress',
      message: error.message
    });
  }
});

// Get AI readiness assessment
router.get('/readiness', verifyToken, async (req, res) => {
  try {
    const readiness = aiTrainingService.assessAIReadiness();
    
    res.json({
      success: true,
      data: readiness,
      message: 'AI readiness assessment completed'
    });

  } catch (error) {
    console.error('❌ AI Readiness Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess AI readiness',
      message: error.message
    });
  }
});

// Enable/Disable AI features (admin only)
router.post('/toggle', verifyToken, async (req, res) => {
  try {
    // Only allow admins to toggle AI
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { enabled } = req.body;
    
    console.log(`🔄 AI Toggle by admin ${req.user.userId}: ${enabled ? 'Enabling' : 'Disabling'}`);

    if (enabled) {
      const result = await aiTrainingService.enableAI();
      res.json({
        success: true,
        data: result,
        message: 'AI features enabled successfully'
      });
    } else {
      aiTrainingService.disableAI();
      res.json({
        success: true,
        message: 'AI features disabled successfully'
      });
    }

  } catch (error) {
    console.error('❌ AI Toggle Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle AI features',
      message: error.message
    });
  }
});

// Quick coaching question endpoint - Premium feature
router.post('/quick-question',
  verifyToken,
  requirePremium, // Require premium subscription
  [
    body('question').notEmpty().isLength({ min: 5, max: 200 }).withMessage('Question must be 5-200 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { question } = req.body;
      
      console.log(`❓ Quick AI Question from user ${req.user.userId}: "${question}"`);

      // Use minimal data for quick questions
      const recentData = {
        avgFatigue: 5,
        completionRate: 80,
        avgEnjoyment: 7
      };

      const upcomingSchedule = {
        hasLongRun: false,
        intensiveTrainings: 2,
        totalDistance: 30
      };

      const result = await aiTrainingService.generateCoachingTips(
        req.user.userId,
        recentData,
        upcomingSchedule,
        question
      );

      res.json({
        success: true,
        data: {
          answer: result.mainMessage || result.aiAdvice?.mainMessage,
          tips: result.aiAdvice?.tips || [],
          priority: result.priority,
          metadata: result.metadata
        },
        message: 'Quick question answered successfully'
      });

    } catch (error) {
      console.error('❌ Quick Question Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to answer question',
        message: error.message
      });
    }
  }
);

// PRO Personal Coaching Session - PRO exclusive
router.post('/pro-coaching-session',
  verifyToken,
  requirePro, // Require PRO subscription
  [
    body('sessionType').isIn(['goal-setting', 'performance-review', 'injury-consultation', 'mental-training', 'nutrition-planning']).withMessage('Valid session type required'),
    body('currentConcerns').optional().isArray(),
    body('recentPerformance').optional().isObject(),
    body('specificQuestions').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { sessionType, currentConcerns = [], recentPerformance = {}, specificQuestions = [] } = req.body;
      
      console.log(`🏆 PRO Coaching Session for user ${req.user.userId}: ${sessionType}`);

      const result = await aiTrainingService.generateProCoachingSession(
        req.user.userId,
        sessionType,
        {
          concerns: currentConcerns,
          performance: recentPerformance,
          questions: specificQuestions
        }
      );

      res.json({
        success: true,
        data: result,
        message: 'PRO coaching session completed successfully',
        sessionType: sessionType,
        proFeatures: {
          personalCoach: true,
          oneOnOneSession: true,
          customizedAdvice: true
        }
      });

    } catch (error) {
      console.error('❌ PRO Coaching Session Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete PRO coaching session',
        message: error.message
      });
    }
  }
);

// PRO Training Plan Adaptation - PRO exclusive
router.post('/pro-adapt-plan',
  verifyToken,
  requirePro, // Require PRO subscription
  [
    body('currentPlanId').notEmpty().withMessage('Current plan ID is required'),
    body('adaptationReason').isIn(['injury', 'performance-plateau', 'schedule-change', 'goal-change', 'overtraining']).withMessage('Valid adaptation reason required'),
    body('adaptationData').notEmpty().withMessage('Adaptation data is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { currentPlanId, adaptationReason, adaptationData } = req.body;
      
      console.log(`🔄 PRO Plan Adaptation for user ${req.user.userId}: ${adaptationReason}`);

      const result = await aiTrainingService.generateProPlanAdaptation(
        req.user.userId,
        currentPlanId,
        adaptationReason,
        adaptationData
      );

      res.json({
        success: true,
        data: result,
        message: 'PRO training plan adapted successfully',
        adaptationReason: adaptationReason,
        proFeatures: {
          personalCoach: true,
          realTimeAdaptation: true,
          injuryPrevention: true
        }
      });

    } catch (error) {
      console.error('❌ PRO Plan Adaptation Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to adapt PRO training plan',
        message: error.message
      });
    }
  }
);

// ========== NEW ENHANCED AI FEATURES ==========

// Advanced Injury Risk Assessment - PRO exclusive
router.post('/injury-risk-assessment',
  verifyToken,
  requirePro,
  [
    body('userProfile').notEmpty().withMessage('User profile is required'),
    body('workoutHistory').isArray().withMessage('Workout history must be an array'),
    body('currentSymptoms').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userProfile, workoutHistory, currentSymptoms = [] } = req.body;
      
      console.log(`🏥 AI Injury Risk Assessment for user ${req.user.userId}`);

      const result = await openAIService.assessInjuryRisk(
        { ...userProfile, userId: req.user.userId },
        workoutHistory,
        currentSymptoms
      );

      res.json({
        success: true,
        data: result,
        message: 'Injury risk assessment completed successfully',
        proFeature: 'Advanced AI Injury Prevention'
      });

    } catch (error) {
      console.error('❌ AI Injury Risk Assessment Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete injury risk assessment',
        message: error.message
      });
    }
  }
);

// Personalized Workout Recommendations - Premium feature
router.post('/workout-recommendations',
  verifyToken,
  requirePremium,
  [
    body('userProfile').notEmpty().withMessage('User profile is required'),
    body('recentWorkouts').isArray().withMessage('Recent workouts must be an array'),
    body('upcomingGoals').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userProfile, recentWorkouts, upcomingGoals = [] } = req.body;
      
      console.log(`🏃 AI Workout Recommendations for user ${req.user.userId}`);

      const result = await openAIService.generateWorkoutRecommendations(
        { ...userProfile, userId: req.user.userId },
        recentWorkouts,
        upcomingGoals
      );

      res.json({
        success: true,
        data: result,
        message: 'Personalized workout recommendations generated successfully',
        premiumFeature: 'AI-Powered Training Plans'
      });

    } catch (error) {
      console.error('❌ AI Workout Recommendations Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate workout recommendations',
        message: error.message
      });
    }
  }
);

// Performance Trend Analysis - PRO exclusive
router.post('/performance-analysis',
  verifyToken,
  requirePro,
  [
    body('workoutData').isArray().withMessage('Workout data must be an array'),
    body('timeframe').optional().isIn(['1month', '3months', '6months', '1year']).withMessage('Valid timeframe required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { workoutData, timeframe = '3months' } = req.body;
      
      console.log(`📊 AI Performance Analysis for user ${req.user.userId} (${timeframe})`);

      const result = await openAIService.analyzePerformanceTrends(
        req.user.userId,
        workoutData,
        timeframe
      );

      res.json({
        success: true,
        data: result,
        message: 'Performance trend analysis completed successfully',
        proFeature: 'Advanced AI Performance Analytics'
      });

    } catch (error) {
      console.error('❌ AI Performance Analysis Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete performance analysis',
        message: error.message
      });
    }
  }
);

// AI Service Status - Admin only
router.get('/service-status',
  verifyToken,
  async (req, res) => {
    try {
      // Check admin access
      if (!['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const status = openAIService.getStatus();
      
      res.json({
        success: true,
        data: status,
        message: 'AI service status retrieved successfully'
      });

    } catch (error) {
      console.error('❌ AI Service Status Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI service status',
        message: error.message
      });
    }
  }
);

// Test AI Connection - Admin only
router.post('/test-connection',
  verifyToken,
  async (req, res) => {
    try {
      // Check admin access
      if (!['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      await openAIService.testConnection();
      
      res.json({
        success: true,
        message: 'AI service connection test successful'
      });

    } catch (error) {
      console.error('❌ AI Connection Test Error:', error);
      res.status(500).json({
        success: false,
        error: 'AI connection test failed',
        message: error.message
      });
    }
  }
);

// Clear AI Cache - Admin only
router.post('/clear-cache',
  verifyToken,
  async (req, res) => {
    try {
      // Check admin access
      if (!['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      openAIService.clearCache();
      
      res.json({
        success: true,
        message: 'AI service cache cleared successfully'
      });

    } catch (error) {
      console.error('❌ AI Cache Clear Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear AI cache',
        message: error.message
      });
    }
  }
);

export default router;