import mongoose from 'mongoose';

const TrainingPlanSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Plan Metadata
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Plan Configuration
  targetRace: {
    distance: {
      type: String,
      enum: ['5k', '10k', 'half_marathon', 'marathon', 'ultra_50k', 'custom'],
      required: true
    },
    customDistance: Number, // in meters if custom
    date: {
      type: Date,
      required: true
    },
    name: String,
    timeGoal: Number // in seconds
  },
  
  // User Profile at Plan Creation
  userProfile: {
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'elite'],
      required: true
    },
    currentWeeklyMileage: Number, // km per week
    longestRecentRun: Number, // km
    preferredTrainingDays: [String], // ['monday', 'wednesday', 'friday', 'sunday']
    injuryHistory: [String],
    age: Number,
    restingHeartRate: Number,
    maxHeartRate: Number
  },
  
  // Plan Structure
  duration: {
    type: Number, // weeks
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
  
  // Training Phases
  phases: [{
    name: String, // 'Base Building', 'Speed Development', 'Peak', 'Taper'
    startWeek: Number,
    endWeek: Number,
    focus: String,
    weeklyMileageTarget: Number
  }],
  
  // Plan Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'abandoned'],
    default: 'draft'
  },
  
  // Adaptation Settings
  adaptationEnabled: {
    type: Boolean,
    default: true
  },
  lastAdaptationDate: Date,
  adaptationHistory: [{
    date: Date,
    reason: String,
    changes: mongoose.Schema.Types.Mixed
  }],
  
  // Statistics
  stats: {
    completedWorkouts: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'training_plans'
});

// Indexes
TrainingPlanSchema.index({ userId: 1, status: 1 });
TrainingPlanSchema.index({ 'targetRace.date': 1 });

export const TrainingPlan = mongoose.model('TrainingPlan', TrainingPlanSchema);
