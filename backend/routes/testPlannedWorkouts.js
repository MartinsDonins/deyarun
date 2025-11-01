import express from 'express';
import { PlannedWorkout } from '../models/mongodb/index.js';
import { startOfWeek, endOfWeek } from 'date-fns';

const router = express.Router();

// Simple test endpoint to check PlannedWorkout data
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test endpoint hit!');
    
    const userId = '688d8452795e3f77642e8b7e';
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    console.log(`📅 Searching for workouts from ${currentWeekStart} to ${currentWeekEnd}`);
    
    const workouts = await PlannedWorkout.find({
      userId: userId,
      scheduledDate: {
        $gte: currentWeekStart,
        $lte: currentWeekEnd
      }
    }).sort({ scheduledDate: 1 });
    
    console.log(`📊 Found ${workouts.length} planned workouts`);
    
    res.json({
      success: true,
      message: 'Test endpoint working',
      data: {
        userId: userId,
        weekStart: currentWeekStart,
        weekEnd: currentWeekEnd,
        workoutsFound: workouts.length,
        workouts: workouts.map(w => ({
          id: w._id,
          name: w.name,
          type: w.type,
          scheduledDate: w.scheduledDate,
          status: w.status
        }))
      }
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;