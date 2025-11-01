import mongoose from 'mongoose';

const PlannedWorkoutSchema = new mongoose.Schema({
  // References
  trainingPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingPlan',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Schedule
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  week: Number,
  dayOfWeek: String,
  
  // Workout Details
  type: {
    type: String,
    enum: ['easy', 'tempo', 'intervals', 'long', 'recovery', 'race_pace', 'hill_repeats', 'fartlek', 'progression', 'time_trial'],
    required: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  description: String,
  
  // Workout Structure
  mainSet: {
    // For continuous runs
    distance: Number, // meters
    duration: Number, // seconds
    pace: {
      min: Number, // seconds per km
      max: Number
    },
    
    // For interval workouts
    intervals: [{
      type: String, // 'warmup', 'work', 'rest', 'cooldown'
      distance: Number,
      duration: Number,
      pace: {
        min: Number,
        max: Number
      },
      repetitions: Number,
      restDuration: Number,
      restType: String // 'standing', 'walking', 'jogging'
    }]
  },
  
  // Target Metrics
  targetMetrics: {
    totalDistance: Number, // meters
    totalDuration: Number, // seconds
    averagePace: Number, // seconds per km
    heartRateZone: {
      min: Number,
      max: Number
    },
    calories: Number
  },
  
  // Instructions
  warmupInstructions: String,
  cooldownInstructions: String,
  coachingTips: [String],

  // Exercise Videos (warmup, cooldown, strengthening)
  exercises: {
    warmup: [{
      exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      name: String,
      description: String,
      videoUrl: String,
      duration: {
        min: Number,
        max: Number
      },
      repetitions: {
        min: Number,
        max: Number
      },
      sets: {
        min: Number,
        max: Number
      }
    }],
    cooldown: [{
      exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      name: String,
      description: String,
      videoUrl: String,
      duration: {
        min: Number,
        max: Number
      },
      repetitions: {
        min: Number,
        max: Number
      },
      sets: {
        min: Number,
        max: Number
      }
    }],
    strengthening: [{
      exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      name: String,
      description: String,
      videoUrl: String,
      duration: {
        min: Number,
        max: Number
      },
      repetitions: {
        min: Number,
        max: Number
      },
      sets: {
        min: Number,
        max: Number
      },
      targetMuscles: [String]
    }]
  },

  // Completion Status
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'skipped', 'partial', 'rescheduled'],
    default: 'scheduled'
  },
  
  // Linked Completed Workout
  completedWorkoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout'
  },
  
  // Completion Metrics (for comparison)
  completionMetrics: {
    actualDistance: Number,
    actualDuration: Number,
    actualPace: Number,
    completionDate: Date,
    effortLevel: Number,
    notes: String
  },
  
  // Adaptation
  isAdapted: {
    type: Boolean,
    default: false
  },
  originalWorkout: mongoose.Schema.Types.Mixed // Store original if adapted
  
}, {
  timestamps: true,
  collection: 'planned_workouts'
});

// Indexes
PlannedWorkoutSchema.index({ userId: 1, scheduledDate: 1 });
PlannedWorkoutSchema.index({ trainingPlanId: 1, week: 1 });
PlannedWorkoutSchema.index({ status: 1, scheduledDate: 1 });

export const PlannedWorkout = mongoose.model('PlannedWorkout', PlannedWorkoutSchema);