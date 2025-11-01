/**
 * Activity Duplicate Detector
 *
 * Detects duplicate activities across multiple platforms (Strava, Google Fit, App)
 * based on time overlap and merges them with multiple source tracking.
 *
 * Rules:
 * - Activities overlap if they start within TIME_THRESHOLD (default 5 minutes)
 * - Duration difference should be within DURATION_THRESHOLD (default 10%)
 * - When merging, preserve all source metadata and combine data
 */

import { Workout } from '../models/mongodb/workout/workout.model.js';

// Configuration
const TIME_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const DURATION_THRESHOLD_PERCENT = 0.10; // 10% difference allowed

class ActivityDuplicateDetector {
  /**
   * Check if two activities overlap based on start time and duration
   */
  areActivitiesOverlapping(activity1, activity2) {
    const start1 = new Date(activity1.startedAt).getTime();
    const start2 = new Date(activity2.startedAt).getTime();

    const duration1 = activity1.duration || 0;
    const duration2 = activity2.duration || 0;

    // Check if start times are within threshold
    const timeDiff = Math.abs(start1 - start2);
    if (timeDiff > TIME_THRESHOLD_MS) {
      return false;
    }

    // Check if durations are similar (within 10% difference)
    if (duration1 > 0 && duration2 > 0) {
      const maxDuration = Math.max(duration1, duration2);
      const durationDiff = Math.abs(duration1 - duration2);
      const durationDiffPercent = durationDiff / maxDuration;

      if (durationDiffPercent > DURATION_THRESHOLD_PERCENT) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find existing activities that might be duplicates
   */
  async findPotentialDuplicates(userId, newActivity) {
    const startTime = new Date(newActivity.startedAt);
    const searchStartTime = new Date(startTime.getTime() - TIME_THRESHOLD_MS);
    const searchEndTime = new Date(startTime.getTime() + TIME_THRESHOLD_MS);

    console.log('🔍 [Duplicate Detection] Searching for duplicates:', {
      userId,
      activityStartTime: startTime.toISOString(),
      searchWindow: {
        from: searchStartTime.toISOString(),
        to: searchEndTime.toISOString()
      },
      newActivityDuration: newActivity.duration
    });

    // Find activities within time window
    const potentialDuplicates = await Workout.find({
      userId: userId,
      startedAt: {
        $gte: searchStartTime,
        $lte: searchEndTime
      },
      status: { $ne: 'cancelled' }
    });

    console.log('📊 [Duplicate Detection] Found candidates:', potentialDuplicates.length);

    // Filter by duration similarity
    const duplicates = potentialDuplicates.filter(existing =>
      this.areActivitiesOverlapping(existing, newActivity)
    );

    console.log('✅ [Duplicate Detection] Matching duplicates:', duplicates.length);

    return duplicates;
  }

  /**
   * Merge new activity data into existing activity
   * Preserves all source information and combines metrics
   */
  async mergeActivities(existingActivity, newActivity, newSource) {
    console.log('🔄 [Activity Merge] Merging activities:', {
      existingId: existingActivity._id,
      existingSources: existingActivity.sources?.map(s => s.platform) || [existingActivity.source],
      newSource: newSource
    });

    // Initialize sources array if it doesn't exist
    if (!existingActivity.sources || existingActivity.sources.length === 0) {
      existingActivity.sources = [{
        platform: existingActivity.source || existingActivity.primarySource || 'manual',
        externalId: existingActivity.externalData?.stravaActivityId ||
                    existingActivity.externalData?.googleFitSessionId || null,
        syncedAt: existingActivity.createdAt || new Date(),
        data: existingActivity.externalData?.originalData || null
      }];
      existingActivity.primarySource = existingActivity.source || 'manual';
    }

    // Check if source already exists
    const existingSourceIndex = existingActivity.sources.findIndex(
      s => s.platform === newSource.platform
    );

    if (existingSourceIndex >= 0) {
      console.log('⚠️ [Activity Merge] Source already exists, updating:', newSource.platform);
      existingActivity.sources[existingSourceIndex] = {
        ...existingActivity.sources[existingSourceIndex],
        ...newSource,
        syncedAt: new Date()
      };
    } else {
      console.log('➕ [Activity Merge] Adding new source:', newSource.platform);
      existingActivity.sources.push({
        ...newSource,
        syncedAt: new Date()
      });
    }

    // Merge metrics - prefer more complete data
    if (newActivity.distance && (!existingActivity.distance || newActivity.distance > existingActivity.distance)) {
      existingActivity.distance = newActivity.distance;
    }

    if (newActivity.duration && (!existingActivity.duration || newActivity.duration > existingActivity.duration)) {
      existingActivity.duration = newActivity.duration;
    }

    if (newActivity.calories && !existingActivity.calories) {
      existingActivity.calories = newActivity.calories;
    }

    if (newActivity.averageHeartRate && !existingActivity.averageHeartRate) {
      existingActivity.averageHeartRate = newActivity.averageHeartRate;
    }

    if (newActivity.maxHeartRate && !existingActivity.maxHeartRate) {
      existingActivity.maxHeartRate = newActivity.maxHeartRate;
    }

    if (newActivity.elevationGain && !existingActivity.elevationGain) {
      existingActivity.elevationGain = newActivity.elevationGain;
    }

    // Prefer route from GPS-enabled sources (Strava, Google Fit) over manual
    if (newActivity.route && newActivity.route.coordinates && newActivity.route.coordinates.length > 0) {
      if (!existingActivity.route || !existingActivity.route.coordinates ||
          existingActivity.route.coordinates.length < newActivity.route.coordinates.length) {
        existingActivity.route = newActivity.route;
      }
    }

    // Update name if new one is more descriptive
    if (newActivity.name && newActivity.name !== 'Workout' &&
        (!existingActivity.name || existingActivity.name === 'Workout')) {
      existingActivity.name = newActivity.name;
    }

    await existingActivity.save();

    console.log('✅ [Activity Merge] Merge completed:', {
      activityId: existingActivity._id,
      totalSources: existingActivity.sources.length,
      sources: existingActivity.sources.map(s => s.platform)
    });

    return existingActivity;
  }

  /**
   * Process new activity and handle duplicates
   * Returns either new activity ID or existing merged activity ID
   */
  async processActivity(userId, activityData, sourcePlatform, externalId) {
    console.log('🎯 [Activity Processing] Starting:', {
      userId,
      sourcePlatform,
      externalId,
      startedAt: activityData.startedAt
    });

    // Check for duplicates
    const duplicates = await this.findPotentialDuplicates(userId, activityData);

    if (duplicates.length > 0) {
      // Merge with first duplicate found
      const existingActivity = duplicates[0];

      const sourceData = {
        platform: sourcePlatform,
        externalId: externalId,
        data: activityData.externalData?.originalData || null
      };

      const mergedActivity = await this.mergeActivities(
        existingActivity,
        activityData,
        sourceData
      );

      return {
        isDuplicate: true,
        activityId: mergedActivity._id,
        message: `Activity merged with existing activity from ${existingActivity.primarySource}`,
        sources: mergedActivity.sources.map(s => s.platform)
      };
    }

    // No duplicates - create new activity
    const newActivity = new Workout({
      ...activityData,
      userId: userId,
      source: sourcePlatform,
      primarySource: sourcePlatform,
      sources: [{
        platform: sourcePlatform,
        externalId: externalId,
        syncedAt: new Date(),
        data: activityData.externalData?.originalData || null
      }]
    });

    await newActivity.save();

    console.log('✅ [Activity Processing] New activity created:', {
      activityId: newActivity._id,
      source: sourcePlatform
    });

    return {
      isDuplicate: false,
      activityId: newActivity._id,
      message: 'New activity created',
      sources: [sourcePlatform]
    };
  }

  /**
   * Get source icon name for frontend display
   */
  getSourceIcon(platform) {
    const iconMap = {
      'strava': 'strava',
      'google_fit': 'google-fit',
      'apple_health': 'apple',
      'garmin': 'garmin',
      'fitbit': 'fitbit',
      'app': 'mobile',
      'manual': 'edit'
    };

    return iconMap[platform] || 'activity';
  }
}

export default new ActivityDuplicateDetector();
