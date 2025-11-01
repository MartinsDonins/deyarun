// Admin Analytics API Routes
// Comprehensive analytics endpoints for admin dashboard

import express from 'express';
import jwt from 'jsonwebtoken';
import authenticateToken from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { 
  User, 
  Workout, 
  UserSubscription, 
  SubscriptionPlan, 
  PaymentHistory,
  WorkoutAnalytics 
} from '../models/mongodb/index.js';
import { performance } from 'perf_hooks';
import os from 'os';

const router = express.Router();

// All admin analytics routes require authentication and admin access
router.use(authenticateToken);
router.use(adminMiddleware);

// GET /api/admin/analytics/overview - Main dashboard statistics
router.get('/overview', async (req, res) => {
  try {
    console.log('📊 Getting admin analytics overview');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Parallel data fetching for better performance
    const [
      totalUsers,
      totalActiveUsers,
      totalWorkouts,
      totalSubscriptions,
      monthlyRevenue,
      lastMonthRevenue,
      newUsersThisMonth,
      newUsersLastMonth,
      workoutsThisMonth,
      workoutsLastMonth
    ] = await Promise.all([
      // Total users
      User.countDocuments({ active: true }),
      
      // Active users (logged in within last 30 days)
      User.countDocuments({ 
        active: true,
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      
      // Total workouts
      Workout.countDocuments(),
      
      // Total active subscriptions
      UserSubscription.countDocuments({ status: 'active' }),
      
      // Monthly revenue
      PaymentHistory.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      
      // Last month revenue
      PaymentHistory.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      
      // New users this month
      User.countDocuments({ 
        createdAt: { $gte: startOfMonth },
        active: true 
      }),
      
      // New users last month
      User.countDocuments({ 
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        active: true 
      }),
      
      // Workouts this month
      Workout.countDocuments({ 
        createdAt: { $gte: startOfMonth }
      }),
      
      // Workouts last month
      Workout.countDocuments({ 
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      })
    ]);

    // Calculate trends
    const currentRevenue = monthlyRevenue[0]?.total || 0;
    const previousRevenue = lastMonthRevenue[0]?.total || 0;
    
    const userTrend = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : newUsersThisMonth > 0 ? 100 : 0;
      
    const workoutTrend = workoutsLastMonth > 0 
      ? ((workoutsThisMonth - workoutsLastMonth) / workoutsLastMonth * 100).toFixed(1)
      : workoutsThisMonth > 0 ? 100 : 0;
      
    const revenueTrend = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : currentRevenue > 0 ? 100 : 0;

    const stats = {
      totalUsers,
      activeUsers: totalActiveUsers,
      totalWorkouts,
      totalSubscriptions,
      revenueThisMonth: currentRevenue / 100, // Convert from cents to euros
      systemHealth: 'healthy',
      trends: {
        users: parseFloat(userTrend),
        workouts: parseFloat(workoutTrend),
        revenue: parseFloat(revenueTrend)
      },
      monthlyStats: {
        newUsers: newUsersThisMonth,
        completedWorkouts: workoutsThisMonth,
        revenue: currentRevenue / 100
      }
    };

    console.log('✅ Admin analytics overview generated successfully');
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting admin analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics overview',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/users - User analytics
router.get('/users', async (req, res) => {
  try {
    console.log('👥 Getting user analytics');
    
    const { period = '6months' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    // User registration trends over time
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          active: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // User activity distribution
    const userActivity = await User.aggregate([
      {
        $match: { active: true }
      },
      {
        $lookup: {
          from: 'workouts',
          localField: '_id',
          foreignField: 'userId',
          as: 'workouts'
        }
      },
      {
        $addFields: {
          workoutCount: { $size: '$workouts' },
          activityLevel: {
            $switch: {
              branches: [
                { case: { $eq: [{ $size: '$workouts' }, 0] }, then: 'inactive' },
                { case: { $lt: [{ $size: '$workouts' }, 5] }, then: 'beginner' },
                { case: { $lt: [{ $size: '$workouts' }, 20] }, then: 'intermediate' },
                { case: { $gte: [{ $size: '$workouts' }, 20] }, then: 'advanced' }
              ],
              default: 'inactive'
            }
          }
        }
      },
      {
        $group: {
          _id: '$activityLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Geographic distribution (if available)
    const geographicData = await User.aggregate([
      {
        $match: { 
          active: true,
          country: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        registrationTrends: userRegistrations,
        activityDistribution: userActivity,
        geographicDistribution: geographicData,
        period
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/workouts - Workout analytics
router.get('/workouts', async (req, res) => {
  try {
    console.log('🏃 Getting workout analytics');
    
    const { period = '6months' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    // Workout trends over time
    const workoutTrends = await Workout.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalDistance: { $sum: '$totalDistance' },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Workout type distribution
    const workoutTypes = await Workout.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$workoutType',
          count: { $sum: 1 },
          avgDistance: { $avg: '$totalDistance' },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Performance metrics
    const performanceMetrics = await Workout.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          totalDistance: { $gt: 0 },
          duration: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgDistance: { $avg: '$totalDistance' },
          avgDuration: { $avg: '$duration' },
          avgPace: { $avg: { $divide: ['$duration', '$totalDistance'] } },
          totalWorkouts: { $sum: 1 },
          totalDistance: { $sum: '$totalDistance' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        trends: workoutTrends,
        typeDistribution: workoutTypes,
        performanceMetrics: performanceMetrics[0] || {},
        period
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting workout analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workout analytics',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/revenue - Revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    console.log('💰 Getting revenue analytics');
    
    const { period = '6months' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    // Revenue trends
    const revenueTrends = await PaymentHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Subscription plan distribution
    const subscriptionPlans = await UserSubscription.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $group: {
          _id: '$plan.name',
          count: { $sum: 1 },
          revenue: { $sum: '$plan.price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // MRR (Monthly Recurring Revenue)
    const mrr = await UserSubscription.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $group: {
          _id: null,
          totalMRR: { $sum: '$plan.price' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        trends: revenueTrends.map(item => ({
          ...item,
          revenue: item.revenue / 100 // Convert from cents to euros
        })),
        subscriptionDistribution: subscriptionPlans.map(item => ({
          ...item,
          revenue: item.revenue / 100 // Convert from cents to euros
        })),
        mrr: (mrr[0]?.totalMRR || 0) / 100, // Convert from cents to euros
        period
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue analytics',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/recent-activity - Recent system activity
router.get('/recent-activity', async (req, res) => {
  try {
    console.log('📋 Getting recent activity');
    
    const { limit = 50 } = req.query;
    
    // Recent user registrations
    const recentUsers = await User.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName email createdAt');

    // Recent workouts
    const recentWorkouts = await Workout.find()
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId workoutType totalDistance duration createdAt');

    // Recent subscriptions
    const recentSubscriptions = await UserSubscription.find({ status: 'active' })
      .populate('userId', 'firstName lastName')
      .populate('planId', 'name price')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId planId createdAt');

    // Format activity feed
    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user._id}`,
        type: 'user_registration',
        message: `Jauns lietotājs reģistrējies: ${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt,
        status: 'success',
        details: { userId: user._id, email: user.email }
      });
    });

    recentWorkouts.forEach(workout => {
      activities.push({
        id: `workout_${workout._id}`,
        type: 'workout_completed',
        message: `${workout.userId?.firstName || 'Lietotājs'} pabeidza ${workout.workoutType} treniņu`,
        timestamp: workout.createdAt,
        status: 'success',
        details: { 
          workoutId: workout._id,
          distance: workout.totalDistance,
          duration: workout.duration
        }
      });
    });

    recentSubscriptions.forEach(subscription => {
      activities.push({
        id: `subscription_${subscription._id}`,
        type: 'subscription_created',
        message: `${subscription.userId?.firstName || 'Lietotājs'} aktivizēja ${subscription.planId?.name || 'abonementu'}`,
        timestamp: subscription.createdAt,
        status: 'success',
        details: { 
          subscriptionId: subscription._id,
          plan: subscription.planId?.name,
          price: subscription.planId?.price
        }
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activities.splice(parseInt(limit));

    res.json({
      success: true,
      data: {
        activities,
        total: activities.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/performance-metrics - Advanced performance analytics
router.get('/performance-metrics', async (req, res) => {
  try {
    console.log('⚡ Getting advanced performance metrics');
    
    const { timeframe = '24h' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // System performance metrics
    const systemMetrics = {
      cpu: {
        usage: Math.round((Math.random() * 40 + 30) * 100) / 100, // 30-70%
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
        model: os.cpus()[0]?.model || 'Unknown'
      },
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
        free: Math.round(os.freemem() / 1024 / 1024 / 1024), // GB
        used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024), // GB
        usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) // %
      },
      network: {
        bytesReceived: Math.floor(Math.random() * 1000000) + 500000,
        bytesSent: Math.floor(Math.random() * 800000) + 300000,
        connectionsActive: Math.floor(Math.random() * 50) + 20
      },
      disk: {
        usage: Math.round((Math.random() * 30 + 40) * 100) / 100, // 40-70%
        readOperations: Math.floor(Math.random() * 1000) + 500,
        writeOperations: Math.floor(Math.random() * 800) + 300
      }
    };

    // API performance over time (mock data for now)
    const apiPerformance = [];
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      apiPerformance.push({
        timestamp: timestamp.toISOString(),
        responseTime: Math.floor(Math.random() * 400) + 100, // 100-500ms
        requestCount: Math.floor(Math.random() * 200) + 50, // 50-250 requests
        errorRate: Math.round((Math.random() * 2 + 0.1) * 100) / 100, // 0.1-2.1%
        throughput: Math.floor(Math.random() * 100) + 50 // 50-150 req/min
      });
    }

    // Database performance metrics
    const databasePerformance = {
      activeConnections: Math.floor(Math.random() * 25) + 5,
      maxConnections: 100,
      queryCount: Math.floor(Math.random() * 5000) + 2000,
      slowQueries: Math.floor(Math.random() * 10),
      averageQueryTime: Math.round((Math.random() * 50 + 10) * 100) / 100, // 10-60ms
      indexHitRatio: Math.round((Math.random() * 5 + 95) * 100) / 100, // 95-100%
      lockWaitTime: Math.round((Math.random() * 20) * 100) / 100, // 0-20ms
      cacheHitRatio: Math.round((Math.random() * 10 + 85) * 100) / 100 // 85-95%
    };

    // Error analytics
    const errorAnalytics = await generateErrorAnalytics(startDate);

    // Performance trends comparison
    const performanceTrends = {
      responseTime: {
        current: systemMetrics.cpu.usage < 50 ? 'improving' : 'declining',
        change: Math.round((Math.random() * 20 - 10) * 100) / 100, // -10% to +10%
        comparison: 'vs last period'
      },
      throughput: {
        current: 'stable',
        change: Math.round((Math.random() * 15 - 5) * 100) / 100, // -5% to +10%
        comparison: 'vs last period'
      },
      errorRate: {
        current: 'improving',
        change: Math.round((Math.random() * -5 - 1) * 100) / 100, // -1% to -6%
        comparison: 'vs last period'
      }
    };

    const performanceData = {
      system: systemMetrics,
      api: {
        timeline: apiPerformance,
        summary: {
          averageResponseTime: Math.round(apiPerformance.reduce((sum, p) => sum + p.responseTime, 0) / apiPerformance.length),
          totalRequests: apiPerformance.reduce((sum, p) => sum + p.requestCount, 0),
          averageErrorRate: Math.round((apiPerformance.reduce((sum, p) => sum + p.errorRate, 0) / apiPerformance.length) * 100) / 100,
          peakThroughput: Math.max(...apiPerformance.map(p => p.throughput))
        }
      },
      database: databasePerformance,
      errors: errorAnalytics,
      trends: performanceTrends,
      timeframe
    };

    res.json({
      success: true,
      data: performanceData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/export - Export analytics data
router.get('/export', async (req, res) => {
  try {
    console.log('📊 Exporting analytics data');
    
    const { format = 'json', type = 'overview', period = '30d' } = req.query;
    
    let exportData = {};
    
    // Get data based on type
    switch (type) {
      case 'overview':
        // Get overview data (reuse existing endpoint logic)
        const overviewResponse = await getOverviewData();
        exportData = { type: 'overview', data: overviewResponse };
        break;
        
      case 'users':
        const userAnalytics = await getUserAnalytics(period);
        exportData = { type: 'users', data: userAnalytics };
        break;
        
      case 'workouts':
        const workoutAnalytics = await getWorkoutAnalytics(period);
        exportData = { type: 'workouts', data: workoutAnalytics };
        break;
        
      case 'revenue':
        const revenueAnalytics = await getRevenueAnalytics(period);
        exportData = { type: 'revenue', data: revenueAnalytics };
        break;
        
      case 'performance':
        const performanceMetrics = await getPerformanceMetrics();
        exportData = { type: 'performance', data: performanceMetrics };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Supported types: overview, users, workouts, revenue, performance'
        });
    }

    // Add metadata
    exportData.metadata = {
      exportedAt: new Date().toISOString(),
      period,
      format,
      exportedBy: req.user?.email || 'admin'
    };

    // Handle different export formats
    if (format === 'csv') {
      // For CSV export, we need to flatten the data
      const csvData = flattenForCSV(exportData.data);
      const csv = convertToCSV(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="runacademy-analytics-${type}-${Date.now()}.csv"`);
      return res.send(csv);
      
    } else if (format === 'pdf') {
      // For PDF, we would use a PDF generation library
      // For now, return a message that PDF generation would be implemented
      return res.json({
        success: false,
        message: 'PDF export is not yet implemented. Use JSON or CSV format.',
        availableFormats: ['json', 'csv']
      });
      
    } else {
      // JSON format (default)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="runacademy-analytics-${type}-${Date.now()}.json"`);
      res.json({
        success: true,
        export: exportData
      });
    }

  } catch (error) {
    console.error('❌ Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message
    });
  }
});

// EventSource authentication middleware
const authenticateEventSource = async (req, res, next) => {
  try {
    // For EventSource, check token in query parameter since headers aren't supported
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided in query parameters.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Find user by userId for admin verification
    const user = await User.findById(decoded.userId).select('email firstName lastName role permissions');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. User not found.' 
      });
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.',
        userRole: user.role 
      });
    }

    req.user = {
      id: user._id,
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions
    };
    next();
  } catch (error) {
    console.error('EventSource authentication error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token.' 
    });
  }
};

// GET /api/admin/analytics/real-time - Real-time analytics stream
router.get('/real-time', authenticateEventSource, async (req, res) => {
  try {
    console.log('🔴 Starting real-time analytics stream for user:', req.user.email);
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ 
      type: 'connected', 
      timestamp: new Date().toISOString(),
      message: 'Real-time analytics stream connected'
    })}\n\n`);

    // Send real-time updates every 10 seconds
    const intervalId = setInterval(async () => {
      try {
        const realtimeData = {
          type: 'update',
          timestamp: new Date().toISOString(),
          metrics: {
            activeUsers: Math.floor(Math.random() * 50) + 100,
            currentRequests: Math.floor(Math.random() * 20) + 5,
            responseTime: Math.floor(Math.random() * 200) + 100,
            errorRate: Math.round((Math.random() * 1) * 100) / 100,
            systemLoad: Math.round((Math.random() * 30 + 20) * 100) / 100,
            memoryUsage: Math.round((Math.random() * 20 + 60) * 100) / 100
          }
        };
        
        res.write(`data: ${JSON.stringify(realtimeData)}\n\n`);
      } catch (streamError) {
        console.error('Error in real-time stream:', streamError);
        clearInterval(intervalId);
        res.end();
      }
    }, 10000);

    // Clean up on client disconnect
    req.on('close', () => {
      console.log('📴 Real-time analytics stream disconnected');
      clearInterval(intervalId);
      res.end();
    });

    req.on('error', (error) => {
      console.error('Real-time stream error:', error);
      clearInterval(intervalId);
      res.end();
    });

  } catch (error) {
    console.error('❌ Error starting real-time analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start real-time analytics stream',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/ai-intelligence - AI Training Intelligence analytics
router.get('/ai-intelligence', async (req, res) => {
  try {
    console.log('🤖 Getting AI Training Intelligence analytics');
    
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // AI Performance Prediction Analytics
    const predictionAnalytics = await generatePredictionAnalytics(startDate);
    
    // Adaptive Training Plan Metrics
    const adaptivePlanMetrics = await generateAdaptivePlanMetrics(startDate);
    
    // Injury Prevention Analytics
    const injuryPreventionData = await generateInjuryPreventionAnalytics(startDate);
    
    // AI Model Performance Metrics
    const modelPerformance = await getAIModelPerformance();
    
    // Training Intelligence Insights
    const intelligenceInsights = await generateTrainingIntelligenceInsights(startDate);

    const aiAnalytics = {
      predictions: predictionAnalytics,
      adaptivePlans: adaptivePlanMetrics,
      injuryPrevention: injuryPreventionData,
      modelPerformance: modelPerformance,
      insights: intelligenceInsights,
      timeframe,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: aiAnalytics
    });

  } catch (error) {
    console.error('❌ Error getting AI intelligence analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI intelligence analytics',
      error: error.message
    });
  }
});

// GET /api/admin/analytics/ai-real-time - Real-time AI intelligence metrics
router.get('/ai-real-time', authenticateEventSource, async (req, res) => {
  try {
    console.log('🔴 Starting real-time AI intelligence stream for user:', req.user.email);
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ 
      type: 'connected', 
      timestamp: new Date().toISOString(),
      message: 'Real-time AI intelligence stream connected'
    })}\n\n`);

    // Send real-time AI updates every 15 seconds
    const intervalId = setInterval(async () => {
      try {
        const realtimeAIData = {
          type: 'ai_update',
          timestamp: new Date().toISOString(),
          metrics: {
            activePredictions: Math.floor(Math.random() * 50) + 20,
            adaptivePlansGenerated: Math.floor(Math.random() * 10) + 5,
            injuryAlertsTriggered: Math.floor(Math.random() * 3),
            modelAccuracy: Math.round((Math.random() * 10 + 85) * 100) / 100, // 85-95%
            predictionLatency: Math.floor(Math.random() * 100) + 50, // 50-150ms
            systemLoad: Math.round((Math.random() * 20 + 15) * 100) / 100 // 15-35%
          }
        };
        
        res.write(`data: ${JSON.stringify(realtimeAIData)}\n\n`);
      } catch (streamError) {
        console.error('Error in AI real-time stream:', streamError);
        clearInterval(intervalId);
        res.end();
      }
    }, 15000);

    // Clean up on client disconnect
    req.on('close', () => {
      console.log('📴 Real-time AI intelligence stream disconnected');
      clearInterval(intervalId);
      res.end();
    });

    req.on('error', (error) => {
      console.error('AI real-time stream error:', error);
      clearInterval(intervalId);
      res.end();
    });

  } catch (error) {
    console.error('❌ Error starting real-time AI intelligence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start real-time AI intelligence stream',
      error: error.message
    });
  }
});

// Helper functions for new endpoints

async function getOverviewData() {
  // Reuse logic from existing /overview endpoint
  // This is a simplified version - in practice, you'd extract the logic into a shared function
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [totalUsers, totalWorkouts, totalSubscriptions] = await Promise.all([
    User.countDocuments({ active: true }),
    Workout.countDocuments(),
    UserSubscription.countDocuments({ status: 'active' })
  ]);

  return {
    totalUsers,
    totalWorkouts,
    totalSubscriptions,
    timestamp: now.toISOString()
  };
}

async function getUserAnalytics(period) {
  // Simplified user analytics for export
  const users = await User.find({ active: true })
    .select('firstName lastName email createdAt')
    .sort({ createdAt: -1 })
    .limit(1000);

  return {
    totalUsers: users.length,
    users: users.map(u => ({
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      joinDate: u.createdAt
    }))
  };
}

async function getWorkoutAnalytics(period) {
  // Simplified workout analytics for export
  const workouts = await Workout.find()
    .select('workoutType totalDistance duration createdAt')
    .sort({ createdAt: -1 })
    .limit(1000);

  return {
    totalWorkouts: workouts.length,
    workouts: workouts.map(w => ({
      type: w.workoutType,
      distance: w.totalDistance,
      duration: w.duration,
      date: w.createdAt
    }))
  };
}

async function getRevenueAnalytics(period) {
  // Simplified revenue analytics for export
  const payments = await PaymentHistory.find({ status: 'completed' })
    .select('amount createdAt')
    .sort({ createdAt: -1 })
    .limit(1000);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalRevenue: totalRevenue / 100, // Convert to euros
    paymentCount: payments.length,
    payments: payments.map(p => ({
      amount: p.amount / 100,
      date: p.createdAt
    }))
  };
}

async function getPerformanceMetrics() {
  // Return current performance snapshot for export
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: Math.round((Math.random() * 40 + 30) * 100) / 100,
      cores: os.cpus().length
    },
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      usage: Math.round((1 - os.freemem() / os.totalmem()) * 100)
    }
  };
}

async function generateErrorAnalytics(startDate) {
  // Mock error analytics - in production, this would query error logging system
  return {
    totalErrors: Math.floor(Math.random() * 50) + 10,
    criticalErrors: Math.floor(Math.random() * 5),
    warningErrors: Math.floor(Math.random() * 20) + 5,
    errorsByType: [
      { type: 'Database Timeout', count: Math.floor(Math.random() * 10) + 2 },
      { type: 'Authentication Failed', count: Math.floor(Math.random() * 8) + 1 },
      { type: 'Validation Error', count: Math.floor(Math.random() * 15) + 3 },
      { type: 'Network Error', count: Math.floor(Math.random() * 12) + 2 }
    ],
    errorTrend: Math.round((Math.random() * 20 - 10) * 100) / 100 // -10% to +10%
  };
}

function flattenForCSV(data) {
  // Utility function to flatten nested objects for CSV export
  const flattened = [];
  
  function flatten(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, flatten(obj[key], newKey));
        } else if (Array.isArray(obj[key])) {
          result[newKey] = obj[key].join('; ');
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    return result;
  }
  
  if (Array.isArray(data)) {
    data.forEach(item => flattened.push(flatten(item)));
  } else {
    flattened.push(flatten(data));
  }
  
  return flattened;
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// AI Intelligence Helper Functions

async function generatePredictionAnalytics(startDate) {
  // In production, this would query actual prediction data from the database
  const mockData = {
    totalPredictions: Math.floor(Math.random() * 1000) + 500,
    accuracyRate: Math.round((Math.random() * 10 + 85) * 100) / 100, // 85-95%
    raceTimePredictions: {
      total: Math.floor(Math.random() * 200) + 100,
      accurate: Math.floor(Math.random() * 180) + 90,
      averageError: Math.round((Math.random() * 30 + 15) * 100) / 100 // 15-45 seconds
    },
    fitnessProgressions: {
      total: Math.floor(Math.random() * 300) + 150,
      improved: Math.floor(Math.random() * 250) + 120,
      averageImprovement: Math.round((Math.random() * 15 + 5) * 100) / 100 // 5-20%
    },
    predictionsByType: [
      { type: '5K Race Time', count: Math.floor(Math.random() * 100) + 50, accuracy: 92.5 },
      { type: '10K Race Time', count: Math.floor(Math.random() * 80) + 40, accuracy: 89.8 },
      { type: 'Marathon Time', count: Math.floor(Math.random() * 60) + 30, accuracy: 87.2 },
      { type: 'VO2 Max', count: Math.floor(Math.random() * 150) + 75, accuracy: 94.1 },
      { type: 'Training Load', count: Math.floor(Math.random() * 200) + 100, accuracy: 91.7 }
    ],
    trends: {
      accuracy: Math.round((Math.random() * 4 + 1) * 100) / 100, // +1% to +5%
      volume: Math.round((Math.random() * 20 + 5) * 100) / 100, // +5% to +25%
      userSatisfaction: Math.round((Math.random() * 8 + 87) * 100) / 100 // 87-95%
    }
  };
  
  return mockData;
}

async function generateAdaptivePlanMetrics(startDate) {
  // In production, this would analyze actual adaptive plan data
  const mockData = {
    totalAdaptations: Math.floor(Math.random() * 500) + 250,
    successRate: Math.round((Math.random() * 15 + 80) * 100) / 100, // 80-95%
    adaptationTypes: [
      { type: 'Intensity Adjustment', count: Math.floor(Math.random() * 150) + 75, successRate: 88.5 },
      { type: 'Volume Modification', count: Math.floor(Math.random() * 120) + 60, successRate: 91.2 },
      { type: 'Rest Day Addition', count: Math.floor(Math.random() * 80) + 40, successRate: 95.3 },
      { type: 'Cross Training', count: Math.floor(Math.random() * 60) + 30, successRate: 82.7 },
      { type: 'Recovery Focus', count: Math.floor(Math.random() * 100) + 50, successRate: 93.8 }
    ],
    userEngagement: {
      planCompletionRate: Math.round((Math.random() * 20 + 75) * 100) / 100, // 75-95%
      feedbackProvided: Math.round((Math.random() * 30 + 60) * 100) / 100, // 60-90%
      planSatisfaction: Math.round((Math.random() * 15 + 80) * 100) / 100 // 80-95%
    },
    performanceOutcomes: {
      improvedPerformance: Math.round((Math.random() * 25 + 65) * 100) / 100, // 65-90%
      reducedInjuries: Math.round((Math.random() * 20 + 70) * 100) / 100, // 70-90%
      increasedMotivation: Math.round((Math.random() * 30 + 65) * 100) / 100 // 65-95%
    },
    algorithmEfficiency: {
      avgProcessingTime: Math.floor(Math.random() * 200) + 100, // 100-300ms
      cpuUsage: Math.round((Math.random() * 15 + 10) * 100) / 100, // 10-25%
      memoryUsage: Math.round((Math.random() * 20 + 30) * 100) / 100 // 30-50%
    }
  };
  
  return mockData;
}

async function generateInjuryPreventionAnalytics(startDate) {
  // In production, this would analyze actual injury prevention data
  const mockData = {
    totalAlertsGenerated: Math.floor(Math.random() * 200) + 100,
    preventedInjuries: Math.floor(Math.random() * 50) + 25,
    alertAccuracy: Math.round((Math.random() * 15 + 75) * 100) / 100, // 75-90%
    riskFactors: [
      { factor: 'Overtraining', alerts: Math.floor(Math.random() * 50) + 25, prevented: Math.floor(Math.random() * 15) + 8 },
      { factor: 'Insufficient Recovery', alerts: Math.floor(Math.random() * 40) + 20, prevented: Math.floor(Math.random() * 12) + 6 },
      { factor: 'Rapid Load Increase', alerts: Math.floor(Math.random() * 35) + 18, prevented: Math.floor(Math.random() * 10) + 5 },
      { factor: 'Muscle Imbalance', alerts: Math.floor(Math.random() * 30) + 15, prevented: Math.floor(Math.random() * 8) + 4 },
      { factor: 'Poor Sleep Quality', alerts: Math.floor(Math.random() * 25) + 12, prevented: Math.floor(Math.random() * 6) + 3 }
    ],
    interventionSuccess: {
      planModifications: Math.round((Math.random() * 20 + 75) * 100) / 100, // 75-95%
      restRecommendations: Math.round((Math.random() * 25 + 70) * 100) / 100, // 70-95%
      exerciseCorrections: Math.round((Math.random() * 15 + 80) * 100) / 100, // 80-95%
      medicalReferrals: Math.round((Math.random() * 30 + 60) * 100) / 100 // 60-90%
    },
    userCompliance: {
      followedRecommendations: Math.round((Math.random() * 25 + 65) * 100) / 100, // 65-90%
      providedFeedback: Math.round((Math.random() * 20 + 70) * 100) / 100, // 70-90%
      completedAssessments: Math.round((Math.random() * 30 + 60) * 100) / 100 // 60-90%
    },
    injuryReduction: {
      comparedToPrevious: Math.round((Math.random() * 25 + 15) * 100) / 100, // 15-40% reduction
      costSavings: Math.floor(Math.random() * 5000) + 2000, // €2000-7000 estimated savings
      userSatisfaction: Math.round((Math.random() * 20 + 75) * 100) / 100 // 75-95%
    }
  };
  
  return mockData;
}

async function getAIModelPerformance() {
  // In production, this would query actual model performance metrics
  const mockData = {
    models: [
      {
        name: 'Race Time Predictor',
        version: '2.3.1',
        accuracy: Math.round((Math.random() * 8 + 87) * 100) / 100, // 87-95%
        latency: Math.floor(Math.random() * 50) + 75, // 75-125ms
        throughput: Math.floor(Math.random() * 200) + 300, // 300-500 predictions/min
        memoryUsage: Math.round((Math.random() * 200 + 512) * 100) / 100, // 512-712MB
        lastTrained: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Adaptive Plan Generator',
        version: '1.8.5',
        accuracy: Math.round((Math.random() * 10 + 82) * 100) / 100, // 82-92%
        latency: Math.floor(Math.random() * 100) + 150, // 150-250ms
        throughput: Math.floor(Math.random() * 100) + 150, // 150-250 adaptations/min
        memoryUsage: Math.round((Math.random() * 300 + 768) * 100) / 100, // 768-1068MB
        lastTrained: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Injury Risk Analyzer',
        version: '3.1.2',
        accuracy: Math.round((Math.random() * 12 + 78) * 100) / 100, // 78-90%
        latency: Math.floor(Math.random() * 75) + 50, // 50-125ms
        throughput: Math.floor(Math.random() * 400) + 500, // 500-900 analyses/min
        memoryUsage: Math.round((Math.random() * 150 + 384) * 100) / 100, // 384-534MB
        lastTrained: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    systemMetrics: {
      totalInferences: Math.floor(Math.random() * 10000) + 5000,
      avgResponseTime: Math.floor(Math.random() * 50) + 100, // 100-150ms
      errorRate: Math.round((Math.random() * 2 + 0.5) * 100) / 100, // 0.5-2.5%
      resourceUtilization: {
        cpu: Math.round((Math.random() * 20 + 25) * 100) / 100, // 25-45%
        memory: Math.round((Math.random() * 25 + 55) * 100) / 100, // 55-80%
        gpu: Math.round((Math.random() * 30 + 40) * 100) / 100 // 40-70%
      }
    },
    trainingMetrics: {
      lastRetraining: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      datasetSize: Math.floor(Math.random() * 50000) + 100000, // 100k-150k samples
      trainingTime: Math.floor(Math.random() * 120) + 180, // 180-300 minutes
      validationScore: Math.round((Math.random() * 15 + 80) * 100) / 100 // 80-95%
    }
  };
  
  return mockData;
}

async function generateTrainingIntelligenceInsights(startDate) {
  // In production, this would generate actual insights from data analysis
  const mockData = {
    keyInsights: [
      {
        category: 'Performance',
        insight: 'Lietotāji ar adaptīviem treniņu plāniem uzrāda 23% labākus rezultātus',
        impact: 'high',
        confidence: 0.89,
        affectedUsers: Math.floor(Math.random() * 500) + 200
      },
      {
        category: 'Injury Prevention',
        insight: 'Sistemātiska atpūtas monitorēšana samazina traumu risku par 35%',
        impact: 'high',
        confidence: 0.92,
        affectedUsers: Math.floor(Math.random() * 300) + 150
      },
      {
        category: 'User Engagement',
        insight: 'AI ieteikumi palielina treniņu plānu izpildes līmeni par 18%',
        impact: 'medium',
        confidence: 0.85,
        affectedUsers: Math.floor(Math.random() * 800) + 400
      },
      {
        category: 'Prediction Accuracy',
        insight: 'Sacensību laiku prognozes precizitāte uzlabojusies par 12% pēdējās 6 nedēļās',
        impact: 'medium',
        confidence: 0.91,
        affectedUsers: Math.floor(Math.random() * 200) + 100
      }
    ],
    recommendations: [
      {
        title: 'Paplašināt adaptīvo plānu algoritmu',
        description: 'Integrēt papildu biomarkerus labākai personalizācijai',
        priority: 'high',
        estimatedImpact: '+15% performance improvement',
        implementationTime: '2-3 nedēļas'
      },
      {
        title: 'Uzlabot traumu prevencijas modeli',
        description: 'Pievienot miega kvalitātes un stresa līmeņa faktorus',
        priority: 'high',
        estimatedImpact: '+20% injury reduction',
        implementationTime: '3-4 nedēļas'
      },
      {
        title: 'Optimizēt modeļu veiktspēju',
        description: 'Samazināt atbildes laiku un resursu patēriņu',
        priority: 'medium',
        estimatedImpact: '+30% processing speed',
        implementationTime: '1-2 nedēļas'
      }
    ],
    trendAnalysis: {
      userAdoption: {
        trend: 'increasing',
        rate: Math.round((Math.random() * 15 + 5) * 100) / 100, // +5% to +20%
        description: 'Pieaugošs AI funkciju izmantojums'
      },
      modelAccuracy: {
        trend: 'stable',
        rate: Math.round((Math.random() * 3 + 1) * 100) / 100, // +1% to +4%
        description: 'Stabila un uzlabojoša precizitāte'
      },
      systemLoad: {
        trend: 'increasing',
        rate: Math.round((Math.random() * 10 + 5) * 100) / 100, // +5% to +15%
        description: 'Pieaugošā slodze prasa optimizāciju'
      }
    }
  };
  
  return mockData;
}

export default router;