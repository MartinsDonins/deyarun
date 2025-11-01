// Debug Workouts Routes - For Development Only
import express from 'express';
import { Workout, User } from '../models/mongodb/index.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// Only enable in development
if (process.env.NODE_ENV !== 'production') {
  
  // Debug endpoint to check user authentication and workouts
  router.get('/debug-workouts', authenticateToken, async (req, res) => {
    try {
      console.log('Debug: User from token:', req.user);
      
      const user = await User.findById(req.user.userId || req.user.userId);
      console.log('Debug: User from database:', user ? {
        id: user._id,
        email: user.email,
        name: user.firstName + ' ' + user.lastName
      } : 'Not found');

      const workoutCount = await Workout.countDocuments({ userId: req.user.userId });
      const allWorkouts = await Workout.find({ userId: req.user.userId }).limit(5);
      
      console.log(`Debug: Found ${workoutCount} workouts for user ${req.user.userId}`);
      
      res.json({
        success: true,
        debug: {
          requestUser: req.user,
          dbUser: user ? {
            id: user._id,
            email: user.email,
            name: user.firstName + ' ' + user.lastName
          } : null,
          workoutCount,
          sampleWorkouts: allWorkouts.map(w => ({
            id: w._id,
            type: w.type,
            status: w.status,
            distance: w.distance,
            duration: w.duration,
            startedAt: w.startedAt
          }))
        }
      });
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        debug: {
          requestUser: req.user
        }
      });
    }
  });

  // Sample workout creation endpoint removed - no longer needed for production

  console.log('✅ Debug workout routes enabled (development mode only)');
}

export default router;