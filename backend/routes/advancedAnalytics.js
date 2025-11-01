// Advanced Analytics API Routes
// Provides AI-powered workout analysis and insights

import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import superAdminMiddleware from '../middleware/superAdminMiddleware.js';
import AdvancedAnalyticsService from '../services/advancedAnalyticsService.js';
import { AdvancedWorkoutAnalytics } from '../models/mongodb/analytics/advancedWorkoutAnalytics.model.js';
import { Workout } from '../models/mongodb/index.js';

const router = express.Router();

/**
 * @route POST /api/advanced-analytics/analyze/:workoutId
 * @desc Perform advanced analysis on a specific workout
 * @access Private
 */
router.post('/analyze/:workoutId', authenticateToken, async (req, res) => {
  try {
    const { workoutId } = req.params;
    const userId = req.user.userId;
    
    console.log(`🔬 Advanced analysis requested for workout: ${workoutId}`);
    
    // Verify workout belongs to user or user is admin
    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    if (workout.userId !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workout'
      });
    }
    
    // Perform analysis
    const analysis = await AdvancedAnalyticsService.analyzeWorkout(workoutId);
    
    res.json({
      success: true,
      message: 'Advanced analysis completed',
      data: {
        analysisId: analysis._id,
        workoutId,
        overallScore: analysis.aiInsights?.performanceAnalysis?.overallScore,
        performanceGrade: analysis.performanceGrade,
        injuryRisk: analysis.aiInsights?.predictions?.injuryRisk?.level,
        processingTime: analysis.analysisMetadata?.processingTime,
        dataQuality: analysis.dataQuality?.overallScore
      }
    });
    
  } catch (error) {
    console.error('Error performing advanced analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform advanced analysis',
      error: error.message
    });
  }
});

/**
 * @route GET /api/advanced-analytics/workout/:workoutId
 * @desc Get detailed advanced analytics for a workout
 * @access Private
 */
router.get('/workout/:workoutId', authenticateToken, async (req, res) => {
  try {
    const { workoutId } = req.params;
    const userId = req.user.userId;
    
    // Verify access
    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    if (workout.userId !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workout'
      });
    }
    
    // Get analysis
    const analysis = await AdvancedWorkoutAnalytics.findOne({ workoutId });
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Advanced analysis not found. Run analysis first.',
        action: 'analyze'
      });
    }
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advanced analytics',
      error: error.message
    });
  }
});

/**
 * @route GET /api/advanced-analytics/user/:period?
 * @desc Get aggregated advanced analytics for user
 * @access Private
 */
router.get('/user/:period?', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.params.period || '30days';
    
    console.log(`📊 Fetching user analytics for ${userId}, period: ${period}`);
    
    const analytics = await AdvancedAnalyticsService.getUserAdvancedAnalytics(userId, period);
    
    res.json({
      success: true,
      data: {
        userId,
        period,
        ...analytics
      }
    });
    
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
});

/**
 * @route GET /api/advanced-analytics/performance-trends/:period?
 * @desc Get performance trends for user
 * @access Private
 */
router.get('/performance-trends/:period?', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.params.period || '90days';
    
    const periodDays = AdvancedAnalyticsService.parsePeriodToDays(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    
    const analytics = await AdvancedWorkoutAnalytics.find({
      userId,
      'analysisMetadata.lastUpdated': { $gte: startDate }
    }).sort({ 'analysisMetadata.lastUpdated': 1 })
    .select('aiInsights.performanceAnalysis.overallScore analysisMetadata.lastUpdated trainingLoad');
    
    // Format for chart data
    const chartData = analytics.map(a => ({
      date: a.analysisMetadata.lastUpdated,
      performanceScore: a.aiInsights?.performanceAnalysis?.overallScore || 0,
      acuteChronic: a.trainingLoad?.acuteChronic || 1,
      trainingLoad: a.trainingLoad?.acuteLoad || 0
    }));
    
    res.json({
      success: true,
      data: {
        period,
        dataPoints: chartData.length,
        trends: chartData
      }
    });
    
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trends',
      error: error.message
    });
  }
});

/**
 * @route GET /api/advanced-analytics/injury-risk
 * @desc Get current injury risk assessment
 * @access Private
 */
router.get('/injury-risk', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get latest 10 workouts' analytics
    const recentAnalytics = await AdvancedWorkoutAnalytics.find({
      userId
    }).sort({ 'analysisMetadata.lastUpdated': -1 })
    .limit(10)
    .select('aiInsights.predictions.injuryRisk trainingLoad analysisMetadata.lastUpdated');
    
    if (recentAnalytics.length === 0) {
      return res.json({
        success: true,
        data: {
          riskLevel: 'unknown',
          message: 'No recent analytics data available'
        }
      });
    }
    
    // Calculate average risk and trend
    const riskScores = recentAnalytics.map(a => a.aiInsights?.predictions?.injuryRisk?.score || 0);
    const avgRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    
    let riskLevel = 'low';
    if (avgRisk > 75) riskLevel = 'very_high';
    else if (avgRisk > 50) riskLevel = 'high';
    else if (avgRisk > 25) riskLevel = 'moderate';
    
    // Get risk factors from latest analysis
    const latestAnalysis = recentAnalytics[0];
    const riskFactors = latestAnalysis.aiInsights?.predictions?.injuryRisk?.factors || [];
    const prevention = latestAnalysis.aiInsights?.predictions?.injuryRisk?.prevention || [];
    
    // Calculate trend
    const recentRisk = riskScores.slice(0, Math.ceil(riskScores.length / 2));
    const olderRisk = riskScores.slice(-Math.ceil(riskScores.length / 2));
    
    const recentAvg = recentRisk.reduce((sum, score) => sum + score, 0) / recentRisk.length;
    const olderAvg = olderRisk.reduce((sum, score) => sum + score, 0) / olderRisk.length;
    
    const trendDirection = recentAvg > olderAvg + 5 ? 'increasing' : 
                          recentAvg < olderAvg - 5 ? 'decreasing' : 'stable';
    
    res.json({
      success: true,
      data: {
        currentRisk: {
          level: riskLevel,
          score: Math.round(avgRisk),
          trend: trendDirection
        },
        factors: riskFactors,
        prevention: prevention,
        recentAnalyses: recentAnalytics.length,
        lastUpdate: latestAnalysis.analysisMetadata.lastUpdated
      }
    });
    
  } catch (error) {
    console.error('Error fetching injury risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch injury risk assessment',
      error: error.message
    });
  }
});

/**
 * @route GET /api/advanced-analytics/training-load
 * @desc Get training load analysis
 * @access Private
 */
router.get('/training-load', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get training load data from recent analytics
    const loadData = await AdvancedWorkoutAnalytics.getUserAveragePerformance(userId, 60);
    const trendData = await AdvancedWorkoutAnalytics.getTrainingLoadTrend(userId, 12);
    
    // Get recent load data for current status
    const recentAnalytics = await AdvancedWorkoutAnalytics.find({
      userId,
      'analysisMetadata.lastUpdated': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).select('trainingLoad analysisMetadata.lastUpdated');
    
    let currentStatus = 'balanced';
    let recommendation = 'Maintain current training load';
    
    if (recentAnalytics.length > 0) {
      const avgAcuteChronic = recentAnalytics.reduce((sum, a) => 
        sum + (a.trainingLoad?.acuteChronic || 1), 0) / recentAnalytics.length;
      
      if (avgAcuteChronic > 1.5) {
        currentStatus = 'high_risk';
        recommendation = 'Reduce training intensity or volume';
      } else if (avgAcuteChronic > 1.3) {
        currentStatus = 'building';
        recommendation = 'Monitor closely, consider maintenance week';
      } else if (avgAcuteChronic < 0.7) {
        currentStatus = 'detraining';
        recommendation = 'Gradually increase training load';
      }
    }
    
    res.json({
      success: true,
      data: {
        currentStatus,
        recommendation,
        summary: loadData[0] || null,
        weeklyTrends: trendData || [],
        recentDataPoints: recentAnalytics.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching training load:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training load analysis',
      error: error.message
    });
  }
});

/**
 * @route POST /api/advanced-analytics/batch-analyze
 * @desc Analyze multiple workouts in batch
 * @access Private (Admin only)
 */
router.post('/batch-analyze', superAdminMiddleware, async (req, res) => {
  try {
    const { workoutIds, userId } = req.body;
    
    if (!workoutIds || !Array.isArray(workoutIds)) {
      return res.status(400).json({
        success: false,
        message: 'workoutIds array is required'
      });
    }
    
    console.log(`🔬 Batch analysis requested for ${workoutIds.length} workouts`);
    
    const results = [];
    const errors = [];
    
    // Process workouts in parallel (limit to 5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < workoutIds.length; i += batchSize) {
      const batch = workoutIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (workoutId) => {
        try {
          const analysis = await AdvancedAnalyticsService.analyzeWorkout(workoutId);
          return { workoutId, success: true, analysisId: analysis._id };
        } catch (error) {
          return { workoutId, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result);
        } else {
          errors.push(result);
        }
      });
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < workoutIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    res.json({
      success: true,
      message: `Batch analysis completed`,
      data: {
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Batch analysis failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/advanced-analytics/insights/summary
 * @desc Get AI-generated insights summary for user
 * @access Private
 */
router.get('/insights/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || '30days';
    
    const analytics = await AdvancedAnalyticsService.getUserAdvancedAnalytics(userId, period);
    
    if (analytics.message) {
      return res.json({
        success: true,
        data: { message: analytics.message }
      });
    }
    
    // Create summary
    const summary = {
      period,
      performanceTrend: analytics.performanceTrend,
      topStrengths: analytics.strengths?.slice(0, 3) || [],
      keyImprovements: analytics.improvementAreas?.slice(0, 3) || [],
      topRecommendations: analytics.recommendations?.slice(0, 5) || [],
      injuryRisk: analytics.injuryRiskTrend,
      trainingLoad: analytics.trainingLoadTrend
    };
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Error generating insights summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights summary',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/advanced-analytics/workout/:workoutId
 * @desc Delete advanced analytics for a workout
 * @access Private
 */
router.delete('/workout/:workoutId', authenticateToken, async (req, res) => {
  try {
    const { workoutId } = req.params;
    const userId = req.user.userId;
    
    // Verify workout belongs to user or user is admin
    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    if (workout.userId !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Delete analysis
    const deleted = await AdvancedWorkoutAnalytics.findOneAndDelete({ workoutId });
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Advanced analytics not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Advanced analytics deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting advanced analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete advanced analytics',
      error: error.message
    });
  }
});

export default router;