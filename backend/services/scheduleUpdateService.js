import cron from 'node-cron';
import { MonthlySchedule } from '../models/mongodb/trainingPlan/monthlySchedule.model.js';
import { TrainingProgramSkeleton } from '../models/mongodb/trainingPlan/trainingProgramSkeleton.model.js';
import { TrainingPlan } from '../models/mongodb/trainingPlan/trainingPlan.model.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';

class ScheduleUpdateService {
  constructor() {
    this.isRunning = false;
    this.initScheduler();
  }

  initScheduler() {
    // Run every Sunday at 9:00 AM
    cron.schedule('0 9 * * 0', async () => {
      console.log('🗓️  Starting weekly schedule update on Sunday...');
      await this.performWeeklyUpdate();
    }, {
      scheduled: true,
      timezone: "Europe/Riga"
    });

    // Run daily at 6:00 AM to check for missed sessions
    cron.schedule('0 6 * * *', async () => {
      console.log('🔍 Checking for missed sessions and needed adaptations...');
      await this.checkMissedSessions();
    }, {
      scheduled: true,
      timezone: "Europe/Riga"
    });

    console.log('📅 Schedule update service initialized');
  }

  async performWeeklyUpdate() {
    if (this.isRunning) {
      console.log('⏳ Weekly update already running, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      // Get all active monthly schedules
      const activeSchedules = await MonthlySchedule.find({ 
        status: 'active',
        endDate: { $gte: new Date() }
      });

      console.log(`📊 Found ${activeSchedules.length} active schedules to update`);

      for (const schedule of activeSchedules) {
        await this.updateIndividualSchedule(schedule);
      }

      console.log('✅ Weekly update completed successfully');
    } catch (error) {
      console.error('❌ Error during weekly update:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async updateIndividualSchedule(schedule) {
    try {
      console.log(`🔄 Updating schedule for user ${schedule.userId}`);

      // Get the skeleton template
      const skeleton = await TrainingProgramSkeleton.findOne({ 
        templateId: schedule.skeletonId,
        isActive: true 
      });

      if (!skeleton) {
        console.log(`⚠️  Skeleton not found for schedule ${schedule._id}`);
        return;
      }

      // Get user's performance data from last week
      const lastWeekData = await this.getLastWeekPerformance(schedule.userId);
      
      // Analyze performance and determine adaptations
      const adaptations = await this.analyzePerformanceAndAdapt(lastWeekData, skeleton);

      // Update current week stats
      await this.updateWeeklyStats(schedule);

      // Generate next week's schedule with adaptations
      await this.generateNextWeek(schedule, skeleton, adaptations);

      // Update AI analysis
      await this.updateAIAnalysis(schedule, lastWeekData);

      // Save changes
      await schedule.save();

      console.log(`✅ Successfully updated schedule for user ${schedule.userId}`);
    } catch (error) {
      console.error(`❌ Error updating schedule for user ${schedule.userId}:`, error);
    }
  }

  async getLastWeekPerformance(userId) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get completed workouts from last week
    const workouts = await Workout.find({
      userId: userId,
      completedAt: { 
        $gte: oneWeekAgo,
        $lte: new Date()
      },
      status: 'completed'
    }).sort({ completedAt: -1 });

    // Calculate performance metrics
    const performance = {
      totalWorkouts: workouts.length,
      totalDistance: workouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      totalDuration: workouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      avgPace: 0,
      avgHeartRate: 0,
      avgPerceivedExertion: 0,
      avgFatigue: 0,
      avgEnjoyment: 0,
      missedSessions: 0,
      completionRate: 0
    };

    if (workouts.length > 0) {
      const validPaces = workouts.filter(w => w.avgPace).map(w => w.avgPace);
      const validHR = workouts.filter(w => w.avgHeartRate).map(w => w.avgHeartRate);
      const validPE = workouts.filter(w => w.perceivedExertion).map(w => w.perceivedExertion);
      const validFatigue = workouts.filter(w => w.fatigue).map(w => w.fatigue);
      const validEnjoyment = workouts.filter(w => w.enjoyment).map(w => w.enjoyment);

      performance.avgPace = validPaces.length > 0 ? validPaces.reduce((a, b) => a + b) / validPaces.length : 0;
      performance.avgHeartRate = validHR.length > 0 ? validHR.reduce((a, b) => a + b) / validHR.length : 0;
      performance.avgPerceivedExertion = validPE.length > 0 ? validPE.reduce((a, b) => a + b) / validPE.length : 0;
      performance.avgFatigue = validFatigue.length > 0 ? validFatigue.reduce((a, b) => a + b) / validFatigue.length : 0;
      performance.avgEnjoyment = validEnjoyment.length > 0 ? validEnjoyment.reduce((a, b) => a + b) / validEnjoyment.length : 0;
    }

    return performance;
  }

  async analyzePerformanceAndAdapt(performance, skeleton) {
    const adaptations = [];

    // High fatigue adaptation
    if (performance.avgFatigue >= 8) {
      adaptations.push({
        type: 'reduce_intensity',
        reason: 'High fatigue detected',
        adjustments: {
          intensityReduction: 0.2,
          addRecoveryDay: true
        }
      });
    }

    // Low completion rate adaptation
    if (performance.completionRate < 70) {
      adaptations.push({
        type: 'reduce_volume',
        reason: 'Low completion rate',
        adjustments: {
          volumeReduction: 0.15,
          scheduleFlexibility: true
        }
      });
    }

    // High perceived exertion adaptation
    if (performance.avgPerceivedExertion >= 8.5) {
      adaptations.push({
        type: 'reduce_intensity',
        reason: 'High perceived exertion',
        adjustments: {
          intensityReduction: 0.15,
          extendWarmupCooldown: true
        }
      });
    }

    // Performance improvement adaptation
    if (performance.avgPerceivedExertion <= 5 && performance.completionRate >= 90) {
      adaptations.push({
        type: 'increase_challenge',
        reason: 'Excellent performance',
        adjustments: {
          intensityIncrease: 0.1,
          volumeIncrease: 0.05
        }
      });
    }

    return adaptations;
  }

  async updateWeeklyStats(schedule) {
    // Update stats for completed weeks
    const currentDate = new Date();
    
    schedule.weeks.forEach((week, index) => {
      if (week.endDate <= currentDate) {
        schedule.updateWeekStats(index);
      }
    });

    // Update overall month stats
    schedule.updateMonthStats();
  }

  async generateNextWeek(schedule, skeleton, adaptations) {
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 7 - nextWeekStart.getDay()); // Next Sunday
    
    // Find the current week in the plan
    const currentWeekIndex = schedule.weeks.findIndex(week => 
      new Date(week.startDate) <= new Date() && new Date(week.endDate) >= new Date()
    );

    if (currentWeekIndex === -1 || currentWeekIndex >= schedule.weeks.length - 1) {
      // Generate new monthly schedule if we're at the end
      await this.generateNewMonth(schedule, skeleton);
      return;
    }

    // Get next week
    const nextWeek = schedule.weeks[currentWeekIndex + 1];
    
    // Apply adaptations to next week
    adaptations.forEach(adaptation => {
      this.applyAdaptationToWeek(nextWeek, adaptation, skeleton);
    });

    // Log adaptations
    schedule.adaptationLog.push({
      date: new Date(),
      type: 'weekly_update',
      reason: 'Weekly performance analysis',
      changes: adaptations.map(a => ({
        day: 'all',
        field: 'adaptation',
        oldValue: 'baseline',
        newValue: a.type
      })),
      adaptedBy: 'ai',
      impact: adaptations.length > 2 ? 'major' : adaptations.length > 0 ? 'moderate' : 'minor'
    });
  }

  applyAdaptationToWeek(week, adaptation, skeleton) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    switch (adaptation.type) {
      case 'reduce_intensity':
        days.forEach(day => {
          const session = week.schedule[day];
          if (session.type !== 'rest' && session.intensity !== 'recovery') {
            // Reduce intensity
            if (session.intensity === 'very_hard') session.intensity = 'hard';
            else if (session.intensity === 'hard') session.intensity = 'moderate';
            else if (session.intensity === 'moderate') session.intensity = 'easy';
            
            // Reduce duration
            session.plannedDuration = Math.round(session.plannedDuration * 0.85);
            session.plannedDistance = Math.round(session.plannedDistance * 0.85);
          }
        });
        
        if (adaptation.adjustments.addRecoveryDay) {
          // Convert one easy run to rest
          const easyDay = days.find(day => week.schedule[day].type === 'easy');
          if (easyDay) {
            week.schedule[easyDay].type = 'rest';
            week.schedule[easyDay].intensity = 'recovery';
            week.schedule[easyDay].plannedDuration = 0;
            week.schedule[easyDay].plannedDistance = 0;
          }
        }
        break;

      case 'reduce_volume':
        days.forEach(day => {
          const session = week.schedule[day];
          if (session.type !== 'rest') {
            session.plannedDuration = Math.round(session.plannedDuration * 0.85);
            session.plannedDistance = Math.round(session.plannedDistance * 0.85);
          }
        });
        break;

      case 'increase_challenge':
        days.forEach(day => {
          const session = week.schedule[day];
          if (session.type !== 'rest' && session.isFlexible) {
            // Slightly increase duration and intensity
            session.plannedDuration = Math.round(session.plannedDuration * 1.05);
            session.plannedDistance = Math.round(session.plannedDistance * 1.05);
            
            if (session.intensity === 'easy' && session.type !== 'long') {
              session.intensity = 'moderate';
            }
          }
        });
        break;
    }
  }

  async generateNewMonth(schedule, skeleton) {
    const nextMonthStart = new Date(schedule.endDate);
    nextMonthStart.setDate(nextMonthStart.getDate() + 1);
    
    // Create new monthly schedule
    const newSchedule = new MonthlySchedule({
      userId: schedule.userId,
      trainingPlanId: schedule.trainingPlanId,
      skeletonId: schedule.skeletonId,
      month: nextMonthStart.getMonth() + 1,
      year: nextMonthStart.getFullYear(),
      startDate: nextMonthStart,
      endDate: new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, 0),
      weeks: []
    });

    // Generate 4 weeks using skeleton
    const userProfile = {
      fitnessLevel: 'intermediate', // TODO: Get from user profile
      currentWeeklyMileage: schedule.monthStats.avgWeeklyDistance || 20
    };

    const monthlyPlan = skeleton.generateMonthlySchedule(nextMonthStart, userProfile);
    
    // Convert to our schedule format
    monthlyPlan.forEach((weekPlan, weekIndex) => {
      const weekStart = new Date(nextMonthStart);
      weekStart.setDate(weekStart.getDate() + (weekIndex * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      newSchedule.weeks.push({
        weekNumber: weekIndex + 1,
        startDate: weekStart,
        endDate: weekEnd,
        phase: weekPlan.monday.phase,
        schedule: weekPlan
      });
    });

    await newSchedule.save();
    console.log(`📅 Generated new monthly schedule for user ${schedule.userId}`);
  }

  async updateAIAnalysis(schedule, performanceData) {
    const insights = [];
    const recommendations = [];
    const riskFactors = [];
    let confidenceScore = 0.8;

    // Performance insights
    if (performanceData.completionRate >= 90) {
      insights.push('Excellent training consistency maintained');
    } else if (performanceData.completionRate >= 70) {
      insights.push('Good training adherence with room for improvement');
    } else {
      insights.push('Training consistency needs attention');
      riskFactors.push('Low completion rate may impact progress');
    }

    // Fatigue analysis
    if (performanceData.avgFatigue >= 8) {
      riskFactors.push('High fatigue levels detected');
      recommendations.push('Consider additional rest days');
    } else if (performanceData.avgFatigue <= 4) {
      recommendations.push('Good recovery - can consider slight intensity increase');
    }

    // Enjoyment analysis
    if (performanceData.avgEnjoyment >= 8) {
      insights.push('High training enjoyment indicates good program fit');
    } else if (performanceData.avgEnjoyment <= 5) {
      recommendations.push('Consider varying training routes and types');
      riskFactors.push('Low enjoyment may affect long-term adherence');
    }

    schedule.aiAnalysis = {
      lastAnalyzed: new Date(),
      performanceInsights: insights,
      recommendations: recommendations,
      riskFactors: riskFactors,
      confidenceScore: confidenceScore,
      nextAdaptationDate: schedule.getNextSundayUpdate()
    };
  }

  async checkMissedSessions() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      // Find schedules with sessions planned for yesterday
      const activeSchedules = await MonthlySchedule.find({ 
        status: 'active',
        'weeks.schedule.monday.date': { $lte: yesterday },
        'weeks.schedule.sunday.date': { $gte: yesterday }
      });

      for (const schedule of activeSchedules) {
        await this.handleMissedSessions(schedule, yesterday);
      }
    } catch (error) {
      console.error('❌ Error checking missed sessions:', error);
    }
  }

  async handleMissedSessions(schedule, checkDate) {
    const targetWeek = schedule.weeks.find(week => 
      new Date(week.startDate) <= checkDate && 
      new Date(week.endDate) >= checkDate
    );

    if (!targetWeek) return;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let hasMissedSessions = false;

    days.forEach(day => {
      const session = targetWeek.schedule[day];
      const sessionDate = new Date(session.date);
      
      if (sessionDate.toDateString() === checkDate.toDateString()) {
        if (session.status === 'planned' && session.type !== 'rest') {
          session.status = 'missed';
          hasMissedSessions = true;
          
          // Try to reschedule if it's a critical session
          const skeleton = { adaptationRules: { scheduleAdaptation: { enabled: true } } }; // TODO: Load actual skeleton
          const adaptation = skeleton.adaptForMissedSession?.(day, targetWeek.schedule);
          
          if (adaptation && adaptation.action === 'reschedule') {
            // Move session to another day
            const targetDay = adaptation.to;
            const targetSession = targetWeek.schedule[targetDay];
            
            if (targetSession.type === 'rest') {
              targetSession.type = session.type;
              targetSession.intensity = session.intensity;
              targetSession.plannedDuration = session.plannedDuration;
              targetSession.plannedDistance = session.plannedDistance;
              targetSession.status = 'moved';
              
              session.status = 'moved';
              session.notes = `Moved to ${targetDay}`;
            }
          }
        }
      }
    });

    if (hasMissedSessions) {
      schedule.adaptationLog.push({
        date: new Date(),
        type: 'missed_session',
        reason: 'Automatic missed session detection',
        adaptedBy: 'ai',
        impact: 'minor'
      });

      await schedule.save();
    }
  }

  // Manual triggers for testing/admin
  async triggerWeeklyUpdate() {
    console.log('🔧 Manually triggering weekly update...');
    await this.performWeeklyUpdate();
  }

  async triggerMissedSessionCheck() {
    console.log('🔧 Manually triggering missed session check...');
    await this.checkMissedSessions();
  }
}

// Export singleton instance
export const scheduleUpdateService = new ScheduleUpdateService();
export default scheduleUpdateService;