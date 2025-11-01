import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

class GoogleFitService {
  constructor() {
    // Google Fit uses separate callback URL from Google OAuth
    const googleFitRedirectUri = process.env.GOOGLE_FIT_REDIRECT_URI ||
                                  'https://api.deyarun.com/api/google-fit/callback';

    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      googleFitRedirectUri
    );

    console.log('🏋️ [Google Fit Service] Initialized with redirect URI:', googleFitRedirectUri);

    this.fitness = google.fitness({ version: 'v1', auth: this.oauth2Client });
    
    // Google Fit data types
    this.DATA_TYPES = {
      STEPS: 'com.google.step_count.delta',
      DISTANCE: 'com.google.distance.delta',
      CALORIES: 'com.google.calories.expended',
      ACTIVE_MINUTES: 'com.google.active_minutes',
      HEART_RATE: 'com.google.heart_rate.bpm',
      SPEED: 'com.google.speed',
      LOCATION: 'com.google.location.sample',
      ACTIVITY: 'com.google.activity.segment'
    };
    
    // Activity types mapping
    this.ACTIVITY_TYPES = {
      1: 'biking',
      7: 'walking',
      8: 'running',
      9: 'aerobics',
      10: 'badminton',
      11: 'baseball',
      12: 'basketball',
      13: 'biathlon',
      14: 'handbiking',
      15: 'mountain_biking',
      16: 'road_biking',
      17: 'spinning',
      18: 'stationary_biking',
      19: 'utility_biking',
      20: 'boxing',
      21: 'calisthenics',
      22: 'circuit_training',
      23: 'cricket',
      24: 'crossfit',
      25: 'curling',
      26: 'dancing',
      27: 'diving',
      28: 'elevator',
      29: 'elliptical',
      30: 'ergometer',
      31: 'escalator',
      32: 'fencing',
      33: 'football_american',
      34: 'football_australian',
      35: 'football_soccer',
      36: 'frisbee',
      37: 'gardening',
      38: 'golf',
      39: 'gymnastics',
      40: 'handball',
      41: 'hiking',
      42: 'hockey',
      43: 'horseback_riding',
      44: 'housework',
      45: 'ice_skating',
      46: 'in_vehicle',
      47: 'interval_training',
      48: 'jumping_rope',
      49: 'kayaking',
      50: 'kettlebell_training',
      51: 'kickboxing',
      52: 'kitesurfing',
      53: 'martial_arts',
      54: 'meditation',
      55: 'mixed_martial_arts',
      56: 'p90x',
      57: 'paragliding',
      58: 'pilates',
      59: 'polo',
      60: 'racquetball',
      61: 'rock_climbing',
      62: 'rowing',
      63: 'rowing_machine',
      64: 'rugby',
      65: 'jogging',
      66: 'running_sand',
      67: 'running_treadmill',
      68: 'sailing',
      69: 'scuba_diving',
      70: 'skateboarding',
      71: 'skating',
      72: 'skiing',
      73: 'skiing_back_country',
      74: 'skiing_cross_country',
      75: 'skiing_downhill',
      76: 'skiing_kite',
      77: 'skiing_roller',
      78: 'sledding',
      79: 'sleeping',
      80: 'snowboarding',
      81: 'snowmobile',
      82: 'snowshoeing',
      83: 'softball',
      84: 'squash',
      85: 'stair_climbing',
      86: 'stair_climbing_machine',
      87: 'standup_paddleboarding',
      88: 'still',
      89: 'strength_training',
      90: 'surfing',
      91: 'swimming',
      92: 'swimming_pool',
      93: 'swimming_open_water',
      94: 'table_tennis',
      95: 'team_sports',
      96: 'tennis',
      97: 'treadmill',
      98: 'unknown',
      99: 'volleyball',
      100: 'volleyball_beach',
      101: 'volleyball_indoor',
      102: 'wakeboarding',
      103: 'walking_fitness',
      104: 'walking_nordic',
      105: 'walking_treadmill',
      106: 'walking_stroller',
      107: 'water_polo',
      108: 'weightlifting',
      109: 'wheelchair',
      110: 'windsurfing',
      111: 'yoga',
      112: 'zumba'
    };
  }

  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.location.read',
      'https://www.googleapis.com/auth/fitness.nutrition.read'
    ];
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code) {
    try {
      console.log('🔄 [Google Fit] Exchanging code for tokens...');
      const { tokens } = await this.oauth2Client.getToken(code);
      console.log('✅ [Google Fit] Token exchange successful');
      console.log('🔑 [Google Fit] Token details:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date
      });
      return tokens;
    } catch (error) {
      console.error('❌ [Google Fit] Error getting tokens:', error.message);
      console.error('❌ [Google Fit] Full error:', error);
      throw new Error(`Failed to get Google Fit tokens: ${error.message}`);
    }
  }

  /**
   * Set user credentials
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing Google Fit token:', error);
      throw new Error('Failed to refresh Google Fit token');
    }
  }

  /**
   * Get fitness data for a specific data type and time range
   */
  async getFitnessData(dataTypeName, startTime, endTime) {
    try {
      const request = {
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: dataTypeName
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis: startTime,
          endTimeMillis: endTime
        }
      };

      const response = await this.fitness.users.dataset.aggregate(request);
      return response.data;
    } catch (error) {
      console.error('Error getting fitness data:', error);
      throw new Error(`Failed to get fitness data: ${error.message}`);
    }
  }

  /**
   * Get steps data
   */
  async getStepsData(startTime, endTime) {
    return await this.getFitnessData(this.DATA_TYPES.STEPS, startTime, endTime);
  }

  /**
   * Get distance data
   */
  async getDistanceData(startTime, endTime) {
    return await this.getFitnessData(this.DATA_TYPES.DISTANCE, startTime, endTime);
  }

  /**
   * Get calories data
   */
  async getCaloriesData(startTime, endTime) {
    return await this.getFitnessData(this.DATA_TYPES.CALORIES, startTime, endTime);
  }

  /**
   * Get heart rate data
   */
  async getHeartRateData(startTime, endTime) {
    return await this.getFitnessData(this.DATA_TYPES.HEART_RATE, startTime, endTime);
  }

  /**
   * Get activity sessions
   */
  async getActivitySessions(startTime, endTime) {
    try {
      const request = {
        userId: 'me',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      };

      const response = await this.fitness.users.sessions.list(request);
      return response.data;
    } catch (error) {
      console.error('Error getting activity sessions:', error);
      throw new Error(`Failed to get activity sessions: ${error.message}`);
    }
  }

  /**
   * Get comprehensive fitness summary
   */
  async getFitnessSummary(startTime, endTime) {
    try {
      const [steps, distance, calories, heartRate, sessions] = await Promise.all([
        this.getStepsData(startTime, endTime).catch(err => ({ error: err.message })),
        this.getDistanceData(startTime, endTime).catch(err => ({ error: err.message })),
        this.getCaloriesData(startTime, endTime).catch(err => ({ error: err.message })),
        this.getHeartRateData(startTime, endTime).catch(err => ({ error: err.message })),
        this.getActivitySessions(startTime, endTime).catch(err => ({ error: err.message }))
      ]);

      return {
        timeRange: {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString()
        },
        steps: this.processStepsData(steps),
        distance: this.processDistanceData(distance),
        calories: this.processCaloriesData(calories),
        heartRate: this.processHeartRateData(heartRate),
        activities: this.processActivitySessions(sessions)
      };
    } catch (error) {
      console.error('Error getting fitness summary:', error);
      throw new Error(`Failed to get fitness summary: ${error.message}`);
    }
  }

  /**
   * Process steps data
   */
  processStepsData(stepsData) {
    if (stepsData.error) return { error: stepsData.error };
    
    try {
      const dailySteps = [];
      let totalSteps = 0;

      if (stepsData.bucket) {
        stepsData.bucket.forEach(bucket => {
          const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
          let steps = 0;

          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              if (point.value && point.value[0]) {
                steps += point.value[0].intVal || 0;
              }
            });
          }

          dailySteps.push({ date, steps });
          totalSteps += steps;
        });
      }

      return {
        totalSteps,
        dailySteps,
        averageSteps: dailySteps.length > 0 ? Math.round(totalSteps / dailySteps.length) : 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Process distance data
   */
  processDistanceData(distanceData) {
    if (distanceData.error) return { error: distanceData.error };
    
    try {
      const dailyDistance = [];
      let totalDistance = 0;

      if (distanceData.bucket) {
        distanceData.bucket.forEach(bucket => {
          const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
          let distance = 0;

          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              if (point.value && point.value[0]) {
                distance += point.value[0].fpVal || 0;
              }
            });
          }

          // Convert from meters to kilometers
          distance = Math.round(distance / 1000 * 100) / 100;
          dailyDistance.push({ date, distance });
          totalDistance += distance;
        });
      }

      return {
        totalDistance: Math.round(totalDistance * 100) / 100,
        dailyDistance,
        averageDistance: dailyDistance.length > 0 ? Math.round(totalDistance / dailyDistance.length * 100) / 100 : 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Process calories data
   */
  processCaloriesData(caloriesData) {
    if (caloriesData.error) return { error: caloriesData.error };
    
    try {
      const dailyCalories = [];
      let totalCalories = 0;

      if (caloriesData.bucket) {
        caloriesData.bucket.forEach(bucket => {
          const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
          let calories = 0;

          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              if (point.value && point.value[0]) {
                calories += point.value[0].fpVal || 0;
              }
            });
          }

          calories = Math.round(calories);
          dailyCalories.push({ date, calories });
          totalCalories += calories;
        });
      }

      return {
        totalCalories: Math.round(totalCalories),
        dailyCalories,
        averageCalories: dailyCalories.length > 0 ? Math.round(totalCalories / dailyCalories.length) : 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Process heart rate data
   */
  processHeartRateData(heartRateData) {
    if (heartRateData.error) return { error: heartRateData.error };
    
    try {
      const heartRateReadings = [];
      let totalReadings = 0;
      let sum = 0;
      let min = Infinity;
      let max = 0;

      if (heartRateData.bucket) {
        heartRateData.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              if (point.value && point.value[0]) {
                const bpm = point.value[0].fpVal || 0;
                const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000).toISOString();
                
                heartRateReadings.push({ timestamp, bpm: Math.round(bpm) });
                sum += bpm;
                totalReadings++;
                min = Math.min(min, bpm);
                max = Math.max(max, bpm);
              }
            });
          }
        });
      }

      return {
        readings: heartRateReadings,
        averageHeartRate: totalReadings > 0 ? Math.round(sum / totalReadings) : 0,
        minHeartRate: min === Infinity ? 0 : Math.round(min),
        maxHeartRate: Math.round(max),
        totalReadings
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Process activity sessions
   */
  processActivitySessions(sessionsData) {
    if (sessionsData.error) return { error: sessionsData.error };
    
    try {
      const activities = [];

      if (sessionsData.session) {
        sessionsData.session.forEach(session => {
          const activity = {
            id: session.id,
            name: session.name,
            description: session.description,
            activityType: this.ACTIVITY_TYPES[session.activityType] || 'unknown',
            activityTypeId: session.activityType,
            startTime: session.startTimeMillis ? new Date(parseInt(session.startTimeMillis)).toISOString() : null,
            endTime: session.endTimeMillis ? new Date(parseInt(session.endTimeMillis)).toISOString() : null,
            duration: session.endTimeMillis && session.startTimeMillis ? 
              parseInt(session.endTimeMillis) - parseInt(session.startTimeMillis) : 0,
            application: session.application ? {
              packageName: session.application.packageName,
              version: session.application.version
            } : null
          };

          // Calculate duration in minutes
          if (activity.duration > 0) {
            activity.durationMinutes = Math.round(activity.duration / 60000);
          }

          activities.push(activity);
        });
      }

      return {
        totalActivities: activities.length,
        activities: activities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Convert activity to DeyaRun workout format
   */
  convertToWorkout(googleFitActivity, userId) {
    const workout = {
      userId: userId,
      source: 'google_fit',
      externalId: googleFitActivity.id,
      name: googleFitActivity.name || `${googleFitActivity.activityType} Activity`,
      type: this.mapActivityTypeToDeyaRun(googleFitActivity.activityType),
      date: googleFitActivity.startTime,
      duration: googleFitActivity.durationMinutes || 0,
      status: 'completed',
      metrics: {
        duration: googleFitActivity.durationMinutes || 0
      },
      description: googleFitActivity.description || `Imported from Google Fit`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return workout;
  }

  /**
   * Map Google Fit activity type to DeyaRun workout type
   */
  mapActivityTypeToDeyaRun(googleFitActivityType) {
    const mapping = {
      'running': 'running',
      'jogging': 'running',
      'running_treadmill': 'running',
      'running_sand': 'running',
      'walking': 'walking',
      'walking_fitness': 'walking',
      'walking_nordic': 'walking',
      'walking_treadmill': 'walking',
      'biking': 'cycling',
      'road_biking': 'cycling',
      'mountain_biking': 'cycling',
      'stationary_biking': 'cycling',
      'swimming': 'swimming',
      'swimming_pool': 'swimming',
      'swimming_open_water': 'swimming',
      'strength_training': 'strength',
      'weightlifting': 'strength',
      'yoga': 'flexibility',
      'pilates': 'flexibility',
      'aerobics': 'cardio',
      'dancing': 'cardio',
      'zumba': 'cardio'
    };

    return mapping[googleFitActivityType] || 'other';
  }
}

export default GoogleFitService;