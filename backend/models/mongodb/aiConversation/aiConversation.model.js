import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const aiConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  userEmail: {
    type: String,
    index: true
  },
  conversationType: {
    type: String,
    enum: ['support', 'training', 'general', 'onboarding', 'feedback'],
    default: 'general',
    index: true
  },
  messages: [messageSchema],
  summary: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    default: ''
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  language: {
    type: String,
    default: 'lv',
    enum: ['lv', 'en', 'ru']
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  },
  userAgent: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'ai_conversations'
});

// Indexes for performance
aiConversationSchema.index({ createdAt: -1 });
aiConversationSchema.index({ userId: 1, createdAt: -1 });
aiConversationSchema.index({ conversationType: 1, createdAt: -1 });
aiConversationSchema.index({ resolved: 1, createdAt: -1 });
aiConversationSchema.index({ tags: 1 });
aiConversationSchema.index({ sentiment: 1 });

// Update message count before saving
aiConversationSchema.pre('save', function() {
  this.messageCount = this.messages.length;
  
  // Calculate duration if conversation is ended
  if (this.endedAt && this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  
  // Auto-generate summary from first user message if empty
  if (!this.summary && this.messages.length > 0) {
    const firstUserMessage = this.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      this.summary = firstUserMessage.content.substring(0, 200) + (firstUserMessage.content.length > 200 ? '...' : '');
    }
  }
  
  // Auto-generate topic from summary/content
  if (!this.topic && this.summary) {
    const words = this.summary.toLowerCase().split(' ').slice(0, 5);
    this.topic = words.join(' ');
  }
});

// Instance methods
aiConversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    metadata
  });
  this.messageCount = this.messages.length;
  return this;
};

aiConversationSchema.methods.endConversation = function() {
  this.endedAt = new Date();
  this.isActive = false;
  this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  return this;
};

aiConversationSchema.methods.addTags = function(tags) {
  const newTags = Array.isArray(tags) ? tags : [tags];
  this.tags = [...new Set([...this.tags, ...newTags.map(tag => tag.toLowerCase().trim())])];
  return this;
};

// Static methods
aiConversationSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  if (options.conversationType) query.conversationType = options.conversationType;
  if (options.resolved !== undefined) query.resolved = options.resolved;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

aiConversationSchema.statics.getAnalytics = function(dateRange = {}) {
  const matchStage = {};
  
  if (dateRange.startDate || dateRange.endDate) {
    matchStage.createdAt = {};
    if (dateRange.startDate) matchStage.createdAt.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) matchStage.createdAt.$lte = new Date(dateRange.endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        averageMessages: { $avg: '$messageCount' },
        averageDuration: { $avg: '$duration' },
        resolvedCount: { $sum: { $cond: ['$resolved', 1, 0] } },
        sentimentStats: {
          $push: '$sentiment'
        },
        topicStats: {
          $push: '$conversationType'
        }
      }
    },
    {
      $project: {
        totalConversations: 1,
        averageMessages: { $round: ['$averageMessages', 2] },
        averageDuration: { $round: ['$averageDuration', 0] },
        resolvedCount: 1,
        resolutionRate: {
          $round: [
            { $multiply: [{ $divide: ['$resolvedCount', '$totalConversations'] }, 100] },
            2
          ]
        },
        sentimentBreakdown: {
          positive: {
            $size: {
              $filter: {
                input: '$sentimentStats',
                cond: { $eq: ['$$this', 'positive'] }
              }
            }
          },
          neutral: {
            $size: {
              $filter: {
                input: '$sentimentStats',
                cond: { $eq: ['$$this', 'neutral'] }
              }
            }
          },
          negative: {
            $size: {
              $filter: {
                input: '$sentimentStats',
                cond: { $eq: ['$$this', 'negative'] }
              }
            }
          }
        },
        typeBreakdown: {
          support: {
            $size: {
              $filter: {
                input: '$topicStats',
                cond: { $eq: ['$$this', 'support'] }
              }
            }
          },
          training: {
            $size: {
              $filter: {
                input: '$topicStats',
                cond: { $eq: ['$$this', 'training'] }
              }
            }
          },
          general: {
            $size: {
              $filter: {
                input: '$topicStats',
                cond: { $eq: ['$$this', 'general'] }
              }
            }
          }
        }
      }
    }
  ]);
};

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

export default AIConversation;