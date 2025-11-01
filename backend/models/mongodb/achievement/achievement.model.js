import mongoose from 'mongoose';

// Achievement Definition Schema - Templates for all possible achievements
const achievementDefinitionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['distance', 'frequency', 'performance', 'social', 'streak', 'milestone'],
    required: true
  },
  icon: {
    type: String,
    enum: ['trophy', 'star', 'fire', 'check'],
    default: 'trophy'
  },
  criteria: {
    // Dynamic criteria based on category
    type: {
      // Distance achievements
      totalDistance: { type: Number }, // in meters
      singleWorkoutDistance: { type: Number },
      
      // Frequency achievements
      workoutsPerWeek: { type: Number },
      totalWorkouts: { type: Number },
      
      // Performance achievements  
      avgPaceImprovement: { type: Number }, // percentage improvement
      personalBest: { type: String }, // '5k', '10k', etc.
      
      // Streak achievements
      consecutiveDays: { type: Number },
      
      // Social achievements
      challengesCompleted: { type: Number },
      goalsShared: { type: Number }
    },
    required: true
  },
  points: {
    type: Number,
    default: 100
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// User Achievement Progress Schema - Individual user progress on achievements
const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  achievementId: {
    type: String,
    required: true,
    ref: 'AchievementDefinition'
  },
  unlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    unit: {
      type: String, // 'km', 'workouts', 'days', '%'
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  metadata: {
    // Store additional context
    triggerWorkoutId: { type: mongoose.Schema.Types.ObjectId },
    notificationSent: { type: Boolean, default: false },
    celebrationViewed: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, unlocked: 1 });
userAchievementSchema.index({ userId: 1, 'progress.current': 1 });

// Middleware to update timestamps
userAchievementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('unlocked') && this.unlocked && !this.unlockedAt) {
    this.unlockedAt = Date.now();
  }
  next();
});

// Static method to get user progress summary
userAchievementSchema.statics.getUserSummary = async function(userId) {
  const achievements = await this.find({ userId });
  
  return {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    inProgress: achievements.filter(a => !a.unlocked && a.progress.current > 0).length,
    totalPoints: achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + (a.points || 100), 0)
  };
};

// Instance method to calculate progress percentage
userAchievementSchema.methods.getProgressPercentage = function() {
  if (!this.progress || this.progress.target === 0) return 0;
  return Math.min((this.progress.current / this.progress.target) * 100, 100);
};

const AchievementDefinition = mongoose.model('AchievementDefinition', achievementDefinitionSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

export { AchievementDefinition, UserAchievement };