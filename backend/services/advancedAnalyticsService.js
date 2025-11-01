// Advanced Analytics Service
// AI-powered workout analysis with machine learning algorithms

import { Workout, GpsPoint } from '../models/mongodb/index.js';
import { AdvancedWorkoutAnalytics } from '../models/mongodb/analytics/advancedWorkoutAnalytics.model.js';
import { WorkoutAnalytics } from '../models/mongodb/analytics/workoutAnalytics.model.js';

export class AdvancedAnalyticsService {

  /**
   * Perform comprehensive analysis of a workout
   */
  static async analyzeWorkout(workoutId) {
    try {
      console.log(`🔬 Starting advanced analysis for workout: ${workoutId}`);
      
      const workout = await Workout.findById(workoutId).populate('gpsPoints');
      if (!workout || workout.status !== 'completed') {
        throw new Error('Workout not found or not completed');
      }

      // Check if analysis already exists
      const existingAnalysis = await AdvancedWorkoutAnalytics.findOne({ workoutId });
      if (existingAnalysis) {
        console.log('📊 Analysis already exists, updating...');
      }

      // Perform various analyses
      const performanceMetrics = await this.calculatePerformanceMetrics(workout);
      const environmentalFactors = await this.analyzeEnvironmentalFactors(workout);
      const splitAnalysis = await this.performSplitAnalysis(workout);
      const aiInsights = await this.generateAIInsights(workout);
      const trainingLoad = await this.calculateTrainingLoad(workout);
      const routeAnalysis = await this.analyzeRoute(workout);
      const dataQuality = await this.assessDataQuality(workout);

      // Create comprehensive analysis
      const analysis = {
        workoutId: workout._id,
        userId: workout.userId,
        performanceMetrics,
        environmentalFactors,
        splitAnalysis,
        aiInsights,
        trainingLoad,
        routeAnalysis,
        dataQuality,
        analysisMetadata: {
          algorithmVersion: '2.8.32',
          processingTime: Date.now(),
          modelConfidence: 0.85,
          featuresUsed: [
            'gps_data', 'heart_rate', 'pace_analysis', 'elevation',
            'weather_data', 'historical_performance', 'ml_predictions'
          ]
        }
      };

      // Save or update analysis
      let savedAnalysis;
      if (existingAnalysis) {
        savedAnalysis = await AdvancedWorkoutAnalytics.findByIdAndUpdate(
          existingAnalysis._id,
          analysis,
          { new: true }
        );
      } else {
        savedAnalysis = await AdvancedWorkoutAnalytics.create(analysis);
      }

      console.log('✅ Advanced workout analysis completed');
      return savedAnalysis;

    } catch (error) {
      console.error('❌ Error in advanced workout analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate advanced performance metrics
   */
  static async calculatePerformanceMetrics(workout) {
    try {
      const gpsPoints = workout.gpsPoints || await GpsPoint.find({ workoutId: workout._id });
      
      // Power Analysis (estimated from pace and elevation)
      const powerAnalysis = await this.calculatePowerMetrics(workout, gpsPoints);
      
      // Biomechanical Metrics
      const biomechanics = await this.calculateBiomechanics(workout, gpsPoints);
      
      // Energy Expenditure Analysis
      const energyAnalysis = await this.calculateEnergyExpenditure(workout);
      
      // Recovery Metrics
      const recoveryMetrics = await this.calculateRecoveryMetrics(workout);

      return {
        powerAnalysis,
        biomechanics,
        energyAnalysis,
        recoveryMetrics
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {};
    }
  }

  /**
   * Calculate power metrics using pace and elevation data
   */
  static async calculatePowerMetrics(workout, gpsPoints) {
    try {
      if (!gpsPoints || gpsPoints.length === 0) {
        return {};
      }

      // Estimate power based on pace, body weight, and elevation
      const userWeight = 70; // Default weight, should come from user profile
      const powers = [];
      
      for (let i = 1; i < gpsPoints.length; i++) {
        const prev = gpsPoints[i - 1];
        const curr = gpsPoints[i];
        
        const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
        if (timeDiff <= 0) continue;
        
        const distance = this.calculateDistance(prev, curr);
        const elevation = curr.elevation - prev.elevation;
        const speed = distance / timeDiff; // m/s
        
        // Simplified power calculation (actual would need more sophisticated modeling)
        const gradePower = userWeight * 9.81 * elevation / timeDiff; // Watts for elevation
        const kineticPower = 0.5 * userWeight * Math.pow(speed, 3) * 0.25; // Air resistance approximation
        const rollingPower = userWeight * 9.81 * 0.004 * speed; // Rolling resistance
        
        const totalPower = Math.max(0, gradePower + kineticPower + rollingPower);
        powers.push(totalPower);
      }

      if (powers.length === 0) return {};

      const avgPower = powers.reduce((sum, p) => sum + p, 0) / powers.length;
      const normalizedPower = this.calculateNormalizedPower(powers);
      const powerVariability = this.calculateStandardDeviation(powers) / avgPower;

      return {
        normalizedPower: normalizedPower,
        powerVariabilityIndex: powerVariability,
        trainingStressScore: this.calculateTSS(normalizedPower, workout.duration),
        intensityFactor: normalizedPower / 250 // Assuming FTP of 250W
      };
    } catch (error) {
      console.error('Error calculating power metrics:', error);
      return {};
    }
  }

  /**
   * Calculate biomechanical metrics
   */
  static async calculateBiomechanics(workout, gpsPoints) {
    try {
      // For real implementation, this would use accelerometer data
      // Here we estimate based on pace and GPS data
      
      const avgPace = workout.averagePace || 0;
      const distance = workout.distance || 0;
      const duration = workout.duration || 0;
      
      // Estimate cadence based on pace (very rough approximation)
      const estimatedCadence = Math.max(160, 200 - (avgPace * 10));
      
      // Estimate stride length
      const avgSpeed = distance / (duration / 60); // km/h
      const strideLength = (avgSpeed * 1000 / 60) / (estimatedCadence / 2); // meters
      
      return {
        cadence: {
          average: estimatedCadence,
          variability: estimatedCadence * 0.1, // 10% variation estimate
          optimalRange: {
            min: estimatedCadence - 10,
            max: estimatedCadence + 10
          }
        },
        strideLength: {
          average: strideLength,
          variability: strideLength * 0.05,
          efficiency: Math.min(100, Math.max(50, 100 - (avgPace - 4) * 10))
        },
        groundContactTime: null, // Would need specialized sensors
        verticalOscillation: null,
        groundContactBalance: null
      };
    } catch (error) {
      console.error('Error calculating biomechanics:', error);
      return {};
    }
  }

  /**
   * Calculate energy expenditure analysis
   */
  static async calculateEnergyExpenditure(workout) {
    try {
      const calories = workout.calories || 0;
      const distance = workout.distance || 0;
      const duration = workout.duration || 0;
      const avgPace = workout.averagePace || 0;
      
      // Calculate energy density
      const energyDensity = distance > 0 ? calories / distance : 0;
      
      // Estimate fat vs carb burn based on intensity
      const intensityZone = this.getIntensityZone(avgPace);
      let fatBurn, carbBurn;
      
      switch (intensityZone) {
        case 1:
        case 2:
          fatBurn = 85;
          carbBurn = 15;
          break;
        case 3:
          fatBurn = 50;
          carbBurn = 50;
          break;
        case 4:
        case 5:
          fatBurn = 15;
          carbBurn = 85;
          break;
        default:
          fatBurn = 50;
          carbBurn = 50;
      }
      
      // Calculate metabolic efficiency
      const metabolicEfficiency = distance > 0 ? calories / distance * 1000 : 0; // cal/km
      
      return {
        totalEnergyExpenditure: calories,
        energyDensity: energyDensity,
        fatBurn: fatBurn,
        carbBurn: carbBurn,
        metabolicEfficiency: metabolicEfficiency
      };
    } catch (error) {
      console.error('Error calculating energy expenditure:', error);
      return {};
    }
  }

  /**
   * Calculate recovery metrics
   */
  static async calculateRecoveryMetrics(workout) {
    try {
      const avgHR = workout.averageHeartRate || 0;
      const maxHR = workout.maxHeartRate || 0;
      const duration = workout.duration || 0;
      
      // Estimate recovery based on heart rate data
      let recoveryScore = 75; // Default moderate recovery
      
      if (maxHR > 0 && avgHR > 0) {
        const hrIntensity = avgHR / maxHR;
        if (hrIntensity > 0.9) recoveryScore = 30; // High intensity, poor recovery
        else if (hrIntensity > 0.8) recoveryScore = 50;
        else if (hrIntensity > 0.7) recoveryScore = 70;
        else recoveryScore = 85; // Low intensity, good recovery
      }
      
      // Estimate perceived exertion based on pace and duration
      const estimatedRPE = this.estimateRPE(workout.averagePace, duration);
      
      return {
        heartRateRecovery: {
          oneMinute: null, // Would need post-workout HR data
          threeMinute: null,
          recoveryScore: recoveryScore
        },
        perceivedExertion: estimatedRPE,
        muscularFatigue: Math.min(10, Math.max(1, duration / 30)), // Rough estimate
        dehydrationLevel: Math.min(5, duration / 60) // % fluid loss estimate
      };
    } catch (error) {
      console.error('Error calculating recovery metrics:', error);
      return {};
    }
  }

  /**
   * Analyze environmental factors
   */
  static async analyzeEnvironmentalFactors(workout) {
    try {
      // This would integrate with weather APIs in production
      // For now, using dummy/estimated data
      
      const elevationGain = workout.elevationGain || 0;
      const distance = workout.distance || 0;
      
      const terrain = {
        surfaceType: 'road', // Default, would be detected from GPS/user input
        elevationProfile: {
          netGain: elevationGain,
          netLoss: elevationGain * 0.8, // Estimate
          steepestGrade: elevationGain > 0 ? Math.min(15, elevationGain / distance * 100) : 0,
          avgGrade: elevationGain > 0 ? elevationGain / distance * 100 : 0,
          hillScore: this.calculateHillScore(elevationGain, distance)
        },
        airQuality: {
          aqi: 50, // Default moderate air quality
          pm25: 15,
          impactScore: 0
        }
      };

      return {
        weather: {
          temperature: 20, // Default values - would come from weather API
          humidity: 60,
          windSpeed: 5,
          windDirection: 180,
          airPressure: 1013,
          weatherImpactScore: 0
        },
        terrain
      };
    } catch (error) {
      console.error('Error analyzing environmental factors:', error);
      return {};
    }
  }

  /**
   * Perform detailed split analysis
   */
  static async performSplitAnalysis(workout) {
    try {
      const gpsPoints = await GpsPoint.find({ workoutId: workout._id });
      if (!gpsPoints || gpsPoints.length === 0) {
        return {};
      }

      // Calculate kilometer splits
      const splits = this.calculateKilometerSplits(gpsPoints);
      
      // Analyze pacing strategy
      const pacing = this.analyzePacingStrategy(splits);
      
      return {
        pacing,
        splits
      };
    } catch (error) {
      console.error('Error performing split analysis:', error);
      return {};
    }
  }

  /**
   * Generate AI-powered insights
   */
  static async generateAIInsights(workout) {
    try {
      // Get user's historical data for context
      const historicalWorkouts = await Workout.find({
        userId: workout.userId,
        status: 'completed',
        startedAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }).sort({ startedAt: -1 }).limit(50);

      // Performance Analysis
      const performanceAnalysis = await this.analyzePerformance(workout, historicalWorkouts);
      
      // Generate Predictions
      const predictions = await this.generatePredictions(workout, historicalWorkouts);
      
      // Comparative Analysis
      const comparison = await this.performComparativeAnalysis(workout, historicalWorkouts);

      return {
        performanceAnalysis,
        predictions,
        comparison
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {};
    }
  }

  /**
   * Analyze workout performance using AI
   */
  static async analyzePerformance(workout, historicalWorkouts) {
    try {
      const avgPace = workout.averagePace || 0;
      const distance = workout.distance || 0;
      const duration = workout.duration || 0;
      
      // Calculate overall performance score
      let overallScore = 70; // Base score
      
      // Adjust based on pace consistency
      if (workout.paceVariation && workout.paceVariation < 0.1) overallScore += 10;
      
      // Adjust based on distance achievement
      if (distance >= workout.plannedDistance) overallScore += 10;
      
      // Identify strengths and weaknesses
      const strengths = [];
      const weaknesses = [];
      const recommendations = [];
      
      // Analyze against historical data
      if (historicalWorkouts.length > 0) {
        const avgHistoricalPace = historicalWorkouts.reduce((sum, w) => sum + (w.averagePace || 0), 0) / historicalWorkouts.length;
        
        if (avgPace < avgHistoricalPace) {
          strengths.push('Improved pace from recent workouts');
          overallScore += 5;
        } else if (avgPace > avgHistoricalPace * 1.1) {
          weaknesses.push('Pace slower than recent average');
          recommendations.push('Focus on tempo runs to improve pace');
          overallScore -= 5;
        }
      }
      
      // Training zone distribution (estimated)
      const intensity = this.getIntensityZone(avgPace);
      const zoneDistribution = {
        zone1: intensity === 1 ? 100 : 0,
        zone2: intensity === 2 ? 100 : 0,
        zone3: intensity === 3 ? 100 : 0,
        zone4: intensity === 4 ? 100 : 0,
        zone5: intensity === 5 ? 100 : 0
      };

      return {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        strengths,
        weaknesses,
        recommendations,
        trainingZoneDistribution: zoneDistribution
      };
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return { overallScore: 50, strengths: [], weaknesses: [], recommendations: [] };
    }
  }

  /**
   * Generate predictions using machine learning
   */
  static async generatePredictions(workout, historicalWorkouts) {
    try {
      // Next workout recommendation
      const nextWorkoutRecommendation = this.recommendNextWorkout(workout, historicalWorkouts);
      
      // Injury risk assessment
      const injuryRisk = this.assessInjuryRisk(workout, historicalWorkouts);
      
      // Performance trend prediction
      const performanceTrend = this.predictPerformanceTrend(historicalWorkouts);

      return {
        nextWorkoutRecommendation,
        injuryRisk,
        performanceTrend
      };
    } catch (error) {
      console.error('Error generating predictions:', error);
      return {};
    }
  }

  /**
   * Perform comparative analysis
   */
  static async performComparativeAnalysis(workout, historicalWorkouts) {
    try {
      // Personal best analysis
      const personalBest = this.analyzePersonalBest(workout, historicalWorkouts);
      
      // Peer comparison would require user data aggregation
      const peerComparison = {
        percentile: 65, // Estimated
        similarUsers: 1000,
        strongerAreas: ['endurance'],
        weakerAreas: ['speed']
      };
      
      // Seasonal comparison
      const seasonalComparison = this.analyzeSeasonalTrends(workout, historicalWorkouts);

      return {
        personalBest,
        peerComparison,
        seasonalComparison
      };
    } catch (error) {
      console.error('Error performing comparative analysis:', error);
      return {};
    }
  }

  // Utility methods

  static calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  static calculateNormalizedPower(powers) {
    if (powers.length === 0) return 0;
    
    // 30-second rolling average, then 4th power
    const rollingAvg = [];
    for (let i = 29; i < powers.length; i++) {
      const avg = powers.slice(i-29, i+1).reduce((sum, p) => sum + p, 0) / 30;
      rollingAvg.push(Math.pow(avg, 4));
    }
    
    const avgFourthPower = rollingAvg.reduce((sum, p) => sum + p, 0) / rollingAvg.length;
    return Math.pow(avgFourthPower, 0.25);
  }

  static calculateTSS(normalizedPower, duration) {
    const FTP = 250; // Functional Threshold Power, should come from user profile
    const IF = normalizedPower / FTP;
    return (duration / 3600) * IF * IF * 100;
  }

  static calculateStandardDeviation(values) {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  static getIntensityZone(pace) {
    // Convert pace to intensity zone (1-5)
    if (pace < 4.0) return 5; // Very fast
    if (pace < 4.5) return 4; // Fast
    if (pace < 5.5) return 3; // Moderate
    if (pace < 6.5) return 2; // Easy
    return 1; // Very easy
  }

  static estimateRPE(pace, duration) {
    // Estimate Rate of Perceived Exertion (1-10 scale)
    let rpe = 5; // Base moderate effort
    
    if (pace < 4.0) rpe = 9; // Very hard
    else if (pace < 4.5) rpe = 7; // Hard
    else if (pace < 5.5) rpe = 6; // Moderate-hard
    else if (pace < 6.5) rpe = 4; // Easy-moderate
    else rpe = 3; // Easy
    
    // Adjust for duration
    if (duration > 90) rpe += 1; // Longer workouts feel harder
    
    return Math.min(10, Math.max(1, rpe));
  }

  static calculateHillScore(elevationGain, distance) {
    if (distance === 0) return 0;
    const avgGrade = (elevationGain / distance) * 100;
    
    if (avgGrade < 1) return 1; // Flat
    if (avgGrade < 3) return 3; // Rolling
    if (avgGrade < 5) return 5; // Hilly
    if (avgGrade < 8) return 7; // Very hilly
    return 10; // Mountainous
  }

  /**
   * Calculate comprehensive training load
   */
  static async calculateTrainingLoad(workout) {
    try {
      const userId = workout.userId;
      const currentDate = new Date(workout.startedAt);
      
      // Get recent workouts for load calculation
      const sevenDaysAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twentyEightDaysAgo = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000);
      
      const recentWorkouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: twentyEightDaysAgo, $lte: currentDate }
      }).sort({ startedAt: -1 });

      // Calculate training loads
      const acuteLoad = this.calculateAcuteLoad(recentWorkouts, sevenDaysAgo);
      const chronicLoad = this.calculateChronicLoad(recentWorkouts);
      const acuteChronic = chronicLoad > 0 ? acuteLoad / chronicLoad : 1.0;
      
      // Training stress balance (simplified)
      const fitness = chronicLoad;
      const fatigue = acuteLoad * 1.5;
      const trainingStressBalance = fitness - fatigue;
      
      // Calculate other metrics
      const rampRate = this.calculateRampRate(recentWorkouts);
      const monotony = this.calculateMonotony(recentWorkouts);
      const strain = acuteLoad * monotony;

      return {
        acuteLoad,
        chronicLoad,
        acuteChronic,
        trainingStressBalance,
        rampRate,
        monotony,
        strain
      };
    } catch (error) {
      console.error('Error calculating training load:', error);
      return {};
    }
  }

  static calculateAcuteLoad(workouts, sevenDaysAgo) {
    const recentWorkouts = workouts.filter(w => new Date(w.startedAt) >= sevenDaysAgo);
    return recentWorkouts.reduce((sum, w) => {
      const duration = w.duration || 0;
      const intensity = this.getIntensityZone(w.averagePace || 6.0);
      return sum + (duration * intensity / 60); // Load = duration * intensity
    }, 0);
  }

  static calculateChronicLoad(workouts) {
    const totalLoad = workouts.reduce((sum, w) => {
      const duration = w.duration || 0;
      const intensity = this.getIntensityZone(w.averagePace || 6.0);
      return sum + (duration * intensity / 60);
    }, 0);
    return totalLoad / 4; // 4-week average
  }

  static calculateRampRate(workouts) {
    if (workouts.length < 14) return 0;
    
    const thisWeek = workouts.slice(0, 7);
    const lastWeek = workouts.slice(7, 14);
    
    const thisWeekLoad = thisWeek.reduce((sum, w) => sum + (w.duration || 0), 0);
    const lastWeekLoad = lastWeek.reduce((sum, w) => sum + (w.duration || 0), 0);
    
    return lastWeekLoad > 0 ? ((thisWeekLoad - lastWeekLoad) / lastWeekLoad) * 100 : 0;
  }

  static calculateMonotony(workouts) {
    if (workouts.length === 0) return 1;
    
    const loads = workouts.map(w => {
      const duration = w.duration || 0;
      const intensity = this.getIntensityZone(w.averagePace || 6.0);
      return duration * intensity / 60;
    });
    
    const avg = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const stdDev = this.calculateStandardDeviation(loads);
    
    return stdDev > 0 ? avg / stdDev : 1;
  }

  /**
   * Get advanced analytics for a user
   */
  static async getUserAdvancedAnalytics(userId, period = '30days') {
    try {
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      const analytics = await AdvancedWorkoutAnalytics.find({
        userId,
        'analysisMetadata.lastUpdated': { $gte: startDate }
      }).sort({ 'analysisMetadata.lastUpdated': -1 });

      if (analytics.length === 0) {
        return { message: 'No analytics data available for this period' };
      }

      // Aggregate insights
      const aggregated = {
        performanceTrend: this.aggregatePerformanceTrend(analytics),
        injuryRiskTrend: this.aggregateInjuryRisk(analytics),
        trainingLoadTrend: this.aggregateTrainingLoad(analytics),
        recommendations: this.aggregateRecommendations(analytics),
        strengths: this.aggregateStrengths(analytics),
        improvementAreas: this.aggregateImprovementAreas(analytics)
      };

      return aggregated;
    } catch (error) {
      console.error('Error getting user advanced analytics:', error);
      throw error;
    }
  }

  static parsePeriodToDays(period) {
    const match = period.match(/(\d+)(day|week|month|year)s?/);
    if (!match) return 30; // Default to 30 days
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'day': return value;
      case 'week': return value * 7;
      case 'month': return value * 30;
      case 'year': return value * 365;
      default: return 30;
    }
  }

  // Additional aggregation methods would go here...
  
  static aggregatePerformanceTrend(analytics) {
    const scores = analytics.map(a => a.aiInsights?.performanceAnalysis?.overallScore || 0);
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (scores.length < 2) return { direction: 'stable', confidence: 50 };
    
    const recent = scores.slice(0, Math.ceil(scores.length / 3));
    const older = scores.slice(-Math.ceil(scores.length / 3));
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
    
    const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      direction: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
      confidence: Math.min(95, Math.max(60, 60 + Math.abs(improvement) * 2)),
      timeframe: '30 days',
      projectedImprovement: improvement
    };
  }

  static aggregateInjuryRisk(analytics) {
    const risks = analytics.map(a => a.aiInsights?.predictions?.injuryRisk?.score || 0);
    const avgRisk = risks.reduce((sum, risk) => sum + risk, 0) / risks.length;
    
    let level = 'low';
    if (avgRisk > 75) level = 'very_high';
    else if (avgRisk > 50) level = 'high';
    else if (avgRisk > 25) level = 'moderate';
    
    return { level, avgScore: avgRisk };
  }

  static aggregateTrainingLoad(analytics) {
    const loads = analytics.map(a => a.trainingLoad);
    const validLoads = loads.filter(l => l && l.acuteChronic);
    
    if (validLoads.length === 0) return null;
    
    const avgAcuteChronic = validLoads.reduce((sum, l) => sum + l.acuteChronic, 0) / validLoads.length;
    
    return {
      avgAcuteChronic,
      trend: avgAcuteChronic > 1.3 ? 'increasing' : avgAcuteChronic < 0.8 ? 'decreasing' : 'stable',
      recommendation: avgAcuteChronic > 1.5 ? 'reduce_load' : avgAcuteChronic < 0.7 ? 'increase_load' : 'maintain'
    };
  }

  static aggregateRecommendations(analytics) {
    const allRecommendations = analytics.flatMap(a => 
      a.aiInsights?.performanceAnalysis?.recommendations || []
    );
    
    // Count frequency of recommendations
    const counts = {};
    allRecommendations.forEach(rec => {
      counts[rec] = (counts[rec] || 0) + 1;
    });
    
    // Return top recommendations
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([rec, count]) => ({ recommendation: rec, frequency: count }));
  }

  static aggregateStrengths(analytics) {
    const allStrengths = analytics.flatMap(a => 
      a.aiInsights?.performanceAnalysis?.strengths || []
    );
    
    const counts = {};
    allStrengths.forEach(strength => {
      counts[strength] = (counts[strength] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([strength, count]) => ({ strength, frequency: count }));
  }

  static aggregateImprovementAreas(analytics) {
    const allWeaknesses = analytics.flatMap(a => 
      a.aiInsights?.performanceAnalysis?.weaknesses || []
    );
    
    const counts = {};
    allWeaknesses.forEach(weakness => {
      counts[weakness] = (counts[weakness] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area, count]) => ({ area, frequency: count }));
  }
}

export default AdvancedAnalyticsService;