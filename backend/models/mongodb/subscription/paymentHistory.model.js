// MongoDB Payment History Model - Track Payment Transactions
import mongoose from 'mongoose';

// Payment transaction schema
const paymentHistorySchema = new mongoose.Schema({
  // User and subscription references
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: true,
    index: true
  },
  
  // Transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'other'],
    required: true
  },
  
  // Payment information
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    required: true,
    default: 'pending',
    index: true
  },
  
  // Transaction type
  type: {
    type: String,
    enum: ['subscription', 'upgrade', 'renewal', 'refund', 'chargeback', 'adjustment'],
    required: true,
    index: true
  },
  
  // Plan information at time of payment
  planType: {
    type: String,
    enum: ['free', 'premium', 'pro', 'enterprise'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  
  // Payment provider details
  providerDetails: {
    // Stripe
    stripePaymentIntentId: String,
    stripeChargeId: String,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    
    // PayPal
    paypalTransactionId: String,
    paypalOrderId: String,
    
    // Generic provider data
    providerTransactionId: String,
    providerCustomerId: String,
    providerData: mongoose.Schema.Types.Mixed
  },
  
  // Payment dates
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedDate: Date,
  
  // Refund information
  refundInfo: {
    refundedAmount: {
      type: Number,
      default: 0
    },
    refundDate: Date,
    refundReason: String,
    refundTransactionId: String,
    isPartialRefund: {
      type: Boolean,
      default: false
    }
  },
  
  // Invoice and receipt
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  receiptUrl: String,
  invoiceUrl: String,
  
  // Tax information
  taxInfo: {
    taxAmount: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0
    },
    taxId: String,
    country: String,
    region: String
  },
  
  // Discount and coupon information
  discountInfo: {
    couponCode: String,
    discountAmount: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    originalAmount: Number
  },
  
  // Payment failure information
  failureInfo: {
    errorCode: String,
    errorMessage: String,
    failureReason: String,
    retryCount: {
      type: Number,
      default: 0
    },
    nextRetryDate: Date
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    device: String,
    platform: String
  },
  
  // Internal notes
  notes: String,
  isManual: {
    type: Boolean,
    default: false
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
paymentHistorySchema.index({ userId: 1, paymentDate: -1 });
paymentHistorySchema.index({ subscriptionId: 1, paymentDate: -1 });
paymentHistorySchema.index({ status: 1, paymentDate: -1 });
paymentHistorySchema.index({ type: 1, paymentDate: -1 });
paymentHistorySchema.index({ planType: 1, paymentDate: -1 });
paymentHistorySchema.index({ 'providerDetails.stripePaymentIntentId': 1 });
paymentHistorySchema.index({ 'providerDetails.paypalTransactionId': 1 });

// Virtual for net amount (after refunds)
paymentHistorySchema.virtual('netAmount').get(function() {
  return this.amount - (this.refundInfo.refundedAmount || 0);
});

// Virtual for payment summary
paymentHistorySchema.virtual('summary').get(function() {
  return {
    transactionId: this.transactionId,
    amount: this.amount,
    currency: this.currency,
    status: this.status,
    type: this.type,
    paymentDate: this.paymentDate,
    planType: this.planType,
    billingCycle: this.billingCycle
  };
});

// Pre-save middleware
paymentHistorySchema.pre('save', function(next) {
  // Generate invoice number if completed
  if (this.status === 'completed' && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.invoiceNumber = `INV-${year}${month}-${random}`;
  }
  
  // Set processed date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.processedDate) {
    this.processedDate = new Date();
  }
  
  next();
});

// Instance methods
paymentHistorySchema.methods.markCompleted = function(providerTransactionId = null) {
  this.status = 'completed';
  this.processedDate = new Date();
  
  if (providerTransactionId) {
    this.providerDetails.providerTransactionId = providerTransactionId;
  }
  
  return this.save();
};

paymentHistorySchema.methods.markFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.failureInfo.errorCode = errorCode;
  this.failureInfo.errorMessage = errorMessage;
  this.failureInfo.retryCount = (this.failureInfo.retryCount || 0) + 1;
  
  return this.save();
};

paymentHistorySchema.methods.processRefund = function(refundAmount, reason = '') {
  const isPartial = refundAmount < this.amount;
  
  this.refundInfo = {
    refundedAmount: refundAmount,
    refundDate: new Date(),
    refundReason: reason,
    isPartialRefund: isPartial
  };
  
  this.status = isPartial ? 'partially_refunded' : 'refunded';
  
  return this.save();
};

// Static methods
paymentHistorySchema.statics.findUserPayments = function(userId, options = {}) {
  const {
    status,
    type,
    limit = 50,
    page = 1,
    sortBy = 'paymentDate',
    sortOrder = 'desc'
  } = options;
  
  let query = { userId };
  if (status) query.status = status;
  if (type) query.type = type;
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('subscriptionId', 'planType billingCycle')
    .lean();
};

paymentHistorySchema.statics.getRevenueStats = function(startDate, endDate) {
  const matchStage = {
    status: 'completed',
    paymentDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          planType: '$planType',
          billingCycle: '$billingCycle'
        },
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalRevenue' },
        totalTransactions: { $sum: '$transactionCount' },
        planBreakdown: {
          $push: {
            planType: '$_id.planType',
            billingCycle: '$_id.billingCycle',
            revenue: '$totalRevenue',
            transactions: '$transactionCount',
            averageAmount: '$averageAmount'
          }
        }
      }
    }
  ]);
};

paymentHistorySchema.statics.findFailedPayments = function(retryable = true) {
  const query = { 
    status: 'failed'
  };
  
  if (retryable) {
    query['failureInfo.retryCount'] = { $lt: 3 };
    query.$or = [
      { 'failureInfo.nextRetryDate': { $lte: new Date() } },
      { 'failureInfo.nextRetryDate': { $exists: false } }
    ];
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .populate('subscriptionId', 'planType status')
    .sort({ paymentDate: -1 });
};

paymentHistorySchema.statics.getMonthlyRevenue = function(year = new Date().getFullYear()) {
  return this.aggregate([
    {
      $match: {
        status: 'completed',
        paymentDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$paymentDate' },
          year: { $year: '$paymentDate' }
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.month': 1 }
    }
  ]);
};

const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);

export default PaymentHistory;