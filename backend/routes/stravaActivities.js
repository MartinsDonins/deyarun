import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import stravaService from '../services/stravaService.js';
import stravaSyncService from '../services/stravaSyncService.js';
import { stravaConfig } from '../config/strava.js';

const router = express.Router();

// Check if Strava is configured middleware
const checkStravaConfig = (req, res, next) => {
  if (!stravaConfig.isConfigured) {
    console.log('⚠️ Strava API not configured');
    return res.status(503).json({
      success: false,
      error: 'Strava integration not configured',
      message: 'Strava functionality is temporarily unavailable'
    });
  }
  next();
};

// GET /api/strava/activities - Get user's Strava activities
router.get('/activities', 
  authMiddleware, 
  checkStravaConfig,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('per_page').optional().isInt({ min: 1, max: 200 }).withMessage('Per page must be between 1 and 200'),
    query('after').optional().isISO8601().withMessage('After date must be valid ISO8601 date'),
    query('before').optional().isISO8601().withMessage('Before date must be valid ISO8601 date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        perPage: parseInt(req.query.per_page) || 30,
        filters: {}
      };

      if (req.query.after) {
        options.after = req.query.after;
      }
      if (req.query.before) {
        options.before = req.query.before;
      }

      // Strava API call

      const activities = await stravaService.getActivities(req.user.userId, options);

      // Check which activities have been imported to workouts
      const { Workout } = await import('../models/mongodb/workout/workout.model.js');
      const activityIds = activities.map(a => a.id.toString());
      
      const importedWorkouts = await Workout.find({
        userId: req.user.userId,
        'externalData.stravaActivityId': { $in: activityIds }
      }).select('externalData.stravaActivityId');

      const importedIds = new Set(importedWorkouts.map(w => w.externalData.stravaActivityId));
      
      // Mark activities as imported
      const activitiesWithImportStatus = activities.map(activity => ({
        ...activity,
        imported: importedIds.has(activity.id.toString())
      }));

      res.json({
        success: true,
        activities: activitiesWithImportStatus,
        pagination: {
          page: options.page,
          perPage: options.perPage,
          total: activities.length
        }
      });
    } catch (error) {
      console.error('❌ Failed to get Strava activities:', error);
      res.status(500).json({
        error: 'Failed to get Strava activities',
        message: error.message
      });
    }
  }
);

// GET /api/strava/activities/:id - Get detailed Strava activity
router.get('/activities/:id',
  authMiddleware,
  checkStravaConfig,
  async (req, res) => {
    try {
      const activityId = req.params.id;
      
      if (!activityId || isNaN(activityId)) {
        return res.status(400).json({
          error: 'Invalid activity ID',
          message: 'Activity ID must be a valid number'
        });
      }

      const activity = await stravaService.getActivityDetails(req.user.userId, activityId);

      res.json({
        success: true,
        activity
      });
    } catch (error) {
      console.error('❌ Failed to get Strava activity details:', error);
      res.status(500).json({
        error: 'Failed to get activity details',
        message: error.message
      });
    }
  }
);

// GET /api/strava/activities/:id/streams - Get activity streams (GPS, heart rate, etc.)
router.get('/activities/:id/streams',
  authMiddleware,
  checkStravaConfig,
  [
    query('types').optional().isString().withMessage('Stream types must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const activityId = req.params.id;
      
      if (!activityId || isNaN(activityId)) {
        return res.status(400).json({
          error: 'Invalid activity ID',
          message: 'Activity ID must be a valid number'
        });
      }

      // Parse stream types from query parameter
      let streamTypes = ['latlng', 'time', 'distance', 'altitude', 'heartrate', 'cadence', 'watts', 'temp'];
      if (req.query.types) {
        streamTypes = req.query.types.split(',').map(type => type.trim());
      }

      const streams = await stravaService.getActivityStreams(req.user.userId, activityId, streamTypes);

      res.json({
        success: true,
        streams
      });
    } catch (error) {
      console.error('❌ Failed to get activity streams:', error);
      res.status(500).json({
        error: 'Failed to get activity streams',
        message: error.message
      });
    }
  }
);

// POST /api/strava/sync - Sync user's recent activities
router.post('/sync',
  authMiddleware,
  checkStravaConfig,
  [
    body('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),
    body('since').optional().isISO8601().withMessage('Since date must be valid ISO8601 date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const options = {};
      if (req.body.limit) {
        options.limit = req.body.limit;
      }
      if (req.body.since) {
        options.since = req.body.since;
      }

      const syncResult = await stravaService.syncUserActivities(req.user.userId, options);

      res.json({
        success: true,
        message: 'Activities synced successfully',
        ...syncResult
      });
    } catch (error) {
      console.error('❌ Failed to sync Strava activities:', error);
      res.status(500).json({
        error: 'Failed to sync activities',
        message: error.message
      });
    }
  }
);

// POST /api/strava/import/:activityId - Convert Strava activity to DeyaRun workout
router.post('/import/:activityId',
  authMiddleware,
  checkStravaConfig,
  async (req, res) => {
    try {
      const activityId = req.params.activityId;
      
      if (!activityId || isNaN(activityId)) {
        return res.status(400).json({
          error: 'Invalid activity ID',
          message: 'Activity ID must be a valid number'
        });
      }

      // Strava activity import

      const result = await stravaService.convertToWorkout(req.user.userId, parseInt(activityId));

      // Determine the appropriate HTTP status code and message
      const statusCode = result.alreadyImported ? 200 : 201;
      const responseMessage = result.alreadyImported 
        ? 'Activity was already imported'
        : 'Activity imported successfully';

      res.status(statusCode).json({
        success: true,
        message: responseMessage,
        workoutId: result.workoutId,
        workout: result.workout,
        alreadyImported: result.alreadyImported || false,
        details: result.message
      });
    } catch (error) {
      console.error('❌ Failed to import Strava activity:', error);
      res.status(500).json({
        error: 'Failed to import activity',
        message: error.message
      });
    }
  }
);

// POST /api/strava/import/bulk - Bulk import multiple Strava activities
router.post('/import/bulk',
  authMiddleware,
  checkStravaConfig,
  [
    body('activityIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('Activity IDs must be an array with 1-50 items')
      .custom((value) => {
        if (!value.every(id => !isNaN(parseInt(id)))) {
          throw new Error('All activity IDs must be valid numbers');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const activityIds = req.body.activityIds.map(id => parseInt(id));
      
      const results = await stravaService.bulkImportActivities(req.user.userId, activityIds);

      res.json({
        success: true,
        message: `Processed ${results.summary.total} activities`,
        results: results
      });
    } catch (error) {
      console.error('❌ Failed to bulk import Strava activities:', error);
      res.status(500).json({
        error: 'Failed to bulk import activities',
        message: error.message
      });
    }
  }
);

// GET /api/strava/stats - Get user's Strava statistics
router.get('/stats',
  authMiddleware,
  checkStravaConfig,
  async (req, res) => {
    try {
      const stats = await stravaService.getUserStats(req.user.userId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('❌ Failed to get Strava stats:', error);
      res.status(500).json({
        error: 'Failed to get Strava statistics',
        message: error.message
      });
    }
  }
);

// GET /api/strava/profile - Get athlete profile
router.get('/profile',
  authMiddleware,
  checkStravaConfig,
  async (req, res) => {
    try {
      const profile = await stravaService.getAthleteProfile(req.user.userId);

      res.json({
        success: true,
        profile
      });
    } catch (error) {
      console.error('❌ Failed to get athlete profile:', error);
      res.status(500).json({
        error: 'Failed to get athlete profile',
        message: error.message
      });
    }
  }
);

// GET /api/strava/sync/stats - Get sync service statistics
router.get('/sync/stats',
  authMiddleware,
  async (req, res) => {
    try {
      const stats = stravaSyncService.getSyncStats();

      res.json({
        success: true,
        ...stats
      });
    } catch (error) {
      console.error('❌ Failed to get sync stats:', error);
      res.status(500).json({
        error: 'Failed to get sync statistics',
        message: error.message
      });
    }
  }
);

// POST /api/strava/sync/manual - Trigger manual sync
router.post('/sync/manual',
  authMiddleware,
  checkStravaConfig,
  [
    body('comprehensive').optional().isBoolean().withMessage('Comprehensive must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      console.log(`🚀 Manual sync triggered by user ${req.user.userId}`);
      
      const options = {
        comprehensive: req.body.comprehensive || false
      };

      // Trigger personal sync for this user
      const result = await stravaService.syncUserActivities(req.user.userId, {
        limit: options.comprehensive ? 100 : 30,
        autoCreateWorkouts: true
      });

      res.json({
        success: true,
        message: 'Manual sync completed',
        result
      });
    } catch (error) {
      console.error('❌ Failed to perform manual sync:', error);
      res.status(500).json({
        error: 'Failed to perform manual sync',
        message: error.message
      });
    }
  }
);

export default router;