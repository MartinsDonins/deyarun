import express from 'express';
import GoogleFitService from '../services/googleFitService.js';
import User from '../models/mongodb/user/user.model.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import activityDuplicateDetector from '../services/activityDuplicateDetector.js';

const router = express.Router();

const googleFitService = new GoogleFitService();

/**
 * @route GET /api/google-fit/auth-url
 * @desc Get Google Fit authorization URL
 * @access Private
 */
router.get('/auth-url', authMiddleware, async (req, res) => {
  try {
    console.log('🔵 [Google Fit] Generating auth URL for user:', req.user.userId);
    console.log('🔧 [Google Fit] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('🔧 [Google Fit] GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'NOT SET');

    const userId = req.user.userId;
    const authUrl = googleFitService.getAuthUrl(userId);

    console.log('✅ [Google Fit] Auth URL generated:', authUrl);

    res.json({
      success: true,
      data: {
        authUrl: authUrl
      },
      message: 'Google Fit authorization URL generated successfully'
    });
  } catch (error) {
    console.error('❌ [Google Fit] Error generating auth URL:', error);
    console.error('❌ [Google Fit] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Google Fit authorization URL',
      error: error.message
    });
  }
});

/**
 * @route GET /api/google-fit/callback
 * @desc Handle Google Fit OAuth callback (from Google OAuth redirect)
 * @access Public (no authMiddleware - uses state parameter for userId)
 */
router.get('/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://deyarun.com';

  try {
    const { code, state: userId, error } = req.query;

    console.log('📞 [Google Fit] OAuth callback received');
    console.log('🔵 [Google Fit] Code:', code ? 'PRESENT' : 'MISSING');
    console.log('🔵 [Google Fit] User ID (state):', userId);
    console.log('🔵 [Google Fit] Error:', error || 'NONE');

    // Check for OAuth error
    if (error) {
      console.error('❌ [Google Fit] OAuth error:', error);
      const errorUrl = `${frontendUrl}/integrations/google-fit/callback?success=false&error=${encodeURIComponent(error)}`;
      return res.redirect(errorUrl);
    }

    if (!code) {
      console.error('❌ [Google Fit] No authorization code received');
      const errorUrl = `${frontendUrl}/integrations/google-fit/callback?success=false&error=No%20authorization%20code%20received`;
      return res.redirect(errorUrl);
    }

    if (!userId) {
      console.error('❌ [Google Fit] No user ID in state parameter');
      const errorUrl = `${frontendUrl}/integrations/google-fit/callback?success=false&error=Invalid%20state%20parameter`;
      return res.redirect(errorUrl);
    }

    console.log('🔄 [Google Fit] Exchanging code for tokens...');
    // Exchange code for tokens
    const tokens = await googleFitService.getTokens(code);
    console.log('✅ [Google Fit] Tokens received successfully');

    console.log('💾 [Google Fit] Saving tokens to user:', userId);
    // Update user with Google Fit credentials
    await User.findByIdAndUpdate(userId, {
      $set: {
        'integrations.googleFit': {
          connected: true,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type,
          expiryDate: tokens.expiry_date,
          connectedAt: new Date()
        }
      }
    });
    console.log('✅ [Google Fit] Google Fit connected successfully for user:', userId);

    // Redirect to frontend success page (avoids COOP issues with postMessage)
    const successUrl = `${frontendUrl}/integrations/google-fit/callback?success=true&message=Google%20Fit%20connected%20successfully`;

    console.log('🔄 [Google Fit] Redirecting to:', successUrl);
    res.redirect(successUrl);
  } catch (error) {
    console.error('❌ [Google Fit] Error in callback:', error);
    console.error('❌ [Google Fit] Error stack:', error.stack);

    const errorUrl = `${frontendUrl}/integrations/google-fit/callback?success=false&error=${encodeURIComponent(error.message)}`;
    res.redirect(errorUrl);
  }
});

/**
 * @route DELETE /api/google-fit/disconnect
 * @desc Disconnect Google Fit integration
 * @access Private
 */
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Remove Google Fit credentials from user
    await User.findByIdAndUpdate(userId, {
      $unset: {
        'integrations.googleFit': 1
      }
    });

    res.json({
      success: true,
      message: 'Google Fit disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google Fit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Fit',
      error: error.message
    });
  }
});

/**
 * @route GET /api/google-fit/status
 * @desc Get Google Fit connection status
 * @access Private
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('integrations.googleFit');

    const isConnected = user?.integrations?.googleFit?.connected || false;
    const connectionInfo = user?.integrations?.googleFit || null;

    console.log('📊 [Google Fit] Status check for user:', userId);
    console.log('🔵 [Google Fit] Connected:', isConnected);
    console.log('🔵 [Google Fit] Connection info:', connectionInfo ? {
      hasAccessToken: !!connectionInfo.accessToken,
      hasRefreshToken: !!connectionInfo.refreshToken,
      connectedAt: connectionInfo.connectedAt
    } : 'NULL');

    res.json({
      success: true,
      data: {
        connected: isConnected,
        connectionInfo: isConnected ? {
          connected: true,
          connectedAt: connectionInfo.connectedAt,
          tokenType: connectionInfo.tokenType,
          hasValidToken: !!(connectionInfo.accessToken || connectionInfo.refreshToken)
        } : { connected: false }
      }
    });
  } catch (error) {
    console.error('❌ [Google Fit] Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Google Fit status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/google-fit/data
 * @desc Get Google Fit data for a date range
 * @access Private
 */
router.get('/data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, dataTypes } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Get user's Google Fit credentials
    const user = await User.findById(userId).select('integrations.googleFit');
    const googleFitData = user?.integrations?.googleFit;

    if (!googleFitData?.connected) {
      return res.status(400).json({
        success: false,
        message: 'Google Fit is not connected'
      });
    }

    // Set up Google Fit service with user credentials
    let tokens = {
      access_token: googleFitData.accessToken,
      refresh_token: googleFitData.refreshToken,
      token_type: googleFitData.tokenType,
      expiry_date: googleFitData.expiryDate
    };

    // Check if token needs refresh
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      try {
        tokens = await googleFitService.refreshToken(tokens.refresh_token);
        
        // Update user with new tokens
        await User.findByIdAndUpdate(userId, {
          $set: {
            'integrations.googleFit.accessToken': tokens.access_token,
            'integrations.googleFit.expiryDate': tokens.expiry_date
          }
        });
      } catch (refreshError) {
        return res.status(401).json({
          success: false,
          message: 'Google Fit token expired. Please reconnect.',
          needsReauth: true
        });
      }
    }

    googleFitService.setCredentials(tokens);

    // Get fitness data
    let fitnessData;
    if (dataTypes && dataTypes.split(',').length === 1) {
      // Get specific data type
      const dataType = dataTypes.trim();
      switch (dataType) {
        case 'steps':
          fitnessData = { steps: await googleFitService.getStepsData(startTime, endTime) };
          break;
        case 'distance':
          fitnessData = { distance: await googleFitService.getDistanceData(startTime, endTime) };
          break;
        case 'calories':
          fitnessData = { calories: await googleFitService.getCaloriesData(startTime, endTime) };
          break;
        case 'heartRate':
          fitnessData = { heartRate: await googleFitService.getHeartRateData(startTime, endTime) };
          break;
        case 'activities':
          fitnessData = { activities: await googleFitService.getActivitySessions(startTime, endTime) };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid data type. Supported: steps, distance, calories, heartRate, activities'
          });
      }
    } else {
      // Get comprehensive summary
      fitnessData = await googleFitService.getFitnessSummary(startTime, endTime);
    }

    res.json({
      success: true,
      data: fitnessData,
      timeRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error getting Google Fit data:', error);
    
    if (error.message.includes('invalid_grant') || error.message.includes('invalid_token')) {
      return res.status(401).json({
        success: false,
        message: 'Google Fit authorization expired. Please reconnect.',
        needsReauth: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get Google Fit data',
      error: error.message
    });
  }
});

/**
 * @route POST /api/google-fit/sync
 * @desc Sync Google Fit activities to DeyaRun workouts
 * @access Private
 */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, activityTypes = [] } = req.body;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    // Get user's Google Fit credentials
    const user = await User.findById(userId).select('integrations.googleFit');
    const googleFitData = user?.integrations?.googleFit;

    if (!googleFitData?.connected) {
      return res.status(400).json({
        success: false,
        message: 'Google Fit is not connected'
      });
    }

    // Set up Google Fit service
    let tokens = {
      access_token: googleFitData.accessToken,
      refresh_token: googleFitData.refreshToken,
      token_type: googleFitData.tokenType,
      expiry_date: googleFitData.expiryDate
    };

    // Refresh token if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      tokens = await googleFitService.refreshToken(tokens.refresh_token);
      await User.findByIdAndUpdate(userId, {
        $set: {
          'integrations.googleFit.accessToken': tokens.access_token,
          'integrations.googleFit.expiryDate': tokens.expiry_date
        }
      });
    }

    googleFitService.setCredentials(tokens);

    // Get activity sessions from Google Fit
    const sessionsData = await googleFitService.getActivitySessions(startTime, endTime);
    const processedSessions = googleFitService.processActivitySessions(sessionsData);

    if (processedSessions.error) {
      throw new Error(processedSessions.error);
    }

    let syncedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each activity
    let mergedCount = 0;
    for (const activity of processedSessions.activities) {
      try {
        // Filter by activity types if specified
        if (activityTypes.length > 0 && !activityTypes.includes(activity.activityType)) {
          skippedCount++;
          continue;
        }

        // Check if this exact Google Fit activity already exists in sources
        const exactMatch = await Workout.findOne({
          userId: userId,
          'sources.platform': 'google_fit',
          'sources.externalId': activity.id
        });

        if (exactMatch) {
          console.log(`⚠️ Google Fit activity ${activity.id} already synced`);
          skippedCount++;
          continue;
        }

        // Convert to DeyaRun workout format
        const workoutData = googleFitService.convertToWorkout(activity, userId);

        // 🎯 Use duplicate detector for time-based overlap detection
        const processResult = await activityDuplicateDetector.processActivity(
          userId,
          workoutData,
          'google_fit',
          activity.id
        );

        if (processResult.isDuplicate) {
          console.log(`🔀 Merged Google Fit activity with existing workout ${processResult.activityId}`);
          console.log(`🔀 Sources:`, processResult.sources);
          mergedCount++;
        } else {
          console.log(`✅ Created new workout ${processResult.activityId} from Google Fit`);
          syncedCount++;
        }
      } catch (activityError) {
        console.error('❌ Error syncing Google Fit activity:', activityError);
        errors.push({
          activityId: activity.id,
          error: activityError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Google Fit sync completed`,
      summary: {
        totalActivities: processedSessions.totalActivities,
        syncedCount,
        mergedCount,
        skippedCount,
        errorsCount: errors.length
      },
      timeRange: {
        startDate,
        endDate
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error syncing Google Fit data:', error);
    
    if (error.message.includes('invalid_grant') || error.message.includes('invalid_token')) {
      return res.status(401).json({
        success: false,
        message: 'Google Fit authorization expired. Please reconnect.',
        needsReauth: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to sync Google Fit data',
      error: error.message
    });
  }
});

/**
 * @route GET /api/google-fit/activities
 * @desc Get user's Google Fit activities (from workouts with google_fit source)
 * @access Private
 */
router.get('/activities', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 30;
    const skip = (page - 1) * perPage;

    console.log('📊 [Google Fit] Getting activities for user:', userId);

    // Get workouts that have google_fit as source or in sources array
    const query = {
      userId: userId,
      $or: [
        { source: 'google_fit' },
        { primarySource: 'google_fit' },
        { 'sources.platform': 'google_fit' }
      ],
      status: { $ne: 'cancelled' }
    };

    // Get total count
    const total = await Workout.countDocuments(query);

    // Get paginated activities
    const activities = await Workout.find(query)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    // Format activities for response
    const formattedActivities = activities.map(activity => {
      // Find Google Fit source data
      const googleFitSource = activity.sources?.find(s => s.platform === 'google_fit');

      return {
        id: activity._id,
        workoutId: activity._id,
        externalId: googleFitSource?.externalId || activity.externalData?.googleFitSessionId,
        name: activity.name || 'Google Fit Activity',
        type: activity.type,
        startedAt: activity.startedAt,
        finishedAt: activity.finishedAt,
        duration: activity.duration,
        distance: activity.distance,
        calories: activity.calories,
        averageHeartRate: activity.averageHeartRate,
        maxHeartRate: activity.maxHeartRate,
        elevationGain: activity.elevationGain,
        sources: activity.sources?.map(s => s.platform) || [activity.source || 'google_fit'],
        primarySource: activity.primarySource || activity.source || 'google_fit',
        imported: true, // Already in workouts collection
        syncedAt: googleFitSource?.syncedAt || activity.createdAt
      };
    });

    console.log('✅ [Google Fit] Found activities:', formattedActivities.length);

    res.json({
      success: true,
      activities: formattedActivities,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    });
  } catch (error) {
    console.error('❌ [Google Fit] Error getting activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Google Fit activities',
      error: error.message
    });
  }
});

export default router;