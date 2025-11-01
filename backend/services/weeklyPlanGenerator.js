import { TrainingPlan, PlannedWorkout, Workout } from '../models/mongodb/index.js';
import Exercise from '../models/Exercise.js';
import { addDays, startOfWeek, endOfWeek, format, isSameDay } from 'date-fns';
import aiConversationService from './aiConversationService.js';
import trainingTranslationService from './trainingTranslationService.js';
import openAIService from './openAIService.js';
import mongoose from 'mongoose';

class WeeklyPlanGeneratorService {
  
  /**
   * Generate weekly training plan for next week
   */
  async generateWeeklyPlan(userId, userPreferences = {}) {
    let conversationSessionId = null;
    const startTime = Date.now();
    
    try {
      console.log(`🏃 Generating weekly plan for user: ${userId}`);
      
      // Start AI conversation tracking for this plan generation
      const conversationResult = await aiConversationService.startConversation({
        userId,
        conversationType: 'training',
        source: 'api',
        language: 'lv',
        metadata: {
          action: 'weekly_plan_generation',
          userPreferences
        }
      });
      
      if (conversationResult.success) {
        conversationSessionId = conversationResult.sessionId;
        
        // Log the user's request
        await aiConversationService.addUserMessage(
          conversationSessionId,
          `Lietotājs pieprasa nedēļas treniņplāna ģenerēšanu ar iestatījumiem: ${JSON.stringify(userPreferences)}`,
          {
            action: 'plan_generation_request',
            preferences: userPreferences
          }
        );
      }
      
      // Get user's current fitness data
      const userFitnessData = await this.getUserFitnessProfile(userId);
      
      // Get user's preferences
      const preferences = {
        trainingDays: userPreferences.trainingDays || ['monday', 'wednesday', 'friday', 'sunday'],
        fitnessLevel: userPreferences.fitnessLevel || userFitnessData.fitnessLevel || 'intermediate',
        weeklyDistanceGoal: userPreferences.weeklyDistanceGoal || userFitnessData.weeklyDistanceGoal || 25, // km
        preferredWorkoutTypes: userPreferences.preferredWorkoutTypes || ['easy', 'tempo', 'long'],
        timeAvailable: userPreferences.timeAvailable || 60, // minutes per session
        hasActivePlan: userPreferences.hasActivePlan || false,
        language: userPreferences.language || 'lv' // Default to Latvian
      };
      
      // Calculate next week dates
      const nextWeekStart = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }); // Monday
      const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });
      
      console.log(`📅 Generating plan for: ${format(nextWeekStart, 'yyyy-MM-dd')} to ${format(nextWeekEnd, 'yyyy-MM-dd')}`);
      
      // Create or find weekly training plan
      let weeklyPlan = await this.createWeeklyTrainingPlan(userId, nextWeekStart, preferences);
      
      // Generate individual workouts
      const workouts = await this.generateWeeklyWorkouts(userId, weeklyPlan._id, nextWeekStart, preferences);
      
      // Translate workouts based on user language preference
      const translatedWorkouts = workouts.map(workout => 
        trainingTranslationService.translateWorkout(workout, preferences.language)
      );
      
      // Save planned workouts
      const savedWorkouts = await PlannedWorkout.insertMany(translatedWorkouts);
      
      console.log(`✅ Generated ${savedWorkouts.length} workouts for week starting ${format(nextWeekStart, 'yyyy-MM-dd')}`);
      
      const result = {
        success: true,
        data: {
          plan: weeklyPlan,
          workouts: savedWorkouts,
          weekStart: nextWeekStart,
          weekEnd: nextWeekEnd,
          totalWorkouts: savedWorkouts.length,
          totalDistance: savedWorkouts.reduce((sum, w) => sum + (w.targetMetrics?.totalDistance || 0), 0),
          estimatedTime: savedWorkouts.reduce((sum, w) => sum + (w.targetMetrics?.totalDuration || 0), 0)
        }
      };

      // Log AI assistant response
      if (conversationSessionId) {
        const summaryMessage = `Veiksmīgi ģenerēts nedēļas treniņplāns ar ${savedWorkouts.length} treniņiem. Kopējā distance: ${(result.data.totalDistance / 1000).toFixed(1)} km, paredzētais laiks: ${Math.round(result.data.estimatedTime / 60)} minūtes.`;
        
        await aiConversationService.addAssistantMessage(
          conversationSessionId,
          summaryMessage,
          {
            action: 'plan_generation_response',
            planDetails: {
              workoutCount: savedWorkouts.length,
              totalDistance: result.data.totalDistance,
              estimatedTime: result.data.estimatedTime,
              weekStart: format(nextWeekStart, 'yyyy-MM-dd'),
              weekEnd: format(nextWeekEnd, 'yyyy-MM-dd')
            },
            processingTime: Date.now() - startTime
          }
        );

        // End conversation successfully
        await aiConversationService.endConversation(conversationSessionId, {
          resolved: true,
          feedback: 'Treniņplāns veiksmīgi ģenerēts',
          tags: ['training-plan', 'weekly-generation', 'success']
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error generating weekly plan:', error);
      
      // Log error in AI conversation if session exists
      if (conversationSessionId) {
        await aiConversationService.addSystemMessage(
          conversationSessionId,
          `Kļūda ģenerējot treniņplānu: ${error.message}`,
          {
            action: 'plan_generation_error',
            errorType: error.name || 'UnknownError',
            errorMessage: error.message
          }
        );

        await aiConversationService.endConversation(conversationSessionId, {
          resolved: false,
          feedback: `Neizdevās ģenerēt treniņplānu: ${error.message}`,
          tags: ['training-plan', 'weekly-generation', 'error'],
          sentiment: 'negative'
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Get user's fitness profile from recent workouts
   */
  async getUserFitnessProfile(userId) {
    try {
      // Get recent workouts (last 4 weeks)
      const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
      const recentWorkouts = await Workout.find({
        userId,
        status: 'completed',
        startedAt: { $gte: fourWeeksAgo }
      }).sort({ startedAt: -1 });
      
      if (recentWorkouts.length === 0) {
        return {
          fitnessLevel: 'beginner',
          weeklyDistanceGoal: 15,
          averagePace: 6 * 60, // 6 min/km in seconds
          longestRun: 5000 // 5km in meters
        };
      }
      
      // Calculate metrics
      const totalDistance = recentWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
      const weeklyAverage = (totalDistance / 1000) / 4; // Convert to km and average over 4 weeks
      const averagePace = recentWorkouts.reduce((sum, w) => sum + (w.avgPace || 6 * 60), 0) / recentWorkouts.length;
      const longestRun = Math.max(...recentWorkouts.map(w => w.distance || 0));
      
      // Determine fitness level
      let fitnessLevel = 'beginner';
      if (weeklyAverage > 40 && averagePace < 5 * 60) {
        fitnessLevel = 'advanced';
      } else if (weeklyAverage > 20 && averagePace < 5.5 * 60) {
        fitnessLevel = 'intermediate';
      }
      
      return {
        fitnessLevel,
        weeklyDistanceGoal: Math.max(weeklyAverage * 1.1, 15), // 10% increase or minimum 15km
        averagePace,
        longestRun,
        recentWorkoutCount: recentWorkouts.length
      };
      
    } catch (error) {
      console.error('Error getting user fitness profile:', error);
      return {
        fitnessLevel: 'beginner',
        weeklyDistanceGoal: 15,
        averagePace: 6 * 60,
        longestRun: 5000
      };
    }
  }
  
  /**
   * Create weekly training plan record
   */
  async createWeeklyTrainingPlan(userId, weekStart, preferences) {
    const { language = 'lv' } = preferences;
    
    const planNames = {
      lv: `Nedēļas treniņplāns - ${format(weekStart, 'yyyy-MM-dd')}`,
      en: `Weekly Training Plan - ${format(weekStart, 'yyyy-MM-dd')}`
    };
    
    const planDescriptions = {
      lv: `AI ģenerēts nedēļas treniņplāns priekš ${format(weekStart, 'dd.MM.yyyy')}`,
      en: `AI generated weekly training plan for ${format(weekStart, 'dd.MM.yyyy')}`
    };
    
    const planData = {
      userId,
      name: planNames[language] || planNames.lv,
      description: planDescriptions[language] || planDescriptions.lv,
      targetRace: {
        distance: 'custom',
        customDistance: preferences.weeklyDistanceGoal * 1000,
        date: addDays(weekStart, 6),
        name: language === 'en' ? 'Weekly Goal' : 'Nedēļas mērķis'
      },
      userProfile: {
        fitnessLevel: preferences.fitnessLevel,
        currentWeeklyMileage: preferences.weeklyDistanceGoal,
        preferredTrainingDays: preferences.trainingDays,
        injuryHistory: []
      },
      duration: 1, // 1 week
      startDate: weekStart,
      endDate: addDays(weekStart, 6),
      status: 'active',
      adaptationEnabled: true,
      stats: {
        totalWorkouts: preferences.trainingDays.length,
        completedWorkouts: 0,
        completionRate: 0
      }
    };
    
    const plan = new TrainingPlan(planData);
    return await plan.save();
  }
  
  /**
   * Generate individual workouts for the week
   */
  async generateWeeklyWorkouts(userId, trainingPlanId, weekStart, preferences) {
    const workouts = [];
    const { trainingDays, fitnessLevel, weeklyDistanceGoal, timeAvailable } = preferences;
    
    // Calculate daily distances
    const dailyDistances = this.calculateDailyDistances(weeklyDistanceGoal, trainingDays, fitnessLevel);
    
    for (let i = 0; i < trainingDays.length; i++) {
      const dayName = trainingDays[i];
      const dayIndex = this.getDayIndex(dayName);
      const workoutDate = addDays(weekStart, dayIndex);
      const distance = dailyDistances[i];
      
      // Determine workout type based on day and distance
      const workoutType = this.determineWorkoutType(i, trainingDays.length, distance, fitnessLevel);

      // Select exercises for this workout
      const exercises = await this.selectExercisesForWorkout(workoutType.type, fitnessLevel);

      const workout = {
        trainingPlanId,
        userId,
        scheduledDate: workoutDate,
        week: 1,
        dayOfWeek: dayName,
        type: workoutType.type,
        name: workoutType.name,
        description: workoutType.description,
        mainSet: workoutType.mainSet,
        targetMetrics: {
          totalDistance: distance * 1000, // Convert to meters
          totalDuration: this.estimateDuration(distance, fitnessLevel),
          averagePace: this.getTargetPace(workoutType.type, fitnessLevel),
          heartRateZone: this.getHeartRateZone(workoutType.type),
          calories: this.estimateCalories(distance, timeAvailable)
        },
        warmupInstructions: workoutType.warmup,
        cooldownInstructions: workoutType.cooldown,
        coachingTips: workoutType.tips,
        exercises: exercises, // Add selected exercises with videos
        status: 'scheduled'
      };

      workouts.push(workout);
    }
    
    return workouts;
  }
  
  /**
   * Calculate daily distances based on weekly goal
   */
  calculateDailyDistances(weeklyGoal, trainingDays, fitnessLevel) {
    const numDays = trainingDays.length;
    
    if (numDays === 3) {
      // 3 days: Easy (30%), Tempo (25%), Long (45%)
      return [
        weeklyGoal * 0.30,
        weeklyGoal * 0.25,
        weeklyGoal * 0.45
      ];
    } else if (numDays === 4) {
      // 4 days: Easy (25%), Tempo (20%), Easy (20%), Long (35%)
      return [
        weeklyGoal * 0.25,
        weeklyGoal * 0.20,
        weeklyGoal * 0.20,
        weeklyGoal * 0.35
      ];
    } else if (numDays === 5) {
      // 5 days: Easy (20%), Tempo (15%), Easy (15%), Intervals (20%), Long (30%)
      return [
        weeklyGoal * 0.20,
        weeklyGoal * 0.15,
        weeklyGoal * 0.15,
        weeklyGoal * 0.20,
        weeklyGoal * 0.30
      ];
    } else {
      // Default: equal distribution
      const dailyDistance = weeklyGoal / numDays;
      return new Array(numDays).fill(dailyDistance);
    }
  }
  
  /**
   * Determine workout type based on position in week
   */
  determineWorkoutType(dayIndex, totalDays, distance, fitnessLevel) {
    const workoutTypes = {
      easy: {
        type: 'easy',
        name: 'Viegls skrējiens',
        description: 'Viegls aerobais skrējiens mierīgā tempā',
        mainSet: {
          distance: distance * 1000,
          pace: { min: 5.5 * 60, max: 7 * 60 }
        },
        warmup: '10 minūšu staigāšana un viegls skrējiens',
        cooldown: '10 minūšu staigāšana un izstiepšanās',
        tips: ['Uzturiet sarunu tempu', 'Nesteigieties', 'Koncentrējieties uz formu']
      },
      tempo: {
        type: 'tempo',
        name: 'Tempo skrējiens',
        description: 'Mēreni grūts tempo skrējiens',
        mainSet: {
          distance: distance * 1000,
          pace: { min: 4.5 * 60, max: 5.5 * 60 }
        },
        warmup: '15 minūšu silīšanās ar paātrinājumiem',
        cooldown: '15 minūšu atdzesēšanās un izstiepšanās',
        tips: ['Uzturiet stabilu tempu', 'Kontrolējiet elpošanu', 'Koncentrējieties uz efektivitāti']
      },
      long: {
        type: 'long',
        name: 'Garš skrējiens',
        description: 'Ilgs aerobais skrējiens izturības attīstīšanai',
        mainSet: {
          distance: distance * 1000,
          pace: { min: 6 * 60, max: 7.5 * 60 }
        },
        warmup: '10 minūšu viegla silīšanās',
        cooldown: '15 minūšu staigāšana un izstiepšanās',
        tips: ['Sāciet lēni', 'Uzturiet vienmērīgu tempu', 'Hidratējieties regulāri']
      },
      intervals: {
        type: 'intervals',
        name: 'Intervālu treniņš',
        description: 'Ātru intervālu treniņš ar atpūtas pauzēm',
        mainSet: {
          intervals: [
            { type: 'warmup', duration: 10 * 60, pace: { min: 6 * 60, max: 7 * 60 } },
            { type: 'work', distance: 400, pace: { min: 4 * 60, max: 4.5 * 60 }, repetitions: 6, restDuration: 90, restType: 'jogging' },
            { type: 'cooldown', duration: 10 * 60, pace: { min: 6 * 60, max: 7 * 60 } }
          ]
        },
        warmup: '15 minūšu silīšanās ar paātrinājumiem',
        cooldown: '15 minūšu atdzesēšanās',
        tips: ['Koncentrējieties uz formu ātrajās daļās', 'Nepalaidiet garām atpūtu', 'Progresīvi palieliniet tempu']
      }
    };
    
    // Logic to determine workout type
    if (totalDays === 3) {
      return [workoutTypes.easy, workoutTypes.tempo, workoutTypes.long][dayIndex];
    } else if (totalDays === 4) {
      return [workoutTypes.easy, workoutTypes.tempo, workoutTypes.easy, workoutTypes.long][dayIndex];
    } else if (totalDays === 5) {
      return [workoutTypes.easy, workoutTypes.tempo, workoutTypes.easy, workoutTypes.intervals, workoutTypes.long][dayIndex];
    }
    
    // Default to easy if uncertain
    return workoutTypes.easy;
  }
  
  /**
   * Helper methods
   */
  getDayIndex(dayName) {
    const days = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
    return days[dayName.toLowerCase()] || 0;
  }
  
  estimateDuration(distanceKm, fitnessLevel) {
    const pacesPerKm = { beginner: 7 * 60, intermediate: 6 * 60, advanced: 5 * 60 };
    return distanceKm * (pacesPerKm[fitnessLevel] || 6 * 60);
  }
  
  getTargetPace(workoutType, fitnessLevel) {
    const basePaces = { beginner: 6.5 * 60, intermediate: 5.5 * 60, advanced: 4.5 * 60 };
    const multipliers = { easy: 1.2, tempo: 1.0, long: 1.1, intervals: 0.8 };
    return basePaces[fitnessLevel] * (multipliers[workoutType] || 1.0);
  }
  
  getHeartRateZone(workoutType) {
    const zones = {
      easy: { min: 60, max: 75 },
      tempo: { min: 75, max: 85 },
      long: { min: 65, max: 80 },
      intervals: { min: 85, max: 95 }
    };
    return zones[workoutType] || zones.easy;
  }
  
  estimateCalories(distanceKm, timeMinutes) {
    return Math.round(distanceKm * 60 + timeMinutes * 8); // Rough estimation
  }
  
  /**
   * Mark workout as completed/skipped
   */
  async updateWorkoutStatus(workoutId, status, completionData = {}) {
    try {
      console.log(`📝 Updating workout ${workoutId} to status ${status} with data:`, completionData);
      
      // Validate workoutId
      if (!workoutId || !mongoose.Types.ObjectId.isValid(workoutId)) {
        throw new Error(`Invalid workout ID: ${workoutId}`);
      }
      
      // Validate status
      const validStatuses = ['scheduled', 'completed', 'skipped', 'partial', 'rescheduled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const workout = await PlannedWorkout.findById(workoutId);
      if (!workout) {
        throw new Error(`Workout not found with ID: ${workoutId}`);
      }
      
      console.log(`📊 Found workout: ${workout.name} (current status: ${workout.status})`);
      
      const updateData = {
        status,
        'completionMetrics.completionDate': new Date()
      };
      
      if (status === 'completed' && completionData.workoutId) {
        updateData.completedWorkoutId = completionData.workoutId;
        updateData['completionMetrics.actualDistance'] = completionData.distance || null;
        updateData['completionMetrics.actualDuration'] = completionData.duration || null;
        updateData['completionMetrics.actualPace'] = completionData.pace || null;
        updateData['completionMetrics.effortLevel'] = completionData.effortLevel || null;
        updateData['completionMetrics.notes'] = completionData.notes || '';
      } else if (status === 'skipped') {
        updateData['completionMetrics.notes'] = completionData.reason || 'Nav norādīts iemesls';
      }
      
      console.log(`💾 Applying update:`, updateData);
      
      const updatedWorkout = await PlannedWorkout.findByIdAndUpdate(
        workoutId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedWorkout) {
        throw new Error(`Failed to update workout with ID: ${workoutId}`);
      }
      
      console.log(`✅ Workout ${workoutId} successfully marked as ${status}`);
      return updatedWorkout;
      
    } catch (error) {
      console.error(`❌ Error updating workout status for ${workoutId}:`, error.message);
      console.error(`❌ Full error:`, error);
      throw error;
    }
  }
  
  /**
   * Get current week's planned workouts
   */
  async getCurrentWeekWorkouts(userId) {
    try {
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      
      const workouts = await PlannedWorkout.find({
        userId,
        scheduledDate: {
          $gte: currentWeekStart,
          $lte: currentWeekEnd
        }
      }).sort({ scheduledDate: 1 });
      
      return workouts;

    } catch (error) {
      console.error('❌ Error getting current week workouts:', error);
      throw error;
    }
  }

  /**
   * Select appropriate exercises for a workout based on type and fitness level
   */
  async selectExercisesForWorkout(workoutType, fitnessLevel) {
    try {
      const exerciseCriteria = {
        difficulty: fitnessLevel,
        workoutType: workoutType,
        category: this.getExerciseCategoryForWorkout(workoutType)
      };

      // Get warm-up exercises
      const warmupExercises = await Exercise.findForTrainingPlan({
        category: 'warm-up',
        difficulty: fitnessLevel,
        workoutType: workoutType
      }).limit(3);

      // Get cool-down exercises
      const cooldownExercises = await Exercise.findForTrainingPlan({
        category: 'cool-down',
        difficulty: fitnessLevel
      }).limit(3);

      // Get strengthening exercises based on workout type
      const strengthExercises = await this.getStrengthExercises(workoutType, fitnessLevel);

      return {
        warmup: warmupExercises.map(ex => ({
          exerciseId: ex._id,
          name: ex.name,
          description: ex.description,
          videoUrl: ex.videoUrl,
          duration: ex.duration,
          repetitions: ex.repetitions,
          sets: ex.sets
        })),
        cooldown: cooldownExercises.map(ex => ({
          exerciseId: ex._id,
          name: ex.name,
          description: ex.description,
          videoUrl: ex.videoUrl,
          duration: ex.duration,
          repetitions: ex.repetitions,
          sets: ex.sets
        })),
        strengthening: strengthExercises.map(ex => ({
          exerciseId: ex._id,
          name: ex.name,
          description: ex.description,
          videoUrl: ex.videoUrl,
          duration: ex.duration,
          repetitions: ex.repetitions,
          sets: ex.sets,
          targetMuscles: ex.targetMuscleGroups
        }))
      };
    } catch (error) {
      console.error('Error selecting exercises:', error);
      return { warmup: [], cooldown: [], strengthening: [] };
    }
  }

  /**
   * Get exercise category based on workout type
   */
  getExerciseCategoryForWorkout(workoutType) {
    const categoryMap = {
      'easy': 'warm-up',
      'tempo': 'technique',
      'intervals': 'plyometric',
      'long': 'recovery',
      'recovery': 'flexibility'
    };
    return categoryMap[workoutType] || 'warm-up';
  }

  /**
   * Get strength exercises specific to workout type
   */
  async getStrengthExercises(workoutType, fitnessLevel) {
    const strengthCriteria = {
      difficulty: fitnessLevel,
      isActive: true,
      isPublic: true
    };

    // Different exercises for different workout types
    if (workoutType === 'intervals' || workoutType === 'tempo') {
      strengthCriteria.category = { $in: ['plyometric', 'strength'] };
      strengthCriteria.targetMuscleGroups = { $in: ['legs', 'core', 'glutes'] };
    } else if (workoutType === 'long') {
      strengthCriteria.category = { $in: ['core', 'balance'] };
    } else {
      strengthCriteria.category = { $in: ['flexibility', 'recovery'] };
    }

    const exercises = await Exercise.find(strengthCriteria)
      .sort({ 'usageStats.avgRating': -1 })
      .limit(4);

    return exercises;
  }

  /**
   * Generate AI coaching suggestions for weekly plan using ChatGPT
   */
  async generateAICoachingSuggestions(userId, weeklyPlan, preferences = {}) {
    try {
      console.log(`🤖 Generating AI coaching suggestions for user: ${userId}`);

      // Get user's recent workout history
      const recentWorkouts = await this.getUserFitnessProfile(userId);

      // Get current week's workouts
      const currentWorkouts = weeklyPlan.workouts || [];

      // Build context for AI
      const userProfile = {
        fitnessLevel: preferences.fitnessLevel || recentWorkouts.fitnessLevel,
        weeklyDistance: preferences.weeklyDistanceGoal || recentWorkouts.weeklyDistanceGoal,
        averagePace: recentWorkouts.averagePace,
        recentWorkoutCount: recentWorkouts.recentWorkoutCount
      };

      const upcomingSchedule = currentWorkouts.map(w => ({
        date: format(new Date(w.scheduledDate), 'yyyy-MM-dd'),
        type: w.type,
        name: w.name,
        distance: (w.targetMetrics?.totalDistance || 0) / 1000,
        duration: (w.targetMetrics?.totalDuration || 0) / 60
      }));

      const language = preferences.language || 'lv';

      // Generate coaching advice using OpenAI
      const aiResponse = await openAIService.generateCoachingAdvice(
        userId,
        {
          profile: userProfile,
          recentActivity: {
            totalWorkouts: recentWorkouts.recentWorkoutCount,
            avgPace: recentWorkouts.averagePace,
            longestRun: (recentWorkouts.longestRun || 0) / 1000
          }
        },
        upcomingSchedule,
        null, // No specific question
        language
      );

      console.log(`✅ AI coaching suggestions generated successfully`);

      return {
        success: true,
        suggestions: aiResponse.advice || aiResponse.tips || [],
        motivation: aiResponse.motivation || aiResponse.encouragement || '',
        warnings: aiResponse.warnings || aiResponse.cautions || [],
        metadata: {
          generatedAt: new Date(),
          model: aiResponse.metadata?.model || 'gpt-3.5-turbo',
          language: language
        }
      };

    } catch (error) {
      console.error('❌ Error generating AI coaching suggestions:', error);

      // Return fallback suggestions if AI fails
      return {
        success: false,
        suggestions: this.getFallbackSuggestions(preferences.language || 'lv'),
        motivation: preferences.language === 'en'
          ? 'Keep up the great work! Stay consistent with your training.'
          : 'Turpini lielisko darbu! Saglabā konsekventu treniņu režīmu.',
        warnings: [],
        metadata: {
          generatedAt: new Date(),
          model: 'fallback',
          language: preferences.language || 'lv',
          error: error.message
        }
      };
    }
  }

  /**
   * Get fallback suggestions if AI is unavailable
   */
  getFallbackSuggestions(language = 'lv') {
    if (language === 'en') {
      return [
        'Start each run with a proper warm-up (10-15 minutes of light jogging)',
        'Listen to your body - rest is as important as training',
        'Stay hydrated before, during, and after your runs',
        'Gradually increase your weekly mileage (no more than 10% per week)',
        'Include variety in your training - mix easy runs with tempo and long runs'
      ];
    }

    return [
      'Sāc katru skrējienu ar pareizu iesildīšanos (10-15 minūtes viegla skriešana)',
      'Klausies savā ķermenī - atpūta ir tikpat svarīga kā treniņš',
      'Uzturi pareizu hidratāciju pirms, laikā un pēc skrējiena',
      'Pakāpeniski palielini nedēļas distanci (ne vairāk kā 10% nedēļā)',
      'Iekļauj dažādību treniņos - apvieno vieglus skrējienus ar tempo un gariem skrējieniem'
    ];
  }
}

export default new WeeklyPlanGeneratorService();