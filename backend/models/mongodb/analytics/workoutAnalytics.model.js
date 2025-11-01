import mongoose from 'mongoose';

const WorkoutAnalyticsSchema = new mongoose.Schema({
  workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
      required: true,
      unique: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    
    // Performance Analysis
    paceAnalysis: {
      consistencyScore: Number, // 0-100, how consistent was the pace
      paceVariation: Number,    // standard deviation of pace
      fastestKm: {
        pace: Number,
        kmNumber: Number
      },
      slowestKm: {
        pace: Number,
        kmNumber: Number
      }
    },
    
    // Heart Rate Analysis
    heartRateAnalysis: {
      restingHR: Number,
      maxHR: Number,
      averageHR: Number,
      hrReserve: Number,
      recoveryTime: Number // seconds to return to resting HR
    },
    
    // Efficiency Metrics
    efficiency: {
      energyExpenditure: Number,
      runningEconomy: Number,
      cardiacDrift: Number,
      fatigueIndex: Number
    },
    
    // Route Analysis
    routeAnalysis: {
      terrainType: String, // flat, hilly, mountainous
      surfaceType: String, // road, trail, track, treadmill
      elevationProfile: String, // net_uphill, net_downhill, loop, out_and_back
      technicalDifficulty: Number // 1-5 scale
    },
    
    // Weather Impact
    weatherImpact: {
      temperatureEffect: String, // helped, hindered, neutral
      windEffect: String,
      humidityEffect: String,
      overallWeatherScore: Number // -2 to +2
    },
    
    // Personal Records
    personalRecords: [{
      category: String, // fastest_5k, longest_run, best_pace, etc.
      value: Number,
      unit: String,
      previousRecord: Number,
      improvement: Number
    }],
    
    // Calculated At
    analyzedAt: {
      type: Date,
      default: Date.now
    }
    
}, {
  timestamps: true,
  collection: 'workout_analytics'
});

// Indexes
WorkoutAnalyticsSchema.index({ userId: 1, 'personalRecords.category': 1 });

export const WorkoutAnalytics = mongoose.model('WorkoutAnalytics', WorkoutAnalyticsSchema);