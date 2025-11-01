import mongoose from 'mongoose';

// Training Program Skeleton - Template structure for generating personalized training plans
const TrainingProgramSkeletonSchema = new mongoose.Schema({
  // Template Metadata
  templateId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Target Configuration
  targetDistance: {
    type: String,
    enum: ['5K', '10K', 'half-marathon', 'marathon', 'other'],
    required: true
  },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  
  // Program Structure
  duration: {
    type: Number, // total weeks
    required: true
  },
  sessionsPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  
  // Training Phases Structure
  phases: [{
    name: {
      type: String,
      required: true
    },
    weeks: {
      type: Number,
      required: true,
      min: 1
    },
    focus: {
      type: String,
      required: true
    },
    // Weekly template for this phase
    weeklyTemplate: {
      // Distribution of training types per week
      easyRuns: { type: Number, default: 2 },
      tempoRuns: { type: Number, default: 1 },
      intervalRuns: { type: Number, default: 1 },
      longRuns: { type: Number, default: 1 },
      restDays: { type: Number, default: 2 },
      crossTraining: { type: Number, default: 0 }
    },
    // Intensity distribution (percentage)
    intensityDistribution: {
      easy: { type: Number, default: 70 }, // Zone 1-2
      moderate: { type: Number, default: 20 }, // Zone 3-4
      hard: { type: Number, default: 10 } // Zone 5
    }
  }],
  
  // Weekly Schedule Skeleton (for monthly generation)
  weeklyScheduleSkeleton: {
    monday: {
      type: {
        type: String,
        enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross'],
        default: 'rest'
      },
      duration: Number, // minutes
      intensity: {
        type: String,
        enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
        default: 'easy'
      },
      isFlexible: { type: Boolean, default: true } // Can be moved to other days
    },
    tuesday: {
      type: {
        type: String,
        enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross'],
        default: 'easy'
      },
      duration: Number,
      intensity: {
        type: String,
        enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
        default: 'easy'
      },
      isFlexible: { type: Boolean, default: true }
    },
    wednesday: {
      type: {
        type: String,
        enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross'],
        default: 'tempo'
      },
      duration: Number,
      intensity: {
        type: String,
        enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
        default: 'moderate'
      },
      isFlexible: { type: Boolean, default: false }
    },
    thursday: {
      type: {
        type: String,
        enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross'],
        default: 'easy'
      },
      duration: Number,
      intensity: {
        type: String,
        enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
        default: 'easy'
      },
      isFlexible: { type: Boolean, default: true }
    },
    friday: {
      type: {
        type: String,
        enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross'],
        default: 'rest'
      },
      duration: Number,
      intensity: {
        type: String,
        enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
        default: 'easy'
      },
      isFlexible: { type: Boolean, default: true }
    },
    saturday: {
      type: {
        type: String,
        enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross'],
        default: 'intervals'
      },
      duration: Number,
      intensity: {
        type: String,
        enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
        default: 'hard'
      },
      isFlexible: { type: Boolean, default: false }
    },
    sunday: {
      type: {
        type: String,
        enum: ['rest', 'easy', 'tempo', 'intervals', 'long', 'cross'],
        default: 'long'
      },
      duration: Number,
      intensity: {
        type: String,
        enum: ['recovery', 'easy', 'moderate', 'hard', 'very_hard'],
        default: 'easy'
      },
      isFlexible: { type: Boolean, default: false }
    }
  },
  
  // Adaptation Rules for AI
  adaptationRules: {
    // Performance-based adaptations
    performanceAdaptation: {
      enabled: { type: Boolean, default: true },
      // If user performs significantly better/worse
      thresholds: {
        significantImprovement: { type: Number, default: 0.15 }, // 15% better
        significantDecline: { type: Number, default: 0.1 } // 10% worse
      },
      adjustments: {
        improvement: {
          increaseIntensity: { type: Number, default: 0.05 }, // 5% increase
          decreaseVolume: { type: Number, default: 0.03 } // 3% decrease
        },
        decline: {
          decreaseIntensity: { type: Number, default: 0.1 }, // 10% decrease
          increaseRecovery: { type: Number, default: 0.2 } // 20% more recovery
        }
      }
    },
    
    // Recovery-based adaptations
    recoveryAdaptation: {
      enabled: { type: Boolean, default: true },
      // Based on user fatigue ratings
      fatigueThresholds: {
        high: { type: Number, default: 8 }, // 1-10 scale
        moderate: { type: Number, default: 6 },
        low: { type: Number, default: 4 }
      },
      adjustments: {
        highFatigue: {
          addRestDay: { type: Boolean, default: true },
          reduceIntensity: { type: Number, default: 0.2 }, // 20% reduction
          convertToEasy: { type: [String], default: ['tempo', 'intervals'] } // Convert these to easy runs
        },
        moderateFatigue: {
          reduceIntensity: { type: Number, default: 0.1 }, // 10% reduction
          convertToEasy: { type: [String], default: ['intervals'] } // Convert only intervals
        }
      }
    },
    
    // Schedule conflict adaptations
    scheduleAdaptation: {
      enabled: { type: Boolean, default: true },
      // How to handle missed sessions
      missedSessionRules: {
        criticalSessions: { type: [String], default: ['long', 'intervals'] }, // Never skip these types
        flexibleSessions: { type: [String], default: ['easy', 'cross'] }, // Can be moved or skipped
        makeupWindow: { type: Number, default: 2 }, // days to make up missed sessions
        maxConsecutiveRest: { type: Number, default: 3 } // max rest days before forced easy run
      }
    }
  },
  
  // Progression Rules
  progressionRules: {
    // Weekly volume progression
    volumeProgression: {
      increasePerWeek: { type: Number, default: 0.1 }, // 10% per week
      cutbackWeeks: { type: [Number], default: [4, 8, 12] }, // Reduce volume these weeks
      cutbackPercentage: { type: Number, default: 0.25 }, // 25% reduction
      maxWeeklyIncrease: { type: Number, default: 0.15 } // 15% max increase
    },
    
    // Long run progression
    longRunProgression: {
      increasePerWeek: { type: Number, default: 0.15 }, // 15% per week
      maxPercentageOfWeekly: { type: Number, default: 0.3 }, // 30% of weekly volume
      cutbackWeeks: { type: [Number], default: [4, 8, 12] }
    },
    
    // Intensity progression
    intensityProgression: {
      phases: {
        base: { 
          easy: { type: Number, default: 80 }, 
          moderate: { type: Number, default: 15 }, 
          hard: { type: Number, default: 5 }
        },
        build: { 
          easy: { type: Number, default: 70 }, 
          moderate: { type: Number, default: 20 }, 
          hard: { type: Number, default: 10 }
        },
        peak: { 
          easy: { type: Number, default: 60 }, 
          moderate: { type: Number, default: 25 }, 
          hard: { type: Number, default: 15 }
        },
        taper: { 
          easy: { type: Number, default: 75 }, 
          moderate: { type: Number, default: 20 }, 
          hard: { type: Number, default: 5 }
        }
      }
    }
  },
  
  // AI Integration Settings
  aiSettings: {
    enabled: { type: Boolean, default: true },
    model: {
      type: String,
      default: 'gpt-4'
    },
    updateFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly'],
      default: 'weekly'
    },
    updateDay: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      default: 'sunday'
    },
    contextWindow: {
      type: Number,
      default: 14 // days of data to consider
    }
  },
  
  // Template Status
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  
  // Usage Statistics
  stats: {
    timesUsed: { type: Number, default: 0 },
    averageCompletion: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'training_program_skeletons'
});

// Indexes
TrainingProgramSkeletonSchema.index({ templateId: 1 });
TrainingProgramSkeletonSchema.index({ targetDistance: 1, difficultyLevel: 1 });
TrainingProgramSkeletonSchema.index({ isActive: 1 });

// Methods
TrainingProgramSkeletonSchema.methods.generateMonthlySchedule = function(startDate, userProfile) {
  // This method will generate a monthly schedule based on the skeleton
  const monthSchedule = [];
  const currentDate = new Date(startDate);
  
  // Calculate which phase we're in based on start date
  let currentPhase = this.phases[0];
  let phaseWeek = 1;
  
  // Generate 4 weeks of schedule
  for (let week = 0; week < 4; week++) {
    const weekSchedule = {};
    
    // For each day of the week
    Object.keys(this.weeklyScheduleSkeleton).forEach(day => {
      const dayTemplate = this.weeklyScheduleSkeleton[day];
      const scheduledDate = new Date(currentDate);
      scheduledDate.setDate(currentDate.getDate() + (week * 7) + this.getDayIndex(day));
      
      weekSchedule[day] = {
        date: scheduledDate,
        type: dayTemplate.type,
        duration: this.calculateDuration(dayTemplate, userProfile, phaseWeek),
        intensity: dayTemplate.intensity,
        isFlexible: dayTemplate.isFlexible,
        phase: currentPhase.name,
        completed: false,
        adaptable: true
      };
    });
    
    monthSchedule.push(weekSchedule);
    phaseWeek++;
    
    // Check if we need to move to next phase
    if (phaseWeek > currentPhase.weeks) {
      const currentPhaseIndex = this.phases.indexOf(currentPhase);
      if (currentPhaseIndex < this.phases.length - 1) {
        currentPhase = this.phases[currentPhaseIndex + 1];
        phaseWeek = 1;
      }
    }
  }
  
  return monthSchedule;
};

TrainingProgramSkeletonSchema.methods.getDayIndex = function(dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.indexOf(dayName);
};

TrainingProgramSkeletonSchema.methods.calculateDuration = function(dayTemplate, userProfile, phaseWeek) {
  // Base duration from template
  let duration = dayTemplate.duration || 30;
  
  // Adjust based on user's fitness level
  if (userProfile.fitnessLevel === 'beginner') {
    duration *= 0.8;
  } else if (userProfile.fitnessLevel === 'advanced') {
    duration *= 1.2;
  }
  
  // Adjust based on week progression
  const progressionMultiplier = 1 + (phaseWeek - 1) * 0.05; // 5% increase per week
  duration *= progressionMultiplier;
  
  return Math.round(duration);
};

TrainingProgramSkeletonSchema.methods.adaptForMissedSession = function(missedDay, currentWeek) {
  const rules = this.adaptationRules.scheduleAdaptation;
  if (!rules.enabled) return null;
  
  const missedSession = currentWeek[missedDay];
  if (!missedSession) return null;
  
  // If it's a critical session, try to reschedule
  if (rules.missedSessionRules.criticalSessions.includes(missedSession.type)) {
    // Find next available flexible day
    for (let i = 1; i <= rules.missedSessionRules.makeupWindow; i++) {
      const nextDay = this.getNextDay(missedDay, i);
      const nextSession = currentWeek[nextDay];
      
      if (nextSession && nextSession.isFlexible && nextSession.type === 'rest') {
        // Move the session
        return {
          action: 'reschedule',
          from: missedDay,
          to: nextDay,
          session: missedSession
        };
      }
    }
  }
  
  // If flexible session or can't reschedule, mark as optional
  return {
    action: 'skip',
    day: missedDay,
    impact: 'minimal'
  };
};

TrainingProgramSkeletonSchema.methods.getNextDay = function(currentDay, daysAhead) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentIndex = days.indexOf(currentDay);
  const nextIndex = (currentIndex + daysAhead) % 7;
  return days[nextIndex];
};

export const TrainingProgramSkeleton = mongoose.model('TrainingProgramSkeleton', TrainingProgramSkeletonSchema);