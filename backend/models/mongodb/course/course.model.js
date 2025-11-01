// MongoDB Course Model - Educational Content Management
import mongoose from 'mongoose';

// Lesson schema for embedded lessons within courses
const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  
  // Lesson type and format
  type: {
    type: String,
    enum: ['video', 'text', 'interactive', 'quiz', 'practical'],
    default: 'text'
  },
  duration: {
    type: Number, // Duration in minutes
    default: 10
  },
  
  // Lesson ordering
  order: {
    type: Number,
    required: true,
    default: 1
  },
  
  // Lesson status
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Media content
  videoUrl: String,
  imageUrl: String,
  attachments: [{
    name: String,
    url: String,
    type: String // pdf, image, video, etc.
  }],
  
  // Interactive elements
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String
    }],
    passingScore: {
      type: Number,
      default: 70
    }
  },
  
  // Prerequisites
  prerequisites: [String], // Array of lesson IDs
  
  // Completion tracking
  estimatedTime: Number, // Minutes
  points: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

// Main Course schema
const courseSchema = new mongoose.Schema({
  // Basic course information
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  
  // Course categorization
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'specialty', 'nutrition', 'injury-prevention'],
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Course structure
  lessons: [lessonSchema],
  totalLessons: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number, // Total course duration in minutes
    default: 0
  },
  
  // Course status and access
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFree: {
    type: Boolean,
    default: true
  },
  
  // Access control
  accessLevel: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  requiredSubscription: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  
  // Media content
  thumbnailUrl: String,
  coverImageUrl: String,
  introVideoUrl: String,
  
  // Course metadata
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  
  // Author information
  author: {
    name: {
      type: String,
      required: true
    },
    bio: String,
    avatarUrl: String,
    credentials: [String]
  },
  
  // Course objectives and outcomes
  objectives: [String],
  learningOutcomes: [String],
  requirements: [String],
  
  // Course statistics
  enrollmentCount: {
    type: Number,
    default: 0
  },
  completionCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Course progression
  pointsValue: {
    type: Number,
    default: 100
  },
  certificateTemplate: String,
  
  // SEO and marketing
  slug: {
    type: String,
    unique: true,
    index: true
  },
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  
  // Course ordering and featured
  order: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Course schedule (for live courses)
  isLive: {
    type: Boolean,
    default: false
  },
  startDate: Date,
  endDate: Date,
  schedule: [{
    dayOfWeek: Number, // 0-6 (Sunday-Saturday)
    startTime: String, // HH:MM format
    duration: Number // minutes
  }],
  
  // Course forum/discussion
  discussionEnabled: {
    type: Boolean,
    default: true
  },
  
  // Publishing information
  publishedAt: Date,
  archivedAt: Date,
  
  // Course versions
  version: {
    type: String,
    default: '1.0'
  },
  changelog: [{
    version: String,
    changes: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion rate
courseSchema.virtual('completionRate').get(function() {
  if (this.enrollmentCount === 0) return 0;
  return (this.completionCount / this.enrollmentCount) * 100;
});

// Virtual for total course points
courseSchema.virtual('totalPoints').get(function() {
  return this.lessons.reduce((total, lesson) => total + (lesson.points || 0), 0);
});

// Generate slug from title
courseSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Update lesson count and duration
  this.totalLessons = this.lessons.length;
  this.estimatedDuration = this.lessons.reduce((total, lesson) => 
    total + (lesson.duration || 0), 0
  );
  
  next();
});

// Indexes for performance
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, difficulty: 1 });
courseSchema.index({ status: 1, isActive: 1 });
courseSchema.index({ isFeatured: 1, order: 1 });
courseSchema.index({ accessLevel: 1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });

// Static methods
courseSchema.statics.findPublished = function(filters = {}) {
  return this.find({
    ...filters,
    status: 'published',
    isActive: true
  });
};

courseSchema.statics.findByCategory = function(category) {
  return this.findPublished({ category });
};

courseSchema.statics.findByDifficulty = function(difficulty) {
  return this.findPublished({ difficulty });
};

courseSchema.statics.findFeatured = function() {
  return this.findPublished({ isFeatured: true }).sort({ order: 1 });
};

courseSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, status: 'published', isActive: true });
};

courseSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query },
    status: 'published',
    isActive: true
  });
};

// Instance methods
courseSchema.methods.toSafeObject = function() {
  const course = this.toObject();
  
  // Remove sensitive admin data for public API
  delete course.__v;
  
  return course;
};

courseSchema.methods.canAccessUser = function(user) {
  // Check if user can access this course based on subscription
  if (this.isFree) return true;
  if (!user) return false;
  
  const userSubscription = user.subscriptionType || 'free';
  const requiredSubscription = this.requiredSubscription || 'free';
  
  const subscriptionLevels = { free: 0, premium: 1, pro: 2 };
  
  return subscriptionLevels[userSubscription] >= subscriptionLevels[requiredSubscription];
};

courseSchema.methods.getProgress = function(userId) {
  // This would typically be calculated from a separate UserProgress collection
  // For now, return a placeholder
  return {
    completedLessons: 0,
    totalLessons: this.totalLessons,
    completionPercentage: 0,
    lastAccessedAt: null
  };
};

const Course = mongoose.model('Course', courseSchema);

export default Course;