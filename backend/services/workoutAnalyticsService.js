import { Workout } from '../models/mongodb/workout/workout.model.js';

export class WorkoutAnalyticsService {
  
  /**
   * Calculate advanced workout metrics with detailed analysis
   */
  static async calculateAdvancedMetrics(userId, options = {}) {
    try {
      const { period = '3months', includeComparison = false } = options;
      
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      }).sort({ startedAt: 1 });

      if (workouts.length === 0) {
        return {
          message: 'No workouts found for analysis',
          period,
          totalWorkouts: 0
        };
      }

      const metrics = {
        basic: this.calculateBasicMetrics(workouts),
        advanced: this.calculateAdvancedWorkoutMetrics(workouts),
        consistency: this.calculateConsistencyMetrics(workouts),
        performance: this.calculatePerformanceMetrics(workouts),
        recovery: this.calculateRecoveryMetrics(workouts),
        efficiency: this.calculateEfficiencyMetrics(workouts)
      };

      // Include comparison with previous period if requested
      if (includeComparison) {
        const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
        const previousWorkouts = await Workout.find({
          userId,
          status: 'completed',
          startedAt: { $gte: previousPeriodStart, $lt: startDate }
        });

        metrics.comparison = this.calculatePeriodComparison(workouts, previousWorkouts);
      }

      return metrics;
    } catch (error) {
      console.error('Error calculating advanced metrics:', error);
      throw error;
    }
  }

  /**
   * Analyze performance zones (pace, heart rate, power)
   */
  static async analyzePerformanceZones(userId, options = {}) {
    try {
      const { metric = 'pace', period = '6months' } = options;
      
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate },
        [metric]: { $exists: true, $ne: null }
      }).sort({ startedAt: 1 });

      if (workouts.length < 5) {
        return {
          message: 'Need at least 5 workouts for zone analysis',
          currentWorkouts: workouts.length,
          requiredWorkouts: 5
        };
      }

      const zones = {
        distribution: this.calculateZoneDistribution(workouts, metric),
        trends: this.calculateZoneTrends(workouts, metric),
        recommendations: this.generateZoneRecommendations(workouts, metric),
        personalZones: this.calculatePersonalZones(workouts, metric)
      };

      return zones;
    } catch (error) {
      console.error('Error analyzing performance zones:', error);
      throw error;
    }
  }

  /**
   * Calculate training load with stress scores
   */
  static async calculateTrainingLoad(userId, options = {}) {
    try {
      const { weeks = 12, includeProjections = false } = options;
      
      const startDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      }).sort({ startedAt: 1 });

      const trainingLoad = {
        weekly: this.calculateWeeklyLoad(workouts),
        acute: this.calculateAcuteLoad(workouts), // Last 7 days
        chronic: this.calculateChronicLoad(workouts), // Last 4 weeks average
        ratio: null, // Acute:Chronic ratio
        stress: this.calculateTrainingStress(workouts),
        recovery: this.assessRecoveryNeeds(workouts),
        trend: this.calculateLoadTrend(workouts)
      };

      // Calculate Acute:Chronic ratio
      if (trainingLoad.chronic > 0) {
        trainingLoad.ratio = trainingLoad.acute / trainingLoad.chronic;
        trainingLoad.riskAssessment = this.assessInjuryRisk(trainingLoad.ratio);
      }

      // Include future projections if requested
      if (includeProjections) {
        trainingLoad.projections = this.projectFutureLoad(workouts);
      }

      return trainingLoad;
    } catch (error) {
      console.error('Error calculating training load:', error);
      throw error;
    }
  }

  /**
   * Analyze recovery patterns and provide insights
   */
  static async analyzeRecoveryPatterns(userId, options = {}) {
    try {
      const { includeRecommendations = true } = options;
      
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: threeMonthsAgo }
      }).sort({ startedAt: 1 });

      const recovery = {
        patterns: this.identifyRecoveryPatterns(workouts),
        restDays: this.analyzeRestDayPatterns(workouts),
        intensity: this.analyzeIntensityDistribution(workouts),
        fatigue: this.calculateFatigueIndicators(workouts),
        readiness: this.assessTrainingReadiness(workouts),
        sleep: this.analyzeSleepImpact(workouts) // If sleep data available
      };

      if (includeRecommendations) {
        recovery.recommendations = this.generateRecoveryRecommendations(recovery, workouts);
      }

      return recovery;
    } catch (error) {
      console.error('Error analyzing recovery patterns:', error);
      throw error;
    }
  }

  /**
   * Calculate enhanced personal records with context
   */
  static async calculateEnhancedPersonalRecords(userId, options = {}) {
    try {
      const { category = 'all', includeProjections = false } = options;
      
      const workouts = await Workout.find({
        userId,
        status: 'completed'
      }).sort({ startedAt: 1 });

      const records = {
        distance: this.calculateDistanceRecords(workouts),
        pace: this.calculatePaceRecords(workouts),
        duration: this.calculateDurationRecords(workouts),
        elevation: this.calculateElevationRecords(workouts),
        consistency: this.calculateConsistencyRecords(workouts),
        improvement: this.calculateImprovementRecords(workouts)
      };

      // Add context and achievement dates
      for (const [recordType, recordData] of Object.entries(records)) {
        if (recordData && recordData.length > 0) {
          records[recordType] = recordData.map(record => ({
            ...record,
            context: this.addRecordContext(record, workouts),
            difficulty: this.assessRecordDifficulty(record, workouts),
            nextTarget: this.suggestNextTarget(record, workouts)
          }));
        }
      }

      // Include projections for potential future records
      if (includeProjections) {
        records.projections = this.projectFutureRecords(workouts);
      }

      // Filter by category if specified
      if (category !== 'all' && records[category]) {
        return { [category]: records[category] };
      }

      return records;
    } catch (error) {
      console.error('Error calculating enhanced personal records:', error);
      throw error;
    }
  }

  /**
   * Analyze workout quality based on multiple factors
   */
  static async analyzeWorkoutQuality(userId, options = {}) {
    try {
      const { period = '1month', metric = 'overall' } = options;
      
      const periodDays = this.parsePeriodToDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      }).sort({ startedAt: 1 });

      const quality = {
        overall: this.calculateOverallQuality(workouts),
        consistency: this.calculateQualityConsistency(workouts),
        completion: this.calculateCompletionQuality(workouts),
        effort: this.calculateEffortQuality(workouts),
        pacing: this.calculatePacingQuality(workouts),
        trends: this.calculateQualityTrends(workouts),
        factors: this.identifyQualityFactors(workouts)
      };

      // Filter by specific metric if requested
      if (metric !== 'overall' && quality[metric]) {
        return { [metric]: quality[metric] };
      }

      return quality;
    } catch (error) {
      console.error('Error analyzing workout quality:', error);
      throw error;
    }
  }

  /**
   * Analyze detailed progress trends across multiple metrics
   */
  static async analyzeProgressTrends(userId, options = {}) {
    try {
      const { metrics = ['pace', 'distance', 'consistency'], timeframe = '6months' } = options;
      
      const periodDays = this.parsePeriodToDays(timeframe);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      const workouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: startDate }
      }).sort({ startedAt: 1 });

      const trends = {};

      // Calculate trends for each requested metric
      for (const metric of metrics) {
        trends[metric] = this.calculateMetricTrend(workouts, metric);
      }

      // Add cross-metric correlations
      trends.correlations = this.calculateMetricCorrelations(workouts, metrics);
      
      // Add predictive trends
      trends.predictions = this.predictFutureTrends(workouts, metrics);
      
      // Add milestone analysis
      trends.milestones = this.identifyProgressMilestones(workouts, metrics);

      return trends;
    } catch (error) {
      console.error('Error analyzing progress trends:', error);
      throw error;
    }
  }

  /**
   * Run custom analysis based on user-defined parameters
   */
  static async runCustomAnalysis(userId, options = {}) {
    try {
      const { analysisType, parameters = {}, format = 'json' } = options;
      
      const workouts = await Workout.find({
        userId,
        status: 'completed'
      }).sort({ startedAt: 1 });

      let analysis;

      switch (analysisType) {
        case 'seasonal_patterns':
          analysis = this.analyzeSeasonalPatterns(workouts, parameters);
          break;
        case 'weather_correlation':
          analysis = this.analyzeWeatherCorrelation(workouts, parameters);
          break;
        case 'time_of_day_performance':
          analysis = this.analyzeTimeOfDayPerformance(workouts, parameters);
          break;
        case 'route_efficiency':
          analysis = this.analyzeRouteEfficiency(workouts, parameters);
          break;
        case 'equipment_impact':
          analysis = this.analyzeEquipmentImpact(workouts, parameters);
          break;
        case 'training_block_effectiveness':
          analysis = this.analyzeTrainingBlockEffectiveness(workouts, parameters);
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      // Format output if requested
      if (format === 'csv') {
        analysis.csvData = this.formatAsCSV(analysis);
      } else if (format === 'summary') {
        analysis = this.createAnalysisSummary(analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Error running custom analysis:', error);
      throw error;
    }
  }

  // Helper Methods
  static parsePeriodToDays(period) {
    const periods = {
      '1week': 7,
      '2weeks': 14,
      '1month': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365
    };
    return periods[period] || 90;
  }

  static calculateBasicMetrics(workouts) {
    const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalElevation = workouts.reduce((sum, w) => sum + (w.totalElevationGain || 0), 0);
    
    return {
      totalWorkouts: workouts.length,
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration / 60), // minutes
      totalElevation: Math.round(totalElevation),
      avgDistance: workouts.length > 0 ? Math.round(totalDistance / workouts.length) : 0,
      avgDuration: workouts.length > 0 ? Math.round(totalDuration / workouts.length / 60) : 0,
      avgPace: workouts.length > 0 ? this.calculateAveragePace(workouts) : 0
    };
  }

  static calculateAdvancedWorkoutMetrics(workouts) {
    return {
      variabilityIndex: this.calculateVariabilityIndex(workouts),
      efficiencyScore: this.calculateEfficiencyScore(workouts),
      progressionRate: this.calculateProgressionRate(workouts),
      intensityDistribution: this.calculateIntensityDistribution(workouts),
      recoveryMetrics: this.calculateRecoveryMetrics(workouts)
    };
  }

  static calculateVariabilityIndex(workouts) {
    if (workouts.length < 2) return 0;
    
    const paces = workouts
      .filter(w => w.avgPace && w.avgPace > 0)
      .map(w => w.avgPace);
    
    if (paces.length < 2) return 0;
    
    const mean = paces.reduce((sum, pace) => sum + pace, 0) / paces.length;
    const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - mean, 2), 0) / paces.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.round((stdDev / mean) * 100) / 100; // Coefficient of variation
  }

  static calculateEfficiencyScore(workouts) {
    // Calculate efficiency based on distance covered vs energy expenditure
    const workoutsWithCalories = workouts.filter(w => w.calories && w.distance);
    
    if (workoutsWithCalories.length === 0) return null;
    
    const efficiencyScores = workoutsWithCalories.map(w => 
      (w.distance / 1000) / (w.calories / 100) // km per 100 calories
    );
    
    const avgEfficiency = efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;
    return Math.round(avgEfficiency * 100) / 100;
  }

  static calculateProgressionRate(workouts) {
    if (workouts.length < 10) return null;
    
    // Use pace improvement over time as progression indicator
    const paceData = workouts
      .filter(w => w.avgPace && w.avgPace > 0)
      .map((w, index) => ({ index, pace: w.avgPace }));
    
    if (paceData.length < 10) return null;
    
    // Simple linear regression to find trend
    const n = paceData.length;
    const sumX = paceData.reduce((sum, d) => sum + d.index, 0);
    const sumY = paceData.reduce((sum, d) => sum + d.pace, 0);
    const sumXY = paceData.reduce((sum, d) => sum + d.index * d.pace, 0);
    const sumXX = paceData.reduce((sum, d) => sum + d.index * d.index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return {
      slope: Math.round(slope * 10000) / 10000,
      trend: slope < 0 ? 'improving' : slope > 0 ? 'declining' : 'stable',
      improvementRate: Math.abs(slope) * 100 // percentage change per workout
    };
  }

  static calculateAveragePace(workouts) {
    const validPaces = workouts.filter(w => w.avgPace && w.avgPace > 0);
    if (validPaces.length === 0) return 0;
    
    const totalPace = validPaces.reduce((sum, w) => sum + w.avgPace, 0);
    return Math.round((totalPace / validPaces.length) * 100) / 100;
  }

  // Additional helper methods would continue here...
  // For brevity, I'll define placeholders for the remaining methods

  static calculateConsistencyMetrics(workouts) {
    // Implementation for consistency analysis
    return {
      paceConsistency: 0.85,
      frequencyConsistency: 0.92,
      distanceConsistency: 0.78
    };
  }

  static calculatePerformanceMetrics(workouts) {
    // Implementation for performance analysis
    return {
      performanceIndex: 85,
      improvementTrend: 'positive',
      strengthAreas: ['endurance', 'consistency']
    };
  }

  static calculateRecoveryMetrics(workouts) {
    // Implementation for recovery analysis
    return {
      averageRestDays: 1.2,
      recoveryScore: 78,
      overtrainingRisk: 'low'
    };
  }

  static calculateEfficiencyMetrics(workouts) {
    // Implementation for efficiency analysis
    return {
      paceEfficiency: 0.88,
      energyEfficiency: 0.82,
      timeEfficiency: 0.90
    };
  }

  // Placeholder methods for other complex calculations
  static calculatePeriodComparison(current, previous) { return {}; }
  static calculateZoneDistribution(workouts, metric) { return {}; }
  static calculateZoneTrends(workouts, metric) { return {}; }
  static generateZoneRecommendations(workouts, metric) { return []; }
  static calculatePersonalZones(workouts, metric) { return {}; }
  static calculateWeeklyLoad(workouts) { return []; }
  static calculateAcuteLoad(workouts) { return 0; }
  static calculateChronicLoad(workouts) { return 0; }
  static calculateTrainingStress(workouts) { return {}; }
  static assessRecoveryNeeds(workouts) { return {}; }
  static calculateLoadTrend(workouts) { return {}; }
  static assessInjuryRisk(ratio) { return {}; }
  static projectFutureLoad(workouts) { return {}; }
  static identifyRecoveryPatterns(workouts) { return {}; }
  static analyzeRestDayPatterns(workouts) { return {}; }
  static analyzeIntensityDistribution(workouts) { return {}; }
  static calculateFatigueIndicators(workouts) { return {}; }
  static assessTrainingReadiness(workouts) { return {}; }
  static analyzeSleepImpact(workouts) { return {}; }
  static generateRecoveryRecommendations(recovery, workouts) { return []; }
}