import mongoose from 'mongoose';

const stravaActivitySchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Strava Activity ID (unique identifier from Strava)
  stravaId: {
    type: Number,
    required: true,
    index: true
  },
  
  // Ensure unique combination of userId and stravaId
  _composite: {
    type: String,
    unique: true,
    index: true
  },

  // Basic Activity Info
  name: String,
  description: String,
  type: {
    type: String,
    required: true,
    index: true
  },
  sport_type: String,
  workout_type: Number,
  
  // Activity Details
  distance: Number, // meters
  moving_time: Number, // seconds
  elapsed_time: Number, // seconds
  total_elevation_gain: Number, // meters
  elev_high: Number, // meters
  elev_low: Number, // meters
  
  // Performance Metrics
  average_speed: Number, // m/s
  max_speed: Number, // m/s
  average_heartrate: Number, // bpm
  max_heartrate: Number, // bpm
  average_cadence: Number, // rpm
  average_watts: Number, // watts
  weighted_average_watts: Number, // watts
  kilojoules: Number, // energy
  device_watts: Boolean,
  has_heartrate: Boolean,
  
  // Timing & Location
  start_date: Date,
  start_date_local: Date,
  timezone: String,
  utc_offset: Number,
  start_latlng: [Number], // [lat, lng]
  end_latlng: [Number], // [lat, lng]
  location_city: String,
  location_state: String,
  location_country: String,
  
  // Social & Achievements
  achievement_count: Number,
  kudos_count: Number,
  comment_count: Number,
  athlete_count: Number,
  photo_count: Number,
  trainer: Boolean,
  commute: Boolean,
  manual: Boolean,
  private: Boolean,
  visibility: String,
  flagged: Boolean,
  
  // Strava Specific
  gear_id: String,
  external_id: String,
  upload_id: String,
  from_accepted_tag: Boolean,
  suffer_score: Number,
  
  // Map & Route
  map: {
    id: String,
    summary_polyline: String,
    resource_state: Number
  },
  
  // Splits Data
  splits_metric: [{
    distance: Number,
    elapsed_time: Number,
    elevation_difference: Number,
    moving_time: Number,
    split: Number,
    average_speed: Number,
    pace_zone: Number
  }],
  
  splits_standard: [{
    distance: Number,
    elapsed_time: Number,
    elevation_difference: Number,
    moving_time: Number,
    split: Number,
    average_speed: Number,
    pace_zone: Number
  }],
  
  // Laps Data
  laps: [{
    id: Number,
    resource_state: Number,
    name: String,
    elapsed_time: Number,
    moving_time: Number,
    start_date: Date,
    start_date_local: Date,
    distance: Number,
    start_index: Number,
    end_index: Number,
    total_elevation_gain: Number,
    average_speed: Number,
    max_speed: Number,
    average_heartrate: Number,
    max_heartrate: Number,
    lap_index: Number,
    split: Number
  }],
  
  // Weather (if available)
  weather: {
    temperature: Number, // celsius
    apparent_temperature: Number,
    humidity: Number, // percentage
    wind_speed: Number, // m/s
    wind_direction: Number, // degrees
    weather_main: String,
    weather_description: String
  },
  
  // Sync metadata
  syncedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: Date,
  
  // Import status
  importedToWorkout: {
    type: Boolean,
    default: false
  },
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
    sparse: true
  }
}, {
  timestamps: true,
  collection: 'strava_activities'
});

// Compound index for userId + stravaId uniqueness
stravaActivitySchema.index({ userId: 1, stravaId: 1 }, { unique: true });

// Index for efficient queries
stravaActivitySchema.index({ userId: 1, start_date: -1 });
stravaActivitySchema.index({ userId: 1, type: 1 });
stravaActivitySchema.index({ syncedAt: -1 });

// Pre-save hook to set composite key
stravaActivitySchema.pre('save', function(next) {
  this._composite = `${this.userId}_${this.stravaId}`;
  next();
});

// Instance method to convert to DeyaRun workout format
stravaActivitySchema.methods.toWorkoutFormat = function() {
  return {
    userId: this.userId,
    type: this.mapActivityType(this.type),
    name: this.name || 'Strava Activity',
    description: `Imported from Strava - ${this.type}`,
    startedAt: this.start_date, // Changed from startTime to startedAt
    finishedAt: new Date(this.start_date.getTime() + (this.elapsed_time * 1000)), // Changed from endTime to finishedAt
    duration: this.elapsed_time,
    distance: this.distance,
    elevation: this.total_elevation_gain,
    averagePace: this.distance && this.moving_time ? 
      (this.moving_time / 60) / (this.distance / 1000) : null,
    calories: this.kilojoules ? Math.round(this.kilojoules * 0.239) : null,
    averageHeartRate: this.average_heartrate, // Changed structure to match Workout model
    maxHeartRate: this.max_heartrate,
    averagePower: this.average_watts,
    maxPower: this.weighted_average_watts,
    cadence: this.average_cadence,
    source: 'strava',
    externalData: {
      stravaActivityId: this.stravaId,
      originalData: {
        kudos_count: this.kudos_count,
        comment_count: this.comment_count,
        athlete_count: this.athlete_count,
        suffer_score: this.suffer_score,
        achievement_count: this.achievement_count,
        visibility: this.visibility,
        commute: this.commute
      }
    },
    status: 'completed'
  };
};

// Helper method to map Strava activity types to DeyaRun workout types
stravaActivitySchema.methods.mapActivityType = function(stravaType) {
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
};

// Static method to find by user and activity ID
stravaActivitySchema.statics.findByUserAndStravaId = function(userId, stravaId) {
  return this.findOne({ userId, stravaId });
};

// Static method to get user's activity stats
stravaActivitySchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        totalMovingTime: { $sum: '$moving_time' },
        totalElevation: { $sum: '$total_elevation_gain' },
        totalKudos: { $sum: '$kudos_count' },
        avgDistance: { $avg: '$distance' },
        avgMovingTime: { $avg: '$moving_time' },
        avgHeartRate: { $avg: '$average_heartrate' },
        maxHeartRate: { $max: '$max_heartrate' },
        avgPower: { $avg: '$average_watts' },
        maxPower: { $max: '$weighted_average_watts' }
      }
    }
  ]);
};

const StravaActivity = mongoose.model('StravaActivity', stravaActivitySchema);

export default StravaActivity;