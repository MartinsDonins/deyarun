// MongoDB User Course Progress Model - Track User Learning Progress
import mongoose from 'mongoose';

// Lesson progress schema
const lessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Progress status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  
  // Time tracking
  timeSpent: {
    type: Number, // Time in seconds
    default: 0
  },
  startedAt: Date,
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  // Quiz/Assessment results
  quizAttempts: [{
    attemptNumber: Number,
    score: Number,
    maxScore: Number,
    percentage: Number,
    passed: Boolean,
    answers: [{
      questionIndex: Number,
      selectedAnswer: Number,
      correct: Boolean
    }],
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Best quiz performance
  bestQuizScore: {
    type: Number,
    default: 0
  },
  bestQuizPercentage: {
    type: Number,
    default: 0
  },
  
  // Lesson notes and bookmarks
  notes: String,
  bookmarks: [{
    timestamp: Number, // For video content
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Lesson rating and feedback
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String
}, {
  timestamps: true
});

// Main User Progress schema
const userProgressSchema = new mongoose.Schema({
  // User and course references
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  
  // Overall course progress
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped', 'unenrolled'],
    default: 'enrolled',
    index: true
  },
  
  // Progress metrics
  completedLessons: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    required: true
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Time tracking
  totalTimeSpent: {
    type: Number, // Total time in seconds
    default: 0
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  startedAt: Date,
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Lesson-specific progress
  lessonProgress: [lessonProgressSchema],
  
  // Current lesson tracking
  currentLessonId: mongoose.Schema.Types.ObjectId,
  currentLessonIndex: {
    type: Number,
    default: 0
  },
  
  // Course performance
  overallScore: {
    type: Number,
    default: 0
  },
  averageQuizScore: {
    type: Number,
    default: 0
  },
  totalQuizAttempts: {
    type: Number,
    default: 0
  },
  
  // Course rating and feedback
  courseRating: {
    type: Number,
    min: 1,
    max: 5
  },
  courseFeedback: String,
  ratedAt: Date,
  
  // Unenrollment tracking
  unenrolledAt: Date,
  unenrollmentReason: String,
  
  // Custom lesson/exercise plans
  customPlans: [{
    planType: {
      type: String,
      enum: ['progressive', 'maintenance', 'intensive'],
      default: 'progressive'
    },
    duration: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    focus: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    exercises: [{
      name: String,
      duration: Number, // minutes
      type: {
        type: String,
        enum: ['warmup', 'technique', 'cardio', 'strength', 'cooldown']
      },
      description: String
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Achievements and certificates
  pointsEarned: {
    type: Number,
    default: 0
  },
  badgesEarned: [{
    badgeId: String,
    badgeName: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: Date,
  certificateId: String,
  
  // Learning preferences and settings
  preferredPace: {
    type: String,
    enum: ['slow', 'normal', 'fast'],
    default: 'normal'
  },
  reminderSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly'],
      default: 'weekly'
    },
    timeOfDay: {
      type: String,
      default: '18:00'
    }
  },
  
  // Streaks and motivation
  learningStreak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastStudyDate: Date
  },
  
  // Study goals
  weeklyGoal: {
    lessonsPerWeek: {
      type: Number,
      default: 3
    },
    minutesPerWeek: {
      type: Number,
      default: 120
    }
  },
  
  // Progress milestones
  milestones: [{
    type: {
      type: String,
      enum: ['quarter_complete', 'half_complete', 'three_quarter_complete', 'completed']
    },
    achievedAt: {
      type: Date,
      default: Date.now
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Device and platform tracking
  lastDevice: String,
  lastPlatform: String,
  
  // Course access history
  accessHistory: [{
    accessedAt: {
      type: Date,
      default: Date.now
    },
    device: String,
    platform: String,
    lessonId: mongoose.Schema.Types.ObjectId,
    duration: Number // seconds spent in this session
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, status: 1 });
userProgressSchema.index({ courseId: 1, status: 1 });
userProgressSchema.index({ completionPercentage: 1 });
userProgressSchema.index({ lastAccessedAt: -1 });

// Virtual for progress summary
userProgressSchema.virtual('progressSummary').get(function() {
  return {
    status: this.status,
    completionPercentage: this.completionPercentage,
    completedLessons: this.completedLessons,
    totalLessons: this.totalLessons,
    timeSpent: this.totalTimeSpent,
    lastAccessed: this.lastAccessedAt
  };
});

// Virtual for current lesson progress
userProgressSchema.virtual('currentLesson').get(function() {
  if (!this.currentLessonId) return null;
  
  return this.lessonProgress.find(lp => 
    lp.lessonId.toString() === this.currentLessonId.toString()
  );
});

// Pre-save middleware to update calculated fields
userProgressSchema.pre('save', function(next) {
  // Update completion percentage
  if (this.totalLessons > 0) {
    this.completionPercentage = Math.round((this.completedLessons / this.totalLessons) * 100);
  }
  
  // Update status based on completion
  if (this.completionPercentage === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.completionPercentage > 0 && this.status === 'enrolled') {
    this.status = 'in_progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  }
  
  // Update total time spent
  this.totalTimeSpent = this.lessonProgress.reduce((total, lesson) => 
    total + (lesson.timeSpent || 0), 0
  );
  
  // Update average quiz score
  const quizAttempts = this.lessonProgress.reduce((total, lesson) => 
    total + lesson.quizAttempts.length, 0
  );
  
  if (quizAttempts > 0) {
    const totalScore = this.lessonProgress.reduce((total, lesson) => 
      total + lesson.quizAttempts.reduce((lessonTotal, attempt) => 
        lessonTotal + attempt.percentage, 0
      ), 0
    );
    this.averageQuizScore = Math.round(totalScore / quizAttempts);
    this.totalQuizAttempts = quizAttempts;
  }
  
  // Update learning streak
  this.updateLearningStreak();
  
  next();
});

// Instance methods
userProgressSchema.methods.updateLearningStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastStudy = this.learningStreak.lastStudyDate;
  if (!lastStudy) {
    this.learningStreak.current = 1;
    this.learningStreak.lastStudyDate = today;
    return;
  }
  
  const lastStudyDate = new Date(lastStudy);
  lastStudyDate.setHours(0, 0, 0, 0);
  
  const diffTime = today - lastStudyDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays === 1) {
    // Consecutive day
    this.learningStreak.current++;
    if (this.learningStreak.current > this.learningStreak.longest) {
      this.learningStreak.longest = this.learningStreak.current;
    }
  } else if (diffDays > 1) {
    // Streak broken
    this.learningStreak.current = 1;
  }
  // If diffDays === 0, same day, no change needed
  
  this.learningStreak.lastStudyDate = today;
};

userProgressSchema.methods.completeLesson = function(lessonId, timeSpent = 0) {
  let lessonProgress = this.lessonProgress.find(lp => 
    lp.lessonId.toString() === lessonId.toString()
  );
  
  if (!lessonProgress) {
    lessonProgress = {
      lessonId,
      status: 'completed',
      timeSpent,
      startedAt: new Date(),
      completedAt: new Date(),
      lastAccessedAt: new Date()
    };
    this.lessonProgress.push(lessonProgress);
  } else {
    lessonProgress.status = 'completed';
    lessonProgress.completedAt = new Date();
    lessonProgress.timeSpent += timeSpent;
    lessonProgress.lastAccessedAt = new Date();
  }
  
  // Update completed lessons count
  this.completedLessons = this.lessonProgress.filter(lp => 
    lp.status === 'completed'
  ).length;
  
  // Update last accessed
  this.lastAccessedAt = new Date();
  
  return lessonProgress;
};

userProgressSchema.methods.recordQuizAttempt = function(lessonId, quizResult) {
  let lessonProgress = this.lessonProgress.find(lp => 
    lp.lessonId.toString() === lessonId.toString()
  );
  
  if (!lessonProgress) {
    lessonProgress = {
      lessonId,
      status: 'in_progress',
      quizAttempts: [],
      timeSpent: 0
    };
    this.lessonProgress.push(lessonProgress);
  }
  
  // Add quiz attempt
  const attempt = {
    attemptNumber: lessonProgress.quizAttempts.length + 1,
    score: quizResult.score,
    maxScore: quizResult.maxScore,
    percentage: Math.round((quizResult.score / quizResult.maxScore) * 100),
    passed: quizResult.passed,
    answers: quizResult.answers,
    completedAt: new Date()
  };
  
  lessonProgress.quizAttempts.push(attempt);
  
  // Update best scores
  if (attempt.percentage > lessonProgress.bestQuizPercentage) {
    lessonProgress.bestQuizPercentage = attempt.percentage;
    lessonProgress.bestQuizScore = attempt.score;
  }
  
  return attempt;
};

// Static methods
userProgressSchema.statics.findUserProgress = function(userId, courseId) {
  return this.findOne({ userId, courseId });
};

userProgressSchema.statics.getUserCourses = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('courseId', 'title description thumbnailUrl category difficulty')
    .sort({ lastAccessedAt: -1 });
};

userProgressSchema.statics.getCourseStats = function(courseId) {
  return this.aggregate([
    { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompletion: { $avg: '$completionPercentage' },
        avgTimeSpent: { $avg: '$totalTimeSpent' }
      }
    }
  ]);
};

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

export default UserProgress;