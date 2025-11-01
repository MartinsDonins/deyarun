import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';
import { WorkoutAnalyticsService } from '../services/workoutAnalyticsService.js';

const router = express.Router();

// GET /api/advanced-analytics/workout-metrics/:userId - Advanced workout metrics
router.get('/workout-metrics/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '3months', includeComparison = false } = req.query;
    
    // Authorization check
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`📊 Getting advanced workout metrics for user ${userId}`);

    const metrics = await WorkoutAnalyticsService.calculateAdvancedMetrics(userId, {
      period,
      includeComparison: includeComparison === 'true'
    });

    res.json({
      success: true,
      userId,
      period,
      metrics
    });
  } catch (error) {
    console.error('❌ Error getting advanced workout metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get advanced workout metrics',
      error: error.message
    });
  }
});

// GET /api/advanced-analytics/performance-zones/:userId - Performance zone analysis
router.get('/performance-zones/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { metric = 'pace', period = '6months' } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`🎯 Analyzing performance zones for user ${userId}, metric: ${metric}`);

    const zones = await WorkoutAnalyticsService.analyzePerformanceZones(userId, {
      metric,
      period
    });

    res.json({
      success: true,
      userId,
      metric,
      zones
    });
  } catch (error) {
    console.error('❌ Error analyzing performance zones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze performance zones',
      error: error.message
    });
  }
});

// GET /api/advanced-analytics/training-load/:userId - Training load analysis
router.get('/training-load/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { weeks = 12, includeProjections = false } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`⚡ Calculating training load for user ${userId}`);

    const trainingLoad = await WorkoutAnalyticsService.calculateTrainingLoad(userId, {
      weeks: parseInt(weeks),
      includeProjections: includeProjections === 'true'
    });

    res.json({
      success: true,
      userId,
      weeks: parseInt(weeks),
      trainingLoad
    });
  } catch (error) {
    console.error('❌ Error calculating training load:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate training load',
      error: error.message
    });
  }
});

// GET /api/advanced-analytics/recovery-insights/:userId - Recovery analysis
router.get('/recovery-insights/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeRecommendations = true } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`😴 Analyzing recovery patterns for user ${userId}`);

    const recovery = await WorkoutAnalyticsService.analyzeRecoveryPatterns(userId, {
      includeRecommendations: includeRecommendations === 'true'
    });

    res.json({
      success: true,
      userId,
      recovery
    });
  } catch (error) {
    console.error('❌ Error analyzing recovery patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze recovery patterns',
      error: error.message
    });
  }
});

// GET /api/advanced-analytics/personal-records/:userId - Enhanced personal records
router.get('/personal-records/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { category = 'all', includeProjections = false } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`🏆 Getting enhanced personal records for user ${userId}`);

    const records = await WorkoutAnalyticsService.calculateEnhancedPersonalRecords(userId, {
      category,
      includeProjections: includeProjections === 'true'
    });

    res.json({
      success: true,
      userId,
      category,
      records
    });
  } catch (error) {
    console.error('❌ Error getting personal records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personal records',
      error: error.message
    });
  }
});

// GET /api/advanced-analytics/workout-quality/:userId - Workout quality analysis
router.get('/workout-quality/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '1month', metric = 'overall' } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`⭐ Analyzing workout quality for user ${userId}`);

    const quality = await WorkoutAnalyticsService.analyzeWorkoutQuality(userId, {
      period,
      metric
    });

    res.json({
      success: true,
      userId,
      period,
      quality
    });
  } catch (error) {
    console.error('❌ Error analyzing workout quality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze workout quality',
      error: error.message
    });
  }
});

// GET /api/advanced-analytics/progress-trends/:userId - Detailed progress trends
router.get('/progress-trends/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { metrics = 'pace,distance,consistency', timeframe = '6months' } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`📈 Analyzing progress trends for user ${userId}`);

    const trends = await WorkoutAnalyticsService.analyzeProgressTrends(userId, {
      metrics: metrics.split(','),
      timeframe
    });

    res.json({
      success: true,
      userId,
      timeframe,
      trends
    });
  } catch (error) {
    console.error('❌ Error analyzing progress trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze progress trends',
      error: error.message
    });
  }
});

// POST /api/advanced-analytics/custom-analysis/:userId - Custom analysis request
router.post('/custom-analysis/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { analysisType, parameters, format = 'json' } = req.body;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!analysisType) {
      return res.status(400).json({
        success: false,
        message: 'Analysis type is required'
      });
    }

    console.log(`🔬 Running custom analysis for user ${userId}, type: ${analysisType}`);

    const analysis = await WorkoutAnalyticsService.runCustomAnalysis(userId, {
      analysisType,
      parameters: parameters || {},
      format
    });

    res.json({
      success: true,
      userId,
      analysisType,
      analysis
    });
  } catch (error) {
    console.error('❌ Error running custom analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run custom analysis',
      error: error.message
    });
  }
});

export default router;