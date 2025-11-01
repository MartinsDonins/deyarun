import { TrainingProgramSkeleton } from '../models/mongodb/trainingPlan/trainingProgramSkeleton.model.js';
import { MonthlySchedule } from '../models/mongodb/trainingPlan/monthlySchedule.model.js';
import { TrainingPlan } from '../models/mongodb/trainingPlan/trainingPlan.model.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';
import { openAIService } from './openAIService.js';

/**
 * AI Training Service - Prepares the foundation for AI integration
 * This service provides the interface and data structures needed for future AI implementation
 * Currently implements rule-based logic that can be enhanced with AI models
 */
class AITrainingService {
  constructor() {
    this.aiModels = {
      enabled: Boolean(process.env.OPENAI_API_KEY), // Auto-enable if API key is present
      openaiApiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      endpoints: {
        planGeneration: '/api/ai/generate-plan',
        adaptations: '/api/ai/adapt-plan',
        coaching: '/api/ai/coaching-tips'
      }
    };
    
    // Initialize OpenAI service if enabled
    if (this.aiModels.enabled) {
      this.initializeAIService();
    }
  }

  /**
   * Initialize OpenAI service
   */
  async initializeAIService() {
    try {
      await openAIService.initialize();
      console.log('✅ AI Training Service: OpenAI integration enabled');
    } catch (error) {
      console.error('❌ AI Training Service: Failed to initialize OpenAI service:', error);
      this.aiModels.enabled = false;
    }
  }

  /**
   * Generate personalized training plan using AI or rule-based approach
   */
  async generatePersonalizedPlan(userProfile, targetRace, preferences = {}) {
    try {
      if (this.aiModels.enabled) {
        return await this.generateAIPlan(userProfile, targetRace, preferences);
      } else {
        return await this.generateRuleBasedPlan(userProfile, targetRace, preferences);
      }
    } catch (error) {
      console.error('Error generating personalized plan:', error);
      throw error;
    }
  }

  /**
   * AI-powered plan generation using OpenAI
   */
  async generateAIPlan(userProfile, targetRace, preferences) {
    try {
      console.log('🤖 Generating AI-powered training plan...');
      
      // Use OpenAI service to generate plan
      const aiResponse = await openAIService.generateTrainingPlan(userProfile, targetRace, preferences);
      
      // Get rule-based plan as fallback/comparison
      const ruleBasedPlan = await this.generateRuleBasedPlan(userProfile, targetRace, preferences);
      
      // Combine AI insights with structured plan data
      const enhancedPlan = {
        ...ruleBasedPlan,
        aiInsights: aiResponse.plan,
        aiRecommendations: this.extractActionableRecommendations(aiResponse.plan),
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning,
        metadata: {
          ...aiResponse.metadata,
          generationMethod: 'AI-powered',
          fallbackUsed: false
        },
        adaptationSuggestions: [
          'Monitor weekly fatigue levels using AI analysis',
          'Adjust intensity based on heart rate data and AI recommendations',
          'Consider weather conditions for outdoor sessions',
          'Use AI coaching tips for motivation and technique improvements'
        ]
      };

      console.log(`✅ AI plan generated with ${aiResponse.confidence * 100}% confidence`);
      console.log(`💰 Cost: $${aiResponse.metadata.cost.toFixed(4)}`);
      
      return enhancedPlan;
      
    } catch (error) {
      console.error('❌ AI plan generation failed, falling back to rule-based approach:', error);
      
      // Fallback to rule-based plan
      const fallbackPlan = await this.generateRuleBasedPlan(userProfile, targetRace, preferences);
      fallbackPlan.metadata = {
        generationMethod: 'Rule-based fallback',
        fallbackUsed: true,
        aiError: error.message
      };
      
      return fallbackPlan;
    }
  }

  /**
   * Extract actionable recommendations from AI response
   */
  extractActionableRecommendations(aiPlan) {
    const recommendations = [];
    
    // Extract key recommendations from AI plan content
    if (aiPlan.fullContent) {
      const content = aiPlan.fullContent.toLowerCase();
      
      // Look for specific recommendation patterns
      if (content.includes('stiepšanās') || content.includes('flexibility')) {
        recommendations.push('Pievienot regulāru stiepšanos katru dienu');
      }
      
      if (content.includes('spēka treniņi') || content.includes('strength')) {
        recommendations.push('Iekļaut spēka treniņus 2-3 reizes nedēļā');
      }
      
      if (content.includes('tempo') || content.includes('interval')) {
        recommendations.push('Veikt tempo skrējienus katru otro nedēļu');
      }
      
      if (content.includes('atpūta') || content.includes('recovery')) {
        recommendations.push('Plānot pilnas atpūtas dienas katru nedēļu');
      }
    }
    
    return recommendations.length > 0 ? recommendations : [
      'Seko AI ģenerētajam plānam un pielāgo pēc vajadzības',
      'Regulāri novērtē savu pašsajūtu un progresa',
      'Konsultējies ar treneri pie būtiskām izmaiņām'
    ];
  }

  /**
   * Rule-based plan generation (current implementation)
   */
  async generateRuleBasedPlan(userProfile, targetRace, preferences) {
    // Find appropriate skeleton based on target distance and fitness level
    const skeleton = await TrainingProgramSkeleton.findOne({
      targetDistance: targetRace.distance,
      difficultyLevel: userProfile.fitnessLevel,
      isActive: true
    });

    if (!skeleton) {
      throw new Error('No suitable training template found');
    }

    // Create new training plan
    const trainingPlan = new TrainingPlan({
      userId: userProfile.userId,
      name: `${targetRace.distance} Training Plan`,
      description: `Personalized ${targetRace.distance} training plan`,
      targetRace: targetRace,
      userProfile: userProfile,
      duration: skeleton.duration,
      startDate: preferences.startDate || new Date(),
      endDate: this.calculateEndDate(preferences.startDate || new Date(), skeleton.duration),
      phases: skeleton.phases,
      status: 'draft'
    });

    await trainingPlan.save();

    // Generate initial monthly schedule
    const monthlySchedule = await this.generateInitialSchedule(trainingPlan, skeleton);

    return {
      trainingPlan: trainingPlan,
      monthlySchedule: monthlySchedule,
      skeleton: skeleton,
      adaptationCapabilities: this.getAdaptationCapabilities(skeleton)
    };
  }

  /**
   * Generate AI-powered adaptations
   */
  async generateAdaptations(userId, performanceData, currentSchedule) {
    try {
      if (this.aiModels.enabled) {
        return await this.generateAIAdaptations(userId, performanceData, currentSchedule);
      } else {
        return await this.generateRuleBasedAdaptations(userId, performanceData, currentSchedule);
      }
    } catch (error) {
      console.error('Error generating adaptations:', error);
      throw error;
    }
  }

  /**
   * AI-powered adaptations using OpenAI
   */
  async generateAIAdaptations(userId, performanceData, currentSchedule) {
    try {
      console.log('🤖 Generating AI-powered adaptations...');
      
      // Use OpenAI service for performance analysis
      const aiResponse = await openAIService.analyzePerformanceAndAdapt(userId, performanceData, currentSchedule);
      
      // Get rule-based adaptations for comparison
      const ruleBasedAdaptations = await this.generateRuleBasedAdaptations(userId, performanceData, currentSchedule);
      
      // Combine AI insights with rule-based logic
      const enhancedAdaptations = {
        adaptations: [
          ...ruleBasedAdaptations,
          ...this.parseAIAdaptations(aiResponse.adaptations)
        ],
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning || 'AI-based performance analysis and adaptation recommendations',
        riskAssessment: aiResponse.riskAssessment || this.assessInjuryRisk(performanceData),
        aiInsights: this.extractAIInsights(aiResponse),
        metadata: {
          ...aiResponse.metadata,
          adaptationMethod: 'AI-enhanced',
          ruleBasedCount: ruleBasedAdaptations.length,
          aiGeneratedCount: this.parseAIAdaptations(aiResponse.adaptations).length
        }
      };

      console.log(`✅ AI adaptations generated with ${aiResponse.confidence * 100}% confidence`);
      console.log(`💰 Analysis cost: $${aiResponse.metadata.cost.toFixed(4)}`);
      
      return enhancedAdaptations;
      
    } catch (error) {
      console.error('❌ AI adaptation generation failed, using rule-based approach:', error);
      
      // Fallback to rule-based adaptations
      const adaptations = await this.generateRuleBasedAdaptations(userId, performanceData, currentSchedule);
      
      return {
        adaptations: adaptations,
        confidence: 0.6,
        reasoning: 'Rule-based adaptations (AI service unavailable)',
        riskAssessment: this.assessInjuryRisk(performanceData),
        aiInsights: ['AI service temporarily unavailable - using rule-based analysis'],
        metadata: {
          adaptationMethod: 'Rule-based fallback',
          aiError: error.message
        }
      };
    }
  }

  /**
   * Parse AI adaptations into structured format
   */
  parseAIAdaptations(aiAdaptations) {
    if (!aiAdaptations || !aiAdaptations.fullContent) {
      return [];
    }

    const adaptations = [];
    const content = aiAdaptations.fullContent.toLowerCase();

    // Extract specific adaptations from AI response
    if (aiAdaptations.mainAdaptation && aiAdaptations.mainAdaptation.trim()) {
      adaptations.push({
        type: 'ai_primary_adaptation',
        priority: 'high',
        changes: this.parseAdaptationChanges(aiAdaptations.specificChanges),
        reason: aiAdaptations.reasoning || 'AI-recommended primary adaptation',
        duration: 'this_week',
        source: 'ai_generated'
      });
    }

    // Parse specific changes into actionable adaptations
    if (content.includes('samazināt') || content.includes('reduce')) {
      adaptations.push({
        type: 'volume_reduction',
        priority: 'medium',
        changes: {
          reduceVolume: 0.1,
          addExtraRestDay: content.includes('atpūta')
        },
        reason: 'AI recommends volume reduction',
        duration: 'this_week',
        source: 'ai_generated'
      });
    }

    if (content.includes('palielināt') || content.includes('increase')) {
      adaptations.push({
        type: 'gradual_progression',
        priority: 'low',
        changes: {
          increaseVolume: 0.05,
          addQualitySession: true
        },
        reason: 'AI suggests gradual progression',
        duration: 'next_week',
        source: 'ai_generated'
      });
    }

    return adaptations;
  }

  /**
   * Parse adaptation changes from AI response
   */
  parseAdaptationChanges(specificChanges) {
    if (!specificChanges) return {};

    const changes = {};
    const content = specificChanges.toLowerCase();

    // Parse percentage changes
    const percentageMatch = content.match(/(\d+)%/);
    if (percentageMatch) {
      const percentage = parseInt(percentageMatch[1]) / 100;
      if (content.includes('samazinā') || content.includes('reduce')) {
        changes.reduceVolume = percentage;
      } else if (content.includes('palielinā') || content.includes('increase')) {
        changes.increaseVolume = percentage;
      }
    }

    // Parse specific recommendations
    if (content.includes('atpūta') || content.includes('rest')) {
      changes.addRestDay = true;
    }

    if (content.includes('intensitāt') || content.includes('intensity')) {
      changes.adjustIntensity = true;
    }

    return changes;
  }

  /**
   * Extract AI insights from response
   */
  extractAIInsights(aiResponse) {
    const insights = [];
    
    if (aiResponse.adaptations && aiResponse.adaptations.fullContent) {
      const content = aiResponse.adaptations.fullContent;
      
      // Split content into sentences and find insightful ones
      const sentences = content.split(/[.!?]\s+/);
      
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && 
            (trimmed.includes('ieteic') || trimmed.includes('recommend') ||
             trimmed.includes('svarīgi') || trimmed.includes('important') ||
             trimmed.includes('uzmanība') || trimmed.includes('attention'))) {
          insights.push(trimmed);
        }
      });
    }

    return insights.length > 0 ? insights.slice(0, 3) : [
      'AI analizē jūsu veiktspējas datus un sniedz personalizētus ieteikumus',
      'Regulāri izvērtējiet savu pašsajūtu un pielāgojiet treniņu intensitāti',
      'Prioritizējiet atjaunošanos un kvalitāti, nevis tikai apjomu'
    ];
  }

  /**
   * Enhanced progress analysis with multiple data points
   */
  async analyzeProgressTrends(userId, timeframe = '4weeks') {
    try {
      // Get historical workout data
      const workouts = await Workout.find({ 
        userId: userId,
        createdAt: { 
          $gte: new Date(Date.now() - this.getTimeframeMs(timeframe))
        }
      }).sort({ createdAt: 1 });

      if (workouts.length < 3) {
        return {
          hasEnoughData: false,
          trend: 'insufficient_data',
          recommendations: ['Complete more workouts to enable progress analysis']
        };
      }

      // Analyze pace progression
      const paceAnalysis = this.analyzePaceProgression(workouts);
      
      // Analyze distance progression
      const distanceAnalysis = this.analyzeDistanceProgression(workouts);
      
      // Analyze consistency patterns
      const consistencyAnalysis = this.analyzeConsistencyPatterns(workouts);
      
      // Analyze effort vs performance
      const effortAnalysis = this.analyzeEffortVsPerformance(workouts);
      
      // Calculate overall progress score
      const overallScore = this.calculateProgressScore(paceAnalysis, distanceAnalysis, consistencyAnalysis, effortAnalysis);
      
      // Generate personalized recommendations
      const recommendations = this.generateProgressRecommendations(paceAnalysis, distanceAnalysis, consistencyAnalysis, effortAnalysis);

      return {
        hasEnoughData: true,
        trend: overallScore.trend,
        score: overallScore.value,
        paceAnalysis,
        distanceAnalysis,
        consistencyAnalysis,
        effortAnalysis,
        recommendations,
        totalWorkouts: workouts.length,
        timeframe: timeframe,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Error analyzing progress trends:', error);
      throw error;
    }
  }

  /**
   * Analyze pace progression over time
   */
  analyzePaceProgression(workouts) {
    const paceData = workouts
      .filter(w => w.averagePace && w.averagePace > 0)
      .map(w => ({
        date: w.createdAt,
        pace: w.averagePace,
        distance: w.totalDistance || 0
      }));

    if (paceData.length < 3) {
      return { trend: 'insufficient_data', improvement: 0, consistency: 0 };
    }

    // Calculate pace improvement (negative = faster)
    const earlyPaces = paceData.slice(0, Math.ceil(paceData.length / 3));
    const recentPaces = paceData.slice(-Math.ceil(paceData.length / 3));
    
    const avgEarlyPace = earlyPaces.reduce((sum, p) => sum + p.pace, 0) / earlyPaces.length;
    const avgRecentPace = recentPaces.reduce((sum, p) => sum + p.pace, 0) / recentPaces.length;
    
    const improvement = avgEarlyPace - avgRecentPace; // Positive = improvement
    
    // Calculate pace consistency (lower standard deviation = more consistent)
    const allPaces = paceData.map(p => p.pace);
    const avgPace = allPaces.reduce((sum, p) => sum + p, 0) / allPaces.length;
    const variance = allPaces.reduce((sum, p) => sum + Math.pow(p - avgPace, 2), 0) / allPaces.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev / avgPace) * 100);

    return {
      trend: improvement > 10 ? 'improving' : improvement < -10 ? 'declining' : 'stable',
      improvement: Math.round(improvement),
      consistency: Math.round(consistency),
      avgEarlyPace: Math.round(avgEarlyPace),
      avgRecentPace: Math.round(avgRecentPace),
      totalDataPoints: paceData.length
    };
  }

  /**
   * Analyze distance progression over time
   */
  analyzeDistanceProgression(workouts) {
    const distanceData = workouts
      .filter(w => w.totalDistance && w.totalDistance > 0)
      .map(w => ({
        date: w.createdAt,
        distance: w.totalDistance,
        duration: w.totalDuration || 0
      }));

    if (distanceData.length < 3) {
      return { trend: 'insufficient_data', totalIncrease: 0, weeklyAverage: 0 };
    }

    // Calculate weekly averages
    const weeklyDistances = this.groupDataByWeek(distanceData);
    const weeklyAverages = weeklyDistances.map(week => 
      week.reduce((sum, d) => sum + d.distance, 0)
    );

    if (weeklyAverages.length < 2) {
      return { trend: 'insufficient_data', totalIncrease: 0, weeklyAverage: 0 };
    }

    // Calculate trend
    const earlyWeeks = weeklyAverages.slice(0, Math.ceil(weeklyAverages.length / 2));
    const recentWeeks = weeklyAverages.slice(-Math.ceil(weeklyAverages.length / 2));
    
    const avgEarlyWeekly = earlyWeeks.reduce((sum, d) => sum + d, 0) / earlyWeeks.length;
    const avgRecentWeekly = recentWeeks.reduce((sum, d) => sum + d, 0) / recentWeeks.length;
    
    const totalIncrease = avgRecentWeekly - avgEarlyWeekly;
    const percentageIncrease = avgEarlyWeekly > 0 ? (totalIncrease / avgEarlyWeekly) * 100 : 0;

    return {
      trend: percentageIncrease > 10 ? 'increasing' : percentageIncrease < -10 ? 'decreasing' : 'stable',
      totalIncrease: Math.round(totalIncrease * 1000) / 1000, // Round to 3 decimal places
      percentageIncrease: Math.round(percentageIncrease),
      weeklyAverage: Math.round(avgRecentWeekly * 1000) / 1000,
      totalWorkouts: distanceData.length
    };
  }

  /**
   * Analyze consistency patterns
   */
  analyzeConsistencyPatterns(workouts) {
    const workoutsByWeek = this.groupDataByWeek(workouts.map(w => ({ date: w.createdAt })));
    const weeklyFrequency = workoutsByWeek.map(week => week.length);
    
    if (weeklyFrequency.length < 3) {
      return { trend: 'insufficient_data', averagePerWeek: 0, consistency: 0 };
    }

    const avgWorkoutsPerWeek = weeklyFrequency.reduce((sum, f) => sum + f, 0) / weeklyFrequency.length;
    
    // Calculate consistency (coefficient of variation)
    const variance = weeklyFrequency.reduce((sum, f) => sum + Math.pow(f - avgWorkoutsPerWeek, 2), 0) / weeklyFrequency.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgWorkoutsPerWeek > 0 ? stdDev / avgWorkoutsPerWeek : 1;
    const consistency = Math.max(0, 100 - (coefficientOfVariation * 100));

    // Analyze day-of-week patterns
    const dayPatterns = {};
    workouts.forEach(workout => {
      const dayOfWeek = new Date(workout.createdAt).getDay();
      dayPatterns[dayOfWeek] = (dayPatterns[dayOfWeek] || 0) + 1;
    });

    const mostActiveDays = Object.entries(dayPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day, count]) => ({
        day: this.getDayName(parseInt(day)),
        count: count
      }));

    return {
      trend: consistency > 70 ? 'consistent' : consistency > 40 ? 'moderate' : 'inconsistent',
      averagePerWeek: Math.round(avgWorkoutsPerWeek * 10) / 10,
      consistency: Math.round(consistency),
      mostActiveDays: mostActiveDays,
      totalWeeks: weeklyFrequency.length
    };
  }

  /**
   * Analyze effort vs performance relationship
   */
  analyzeEffortVsPerformance(workouts) {
    const effortData = workouts
      .filter(w => w.perceivedExertion && w.averagePace)
      .map(w => ({
        effort: w.perceivedExertion,
        pace: w.averagePace,
        date: w.createdAt
      }));

    if (effortData.length < 5) {
      return { trend: 'insufficient_data', efficiency: 0, recommendation: 'Need more workout data' };
    }

    // Calculate efficiency (lower pace at same effort = better efficiency)
    const efficiency = this.calculateTrainingEfficiency(effortData);
    
    // Analyze effort distribution
    const effortDistribution = this.analyzeEffortDistribution(effortData);
    
    // Check for overtraining signs
    const overtrainingRisk = this.assessOvertrainingRisk(effortData);

    return {
      trend: efficiency.trend,
      efficiency: efficiency.score,
      effortDistribution: effortDistribution,
      overtrainingRisk: overtrainingRisk,
      recommendation: this.generateEfficiencyRecommendation(efficiency, effortDistribution, overtrainingRisk)
    };
  }

  /**
   * Calculate overall progress score
   */
  calculateProgressScore(paceAnalysis, distanceAnalysis, consistencyAnalysis, effortAnalysis) {
    let score = 0;
    let maxScore = 0;

    // Pace improvement (30% weight)
    if (paceAnalysis.trend !== 'insufficient_data') {
      if (paceAnalysis.trend === 'improving') score += 30;
      else if (paceAnalysis.trend === 'stable') score += 20;
      else score += 10;
      maxScore += 30;
    }

    // Distance progression (25% weight)
    if (distanceAnalysis.trend !== 'insufficient_data') {
      if (distanceAnalysis.trend === 'increasing') score += 25;
      else if (distanceAnalysis.trend === 'stable') score += 20;
      else score += 10;
      maxScore += 25;
    }

    // Consistency (25% weight)
    if (consistencyAnalysis.trend !== 'insufficient_data') {
      if (consistencyAnalysis.trend === 'consistent') score += 25;
      else if (consistencyAnalysis.trend === 'moderate') score += 15;
      else score += 5;
      maxScore += 25;
    }

    // Efficiency (20% weight)
    if (effortAnalysis.trend !== 'insufficient_data') {
      if (effortAnalysis.trend === 'improving') score += 20;
      else if (effortAnalysis.trend === 'stable') score += 15;
      else score += 5;
      maxScore += 20;
    }

    const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    let trend = 'stable';
    if (finalScore >= 75) trend = 'excellent';
    else if (finalScore >= 60) trend = 'good';
    else if (finalScore >= 40) trend = 'fair';
    else trend = 'needs_improvement';

    return {
      value: finalScore,
      trend: trend,
      maxPossible: 100
    };
  }

  /**
   * Generate personalized progress recommendations
   */
  generateProgressRecommendations(paceAnalysis, distanceAnalysis, consistencyAnalysis, effortAnalysis) {
    const recommendations = [];

    // Pace recommendations
    if (paceAnalysis.trend === 'declining') {
      recommendations.push({
        category: 'pace',
        priority: 'high',
        title: 'Pace Performance Declining',
        message: 'Your recent pace has slowed. Consider reducing intensity and focusing on recovery.',
        action: 'Add more easy-paced runs and ensure adequate rest between sessions'
      });
    } else if (paceAnalysis.trend === 'improving' && paceAnalysis.consistency < 60) {
      recommendations.push({
        category: 'pace',
        priority: 'medium',
        title: 'Improve Pace Consistency',
        message: 'Your pace is improving but inconsistent. Focus on maintaining steady effort.',
        action: 'Practice running at target pace with regular pace checks'
      });
    }

    // Distance recommendations
    if (distanceAnalysis.trend === 'decreasing') {
      recommendations.push({
        category: 'volume',
        priority: 'medium',
        title: 'Weekly Distance Declining',
        message: 'Your weekly running volume has decreased. Gradually increase your mileage.',
        action: 'Add 10% weekly distance increase following the 10% rule'
      });
    } else if (distanceAnalysis.trend === 'increasing' && distanceAnalysis.percentageIncrease > 20) {
      recommendations.push({
        category: 'volume',
        priority: 'high',
        title: 'Rapid Volume Increase',
        message: 'You\'re increasing distance too quickly, which may lead to injury.',
        action: 'Reduce weekly distance increase to 10% or less'
      });
    }

    // Consistency recommendations
    if (consistencyAnalysis.trend === 'inconsistent') {
      recommendations.push({
        category: 'consistency',
        priority: 'high',
        title: 'Improve Training Consistency',
        message: 'Irregular training pattern detected. Consistency is key for improvement.',
        action: 'Set a regular training schedule and aim for at least 3 sessions per week'
      });
    } else if (consistencyAnalysis.trend === 'consistent' && consistencyAnalysis.averagePerWeek >= 4) {
      recommendations.push({
        category: 'consistency',
        priority: 'low',
        title: 'Excellent Consistency!',
        message: 'Your training consistency is excellent. You\'re building strong habits.',
        action: 'Continue your current schedule and consider gradual progression'
      });
    }

    // Efficiency recommendations
    if (effortAnalysis.overtrainingRisk && effortAnalysis.overtrainingRisk.level === 'high') {
      recommendations.push({
        category: 'recovery',
        priority: 'high',
        title: 'Overtraining Risk Detected',
        message: 'High effort levels with declining performance suggest overreaching.',
        action: 'Take a recovery week with reduced intensity and increased rest'
      });
    } else if (effortAnalysis.efficiency < 60) {
      recommendations.push({
        category: 'efficiency',
        priority: 'medium',
        title: 'Improve Training Efficiency',
        message: 'Your effort-to-performance ratio could be optimized.',
        action: 'Include more varied pace training and focus on proper pacing'
      });
    }

    return recommendations;
  }

  /**
   * Helper methods for enhanced analysis
   */
  getTimeframeMs(timeframe) {
    const timeframes = {
      '1week': 7 * 24 * 60 * 60 * 1000,
      '2weeks': 14 * 24 * 60 * 60 * 1000,
      '4weeks': 28 * 24 * 60 * 60 * 1000,
      '8weeks': 56 * 24 * 60 * 60 * 1000,
      '12weeks': 84 * 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe] || timeframes['4weeks'];
  }

  groupDataByWeek(data) {
    const weeks = {};
    data.forEach(item => {
      const date = new Date(item.date);
      const yearWeek = this.getYearWeek(date);
      if (!weeks[yearWeek]) weeks[yearWeek] = [];
      weeks[yearWeek].push(item);
    });
    return Object.values(weeks);
  }

  getYearWeek(date) {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }

  calculateTrainingEfficiency(effortData) {
    // Group data by effort level and analyze pace improvements
    const effortGroups = {};
    effortData.forEach(d => {
      const effortLevel = Math.round(d.effort);
      if (!effortGroups[effortLevel]) effortGroups[effortLevel] = [];
      effortGroups[effortLevel].push(d);
    });

    // Calculate efficiency trend for each effort level
    let totalEfficiencyChange = 0;
    let validComparisons = 0;

    Object.keys(effortGroups).forEach(level => {
      const efforts = effortGroups[level].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (efforts.length >= 3) {
        const early = efforts.slice(0, Math.ceil(efforts.length / 2));
        const recent = efforts.slice(-Math.ceil(efforts.length / 2));
        
        const earlyAvgPace = early.reduce((sum, e) => sum + e.pace, 0) / early.length;
        const recentAvgPace = recent.reduce((sum, e) => sum + e.pace, 0) / recent.length;
        
        const improvement = earlyAvgPace - recentAvgPace; // Positive = faster
        totalEfficiencyChange += improvement;
        validComparisons++;
      }
    });

    const avgEfficiencyChange = validComparisons > 0 ? totalEfficiencyChange / validComparisons : 0;
    const efficiencyScore = Math.max(0, Math.min(100, 50 + avgEfficiencyChange)); // Base 50, adjust by pace change

    return {
      score: Math.round(efficiencyScore),
      trend: avgEfficiencyChange > 5 ? 'improving' : avgEfficiencyChange < -5 ? 'declining' : 'stable',
      paceImprovement: Math.round(avgEfficiencyChange)
    };
  }

  analyzeEffortDistribution(effortData) {
    const distribution = { easy: 0, moderate: 0, hard: 0, veryHard: 0 };
    
    effortData.forEach(d => {
      if (d.effort <= 4) distribution.easy++;
      else if (d.effort <= 6) distribution.moderate++;
      else if (d.effort <= 8) distribution.hard++;
      else distribution.veryHard++;
    });

    const total = effortData.length;
    const percentages = {
      easy: Math.round((distribution.easy / total) * 100),
      moderate: Math.round((distribution.moderate / total) * 100),
      hard: Math.round((distribution.hard / total) * 100),
      veryHard: Math.round((distribution.veryHard / total) * 100)
    };

    // Ideal distribution: 80% easy/moderate, 20% hard/veryHard
    const easyModerate = percentages.easy + percentages.moderate;
    const hardVeryHard = percentages.hard + percentages.veryHard;
    
    return {
      percentages,
      balance: easyModerate >= 70 && hardVeryHard <= 30 ? 'good' : 
               easyModerate < 60 ? 'too_intense' : 'too_easy',
      recommendation: easyModerate < 70 ? 
        'Add more easy-moderate effort sessions' : 
        hardVeryHard < 15 ? 'Consider adding intensity sessions' : 'Good balance'
    };
  }

  assessOvertrainingRisk(effortData) {
    // Look for patterns indicating overtraining
    const recentData = effortData.slice(-10); // Last 10 workouts
    if (recentData.length < 5) {
      return { level: 'unknown', reason: 'Insufficient data' };
    }

    const avgRecentEffort = recentData.reduce((sum, d) => sum + d.effort, 0) / recentData.length;
    const avgRecentPace = recentData.reduce((sum, d) => sum + d.pace, 0) / recentData.length;
    
    // Compare with earlier data
    const earlierData = effortData.slice(0, -10);
    if (earlierData.length >= 5) {
      const avgEarlierEffort = earlierData.reduce((sum, d) => sum + d.effort, 0) / earlierData.length;
      const avgEarlierPace = earlierData.reduce((sum, d) => sum + d.pace, 0) / earlierData.length;
      
      // High effort but slower pace = overtraining risk
      const effortIncrease = avgRecentEffort - avgEarlierEffort;
      const paceDecrease = avgRecentPace - avgEarlierPace; // Positive = slower
      
      if (effortIncrease > 1 && paceDecrease > 15) {
        return {
          level: 'high',
          reason: 'Increasing effort with declining performance',
          effortIncrease: Math.round(effortIncrease * 10) / 10,
          paceDecrease: Math.round(paceDecrease)
        };
      } else if (avgRecentEffort > 7.5 && paceDecrease > 5) {
        return {
          level: 'moderate',
          reason: 'High effort levels with slight performance decline',
          avgEffort: Math.round(avgRecentEffort * 10) / 10
        };
      }
    }

    // Just high recent effort
    if (avgRecentEffort > 8) {
      return {
        level: 'moderate',
        reason: 'Consistently high effort levels',
        avgEffort: Math.round(avgRecentEffort * 10) / 10
      };
    }

    return { level: 'low', reason: 'No significant overtraining indicators' };
  }

  generateEfficiencyRecommendation(efficiency, effortDistribution, overtrainingRisk) {
    if (overtrainingRisk.level === 'high') {
      return 'Take immediate recovery action - reduce training intensity and add rest days';
    } else if (overtrainingRisk.level === 'moderate') {
      return 'Monitor fatigue closely and consider reducing intensity';
    } else if (effortDistribution.balance === 'too_intense') {
      return 'Add more easy-paced training sessions to improve aerobic base';
    } else if (efficiency.trend === 'declining') {
      return 'Focus on technique and pacing - consider working with a coach';
    } else if (efficiency.score > 75) {
      return 'Excellent training efficiency - continue current approach';
    } else {
      return 'Good progress - maintain consistency and focus on gradual improvement';
    }
  }

  /**
   * Rule-based adaptations (enhanced implementation)
   */
  async generateRuleBasedAdaptations(userId, performanceData, currentSchedule) {
    const adaptations = [];

    // Get enhanced progress analysis
    const progressAnalysis = await this.analyzeProgressTrends(userId, '4weeks');
    
    // Fatigue-based adaptations (enhanced)
    if (performanceData.avgFatigue >= 8) {
      const fatigueLevel = performanceData.avgFatigue >= 9 ? 'critical' : 'high';
      adaptations.push({
        type: 'fatigue_management',
        priority: fatigueLevel === 'critical' ? 'critical' : 'high',
        changes: {
          reduceIntensity: fatigueLevel === 'critical' ? 0.3 : 0.2,
          addRestDay: true,
          extendWarmup: fatigueLevel === 'critical' ? 10 : 5,
          addRecoveryActivities: true
        },
        reason: `${fatigueLevel === 'critical' ? 'Critical' : 'High'} fatigue levels detected`,
        duration: fatigueLevel === 'critical' ? 'this_and_next_week' : 'this_week'
      });
    }

    // Performance-based adaptations
    if (performanceData.completionRate < 70) {
      adaptations.push({
        type: 'volume_adjustment',
        priority: 'medium',
        changes: {
          reduceVolume: 0.15,
          increaseFlexibility: true
        },
        reason: 'Low completion rate indicates overreaching',
        duration: 'next_two_weeks'
      });
    }

    // Heart rate adaptations
    if (performanceData.avgHeartRate && performanceData.restingHeartRate) {
      const hrReserve = performanceData.maxHeartRate - performanceData.restingHeartRate;
      const currentIntensity = (performanceData.avgHeartRate - performanceData.restingHeartRate) / hrReserve;
      
      if (currentIntensity > 0.85) {
        adaptations.push({
          type: 'intensity_management',
          priority: 'medium',
          changes: {
            targetHeartRateZone: 'lower',
            addEasyDays: 1
          },
          reason: 'Training intensity consistently high',
          duration: 'this_week'
        });
      }
    }

    // Enhanced progress-based adaptations using trend analysis
    if (progressAnalysis.hasEnoughData) {
      // Pace-based adaptations
      if (progressAnalysis.paceAnalysis.trend === 'declining' && progressAnalysis.score < 50) {
        adaptations.push({
          type: 'pace_recovery',
          priority: 'high',
          changes: {
            reduceIntensity: 0.15,
            focusOnEasyRuns: true,
            addTechniqueFocus: true
          },
          reason: 'Pace performance declining - need recovery and technique focus',
          duration: 'two_weeks',
          progressData: {
            paceImprovement: progressAnalysis.paceAnalysis.improvement,
            consistency: progressAnalysis.paceAnalysis.consistency
          }
        });
      } else if (progressAnalysis.paceAnalysis.trend === 'improving' && progressAnalysis.paceAnalysis.consistency < 60) {
        adaptations.push({
          type: 'pace_consistency',
          priority: 'medium',
          changes: {
            addPaceTraining: true,
            focusOnSteadyState: true
          },
          reason: 'Pace improving but inconsistent - focus on steady pacing',
          duration: 'next_week'
        });
      }

      // Distance progression adaptations
      if (progressAnalysis.distanceAnalysis.trend === 'decreasing') {
        adaptations.push({
          type: 'volume_rebuild',
          priority: 'medium',
          changes: {
            gradualVolumeIncrease: 0.1,
            addExtraEasyRun: true
          },
          reason: 'Weekly distance declining - gradual volume rebuild needed',
          duration: 'four_weeks'
        });
      } else if (progressAnalysis.distanceAnalysis.percentageIncrease > 20) {
        adaptations.push({
          type: 'volume_moderation',
          priority: 'high',
          changes: {
            moderateVolumeIncrease: 0.05,
            addExtraRestDays: 1
          },
          reason: 'Volume increasing too rapidly - injury prevention',
          duration: 'immediate'
        });
      }

      // Consistency adaptations
      if (progressAnalysis.consistencyAnalysis.trend === 'inconsistent') {
        adaptations.push({
          type: 'consistency_improvement',
          priority: 'high',
          changes: {
            setRegularSchedule: true,
            reduceWorkoutComplexity: true,
            addReminders: true
          },
          reason: 'Training consistency needs improvement',
          duration: 'ongoing',
          targetFrequency: Math.max(3, Math.ceil(progressAnalysis.consistencyAnalysis.averagePerWeek))
        });
      }

      // Efficiency adaptations
      if (progressAnalysis.effortAnalysis.overtrainingRisk?.level === 'high') {
        adaptations.push({
          type: 'overtraining_intervention',
          priority: 'critical',
          changes: {
            immediateRestWeek: true,
            reduceIntensity: 0.4,
            addRecoveryActivities: true,
            monitorRestingHR: true
          },
          reason: 'High overtraining risk detected - immediate intervention needed',
          duration: 'immediate',
          riskFactors: progressAnalysis.effortAnalysis.overtrainingRisk
        });
      } else if (progressAnalysis.effortAnalysis.efficiency < 60) {
        adaptations.push({
          type: 'efficiency_improvement',
          priority: 'medium',
          changes: {
            focusOnForm: true,
            addTechniqueDrills: true,
            varyTrainingPaces: true
          },
          reason: 'Training efficiency could be improved',
          duration: 'four_weeks'
        });
      }

      // Success-based progression
      if (progressAnalysis.score >= 75 && progressAnalysis.consistencyAnalysis.trend === 'consistent') {
        adaptations.push({
          type: 'progressive_advancement',
          priority: 'low',
          changes: {
            gradualProgression: true,
            addQualitySession: true,
            increaseVolume: 0.05
          },
          reason: 'Excellent progress - ready for advancement',
          duration: 'gradual',
          progressScore: progressAnalysis.score
        });
      }
    }

    // Legacy progress-based adaptations (fallback)
    if (performanceData.progressTrend === 'improving' && performanceData.completionRate >= 90) {
      adaptations.push({
        type: 'progressive_overload',
        priority: 'low',
        changes: {
          increaseVolume: 0.05,
          addSpeedWork: true
        },
        reason: 'Excellent performance allows for progression',
        duration: 'next_week'
      });
    }

    // Add progress analysis to adaptations metadata
    if (progressAnalysis.hasEnoughData) {
      adaptations.forEach(adaptation => {
        adaptation.progressInsights = {
          overallScore: progressAnalysis.score,
          trend: progressAnalysis.trend,
          keyMetrics: {
            pace: progressAnalysis.paceAnalysis.trend,
            distance: progressAnalysis.distanceAnalysis.trend,
            consistency: progressAnalysis.consistencyAnalysis.trend,
            efficiency: progressAnalysis.effortAnalysis.trend
          }
        };
      });
    }

    return adaptations;
  }

  /**
   * Generate coaching tips using AI or rule-based approach
   */
  async generateCoachingTips(userId, recentData, upcomingSchedule, specificQuestion = null) {
    if (this.aiModels.enabled) {
      return await this.generateAICoachingTips(userId, recentData, upcomingSchedule, specificQuestion);
    } else {
      return await this.generateRuleBasedCoachingTips(userId, recentData, upcomingSchedule);
    }
  }

  /**
   * Generate AI-powered coaching tips
   */
  async generateAICoachingTips(userId, recentData, upcomingSchedule, specificQuestion = null) {
    try {
      console.log('🧠 Generating AI coaching advice...');
      
      // Use OpenAI service for coaching advice
      const aiResponse = await openAIService.generateCoachingAdvice(userId, recentData, upcomingSchedule, specificQuestion);
      
      // Get rule-based tips for comparison
      const ruleBasedTips = await this.generateRuleBasedCoachingTips(userId, recentData, upcomingSchedule);
      
      // Combine AI insights with structured tips
      const enhancedTips = {
        ...ruleBasedTips,
        aiAdvice: aiResponse.advice,
        mainMessage: aiResponse.advice.mainMessage,
        priority: aiResponse.priority,
        actionable: aiResponse.actionable,
        metadata: {
          ...aiResponse.metadata,
          coachingMethod: 'AI-enhanced',
          hasSpecificQuestion: Boolean(specificQuestion)
        }
      };

      // Add AI-generated tips to appropriate categories
      if (aiResponse.advice.tips && aiResponse.advice.tips.length > 0) {
        aiResponse.advice.tips.forEach((tip, index) => {
          const category = this.categorizeAITip(tip);
          if (enhancedTips[category]) {
            enhancedTips[category].push({
              message: tip,
              priority: aiResponse.priority,
              actionable: true,
              source: 'ai_generated',
              order: index
            });
          }
        });
      }

      console.log(`✅ AI coaching tips generated (priority: ${aiResponse.priority})`);
      console.log(`💰 Coaching cost: $${aiResponse.metadata.cost.toFixed(4)}`);
      
      return enhancedTips;
      
    } catch (error) {
      console.error('❌ AI coaching tips generation failed, using rule-based approach:', error);
      
      // Fallback to rule-based tips
      const fallbackTips = await this.generateRuleBasedCoachingTips(userId, recentData, upcomingSchedule);
      fallbackTips.metadata = {
        coachingMethod: 'Rule-based fallback',
        aiError: error.message
      };
      
      return fallbackTips;
    }
  }

  /**
   * Categorize AI tip into appropriate section
   */
  categorizeAITip(tip) {
    const tipLower = tip.toLowerCase();
    
    if (tipLower.includes('tempo') || tipLower.includes('tehnika') || tipLower.includes('forma') || tipLower.includes('technique')) {
      return 'technical';
    }
    
    if (tipLower.includes('atpūta') || tipLower.includes('recovery') || tipLower.includes('stiepšan') || tipLower.includes('stretch')) {
      return 'recovery';
    }
    
    if (tipLower.includes('uztura') || tipLower.includes('nutrition') || tipLower.includes('ēšan') || tipLower.includes('drink')) {
      return 'nutrition';
    }
    
    if (tipLower.includes('motivāc') || tipLower.includes('motivation') || tipLower.includes('pozitīv') || tipLower.includes('positive')) {
      return 'motivational';
    }
    
    if (tipLower.includes('mentāl') || tipLower.includes('mental') || tipLower.includes('stress') || tipLower.includes('focus')) {
      return 'mental';
    }
    
    // Default to technical for unrecognized tips
    return 'technical';
  }

  /**
   * Generate rule-based coaching tips (current implementation)
   */
  async generateRuleBasedCoachingTips(userId, recentData, upcomingSchedule) {
    const tips = {
      technical: [],
      motivational: [],
      recovery: [],
      nutrition: [],
      mental: []
    };

    // Technical tips
    if (recentData.avgPace && recentData.targetPace) {
      if (recentData.avgPace > recentData.targetPace * 1.1) {
        tips.technical.push({
          category: 'pacing',
          message: 'Focus on maintaining consistent pacing during easy runs',
          priority: 'medium',
          actionable: true,
          source: 'rule_based'
        });
      }
    }

    // Recovery tips
    if (recentData.avgFatigue >= 7) {
      tips.recovery.push({
        category: 'fatigue',
        message: 'Consider adding extra stretching and foam rolling sessions',
        priority: 'high',
        actionable: true,
        source: 'rule_based'
      });
    }

    // Motivational tips
    if (recentData.completionRate >= 85) {
      tips.motivational.push({
        category: 'achievement',
        message: 'Excellent consistency! You\'re building strong training habits',
        priority: 'low',
        actionable: false,
        source: 'rule_based'
      });
    }

    // Nutrition tips
    if (upcomingSchedule.hasLongRun) {
      tips.nutrition.push({
        category: 'fueling',
        message: 'Practice your race day nutrition strategy during long runs',
        priority: 'medium',
        actionable: true,
        source: 'rule_based'
      });
    }

    // Mental tips
    if (recentData.avgEnjoyment < 6) {
      tips.mental.push({
        category: 'enjoyment',
        message: 'Try exploring new running routes to keep training fresh and engaging',
        priority: 'medium',
        actionable: true,
        source: 'rule_based'
      });
    }

    return tips;
  }

  /**
   * AI readiness assessment
   */
  assessAIReadiness() {
    const requirements = {
      dataVolume: this.checkDataVolume(),
      apiKeys: this.checkAPIKeys(),
      models: this.checkModels(),
      infrastructure: this.checkInfrastructure()
    };

    const readinessScore = Object.values(requirements).filter(Boolean).length / Object.keys(requirements).length;

    return {
      ready: readinessScore >= 0.75,
      score: readinessScore,
      requirements: requirements,
      recommendations: this.getAIImplementationRecommendations(requirements)
    };
  }

  /**
   * Helper methods
   */
  buildPlanGenerationPrompt(userProfile, targetRace, preferences) {
    return `
      Generate a personalized ${targetRace.distance} training plan for:
      
      User Profile:
      - Age: ${userProfile.age}
      - Fitness Level: ${userProfile.fitnessLevel}
      - Weekly Mileage: ${userProfile.currentWeeklyMileage} km
      - Previous Experience: ${userProfile.hasRunningExperience ? 'Yes' : 'No'}
      - Injuries: ${userProfile.injuryHistory?.join(', ') || 'None'}
      
      Target Race:
      - Distance: ${targetRace.distance}
      - Date: ${targetRace.date}
      - Goal Time: ${targetRace.timeGoal || 'Not specified'}
      
      Preferences:
      - Sessions per week: ${preferences.sessionsPerWeek || 'Flexible'}
      - Training days: ${preferences.preferredDays?.join(', ') || 'Flexible'}
      
      Please provide a structured training plan with phases, weekly schedules, and adaptation guidelines.
    `;
  }

  buildAdaptationPrompt(userId, performanceData, currentSchedule) {
    return `
      Analyze the following training data and suggest adaptations:
      
      Performance Data:
      - Completion Rate: ${performanceData.completionRate}%
      - Average Fatigue: ${performanceData.avgFatigue}/10
      - Average Enjoyment: ${performanceData.avgEnjoyment}/10
      - Recent Progress: ${performanceData.progressTrend}
      
      Current Schedule Load:
      - Weekly Distance: ${currentSchedule.weeklyDistance} km
      - Sessions per Week: ${currentSchedule.sessionsPerWeek}
      - Intensity Distribution: ${JSON.stringify(currentSchedule.intensityDistribution)}
      
      Suggest specific adaptations for the upcoming week.
    `;
  }

  calculateEndDate(startDate, durationWeeks) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (durationWeeks * 7));
    return endDate;
  }

  async generateInitialSchedule(trainingPlan, skeleton) {
    const startDate = trainingPlan.startDate;
    const userProfile = trainingPlan.userProfile;

    const monthlySchedule = new MonthlySchedule({
      userId: trainingPlan.userId,
      trainingPlanId: trainingPlan._id.toString(),
      skeletonId: skeleton.templateId,
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      startDate: startDate,
      endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0),
      weeks: []
    });

    // Generate 4 weeks using skeleton
    const monthlyPlan = skeleton.generateMonthlySchedule(startDate, userProfile);
    
    monthlyPlan.forEach((weekPlan, weekIndex) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (weekIndex * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      monthlySchedule.weeks.push({
        weekNumber: weekIndex + 1,
        startDate: weekStart,
        endDate: weekEnd,
        phase: skeleton.phases[0]?.name || 'Base Building',
        schedule: weekPlan
      });
    });

    await monthlySchedule.save();
    return monthlySchedule;
  }

  getAdaptationCapabilities(skeleton) {
    return {
      performanceAdaptation: skeleton.adaptationRules.performanceAdaptation.enabled,
      recoveryAdaptation: skeleton.adaptationRules.recoveryAdaptation.enabled,
      scheduleAdaptation: skeleton.adaptationRules.scheduleAdaptation.enabled,
      aiEnabled: skeleton.aiSettings.enabled,
      updateFrequency: skeleton.aiSettings.updateFrequency
    };
  }

  assessInjuryRisk(performanceData) {
    let riskLevel = 'low';
    const riskFactors = [];

    if (performanceData.avgFatigue >= 8) {
      riskFactors.push('High fatigue levels');
      riskLevel = 'medium';
    }

    if (performanceData.completionRate < 60) {
      riskFactors.push('Very low completion rate');
      riskLevel = 'medium';
    }

    if (performanceData.avgPerceivedExertion >= 9) {
      riskFactors.push('Consistently high perceived exertion');
      riskLevel = 'high';
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      recommendation: riskLevel === 'high' ? 'Consider rest week' : 'Monitor closely'
    };
  }

  checkDataVolume() {
    // Check if we have enough data for AI training
    // TODO: Implement actual data volume check
    return true;
  }

  checkAPIKeys() {
    return Boolean(this.aiModels.openaiApiKey);
  }

  checkModels() {
    // Check if AI models are available
    return Boolean(this.aiModels.model);
  }

  checkInfrastructure() {
    // Check if infrastructure supports AI
    return true;
  }

  getAIImplementationRecommendations(requirements) {
    const recommendations = [];

    if (!requirements.apiKeys) {
      recommendations.push('Set up OpenAI API key in environment variables');
    }

    if (!requirements.dataVolume) {
      recommendations.push('Collect more training data before enabling AI features');
    }

    if (!requirements.models) {
      recommendations.push('Configure AI model endpoints and parameters');
    }

    if (!requirements.infrastructure) {
      recommendations.push('Upgrade infrastructure to support AI processing');
    }

    return recommendations;
  }

  /**
   * Enable AI features (for future use)
   */
  async enableAI(config = {}) {
    this.aiModels.enabled = true;
    this.aiModels = { ...this.aiModels, ...config };
    
    console.log('🤖 AI Training Service enabled');
    return this.assessAIReadiness();
  }

  /**
   * Disable AI features and fall back to rule-based approach
   */
  disableAI() {
    this.aiModels.enabled = false;
    console.log('📋 Falling back to rule-based training logic');
  }
}

// Export singleton instance
export const aiTrainingService = new AITrainingService();
export default aiTrainingService;