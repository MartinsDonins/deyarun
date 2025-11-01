import express from 'express';
import { stravaConfig } from '../config/strava.js';
import stravaService from '../services/stravaService.js';
import { User, StravaActivity } from '../models/mongodb/index.js';

const router = express.Router();

// Webhook verification endpoint for Strava
router.get('/webhook', (req, res) => {
  try {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = req.query;

    console.log('🔔 Strava webhook verification request:', { mode, challenge, verifyToken });

    if (!stravaConfig.isConfigured) {
      console.error('❌ Strava webhook verification failed - API not configured');
      return res.status(503).json({
        error: 'Strava API not configured'
      });
    }

    // Verify the challenge token
    if (mode === 'subscribe' && challenge && verifyToken === stravaConfig.verifyToken) {
      console.log('✅ Strava webhook verification successful');
      
      // Respond with the challenge to complete verification
      res.json({
        'hub.challenge': challenge
      });
    } else {
      console.error('❌ Strava webhook verification failed - invalid token or mode');
      res.status(403).json({
        error: 'Forbidden - Invalid verification token'
      });
    }
  } catch (error) {
    console.error('❌ Strava webhook verification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Webhook event handler for Strava
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stravaConfig.isConfigured) {
      console.error('❌ Strava webhook event failed - API not configured');
      return res.status(503).json({
        error: 'Strava API not configured'
      });
    }

    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch (parseError) {
      console.error('❌ Failed to parse Strava webhook payload:', parseError);
      return res.status(400).json({
        error: 'Invalid JSON payload'
      });
    }

    console.log('🔔 Strava webhook event received:', {
      type: event.object_type,
      id: event.object_id,
      aspectType: event.aspect_type,
      ownerId: event.owner_id,
      subscriptionId: event.subscription_id,
      eventTime: event.event_time
    });

    // Handle different event types
    switch (event.object_type) {
      case 'activity':
        await handleActivityEvent(event);
        break;
      
      case 'athlete':
        await handleAthleteEvent(event);
        break;
      
      default:
        console.log(`ℹ️ Unhandled Strava webhook event type: ${event.object_type}`);
    }

    // Acknowledge receipt of the webhook
    res.status(200).json({
      success: true,
      message: 'Event processed'
    });

  } catch (error) {
    console.error('❌ Strava webhook processing error:', error);
    res.status(500).json({
      error: 'Failed to process webhook event'
    });
  }
});

// Handle activity-related webhook events
async function handleActivityEvent(event) {
  try {
    const { object_id: activityId, owner_id: athleteId, aspect_type: aspectType } = event;

    console.log(`🏃 Processing activity event: ${aspectType} for activity ${activityId} by athlete ${athleteId}`);

    // Find the user by their Strava athlete ID
    const user = await User.findOne({
      'strava.athleteId': parseInt(athleteId),
      'strava.isConnected': true
    });

    if (!user) {
      console.log(`⚠️ No connected user found for Strava athlete ${athleteId}`);
      return;
    }

    console.log(`👤 Found user ${user._id} for athlete ${athleteId}`);

    switch (aspectType) {
      case 'create':
        await handleActivityCreate(user._id, activityId);
        break;
      
      case 'update':
        await handleActivityUpdate(user._id, activityId);
        break;
      
      case 'delete':
        await handleActivityDelete(user._id, activityId);
        break;
      
      default:
        console.log(`ℹ️ Unhandled activity aspect type: ${aspectType}`);
    }

  } catch (error) {
    console.error('❌ Failed to handle activity event:', error);
  }
}

// Handle athlete-related webhook events
async function handleAthleteEvent(event) {
  try {
    const { object_id: athleteId, aspect_type: aspectType } = event;

    console.log(`👤 Processing athlete event: ${aspectType} for athlete ${athleteId}`);

    // Find the user by their Strava athlete ID
    const user = await User.findOne({
      'strava.athleteId': parseInt(athleteId),
      'strava.isConnected': true
    });

    if (!user) {
      console.log(`⚠️ No connected user found for Strava athlete ${athleteId}`);
      return;
    }

    switch (aspectType) {
      case 'update':
        await handleAthleteUpdate(user._id);
        break;
      
      default:
        console.log(`ℹ️ Unhandled athlete aspect type: ${aspectType}`);
    }

  } catch (error) {
    console.error('❌ Failed to handle athlete event:', error);
  }
}

// Handle new activity creation
async function handleActivityCreate(userId, activityId) {
  try {
    console.log(`✨ New activity created: ${activityId} for user ${userId}`);
    
    // Sync this specific activity
    setTimeout(async () => {
      try {
        // Wait a bit for Strava to process the activity fully
        const activities = await stravaService.getActivities(userId, {
          perPage: 1,
          after: new Date(Date.now() - 60000).toISOString() // Last minute
        });

        const newActivity = activities.find(a => a.id.toString() === activityId.toString());
        if (newActivity) {
          // Store the activity in our database using StravaActivity model
          const stravaActivity = new StravaActivity({
            ...newActivity,
            userId: userId,
            stravaId: newActivity.id,
            syncedAt: new Date()
          });
          
          await stravaActivity.save();

          console.log(`✅ Synced new activity ${activityId} for user ${userId}`);
        }
      } catch (syncError) {
        console.error(`❌ Failed to sync new activity ${activityId}:`, syncError);
      }
    }, 5000); // Wait 5 seconds

  } catch (error) {
    console.error('❌ Failed to handle activity creation:', error);
  }
}

// Handle activity updates
async function handleActivityUpdate(userId, activityId) {
  try {
    console.log(`📝 Activity updated: ${activityId} for user ${userId}`);
    
    // Get updated activity from Strava and update our database
    setTimeout(async () => {
      try {
        const updatedActivity = await stravaService.getActivityDetails(userId, activityId);
        
        await StravaActivity.findOneAndUpdate(
          { userId: userId, stravaId: parseInt(activityId) },
          { 
            ...updatedActivity,
            userId: userId,
            stravaId: updatedActivity.id,
            syncedAt: new Date(),
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );

        console.log(`✅ Updated activity ${activityId} for user ${userId}`);
      } catch (updateError) {
        console.error(`❌ Failed to update activity ${activityId}:`, updateError);
      }
    }, 2000); // Wait 2 seconds

  } catch (error) {
    console.error('❌ Failed to handle activity update:', error);
  }
}

// Handle activity deletion
async function handleActivityDelete(userId, activityId) {
  try {
    console.log(`🗑️ Activity deleted: ${activityId} for user ${userId}`);
    
    // Remove the activity from our database
    const result = await StravaActivity.deleteOne({
      userId: userId,
      stravaId: parseInt(activityId)
    });

    if (result.deletedCount > 0) {
      console.log(`✅ Deleted activity ${activityId} for user ${userId}`);
    } else {
      console.log(`⚠️ Activity ${activityId} not found in database for user ${userId}`);
    }

  } catch (error) {
    console.error('❌ Failed to handle activity deletion:', error);
  }
}

// Handle athlete profile updates
async function handleAthleteUpdate(userId) {
  try {
    console.log(`👤 Athlete profile updated for user ${userId}`);
    
    // Get updated athlete profile and update our database
    setTimeout(async () => {
      try {
        const updatedProfile = await stravaService.getAthleteProfile(userId);
        
        await User.updateOne(
          { _id: userId },
          { 
            $set: {
              'strava.athlete': {
                id: updatedProfile.id,
                username: updatedProfile.username,
                firstname: updatedProfile.firstname,
                lastname: updatedProfile.lastname,
                city: updatedProfile.city,
                state: updatedProfile.state,
                country: updatedProfile.country,
                sex: updatedProfile.sex,
                premium: updatedProfile.premium,
                summit: updatedProfile.summit,
                profile: updatedProfile.profile,
                profile_medium: updatedProfile.profile_medium
              },
              'strava.updatedAt': new Date()
            }
          }
        );

        console.log(`✅ Updated athlete profile for user ${userId}`);
      } catch (updateError) {
        console.error(`❌ Failed to update athlete profile for user ${userId}:`, updateError);
      }
    }, 2000); // Wait 2 seconds

  } catch (error) {
    console.error('❌ Failed to handle athlete update:', error);
  }
}

export default router;