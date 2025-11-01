import mongoose from 'mongoose';

/**
 * Advanced Workout Analytics Schema
 * Stores complex performance metrics and AI-generated insights
 */

const AdvancedWorkoutAnalyticsSchema = new mongoose.Schema({
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
  
  // Advanced Performance Metrics
  performanceMetrics: {
    // Power Analysis
    powerAnalysis: {
      normalizedPower: Number,        // Watts (estimated)
      powerVariabilityIndex: Number,  // Power consistency
      trainingStressScore: Number,    // TSS based on power/pace
      intensityFactor: Number         // Relative intensity
    },
    
    // Biomechanical Metrics
    biomechanics: {
      cadence: {
        average: Number,              // Steps per minute
        variability: Number,          // Standard deviation
        optimalRange: {
          min: Number,
          max: Number
        }
      },
      strideLength: {
        average: Number,              // Meters
        variability: Number,
        efficiency: Number            // Stride efficiency score
      },
      groundContactTime: Number,      // Milliseconds (if available)
      verticalOscillation: Number,    // Centimeters (if available)
      groundContactBalance: Number    // Left/right balance %
    },
    
    // Energy Expenditure Analysis
    energyAnalysis: {
      totalEnergyExpenditure: Number, // kCal
      energyDensity: Number,          // kCal per km
      fatBurn: Number,                // % of calories from fat
      carbBurn: Number,               // % of calories from carbs
      metabolicEfficiency: Number     // Energy per unit distance
    },
    
    // Recovery Metrics
    recoveryMetrics: {
      heartRateRecovery: {
        oneMinute: Number,            // HR drop after 1 min
        threeMinute: Number,          // HR drop after 3 min
        recoveryScore: Number         // Overall recovery rating 0-100
      },
      perceivedExertion: Number,      // RPE scale 1-10
      muscularFatigue: Number,        // Estimated fatigue level
      dehydrationLevel: Number        // Estimated fluid loss %
    }
  },
  
  // Environmental Impact Analysis
  environmentalFactors: {
    weather: {
      temperature: Number,            // Celsius
      humidity: Number,               // Percentage
      windSpeed: Number,              // km/h
      windDirection: Number,          // Degrees
      airPressure: Number,            // hPa
      weatherImpactScore: Number      // -2 to +2 impact on performance
    },
    terrain: {
      surfaceType: {
        type: String,
        enum: ['road', 'trail', 'track', 'treadmill', 'mixed'],
        default: 'road'
      },
      elevationProfile: {
        netGain: Number,              // Total elevation gain
        netLoss: Number,              // Total elevation loss
        steepestGrade: Number,        // Maximum gradient %
        avgGrade: Number,             // Average gradient %
        hillScore: Number             // Difficulty rating 1-10
      },
      airQuality: {
        aqi: Number,                  // Air Quality Index
        pm25: Number,                 // PM2.5 μg/m³
        impactScore: Number           // Impact on performance
      }
    }
  },
  
  // Advanced Split Analysis
  splitAnalysis: {
    pacing: {
      strategy: {
        type: String,
        enum: ['even', 'negative', 'positive', 'variable', 'fartlek'],
        default: 'even'
      },
      pacingConsistency: Number,      // CV of pace splits
      fastestSplit: {
        splitNumber: Number,
        pace: Number,
        time: Number
      },
      slowestSplit: {
        splitNumber: Number,
        pace: Number,
        time: Number
      },
      negativeSpits: Number,          // Number of negative splits
      pacingEfficiency: Number        // Overall pacing score 0-100
    },
    
    // Kilometer/Mile splits analysis
    splits: [{
      splitNumber: Number,
      distance: Number,               // Actual split distance
      time: Number,                   // Split time in seconds
      pace: Number,                   // Pace for this split
      heartRate: {
        avg: Number,
        max: Number,
        min: Number
      },
      elevation: {
        gain: Number,
        loss: Number,
        avgGrade: Number
      },
      cadence: Number,
      speed: Number,
      relativePace: Number            // Relative to average pace
    }]
  },
  
  // AI-Generated Insights
  aiInsights: {
    performanceAnalysis: {
      overallScore: Number,           // 0-100 performance rating
      strengths: [String],            // Identified strengths
      weaknesses: [String],           // Areas for improvement
      recommendations: [String],      // Actionable advice
      trainingZoneDistribution: {
        zone1: Number,                // % time in Zone 1 (Active Recovery)
        zone2: Number,                // % time in Zone 2 (Aerobic Base)
        zone3: Number,                // % time in Zone 3 (Aerobic)
        zone4: Number,                // % time in Zone 4 (Threshold)
        zone5: Number                 // % time in Zone 5 (VO2 Max)
      }
    },
    
    // Predictive Analytics
    predictions: {
      nextWorkoutRecommendation: {
        type: String,
        intensity: String,
        duration: Number,
        distance: Number,
        reason: String
      },
      injuryRisk: {
        level: {
          type: String,
          enum: ['low', 'moderate', 'high', 'very_high']
        },
        score: Number,                // 0-100 risk score
        factors: [String],            // Contributing risk factors
        prevention: [String]          // Prevention recommendations
      },
      performanceTrend: {
        direction: {
          type: String,
          enum: ['improving', 'stable', 'declining']
        },
        confidence: Number,           // Confidence in prediction %
        timeframe: String,            // Timeframe for prediction
        projectedImprovement: Number  // Expected improvement %
      }
    },
    
    // Comparative Analysis
    comparison: {
      personalBest: {
        category: String,             // What kind of PB (distance, pace, etc.)
        improvement: Number,          // % improvement from previous best
        isNewRecord: Boolean
      },
      peerComparison: {
        percentile: Number,           // Percentile rank among similar users
        similarUsers: Number,         // Number of similar users compared
        strongerAreas: [String],      // Areas where user is stronger
        weakerAreas: [String]         // Areas where user is weaker
      },
      seasonalComparison: {
        vsLastMonth: Number,          // % change vs last month
        vsLastSeason: Number,         // % change vs same time last year
        trend: String                 // Overall trend direction
      }
    }
  },
  
  // Training Load Analysis
  trainingLoad: {
    acuteLoad: Number,                // 7-day training load
    chronicLoad: Number,              // 28-day training load
    acuteChronic: Number,             // Acute:Chronic ratio
    trainingStressBalance: Number,    // TSB (Fitness - Fatigue)
    rampRate: Number,                 // Weekly load increase %
    monotonus: Number,                // Training monotony index
    strain: Number                    // Training strain index
  },
  
  // GPS and Route Analysis
  routeAnalysis: {
    gpsAccuracy: {
      averageAccuracy: Number,        // Average GPS accuracy in meters
      accuracyVariability: Number,    // Standard deviation
      poorAccuracySegments: Number,   // Number of segments with poor GPS
      dataQualityScore: Number        // Overall GPS data quality 0-100
    },
    
    routeEfficiency: {
      straightLineDistance: Number,   // Direct distance A to B
      actualDistance: Number,         // Actual route distance
      efficiencyRatio: Number,        // Actual / Straight line
      waypointDeviation: Number,      // Average deviation from optimal path
      courseRating: Number            // Route difficulty rating
    },
    
    // Turn and direction analysis
    navigationMetrics: {
      totalTurns: Number,
      sharpTurns: Number,             // Turns > 90 degrees
      directionChanges: Number,       // Total direction changes
      steadyStatePercentage: Number   // % of workout at steady direction
    }
  },
  
  // Data Quality Assessment
  dataQuality: {
    overallScore: Number,             // 0-100 data quality score
    missingDataPoints: [String],      // List of missing metrics
    estimatedFields: [String],        // Fields that were estimated
    confidenceLevel: Number,          // Confidence in analysis accuracy
    dataCompleteness: Number          // % of expected data points present
  },
  
  // Metadata
  analysisMetadata: {
    algorithmVersion: String,         // Version of analysis algorithm used
    processingTime: Number,           // Time taken to analyze (ms)
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    modelConfidence: Number,          // Confidence in AI predictions
    featuresUsed: [String]            // List of features used in analysis
  }
}, {
  timestamps: true,
  collection: 'advanced_workout_analytics'
});

// Indexes for efficient querying
AdvancedWorkoutAnalyticsSchema.index({ userId: 1, 'analysisMetadata.lastUpdated': -1 });
AdvancedWorkoutAnalyticsSchema.index({ 'aiInsights.predictions.injuryRisk.level': 1 });
AdvancedWorkoutAnalyticsSchema.index({ 'performanceMetrics.powerAnalysis.trainingStressScore': 1 });
AdvancedWorkoutAnalyticsSchema.index({ 'aiInsights.performanceAnalysis.overallScore': -1 });

// Virtual for injury risk category
AdvancedWorkoutAnalyticsSchema.virtual('riskCategory').get(function() {
  const score = this.aiInsights?.predictions?.injuryRisk?.score || 0;
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'very_high';
});

// Virtual for performance grade
AdvancedWorkoutAnalyticsSchema.virtual('performanceGrade').get(function() {
  const score = this.aiInsights?.performanceAnalysis?.overallScore || 0;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
});

// Static method to get user's average performance score
AdvancedWorkoutAnalyticsSchema.statics.getUserAveragePerformance = function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        userId: userId,
        'analysisMetadata.lastUpdated': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$aiInsights.performanceAnalysis.overallScore' },
        avgInjuryRisk: { $avg: '$aiInsights.predictions.injuryRisk.score' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get training load trends
AdvancedWorkoutAnalyticsSchema.statics.getTrainingLoadTrend = function(userId, weeks = 8) {
  const startDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        userId: userId,
        'analysisMetadata.lastUpdated': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          week: { $week: '$analysisMetadata.lastUpdated' },
          year: { $year: '$analysisMetadata.lastUpdated' }
        },
        avgAcuteLoad: { $avg: '$trainingLoad.acuteLoad' },
        avgChronicLoad: { $avg: '$trainingLoad.chronicLoad' },
        avgAcuteChronic: { $avg: '$trainingLoad.acuteChronic' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.week': 1 }
    }
  ]);
};

export const AdvancedWorkoutAnalytics = mongoose.model('AdvancedWorkoutAnalytics', AdvancedWorkoutAnalyticsSchema);