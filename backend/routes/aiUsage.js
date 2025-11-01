// AI Usage Analytics API Routes
// Provides detailed analytics on ChatGPT/OpenAI resource consumption

import express from 'express';
import AIUsage from '../models/mongodb/ai/aiUsage.model.js';
import authMiddleware, { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/ai-usage/overview - Get AI usage overview stats
 */
router.get('/overview', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { period = '30d', startDate, endDate } = req.query;
    
    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const days = parseInt(period.replace('d', '')) || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      dateFilter = { createdAt: { $gte: since } };
    }

    // Aggregate overall statistics
    const overallStats = await AIUsage.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: '$tokens.total' },
          totalCost: { $sum: '$cost.total' },
          avgLatency: { $avg: '$latency' },
          uniqueUsers: { $addToSet: '$userId' },
          modelUsage: {
            $push: {
              model: '$model',
              tokens: '$tokens.total',
              cost: '$cost.total'
            }
          }
        }
      },
      {
        $project: {
          totalRequests: 1,
          totalTokens: 1,
          totalCost: 1,
          avgLatency: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          modelUsage: 1
        }
      }
    ]);

    // Context breakdown
    const contextStats = await AIUsage.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$context',
          requests: { $sum: 1 },
          tokens: { $sum: '$tokens.total' },
          cost: { $sum: '$cost.total' },
          avgLatency: { $avg: '$latency' }
        }
      },
      { $sort: { cost: -1 } }
    ]);

    // Daily usage trend
    const dailyStats = await AIUsage.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          requests: { $sum: 1 },
          tokens: { $sum: '$tokens.total' },
          cost: { $sum: '$cost.total' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Model distribution
    const modelStats = await AIUsage.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$model',
          requests: { $sum: 1 },
          tokens: { $sum: '$tokens.total' },
          cost: { $sum: '$cost.total' },
          avgLatency: { $avg: '$latency' }
        }
      },
      { $sort: { cost: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          avgLatency: 0,
          uniqueUserCount: 0
        },
        contextBreakdown: contextStats,
        dailyTrend: dailyStats,
        modelDistribution: modelStats,
        period,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching AI usage overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI usage overview',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-usage/courses - Get AI usage by course
 */
router.get('/courses', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { limit = 20, startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const courseUsage = await AIUsage.aggregate([
      {
        $match: {
          ...dateFilter,
          context: 'course_generation',
          entityType: 'course'
        }
      },
      {
        $group: {
          _id: {
            entityId: '$entityId',
            entityName: '$entityName'
          },
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: '$tokens.total' },
          totalCost: { $sum: '$cost.total' },
          avgLatency: { $avg: '$latency' },
          firstGenerated: { $min: '$createdAt' },
          lastGenerated: { $max: '$createdAt' },
          modelBreakdown: {
            $push: {
              model: '$model',
              tokens: '$tokens.total',
              cost: '$cost.total'
            }
          }
        }
      },
      {
        $project: {
          courseName: '$_id.entityName',
          courseId: '$_id.entityId',
          totalRequests: 1,
          totalTokens: 1,
          totalCost: 1,
          avgLatency: 1,
          firstGenerated: 1,
          lastGenerated: 1,
          avgCostPerRequest: { $divide: ['$totalCost', '$totalRequests'] },
          avgTokensPerRequest: { $divide: ['$totalTokens', '$totalRequests'] },
          modelBreakdown: 1
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        courses: courseUsage,
        totalCourses: courseUsage.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching course AI usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course AI usage',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-usage/training-plans - Get AI usage for training plans
 */
router.get('/training-plans', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { limit = 20, startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const trainingPlanUsage = await AIUsage.aggregate([
      {
        $match: {
          ...dateFilter,
          context: 'training_plan_creation',
          entityType: 'training_plan'
        }
      },
      {
        $group: {
          _id: {
            entityId: '$entityId',
            entityName: '$entityName'
          },
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: '$tokens.total' },
          totalCost: { $sum: '$cost.total' },
          avgLatency: { $avg: '$latency' },
          uniqueUsers: { $addToSet: '$userId' },
          firstGenerated: { $min: '$createdAt' },
          lastGenerated: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          planName: '$_id.entityName',
          planId: '$_id.entityId',
          totalRequests: 1,
          totalTokens: 1,
          totalCost: 1,
          avgLatency: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          firstGenerated: 1,
          lastGenerated: 1,
          avgCostPerRequest: { $divide: ['$totalCost', '$totalRequests'] }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        trainingPlans: trainingPlanUsage,
        totalPlans: trainingPlanUsage.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching training plan AI usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training plan AI usage',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-usage/users - Get AI usage by user
 */
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { limit = 20, startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const userUsage = await AIUsage.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$userId',
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: '$tokens.total' },
          totalCost: { $sum: '$cost.total' },
          contexts: { $addToSet: '$context' },
          firstRequest: { $min: '$createdAt' },
          lastRequest: { $max: '$createdAt' },
          subscriptionType: { $last: '$billing.subscriptionType' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          userId: '$_id',
          user: { $arrayElemAt: ['$user', 0] },
          totalRequests: 1,
          totalTokens: 1,
          totalCost: 1,
          contextCount: { $size: '$contexts' },
          contexts: 1,
          firstRequest: 1,
          lastRequest: 1,
          subscriptionType: 1,
          avgCostPerRequest: { $divide: ['$totalCost', '$totalRequests'] }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        users: userUsage,
        totalUsers: userUsage.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user AI usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user AI usage',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-usage/details/:requestId - Get detailed usage for specific request
 */
router.get('/details/:requestId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const usage = await AIUsage.findOne({ requestId })
      .populate('userId', 'firstName lastName email')
      .populate('adminId', 'firstName lastName email');

    if (!usage) {
      return res.status(404).json({
        success: false,
        error: 'AI usage record not found'
      });
    }

    res.json({
      success: true,
      data: {
        usage,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching AI usage details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI usage details',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-usage/export - Export AI usage data
 */
router.get('/export', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, limit = 1000 } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const usage = await AIUsage.find(dateFilter)
      .populate('userId', 'firstName lastName email')
      .populate('adminId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    if (format === 'csv') {
      const csv = [
        // CSV Headers
        'Request ID,User Email,Context,Entity Type,Entity Name,Model,Total Tokens,Total Cost,Latency,Created At',
        // CSV Data
        ...usage.map(record => [
          record.requestId,
          record.userId?.email || 'N/A',
          record.context,
          record.entityType || 'N/A',
          record.entityName || 'N/A',
          record.model,
          record.tokens.total,
          record.cost.total.toFixed(6),
          record.latency,
          record.createdAt.toISOString()
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ai-usage-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: {
          usage,
          totalRecords: usage.length,
          exportedAt: new Date()
        }
      });
    }

  } catch (error) {
    console.error('❌ Error exporting AI usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export AI usage',
      message: error.message
    });
  }
});

export default router;