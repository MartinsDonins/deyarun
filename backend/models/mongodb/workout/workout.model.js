// Updated backend/models/mongodb/workout/workout.model.js
// Fix: Make startLocation and endLocation truly optional using Mixed type

import mongoose from 'mongoose';

const WorkoutSchema = new mongoose.Schema({
  // Reference to PostgreSQL User
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Workout Session Info
  name: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['running', 'walking', 'cycling', 'hiking', 'other'],
    default: 'running'
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'paused', 'completed', 'cancelled'],
    default: 'planned'
  },
  
  // Timing Data
  startedAt: {
    type: Date,
    required: true
  },
  finishedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // total duration in seconds
    default: 0
  },
  pausedTime: {
    type: Number, // total paused time in seconds
    default: 0
  },
  
  // Performance Metrics (calculated from GPS data)
  distance: {
    type: Number, // total distance in meters
    default: 0
  },
  averagePace: {
    type: Number, // average pace in min/km
    default: null
  },
  bestPace: {
    type: Number, // best pace in min/km
    default: null
  },
  calories: {
    type: Number, // estimated calories burned
    default: null
  },
  
  // Heart Rate Data
  averageHeartRate: {
    type: Number,
    default: null
  },
  maxHeartRate: {
    type: Number,
    default: null
  },
  heartRateZones: {
    zone1: { type: Number, default: 0 }, // seconds in each zone
    zone2: { type: Number, default: 0 },
    zone3: { type: Number, default: 0 },
    zone4: { type: Number, default: 0 },
    zone5: { type: Number, default: 0 }
  },
  
  // Elevation Data
  elevationGain: {
    type: Number, // total elevation gain in meters
    default: 0
  },
  elevationLoss: {
    type: Number, // total elevation loss in meters
    default: 0
  },
  maxElevation: {
    type: Number,
    default: null
  },
  minElevation: {
    type: Number,
    default: null
  },
  
  // Route Data (GeoJSON)
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: {
      type: [[Number]], // [longitude, latitude] pairs
      default: []
    }
  },
  
  // 🎯 FIXED: Start/End Locations - Using Mixed type for true optionality
  startLocation: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    validate: {
      validator: function(v) {
        // Allow null or a valid GeoJSON Point
        if (v === null || v === undefined) return true;
        return v.type === 'Point' && 
               Array.isArray(v.coordinates) && 
               v.coordinates.length === 2;
      },
      message: 'startLocation must be null or a valid GeoJSON Point'
    }
  },
  endLocation: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    validate: {
      validator: function(v) {
        // Allow null or a valid GeoJSON Point
        if (v === null || v === undefined) return true;
        return v.type === 'Point' && 
               Array.isArray(v.coordinates) && 
               v.coordinates.length === 2;
      },
      message: 'endLocation must be null or a valid GeoJSON Point'
    }
  },
  
  // Weather Data
  weather: {
    temperature: Number, // Celsius
    humidity: Number,    // percentage
    windSpeed: Number,   // km/h
    windDirection: Number, // degrees
    condition: String,   // sunny, cloudy, rainy, etc.
    feelsLike: Number   // perceived temperature
  },
  
  // User Experience Data
  effortLevel: {
    type: Number, // 1-10 perceived effort
    min: 1,
    max: 10,
    default: null
  },
  
  // Manual completion data
  actualDuration: {
    type: Number, // actual duration in minutes (for manual entry)
    default: null
  },
  actualDistance: {
    type: Number, // actual distance in km (for manual entry)
    default: null
  },
  actualPace: {
    type: String, // manual pace entry like "5:30/km"
    default: null
  },
  completedTime: {
    type: Date, // when the workout was marked as completed
    default: null
  },
  completionNotes: {
    type: String, // additional notes when marking completed
    default: null
  },
  mood: {
    pre: {
      type: String,
      enum: ['energetic', 'tired', 'motivated', 'reluctant', 'neutral']
    },
    post: {
      type: String,
      enum: ['accomplished', 'exhausted', 'energized', 'disappointed', 'satisfied']
    }
  },
  
  // Notes and Social
  notes: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareWithCoach: {
    type: Boolean,
    default: false
  },
  
  // Device and App Info
  deviceInfo: {
    deviceType: String, // ios, android
    appVersion: String,
    gpsAccuracy: String, // high, medium, low
    batteryAtStart: Number,
    batteryAtEnd: Number
  },
  
  // Data Source Information (UPDATED: Multiple sources support)
  source: {
    type: String,
    enum: ['manual', 'strava', 'google_fit', 'apple_health', 'garmin', 'fitbit', 'app'],
    default: 'manual'
  },
  // 🎯 NEW: Multiple sources tracking (when activity synced from multiple platforms)
  sources: [{
    platform: {
      type: String,
      enum: ['manual', 'strava', 'google_fit', 'apple_health', 'garmin', 'fitbit', 'app'],
      required: true
    },
    externalId: String, // Activity ID from external platform
    syncedAt: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed // Platform-specific data
  }],
  // 🎯 NEW: Primary source (first one that created the activity)
  primarySource: {
    type: String,
    enum: ['manual', 'strava', 'google_fit', 'apple_health', 'garmin', 'fitbit', 'app'],
    default: 'manual'
  },
  // Legacy external data (kept for backwards compatibility)
  externalData: {
    stravaActivityId: String,
    googleFitSessionId: String,
    originalData: mongoose.Schema.Types.Mixed // Store original data from external source
  },
  
  // References to PostgreSQL
  plannedWorkoutId: {
    type: String, // Reference to PostgreSQL PlannedWorkout
    default: null
  },
  trainingPlanId: {
    type: String, // Reference to PostgreSQL TrainingPlan
    default: null
  },
  
  // Aggregated Statistics (for quick access)
  stats: {
    totalSteps: Number,
    cadence: Number, // steps per minute
    strideLength: Number, // meters
    verticalRatio: Number,
    groundContactTime: Number
  },
  
  // Generation tracking
  isGenerated: {
    type: Boolean,
    default: false
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  workoutData: {
    type: mongoose.Schema.Types.Mixed, // Flexible structure for generated workouts
    default: null
  }
}, {
  timestamps: true,
  collection: 'workouts'
});

// Indexes
WorkoutSchema.index({ userId: 1, startedAt: -1 });
WorkoutSchema.index({ status: 1, startedAt: -1 });
WorkoutSchema.index({ userId: 1, type: 1, startedAt: -1 });
WorkoutSchema.index({ userId: 1, 'externalData.stravaActivityId': 1 }); // For duplicate checking

export const Workout = mongoose.model('Workout', WorkoutSchema);
export default Workout;