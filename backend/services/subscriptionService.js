// ✅ Subscription Service - MongoDB Compatible
import { SubscriptionPlan, UserSubscription, PaymentHistory, User } from '../models/mongodb/index.js';
import mongoose from 'mongoose';

console.log('✅ Subscription Service enabled with MongoDB support');

/**
 * Subscription Management Service - MongoDB Integration
 * Handles subscription plans, user subscriptions, and payment processing
 */
class SubscriptionService {
  constructor() {
    console.log('SubscriptionService initialized with MongoDB support');
    this.initializeDefaultPlans();
  }

  async initializeDefaultPlans() {
    try {
      // Check if subscription plans exist
      const existingPlans = await SubscriptionPlan.countDocuments();
      
      if (existingPlans === 0) {
        // Create default subscription plans
        const defaultPlans = [
          {
            name: 'Free Plan',
            displayName: 'Free',
            description: 'Basic features for getting started',
            type: 'free',
            tier: 1,
            price: {
              monthly: 0,
              yearly: 0,
              currency: 'EUR'
            },
            features: {
              courseAccess: 'basic',
              maxCoursesPerMonth: 2,
              maxWorkoutsPerWeek: 3,
              advancedAnalytics: false,
              personalizedPlans: false,
              downloadableContent: false,
              offlineMode: false,
              prioritySupport: false,
              personalCoaching: false,
              communityAccess: true,
              exclusiveEvents: false
            },
            isActive: true,
            isVisible: true,
            sortOrder: 1
          },
          {
            name: 'Premium Plan',
            displayName: 'Premium',
            description: 'Full access to all features',
            type: 'premium',
            tier: 2,
            price: {
              monthly: 9.99,
              yearly: 99.99,
              currency: 'EUR'
            },
            features: {
              courseAccess: 'premium',
              maxCoursesPerMonth: 10,
              maxWorkoutsPerWeek: 20,
              advancedAnalytics: true,
              personalizedPlans: true,
              downloadableContent: true,
              offlineMode: true,
              prioritySupport: true,
              personalCoaching: false,
              communityAccess: true,
              exclusiveEvents: false
            },
            isActive: true,
            isVisible: true,
            isPopular: true,
            sortOrder: 2
          },
          {
            name: 'Pro Plan',
            displayName: 'Pro',
            description: 'Professional features with personal coaching',
            type: 'pro',
            tier: 3,
            price: {
              monthly: 19.99,
              yearly: 199.99,
              currency: 'EUR'
            },
            features: {
              courseAccess: 'unlimited',
              maxCoursesPerMonth: -1,
              maxWorkoutsPerWeek: -1,
              advancedAnalytics: true,
              personalizedPlans: true,
              downloadableContent: true,
              offlineMode: true,
              prioritySupport: true,
              personalCoaching: true,
              communityAccess: true,
              exclusiveEvents: true
            },
            isActive: true,
            isVisible: true,
            sortOrder: 3
          }
        ];

        await SubscriptionPlan.insertMany(defaultPlans);
        console.log('Default subscription plans created');
      }
    } catch (error) {
      console.error('Failed to initialize default subscription plans:', error);
    }
  }

  async getSubscriptionPlans() {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
      return plans;
    } catch (error) {
      console.error('Get subscription plans error:', error);
      return [];
    }
  }

  async createSubscription(userId, planId, paymentData = {}) {
    try {
      // Get the subscription plan
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1); // Default to monthly

      // Create subscription
      const subscription = new UserSubscription({
        userId: new mongoose.Types.ObjectId(userId),
        planId: new mongoose.Types.ObjectId(planId),
        planType: plan.type,
        status: plan.price.monthly === 0 ? 'active' : 'pending_payment',
        startDate,
        endDate,
        amount: plan.price.monthly,
        currency: plan.price.currency,
        autoRenew: paymentData.autoRenew || false
      });

      await subscription.save();

      // Create payment record if not free
      if (plan.price.monthly > 0) {
        const payment = new PaymentHistory({
          userId: new mongoose.Types.ObjectId(userId),
          subscriptionId: subscription._id,
          amount: plan.price.monthly,
          currency: plan.price.currency,
          status: 'pending',
          paymentMethod: paymentData.paymentMethod || 'card',
          description: `Subscription: ${plan.displayName}`,
          metadata: paymentData.metadata || {}
        });

        await payment.save();
      }

      // Update user subscription type
      await User.findByIdAndUpdate(userId, {
        subscriptionType: plan.type
      });

      return {
        subscription,
        plan,
        requiresPayment: plan.price.monthly > 0
      };

    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await UserSubscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Update subscription status
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.autoRenew = false;
      await subscription.save();

      // Update user to free plan
      await User.findByIdAndUpdate(subscription.userId, {
        subscriptionType: 'free'
      });

      return subscription;

    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  async checkExpiringSubscriptions() {
    try {
      // Find subscriptions expiring in next 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringSubscriptions = await UserSubscription.find({
        status: 'active',
        endDate: { $lte: sevenDaysFromNow, $gte: new Date() }
      }).populate('userId planId');

      return expiringSubscriptions;

    } catch (error) {
      console.error('Check expiring subscriptions error:', error);
      return [];
    }
  }

  async upgradeSubscription(subscriptionId, newPlanId) {
    try {
      const subscription = await UserSubscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlan = await SubscriptionPlan.findById(newPlanId);
      if (!newPlan) {
        throw new Error('New subscription plan not found');
      }

      // Calculate prorated amount (simplified)
      const remainingDays = Math.max(0, Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24)));
      const currentPlan = await SubscriptionPlan.findById(subscription.planId);
      const proratedCredit = (currentPlan?.price?.monthly || 0) * (remainingDays / 30);
      const upgradeAmount = Math.max(0, newPlan.price.monthly - proratedCredit);

      // Create new subscription
      const newSubscription = new UserSubscription({
        userId: subscription.userId,
        planId: new mongoose.Types.ObjectId(newPlanId),
        planType: newPlan.type,
        status: upgradeAmount === 0 ? 'active' : 'pending_payment',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
        amount: newPlan.price.monthly,
        currency: newPlan.price.currency,
        autoRenew: subscription.autoRenew
      });

      await newSubscription.save();

      // Cancel old subscription
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      await subscription.save();

      // Create payment record if upgrade amount > 0
      if (upgradeAmount > 0) {
        const payment = new PaymentHistory({
          userId: subscription.userId,
          subscriptionId: newSubscription._id,
          amount: upgradeAmount,
          currency: newPlan.price.currency,
          status: 'pending',
          paymentMethod: 'card',
          description: `Upgrade to ${newPlan.displayName}`,
          metadata: { proratedCredit, originalSubscriptionId: subscriptionId }
        });

        await payment.save();
      }

      return {
        newSubscription,
        upgradeAmount,
        proratedCredit
      };

    } catch (error) {
      console.error('Upgrade subscription error:', error);
      throw error;
    }
  }

  async getUserSubscription(userId) {
    try {
      const subscription = await UserSubscription.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        status: { $in: ['active', 'pending_payment'] }
      })
      .populate('planId')
      .sort({ createdAt: -1 });

      return subscription;

    } catch (error) {
      console.error('Get user subscription error:', error);
      return null;
    }
  }

  async processExpiredSubscriptions() {
    try {
      const expiredSubscriptions = await UserSubscription.find({
        status: 'active',
        endDate: { $lt: new Date() }
      });

      for (const subscription of expiredSubscriptions) {
        if (subscription.autoRenew) {
          // Try to renew automatically
          try {
            await this.renewSubscription(subscription._id);
          } catch (renewError) {
            console.error(`Failed to auto-renew subscription ${subscription._id}:`, renewError);
            // Fall back to expiring the subscription
            subscription.status = 'expired';
            await subscription.save();
            
            // Update user to free plan
            await User.findByIdAndUpdate(subscription.userId, {
              subscriptionType: 'free'
            });
          }
        } else {
          // Mark as expired
          subscription.status = 'expired';
          await subscription.save();
          
          // Update user to free plan
          await User.findByIdAndUpdate(subscription.userId, {
            subscriptionType: 'free'
          });
        }
      }

      console.log(`Processed ${expiredSubscriptions.length} expired subscriptions`);
      return expiredSubscriptions.length;

    } catch (error) {
      console.error('Process expired subscriptions error:', error);
      return 0;
    }
  }

  async renewSubscription(subscriptionId) {
    try {
      const subscription = await UserSubscription.findById(subscriptionId).populate('planId');
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Create new subscription for renewal
      const renewalEndDate = new Date(subscription.endDate);
      renewalEndDate.setMonth(renewalEndDate.getMonth() + 1); // Default to monthly renewal

      const renewalSubscription = new UserSubscription({
        userId: subscription.userId,
        planId: subscription.planId._id,
        planType: subscription.planType,
        status: 'pending_payment',
        startDate: subscription.endDate,
        endDate: renewalEndDate,
        amount: subscription.planId.price.monthly,
        currency: subscription.planId.price.currency,
        autoRenew: subscription.autoRenew
      });

      await renewalSubscription.save();

      // Create payment record
      const payment = new PaymentHistory({
        userId: subscription.userId,
        subscriptionId: renewalSubscription._id,
        amount: subscription.planId.price.monthly,
        currency: subscription.planId.price.currency,
        status: 'pending',
        paymentMethod: 'card',
        description: `Renewal: ${subscription.planId.displayName}`,
        metadata: { renewalOf: subscriptionId }
      });

      await payment.save();

      // Mark old subscription as completed
      subscription.status = 'completed';
      await subscription.save();

      return renewalSubscription;

    } catch (error) {
      console.error('Renew subscription error:', error);
      throw error;
    }
  }

  // Start subscription expiration checker (runs every hour)
  startExpirationChecker() {
    console.log('Starting subscription expiration checker');
    
    // Run immediately
    this.processExpiredSubscriptions();
    
    // Then run every hour
    setInterval(() => {
      this.processExpiredSubscriptions();
    }, 60 * 60 * 1000); // 1 hour
  }

  async getSubscriptionStats() {
    try {
      const stats = await UserSubscription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const premiumUsers = await User.countDocuments({ subscriptionType: 'premium' });

      return {
        subscriptionStats: stats,
        totalUsers,
        premiumUsers,
        conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0
      };

    } catch (error) {
      console.error('Get subscription stats error:', error);
      return null;
    }
  }
}

// Export disabled service instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;