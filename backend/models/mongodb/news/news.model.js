// News and Announcements Model
// MongoDB schema for news articles and announcements system

import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxLength: [200, 'Title cannot exceed 200 characters'],
    trim: true
  },
  
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxLength: [10000, 'Content cannot exceed 10000 characters']
  },
  
  excerpt: {
    type: String,
    maxLength: [300, 'Excerpt cannot exceed 300 characters'],
    trim: true
  },
  
  category: {
    type: String,
    enum: ['general', 'training', 'features', 'maintenance', 'events', 'updates'],
    default: 'general',
    required: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    required: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    required: true
  },
  
  publishedAt: {
    type: Date,
    default: Date.now
  },
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    maxLength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  readTime: {
    type: String,
    default: '2 min',
    maxLength: [20, 'Read time cannot exceed 20 characters']
  },
  
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  
  // SEO and metadata
  metaDescription: {
    type: String,
    maxLength: [160, 'Meta description cannot exceed 160 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    sparse: true,
    maxLength: [100, 'Slug cannot exceed 100 characters']
  },
  
  // Targeting options
  targetAudience: {
    type: String,
    enum: ['all', 'premium', 'free', 'new_users', 'active_users'],
    default: 'all'
  },
  
  // Expiration for time-sensitive announcements
  expiresAt: {
    type: Date
  },
  
  // Analytics
  clickCount: {
    type: Number,
    default: 0,
    min: [0, 'Click count cannot be negative']
  },
  
  // System timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1, priority: -1 });
newsSchema.index({ priority: -1, publishedAt: -1 });
newsSchema.index({ author: 1, createdAt: -1 });
newsSchema.index({ tags: 1 });
newsSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Virtual for formatted publish date
newsSchema.virtual('formattedPublishDate').get(function() {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString('lv-LV', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for time ago
newsSchema.virtual('timeAgo').get(function() {
  if (!this.publishedAt) return null;
  
  const now = new Date();
  const diffInMs = now - this.publishedAt;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'Tikko' : `${diffInMinutes} min atpakaļ`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? '1 stundu atpakaļ' : `${diffInHours} stundas atpakaļ`;
  } else if (diffInDays < 30) {
    return diffInDays === 1 ? '1 dienu atpakaļ' : `${diffInDays} dienas atpakaļ`;
  } else {
    return this.publishedAt.toLocaleDateString('lv-LV');
  }
});

// Virtual for content preview
newsSchema.virtual('preview').get(function() {
  if (this.excerpt) return this.excerpt;
  
  // Create preview from content (first 150 chars)
  const textContent = this.content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
    
  return textContent.length > 150 
    ? textContent.substring(0, 147) + '...'
    : textContent;
});

// Virtual for priority badge info
newsSchema.virtual('priorityBadge').get(function() {
  const badges = {
    urgent: { text: 'STEIDZAMI', color: 'red', pulse: true },
    high: { text: 'SVARĪGI', color: 'orange', pulse: false },
    normal: { text: 'NORMĀLI', color: 'blue', pulse: false },
    low: { text: 'INFO', color: 'gray', pulse: false }
  };
  
  return badges[this.priority] || badges.normal;
});

// Pre-save middleware to generate slug if not provided
newsSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title')) {
    // Generate slug from title
    if (!this.slug) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[āā]/g, 'a')
        .replace(/[ēē]/g, 'e')
        .replace(/[īī]/g, 'i')
        .replace(/[ōō]/g, 'o')
        .replace(/[ūū]/g, 'u')
        .replace(/[ģ]/g, 'g')
        .replace(/[ķ]/g, 'k')
        .replace(/[ļ]/g, 'l')
        .replace(/[ņ]/g, 'n')
        .replace(/[šš]/g, 's')
        .replace(/[žž]/g, 'z')
        .replace(/[čč]/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
    }
    
    // Auto-generate excerpt if not provided
    if (!this.excerpt && this.content) {
      const textContent = this.content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      this.excerpt = textContent.length > 200 
        ? textContent.substring(0, 197) + '...'
        : textContent;
    }
  }
  
  // Update updatedAt timestamp
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Pre-save validation for publish date
newsSchema.pre('save', function(next) {
  if (this.status === 'published' && this.publishedAt > new Date()) {
    // If publishing in future, change status to draft
    this.status = 'draft';
  }
  
  next();
});

// Static method to get recent news
newsSchema.statics.getRecentNews = function(limit = 5) {
  return this.find({
    status: 'published',
    publishedAt: { $lte: new Date() }
  })
  .sort({ priority: -1, publishedAt: -1 })
  .limit(limit)
  .populate('author', 'firstName lastName')
  .lean();
};

// Static method to get urgent announcements
newsSchema.statics.getUrgentAnnouncements = function() {
  return this.find({
    status: 'published',
    priority: 'urgent',
    publishedAt: { $lte: new Date() },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ publishedAt: -1 })
  .populate('author', 'firstName lastName')
  .lean();
};

// Static method to get news by category
newsSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({
    status: 'published',
    category: category,
    publishedAt: { $lte: new Date() }
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('author', 'firstName lastName')
  .lean();
};

// Instance method to mark as read by user
newsSchema.methods.markAsRead = function() {
  this.viewCount = (this.viewCount || 0) + 1;
  return this.save();
};

// Instance method to check if expired
newsSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

const News = mongoose.model('News', newsSchema);

export default News;