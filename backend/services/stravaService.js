import { User, StravaActivity, Workout } from '../models/mongodb/index.js';
import mongoose from 'mongoose';
import { stravaAPI, stravaConfig } from '../config/strava.js';
import { ensureValidStravaToken } from '../routes/stravaAuth.js';

class StravaService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize the service
  async initialize() {
    try {
      if (!stravaConfig.isConfigured) {
        console.log('⚠️ Strava service not initialized - API not configured');
        return;
      }

      this.isInitialized = true;
      console.log('✅ Strava service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Strava service:', error);
      throw error;
    }
  }

  // Get user's Strava data from MongoDB
  async getUserStravaData(userId) {
    try {
      const user = await User.findById(userId).select('strava');
      return user?.strava || null;
    } catch (error) {
      console.error('❌ Failed to get user Strava data:', error);
      throw error;
    }
  }

  // Get athlete profile from Strava API
  async getAthleteProfile(userId) {
    try {
      const accessToken = await ensureValidStravaToken(userId);
      
      const response = await stravaAPI.get('/athlete', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get athlete profile:', error);
      throw this._handleStravaError(error);
    }
  }

  // Get athlete activities from Strava API
  async getActivities(userId, options = {}) {
    try {
      const accessToken = await ensureValidStravaToken(userId);
      
      const params = {
        page: options.page || 1,
        per_page: options.perPage || 30,
        ...options.filters
      };

      // Add date filters if provided
      if (options.after) {
        params.after = Math.floor(new Date(options.after).getTime() / 1000);
      }
      if (options.before) {
        params.before = Math.floor(new Date(options.before).getTime() / 1000);
      }

      const response = await stravaAPI.get('/activities', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get activities:', error);
      throw this._handleStravaError(error);
    }
  }

  // Get detailed activity from Strava API
  async getActivityDetails(userId, activityId) {
    try {
      const accessToken = await ensureValidStravaToken(userId);
      
      const response = await stravaAPI.get(`/activities/${activityId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get activity details:', error);
      throw this._handleStravaError(error);
    }
  }

  // Get activity streams (GPS, heart rate, etc.)
  async getActivityStreams(userId, activityId, streamTypes = ['latlng', 'time', 'distance', 'altitude', 'heartrate', 'cadence', 'watts', 'temp']) {
    try {
      const accessToken = await ensureValidStravaToken(userId);
      
      const response = await stravaAPI.get(`/activities/${activityId}/streams`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          keys: streamTypes.join(','),
          key_by_type: true
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get activity streams:', error);
      throw this._handleStravaError(error);
    }
  }

  // Sync recent activities for a user
  async syncUserActivities(userId, options = {}) {
    try {
      const stravaData = await this.getUserStravaData(userId);
      
      if (!stravaData || !stravaData.isConnected) {
        throw new Error('Strava not connected for this user');
      }

      // Get activities from Strava
      const activities = await this.getActivities(userId, {
        perPage: options.limit || 50,
        after: options.since || stravaData.lastSyncAt
      });

      // Store activities in MongoDB using StravaActivity model
      let syncedCount = 0;
      let workoutsCreated = 0;

      for (const activity of activities) {
        try {
          // Use findOneAndUpdate with upsert for atomic operation
          const savedActivity = await StravaActivity.findOneAndUpdate(
            { userId: userId, stravaId: activity.id },
            {
              ...activity,
              userId: userId,
              stravaId: activity.id,
              syncedAt: new Date(),
              lastUpdated: new Date()
            },
            { 
              upsert: true, 
              new: true,
              setDefaultsOnInsert: true
            }
          );
          
          syncedCount++;

          // Auto-create workout if enabled and activity is suitable
          if (options.autoCreateWorkouts && this._shouldAutoCreateWorkout(activity)) {
            try {
              // Check if workout already exists for this activity
              const existingWorkout = await Workout.findOne({
                userId: userId,
                'externalData.stravaActivityId': activity.id.toString()
              });

              if (!existingWorkout) {
                console.log(`🏃 Auto-creating workout for Strava activity ${activity.id}`);
                
                const result = await this.convertToWorkout(userId, activity.id);
                if (result && !result.alreadyImported) {
                  workoutsCreated++;
                  console.log(`✅ Auto-created workout ${result.workoutId} from activity ${activity.id}`);
                }
              }
            } catch (workoutError) {
              console.error(`❌ Failed to auto-create workout for activity ${activity.id}:`, workoutError);
            }
          }
          
        } catch (activityError) {
          console.error(`❌ Failed to sync activity ${activity.id}:`, activityError);
        }
      }

      // Update user's last sync time
      await User.updateOne(
        { _id: userId },
        { 
          $set: { 
            'strava.lastSyncAt': new Date(),
            'strava.lastSyncCount': syncedCount,
            'strava.lastWorkoutsCreated': workoutsCreated
          }
        }
      );

      console.log(`✅ Synced ${syncedCount} activities for user ${userId}${workoutsCreated > 0 ? `, created ${workoutsCreated} workouts` : ''}`);
      
      return {
        syncedCount,
        workoutsCreated,
        totalActivities: activities.length,
        lastSyncAt: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to sync user activities:', error);
      throw error;
    }
  }

  // Determine if activity should auto-create a workout
  _shouldAutoCreateWorkout(activity) {
    // Only auto-create for specific activity types that are workouts
    const supportedTypes = ['Run', 'Ride', 'Walk', 'Hike', 'Swim', 'WeightTraining', 'Crossfit'];
    
    // Only create if activity has meaningful data
    const hasDistance = activity.distance && activity.distance > 0;
    const hasTime = activity.moving_time && activity.moving_time > 60; // At least 1 minute
    
    return supportedTypes.includes(activity.type) && (hasDistance || hasTime);
  }

  // Bulk import multiple activities with duplicate checking
  async bulkImportActivities(userId, activityIds) {
    const results = {
      successful: [],
      skipped: [],
      failed: [],
      summary: {
        total: activityIds.length,
        imported: 0,
        skipped: 0,
        failed: 0
      }
    };

    for (const activityId of activityIds) {
      try {
        const result = await this.convertToWorkout(userId, activityId);
        
        if (result.alreadyImported) {
          results.skipped.push({
            activityId,
            workoutId: result.workoutId,
            message: result.message
          });
          results.summary.skipped++;
        } else {
          results.successful.push({
            activityId,
            workoutId: result.workoutId,
            message: result.message
          });
          results.summary.imported++;
        }
      } catch (error) {
        results.failed.push({
          activityId,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    console.log(`📊 Bulk import summary for user ${userId}: ${results.summary.imported} imported, ${results.summary.skipped} skipped, ${results.summary.failed} failed`);
    
    return results;
  }

  // Convert Strava activity to DeyaRun workout format
  async convertToWorkout(userId, stravaActivityId) {
    try {
      // Ensure stravaActivityId is properly formatted as a number
      const stravaId = parseInt(stravaActivityId);
      if (isNaN(stravaId)) {
        throw new Error(`Invalid Strava activity ID: ${stravaActivityId}`);
      }

      console.log(`🔄 Converting Strava activity ${stravaId} to workout for user ${userId}`);

      // Check if this exact Strava activity has already been imported
      const exactMatch = await Workout.findOne({
        userId: userId,
        'externalData.stravaActivityId': stravaId.toString()
      });

      if (exactMatch) {
        console.log(`⚠️ Strava activity ${stravaId} already imported as workout ${exactMatch._id}`);
        return {
          workoutId: exactMatch._id,
          workout: exactMatch,
          alreadyImported: true,
          message: 'This Strava activity has already been imported'
        };
      }

      // Check if same activity exists in sources array (new multi-source tracking)
      const sourceMatch = await Workout.findOne({
        userId: userId,
        'sources.platform': 'strava',
        'sources.externalId': stravaId.toString()
      });

      if (sourceMatch) {
        console.log(`⚠️ Strava activity ${stravaId} already exists in sources for workout ${sourceMatch._id}`);
        return {
          workoutId: sourceMatch._id,
          workout: sourceMatch,
          alreadyImported: true,
          message: 'This Strava activity has already been imported (multi-source)'
        };
      }
      
      // Get the Strava activity from our database
      let stravaActivity = await StravaActivity.findByUserAndStravaId(userId, stravaId);

      // If not found in database, try to fetch from Strava API and store it
      if (!stravaActivity) {
        console.log(`🔄 Activity ${stravaId} not in database, fetching from Strava API...`);
        
        try {
          // Fetch activity details from Strava API
          const activityData = await this.getActivityDetails(userId, stravaId);
          
          // Store the activity in our database
          // Extract the id and avoid conflicts with MongoDB's _id
          const { id, ...stravaData } = activityData;
          stravaActivity = new StravaActivity({
            userId: userId,
            stravaId: id, // Use the Strava ID properly
            ...stravaData,
            syncedAt: new Date(),
            lastUpdated: new Date()
          });
          
          await stravaActivity.save();
          console.log(`✅ Saved activity ${stravaId} to database`);
        } catch (fetchError) {
          console.error(`❌ Failed to fetch activity ${stravaId} from Strava:`, fetchError);
          
          // Provide more detailed error information
          if (fetchError.response?.status === 404) {
            throw new Error(`Strava activity ${stravaActivityId} not found or access denied`);
          } else if (fetchError.response?.status === 401) {
            throw new Error('Strava authentication expired. Please reconnect your account');
          } else if (fetchError.response?.status === 403) {
            throw new Error('Access denied to Strava activity. Activity may be private');
          } else {
            throw new Error(`Failed to fetch Strava activity: ${fetchError.message}`);
          }
        }
      }

      // Get detailed streams if needed
      let streams = null;
      try {
        streams = await this.getActivityStreams(userId, stravaActivityId);
      } catch (error) {
        console.warn('⚠️ Could not fetch activity streams:', error.message);
      }

      // Convert using the model's instance method
      const workoutData = stravaActivity.toWorkoutFormat();
      
      // Add GPS data from streams if available
      if (streams?.latlng) {
        workoutData.gpsPoints = this._convertStreamsToGPSPoints(streams);
      }
      
      // Ensure Strava ID is properly set in externalData
      if (!workoutData.externalData) {
        workoutData.externalData = {};
      }
      workoutData.externalData.stravaActivityId = stravaId.toString();
      workoutData.source = 'strava';

      // 🎯 NEW: Use duplicate detector to check for time-overlapping activities
      const duplicateDetector = (await import('./activityDuplicateDetector.js')).default;
      const processResult = await duplicateDetector.processActivity(
        userId,
        workoutData,
        'strava',
        stravaId.toString()
      );

      let savedWorkout;
      if (processResult.isDuplicate) {
        console.log(`🔀 Strava activity ${stravaId} merged with existing workout ${processResult.activityId}`);
        console.log(`🔀 Sources:`, processResult.sources);
        savedWorkout = await Workout.findById(processResult.activityId);
      } else {
        savedWorkout = await Workout.findById(processResult.activityId);
      }

      // Mark the Strava activity as imported
      await StravaActivity.updateOne(
        { _id: stravaActivity._id },
        { 
          $set: { 
            importedToWorkout: true,
            workoutId: savedWorkout._id
          }
        }
      );

      console.log(`✅ Converted Strava activity ${stravaActivityId} to workout ${savedWorkout._id}`);
      
      return {
        workoutId: savedWorkout._id,
        workout: savedWorkout,
        alreadyImported: false,
        message: 'Strava activity successfully imported as new workout'
      };
    } catch (error) {
      console.error('❌ Failed to convert Strava activity to workout:', error);
      throw error;
    }
  }

  // Get user's Strava stats
  async getUserStats(userId) {
    try {
      // Use the static method from StravaActivity model
      const stats = await StravaActivity.getUserStats(userId);

      // Get activities by type
      const activityTypes = await StravaActivity.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalDistance: { $sum: '$distance' },
            totalTime: { $sum: '$moving_time' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        overall: stats[0] || {},
        byType: activityTypes
      };
    } catch (error) {
      console.error('❌ Failed to get user Strava stats:', error);
      throw error;
    }
  }

  // Helper method to map Strava activity types to DeyaRun workout types
  _mapStravaActivityType(stravaType) {
    const typeMapping = {
      'Run': 'running',
      'Ride': 'cycling',
      'Walk': 'walking',
      'Hike': 'hiking',
      'Swim': 'swimming',
      'WeightTraining': 'strength',
      'Crossfit': 'strength',
      'Yoga': 'yoga',
      'Workout': 'other'
    };

    return typeMapping[stravaType] || 'other';
  }

  // Helper method to convert Strava streams to GPS points
  _convertStreamsToGPSPoints(streams) {
    try {
      const { latlng, time, distance, altitude } = streams;
      
      if (!latlng || !latlng.data) return [];

      return latlng.data.map((coords, index) => ({
        latitude: coords[0],
        longitude: coords[1],
        timestamp: time?.data?.[index] || index,
        distance: distance?.data?.[index] || null,
        altitude: altitude?.data?.[index] || null
      }));
    } catch (error) {
      console.error('❌ Failed to convert streams to GPS points:', error);
      return [];
    }
  }

  // Helper method to handle Strava API errors
  _handleStravaError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return new Error('Strava authentication failed - token may be expired');
        case 403:
          return new Error('Access forbidden - check Strava permissions');
        case 404:
          return new Error('Strava resource not found');
        case 429:
          const retryAfter = error.response.headers['retry-after'] || 900;
          return new Error(`Strava rate limit exceeded - retry after ${retryAfter} seconds`);
        default:
          return new Error(`Strava API error: ${data?.message || error.message}`);
      }
    }

    return error;
  }
}

// Create singleton instance
const stravaService = new StravaService();

export default stravaService;