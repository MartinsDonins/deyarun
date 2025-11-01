import mongoose from 'mongoose';

const TrainingProgramTemplateSchema = new mongoose.Schema({
  // Template Info
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Target Configuration
  targetDistance: {
    type: String,
    enum: ['5K', '10K', 'half-marathon', 'marathon', 'other'],
    required: true
  },
  
  customDistance: {
    type: Number, // meters, for 'other' option
    default: null
  },
  
  // Program Structure
  duration: {
    type: Number, // weeks
    required: true,
    min: 1,
    max: 52
  },
  
  sessionsPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  
  // Training Phases
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
    description: String,
    weeklyMileageIncrease: Number, // percentage
    keyWorkoutTypes: [String]
  }],
  
  // Prerequisites and Recommendations
  prerequisites: {
    minimumWeeklyMileage: Number, // km
    minimumLongRun: Number, // km
    monthsOfConsistentRunning: Number,
    injuryFreeMonths: Number
  },
  
  // Program Goals and Outcomes
  goals: {
    primaryGoal: String,
    secondaryGoals: [String],
    expectedImprovements: [String]
  },
  
  // Coaching Content
  overview: String,
  keyPrinciples: [String],
  weekStructureExample: String,
  nutritionGuidance: String,
  recoveryGuidance: String,
  injuryPreventionTips: [String],
  
  // Workout Distribution
  workoutDistribution: {
    easyRuns: Number, // percentage
    tempoRuns: Number,
    intervals: Number,
    longRuns: Number,
    rest: Number
  },
  
  // Adaptation Rules
  adaptationRules: {
    missedWorkoutHandling: String,
    illnessProtocol: String,
    plateauBreaking: String,
    overtrainingSignals: [String]
  },
  
  // Usage Statistics
  stats: {
    timesUsed: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  
  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: String, // User ID who created this template
    required: true
  },
  
  lastUpdatedBy: String,
  
  version: {
    type: Number,
    default: 1
  },
  
  tags: [String], // for categorization and search
  
  // SEO and Discovery
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
  
}, {
  timestamps: true,
  collection: 'training_program_templates'
});

// Indexes
TrainingProgramTemplateSchema.index({ targetDistance: 1, difficultyLevel: 1 });
TrainingProgramTemplateSchema.index({ isActive: 1, isPublic: 1 });
TrainingProgramTemplateSchema.index({ tags: 1 });
TrainingProgramTemplateSchema.index({ createdBy: 1 });
TrainingProgramTemplateSchema.index({ slug: 1 });

// Pre-save middleware to generate slug
TrainingProgramTemplateSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Virtual for formatted duration
TrainingProgramTemplateSchema.virtual('formattedDuration').get(function() {
  return `${this.duration} ${this.duration === 1 ? 'week' : 'weeks'}`;
});

// Method to validate phase consistency
TrainingProgramTemplateSchema.methods.validatePhases = function() {
  const totalPhaseWeeks = this.phases.reduce((sum, phase) => sum + phase.weeks, 0);
  return totalPhaseWeeks === this.duration;
};

export const TrainingProgramTemplate = mongoose.model('TrainingProgramTemplate', TrainingProgramTemplateSchema);