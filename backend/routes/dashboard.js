import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { User, Workout } from '../models/mongodb/index.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    console.log(`📊 Getting dashboard stats for user ${req.user.userId}`);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // If user is admin/coach, get global stats, otherwise get personal stats
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'coach';
    
    let stats;
    
    if (isAdmin) {
      // Global statistics for admins
      stats = await getGlobalStats(now, thirtyDaysAgo, sixtyDaysAgo);
    } else {
      // Personal statistics for regular users
      stats = await getPersonalStats(req.user.userId, now, thirtyDaysAgo, sixtyDaysAgo);
    }

    console.log(`✅ Generated ${isAdmin ? 'global' : 'personal'} dashboard stats`);
    
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
});

// GET /api/dashboard/recent-activity - Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    console.log(`📋 Getting recent activity for user ${req.user.userId}`);
    
    const { limit = 10 } = req.query;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'coach';
    
    let workouts;
    
    if (isAdmin) {
      // Get recent workouts from all users for admins
      workouts = await Workout.find({ 
        status: 'completed'
      })
        .sort({ finishedAt: -1 })
        .limit(parseInt(limit))
        .populate('userId', 'firstName lastName')
        .select('type distance duration finishedAt userId')
        .lean();
    } else {
      // Get user's own recent workouts
      workouts = await Workout.find({ 
        userId: req.user.userId,
        status: 'completed'
      })
        .sort({ finishedAt: -1 })
        .limit(parseInt(limit))
        .select('type distance duration finishedAt')
        .lean();
    }

    const activities = workouts.map(workout => {
      const timeAgo = getTimeAgo(new Date(workout.finishedAt));
      const distance = (workout.distance / 1000).toFixed(1);
      
      let description, value;
      
      if (isAdmin && workout.userId) {
        description = `${workout.userId.firstName} ${workout.userId.lastName} pabeidza ${distance}km ${getWorkoutTypeName(workout.type)}`;
        value = `${distance}km`;
      } else {
        description = `Jūs pabeigāt ${distance}km ${getWorkoutTypeName(workout.type)}`;
        value = `${distance}km`;
      }

      return {
        id: workout._id,
        description,
        value,
        timestamp: workout.finishedAt,
        timeAgo
      };
    });

    console.log(`✅ Found ${activities.length} recent activities`);
    
    res.json({
      success: true,
      activities
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

// Helper function to get global statistics (for admins)
async function getGlobalStats(now, thirtyDaysAgo, sixtyDaysAgo) {
  // Total users
  const totalUsers = await User.countDocuments();
  
  // Active users (logged in last 30 days)
  const activeUsers = await User.countDocuments({
    lastLoginAt: { $gte: thirtyDaysAgo }
  });
  
  // Previous month active users for trend calculation
  const prevActiveUsers = await User.countDocuments({
    lastLoginAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
  });

  // Total workouts
  const totalWorkouts = await Workout.countDocuments({ status: 'completed' });
  
  // Recent workouts (last 30 days)
  const recentWorkouts = await Workout.countDocuments({
    status: 'completed',
    finishedAt: { $gte: thirtyDaysAgo }
  });
  
  // Previous month workouts
  const prevWorkouts = await Workout.countDocuments({
    status: 'completed',
    finishedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
  });

  // Total distance and pace calculations
  const distanceAgg = await Workout.aggregate([
    { $match: { status: 'completed', distance: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        totalDistance: { $sum: '$distance' },
        avgPace: { $avg: '$averagePace' },
        count: { $sum: 1 }
      }
    }
  ]);

  const recentDistanceAgg = await Workout.aggregate([
    { 
      $match: { 
        status: 'completed', 
        distance: { $gt: 0 },
        finishedAt: { $gte: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: null,
        totalDistance: { $sum: '$distance' },
        avgPace: { $avg: '$averagePace' }
      }
    }
  ]);

  const prevDistanceAgg = await Workout.aggregate([
    { 
      $match: { 
        status: 'completed', 
        distance: { $gt: 0 },
        finishedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: null,
        totalDistance: { $sum: '$distance' },
        avgPace: { $avg: '$averagePace' }
      }
    }
  ]);

  const totalDistance = distanceAgg[0]?.totalDistance || 0;
  const averagePace = distanceAgg[0]?.avgPace || 0;
  const recentDistance = recentDistanceAgg[0]?.totalDistance || 0;
  const prevDistance = prevDistanceAgg[0]?.totalDistance || 1; // Avoid division by zero

  // Calculate trends
  const activeUsersTrend = prevActiveUsers > 0 ? 
    Math.round(((activeUsers - prevActiveUsers) / prevActiveUsers) * 100) : 0;
  const workoutsTrend = prevWorkouts > 0 ? 
    Math.round(((recentWorkouts - prevWorkouts) / prevWorkouts) * 100) : 0;
  const distanceTrend = prevDistance > 0 ? 
    Math.round(((recentDistance - prevDistance) / prevDistance) * 100) : 0;

  return {
    activeUsers,
    totalWorkouts,
    totalDistance: Math.round(totalDistance), // in meters
    averagePace: formatPace(averagePace),
    trends: {
      activeUsers: activeUsersTrend,
      totalWorkouts: workoutsTrend,
      totalDistance: distanceTrend,
      averagePace: 0 // Pace trend calculation is more complex, set to 0 for now
    }
  };
}

// Helper function to get personal statistics (for regular users)
async function getPersonalStats(userId, now, thirtyDaysAgo, sixtyDaysAgo) {
  // Get user's workouts
  const userWorkouts = await Workout.find({
    userId,
    status: 'completed'
  }).lean();

  const recentWorkouts = userWorkouts.filter(w => 
    new Date(w.finishedAt) >= thirtyDaysAgo
  );
  
  const prevWorkouts = userWorkouts.filter(w => {
    const finishedAt = new Date(w.finishedAt);
    return finishedAt >= sixtyDaysAgo && finishedAt < thirtyDaysAgo;
  });

  // Calculate totals
  const totalWorkouts = userWorkouts.length;
  const totalDistance = userWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
  
  const recentDistance = recentWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
  const prevDistance = prevWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0) || 1;

  // Calculate average pace (weighted by distance)
  let totalWeightedPace = 0;
  let totalPaceDistance = 0;
  userWorkouts.forEach(w => {
    if (w.averagePace && w.distance > 0) {
      totalWeightedPace += w.averagePace * w.distance;
      totalPaceDistance += w.distance;
    }
  });
  const averagePace = totalPaceDistance > 0 ? totalWeightedPace / totalPaceDistance : 0;

  // Calculate trends
  const workoutsTrend = prevWorkouts.length > 0 ? 
    Math.round(((recentWorkouts.length - prevWorkouts.length) / prevWorkouts.length) * 100) : 0;
  const distanceTrend = prevDistance > 0 ? 
    Math.round(((recentDistance - prevDistance) / prevDistance) * 100) : 0;

  return {
    activeUsers: 1, // Personal view - just the user
    totalWorkouts,
    totalDistance: Math.round(totalDistance),
    averagePace: formatPace(averagePace),
    trends: {
      activeUsers: 0, // Not relevant for personal stats
      totalWorkouts: workoutsTrend,
      totalDistance: distanceTrend,
      averagePace: 0 // Complex calculation, set to 0 for now
    }
  };
}

// Helper functions
function formatPace(paceInMinutes) {
  if (!paceInMinutes || paceInMinutes <= 0) return '0:00';
  const minutes = Math.floor(paceInMinutes);
  const seconds = Math.round((paceInMinutes - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `Pirms ${diffMins} minūtēm`;
  } else if (diffHours < 24) {
    return `Pirms ${diffHours} stundām`;
  } else {
    return `Pirms ${diffDays} dienām`;
  }
}

function getWorkoutTypeName(type) {
  const types = {
    'running': 'skrējienu',
    'walking': 'pastaiga',
    'cycling': 'braucienu ar velosipēdu',
    'other': 'treniņu'
  };
  return types[type] || 'treniņu';
}

export default router;