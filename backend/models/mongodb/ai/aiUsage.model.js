// AI Usage Tracking Model - Track ChatGPT/OpenAI resource consumption
import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema({
  // Request identification
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User and context information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who initiated the request (for admin-generated content)
    index: true
  },
  
  // Context of AI usage
  context: {
    type: String,
    enum: [
      'course_generation',
      'training_plan_creation',
      'workout_generation', 
      'exercise_generation',
      'coaching_advice',
      'content_optimization',
      'user_recommendation',
      'admin_task',
      'other'
    ],
    required: true,
    index: true
  },
  
  // Specific entity this usage relates to
  entityType: {
    type: String,
    enum: ['course', 'training_plan', 'workout', 'exercise', 'user_query', 'admin_content'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  entityName: {
    type: String,
    index: true
  },
  
  // AI Model information
  model: {
    type: String,
    required: true,
    enum: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo', 'claude-3'],
    default: 'gpt-4'
  },
  
  // Usage metrics
  tokens: {
    input: {
      type: Number,
      required: true,
      default: 0
    },
    output: {
      type: Number,
      required: true,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    }
  },
  
  // Cost calculation
  cost: {
    input: {
      type: Number,
      required: true,
      default: 0
    },
    output: {
      type: Number,
      required: true,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Request details
  prompt: {
    length: Number,
    preview: String // First 200 chars for debugging
  },
  response: {
    length: Number,
    preview: String, // First 200 chars for debugging
    success: {
      type: Boolean,
      default: true
    }
  },
  
  // Performance metrics
  latency: {
    type: Number, // Response time in milliseconds
    required: true
  },
  
  // Error handling
  error: {
    message: String,
    code: String,
    retryCount: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    requestSource: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin', 'background_job'],
      default: 'web'
    }
  },
  
  // Billing information
  billing: {
    subscriptionType: {
      type: String,
      enum: ['free', 'premium', 'pro', 'enterprise'],
      default: 'free'
    },
    chargedToUser: {
      type: Boolean,
      default: false
    },
    internalCost: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
aiUsageSchema.index({ createdAt: -1 });
aiUsageSchema.index({ context: 1, createdAt: -1 });
aiUsageSchema.index({ entityType: 1, entityId: 1 });
aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ adminId: 1, createdAt: -1 });
aiUsageSchema.index({ model: 1, createdAt: -1 });
aiUsageSchema.index({ 'billing.subscriptionType': 1, createdAt: -1 });

// Virtual for efficiency score
aiUsageSchema.virtual('efficiency').get(function() {
  if (this.tokens.total === 0) return 0;
  return this.cost.total / this.tokens.total;
});

// Virtual for cost per second
aiUsageSchema.virtual('costPerSecond').get(function() {
  if (this.latency === 0) return 0;
  return this.cost.total / (this.latency / 1000);
});

// Pre-save middleware to calculate totals
aiUsageSchema.pre('save', function(next) {
  // Calculate total tokens
  this.tokens.total = this.tokens.input + this.tokens.output;
  
  // Calculate total cost
  this.cost.total = this.cost.input + this.cost.output;
  
  // Ensure request preview is truncated
  if (this.prompt && this.prompt.preview && this.prompt.preview.length > 200) {
    this.prompt.preview = this.prompt.preview.substring(0, 200) + '...';
  }
  
  if (this.response && this.response.preview && this.response.preview.length > 200) {
    this.response.preview = this.response.preview.substring(0, 200) + '...';
  }
  
  next();
});

// Static methods for analytics
aiUsageSchema.statics.getUsageByContext = function(context, startDate, endDate) {
  const filter = { context };
  if (startDate && endDate) {
    filter.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: '$tokens.total' },
        totalCost: { $sum: '$cost.total' },
        requestCount: { $sum: 1 },
        avgLatency: { $avg: '$latency' },
        models: { $addToSet: '$model' }
      }
    }
  ]);
};

aiUsageSchema.statics.getUsageByCourse = function(startDate, endDate) {
  const filter = { 
    context: 'course_generation',
    entityType: 'course'
  };
  
  if (startDate && endDate) {
    filter.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          entityId: '$entityId',
          entityName: '$entityName'
        },
        totalTokens: { $sum: '$tokens.total' },
        totalCost: { $sum: '$cost.total' },
        requestCount: { $sum: 1 },
        avgLatency: { $avg: '$latency' },
        lastUsed: { $max: '$createdAt' }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  ]);
};

aiUsageSchema.statics.getDailyUsageStats = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          context: '$context'
        },
        totalTokens: { $sum: '$tokens.total' },
        totalCost: { $sum: '$cost.total' },
        requestCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': -1, '_id.context': 1 }
    }
  ]);
};

aiUsageSchema.statics.getTopCoursesByUsage = function(limit = 10, startDate, endDate) {
  const filter = { 
    context: 'course_generation',
    entityType: 'course',
    entityId: { $exists: true }
  };
  
  if (startDate && endDate) {
    filter.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$entityId',
        courseName: { $first: '$entityName' },
        totalTokens: { $sum: '$tokens.total' },
        totalCost: { $sum: '$cost.total' },
        requestCount: { $sum: 1 },
        avgLatency: { $avg: '$latency' },
        lastGenerated: { $max: '$createdAt' }
      }
    },
    {
      $sort: { totalCost: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

const AIUsage = mongoose.model('AIUsage', aiUsageSchema);

export default AIUsage;