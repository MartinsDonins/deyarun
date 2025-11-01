import mongoose from 'mongoose';

const aiConfigSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
    default: 'gpt-4'
  },
  temperature: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.7
  },
  maxTokens: {
    type: Number,
    required: true,
    min: 500,
    max: 4000,
    default: 2000
  },
  systemPrompt: {
    type: String,
    required: true,
    default: `Tu esi profesionāls skrējiena treneris ar 10+ gadu pieredzi. Izveido personalizētu treniņprogrammu, ņemot vērā:
- Lietotāja fizisko sagatavotību un mērķus
- Pieejamo laiku un aprīkojumu
- Iepriekšējo pieredzi un traumu vēsturi
- Progresīvu slodzes palielināšanu
- Atpūtas dienu nozīmi
- Motivāciju un interesi

Programmai jābūt reālistiskai, drošai un motivējošai.`
  },
  exerciseWeights: {
    difficulty: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.3
    },
    muscleGroups: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.25
    },
    equipment: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.2
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.25
    }
  },
  progressionRules: {
    weekly: {
      type: Number,
      required: true,
      min: 0,
      max: 0.5,
      default: 0.1
    },
    biweekly: {
      type: Number,
      required: true,
      min: 0,
      max: 0.5,
      default: 0.15
    },
    monthly: {
      type: Number,
      required: true,
      min: 0,
      max: 0.5,
      default: 0.2
    }
  },
  restDayRules: {
    beginnerMinRest: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 2
    },
    intermediateMinRest: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 1
    },
    advancedMinRest: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 1
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true
    },
    name: {
      type: String
    }
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for finding active config
aiConfigSchema.index({ isActive: 1 });

// Validate that exercise weights sum to approximately 1
aiConfigSchema.pre('save', function(next) {
  const weights = this.exerciseWeights;
  const sum = weights.difficulty + weights.muscleGroups + weights.equipment + weights.duration;
  
  if (Math.abs(sum - 1) > 0.01) {
    next(new Error('Exercise weights must sum to 1.0'));
  } else {
    next();
  }
});

export default mongoose.model('AIConfig', aiConfigSchema);