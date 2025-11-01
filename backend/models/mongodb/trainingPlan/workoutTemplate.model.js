import mongoose from 'mongoose';

const WorkoutTemplateSchema = new mongoose.Schema({
  // Template Info
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  category: {
    type: String,
    enum: ['speed', 'endurance', 'recovery', 'strength', 'race_specific'],
    required: true
  },
  
  type: {
    type: String,
    enum: ['easy', 'tempo', 'intervals', 'long', 'recovery', 'race_pace', 'hill_repeats', 'fartlek', 'progression', 'time_trial'],
    required: true
  },
  
  // Applicability
  suitableFor: {
    fitnessLevels: [String], // ['beginner', 'intermediate', 'advanced']
    raceDistances: [String], // ['5k', '10k', 'half_marathon', 'marathon']
    trainingPhases: [String] // ['base', 'build', 'peak', 'taper']
  },
  
  // Workout Structure Template
  structure: {
    warmup: {
      duration: Number, // minutes
      description: String
    },
    
    mainSet: {
      // For continuous runs
      distancePercentage: Number, // % of weekly mileage
      durationRange: {
        min: Number,
        max: Number
      },
      paceGuidance: String, // e.g., "Marathon pace + 30-45 sec/km"
      
      // For intervals
      intervalStructure: [{
        type: String,
        distanceOptions: [Number], // e.g., [400, 800, 1000]
        repetitionRange: {
          min: Number,
          max: Number
        },
        paceGuidance: String,
        restRatio: Number // e.g., 0.5 means rest = 50% of work duration
      }]
    },
    
    cooldown: {
      duration: Number,
      description: String
    }
  },
  
  // Coaching Content
  purpose: String,
  keyPoints: [String],
  commonMistakes: [String],
  progressionGuidance: String,
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: String,
  tags: [String]
  
}, {
  timestamps: true,
  collection: 'workout_templates'
});

// Indexes
WorkoutTemplateSchema.index({ type: 1, category: 1 });
WorkoutTemplateSchema.index({ 'suitableFor.fitnessLevels': 1 });
WorkoutTemplateSchema.index({ 'suitableFor.raceDistances': 1 });

export const WorkoutTemplate = mongoose.model('WorkoutTemplate', WorkoutTemplateSchema);