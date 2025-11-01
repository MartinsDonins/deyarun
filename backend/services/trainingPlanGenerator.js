import { TrainingPlan, PlannedWorkout, WorkoutTemplate } from '../models/mongodb/index.js';
import { addDays, addWeeks, startOfWeek, format } from 'date-fns';

class TrainingPlanGeneratorService {
  // Training plan durations (in weeks) based on race distance
  static PLAN_DURATIONS = {
    '5k': { beginner: 8, intermediate: 8, advanced: 6 },
    '10k': { beginner: 10, intermediate: 10, advanced: 8 },
    'half_marathon': { beginner: 12, intermediate: 12, advanced: 10 },
    'marathon': { beginner: 16, intermediate: 16, advanced: 14 },
    'ultra_50k': { beginner: 20, intermediate: 18, advanced: 16 }
  };

  // Weekly mileage progression rates
  static MILEAGE_PROGRESSION = {
    beginner: 0.10, // 10% increase per week
    intermediate: 0.08, // 8% increase per week
    advanced: 0.05 // 5% increase per week
  };

  // Training phases distribution (percentage of total plan)
  static PHASE_DISTRIBUTION = {
    base: 0.25,
    build: 0.35,
    peak: 0.25,
    taper: 0.15
  };

  /**
   * Generate a personalized training plan (legacy method)
   */
  async generateTrainingPlan(userId, planConfig) {
    return this.generateAdvancedTrainingPlan(userId, planConfig);
  }

  /**
   * Generate an advanced AI-powered training plan
   */
  async generateAdvancedTrainingPlan(userId, planConfig) {
    const {
      targetRace,
      fitnessLevel,
      currentWeeklyMileage,
      preferredTrainingDays,
      timeGoal,
      injuryHistory,
      availableTime,
      experience,
      preferredIntensity,
      previousWeekData
    } = planConfig;

    // Calculate plan duration with AI adjustments
    const planDuration = this.calculateAIPlanDuration(targetRace.distance, fitnessLevel, experience, availableTime);
    const startDate = new Date();
    const endDate = targetRace.date;

    // AI-enhanced risk assessment with previous week data
    const riskAssessment = this.assessInjuryRisk(injuryHistory, fitnessLevel, currentWeeklyMileage, previousWeekData);
    
    // Generate AI features with historical performance insights
    const aiFeatures = this.generateAIFeatures(planConfig, riskAssessment, previousWeekData);
    
    // Adjust training parameters based on previous week performance
    const adjustedConfig = this.adjustConfigWithHistoricalData(planConfig, previousWeekData);

    // Create training plan
    const trainingPlan = new TrainingPlan({
      userId,
      name: `${this.formatDistance(targetRace.distance)} AI Training Plan`,
      description: `AI-powered ${planDuration}-week plan for ${targetRace.name || targetRace.distance} with adaptive features${previousWeekData && previousWeekData.summary.workoutCount > 0 ? ' (personalized with recent training data)' : ''}`,
      targetRace: {
        ...targetRace,
        timeGoal
      },
      userProfile: {
        fitnessLevel,
        currentWeeklyMileage,
        preferredTrainingDays: preferredTrainingDays || this.getDefaultTrainingDays(fitnessLevel),
        longestRecentRun: planConfig.longestRecentRun,
        age: planConfig.age,
        restingHeartRate: planConfig.restingHeartRate,
        maxHeartRate: planConfig.maxHeartRate || this.calculateMaxHeartRate(planConfig.age),
        injuryHistory: injuryHistory || [],
        availableTime,
        experience,
        preferredIntensity
      },
      duration: planDuration,
      startDate,
      endDate,
      phases: this.generateAITrainingPhases(planDuration, adjustedConfig.currentWeeklyMileage, fitnessLevel, riskAssessment, previousWeekData),
      status: 'draft',
      adaptationEnabled: true,
      aiFeatures,
      riskAssessment,
      previousWeekInsights: previousWeekData ? previousWeekData.aiInsights : []
    });

    await trainingPlan.save();

    // Generate workouts for the plan
    await this.generateAdvancedWorkouts(trainingPlan);

    return trainingPlan;
  }

  /**
   * Enhanced personalization algorithm - Runna-style implementation
   */
  calculatePersonalizationScore(userProfile, performanceHistory = {}) {
    const factors = {
      experienceLevel: this.mapExperienceLevel(userProfile.experience || userProfile.fitnessLevel),
      weeklyVolumeTolerance: this.assessVolumeTolerance(userProfile.currentWeeklyMileage, userProfile.preferredIntensity),
      injuryRisk: this.calculateInjuryRiskScore(userProfile.injuryHistory, userProfile.age),
      recoveryCapacity: this.estimateRecoveryCapacity(userProfile.age, userProfile.restingHeartRate),
      goalAlignment: this.assessGoalAlignment(userProfile, performanceHistory),
      scheduleFlexibility: this.calculateScheduleFlexibility(userProfile.availableTime, userProfile.preferredTrainingDays)
    };

    // Weighted personalization score
    const weights = {
      experienceLevel: 0.25,
      weeklyVolumeTolerance: 0.20,
      injuryRisk: 0.15,
      recoveryCapacity: 0.15,
      goalAlignment: 0.15,
      scheduleFlexibility: 0.10
    };

    let totalScore = 0;
    for (const [factor, value] of Object.entries(factors)) {
      totalScore += value * weights[factor];
    }

    return {
      score: Math.round(totalScore * 100) / 100,
      factors,
      recommendations: this.generatePersonalizationRecommendations(factors)
    };
  }

  /**
   * Map experience level to numeric value (0-1)
   */
  mapExperienceLevel(level) {
    const mapping = {
      'beginner': 0.2,
      'some': 0.4,
      'intermediate': 0.6,
      'experienced': 0.8,
      'advanced': 0.9,
      'elite': 1.0
    };
    return mapping[level] || 0.5;
  }

  /**
   * Assess weekly volume tolerance
   */
  assessVolumeTolerance(currentMileage, preferredIntensity) {
    const baseScore = Math.min(currentMileage / 50, 1.0); // Normalize to 50km/week max
    const intensityMultiplier = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.2
    };
    return baseScore * (intensityMultiplier[preferredIntensity] || 1.0);
  }

  /**
   * Calculate injury risk score (lower is better)
   */
  calculateInjuryRiskScore(injuryHistory = [], age = 30) {
    let riskScore = 0;
    
    // Age factor (increases risk after 35)
    if (age > 35) riskScore += (age - 35) * 0.02;
    if (age > 50) riskScore += (age - 50) * 0.03;
    
    // Injury history factor
    const recentInjuries = (injuryHistory || []).filter(injury => {
      const injuryDate = new Date(injury.date);
      const monthsAgo = (Date.now() - injuryDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo < 12; // Injuries in last 12 months
    });
    
    riskScore += recentInjuries.length * 0.15;
    
    // Return inverted score (higher is better for our algorithm)
    return Math.max(0, 1 - riskScore);
  }

  /**
   * Estimate recovery capacity based on physiological markers
   */
  estimateRecoveryCapacity(age = 30, restingHeartRate = 65) {
    let recoveryScore = 1.0;
    
    // Age factor (decreases with age)
    if (age > 30) recoveryScore -= (age - 30) * 0.01;
    if (age > 50) recoveryScore -= (age - 50) * 0.02;
    
    // RHR factor (lower RHR = better fitness/recovery)
    if (restingHeartRate < 50) recoveryScore += 0.2;
    else if (restingHeartRate < 60) recoveryScore += 0.1;
    else if (restingHeartRate > 75) recoveryScore -= 0.1;
    else if (restingHeartRate > 85) recoveryScore -= 0.2;
    
    return Math.max(0.2, Math.min(1.0, recoveryScore));
  }

  /**
   * Assess goal alignment with current capabilities
   */
  assessGoalAlignment(userProfile, performanceHistory) {
    // This would typically analyze if the goal is realistic
    // For now, return a moderate score
    const timeHorizon = userProfile.availableTime || 12; // weeks
    const goalAmbition = userProfile.targetRace?.distance || '10k';
    
    const alignmentFactors = {
      '5k': { minWeeks: 6, difficulty: 0.3 },
      '10k': { minWeeks: 8, difficulty: 0.5 },
      'half_marathon': { minWeeks: 12, difficulty: 0.7 },
      'marathon': { minWeeks: 16, difficulty: 0.9 }
    };
    
    const goalData = alignmentFactors[goalAmbition] || alignmentFactors['10k'];
    const timeAlignment = timeHorizon >= goalData.minWeeks ? 1.0 : timeHorizon / goalData.minWeeks;
    const difficultyAlignment = 1.0 - (goalData.difficulty * 0.3); // Moderate penalty for ambitious goals
    
    return (timeAlignment + difficultyAlignment) / 2;
  }

  /**
   * Calculate schedule flexibility score
   */
  calculateScheduleFlexibility(availableTime = 45, preferredDays = []) {
    let flexibilityScore = 0.5; // Base score
    
    // Time availability factor
    if (availableTime >= 60) flexibilityScore += 0.3;
    else if (availableTime >= 45) flexibilityScore += 0.2;
    else if (availableTime < 30) flexibilityScore -= 0.2;
    
    // Days availability factor
    const daysCount = preferredDays.length || 3;
    if (daysCount >= 5) flexibilityScore += 0.2;
    else if (daysCount >= 4) flexibilityScore += 0.1;
    else if (daysCount <= 2) flexibilityScore -= 0.2;
    
    return Math.max(0.1, Math.min(1.0, flexibilityScore));
  }

  /**
   * Generate personalized recommendations based on factors
   */
  generatePersonalizationRecommendations(factors) {
    const recommendations = [];
    
    if (factors.experienceLevel < 0.4) {
      recommendations.push({
        type: 'experience',
        message: 'Iesācējiem ieteicams sākt ar zemāku intensitāti un 3 treniņiem nedēļā',
        priority: 'high'
      });
    }
    
    if (factors.injuryRisk < 0.6) {
      recommendations.push({
        type: 'injury_prevention',
        message: 'Pievērst īpašu uzmanību iesildīšanās un atjaunošanās fāzēm',
        priority: 'high'
      });
    }
    
    if (factors.recoveryCapacity < 0.5) {
      recommendations.push({
        type: 'recovery',
        message: 'Iekļaut papildu atpūtas dienas un mazāk intensīvus treniņus',
        priority: 'medium'
      });
    }
    
    if (factors.scheduleFlexibility < 0.4) {
      recommendations.push({
        type: 'schedule',
        message: 'Plāns tiks adaptēts īsākām treniņu sesijām ar lielāku efektivitāti',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Adapt training plan based on performance and feedback
   */
  async adaptTrainingPlan(plan, performanceData, feedbackType, adjustmentReason, userFeedback) {
    console.log('🤖 Starting AI-powered plan adaptation...');
    
    // Enhanced personalization analysis
    const personalizationScore = this.calculatePersonalizationScore(plan.userProfile, performanceData);
    
    // Analyze current performance trends
    const performanceAnalysis = this.analyzePerformanceTrends(performanceData);
    
    // Determine adaptation strategy with enhanced personalization
    const adaptationStrategy = this.determineEnhancedAdaptationStrategy(
      performanceAnalysis,
      personalizationScore,
      feedbackType,
      adjustmentReason,
      plan.userProfile
    );
    
    // Apply adaptations
    const changes = await this.applyAdaptations(plan, adaptationStrategy, userFeedback);
    
    // Get upcoming workouts with adaptations
    const upcomingWorkouts = await this.getAdaptedUpcomingWorkouts(plan, changes);
    
    return {
      changes,
      upcomingWorkouts,
      reasoning: adaptationStrategy.reasoning,
      adaptationScore: adaptationStrategy.score,
      personalizationInsights: personalizationScore
    };
  }

  /**
   * Determine enhanced adaptation strategy with personalization
   */
  determineEnhancedAdaptationStrategy(performanceAnalysis, personalizationScore, feedbackType, adjustmentReason, userProfile) {
    const adaptations = {
      intensity: 0, // -1 = decrease, 0 = maintain, +1 = increase
      volume: 0,
      frequency: 0,
      workoutTypes: [],
      reasoning: [],
      score: 0
    };

    // Performance-based adaptations
    if (performanceAnalysis.trend === 'improving') {
      if (personalizationScore.factors.experienceLevel > 0.6) {
        adaptations.intensity += 0.5;
        adaptations.reasoning.push('Pozitīvais progress ļauj palielināt intensitāti');
      }
    } else if (performanceAnalysis.trend === 'declining') {
      adaptations.intensity -= 0.5;
      adaptations.volume -= 0.3;
      adaptations.reasoning.push('Samazinām slodzi, lai novērstu pārslodzi');
    }

    // Personalization-based adaptations
    if (personalizationScore.factors.injuryRisk < 0.5) {
      adaptations.intensity -= 0.3;
      adaptations.workoutTypes.push('recovery', 'easy');
      adaptations.reasoning.push('Paaugstināts traumas risks - fokusējamies uz atjaunošanos');
    }

    if (personalizationScore.factors.recoveryCapacity < 0.5) {
      adaptations.frequency -= 1;
      adaptations.workoutTypes.push('recovery');
      adaptations.reasoning.push('Nepieciešama uzlabota atjaunošanās - mazāk treniņu');
    }

    if (personalizationScore.factors.scheduleFlexibility < 0.4) {
      adaptations.workoutTypes.push('flexible', 'time_efficient');
      adaptations.reasoning.push('Adaptēts īsākām, efektīvākām sesijām');
    }

    // Feedback-based adaptations
    if (feedbackType === 'too_hard') {
      adaptations.intensity -= 0.5;
      adaptations.reasoning.push('Lietotāja atgriezeniskā saite: pārāk grūti');
    } else if (feedbackType === 'too_easy') {
      adaptations.intensity += 0.5;
      adaptations.reasoning.push('Lietotāja atgriezeniskā saite: pārāk viegli');
    }

    // Weather-based adaptations
    const currentSeason = this.getCurrentSeason();
    if (currentSeason === 'winter' && userProfile.location?.includes('Latvia')) {
      adaptations.workoutTypes.push('indoor', 'treadmill');
      adaptations.reasoning.push('Ziemas apstākļi - ieteicami iekštelpu treniņi');
    }

    // Calculate overall adaptation score
    const totalChanges = Math.abs(adaptations.intensity) + Math.abs(adaptations.volume) + Math.abs(adaptations.frequency);
    adaptations.score = Math.min(1.0, totalChanges / 3);

    return adaptations;
  }

  /**
   * Get current season for adaptive planning
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'autumn';
  }

  /**
   * Apply adaptive adjustments to upcoming workouts
   */
  async applyAdaptiveAdjustments(plan, adaptationStrategy) {
    console.log('🔄 Applying adaptive adjustments...');
    
    const upcomingWorkouts = await this.getUpcomingWorkouts(plan, 14); // Next 2 weeks
    const adjustedWorkouts = [];

    for (const workout of upcomingWorkouts) {
      const adjustedWorkout = { ...workout };

      // Apply intensity adjustments
      if (adaptationStrategy.intensity !== 0) {
        adjustedWorkout.targetIntensity = this.adjustIntensity(
          workout.targetIntensity, 
          adaptationStrategy.intensity
        );
      }

      // Apply volume adjustments
      if (adaptationStrategy.volume !== 0) {
        adjustedWorkout.duration = this.adjustDuration(
          workout.duration, 
          adaptationStrategy.volume
        );
        adjustedWorkout.distance = this.adjustDistance(
          workout.distance, 
          adaptationStrategy.volume
        );
      }

      // Apply workout type changes
      if (adaptationStrategy.workoutTypes.length > 0) {
        adjustedWorkout.type = this.selectBestWorkoutType(
          workout.type, 
          adaptationStrategy.workoutTypes
        );
        adjustedWorkout.description = this.generateLatvianWorkoutDescription(
          adjustedWorkout.type, 
          adjustedWorkout
        );
      }

      // Add adaptation notes
      adjustedWorkout.adaptationNotes = {
        originalPlan: workout.type,
        adjustedPlan: adjustedWorkout.type,
        reason: adaptationStrategy.reasoning.join('; '),
        confidence: adaptationStrategy.score
      };

      adjustedWorkouts.push(adjustedWorkout);
    }

    return adjustedWorkouts;
  }

  /**
   * Adjust workout intensity based on adaptation strategy
   */
  adjustIntensity(currentIntensity, adjustment) {
    const intensityLevels = ['very_easy', 'easy', 'moderate', 'hard', 'very_hard'];
    const currentIndex = intensityLevels.indexOf(currentIntensity) || 2;
    const adjustmentSteps = Math.round(adjustment * 2); // -2 to +2 steps
    const newIndex = Math.max(0, Math.min(intensityLevels.length - 1, currentIndex + adjustmentSteps));
    
    return intensityLevels[newIndex];
  }

  /**
   * Adjust workout duration
   */
  adjustDuration(currentDuration, adjustment) {
    const adjustmentFactor = 1 + (adjustment * 0.2); // ±20% max
    const newDuration = Math.round(currentDuration * adjustmentFactor);
    return Math.max(15, Math.min(120, newDuration)); // Between 15-120 minutes
  }

  /**
   * Adjust workout distance
   */
  adjustDistance(currentDistance, adjustment) {
    const adjustmentFactor = 1 + (adjustment * 0.2); // ±20% max
    const newDistance = currentDistance * adjustmentFactor;
    return Math.max(1, Math.round(newDistance * 10) / 10); // Min 1km, round to 0.1km
  }

  /**
   * Select best workout type based on recommendations
   */
  selectBestWorkoutType(currentType, recommendedTypes) {
    // If current type is already in recommended, keep it
    if (recommendedTypes.includes(currentType)) {
      return currentType;
    }

    // Priority mapping for workout type selection
    const typePriority = {
      'recovery': ['recovery', 'easy', 'walking'],
      'easy': ['easy', 'recovery', 'base'],
      'flexible': ['easy', 'tempo', 'recovery'],
      'time_efficient': ['intervals', 'tempo', 'hill'],
      'indoor': ['treadmill', 'easy', 'intervals']
    };

    for (const recommended of recommendedTypes) {
      if (typePriority[recommended]) {
        return typePriority[recommended][0];
      }
    }

    return currentType; // Fallback to original
  }

  /**
   * Generate Latvian workout description
   */
  generateLatvianWorkoutDescription(workoutType, workout) {
    const descriptions = {
      'recovery': `Atjaunošanās skrējiens ${workout.duration} min. Ļoti viegls temps - sarunu līmenī.`,
      'easy': `Viegls skrējiens ${workout.distance}km. Koncentrējies uz elpošanu un baudīšanu.`,
      'tempo': `Tempo skrējiens ${workout.distance}km. "Ērti grūts" temps - vari runāt īsas frāzes.`,
      'intervals': `Intervālu treniņš ${workout.duration} min. Augsta intensitāte ar atpūtas periodiem.`,
      'hill': `Kalnu treniņš ${workout.duration} min. Stiprina kājas un uzlabo tehniku.`,
      'long': `Garais skrējiens ${workout.distance}km. Zemā intensitātē, bet būs izdržība!`
    };

    return descriptions[workoutType] || `Treniņš: ${workoutType} - ${workout.duration} min`;
  }

  /**
   * Weather-adaptive workout recommendations
   */
  getWeatherAdaptedWorkout(workout, weatherConditions) {
    const adaptedWorkout = { ...workout };

    switch (weatherConditions.condition) {
      case 'rain':
        adaptedWorkout.location = 'indoor';
        adaptedWorkout.notes = 'Lietus - ieteicams iekštelpu treniņš vai ūdensdrošs aprīkojums';
        break;
        
      case 'snow':
        adaptedWorkout.type = 'easy';
        adaptedWorkout.notes = 'Sniegs - uzmanīgi, īsāki soļi, spaiķi uz kurpēm';
        adaptedWorkout.duration = Math.round(workout.duration * 0.9); // 10% shorter
        break;
        
      case 'hot':
        if (weatherConditions.temperature > 25) {
          adaptedWorkout.startTime = '06:00';
          adaptedWorkout.intensity = this.adjustIntensity(workout.intensity, -0.3);
          adaptedWorkout.notes = 'Karsts laiks - sāc agri, daudz ūdens, samazināta intensitāte';
        }
        break;
        
      case 'wind':
        if (weatherConditions.windSpeed > 15) {
          adaptedWorkout.type = 'fartlek';
          adaptedWorkout.notes = 'Stiprs vējš - izmanto kā dabisko pretestību fartlek treniņam';
        }
        break;
    }

    return adaptedWorkout;
  }

  /**
   * Get training plan templates
   */
  async getTrainingPlanTemplates(filters) {
    const templates = [
      {
        id: 'beginner-5k',
        name: 'Beginner 5K Program',
        description: 'Perfect for first-time runners targeting a 5K',
        distance: '5k',
        level: 'beginner',
        duration: 8,
        workoutsPerWeek: 3,
        features: ['run-walk intervals', 'gradual progression', 'injury prevention'],
        preview: {
          week1: ['20 min run-walk', 'Rest day', '25 min intervals', 'Rest day', '30 min easy run'],
          week4: ['30 min continuous', 'Rest day', '35 min tempo', 'Rest day', '40 min long run'],
          week8: ['Race day prep', 'Rest day', 'Easy shakeout', 'Rest day', '5K Race!']
        }
      },
      {
        id: 'intermediate-10k',
        name: 'Intermediate 10K Improver',
        description: 'For experienced runners wanting to improve 10K time',
        distance: '10k',
        level: 'intermediate',
        duration: 10,
        workoutsPerWeek: 4,
        features: ['tempo runs', 'speed intervals', 'progressive long runs'],
        preview: {
          week1: ['Easy 6km', 'Tempo 5km', 'Easy 4km', 'Long run 8km'],
          week5: ['Easy 7km', 'Intervals 6x800m', 'Easy 5km', 'Long run 12km'],
          week10: ['Easy 4km', 'Race pace 3km', 'Rest day', '10K Race!']
        }
      },
      {
        id: 'advanced-marathon',
        name: 'Advanced Marathon Plan',
        description: 'High-volume plan for experienced marathoners',
        distance: 'marathon',
        level: 'advanced',
        duration: 16,
        workoutsPerWeek: 6,
        features: ['high mileage', 'multiple quality sessions', 'race simulation'],
        preview: {
          week1: ['Easy 10km', 'Tempo 8km', 'Easy 6km', 'Intervals', 'Easy 8km', 'Long run 20km'],
          week12: ['Easy 12km', 'Marathon pace 15km', 'Easy 8km', 'Intervals', 'Easy 10km', 'Long run 32km'],
          week16: ['Easy 6km', 'Race pace 5km', 'Easy 4km', 'Rest', 'Shakeout 3km', 'MARATHON!']
        }
      }
    ];

    // Apply filters
    let filteredTemplates = templates;
    
    if (filters.distance !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.distance === filters.distance);
    }
    
    if (filters.level !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.level === filters.level);
    }
    
    if (filters.duration !== 'all') {
      const durationNum = parseInt(filters.duration);
      filteredTemplates = filteredTemplates.filter(t => t.duration === durationNum);
    }

    return filteredTemplates;
  }

  /**
   * Analyze training plan effectiveness
   */
  async analyzePlanEffectiveness(plan) {
    console.log('📊 Analyzing training plan effectiveness...');
    
    // Get completed workouts for this plan
    const completedWorkouts = await PlannedWorkout.find({
      trainingPlanId: plan._id,
      status: 'completed'
    });

    // Calculate completion rate
    const totalWorkouts = await PlannedWorkout.countDocuments({
      trainingPlanId: plan._id
    });
    
    const completionRate = totalWorkouts > 0 ? (completedWorkouts.length / totalWorkouts) * 100 : 0;

    // Analyze progression
    const progressionAnalysis = this.analyzeProgressionTrends(completedWorkouts);
    
    // Calculate adherence patterns
    const adherencePatterns = this.analyzeAdherencePatterns(completedWorkouts, plan);
    
    // Generate recommendations
    const recommendations = this.generatePlanRecommendations(
      completionRate,
      progressionAnalysis,
      adherencePatterns,
      plan
    );

    return {
      completionRate: Math.round(completionRate),
      totalWorkouts,
      completedWorkouts: completedWorkouts.length,
      progressionAnalysis,
      adherencePatterns,
      recommendations,
      planEffectivenessScore: this.calculateEffectivenessScore(
        completionRate,
        progressionAnalysis,
        adherencePatterns
      )
    };
  }

  /**
   * Calculate plan duration based on race distance and fitness level
   */
  calculatePlanDuration(distance, fitnessLevel) {
    return TrainingPlanGeneratorService.PLAN_DURATIONS[distance]?.[fitnessLevel] || 12;
  }

  /**
   * Generate training phases
   */
  generateTrainingPhases(duration, baseWeeklyMileage, fitnessLevel) {
    const phases = [];
    const dist = TrainingPlanGeneratorService.PHASE_DISTRIBUTION;
    
    let weekCounter = 1;
    let currentMileage = baseWeeklyMileage;

    // Base Building Phase
    const baseWeeks = Math.floor(duration * dist.base);
    phases.push({
      name: 'Base Building',
      startWeek: weekCounter,
      endWeek: weekCounter + baseWeeks - 1,
      focus: 'Building aerobic base and consistency',
      weeklyMileageTarget: currentMileage
    });
    weekCounter += baseWeeks;

    // Build Phase
    const buildWeeks = Math.floor(duration * dist.build);
    currentMileage = this.calculateProgressedMileage(currentMileage, buildWeeks, fitnessLevel);
    phases.push({
      name: 'Build',
      startWeek: weekCounter,
      endWeek: weekCounter + buildWeeks - 1,
      focus: 'Increasing mileage and adding quality workouts',
      weeklyMileageTarget: currentMileage
    });
    weekCounter += buildWeeks;

    // Peak Phase
    const peakWeeks = Math.floor(duration * dist.peak);
    currentMileage = this.calculateProgressedMileage(currentMileage, peakWeeks * 0.5, fitnessLevel);
    phases.push({
      name: 'Peak',
      startWeek: weekCounter,
      endWeek: weekCounter + peakWeeks - 1,
      focus: 'Race-specific workouts and peak mileage',
      weeklyMileageTarget: currentMileage
    });
    weekCounter += peakWeeks;

    // Taper Phase
    const taperWeeks = duration - weekCounter + 1;
    phases.push({
      name: 'Taper',
      startWeek: weekCounter,
      endWeek: duration,
      focus: 'Reducing volume while maintaining intensity',
      weeklyMileageTarget: currentMileage * 0.6
    });

    return phases;
  }

  /**
   * Generate all workouts for the training plan
   */
  async generateWorkouts(trainingPlan) {
    const workouts = [];
    const templates = await this.loadWorkoutTemplates(trainingPlan);
    
    for (let week = 1; week <= trainingPlan.duration; week++) {
      const phase = this.getCurrentPhase(trainingPlan.phases, week);
      const weeklyWorkouts = await this.generateWeeklyWorkouts(
        trainingPlan,
        week,
        phase,
        templates
      );
      workouts.push(...weeklyWorkouts);
    }

    // Bulk insert all workouts
    await PlannedWorkout.insertMany(workouts);
    
    // Update plan statistics
    trainingPlan.stats.totalWorkouts = workouts.length;
    await trainingPlan.save();

    return workouts;
  }

  /**
   * Generate workouts for a specific week
   */
  async generateWeeklyWorkouts(plan, week, phase, templates) {
    const workouts = [];
    const weekStart = addWeeks(plan.startDate, week - 1);
    const trainingDays = plan.userProfile.preferredTrainingDays;
    
    // Get workout distribution for this phase
    const distribution = this.getWeeklyWorkoutDistribution(
      phase.name,
      plan.userProfile.fitnessLevel,
      week,
      plan.duration
    );

    // Map workouts to specific days
    trainingDays.forEach((day, index) => {
      const dayOfWeek = this.getDayNumber(day);
      const scheduledDate = addDays(startOfWeek(weekStart), dayOfWeek);
      
      const workoutType = distribution[index] || 'easy';
      const workout = this.createPlannedWorkout(
        plan,
        week,
        day,
        scheduledDate,
        workoutType,
        phase,
        templates
      );
      
      workouts.push(workout);
    });

    return workouts;
  }

  /**
   * Create a planned workout
   */
  createPlannedWorkout(plan, week, dayOfWeek, scheduledDate, type, phase, templates) {
    const template = templates[type];
    const weeklyMileage = phase.weeklyMileageTarget;
    
    // Calculate workout specifics based on type
    const workoutDetails = this.calculateWorkoutDetails(
      type,
      weeklyMileage,
      plan.userProfile.fitnessLevel,
      plan.targetRace,
      template
    );

    return {
      trainingPlanId: plan._id,
      userId: plan.userId,
      scheduledDate,
      week,
      dayOfWeek,
      type,
      name: workoutDetails.name,
      description: workoutDetails.description,
      mainSet: workoutDetails.mainSet,
      targetMetrics: workoutDetails.targetMetrics,
      warmupInstructions: template?.structure?.warmup?.description || 'Easy jogging for 10-15 minutes',
      cooldownInstructions: template?.structure?.cooldown?.description || 'Easy jogging for 10 minutes',
      coachingTips: workoutDetails.coachingTips,
      status: 'scheduled'
    };
  }

  /**
   * Calculate specific workout details
   */
  calculateWorkoutDetails(type, weeklyMileage, fitnessLevel, targetRace, template) {
    const paces = this.calculateTrainingPaces(targetRace, fitnessLevel);
    
    switch (type) {
      case 'easy':
        return this.createEasyRun(weeklyMileage, paces, fitnessLevel);
      
      case 'tempo':
        return this.createTempoRun(weeklyMileage, paces, fitnessLevel);
      
      case 'intervals':
        return this.createIntervalWorkout(weeklyMileage, paces, fitnessLevel, targetRace);
      
      case 'long':
        return this.createLongRun(weeklyMileage, paces, fitnessLevel);
      
      case 'recovery':
        return this.createRecoveryRun(weeklyMileage, paces);
      
      case 'race_pace':
        return this.createRacePaceRun(weeklyMileage, paces, targetRace);
      
      default:
        return this.createEasyRun(weeklyMileage, paces, fitnessLevel);
    }
  }

  /**
   * Create an easy run workout
   */
  createEasyRun(weeklyMileage, paces, fitnessLevel) {
    const distance = Math.round(weeklyMileage * 0.2 * 1000); // 20% of weekly mileage
    
    return {
      name: 'Easy Run',
      description: 'Comfortable pace, conversational effort',
      mainSet: {
        distance,
        pace: {
          min: paces.easy.min,
          max: paces.easy.max
        }
      },
      targetMetrics: {
        totalDistance: distance,
        averagePace: paces.easy.target,
        heartRateZone: { min: 60, max: 75 } // % of max HR
      },
      coachingTips: [
        'Keep the effort conversational',
        'Focus on relaxed form',
        'This run builds aerobic base'
      ]
    };
  }

  /**
   * Create a tempo run workout
   */
  createTempoRun(weeklyMileage, paces, fitnessLevel) {
    const tempoDistance = this.getTempoDistance(weeklyMileage, fitnessLevel);
    
    return {
      name: 'Tempo Run',
      description: 'Comfortably hard effort at threshold pace',
      mainSet: {
        intervals: [
          {
            type: 'warmup',
            distance: 2000,
            pace: paces.easy
          },
          {
            type: 'work',
            distance: tempoDistance,
            pace: paces.tempo,
            repetitions: 1
          },
          {
            type: 'cooldown',
            distance: 1600,
            pace: paces.easy
          }
        ]
      },
      targetMetrics: {
        totalDistance: tempoDistance + 3600,
        averagePace: paces.tempo.target,
        heartRateZone: { min: 80, max: 90 }
      },
      coachingTips: [
        'Run at a "comfortably hard" pace',
        'You should be able to speak in short sentences',
        'Focus on maintaining steady effort'
      ]
    };
  }

  /**
   * Create an interval workout
   */
  createIntervalWorkout(weeklyMileage, paces, fitnessLevel, targetRace) {
    const intervals = this.getIntervalStructure(targetRace.distance, fitnessLevel);
    
    return {
      name: intervals.name,
      description: intervals.description,
      mainSet: {
        intervals: [
          {
            type: 'warmup',
            distance: 2000,
            pace: paces.easy
          },
          ...intervals.workIntervals,
          {
            type: 'cooldown',
            distance: 1600,
            pace: paces.easy
          }
        ]
      },
      targetMetrics: {
        totalDistance: intervals.totalDistance,
        averagePace: paces.interval.target,
        heartRateZone: { min: 85, max: 95 }
      },
      coachingTips: intervals.tips
    };
  }

  /**
   * Create a long run workout
   */
  createLongRun(weeklyMileage, paces, fitnessLevel) {
    const distance = Math.round(weeklyMileage * 0.35 * 1000); // 35% of weekly mileage
    
    return {
      name: 'Long Run',
      description: 'Building endurance at easy pace',
      mainSet: {
        distance,
        pace: {
          min: paces.easy.min,
          max: paces.long.max
        }
      },
      targetMetrics: {
        totalDistance: distance,
        averagePace: paces.long.target,
        heartRateZone: { min: 65, max: 75 }
      },
      coachingTips: [
        'Start conservatively and settle into rhythm',
        'Focus on maintaining consistent effort',
        'Practice race nutrition if over 90 minutes'
      ]
    };
  }

  /**
   * Calculate training paces based on race goal
   */
  calculateTrainingPaces(targetRace, fitnessLevel) {
    // This is a simplified version - you'd want more sophisticated calculations
    const raceDistance = this.getRaceDistanceInKm(targetRace.distance);
    const racePacePerKm = targetRace.timeGoal ? 
      targetRace.timeGoal / raceDistance : 
      this.getDefaultRacePace(targetRace.distance, fitnessLevel);

    return {
      easy: {
        min: racePacePerKm + 60,
        max: racePacePerKm + 90,
        target: racePacePerKm + 75
      },
      tempo: {
        min: racePacePerKm - 15,
        max: racePacePerKm + 5,
        target: racePacePerKm - 5
      },
      interval: {
        min: racePacePerKm - 30,
        max: racePacePerKm - 15,
        target: racePacePerKm - 20
      },
      race: {
        min: racePacePerKm - 5,
        max: racePacePerKm + 5,
        target: racePacePerKm
      },
      long: {
        min: racePacePerKm + 30,
        max: racePacePerKm + 60,
        target: racePacePerKm + 45
      }
    };
  }

  // Helper methods
  formatDistance(distance) {
    const formats = {
      '5k': '5K',
      '10k': '10K',
      'half_marathon': 'Half Marathon',
      'marathon': 'Marathon',
      'ultra_50k': '50K Ultra'
    };
    return formats[distance] || distance;
  }

  getDefaultTrainingDays(fitnessLevel) {
    const days = {
      beginner: ['tuesday', 'thursday', 'saturday'],
      intermediate: ['tuesday', 'wednesday', 'friday', 'sunday'],
      advanced: ['monday', 'tuesday', 'thursday', 'friday', 'sunday'],
      elite: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday', 'sunday']
    };
    return days[fitnessLevel] || days.intermediate;
  }

  calculateMaxHeartRate(age) {
    return 220 - age;
  }

  calculateProgressedMileage(baseMileage, weeks, fitnessLevel) {
    const rate = TrainingPlanGeneratorService.MILEAGE_PROGRESSION[fitnessLevel];
    return baseMileage * Math.pow(1 + rate, weeks);
  }

  getCurrentPhase(phases, week) {
    return phases.find(phase => week >= phase.startWeek && week <= phase.endWeek);
  }

  getDayNumber(dayName) {
    const days = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    return days[dayName.toLowerCase()] || 0;
  }

  getRaceDistanceInKm(distance) {
    const distances = {
      '5k': 5,
      '10k': 10,
      'half_marathon': 21.0975,
      'marathon': 42.195,
      'ultra_50k': 50
    };
    return distances[distance] || 10;
  }

  getDefaultRacePace(distance, fitnessLevel) {
    // Default pace in seconds per km
    const paces = {
      '5k': { beginner: 360, intermediate: 300, advanced: 240 },
      '10k': { beginner: 380, intermediate: 320, advanced: 260 },
      'half_marathon': { beginner: 400, intermediate: 340, advanced: 280 },
      'marathon': { beginner: 420, intermediate: 360, advanced: 300 }
    };
    return paces[distance]?.[fitnessLevel] || 360;
  }

  async loadWorkoutTemplates(plan) {
    // For now, return empty object - you'd load from database
    return {};
  }

  getWeeklyWorkoutDistribution(phase, fitnessLevel, week, totalWeeks) {
    // Simplified distribution - you'd want more sophisticated logic
    const distributions = {
      'Base Building': {
        beginner: ['easy', 'easy', 'long'],
        intermediate: ['easy', 'tempo', 'easy', 'long'],
        advanced: ['easy', 'tempo', 'intervals', 'easy', 'long']
      },
      'Build': {
        beginner: ['easy', 'tempo', 'long'],
        intermediate: ['easy', 'intervals', 'tempo', 'long'],
        advanced: ['easy', 'intervals', 'tempo', 'easy', 'long']
      },
      'Peak': {
        beginner: ['easy', 'race_pace', 'long'],
        intermediate: ['tempo', 'intervals', 'race_pace', 'long'],
        advanced: ['tempo', 'intervals', 'race_pace', 'easy', 'long']
      },
      'Taper': {
        beginner: ['easy', 'easy', 'race_pace'],
        intermediate: ['easy', 'race_pace', 'easy', 'easy'],
        advanced: ['easy', 'race_pace', 'easy', 'easy', 'easy']
      }
    };

    return distributions[phase]?.[fitnessLevel] || distributions['Base Building'][fitnessLevel];
  }

  getTempoDistance(weeklyMileage, fitnessLevel) {
    const percentages = {
      beginner: 0.15,
      intermediate: 0.20,
      advanced: 0.25
    };
    return Math.round(weeklyMileage * (percentages[fitnessLevel] || 0.20) * 1000);
  }

  getIntervalStructure(raceDistance, fitnessLevel) {
    // Simplified interval structures
    if (raceDistance === '5k') {
      return {
        name: '6 x 800m Intervals',
        description: 'Speed development for 5K',
        workIntervals: Array(6).fill(null).map((_, i) => [
          {
            type: 'work',
            distance: 800,
            pace: { min: 240, max: 260 }, // Example pace
            repetitions: 1
          },
          {
            type: 'rest',
            duration: 120, // 2 minutes rest
            restType: 'jogging'
          }
        ]).flat().slice(0, -1), // Remove last rest
        totalDistance: 8400, // Including warmup/cooldown
        tips: [
          'Run intervals at 5K race pace or slightly faster',
          'Focus on consistent pacing',
          'Maintain good form even when tired'
        ]
      };
    } else if (raceDistance === '10k') {
      return {
        name: '5 x 1000m Intervals',
        description: 'Threshold development for 10K',
        workIntervals: Array(5).fill(null).map((_, i) => [
          {
            type: 'work',
            distance: 1000,
            pace: { min: 260, max: 280 },
            repetitions: 1
          },
          {
            type: 'rest',
            duration: 90,
            restType: 'jogging'
          }
        ]).flat().slice(0, -1),
        totalDistance: 8600,
        tips: [
          'Run at 10K race pace',
          'Focus on rhythm and breathing',
          'Stay relaxed in upper body'
        ]
      };
    } else if (raceDistance === 'half_marathon') {
      return {
        name: '4 x 1600m Threshold',
        description: 'Lactate threshold for Half Marathon',
        workIntervals: Array(4).fill(null).map((_, i) => [
          {
            type: 'work',
            distance: 1600,
            pace: { min: 280, max: 300 },
            repetitions: 1
          },
          {
            type: 'rest',
            duration: 60,
            restType: 'jogging'
          }
        ]).flat().slice(0, -1),
        totalDistance: 10000,
        tips: [
          'Run at half marathon pace',
          'Focus on steady effort',
          'Practice race hydration'
        ]
      };
    } else {
      return {
        name: '3 x 3000m Marathon Pace',
        description: 'Marathon pace practice',
        workIntervals: Array(3).fill(null).map((_, i) => [
          {
            type: 'work',
            distance: 3000,
            pace: { min: 300, max: 320 },
            repetitions: 1
          },
          {
            type: 'rest',
            duration: 180,
            restType: 'walking'
          }
        ]).flat().slice(0, -1),
        totalDistance: 12600,
        tips: [
          'Run at goal marathon pace',
          'Practice race nutrition',
          'Focus on efficiency'
        ]
      };
    }
  }

  createRecoveryRun(weeklyMileage, paces) {
    const distance = Math.round(weeklyMileage * 0.15 * 1000); // 15% of weekly mileage
    
    return {
      name: 'Recovery Run',
      description: 'Very easy effort for active recovery',
      mainSet: {
        distance,
        pace: {
          min: paces.easy.max,
          max: paces.easy.max + 30
        }
      },
      targetMetrics: {
        totalDistance: distance,
        averagePace: paces.easy.max + 15,
        heartRateZone: { min: 50, max: 65 }
      },
      coachingTips: [
        'Keep effort very easy',
        'Focus on form and relaxation',
        'This run aids recovery'
      ]
    };
  }

  createRacePaceRun(weeklyMileage, paces, targetRace) {
    const raceDistance = this.getRaceDistanceInKm(targetRace.distance);
    const distance = Math.min(
      Math.round(weeklyMileage * 0.25 * 1000),
      raceDistance * 1000 * 0.5 // Max 50% of race distance
    );
    
    return {
      name: 'Race Pace Run',
      description: `Practice ${this.formatDistance(targetRace.distance)} race pace`,
      mainSet: {
        intervals: [
          {
            type: 'warmup',
            distance: 2000,
            pace: paces.easy
          },
          {
            type: 'work',
            distance: distance,
            pace: paces.race,
            repetitions: 1
          },
          {
            type: 'cooldown',
            distance: 1000,
            pace: paces.easy
          }
        ]
      },
      targetMetrics: {
        totalDistance: distance + 3000,
        averagePace: paces.race.target,
        heartRateZone: { min: 75, max: 85 }
      },
      coachingTips: [
        'Lock into goal race pace',
        'Practice race day fueling',
        'Focus on efficiency at pace'
      ]
    };
  }

  // AI-Enhanced Helper Methods

  calculateAIPlanDuration(distance, fitnessLevel, experience, availableTime) {
    let baseDuration = this.calculatePlanDuration(distance, fitnessLevel);
    
    // Adjust based on experience
    if (experience === 'novice') baseDuration += 2;
    if (experience === 'expert') baseDuration -= 1;
    
    // Adjust based on available time
    if (availableTime === 'limited') baseDuration -= 1;
    if (availableTime === 'extensive') baseDuration += 2;
    
    return Math.max(baseDuration, 6); // Minimum 6 weeks
  }

  assessInjuryRisk(injuryHistory, fitnessLevel, currentMileage, previousWeekData) {
    let riskScore = 0;
    
    // Recent injury history increases risk
    const recentInjuries = injuryHistory.filter(injury => {
      const injuryDate = new Date(injury.date);
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      return injuryDate >= sixMonthsAgo;
    });
    
    riskScore += recentInjuries.length * 15;
    
    // High mileage increases risk for beginners
    if (fitnessLevel === 'beginner' && currentMileage > 30) riskScore += 20;
    
    // Chronic injuries
    const chronicInjuries = injuryHistory.filter(injury => injury.chronic);
    riskScore += chronicInjuries.length * 10;
    
    // Factor in previous week data for risk assessment
    if (previousWeekData && previousWeekData.summary) {
      // High training load in previous week increases risk
      if (previousWeekData.summary.trainingLoad > 300) riskScore += 15;
      
      // Poor recovery metrics increase risk
      if (previousWeekData.summary.recoveryMetrics && previousWeekData.summary.recoveryMetrics.recoveryScore < 40) {
        riskScore += 20;
      }
      
      // Very high intensity distribution increases risk
      if (previousWeekData.performanceAnalysis && previousWeekData.performanceAnalysis.intensityDistribution) {
        if (previousWeekData.performanceAnalysis.intensityDistribution.hard > 40) {
          riskScore += 15;
        }
      }
    }
    
    return {
      score: Math.min(riskScore, 100),
      level: riskScore < 20 ? 'low' : riskScore < 50 ? 'moderate' : 'high',
      recommendations: this.generateRiskRecommendations(riskScore, injuryHistory, previousWeekData)
    };
  }

  generateAIFeatures(planConfig, riskAssessment, previousWeekData) {
    return {
      adaptiveLoading: true,
      injuryPrevention: riskAssessment.level !== 'low',
      personalizedPacing: true,
      weatherAdaptation: true,
      loadManagement: true,
      recoveryOptimization: true,
      nutritionGuidance: planConfig.targetRace.distance === 'marathon' || planConfig.targetRace.distance === 'ultra_50k',
      realTimeFeedback: true,
      historicalDataIntegration: previousWeekData && previousWeekData.summary.workoutCount > 0,
      paceBasedOnHistory: previousWeekData && previousWeekData.summary.averagePace > 0,
      volumeBasedOnHistory: previousWeekData && previousWeekData.summary.weeklyDistance > 0,
      recoveryOptimizedForHistory: previousWeekData && previousWeekData.summary.recoveryMetrics
    };
  }

  generateAITrainingPhases(duration, baseWeeklyMileage, fitnessLevel, riskAssessment, previousWeekData) {
    // Start with standard phases
    let phases = this.generateTrainingPhases(duration, baseWeeklyMileage, fitnessLevel);
    
    // Modify based on risk assessment
    if (riskAssessment.level === 'high') {
      // Extend base phase, reduce peak intensity
      phases = phases.map(phase => {
        if (phase.name === 'Base Building') {
          phase.endWeek += 1;
          phase.focus += ' with extra injury prevention focus';
        }
        return phase;
      });
    }
    
    // Enhance phases based on previous week data
    if (previousWeekData && previousWeekData.summary.workoutCount > 0) {
      phases = phases.map(phase => {
        // Adjust base phase based on recent training consistency
        if (phase.name === 'Base Building' && previousWeekData.summary.completionRate < 60) {
          phase.focus += ' (emphasizing consistency based on recent patterns)';
          phase.weeklyMileageTarget *= 0.9; // Reduce by 10% for better adherence
        }
        
        // Adjust build phase based on recent recovery
        if (phase.name === 'Build' && previousWeekData.summary.recoveryMetrics && previousWeekData.summary.recoveryMetrics.recoveryScore < 50) {
          phase.focus += ' (with enhanced recovery based on recent data)';
        }
        
        // Adjust peak phase based on recent intensity distribution
        if (phase.name === 'Peak' && previousWeekData.performanceAnalysis && previousWeekData.performanceAnalysis.intensityDistribution) {
          const recentHardPercentage = previousWeekData.performanceAnalysis.intensityDistribution.hard;
          if (recentHardPercentage > 30) {
            phase.focus += ' (moderated intensity based on recent high-intensity training)';
          } else if (recentHardPercentage < 10) {
            phase.focus += ' (progressive intensity increase based on recent aerobic training)';
          }
        }
        
        return phase;
      });
    }
    
    return phases;
  }

  async generateAdvancedWorkouts(trainingPlan) {
    // Use existing workout generation with AI enhancements
    return this.generateWorkouts(trainingPlan);
  }

  analyzePerformanceTrends(performanceData) {
    const trends = {
      pace: this.calculatePaceTrend(performanceData.paces || []),
      distance: this.calculateDistanceTrend(performanceData.distances || []),
      effort: this.calculateEffortTrend(performanceData.efforts || []),
      consistency: this.calculateConsistencyTrend(performanceData.completion || [])
    };
    
    return {
      ...trends,
      overall: this.calculateOverallTrend(trends)
    };
  }

  determineAdaptationStrategy(performanceAnalysis, feedbackType, adjustmentReason, userProfile) {
    let strategy = {
      type: 'maintain',
      intensity: 0,
      volume: 0,
      reasoning: [],
      score: 50
    };
    
    // Analyze feedback
    if (feedbackType === 'too_hard') {
      strategy.type = 'reduce';
      strategy.intensity = -10;
      strategy.volume = -5;
      strategy.reasoning.push('Reducing intensity based on user feedback');
      strategy.score = 70;
    } else if (feedbackType === 'too_easy') {
      strategy.type = 'increase';
      strategy.intensity = 5;
      strategy.volume = 5;
      strategy.reasoning.push('Increasing load based on user feedback');
      strategy.score = 75;
    }
    
    // Factor in performance trends
    if (performanceAnalysis.overall === 'improving') {
      strategy.intensity += 3;
      strategy.reasoning.push('Performance trending positively');
      strategy.score += 10;
    } else if (performanceAnalysis.overall === 'declining') {
      strategy.intensity -= 5;
      strategy.volume -= 3;
      strategy.reasoning.push('Performance declining, reducing load');
      strategy.score += 15;
    }
    
    return strategy;
  }

  async applyAdaptations(plan, strategy, userFeedback) {
    const changes = [];
    
    // Get upcoming workouts (next 2 weeks)
    const upcomingWorkouts = await PlannedWorkout.find({
      trainingPlanId: plan._id,
      status: 'scheduled',
      scheduledDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });
    
    // Apply adaptations to workouts
    for (const workout of upcomingWorkouts) {
      const workoutChanges = await this.adaptWorkout(workout, strategy);
      if (workoutChanges.length > 0) {
        changes.push({
          workoutId: workout._id,
          workoutName: workout.name,
          changes: workoutChanges
        });
      }
    }
    
    return changes;
  }

  async adaptWorkout(workout, strategy) {
    const changes = [];
    
    if (strategy.intensity !== 0) {
      // Adjust workout intensity
      if (workout.targetMetrics && workout.targetMetrics.averagePace) {
        const paceAdjustment = strategy.intensity * 2; // 2 seconds per km per intensity point
        workout.targetMetrics.averagePace += paceAdjustment;
        changes.push(`Pace adjusted by ${paceAdjustment > 0 ? '+' : ''}${paceAdjustment} sec/km`);
      }
    }
    
    if (strategy.volume !== 0) {
      // Adjust workout volume
      if (workout.targetMetrics && workout.targetMetrics.totalDistance) {
        const volumeMultiplier = 1 + (strategy.volume / 100);
        const newDistance = Math.round(workout.targetMetrics.totalDistance * volumeMultiplier);
        const distanceChange = newDistance - workout.targetMetrics.totalDistance;
        workout.targetMetrics.totalDistance = newDistance;
        changes.push(`Distance adjusted by ${distanceChange > 0 ? '+' : ''}${distanceChange}m`);
      }
    }
    
    if (changes.length > 0) {
      await workout.save();
    }
    
    return changes;
  }

  async getAdaptedUpcomingWorkouts(plan, changes) {
    const workouts = await PlannedWorkout.find({
      trainingPlanId: plan._id,
      status: 'scheduled',
      scheduledDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).sort({ scheduledDate: 1 }).limit(5);
    
    return workouts.map(workout => ({
      id: workout._id,
      name: workout.name,
      scheduledDate: workout.scheduledDate,
      type: workout.type,
      targetMetrics: workout.targetMetrics,
      hasChanges: changes.some(change => change.workoutId.toString() === workout._id.toString())
    }));
  }

  calculatePaceTrend(paces) {
    if (paces.length < 2) return 'insufficient_data';
    
    const recentPaces = paces.slice(-5);
    const trend = recentPaces[recentPaces.length - 1] - recentPaces[0];
    
    if (trend < -10) return 'improving';
    if (trend > 10) return 'declining';
    return 'stable';
  }

  calculateDistanceTrend(distances) {
    if (distances.length < 2) return 'insufficient_data';
    
    const recentDistances = distances.slice(-5);
    const avgRecent = recentDistances.reduce((a, b) => a + b, 0) / recentDistances.length;
    const avgEarlier = distances.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(distances.length - 5, 1);
    
    const trend = (avgRecent - avgEarlier) / avgEarlier;
    
    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }

  calculateEffortTrend(efforts) {
    if (efforts.length < 3) return 'insufficient_data';
    
    const recentEfforts = efforts.slice(-3);
    const avgEffort = recentEfforts.reduce((a, b) => a + b, 0) / recentEfforts.length;
    
    if (avgEffort > 7) return 'high';
    if (avgEffort < 4) return 'low';
    return 'moderate';
  }

  calculateConsistencyTrend(completionRates) {
    if (completionRates.length < 4) return 'insufficient_data';
    
    const recentCompletion = completionRates.slice(-4);
    const avgCompletion = recentCompletion.reduce((a, b) => a + b, 0) / recentCompletion.length;
    
    if (avgCompletion > 0.8) return 'high';
    if (avgCompletion < 0.6) return 'low';
    return 'moderate';
  }

  calculateOverallTrend(trends) {
    const positiveIndicators = [
      trends.pace === 'improving',
      trends.distance === 'increasing',
      trends.consistency === 'high'
    ].filter(Boolean).length;
    
    const negativeIndicators = [
      trends.pace === 'declining',
      trends.distance === 'decreasing',
      trends.consistency === 'low',
      trends.effort === 'high'
    ].filter(Boolean).length;
    
    if (positiveIndicators > negativeIndicators) return 'improving';
    if (negativeIndicators > positiveIndicators) return 'declining';
    return 'stable';
  }

  analyzeProgressionTrends(completedWorkouts) {
    if (completedWorkouts.length < 3) {
      return {
        trend: 'insufficient_data',
        message: 'Need more completed workouts for analysis'
      };
    }
    
    // Analyze pace progression
    const pacedWorkouts = completedWorkouts
      .filter(w => w.completionMetrics && w.completionMetrics.averagePace)
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    if (pacedWorkouts.length >= 3) {
      const earlyPace = pacedWorkouts.slice(0, Math.ceil(pacedWorkouts.length / 3))
        .reduce((sum, w) => sum + w.completionMetrics.averagePace, 0) / Math.ceil(pacedWorkouts.length / 3);
      
      const latePace = pacedWorkouts.slice(-Math.ceil(pacedWorkouts.length / 3))
        .reduce((sum, w) => sum + w.completionMetrics.averagePace, 0) / Math.ceil(pacedWorkouts.length / 3);
      
      const improvement = earlyPace - latePace;
      
      return {
        trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
        paceImprovement: improvement,
        message: improvement > 5 ? 
          `Average pace improved by ${Math.round(improvement)} sec/km` :
          improvement < -5 ?
          `Average pace declined by ${Math.round(Math.abs(improvement))} sec/km` :
          'Pace remaining stable'
      };
    }
    
    return {
      trend: 'stable',
      message: 'Progression analysis in progress'
    };
  }

  analyzeAdherencePatterns(completedWorkouts, plan) {
    const totalWorkouts = plan.stats.totalWorkouts || 0;
    const completionRate = totalWorkouts > 0 ? (completedWorkouts.length / totalWorkouts) * 100 : 0;
    
    // Analyze completion by day of week
    const dayPatterns = {};
    completedWorkouts.forEach(workout => {
      const day = new Date(workout.scheduledDate).getDay();
      dayPatterns[day] = (dayPatterns[day] || 0) + 1;
    });
    
    // Find best and worst days
    const bestDay = Object.keys(dayPatterns).reduce((a, b) => 
      dayPatterns[a] > dayPatterns[b] ? a : b, 0);
    const worstDay = Object.keys(dayPatterns).reduce((a, b) => 
      dayPatterns[a] < dayPatterns[b] ? a : b, 0);
    
    return {
      completionRate: Math.round(completionRate),
      bestDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bestDay],
      worstDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][worstDay],
      patterns: dayPatterns
    };
  }

  generatePlanRecommendations(completionRate, progressionAnalysis, adherencePatterns, plan) {
    const recommendations = [];
    
    if (completionRate < 60) {
      recommendations.push({
        type: 'adherence',
        priority: 'high',
        title: 'Improve workout consistency',
        description: 'Try to complete at least 70% of scheduled workouts for optimal progress'
      });
    }
    
    if (progressionAnalysis.trend === 'declining') {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Consider reducing training load',
        description: 'Your performance is declining. Consider reducing intensity or adding more recovery'
      });
    }
    
    if (adherencePatterns.completionRate > 80 && progressionAnalysis.trend === 'improving') {
      recommendations.push({
        type: 'progression',
        priority: 'medium',
        title: 'Great progress! Consider advancing',
        description: 'Your consistency and performance are excellent. You might be ready for the next level'
      });
    }
    
    return recommendations;
  }

  calculateEffectivenessScore(completionRate, progressionAnalysis, adherencePatterns) {
    let score = completionRate * 0.4; // 40% weight on completion
    
    // Add progression score
    if (progressionAnalysis.trend === 'improving') score += 30;
    else if (progressionAnalysis.trend === 'stable') score += 20;
    else if (progressionAnalysis.trend === 'declining') score += 5;
    
    // Add adherence pattern score
    if (adherencePatterns.completionRate > 80) score += 20;
    else if (adherencePatterns.completionRate > 60) score += 15;
    else score += 5;
    
    // Ensure score is between 0-100
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  generateRiskRecommendations(riskScore, injuryHistory, previousWeekData) {
    const recommendations = [];
    
    if (riskScore > 50) {
      recommendations.push('Include extra warm-up and cool-down time');
      recommendations.push('Focus on strength training and injury prevention exercises');
      recommendations.push('Consider consulting with a sports medicine professional');
    }
    
    if (riskScore > 30) {
      recommendations.push('Monitor body feedback closely');
      recommendations.push('Include recovery runs in your schedule');
    }
    
    // Specific recommendations based on injury history
    const commonInjuries = injuryHistory.map(injury => injury.type);
    if (commonInjuries.includes('knee')) {
      recommendations.push('Focus on quad and glute strengthening exercises');
    }
    if (commonInjuries.includes('plantar_fasciitis')) {
      recommendations.push('Include calf stretching and foot strengthening');
    }
    
    // Additional recommendations based on previous week data
    if (previousWeekData && previousWeekData.summary) {
      if (previousWeekData.summary.recoveryMetrics && previousWeekData.summary.recoveryMetrics.recoveryScore < 40) {
        recommendations.push('Prioritize sleep and recovery based on recent training patterns');
      }
      
      if (previousWeekData.performanceAnalysis && previousWeekData.performanceAnalysis.intensityDistribution.hard > 40) {
        recommendations.push('Include more easy-paced runs to balance recent high-intensity training');
      }
      
      if (previousWeekData.summary.completionRate < 60) {
        recommendations.push('Focus on realistic goal-setting and consistency based on recent adherence patterns');
      }
    }
    
    return recommendations;
  }

  /**
   * Adjust training configuration based on historical data
   */
  adjustConfigWithHistoricalData(planConfig, previousWeekData) {
    if (!previousWeekData || !previousWeekData.summary) {
      return planConfig;
    }

    const adjustedConfig = { ...planConfig };
    
    // Adjust weekly mileage based on historical data
    if (previousWeekData.summary.weeklyDistance > 0) {
      const historicalDistance = previousWeekData.summary.weeklyDistance;
      const currentDistance = planConfig.currentWeeklyMileage || 10;
      
      // Use average of historical and user-provided data, weighted towards historical
      adjustedConfig.currentWeeklyMileage = (historicalDistance * 0.7) + (currentDistance * 0.3);
    }
    
    // Adjust preferred training days based on completion patterns
    if (previousWeekData.workouts && previousWeekData.workouts.length > 0) {
      const dayOfWeekCounts = {};
      previousWeekData.workouts.forEach(workout => {
        const dayOfWeek = new Date(workout.date).getDay();
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
      });
      
      // Find most successful training days
      const successfulDays = Object.entries(dayOfWeekCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, Math.min(planConfig.preferredTrainingDays?.length || 3, 5))
        .map(([day]) => {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          return dayNames[parseInt(day)];
        });
      
      if (successfulDays.length > 0) {
        adjustedConfig.preferredTrainingDays = successfulDays;
      }
    }
    
    // Adjust intensity preference based on recent training
    if (previousWeekData.performanceAnalysis && previousWeekData.performanceAnalysis.intensityDistribution) {
      const { easy, moderate, hard } = previousWeekData.performanceAnalysis.intensityDistribution;
      
      if (hard > 40) {
        adjustedConfig.preferredIntensity = 'low'; // Need more recovery
      } else if (easy > 80) {
        adjustedConfig.preferredIntensity = 'moderate'; // Ready for more intensity
      }
    }
    
    return adjustedConfig;
  }
}

export default new TrainingPlanGeneratorService();