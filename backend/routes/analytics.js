// Performance Analytics API Routes
// Statistical analysis endpoints for user performance data

import express from 'express';
import { Workout } from '../models/mongodb/index.js';
import authenticateToken from '../middleware/authMiddleware.js';
import AnalyticsService from '../services/analyticsService.js';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticateToken);

// GET /api/analytics/user/:id/trends - Get user performance trends
router.get('/user/:id/trends', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '3months', metric = 'all' } = req.query;
    
    // Ensure user can only access their own data (or admin/coach access)
    if (id !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`📈 Getting performance trends for user ${id}, period: ${period}`);
    
    const trends = await AnalyticsService.calculatePerformanceTrends(id, period, metric);
    
    res.json({
      success: true,
      userId: id,
      period,
      metric,
      trends
    });
  } catch (error) {
    console.error('❌ Error getting performance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance trends',
      error: error.message
    });
  }
});

// GET /api/analytics/user/:id/predictions - Get AI performance predictions
router.get('/user/:id/predictions', async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = '1month', goals } = req.query;
    
    if (id !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`🔮 Getting performance predictions for user ${id}`);
    
    const predictions = await AnalyticsService.generatePerformancePredictions(id, timeframe, goals);
    
    res.json({
      success: true,
      userId: id,
      timeframe,
      predictions
    });
  } catch (error) {
    console.error('❌ Error getting performance predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance predictions',
      error: error.message
    });
  }
});

// GET /api/analytics/user/:id/insights - Get performance insights
router.get('/user/:id/insights', async (req, res) => {
  try {
    const { id } = req.params;
    const { category = 'all' } = req.query;
    
    if (id !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`💡 Getting performance insights for user ${id}`);
    
    const insights = await AnalyticsService.generatePerformanceInsights(id, category);
    
    res.json({
      success: true,
      userId: id,
      category,
      insights
    });
  } catch (error) {
    console.error('❌ Error getting performance insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance insights',
      error: error.message
    });
  }
});

// GET /api/analytics/comparative - Get comparative analysis
router.get('/comparative', async (req, res) => {
  try {
    const { userIds, metric = 'distance', period = '1month' } = req.query;
    
    // Parse user IDs
    const idsArray = typeof userIds === 'string' ? userIds.split(',') : [];
    
    // Verify user has access to compare these users
    if (!idsArray.includes(req.user.userId) && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`📊 Getting comparative analysis for users: ${idsArray.join(',')}`);
    
    const comparison = await AnalyticsService.generateComparativeAnalysis(idsArray, metric, period);
    
    res.json({
      success: true,
      userIds: idsArray,
      metric,
      period,
      comparison
    });
  } catch (error) {
    console.error('❌ Error getting comparative analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comparative analysis',
      error: error.message
    });
  }
});

// GET /api/analytics/personal-records/:userId - Get personal records analysis
router.get('/personal-records/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category = 'all' } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`🏆 Getting personal records for user ${userId}`);
    
    const personalRecords = await AnalyticsService.calculatePersonalRecords(userId, category);
    
    res.json({
      success: true,
      userId,
      category,
      personalRecords
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

// GET /api/analytics/consistency/:userId - Get training consistency analysis
router.get('/consistency/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '6months' } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`📅 Getting consistency analysis for user ${userId}`);
    
    const consistency = await AnalyticsService.analyzeTrainingConsistency(userId, period);
    
    res.json({
      success: true,
      userId,
      period,
      consistency
    });
  } catch (error) {
    console.error('❌ Error getting consistency analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get consistency analysis',
      error: error.message
    });
  }
});

// GET /api/analytics/performance-zones/:userId - Get performance zone analysis
router.get('/performance-zones/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'pace' } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`🎯 Getting performance zones for user ${userId}, type: ${type}`);
    
    const zones = await AnalyticsService.analyzePerformanceZones(userId, type);
    
    res.json({
      success: true,
      userId,
      type,
      zones
    });
  } catch (error) {
    console.error('❌ Error getting performance zones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance zones',
      error: error.message
    });
  }
});

// GET /api/analytics/training-load/:userId - Get training load analysis
router.get('/training-load/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { weeks = 12 } = req.query;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`⚡ Getting training load analysis for user ${userId}`);
    
    const trainingLoad = await AnalyticsService.analyzeTrainingLoad(userId, parseInt(weeks));
    
    res.json({
      success: true,
      userId,
      weeks: parseInt(weeks),
      trainingLoad
    });
  } catch (error) {
    console.error('❌ Error getting training load analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training load analysis',
      error: error.message
    });
  }
});

// GET /api/analytics/recovery/:userId - Get recovery analysis
router.get('/recovery/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId !== req.user.userId && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`😴 Getting recovery analysis for user ${userId}`);
    
    const recovery = await AnalyticsService.analyzeRecovery(userId);
    
    res.json({
      success: true,
      userId,
      recovery
    });
  } catch (error) {
    console.error('❌ Error getting recovery analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recovery analysis',
      error: error.message
    });
  }
});

// POST /api/analytics/custom-report - Generate custom analytics report
router.post('/custom-report', async (req, res) => {
  try {
    const { 
      userIds, 
      metrics, 
      period, 
      filters, 
      reportType = 'summary' 
    } = req.body;
    
    // Verify access permissions
    const hasAccess = userIds.every(id => 
      id === req.user.userId || ['admin', 'coach'].includes(req.user.role)
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    console.log(`📋 Generating custom analytics report for users: ${userIds.join(',')}`);
    
    const report = await AnalyticsService.generateCustomReport({
      userIds,
      metrics,
      period,
      filters,
      reportType
    });
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('❌ Error generating custom report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: error.message
    });
  }
});

export default router;