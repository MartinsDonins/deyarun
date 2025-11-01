import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: [
      'distance', 'pace', 'duration', 'frequency', 
      'weight_loss', 'race_time', 'consistency', 
      'elevation', 'custom'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'race', 'milestone']
  },
  target: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: [
        'km', 'miles', 'minutes', 'hours', 'seconds',
        'kg', 'lbs', 'count', 'percentage', 'custom'
      ]
    }
  },
  current: {
    value: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 200 // Allow over-achievement
    },
    trend: {
      type: String,
      enum: ['improving', 'declining', 'stable', 'unknown'],
      default: 'unknown'
    },
    projectedCompletion: Date,
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  timeline: {
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    milestones: [{
      date: Date,
      description: String,
      achieved: {
        type: Boolean,
        default: false
      },
      achievedDate: Date
    }]
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'extreme'],
    default: 'moderate'
  },
  tracking: {
    method: {
      type: String,
      enum: ['automatic', 'manual', 'hybrid'],
      default: 'automatic'
    },
    dataSource: {
      type: String,
      enum: ['workouts', 'strava', 'manual_entry', 'multiple'],
      default: 'workouts'
    },
    frequency: {
      type: String,
      enum: ['realtime', 'daily', 'weekly', 'monthly'],
      default: 'daily'
    }
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badges: [String],
    customReward: String
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'weekly'
    },
    message: String,
    lastSent: Date
  },
  analytics: {
    averageProgressPerDay: Number,
    bestProgressDay: {
      date: Date,
      progress: Number
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100
    },
    effortScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  history: [{
    date: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: [
        'created', 'updated', 'progress_updated', 
        'milestone_achieved', 'paused', 'resumed',
        'completed', 'failed', 'target_adjusted'
      ]
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    note: String,
    automaticUpdate: {
      type: Boolean,
      default: false
    }
  }],
  metadata: {
    createdBy: String, // 'user', 'coach', 'ai_suggestion'
    aiGenerated: {
      type: Boolean,
      default: false
    },
    aiConfidence: Number,
    linkedWorkouts: [String], // Workout IDs
    relatedGoals: [String], // Other goal IDs
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1, status: 1 });
goalSchema.index({ userId: 1, type: 1, status: 1 });
goalSchema.index({ 'timeline.endDate': 1, status: 1 });
goalSchema.index({ priority: 1, status: 1 });

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed' || this.status === 'failed') return 0;
  
  const now = new Date();
  const endDate = new Date(this.timeline.endDate);
  const diffTime = endDate - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for progress per day needed
goalSchema.virtual('requiredProgressPerDay').get(function() {
  const remaining = this.target.value - this.current.value;
  const daysLeft = this.daysRemaining;
  
  if (daysLeft <= 0 || remaining <= 0) return 0;
  return remaining / daysLeft;
});

// Virtual for completion likelihood
goalSchema.virtual('completionLikelihood').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'failed' || this.status === 'cancelled') return 0;
  
  const progressPercentage = this.progress.percentage;
  const timeElapsed = (Date.now() - this.timeline.startDate) / 
                     (this.timeline.endDate - this.timeline.startDate);
  
  if (timeElapsed === 0) return 50; // No time elapsed yet
  
  const expectedProgress = timeElapsed * 100;
  const progressRatio = progressPercentage / expectedProgress;
  
  // Convert ratio to likelihood (0-100)
  return Math.min(100, Math.max(0, progressRatio * 100));
});

// Pre-save middleware to update progress percentage
goalSchema.pre('save', function(next) {
  if (this.isModified('current.value') || this.isModified('target.value')) {
    this.progress.percentage = Math.min(200, 
      (this.current.value / this.target.value) * 100
    );
    
    // Auto-complete if target is reached
    if (this.progress.percentage >= 100 && this.status === 'active') {
      this.status = 'completed';
      this.history.push({
        action: 'completed',
        note: 'Goal automatically completed when target was reached',
        automaticUpdate: true
      });
    }
    
    // Update current timestamp
    this.current.lastUpdated = new Date();
  }
  
  next();
});

// Static method to create goal from template
goalSchema.statics.createFromTemplate = function(userId, template, customizations = {}) {
  const goalData = {
    userId,
    ...template,
    ...customizations,
    timeline: {
      startDate: customizations.startDate || new Date(),
      endDate: customizations.endDate || 
               new Date(Date.now() + (template.defaultDurationDays || 30) * 24 * 60 * 60 * 1000),
      milestones: template.milestones || []
    },
    metadata: {
      createdBy: 'template',
      aiGenerated: template.aiGenerated || false,
      tags: template.tags || []
    }
  };
  
  return new this(goalData);
};

// Instance method to update progress
goalSchema.methods.updateProgress = function(newValue, source = 'manual') {
  const oldValue = this.current.value;
  this.current.value = newValue;
  
  // Add to history
  this.history.push({
    action: 'progress_updated',
    oldValue,
    newValue,
    note: `Progress updated from ${source}`,
    automaticUpdate: source !== 'manual'
  });
  
  // Calculate trend
  const recentUpdates = this.history
    .filter(h => h.action === 'progress_updated')
    .slice(-5);
    
  if (recentUpdates.length >= 2) {
    const recent = recentUpdates.slice(-2);
    const trend = recent[1].newValue > recent[0].newValue ? 'improving' : 
                  recent[1].newValue < recent[0].newValue ? 'declining' : 'stable';
    this.progress.trend = trend;
  }
  
  return this.save();
};

// Instance method to add milestone
goalSchema.methods.addMilestone = function(date, description) {
  this.timeline.milestones.push({
    date: new Date(date),
    description,
    achieved: false
  });
  
  // Sort milestones by date
  this.timeline.milestones.sort((a, b) => a.date - b.date);
  
  return this.save();
};

// Instance method to achieve milestone
goalSchema.methods.achieveMilestone = function(milestoneIndex) {
  if (this.timeline.milestones[milestoneIndex]) {
    this.timeline.milestones[milestoneIndex].achieved = true;
    this.timeline.milestones[milestoneIndex].achievedDate = new Date();
    
    this.history.push({
      action: 'milestone_achieved',
      note: `Milestone achieved: ${this.timeline.milestones[milestoneIndex].description}`,
      automaticUpdate: false
    });
  }
  
  return this.save();
};

export const Goal = mongoose.model('Goal', goalSchema);