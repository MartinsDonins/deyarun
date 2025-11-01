import mongoose from 'mongoose';

// Monthly Training Schedule - Generated from skeleton, updated weekly on Sundays
const MonthlyScheduleSchema = new mongoose.Schema({
  // User and Program References
  userId: {
    type: String,
    required: true,
    index: true
  },
  trainingPlanId: {
    type: String,
    required: true,
    index: true
  },
  skeletonId: {
    type: String,
    required: true
  },
  
  // Schedule Metadata
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Monthly Schedule Structure (4 weeks)
  weeks: [{
    weekNumber: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    phase: {
      type: String,
      required: true
    },
    // Daily schedule for the week
    schedule: {
      monday: {
        date: Date,
        type: {
          type: String,
          enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross', 'strength'],
          default: 'rest'
        },
        plannedDuration: Number, // minutes
        actualDuration: Number, // minutes (filled after completion)
        intensity: {
          type: String,
          enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
          default: 'easy'
        },
        plannedDistance: Number, // km
        actualDistance: Number, // km
        description: String,
        notes: String,
        isFlexible: { type: Boolean, default: true },
        status: {
          type: String,
          enum: ['planned', 'completed', 'missed', 'moved', 'modified'],
          default: 'planned'
        },
        completedAt: Date,
        // Performance data
        performance: {
          avgHeartRate: Number,
          maxHeartRate: Number,
          avgPace: Number, // seconds per km
          perceivedExertion: Number, // 1-10 scale
          enjoyment: Number, // 1-10 scale
          fatigue: Number, // 1-10 scale
          weather: String,
          surface: String
        },
        adaptations: [{
          reason: String,
          changedFrom: mongoose.Schema.Types.Mixed,
          changedTo: mongoose.Schema.Types.Mixed,
          adaptedAt: Date,
          adaptedBy: {
            type: String,
            enum: ['user', 'ai', 'coach'],
            default: 'ai'
          }
        }]
      },
      tuesday: {
        date: Date,
        type: {
          type: String,
          enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross', 'strength'],
          default: 'easy'
        },
        plannedDuration: Number,
        actualDuration: Number,
        intensity: {
          type: String,
          enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
          default: 'easy'
        },
        plannedDistance: Number,
        actualDistance: Number,
        description: String,
        notes: String,
        isFlexible: { type: Boolean, default: true },
        status: {
          type: String,
          enum: ['planned', 'completed', 'missed', 'moved', 'modified'],
          default: 'planned'
        },
        completedAt: Date,
        performance: {
          avgHeartRate: Number,
          maxHeartRate: Number,
          avgPace: Number,
          perceivedExertion: Number,
          enjoyment: Number,
          fatigue: Number,
          weather: String,
          surface: String
        },
        adaptations: [{
          reason: String,
          changedFrom: mongoose.Schema.Types.Mixed,
          changedTo: mongoose.Schema.Types.Mixed,
          adaptedAt: Date,
          adaptedBy: {
            type: String,
            enum: ['user', 'ai', 'coach'],
            default: 'ai'
          }
        }]
      },
      wednesday: {
        date: Date,
        type: {
          type: String,
          enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross', 'strength'],
          default: 'tempo'
        },
        plannedDuration: Number,
        actualDuration: Number,
        intensity: {
          type: String,
          enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
          default: 'moderate'
        },
        plannedDistance: Number,
        actualDistance: Number,
        description: String,
        notes: String,
        isFlexible: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ['planned', 'completed', 'missed', 'moved', 'modified'],
          default: 'planned'
        },
        completedAt: Date,
        performance: {
          avgHeartRate: Number,
          maxHeartRate: Number,
          avgPace: Number,
          perceivedExertion: Number,
          enjoyment: Number,
          fatigue: Number,
          weather: String,
          surface: String
        },
        adaptations: [{
          reason: String,
          changedFrom: mongoose.Schema.Types.Mixed,
          changedTo: mongoose.Schema.Types.Mixed,
          adaptedAt: Date,
          adaptedBy: {
            type: String,
            enum: ['user', 'ai', 'coach'],
            default: 'ai'
          }
        }]
      },
      thursday: {
        date: Date,
        type: {
          type: String,
          enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross', 'strength'],
          default: 'easy'
        },
        plannedDuration: Number,
        actualDuration: Number,
        intensity: {
          type: String,
          enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
          default: 'easy'
        },
        plannedDistance: Number,
        actualDistance: Number,
        description: String,
        notes: String,
        isFlexible: { type: Boolean, default: true },
        status: {
          type: String,
          enum: ['planned', 'completed', 'missed', 'moved', 'modified'],
          default: 'planned'
        },
        completedAt: Date,
        performance: {
          avgHeartRate: Number,
          maxHeartRate: Number,
          avgPace: Number,
          perceivedExertion: Number,
          enjoyment: Number,
          fatigue: Number,
          weather: String,
          surface: String
        },
        adaptations: [{
          reason: String,
          changedFrom: mongoose.Schema.Types.Mixed,
          changedTo: mongoose.Schema.Types.Mixed,
          adaptedAt: Date,
          adaptedBy: {
            type: String,
            enum: ['user', 'ai', 'coach'],
            default: 'ai'
          }
        }]
      },
      friday: {
        date: Date,
        type: {
          type: String,
          enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross', 'strength'],
          default: 'rest'
        },
        plannedDuration: Number,
        actualDuration: Number,
        intensity: {
          type: String,
          enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
          default: 'recovery'
        },
        plannedDistance: Number,
        actualDistance: Number,
        description: String,
        notes: String,
        isFlexible: { type: Boolean, default: true },
        status: {
          type: String,
          enum: ['planned', 'completed', 'missed', 'moved', 'modified'],
          default: 'planned'
        },
        completedAt: Date,
        performance: {
          avgHeartRate: Number,
          maxHeartRate: Number,
          avgPace: Number,
          perceivedExertion: Number,
          enjoyment: Number,
          fatigue: Number,
          weather: String,
          surface: String
        },
        adaptations: [{
          reason: String,
          changedFrom: mongoose.Schema.Types.Mixed,
          changedTo: mongoose.Schema.Types.Mixed,
          adaptedAt: Date,
          adaptedBy: {
            type: String,
            enum: ['user', 'ai', 'coach'],
            default: 'ai'
          }
        }]
      },
      saturday: {
        date: Date,
        type: {
          type: String,
          enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross', 'strength'],
          default: 'intervals'
        },
        plannedDuration: Number,
        actualDuration: Number,
        intensity: {
          type: String,
          enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
          default: 'hard'
        },
        plannedDistance: Number,
        actualDistance: Number,
        description: String,
        notes: String,
        isFlexible: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ['planned', 'completed', 'missed', 'moved', 'modified'],
          default: 'planned'
        },
        completedAt: Date,
        performance: {
          avgHeartRate: Number,
          maxHeartRate: Number,
          avgPace: Number,
          perceivedExertion: Number,
          enjoyment: Number,
          fatigue: Number,
          weather: String,
          surface: String
        },
        adaptations: [{
          reason: String,
          changedFrom: mongoose.Schema.Types.Mixed,
          changedTo: mongoose.Schema.Types.Mixed,
          adaptedAt: Date,
          adaptedBy: {
            type: String,
            enum: ['user', 'ai', 'coach'],
            default: 'ai'
          }
        }]
      },
      sunday: {
        date: Date,
        type: {
          type: String,
          enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross', 'strength'],
          default: 'long'
        },
        plannedDuration: Number,
        actualDuration: Number,
        intensity: {
          type: String,
          enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
          default: 'easy'
        },
        plannedDistance: Number,
        actualDistance: Number,
        description: String,
        notes: String,
        isFlexible: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ['planned', 'completed', 'missed', 'moved', 'modified'],
          default: 'planned'
        },
        completedAt: Date,
        performance: {
          avgHeartRate: Number,
          maxHeartRate: Number,
          avgPace: Number,
          perceivedExertion: Number,
          enjoyment: Number,
          fatigue: Number,
          weather: String,
          surface: String
        },
        adaptations: [{
          reason: String,
          changedFrom: mongoose.Schema.Types.Mixed,
          changedTo: mongoose.Schema.Types.Mixed,
          adaptedAt: Date,
          adaptedBy: {
            type: String,
            enum: ['user', 'ai', 'coach'],
            default: 'ai'
          }
        }]
      }
    },
    // Week-level statistics
    weekStats: {
      plannedSessions: { type: Number, default: 0 },
      completedSessions: { type: Number, default: 0 },
      missedSessions: { type: Number, default: 0 },
      totalPlannedDistance: { type: Number, default: 0 },
      totalActualDistance: { type: Number, default: 0 },
      totalPlannedDuration: { type: Number, default: 0 },
      totalActualDuration: { type: Number, default: 0 },
      avgPerceivedExertion: Number,
      avgFatigue: Number,
      avgEnjoyment: Number,
      completionRate: { type: Number, default: 0 }
    }
  }],
  
  // Monthly Statistics
  monthStats: {
    totalPlannedSessions: { type: Number, default: 0 },
    totalCompletedSessions: { type: Number, default: 0 },
    totalMissedSessions: { type: Number, default: 0 },
    totalPlannedDistance: { type: Number, default: 0 },
    totalActualDistance: { type: Number, default: 0 },
    totalPlannedDuration: { type: Number, default: 0 },
    totalActualDuration: { type: Number, default: 0 },
    overallCompletionRate: { type: Number, default: 0 },
    avgWeeklyDistance: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    performanceTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining', 'unknown'],
      default: 'unknown'
    }
  },
  
  // Adaptation History
  adaptationLog: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['weekly_update', 'missed_session', 'performance_based', 'user_request', 'injury_prevention'],
      required: true
    },
    reason: String,
    changes: [{
      day: String,
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    adaptedBy: {
      type: String,
      enum: ['ai', 'user', 'coach'],
      default: 'ai'
    },
    impact: {
      type: String,
      enum: ['minor', 'moderate', 'major'],
      default: 'minor'
    }
  }],
  
  // Schedule Status
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  
  // AI Analysis
  aiAnalysis: {
    lastAnalyzed: Date,
    performanceInsights: [String],
    recommendations: [String],
    riskFactors: [String],
    confidenceScore: Number, // 0-1
    nextAdaptationDate: Date
  },
  
  // Next Week Preview (generated on Sunday)
  nextWeekPreview: {
    generated: { type: Boolean, default: false },
    generatedAt: Date,
    preview: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'monthly_schedules'
});

// Indexes
MonthlyScheduleSchema.index({ userId: 1, year: 1, month: 1 });
MonthlyScheduleSchema.index({ trainingPlanId: 1 });
MonthlyScheduleSchema.index({ status: 1 });
MonthlyScheduleSchema.index({ 'weeks.startDate': 1 });

// Instance Methods
MonthlyScheduleSchema.methods.updateWeekStats = function(weekIndex) {
  const week = this.weeks[weekIndex];
  if (!week) return;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let plannedSessions = 0;
  let completedSessions = 0;
  let missedSessions = 0;
  let totalPlannedDistance = 0;
  let totalActualDistance = 0;
  let totalPlannedDuration = 0;
  let totalActualDuration = 0;
  let exertionSum = 0;
  let fatigueSum = 0;
  let enjoymentSum = 0;
  let completedWithData = 0;
  
  days.forEach(day => {
    const session = week.schedule[day];
    if (session.type !== 'rest') {
      plannedSessions++;
      totalPlannedDistance += session.plannedDistance || 0;
      totalPlannedDuration += session.plannedDuration || 0;
      
      if (session.status === 'completed') {
        completedSessions++;
        totalActualDistance += session.actualDistance || 0;
        totalActualDuration += session.actualDuration || 0;
        
        if (session.performance) {
          if (session.performance.perceivedExertion) {
            exertionSum += session.performance.perceivedExertion;
            completedWithData++;
          }
          if (session.performance.fatigue) {
            fatigueSum += session.performance.fatigue;
          }
          if (session.performance.enjoyment) {
            enjoymentSum += session.performance.enjoyment;
          }
        }
      } else if (session.status === 'missed') {
        missedSessions++;
      }
    }
  });
  
  week.weekStats = {
    plannedSessions,
    completedSessions,
    missedSessions,
    totalPlannedDistance,
    totalActualDistance,
    totalPlannedDuration,
    totalActualDuration,
    avgPerceivedExertion: completedWithData > 0 ? exertionSum / completedWithData : 0,
    avgFatigue: completedWithData > 0 ? fatigueSum / completedWithData : 0,
    avgEnjoyment: completedWithData > 0 ? enjoymentSum / completedWithData : 0,
    completionRate: plannedSessions > 0 ? (completedSessions / plannedSessions) * 100 : 0
  };
};

MonthlyScheduleSchema.methods.updateMonthStats = function() {
  let totalPlanned = 0;
  let totalCompleted = 0;
  let totalMissed = 0;
  let totalPlannedDistance = 0;
  let totalActualDistance = 0;
  let totalPlannedDuration = 0;
  let totalActualDuration = 0;
  
  this.weeks.forEach(week => {
    if (week.weekStats) {
      totalPlanned += week.weekStats.plannedSessions;
      totalCompleted += week.weekStats.completedSessions;
      totalMissed += week.weekStats.missedSessions;
      totalPlannedDistance += week.weekStats.totalPlannedDistance;
      totalActualDistance += week.weekStats.totalActualDistance;
      totalPlannedDuration += week.weekStats.totalPlannedDuration;
      totalActualDuration += week.weekStats.totalActualDuration;
    }
  });
  
  this.monthStats = {
    totalPlannedSessions: totalPlanned,
    totalCompletedSessions: totalCompleted,
    totalMissedSessions: totalMissed,
    totalPlannedDistance,
    totalActualDistance,
    totalPlannedDuration,
    totalActualDuration,
    overallCompletionRate: totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0,
    avgWeeklyDistance: totalActualDistance / this.weeks.length,
    avgSessionDuration: totalCompleted > 0 ? totalActualDuration / totalCompleted : 0
  };
};

MonthlyScheduleSchema.methods.getNextSundayUpdate = function() {
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(9, 0, 0, 0); // 9 AM on Sunday
  return nextSunday;
};

MonthlyScheduleSchema.methods.adaptSession = function(day, weekIndex, adaptations, reason) {
  const week = this.weeks[weekIndex];
  if (!week || !week.schedule[day]) return false;
  
  const session = week.schedule[day];
  const oldSession = { ...session };
  
  // Apply adaptations
  Object.keys(adaptations).forEach(key => {
    session[key] = adaptations[key];
  });
  
  // Log the adaptation
  if (!session.adaptations) session.adaptations = [];
  session.adaptations.push({
    reason,
    changedFrom: oldSession,
    changedTo: { ...session },
    adaptedAt: new Date(),
    adaptedBy: 'ai'
  });
  
  // Update schedule status
  if (session.status === 'planned') {
    session.status = 'modified';
  }
  
  return true;
};

export const MonthlySchedule = mongoose.model('MonthlySchedule', MonthlyScheduleSchema);