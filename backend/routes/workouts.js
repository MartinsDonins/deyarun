import express from 'express';
import mongoose from 'mongoose';
// 🎯 FIX: Update import path to match your structure
import { Workout, GpsPoint, User } from '../models/mongodb/index.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { 
  addSubscriptionInfo, 
  getSubscriptionStatus, 
  checkWorkoutLimit, 
  checkDataRetentionAccess, 
  addUsageInfo,
  requirePremium
} from '../middleware/subscriptionMiddleware.js';
import GPSProcessingService from '../services/gpsProcessingService.js';
import emailService from '../services/emailService.js';
// import { prisma } from '../config/database.js'; // REMOVED: Migrated to MongoDB

const router = express.Router();

// Helper functions for email formatting
function formatDuration(seconds) {
  if (!seconds) return '0:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatPace(paceInMinPerKm) {
  if (!paceInMinPerKm) return 'N/A';
  const minutes = Math.floor(paceInMinPerKm);
  const seconds = Math.round((paceInMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// All workout routes require authentication and subscription info
router.use(authenticateToken);
router.use(addSubscriptionInfo);

// POST /api/workouts/start - Start new workout (with monthly limits)
// POST /api/workouts/create - Create custom workout plan (optimized for mobile)
router.post('/create', checkWorkoutLimit, addUsageInfo, async (req, res) => {
  try {
    console.log('🎯 Creating custom workout for user:', req.user.userId);
    
    const { workoutType, title, description, distance, duration, targetPace } = req.body;
    
    // Validate required fields
    if (!workoutType || !title) {
      return res.status(400).json({
        success: false,
        message: 'Workout type and title are required'
      });
    }
    
    // Create custom workout plan
    const workout = new Workout({
      userId: req.user.userId,
      type: 'custom',
      workoutType: workoutType,
      name: title,
      description: description || `${workoutType} workout`,
      targetDistance: distance ? parseFloat(distance) : null,
      targetDuration: duration ? parseInt(duration) : null,
      targetPace: targetPace ? parseFloat(targetPace) : null,
      status: 'planned',
      startedAt: new Date(),
      duration: 0,
      distance: 0,
      route: {
        type: 'LineString',
        coordinates: []
      }
    });

    await workout.save();
    
    console.log('✅ Custom workout created:', workout._id);
    
    res.status(201).json({
      success: true,
      message: 'Custom workout created successfully',
      workout: {
        id: workout._id,
        type: workout.type,
        workoutType: workout.workoutType,
        name: workout.name,
        description: workout.description,
        targetDistance: workout.targetDistance,
        targetDuration: workout.targetDuration,
        targetPace: workout.targetPace,
        status: workout.status,
        createdAt: workout.startedAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating custom workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom workout',
      error: error.message
    });
  }
});

// POST /api/workouts/start - Start new workout (with monthly limits)
router.post('/start', checkWorkoutLimit, addUsageInfo, async (req, res) => {
  try {
    console.log('🔍 DEBUG - Auth user object:', req.user);
    console.log('🔍 DEBUG - Request body:', req.body);
    console.log('🏃‍♂️ Starting new workout for user:', req.user.userId);
    
    const { startTime, type = 'running', status = 'in_progress' } = req.body;
    
    // Create new workout in MongoDB
    // DO NOT set startLocation or endLocation to null - just omit them
    const workout = new Workout({
      userId: req.user.userId,
      type,
      status,
      startedAt: startTime || new Date(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`,
      duration: 0,
      distance: 0,
      averagePace: null,
      bestPace: null,
      calories: null,
      route: {
        type: 'LineString',
        coordinates: []
      }
      // startLocation and endLocation are omitted - will be undefined
    });

    await workout.save();
    
    console.log('✅ Workout created:', workout._id);
    
    res.status(201).json({
      success: true,
      message: 'Workout started successfully',
      workout: {
        id: workout._id,
        type: workout.type,
        name: workout.name,
        status: workout.status,
        startedAt: workout.startedAt
      }
    });
  } catch (error) {
    console.error('❌ Error starting workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start workout',
      error: error.message
    });
  }
});

// PUT /api/workouts/:id/gps - Stream GPS point (real-time)
router.put('/:id/gps', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      latitude, 
      longitude, 
      timestamp, 
      altitude, 
      accuracy, 
      speed, 
      heading, 
      elapsedTime, 
      heartRate, 
      distance 
    } = req.body;
    
    console.log(`📍 Streaming GPS point for workout ${id}`);
    
    if (!latitude || !longitude || !timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, and timestamp are required'
      });
    }

    // Find the workout
    const workout = await Workout.findById(id);
    if (!workout || workout.userId !== req.user.userId) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    if (workout.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Workout is not in progress'
      });
    }

    // Create GPS point
    const gpsPoint = new GpsPoint({
      workoutId: id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      timestamp: new Date(timestamp),
      elapsedTime: elapsedTime || Math.floor((new Date(timestamp).getTime() - new Date(workout.startedAt).getTime()) / 1000),
      altitude: altitude || null,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
      heartRate: heartRate || null,
      distance: distance || 0
    });

    await gpsPoint.save();
    
    console.log(`✅ Saved GPS point for workout ${id}`);
    
    res.json({
      success: true,
      message: 'GPS point saved',
      point: {
        latitude,
        longitude,
        timestamp,
        elapsedTime: gpsPoint.elapsedTime
      }
    });
  } catch (error) {
    console.error('❌ Error saving GPS point:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save GPS point',
      error: error.message
    });
  }
});

// POST /api/workouts/:id/gps - Save GPS points (batch)
router.post('/:id/gps', async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;
    
    console.log(`📍 Saving ${points?.length || 0} GPS points for workout ${id}`);
    
    if (!points || !Array.isArray(points)) {
      return res.status(400).json({
        success: false,
        message: 'Points array is required'
      });
    }

    // Find the workout
    const workout = await Workout.findById(id);
    if (!workout || workout.userId !== req.user.userId) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    // Save GPS points
    const gpsPoints = points.map(point => ({
      workoutId: id,
      location: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude]
      },
      timestamp: new Date(point.timestamp),
      elapsedTime: Math.floor((point.timestamp - new Date(workout.startedAt).getTime()) / 1000),
      altitude: point.altitude || null,
      accuracy: point.accuracy || null,
      speed: point.speed || null,
      heading: point.heading || null,
      heartRate: point.heartRate || null,
      distance: point.distance || 0
    }));

    await GpsPoint.insertMany(gpsPoints);
    
    console.log(`✅ Saved ${gpsPoints.length} GPS points for workout ${id}`);
    
    res.json({
      success: true,
      message: `Saved ${gpsPoints.length} GPS points`,
      pointsCount: gpsPoints.length
    });
  } catch (error) {
    console.error('❌ Error saving GPS points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save GPS points',
      error: error.message
    });
  }
});

// PUT /api/workouts/:id/metrics - Update real-time metrics
router.put('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      distance, 
      duration, 
      currentPace, 
      averagePace, 
      heartRate, 
      calories, 
      elevationGain,
      speed 
    } = req.body;
    
    console.log(`📊 Updating metrics for workout ${id}`);
    
    // Find the workout
    const workout = await Workout.findById(id);
    if (!workout || workout.userId !== req.user.userId) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    if (workout.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Workout is not in progress'
      });
    }

    // Update workout metrics
    const updateData = {};
    if (distance !== undefined) updateData.distance = distance;
    if (duration !== undefined) updateData.duration = duration;
    if (averagePace !== undefined) updateData.averagePace = averagePace;
    if (calories !== undefined) updateData.calories = calories;
    if (elevationGain !== undefined) updateData.elevationGain = elevationGain;
    
    // Update heart rate data
    if (heartRate !== undefined) {
      if (!workout.maxHeartRate || heartRate > workout.maxHeartRate) {
        updateData.maxHeartRate = heartRate;
      }
      
      // Calculate running average heart rate
      const currentAvg = workout.averageHeartRate || heartRate;
      updateData.averageHeartRate = Math.round((currentAvg + heartRate) / 2);
    }

    const updatedWorkout = await Workout.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    console.log(`✅ Updated metrics for workout ${id}`);
    
    res.json({
      success: true,
      message: 'Metrics updated',
      metrics: {
        distance: updatedWorkout.distance,
        duration: updatedWorkout.duration,
        averagePace: updatedWorkout.averagePace,
        currentPace,
        heartRate: updatedWorkout.averageHeartRate,
        maxHeartRate: updatedWorkout.maxHeartRate,
        calories: updatedWorkout.calories,
        elevationGain: updatedWorkout.elevationGain
      }
    });
  } catch (error) {
    console.error('❌ Error updating metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update metrics',
      error: error.message
    });
  }
});

// PUT /api/workouts/:id/pause - Pause workout
router.put('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`⏸️ Pausing workout ${id}`);
    
    const workout = await Workout.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { status: 'paused' },
      { new: true }
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    console.log(`✅ Workout ${id} paused`);
    
    res.json({
      success: true,
      message: 'Workout paused',
      workout: {
        id: workout._id,
        status: workout.status
      }
    });
  } catch (error) {
    console.error('❌ Error pausing workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause workout',
      error: error.message
    });
  }
});

// PUT /api/workouts/:id/resume - Resume workout
router.put('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`▶️ Resuming workout ${id}`);
    
    const workout = await Workout.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { status: 'in_progress' },
      { new: true }
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    console.log(`✅ Workout ${id} resumed`);
    
    res.json({
      success: true,
      message: 'Workout resumed',
      workout: {
        id: workout._id,
        status: workout.status
      }
    });
  } catch (error) {
    console.error('❌ Error resuming workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume workout',
      error: error.message
    });
  }
});

// PUT /api/workouts/:id/complete - Complete workout with GPS processing
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      endTime, 
      duration, 
      calories, 
      effortLevel,
      mood,
      notes 
    } = req.body;
    
    console.log(`🏁 Completing workout ${id} with GPS processing`);
    
    // Find the workout
    const workout = await Workout.findOne({ _id: id, userId: req.user.userId });
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    // Process GPS data to get accurate metrics
    const gpsProcessingResult = await GPSProcessingService.processWorkoutGPS(id);
    
    let updateData = {
      status: 'completed',
      finishedAt: endTime || new Date(),
      duration: duration || workout.duration,
      calories: calories || workout.calories,
      effortLevel: effortLevel || workout.effortLevel,
      notes: notes || workout.notes
    };

    // Update mood if provided
    if (mood) {
      updateData['mood.post'] = mood;
    }

    // If GPS processing was successful, use those metrics
    if (gpsProcessingResult) {
      updateData = {
        ...updateData,
        distance: gpsProcessingResult.totalDistance,
        averagePace: gpsProcessingResult.averagePace,
        bestPace: gpsProcessingResult.bestPace,
        elevationGain: gpsProcessingResult.elevationGain,
        elevationLoss: gpsProcessingResult.elevationLoss,
        route: gpsProcessingResult.route
      };

      // Set start/end locations from processed route
      if (gpsProcessingResult.route.coordinates.length > 0) {
        updateData.startLocation = {
          type: 'Point',
          coordinates: gpsProcessingResult.route.coordinates[0]
        };
        updateData.endLocation = {
          type: 'Point',
          coordinates: gpsProcessingResult.route.coordinates[gpsProcessingResult.route.coordinates.length - 1]
        };
      }
    }

    const updatedWorkout = await Workout.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    console.log(`✅ Workout ${id} completed with GPS processing:`, {
      distance: updatedWorkout.distance,
      avgPace: updatedWorkout.averagePace,
      elevation: `+${updatedWorkout.elevationGain || 0}m/-${updatedWorkout.elevationLoss || 0}m`
    });

    // Send workout summary email (async - don't wait for it)
    try {
      // Find user by postgresId (for migration compatibility) or _id
      const user = await User.findOne({
        $or: [
          { postgresId: req.user.userId.toString() },
          { _id: req.user.userId }
        ]
      }).select('firstName email notificationsEnabled');

      if (user && user.notificationsEnabled) {
        // Format data for email template
        const workoutData = {
          firstName: user.firstName,
          workoutId: updatedWorkout._id.toString(),
          date: updatedWorkout.finishedAt.toLocaleDateString('lv-LV'),
          distance: (updatedWorkout.distance / 1000).toFixed(2), // Convert to km
          duration: formatDuration(updatedWorkout.duration),
          pace: formatPace(updatedWorkout.averagePace),
          calories: updatedWorkout.calories || 'N/A',
          avgHeartRate: updatedWorkout.averageHeartRate || 'N/A',
          elevation: updatedWorkout.elevationGain || 0,
          achievements: [] // TODO: Check for new achievements
        };

        emailService.sendWorkoutSummaryEmail(user.email, workoutData).catch(error => {
          console.error('Workout summary email failed:', error);
        });
      }
    } catch (emailError) {
      console.error('Error preparing workout summary email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Workout completed successfully',
      workout: {
        id: updatedWorkout._id,
        type: updatedWorkout.type,
        status: updatedWorkout.status,
        startedAt: updatedWorkout.startedAt,
        finishedAt: updatedWorkout.finishedAt,
        duration: updatedWorkout.duration,
        distance: updatedWorkout.distance,
        averagePace: updatedWorkout.averagePace,
        bestPace: updatedWorkout.bestPace,
        calories: updatedWorkout.calories,
        elevationGain: updatedWorkout.elevationGain,
        elevationLoss: updatedWorkout.elevationLoss,
        effortLevel: updatedWorkout.effortLevel,
        notes: updatedWorkout.notes,
        routePointsCount: updatedWorkout.route?.coordinates?.length || 0,
        gpsProcessed: !!gpsProcessingResult
      }
    });
  } catch (error) {
    console.error('❌ Error completing workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete workout',
      error: error.message
    });
  }
});

// GET /api/workouts/stats - Get workout statistics (MUST BE BEFORE /:id route)
router.get('/stats', async (req, res) => {
  try {
    console.log(`📊 Getting workout stats for user ${req.user.userId}`);
    
    const userId = req.user.userId;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all completed workouts for this user
    const allWorkouts = await Workout.find({
      userId,
      status: 'completed'
    });

    // Calculate basic stats
    const totalWorkouts = allWorkouts.length;
    const totalDistance = allWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const totalDuration = allWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalCalories = allWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);

    // Calculate average pace (weighted by distance)
    let totalWeightedPace = 0;
    let totalPaceDistance = 0;
    allWorkouts.forEach(w => {
      if (w.averagePace && w.distance > 0) {
        totalWeightedPace += w.averagePace * w.distance;
        totalPaceDistance += w.distance;
      }
    });
    const averagePace = totalPaceDistance > 0 ? 
      Math.round(totalWeightedPace / totalPaceDistance * 60) : 0; // convert to seconds/km

    // Find best pace
    const bestPaceValue = allWorkouts
      .filter(w => w.bestPace && w.bestPace > 0)
      .reduce((best, w) => Math.min(best, w.bestPace), Infinity);
    const bestPace = bestPaceValue === Infinity ? 0 : Math.round(bestPaceValue * 60);

    // Find longest run
    const longestRun = allWorkouts.reduce((max, w) => Math.max(max, w.distance || 0), 0);

    // Weekly stats
    const weekWorkouts = allWorkouts.filter(w => new Date(w.startedAt) >= weekAgo);
    const thisWeek = {
      workouts: weekWorkouts.length,
      distance: weekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      duration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
    };

    // Monthly stats
    const monthWorkouts = allWorkouts.filter(w => new Date(w.startedAt) >= monthAgo);
    const thisMonth = {
      workouts: monthWorkouts.length,
      distance: monthWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      duration: monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
    };

    // Calculate trends (comparing this month to previous month)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const prevMonthWorkouts = allWorkouts.filter(w => {
      const workoutDate = new Date(w.startedAt);
      return workoutDate >= twoMonthsAgo && workoutDate < monthAgo;
    });

    const prevMonth = {
      workouts: prevMonthWorkouts.length,
      distance: prevMonthWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      pace: prevMonthWorkouts.length > 0 ? 
        prevMonthWorkouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / prevMonthWorkouts.length : 0
    };

    const trends = {
      workouts: prevMonth.workouts > 0 ? 
        Math.round(((thisMonth.workouts - prevMonth.workouts) / prevMonth.workouts) * 100) : 0,
      distance: prevMonth.distance > 0 ? 
        Math.round(((thisMonth.distance - prevMonth.distance) / prevMonth.distance) * 100) : 0,
      pace: prevMonth.pace > 0 ? 
        Math.round(((averagePace - prevMonth.pace) / prevMonth.pace) * 100) : 0
    };

    // Format paces as mm:ss
    const formatPace = (paceInMinutes) => {
      if (!paceInMinutes || paceInMinutes <= 0) return '0:00';
      const minutes = Math.floor(paceInMinutes);
      const seconds = Math.round((paceInMinutes - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const stats = {
      totalWorkouts,
      totalDistance,
      totalDuration,
      totalCalories,
      averagePace: formatPace(averagePace / 60),
      bestPace: formatPace(bestPace / 60),
      longestRun,
      thisWeek,
      thisMonth,
      trends
    };

    console.log(`✅ Generated stats for user ${req.user.userId}:`, {
      totalWorkouts,
      totalDistance,
      averagePace: stats.averagePace
    });
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting workout stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workout statistics',
      error: error.message
    });
  }
});

// GET /api/workouts/recent - Get recent workouts for dashboard (MUST BE BEFORE /:id route)
router.get('/recent', checkDataRetentionAccess, addUsageInfo, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    console.log(`📋 Getting recent workouts for user ${req.user.userId}`);
    
    const queryFilter = { 
      userId: req.user.userId,
      status: 'completed',
      ...req.dataRetentionFilter // Add retention filter for free users
    };
    
    const workouts = await Workout.find(queryFilter)
      .sort({ startedAt: -1 })
      .limit(parseInt(limit))
      .select('-route -gpsPoints'); // Exclude heavy data
    
    const formattedWorkouts = workouts.map(workout => ({
      id: workout._id,
      type: workout.type,
      distance: workout.distance || 0,
      duration: workout.duration || 0,
      pace: workout.averagePace ? `${Math.floor(workout.averagePace)}:${Math.round((workout.averagePace % 1) * 60).toString().padStart(2, '0')}` : '0:00',
      calories: workout.calories,
      heartRateAvg: workout.heartRateAvg,
      heartRateMax: workout.heartRateMax,
      elevationGain: workout.elevationGain,
      feeling: workout.feeling || 3,
      effort: workout.effort || 3,
      startTime: workout.startedAt,
      endTime: workout.finishedAt,
      notes: workout.notes,
      weather: workout.weather,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt
    }));
    
    console.log(`✅ Found ${formattedWorkouts.length} recent workouts`);
    
    res.json({
      workouts: formattedWorkouts
    });
  } catch (error) {
    console.error('❌ Error getting recent workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent workouts',
      error: error.message
    });
  }
});

// GET /api/workouts/recent/all - Get recent workouts from all users (admin/coach only)
router.get('/recent/all', async (req, res) => {
  try {
    // Check if user is admin or coach
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'coach')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { limit = 10 } = req.query;
    
    console.log(`📋 Getting recent workouts from all users (admin request)`);
    
    const workouts = await Workout.find({ 
      status: 'completed'
    })
      .sort({ startedAt: -1 })
      .limit(parseInt(limit))
      .select('-route -gpsPoints')
      .populate('userId', 'firstName lastName avatarUrl');
    
    const formattedWorkouts = workouts.map(workout => ({
      id: workout._id,
      userId: workout.userId?._id,
      type: workout.type,
      distance: workout.distance || 0,
      duration: workout.duration || 0,
      pace: workout.averagePace ? `${Math.floor(workout.averagePace)}:${Math.round((workout.averagePace % 1) * 60).toString().padStart(2, '0')}` : '0:00',
      calories: workout.calories,
      feeling: workout.feeling || 3,
      effort: workout.effort || 3,
      startTime: workout.startedAt,
      user: workout.userId ? {
        firstName: workout.userId.firstName,
        lastName: workout.userId.lastName,
        avatarUrl: workout.userId.avatarUrl
      } : null
    }));
    
    console.log(`✅ Found ${formattedWorkouts.length} recent workouts from all users`);
    
    res.json({
      workouts: formattedWorkouts
    });
  } catch (error) {
    console.error('❌ Error getting recent workouts from all users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent workouts',
      error: error.message
    });
  }
});

// GET /api/workouts - Get workout history (with data retention filtering)
router.get('/', checkDataRetentionAccess, addUsageInfo, async (req, res) => {
  try {
    const { limit = 20, offset = 0, source } = req.query;

    console.log(`📋 Getting workout history for user ${req.user.userId}`);
    console.log(`📋 User object:`, JSON.stringify(req.user, null, 2));
    console.log(`📋 Query params - limit: ${limit}, offset: ${offset}, source: ${source || 'all'}`);

    // Build query with subscription-based filtering and data retention
    const query = {
      userId: req.user.userId,
      ...req.dataRetentionFilter // Add retention filter for free users
    };

    // 🎯 NEW: Filter by source if specified
    if (source && source !== 'all') {
      query.$or = [
        { source: source },
        { primarySource: source },
        { 'sources.platform': source }
      ];
      console.log(`🔍 Filtering by source: ${source}`);
    }
    
    // Apply data retention limits for free users
    if (req.userSubscription && req.userSubscription.level === 'free') {
      const retentionDays = req.userSubscription.features.dataRetention;
      if (retentionDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        query.startedAt = { $gte: cutoffDate };
        console.log(`🔒 Free user - applying ${retentionDays} day retention limit from ${cutoffDate}`);
      }
    }
    
    // First check total count with filters applied
    const totalCount = await Workout.countDocuments(query);
    console.log(`📊 Total accessible workouts for user: ${totalCount}`);
    
    const workouts = await Workout.find(query)
      .sort({ startedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-route'); // Exclude route data for list view
    
    console.log(`✅ Found ${workouts.length} workouts`);
    
    res.json({
      success: true,
      workouts: workouts.map(workout => ({
        id: workout._id,
        userId: workout.userId,
        type: workout.type,
        name: workout.name,
        status: workout.status,
        startTime: workout.startedAt,
        endTime: workout.finishedAt,
        duration: workout.duration || 0,
        distance: workout.distance || 0,
        pace: formatPace(workout.averagePace) || '0:00',
        averagePace: workout.averagePace,
        bestPace: workout.bestPace,
        calories: workout.calories,
        heartRateAvg: workout.heartRateAvg,
        heartRateMax: workout.heartRateMax,
        elevationGain: workout.elevationGain,
        feeling: workout.mood?.post || 3, // Default to neutral feeling
        effort: workout.effortLevel || 3, // Default to moderate effort
        notes: workout.notes,
        isGenerated: workout.isGenerated || false, // Include generated flag
        // 🎯 NEW: Multi-source tracking
        source: workout.source || 'manual',
        primarySource: workout.primarySource || workout.source || 'manual',
        sources: workout.sources?.map(s => s.platform) || [workout.source || 'manual'],
        hasMultipleSources: workout.sources && workout.sources.length > 1,
        createdAt: workout.createdAt,
        updatedAt: workout.updatedAt
      })),
      total: workouts.length,
      hasMore: workouts.length === parseInt(limit),
      subscription: req.userSubscription ? {
        plan: req.userSubscription.plan,
        features: req.userSubscription.features,
        isActive: req.userSubscription.isActive
      } : null
    });
  } catch (error) {
    console.error('❌ Error getting workout history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workout history',
      error: error.message
    });
  }
});

// GET /api/workouts/calendar - Get workouts for calendar view
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, includeTrainingPlan = 'false' } = req.query;

    console.log(`📅 Getting calendar workouts for user ${userId} from ${startDate} to ${endDate}`);

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter })
    };

    // Get workouts
    const workouts = await Workout.find(filter)
      .select('_id startedAt finishedAt distance duration type notes status calories averagePace elevationGain name isGenerated workoutData')
      .sort({ startedAt: 1 })
      .lean();

    // Format for calendar
    const calendarWorkouts = workouts.map(workout => ({
      _id: workout._id,
      name: workout.name || `${workout.type} workout`,
      type: workout.type,
      date: workout.startedAt,
      duration: workout.duration,
      distance: workout.distance,
      intensity: workout.isGenerated ? 'medium' : 'low', 
      status: workout.status === 'completed' ? 'completed' : workout.status === 'planned' ? 'planned' : 'planned',
      description: workout.notes,
      exercises: workout.workoutData || [],
      metrics: {
        calories: workout.calories,
        pace: workout.averagePace ? `${Math.floor(workout.averagePace)}:${Math.round((workout.averagePace % 1) * 60).toString().padStart(2, '0')}` : null,
      },
      createdAt: workout.createdAt || workout.startedAt,
      updatedAt: workout.updatedAt || workout.startedAt
    }));

    // Get training plan if requested
    let trainingPlan = null;
    if (includeTrainingPlan === 'true') {
      // TODO: Add training plan logic when TrainingPlan model exists
      trainingPlan = {};
    }

    res.json({
      success: true,
      activities: calendarWorkouts,
      trainingPlan,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('❌ Error getting calendar workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calendar workouts',
      error: error.message
    });
  }
});

// GET /api/workouts/:id - Get specific workout
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 Getting workout details for ${id}`);
    
    const workout = await Workout.findOne({ 
      _id: id, 
      userId: req.user.userId 
    });
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    // Get GPS points for this workout
    const gpsPoints = await GpsPoint.find({ workoutId: id })
      .sort({ timestamp: 1 });
    
    console.log(`✅ Found workout with ${gpsPoints.length} GPS points`);
    
    res.json({
      success: true,
      workout: {
        id: workout._id,
        type: workout.type,
        name: workout.name,
        status: workout.status,
        startedAt: workout.startedAt,
        finishedAt: workout.finishedAt,
        duration: workout.duration,
        distance: workout.distance,
        averagePace: workout.averagePace,
        bestPace: workout.bestPace,
        calories: workout.calories,
        route: workout.route,
        startLocation: workout.startLocation,
        endLocation: workout.endLocation,
        gpsPoints: gpsPoints.map(point => ({
          latitude: point.location.coordinates[1],
          longitude: point.location.coordinates[0],
          timestamp: point.timestamp,
          altitude: point.altitude,
          accuracy: point.accuracy,
          speed: point.speed
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error getting workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workout',
      error: error.message
    });
  }
});

// POST /api/workouts/generate - Generate personalized workout
router.post('/generate', authenticateToken, addSubscriptionInfo, addUsageInfo, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      type = 'running', 
      difficulty = 'beginner', 
      duration = 30, 
      goals = ['endurance'], 
      courseId,
      workoutType = 'structured',
      startDate // NEW: Required start date for workout
    } = req.body;

    console.log('🏃‍♂️ Generating workout for user:', userId, { type, difficulty, duration, startDate });

    // Validate required startDate
    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date is required',
        message: 'Please select a start date for your workout'
      });
    }

    // Parse and validate start date
    const workoutStartDate = new Date(startDate);
    if (isNaN(workoutStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start date',
        message: 'Please provide a valid start date'
      });
    }

    // Create workout structure based on parameters
    const workout = new Workout({
      userId,
      type,
      name: generateWorkoutName(type, difficulty, duration),
      status: 'planned',
      startedAt: workoutStartDate, // FIX: Add required startedAt field
      plannedDuration: duration * 60, // convert to seconds
      difficulty,
      goals,
      courseId: courseId || null,
      workoutData: generateWorkoutStructure(type, difficulty, duration, goals),
      isGenerated: true
    });

    await workout.save();
    
    res.json({
      success: true,
      message: 'Workout generated successfully',
      data: {
        workoutId: workout._id,
        workout: {
          id: workout._id,
          name: workout.name,
          type: workout.type,
          duration: workout.plannedDuration,
          difficulty: workout.difficulty,
          goals: workout.goals,
          structure: workout.workoutData
        }
      }
    });
  } catch (error) {
    console.error('Error generating workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate workout',
      message: error.message
    });
  }
});

// Helper functions for workout generation
function generateWorkoutName(type, difficulty, duration) {
  const difficultyNames = {
    beginner: 'Starter',
    intermediate: 'Progressive',
    advanced: 'Elite'
  };
  
  return `${difficultyNames[difficulty] || 'Custom'} ${type} (${duration}min)`;
}

function generateWorkoutStructure(type, difficulty, duration, goals) {
  const warmupDuration = Math.max(5, Math.floor(duration * 0.15));
  const cooldownDuration = Math.max(5, Math.floor(duration * 0.15)); 
  const mainDuration = duration - warmupDuration - cooldownDuration;
  
  const structure = {
    warmup: {
      duration: warmupDuration,
      description: 'Dynamic warm-up to prepare your body',
      exercises: ['Light jogging', 'Dynamic stretches', 'Leg swings']
    },
    main: {
      duration: mainDuration,
      description: generateMainWorkoutDescription(type, difficulty, goals),
      exercises: generateMainExercises(type, difficulty, goals, mainDuration)
    },
    cooldown: {
      duration: cooldownDuration,
      description: 'Cool down and stretch',
      exercises: ['Easy walking', 'Static stretches', 'Deep breathing']
    }
  };
  
  return structure;
}

function generateMainWorkoutDescription(type, difficulty, goals) {
  if (goals.includes('speed')) {
    return 'Interval training to build speed and power';
  } else if (goals.includes('endurance')) {
    return 'Steady-state running to build aerobic capacity';
  } else if (goals.includes('technique')) {
    return 'Form-focused running with technique drills';
  }
  return 'Balanced running workout';
}

function generateMainExercises(type, difficulty, goals, duration) {
  const exercises = [];
  
  if (difficulty === 'beginner') {
    exercises.push(`Steady easy pace for ${Math.floor(duration * 0.7)} minutes`);
    exercises.push(`Walk breaks as needed (${Math.floor(duration * 0.3)} minutes)`);
  } else if (difficulty === 'intermediate') {
    exercises.push(`Moderate pace for ${Math.floor(duration * 0.6)} minutes`);
    exercises.push(`4 x 1-minute intervals with 1-minute recovery`);
  } else {
    exercises.push(`Tempo pace for ${Math.floor(duration * 0.4)} minutes`);
    exercises.push(`6 x 2-minute intervals with 90-second recovery`);
  }
  
  return exercises;
}

// DELETE /api/workouts/:id - Delete workout
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting workout ${id}`);
    
    // Delete workout and all its GPS points
    const [workout, gpsPoints] = await Promise.all([
      Workout.findOneAndDelete({ _id: id, userId: req.user.userId }),
      GpsPoint.deleteMany({ workoutId: id })
    ]);
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    console.log(`✅ Deleted workout ${id} and ${gpsPoints.deletedCount} GPS points`);
    
    res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workout',
      error: error.message
    });
  }
});


// GET /api/workouts/:id/analysis - Get detailed workout analysis
router.get('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Getting workout analysis for ${id}`);
    
    const workout = await Workout.findOne({ 
      _id: id, 
      userId: req.user.userId 
    });
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    // Get GPS points for analysis
    const gpsPoints = await GpsPoint.find({ workoutId: id })
      .sort({ timestamp: 1 });
    
    // Calculate detailed analysis
    const analysis = {
      basic: {
        distance: workout.distance,
        duration: workout.duration,
        averagePace: workout.averagePace,
        bestPace: workout.bestPace,
        calories: workout.calories,
        elevationGain: workout.elevationGain,
        elevationLoss: workout.elevationLoss
      },
      splits: calculateSplits(gpsPoints, workout.distance),
      paceAnalysis: calculatePaceAnalysis(gpsPoints),
      elevationProfile: calculateElevationProfile(gpsPoints),
      heartRateAnalysis: calculateHeartRateAnalysis(gpsPoints, workout),
      performanceMetrics: calculatePerformanceMetrics(workout, gpsPoints)
    };
    
    console.log(`✅ Generated analysis for workout ${id}`);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ Error getting workout analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workout analysis',
      error: error.message
    });
  }
});

// Helper functions for workout analysis
function calculateSplits(gpsPoints, totalDistance) {
  if (!gpsPoints.length || !totalDistance) return [];
  
  const splits = [];
  const splitDistanceThreshold = 1000; // 1km splits
  let currentSplit = 1;
  let splitStartTime = gpsPoints[0].timestamp;
  let splitDistance = 0;
  
  for (let i = 1; i < gpsPoints.length; i++) {
    const point = gpsPoints[i];
    splitDistance += point.distance || 0;
    
    if (splitDistance >= splitDistanceThreshold * currentSplit) {
      const splitTime = (point.timestamp - splitStartTime) / 1000;
      const pace = splitTime / (splitDistance / 1000) / 60; // min/km
      
      splits.push({
        split: currentSplit,
        distance: splitDistance,
        time: splitTime,
        pace: pace
      });
      
      currentSplit++;
      splitStartTime = point.timestamp;
    }
  }
  
  return splits;
}

function calculatePaceAnalysis(gpsPoints) {
  if (!gpsPoints.length) return null;
  
  const paces = [];
  for (let i = 1; i < gpsPoints.length; i++) {
    const prev = gpsPoints[i - 1];
    const curr = gpsPoints[i];
    
    if (curr.speed && curr.speed > 0) {
      const pace = (1000 / curr.speed) / 60; // min/km
      paces.push(pace);
    }
  }
  
  if (!paces.length) return null;
  
  const sortedPaces = paces.sort((a, b) => a - b);
  return {
    fastest: sortedPaces[0],
    slowest: sortedPaces[sortedPaces.length - 1],
    median: sortedPaces[Math.floor(sortedPaces.length / 2)],
    average: paces.reduce((sum, pace) => sum + pace, 0) / paces.length,
    consistency: calculatePaceConsistency(paces)
  };
}

function calculateElevationProfile(gpsPoints) {
  if (!gpsPoints.length) return null;
  
  const elevations = gpsPoints
    .filter(point => point.altitude !== null)
    .map(point => point.altitude);
  
  if (!elevations.length) return null;
  
  return {
    min: Math.min(...elevations),
    max: Math.max(...elevations),
    gain: calculateElevationGain(elevations),
    loss: calculateElevationLoss(elevations),
    profile: elevations.map((alt, index) => ({
      distance: index * 100, // Approximate distance
      elevation: alt
    }))
  };
}

function calculateHeartRateAnalysis(gpsPoints, workout) {
  const hrPoints = gpsPoints.filter(point => point.heartRate);
  
  if (!hrPoints.length) return null;
  
  const heartRates = hrPoints.map(point => point.heartRate);
  
  return {
    average: workout.averageHeartRate,
    max: workout.maxHeartRate,
    min: Math.min(...heartRates),
    zones: calculateHRZones(heartRates, workout.maxHeartRate),
    variability: calculateHRV(heartRates)
  };
}

function calculatePerformanceMetrics(workout, gpsPoints) {
  return {
    efficiency: workout.distance / (workout.duration / 3600), // km/h
    intensity: workout.averageHeartRate ? 
      (workout.averageHeartRate / (220 - 30)) * 100 : null, // Rough intensity %
    cadence: calculateAverageCadence(gpsPoints),
    powerEfficiency: calculatePowerEfficiency(workout),
    recoveryTime: estimateRecoveryTime(workout)
  };
}

function calculatePaceConsistency(paces) {
  const mean = paces.reduce((sum, pace) => sum + pace, 0) / paces.length;
  const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - mean, 2), 0) / paces.length;
  return Math.sqrt(variance);
}

function calculateElevationGain(elevations) {
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) gain += diff;
  }
  return gain;
}

function calculateElevationLoss(elevations) {
  let loss = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff < 0) loss += Math.abs(diff);
  }
  return loss;
}

function calculateHRZones(heartRates, maxHR) {
  if (!maxHR) return null;
  
  const zones = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  
  heartRates.forEach(hr => {
    const percentage = (hr / maxHR) * 100;
    if (percentage < 60) zones.zone1++;
    else if (percentage < 70) zones.zone2++;
    else if (percentage < 80) zones.zone3++;
    else if (percentage < 90) zones.zone4++;
    else zones.zone5++;
  });
  
  return zones;
}

function calculateHRV(heartRates) {
  if (heartRates.length < 2) return null;
  
  const intervals = [];
  for (let i = 1; i < heartRates.length; i++) {
    intervals.push(Math.abs(heartRates[i] - heartRates[i - 1]));
  }
  
  return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
}

function calculateAverageCadence(gpsPoints) {
  // This would require additional sensor data
  // For now, return null or estimated value
  return null;
}

function calculatePowerEfficiency(workout) {
  if (!workout.distance || !workout.duration) return null;
  
  // Simplified power efficiency calculation
  const speed = workout.distance / (workout.duration / 3600); // km/h
  return speed * 3.6; // Rough efficiency metric
}

function estimateRecoveryTime(workout) {
  if (!workout.duration || !workout.averageHeartRate) return null;
  
  // Simple recovery time estimation based on duration and intensity
  const intensityFactor = workout.averageHeartRate / 180; // Normalized intensity
  const durationHours = workout.duration / 3600;
  
  return Math.round(durationHours * intensityFactor * 24); // Hours
}

// GET /api/workouts/planned/current - Get current week's planned workouts
router.get('/planned/current', async (req, res) => {
  console.log('🚀 PLANNED CURRENT ENDPOINT HIT!');
  res.json({
    success: true,
    message: 'Test endpoint working!',
    workouts: [],
    total: 0
  });
});

export default router;