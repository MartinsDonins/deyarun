// ✅ Leaderboard route - MongoDB Compatible
import express from 'express';
import { User, Workout, WorkoutAnalytics } from '../models/mongodb/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
console.log('✅ Leaderboard route enabled with MongoDB support');

// Simple weekly leaderboard for tests
router.get('/weekly', (req, res) => {
  res.json([]);
});

// Global leaderboard - top performers
router.get('/global', authMiddleware, async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Aggregate workout stats for leaderboard
    const leaderboard = await Workout.aggregate([
      {
        $match: {
          completedAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          workoutCount: { $sum: 1 },
          averagePace: { $avg: '$averagePace' },
          totalCalories: { $sum: '$calories' }
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
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          totalDistance: 1,
          totalDuration: 1,
          workoutCount: 1,
          averagePace: 1,
          totalCalories: 1,
          score: {
            $add: [
              { $multiply: ['$totalDistance', 0.01] }, // Distance points
              { $multiply: ['$workoutCount', 50] },    // Consistency points
              { $divide: [3600, { $ifNull: ['$averagePace', 600] }] } // Pace points
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      leaderboard,
      period,
      total: leaderboard.length
    });

  } catch (error) {
    console.error('Leaderboard global error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global leaderboard',
      message: error.message
    });
  }
});

// User's leaderboard position
router.get('/my-position', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get user's stats and position
    const userStats = await Workout.aggregate([
      {
        $match: {
          userId: userId,
          completedAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          workoutCount: { $sum: 1 },
          averagePace: { $avg: '$averagePace' },
          totalCalories: { $sum: '$calories' }
        }
      }
    ]);

    if (userStats.length === 0) {
      return res.json({
        success: true,
        position: null,
        stats: null,
        message: 'No workouts found for this period'
      });
    }

    const stats = userStats[0];
    const score = (stats.totalDistance * 0.01) + (stats.workoutCount * 50) + (3600 / (stats.averagePace || 600));

    // Count users with better scores
    const betterUsers = await Workout.aggregate([
      {
        $match: {
          completedAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$distance' },
          workoutCount: { $sum: 1 },
          averagePace: { $avg: '$averagePace' }
        }
      },
      {
        $project: {
          score: {
            $add: [
              { $multiply: ['$totalDistance', 0.01] },
              { $multiply: ['$workoutCount', 50] },
              { $divide: [3600, { $ifNull: ['$averagePace', 600] }] }
            ]
          }
        }
      },
      {
        $match: {
          score: { $gt: score }
        }
      },
      {
        $count: 'betterUsers'
      }
    ]);

    const position = (betterUsers[0]?.betterUsers || 0) + 1;

    res.json({
      success: true,
      position,
      stats: {
        totalDistance: stats.totalDistance,
        totalDuration: stats.totalDuration,
        workoutCount: stats.workoutCount,
        averagePace: stats.averagePace,
        totalCalories: stats.totalCalories,
        score: Math.round(score)
      },
      period
    });

  } catch (error) {
    console.error('Leaderboard position error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user position',
      message: error.message
    });
  }
});
export default router;