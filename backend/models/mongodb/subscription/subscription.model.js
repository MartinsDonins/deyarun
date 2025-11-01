// MongoDB Subscription Model - User Subscription Management
import mongoose from 'mongoose';

// Subscription plan schema
const subscriptionPlanSchema = new mongoose.Schema({
  // Basic plan information
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Plan type and tier
  type: {
    type: String,
    required: true,
    index: true  // Index for performance, but allow duplicates
  },
  tier: {
    type: Number,
    required: true,
    index: true  // Index for performance, but allow duplicates
  },
  
  // Pricing information
  price: {
    monthly: {
      type: Number,
      required: true,
      default: 0
    },
    yearly: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Plan features and limits
  features: {
    // Course access
    courseAccess: {
      type: String,
      enum: ['basic', 'premium', 'unlimited'],
      default: 'basic'
    },
    maxCoursesPerMonth: {
      type: Number,
      default: 1
    },
    
    // Workout features
    maxWorkoutsPerWeek: {
      type: Number,
      default: 3
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    personalizedPlans: {
      type: Boolean,
      default: false
    },
    
    // Content features
    downloadableContent: {
      type: Boolean,
      default: false
    },
    offlineMode: {
      type: Boolean,
      default: false
    },
    
    // Support features
    prioritySupport: {
      type: Boolean,
      default: false
    },
    personalCoaching: {
      type: Boolean,
      default: false
    },
    
    // Community features
    communityAccess: {
      type: Boolean,
      default: true
    },
    exclusiveEvents: {
      type: Boolean,
      default: false
    }
  },
  
  // Plan availability
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Stripe integration
  stripeProductId: String,
  stripePriceIds: {
    monthly: String,
    yearly: String
  },
  
  // Marketing
  isPopular: {
    type: Boolean,
    default: false
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validUntil: Date,
    description: String
  },
  
  // Plan ordering
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Main User Subscription schema
const userSubscriptionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Current subscription details
  planType: {
    type: String,
    enum: ['free', 'premium', 'pro', 'enterprise'],
    required: true,
    default: 'free'
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  
  // Subscription status
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'pending', 'trial'],
    required: true,
    default: 'active',
    index: true
  },
  
  // Billing information
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Subscription period
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  renewalDate: Date,
  
  // Trial information
  trialStart: Date,
  trialEnd: Date,
  isTrialUsed: {
    type: Boolean,
    default: false
  },
  
  // Payment integration
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  
  // Cancellation information
  cancelledAt: Date,
  cancellationReason: String,
  willRenew: {
    type: Boolean,
    default: true
  },
  
  // Usage tracking
  usage: {
    coursesCompleted: {
      type: Number,
      default: 0
    },
    workoutsCompleted: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date,
    monthlyUsage: [{
      month: String, // YYYY-MM format
      coursesAccessed: {
        type: Number,
        default: 0
      },
      workoutsCompleted: {
        type: Number,
        default: 0
      },
      totalTimeSpent: {
        type: Number,
        default: 0
      }
    }]
  },
  
  // Subscription history
  previousPlan: {
    planType: String,
    changedAt: Date,
    reason: String
  },
  
  // Auto-renewal settings
  autoRenew: {
    type: Boolean,
    default: true
  },
  notifications: {
    renewal: {
      type: Boolean,
      default: true
    },
    expiration: {
      type: Boolean,
      default: true
    },
    billing: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
userSubscriptionSchema.index({ userId: 1 }, { unique: true });
userSubscriptionSchema.index({ status: 1, endDate: 1 });
userSubscriptionSchema.index({ planType: 1, status: 1 });
userSubscriptionSchema.index({ stripeSubscriptionId: 1 });

// Virtual for days remaining
userSubscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for subscription summary
userSubscriptionSchema.virtual('summary').get(function() {
  return {
    planType: this.planType,
    status: this.status,
    daysRemaining: this.daysRemaining,
    amount: this.amount,
    currency: this.currency,
    billingCycle: this.billingCycle,
    willRenew: this.willRenew,
    renewalDate: this.renewalDate
  };
});

// Pre-save middleware
userSubscriptionSchema.pre('save', function(next) {
  // Calculate end date if not set
  if (!this.endDate && this.startDate) {
    const endDate = new Date(this.startDate);
    if (this.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    this.endDate = endDate;
  }
  
  // Set renewal date
  if (this.autoRenew && this.endDate) {
    this.renewalDate = new Date(this.endDate);
  }
  
  // Update status based on dates
  this.updateStatus();
  
  next();
});

// Instance methods
userSubscriptionSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (this.endDate < now && this.status === 'active') {
    this.status = 'expired';
  }
  
  // Check trial status
  if (this.trialEnd && this.trialEnd < now && this.status === 'trial') {
    this.status = this.amount > 0 ? 'active' : 'expired';
  }
};

userSubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' || this.status === 'trial';
};

userSubscriptionSchema.methods.canAccessFeature = function(feature) {
  if (!this.isActive()) return false;
  
  // This would be populated from the subscription plan
  // For now, return basic access logic
  const freePlanFeatures = ['communityAccess'];
  const premiumPlanFeatures = [...freePlanFeatures, 'advancedAnalytics', 'downloadableContent'];
  const proPlanFeatures = [...premiumPlanFeatures, 'personalizedPlans', 'prioritySupport', 'personalCoaching'];
  
  switch (this.planType) {
    case 'free':
      return freePlanFeatures.includes(feature);
    case 'premium':
      return premiumPlanFeatures.includes(feature);
    case 'pro':
    case 'enterprise':
      return proPlanFeatures.includes(feature) || feature === 'exclusiveEvents';
    default:
      return false;
  }
};

userSubscriptionSchema.methods.upgrade = function(newPlanType, newPlanId, amount) {
  this.previousPlan = {
    planType: this.planType,
    changedAt: new Date(),
    reason: 'upgrade'
  };
  
  this.planType = newPlanType;
  this.planId = newPlanId;
  this.amount = amount;
  this.status = 'active';
  
  return this.save();
};

userSubscriptionSchema.methods.cancel = function(reason = '') {
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.willRenew = false;
  this.autoRenew = false;
  
  // Keep active until end date
  if (this.endDate > new Date()) {
    this.status = 'active'; // Will become expired automatically
  } else {
    this.status = 'cancelled';
  }
  
  return this.save();
};

userSubscriptionSchema.methods.addUsage = function(type, amount = 1) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  // Update overall usage
  if (type === 'course') {
    this.usage.coursesCompleted += amount;
  } else if (type === 'workout') {
    this.usage.workoutsCompleted += amount;
  }
  
  this.usage.lastActivityDate = new Date();
  
  // Update monthly usage
  let monthlyUsage = this.usage.monthlyUsage.find(u => u.month === currentMonth);
  if (!monthlyUsage) {
    monthlyUsage = {
      month: currentMonth,
      coursesAccessed: 0,
      workoutsCompleted: 0,
      totalTimeSpent: 0
    };
    this.usage.monthlyUsage.push(monthlyUsage);
  }
  
  if (type === 'course') {
    monthlyUsage.coursesAccessed += amount;
  } else if (type === 'workout') {
    monthlyUsage.workoutsCompleted += amount;
  }
  
  return this.save();
};

// Static methods
userSubscriptionSchema.statics.findUserSubscription = function(userId) {
  return this.findOne({ userId }).populate('planId');
};

userSubscriptionSchema.statics.findExpiring = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $lte: futureDate },
    willRenew: false
  }).populate('userId', 'firstName lastName email');
};

userSubscriptionSchema.statics.getSubscriptionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$planType',
        count: { $sum: 1 },
        activeCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        },
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, '$amount', 0]
          }
        }
      }
    }
  ]);
};

// Models
const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);

export { SubscriptionPlan, UserSubscription };
export default { SubscriptionPlan, UserSubscription };