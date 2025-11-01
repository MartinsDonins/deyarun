// User Statistics Routes - For Dashboard
import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';

const router = express.Router();

// GET /api/user/stats - Get user training statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Fetch real user workouts from database
    const userWorkouts = await Workout.find({ 
      userId: userId,
      status: 'completed' 
    }).sort({ startedAt: -1 });

    // Calculate real statistics
    const totalWorkouts = userWorkouts.length;
    const totalDistance = userWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0); // in meters
    const totalTime = userWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0); // in seconds
    
    // Calculate average pace (minutes per km)
    let avgPace = 0;
    if (totalDistance > 0 && totalTime > 0) {
      // Convert: (seconds / meters) * 1000 * (1 min / 60 sec) = minutes per km
      avgPace = (totalTime / (totalDistance / 1000)) / 60;
    }

    // Calculate weekly progress
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeekWorkouts = userWorkouts.filter(w => new Date(w.startedAt) >= oneWeekAgo);
    const weeklyDistance = thisWeekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const weeklyGoal = req.user.weeklyGoal || 25000; // default 25km in meters
    const weeklyProgress = weeklyGoal > 0 ? (weeklyDistance / weeklyGoal) * 100 : 0;

    // Calculate streak days
    let streakDays = 0;
    if (userWorkouts.length > 0) {
      const workoutDates = [...new Set(userWorkouts.map(w => 
        new Date(w.startedAt).toDateString()
      ))].sort((a, b) => new Date(b) - new Date(a));
      
      const today = new Date().toDateString();
      let currentDate = new Date();
      
      for (let i = 0; i < workoutDates.length; i++) {
        const workoutDate = new Date(workoutDates[i]);
        const diffDays = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          streakDays++;
          currentDate = workoutDate;
        } else {
          break;
        }
      }
    }

    const realStats = {
      totalDistance: Math.round(totalDistance), // in meters
      totalWorkouts: totalWorkouts,
      avgPace: Math.round(avgPace * 100) / 100, // rounded to 2 decimals
      weeklyGoal: Math.round(weeklyGoal),
      weeklyProgress: Math.round(weeklyProgress * 100) / 100,
      streakDays: streakDays,
      totalTime: Math.round(totalTime / 60), // convert to minutes
      favoriteDistance: '5K', // could be calculated from most common distance
      isRealData: totalWorkouts > 0
    };

    console.log(`User ${userId} stats:`, {
      totalWorkouts: realStats.totalWorkouts,
      totalDistance: realStats.totalDistance,
      avgPace: realStats.avgPace
    });

    res.json({
      success: true,
      data: {
        stats: realStats
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error.message
    });
  }
});

// GET /api/workouts/recent - Get recent workouts
router.get('/workouts/recent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 5;
    
    // Fetch real recent workouts from database
    const recentWorkouts = await Workout.find({ 
      userId: userId,
      status: 'completed' 
    })
    .sort({ startedAt: -1 })
    .limit(limit)
    .select('name type distance duration startedAt avgPace calories source externalData');

    console.log(`Found ${recentWorkouts.length} recent workouts for user ${userId}`);

    res.json({
      success: true,
      data: {
        workouts: recentWorkouts
      }
    });

  } catch (error) {
    console.error('Error fetching recent workouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent workouts',
      message: error.message
    });
  }
});


// GET /api/user/goals - Get user goals
router.get('/goals', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Mock goals data - in real app would fetch from database
    const userGoals = {
      weeklyDistanceGoal: req.user.weeklyGoal ? Math.round(req.user.weeklyGoal / 1000) : 25, // convert meters to km
      monthlyDistanceGoal: req.user.monthlyGoal ? Math.round(req.user.monthlyGoal / 1000) : 100,
      targetRace: req.user.targetRace || null,
      goals: [
        {
          id: 1,
          type: 'distance',
          title: 'Weekly Distance',
          target: req.user.weeklyGoal ? Math.round(req.user.weeklyGoal / 1000) : 25,
          unit: 'km',
          current: 0,
          progress: 0
        },
        {
          id: 2,
          type: 'distance', 
          title: 'Monthly Distance',
          target: req.user.monthlyGoal ? Math.round(req.user.monthlyGoal / 1000) : 100,
          unit: 'km',
          current: 0,
          progress: 0
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: userGoals
    });

  } catch (error) {
    console.error('Error fetching user goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user goals',
      message: error.message
    });
  }
});

// POST /api/user/goals - Update user goals
router.post('/goals', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { weeklyDistanceGoal, monthlyDistanceGoal, targetRace } = req.body;
    
    // Mock goal update - in real app would save to database
    const updatedGoals = {
      weeklyDistanceGoal: weeklyDistanceGoal || 25,
      monthlyDistanceGoal: monthlyDistanceGoal || 100,
      targetRace: targetRace || null,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Goals updated successfully',
      data: {
        goals: updatedGoals
      }
    });

  } catch (error) {
    console.error('Error updating user goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update goals',
      message: error.message
    });
  }
});

// GET /api/user/progress/weekly - Get weekly progress
router.get('/progress/weekly', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Fetch user workouts for weekly progress
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = await Workout.find({ 
      userId: userId,
      status: 'completed',
      startedAt: { $gte: oneWeekAgo }
    }).sort({ startedAt: -1 });

    const weeklyDistance = weeklyWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const weeklyGoal = req.user.weeklyGoal || 25000; // default 25km in meters
    const weeklyProgress = weeklyGoal > 0 ? (weeklyDistance / weeklyGoal) * 100 : 0;

    // Create daily breakdown
    const dailyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayWorkouts = weeklyWorkouts.filter(w => 
        new Date(w.startedAt).toDateString() === date.toDateString()
      );
      const dayDistance = dayWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
      
      dailyProgress.push({
        date: date.toISOString().split('T')[0],
        distance: Math.round(dayDistance),
        workouts: dayWorkouts.length,
        avgPace: dayWorkouts.length > 0 ? 
          dayWorkouts.reduce((sum, w) => sum + (w.avgPace || 0), 0) / dayWorkouts.length : 0
      });
    }

    const progressData = {
      currentWeek: {
        distance: Math.round(weeklyDistance),
        goal: Math.round(weeklyGoal),
        progress: Math.round(weeklyProgress * 100) / 100,
        workouts: weeklyWorkouts.length,
        daysActive: [...new Set(weeklyWorkouts.map(w => 
          new Date(w.startedAt).toDateString()
        ))].length
      },
      dailyBreakdown: dailyProgress,
      summary: {
        avgDailyDistance: Math.round(weeklyDistance / 7),
        totalTime: Math.round(weeklyWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60),
        avgPace: weeklyWorkouts.length > 0 ? 
          Math.round((weeklyWorkouts.reduce((sum, w) => sum + (w.avgPace || 0), 0) / weeklyWorkouts.length) * 100) / 100 : 0
      }
    };

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly progress',
      message: error.message
    });
  }
});

// GET /api/user/achievements/recent - Get recent achievements
router.get('/achievements/recent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 5;
    
    // Mock achievements data - in real app would fetch from database
    const achievements = [
      {
        id: 1,
        title: 'First Run Complete',
        description: 'Completed your first workout',
        icon: '🏃‍♂️',
        type: 'milestone',
        earnedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        points: 10
      },
      {
        id: 2,
        title: '5K Runner',
        description: 'Completed a 5km run',
        icon: '🎯',
        type: 'distance',
        earnedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        points: 25
      },
      {
        id: 3,
        title: 'Consistency Champion',
        description: 'Ran 3 days in a row',
        icon: '🔥',
        type: 'streak',
        earnedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        points: 50
      }
    ];

    res.json({
      success: true,
      data: {
        achievements: achievements.slice(0, limit),
        totalAchievements: achievements.length,
        totalPoints: achievements.reduce((sum, a) => sum + a.points, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
      message: error.message
    });
  }
});

export default router;