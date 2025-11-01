// Subscription Management Routes - MongoDB Implementation
// MIGRATION STATUS: Stripe → EveryPay migration in progress
// TODO: Replace Stripe integration with EveryPay

import express from 'express';
import mongoose from 'mongoose';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { SubscriptionPlan, UserSubscription, PaymentHistory } from '../models/mongodb/index.js';

const router = express.Router();

console.log('✅ Subscriptions route enabled with MongoDB support');

// Public routes

// GET /subscriptions/plans - Get all available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    let query = { isVisible: true };
    if (!includeInactive) {
      query.isActive = true;
    }
    
    let plans = await SubscriptionPlan.find(query)
      .sort({ sortOrder: 1, tier: 1 })
      .lean();
    
    console.log(`📦 Subscription plans found: ${plans.length} plans`);
    
    // If no plans exist, create default plans
    if (plans.length === 0) {
      console.log('🏗️ No subscription plans found, creating default plans...');
      
      const defaultPlans = [
        {
          name: 'Free Runner',
          displayName: 'Free Runner',
          description: 'Perfect for getting started with running',
          type: 'free',
          tier: 0,
          price: {
            monthly: 0,
            yearly: 0,
            currency: 'EUR'
          },
          features: {
            courseAccess: 'basic',
            maxCoursesPerMonth: 3,
            maxWorkoutsPerWeek: 10,
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
          isPopular: false,
          sortOrder: 0
        },
        {
          name: 'Premium Runner',
          displayName: 'Premium Runner',
          description: 'Advanced features for serious runners',
          type: 'premium',
          tier: 1,
          price: {
            monthly: 9.99,
            yearly: 99.99,
            currency: 'EUR'
          },
          features: {
            courseAccess: 'premium',
            maxCoursesPerMonth: 10,
            maxWorkoutsPerWeek: 50,
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
          sortOrder: 1
        },
        {
          name: 'Pro Athlete',
          displayName: 'Pro Athlete',
          description: 'Everything for professional athletes',
          type: 'pro',
          tier: 2,
          price: {
            monthly: 19.99,
            yearly: 199.99,
            currency: 'EUR'
          },
          features: {
            courseAccess: 'unlimited',
            maxCoursesPerMonth: 999,
            maxWorkoutsPerWeek: 999,
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
          isPopular: false,
          sortOrder: 2
        }
      ];
      
      try {
        const createdPlans = await SubscriptionPlan.insertMany(defaultPlans);
        console.log(`✅ Created ${createdPlans.length} default subscription plans`);
        plans = createdPlans;
      } catch (createError) {
        console.error('❌ Error creating default plans:', createError);
        // Return empty array if plan creation fails
        plans = [];
      }
    }
    
    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
      message: error.message
    });
  }
});

// Protected routes (require authentication)

// GET /subscriptions/current - Get user's current subscription
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const subscription = await UserSubscription.findUserSubscription(userId);
    
    if (!subscription) {
      // Create default free subscription if none exists
      const freePlan = await SubscriptionPlan.findOne({ type: 'free' });
      if (!freePlan) {
        return res.status(500).json({
          success: false,
          error: 'No free plan available'
        });
      }
      
      const newSubscription = new UserSubscription({
        userId,
        planType: 'free',
        planId: freePlan._id,
        status: 'active',
        amount: 0,
        billingCycle: 'monthly',
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      });
      
      await newSubscription.save();
      
      return res.json({
        success: true,
        data: {
          subscription: newSubscription.summary,
          plan: freePlan
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        subscription: subscription.summary,
        plan: subscription.planId,
        usage: subscription.usage
      }
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
      message: error.message
    });
  }
});

// POST /subscriptions/create - Create new subscription
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { planType, billingCycle = 'monthly', paymentMethodId } = req.body;
    const userId = req.user.userId;
    
    // Validate plan exists
    const plan = await SubscriptionPlan.findOne({ type: planType, isActive: true });
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findUserSubscription(userId);
    if (existingSubscription && existingSubscription.isActive()) {
      return res.status(409).json({
        success: false,
        error: 'User already has an active subscription',
        message: 'Cancel existing subscription before creating a new one'
      });
    }
    
    // Calculate amount based on billing cycle
    const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    
    // Create subscription
    const subscription = new UserSubscription({
      userId,
      planType: plan.type,
      planId: plan._id,
      status: amount > 0 ? 'pending' : 'active',
      billingCycle,
      amount,
      currency: plan.price.currency
    });
    
    await subscription.save();
    
    // If free plan, activate immediately
    if (amount === 0) {
      subscription.status = 'active';
      await subscription.save();
      
      return res.json({
        success: true,
        message: 'Free subscription activated',
        data: {
          subscription: subscription.summary,
          plan
        }
      });
    }
    
    // For paid plans, create payment record
    const paymentRecord = new PaymentHistory({
      userId,
      subscriptionId: subscription._id,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod: 'stripe',
      amount,
      currency: plan.price.currency,
      type: 'subscription',
      planType: plan.type,
      billingCycle,
      status: 'pending'
    });
    
    await paymentRecord.save();
    
    res.json({
      success: true,
      message: 'Subscription created, payment required',
      data: {
        subscription: subscription.summary,
        plan,
        paymentRecord: paymentRecord.summary,
        requiresPayment: true
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
      message: error.message
    });
  }
});

// POST /subscriptions/upgrade - Upgrade subscription
router.post('/upgrade', authMiddleware, async (req, res) => {
  try {
    const { planType, billingCycle } = req.body;
    const userId = req.user.userId;
    
    // Get current subscription
    const currentSubscription = await UserSubscription.findUserSubscription(userId);
    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No current subscription found'
      });
    }
    
    // Get new plan
    const newPlan = await SubscriptionPlan.findOne({ type: planType, isActive: true });
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: 'Upgrade plan not found'
      });
    }
    
    // Validate upgrade (higher tier)
    const currentPlan = await SubscriptionPlan.findById(currentSubscription.planId);
    if (newPlan.tier <= currentPlan.tier) {
      return res.status(400).json({
        success: false,
        error: 'Cannot downgrade subscription',
        message: 'Use cancel and create new subscription for downgrade'
      });
    }
    
    // Calculate new amount
    const newAmount = billingCycle === 'yearly' ? newPlan.price.yearly : newPlan.price.monthly;
    
    // Upgrade subscription
    await currentSubscription.upgrade(planType, newPlan._id, newAmount);
    
    // Create payment record for upgrade
    const paymentRecord = new PaymentHistory({
      userId,
      subscriptionId: currentSubscription._id,
      transactionId: `upg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod: 'stripe',
      amount: newAmount,
      currency: newPlan.price.currency,
      type: 'upgrade',
      planType: newPlan.type,
      billingCycle: billingCycle || currentSubscription.billingCycle,
      status: newAmount > 0 ? 'pending' : 'completed'
    });
    
    await paymentRecord.save();
    
    res.json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: {
        subscription: currentSubscription.summary,
        plan: newPlan,
        paymentRecord: paymentRecord.summary
      }
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade subscription',
      message: error.message
    });
  }
});

// POST /subscriptions/cancel - Cancel subscription
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const { reason = '', immediate = false } = req.body;
    const userId = req.user.userId;
    
    const subscription = await UserSubscription.findUserSubscription(userId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }
    
    if (!subscription.isActive()) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is not active'
      });
    }
    
    // Cancel subscription
    await subscription.cancel(reason);
    
    if (immediate) {
      subscription.status = 'cancelled';
      subscription.endDate = new Date();
      await subscription.save();
    }
    
    res.json({
      success: true,
      message: immediate ? 'Subscription cancelled immediately' : 'Subscription will end at the current billing period',
      data: {
        subscription: subscription.summary,
        endsAt: subscription.endDate
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
});

// GET /subscriptions/history - Get user's payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status, type } = req.query;
    
    const payments = await PaymentHistory.findUserPayments(userId, {
      status,
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    const total = await PaymentHistory.countDocuments({ 
      userId,
      ...(status && { status }),
      ...(type && { type })
    });
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history',
      message: error.message
    });
  }
});

// POST /subscriptions/usage - Update subscription usage
router.post('/usage', authMiddleware, async (req, res) => {
  try {
    const { type, amount = 1 } = req.body;
    const userId = req.user.userId;
    
    if (!['course', 'workout'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid usage type'
      });
    }
    
    const subscription = await UserSubscription.findUserSubscription(userId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }
    
    await subscription.addUsage(type, amount);
    
    res.json({
      success: true,
      message: 'Usage updated successfully',
      data: {
        usage: subscription.usage
      }
    });
  } catch (error) {
    console.error('Error updating subscription usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update usage',
      message: error.message
    });
  }
});

// Admin routes (require admin privileges)

// GET /subscriptions/admin/plans - Get all subscription plans for admin
router.get('/admin/plans', adminMiddleware, async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({})
      .sort({ tier: 1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        plans
      }
    });
  } catch (error) {
    console.error('Error fetching admin plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
      message: error.message
    });
  }
});

// POST /subscriptions/admin/plans - Create new subscription plan
router.post('/admin/plans', adminMiddleware, async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`🔍 [${requestId}] Starting subscription plan creation...`);
    console.log(`📋 [${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`👤 [${requestId}] Admin user:`, req.user?.email || 'Unknown');
    
    // Check if this is accidentally being used for UPDATE instead of CREATE
    if (req.body._id || req.body.id) {
      console.log(`⚠️ [${requestId}] WARNING: POST request contains ID field - this might be an UPDATE disguised as CREATE!`);
      console.log(`🆔 [${requestId}] ID in body: ${req.body._id || req.body.id}`);
      console.log(`🤔 [${requestId}] Frontend might be using wrong HTTP method - should use PUT for updates`);
    }
    
    // Check if a plan with this name already exists
    if (req.body.name) {
      const existingPlan = await SubscriptionPlan.findOne({ name: req.body.name });
      if (existingPlan) {
        console.log(`❌ [${requestId}] DUPLICATE DETECTION: Plan with name "${req.body.name}" already exists!`);
        console.log(`🆔 [${requestId}] Existing plan ID: ${existingPlan._id}`);
        console.log(`🔄 [${requestId}] This looks like frontend is trying to UPDATE via POST instead of PUT`);
        
        return res.status(409).json({
          success: false,
          error: `Plan named "${req.body.name}" already exists. Use PUT /admin/plans/${existingPlan._id} to update it.`,
          requestId,
          debug: {
            operation: 'CREATE',
            conflictingPlanId: existingPlan._id,
            conflictingPlanName: existingPlan.name,
            suggestion: 'Use PUT method for updates'
          }
        });
      }
    }
    
    const planData = req.body;
    
    // Detailed validation logging
    console.log(`✅ [${requestId}] Validating required fields...`);
    if (!planData.name) {
      console.log(`❌ [${requestId}] Validation failed: Missing name field`);
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name',
        requestId
      });
    }
    if (!planData.type) {
      console.log(`❌ [${requestId}] Validation failed: Missing type field`);
      return res.status(400).json({
        success: false,
        error: 'Missing required field: type',
        requestId
      });
    }
    if (!planData.tier) {
      console.log(`❌ [${requestId}] Validation failed: Missing tier field`);
      return res.status(400).json({
        success: false,
        error: 'Missing required field: tier',
        requestId
      });
    }
    
    console.log(`✅ [${requestId}] All required fields present`);
    console.log(`🏗️ [${requestId}] Creating SubscriptionPlan instance...`);
    
    // Ensure features object exists and has proper boolean values
    if (planData.features) {
      console.log(`🔧 [${requestId}] Processing features object:`, planData.features);
      
      // Ensure boolean values are properly set
      if (typeof planData.features.advancedAnalytics !== 'undefined') {
        planData.features.advancedAnalytics = Boolean(planData.features.advancedAnalytics);
      }
      if (typeof planData.features.personalizedPlans !== 'undefined') {
        planData.features.personalizedPlans = Boolean(planData.features.personalizedPlans);
      }
      if (typeof planData.features.personalCoaching !== 'undefined') {
        planData.features.personalCoaching = Boolean(planData.features.personalCoaching);
      }
      if (typeof planData.features.prioritySupport !== 'undefined') {
        planData.features.prioritySupport = Boolean(planData.features.prioritySupport);
      }
      
      console.log(`✅ [${requestId}] Processed features:`, planData.features);
    }
    
    // Log the exact data being saved
    console.log(`📊 [${requestId}] Plan data for MongoDB:`, {
      name: planData.name,
      displayName: planData.displayName,
      description: planData.description,
      type: planData.type,
      tier: planData.tier,
      price: planData.price,
      features: planData.features ? Object.keys(planData.features) : 'undefined',
      isActive: planData.isActive,
      isVisible: planData.isVisible,
      isPopular: planData.isPopular,
      sortOrder: planData.sortOrder
    });
    
    const plan = new SubscriptionPlan(planData);
    
    console.log(`💾 [${requestId}] Attempting to save to MongoDB...`);
    const savedPlan = await plan.save();
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Plan created successfully in ${duration}ms`);
    console.log(`🆔 [${requestId}] Created plan ID: ${savedPlan._id}`);
    
    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      requestId,
      duration,
      data: {
        plan: savedPlan
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ [${requestId}] Error creating subscription plan after ${duration}ms:`, error);
    console.error(`🔍 [${requestId}] Error details:`, {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    // Send detailed error to Sentry with context
    if (global.Sentry) {
      global.Sentry.withScope((scope) => {
        scope.setTag('operation', 'subscription-plan-creation');
        scope.setTag('requestId', requestId);
        scope.setLevel('error');
        scope.setContext('request', {
          body: req.body,
          user: req.user?.email || 'Unknown',
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
        scope.setContext('error_details', {
          code: error.code,
          keyPattern: error.keyPattern,
          keyValue: error.keyValue,
          validationErrors: error.errors
        });
        global.Sentry.captureException(error);
      });
    }
    
    // Determine specific error type and message
    let errorMessage = 'Failed to create plan';
    let errorDetails = error.message;
    
    if (error.code === 11000) {
      console.error(`🔍 [${requestId}] Duplicate key error - unique constraint violation`);
      errorMessage = 'Plan with this type or tier already exists';
      errorDetails = `Duplicate key: ${JSON.stringify(error.keyValue)}`;
    } else if (error.name === 'ValidationError') {
      console.error(`🔍 [${requestId}] Mongoose validation error`);
      errorMessage = 'Invalid plan data';
      errorDetails = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
      console.error(`🔍 [${requestId}] Type casting error`);
      errorMessage = 'Invalid data type in plan fields';
      errorDetails = `${error.path}: ${error.value}`;
    }
    
    console.error(`📤 [${requestId}] Sending error response: ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: errorDetails,
      requestId,
      duration,
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /subscriptions/admin/plans/:id - Update subscription plan
router.put('/admin/plans/:id', adminMiddleware, async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 [${requestId}] Starting subscription plan update...`);
    console.log(`🆔 [${requestId}] Plan ID: ${id}`);
    console.log(`📋 [${requestId}] Update data:`, JSON.stringify(updateData, null, 2));
    console.log(`👤 [${requestId}] Admin user:`, req.user?.email || 'Unknown');
    
    // Check if plan exists before updating
    console.log(`🔍 [${requestId}] Checking if plan exists...`);
    const existingPlan = await SubscriptionPlan.findById(id);
    if (!existingPlan) {
      console.log(`❌ [${requestId}] Plan not found with ID: ${id} - This should be an UPDATE but plan doesn't exist!`);
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found - cannot update non-existent plan',
        requestId,
        debug: {
          operation: 'UPDATE',
          planId: id,
          planExists: false
        }
      });
    }
    
    console.log(`✅ [${requestId}] Plan exists - proceeding with update`);
    console.log(`📊 [${requestId}] Existing plan name: "${existingPlan.name}"`);
    console.log(`🔄 [${requestId}] Update will change name to: "${updateData.name || existingPlan.name}"`);
    
    // Remove fields that should not be updated
    delete updateData._id;
    delete updateData.createdAt;
    
    // Ensure features object exists and has proper boolean values
    if (updateData.features) {
      console.log(`🔧 [${requestId}] Processing features object:`, updateData.features);
      
      // Ensure boolean values are properly set
      if (typeof updateData.features.advancedAnalytics !== 'undefined') {
        updateData.features.advancedAnalytics = Boolean(updateData.features.advancedAnalytics);
      }
      if (typeof updateData.features.personalizedPlans !== 'undefined') {
        updateData.features.personalizedPlans = Boolean(updateData.features.personalizedPlans);
      }
      if (typeof updateData.features.personalCoaching !== 'undefined') {
        updateData.features.personalCoaching = Boolean(updateData.features.personalCoaching);
      }
      if (typeof updateData.features.prioritySupport !== 'undefined') {
        updateData.features.prioritySupport = Boolean(updateData.features.prioritySupport);
      }
      
      console.log(`✅ [${requestId}] Processed features:`, updateData.features);
    }
    
    console.log(`💾 [${requestId}] Attempting to update plan in MongoDB...`);
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      console.log(`❌ [${requestId}] Plan not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found',
        requestId
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Plan updated successfully in ${duration}ms`);
    console.log(`🆔 [${requestId}] Updated plan ID: ${plan._id}`);
    
    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      requestId,
      duration,
      data: {
        plan
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ [${requestId}] Error updating subscription plan after ${duration}ms:`, error);
    console.error(`🔍 [${requestId}] Error details:`, {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    // Send detailed error to Sentry with context
    if (global.Sentry) {
      global.Sentry.withScope((scope) => {
        scope.setTag('operation', 'subscription-plan-update');
        scope.setTag('requestId', requestId);
        scope.setLevel('error');
        scope.setContext('request', {
          planId: req.params.id,
          body: req.body,
          user: req.user?.email || 'Unknown',
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
        scope.setContext('error_details', {
          code: error.code,
          keyPattern: error.keyPattern,
          keyValue: error.keyValue,
          validationErrors: error.errors
        });
        global.Sentry.captureException(error);
      });
    }
    
    // Determine specific error type and message
    let errorMessage = 'Failed to update plan';
    let errorDetails = error.message;
    
    if (error.code === 11000) {
      console.error(`🔍 [${requestId}] Duplicate key error during update`);
      errorMessage = 'Updated values conflict with existing plan';
      errorDetails = `Duplicate key: ${JSON.stringify(error.keyValue)}`;
    } else if (error.name === 'ValidationError') {
      console.error(`🔍 [${requestId}] Mongoose validation error during update`);
      errorMessage = 'Invalid update data';
      errorDetails = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
      console.error(`🔍 [${requestId}] Type casting error during update`);
      errorMessage = 'Invalid data type in update fields';
      errorDetails = `${error.path}: ${error.value}`;
    }
    
    console.error(`📤 [${requestId}] Sending error response: ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: errorDetails,
      requestId,
      duration,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /subscriptions/admin/plans/:id - Delete subscription plan
router.delete('/admin/plans/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if any active subscriptions use this plan
    const activeSubscriptions = await UserSubscription.countDocuments({
      planId: id,
      status: { $in: ['active', 'trial'] }
    });
    
    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete plan with active subscriptions',
        message: `This plan has ${activeSubscriptions} active subscriptions. Please cancel or migrate them first.`
      });
    }
    
    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Subscription plan deleted successfully',
      data: {
        deletedPlan: {
          id: plan._id,
          name: plan.name
        }
      }
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plan',
      message: error.message
    });
  }
});

// GET /subscriptions/admin/users - Get all user subscriptions
router.get('/admin/users', adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      planType,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (planType) query.planType = planType;
    
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    const subscriptions = await UserSubscription.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name displayName')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await UserSubscription.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSubscriptions: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions',
      message: error.message
    });
  }
});

// GET /subscriptions/admin/analytics - Get subscription analytics
router.get('/admin/analytics', adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get subscription statistics
    const subscriptionStats = await UserSubscription.getSubscriptionStats();
    
    // Get revenue statistics
    let revenueStats = [];
    if (startDate && endDate) {
      revenueStats = await PaymentHistory.getRevenueStats(
        new Date(startDate),
        new Date(endDate)
      );
    }
    
    // Get monthly revenue for current year
    const monthlyRevenue = await PaymentHistory.getMonthlyRevenue();
    
    // Get recent transactions
    const recentTransactions = await PaymentHistory.find({
      status: 'completed'
    })
      .populate('userId', 'firstName lastName email')
      .sort({ paymentDate: -1 })
      .limit(10)
      .lean();
    
    // Get expiring subscriptions
    const expiringSubscriptions = await UserSubscription.findExpiring(30);
    
    res.json({
      success: true,
      data: {
        subscriptionStats,
        revenueStats: revenueStats[0] || { totalRevenue: 0, totalTransactions: 0 },
        monthlyRevenue,
        recentTransactions,
        expiringSubscriptions: expiringSubscriptions.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

// POST /subscriptions/admin/users/:userId/subscription - Manually create subscription for user
router.post('/admin/users/:userId/subscription', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { planType, billingCycle = 'monthly', startDate, endDate } = req.body;
    
    const plan = await SubscriptionPlan.findOne({ type: planType });
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }
    
    // Check if user already has active subscription
    const existingSubscription = await UserSubscription.findUserSubscription(userId);
    if (existingSubscription && existingSubscription.isActive()) {
      return res.status(409).json({
        success: false,
        error: 'User already has active subscription'
      });
    }
    
    const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    
    const subscription = new UserSubscription({
      userId,
      planType: plan.type,
      planId: plan._id,
      status: 'active',
      billingCycle,
      amount,
      currency: plan.price.currency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    await subscription.save();
    
    // Create payment record for manual subscription
    const paymentRecord = new PaymentHistory({
      userId,
      subscriptionId: subscription._id,
      transactionId: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod: 'other',
      amount,
      currency: plan.price.currency,
      type: 'subscription',
      planType: plan.type,
      billingCycle,
      status: 'completed',
      isManual: true,
      processedBy: req.user.userId
    });
    
    await paymentRecord.save();
    
    res.status(201).json({
      success: true,
      message: 'Manual subscription created successfully',
      data: {
        subscription: subscription.summary,
        paymentRecord: paymentRecord.summary
      }
    });
  } catch (error) {
    console.error('Error creating manual subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
      message: error.message
    });
  }
});

// PUT /subscriptions/admin/users/:userId/subscription - Update user's subscription
router.put('/admin/users/:userId/subscription', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { planType, billingCycle, status, startDate, endDate } = req.body;
    
    // Find user's current subscription
    const subscription = await UserSubscription.findUserSubscription(userId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found for this user'
      });
    }
    
    // If changing plan type, validate new plan exists
    if (planType && planType !== subscription.planType) {
      const newPlan = await SubscriptionPlan.findOne({ type: planType });
      if (!newPlan) {
        return res.status(404).json({
          success: false,
          error: 'New plan not found'
        });
      }
      
      subscription.planType = planType;
      subscription.planId = newPlan._id;
      
      // Update amount based on billing cycle
      const amount = billingCycle === 'yearly' ? newPlan.price.yearly : newPlan.price.monthly;
      subscription.amount = amount;
      subscription.currency = newPlan.price.currency;
    }
    
    // Update other fields if provided
    if (billingCycle) subscription.billingCycle = billingCycle;
    if (status) subscription.status = status;
    if (startDate) subscription.startDate = new Date(startDate);
    if (endDate) subscription.endDate = new Date(endDate);
    
    await subscription.save();
    
    // Create audit log entry
    const paymentRecord = new PaymentHistory({
      userId,
      subscriptionId: subscription._id,
      transactionId: `admin_edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod: 'other',
      amount: subscription.amount,
      currency: subscription.currency,
      type: 'adjustment',
      planType: subscription.planType,
      billingCycle: subscription.billingCycle,
      status: 'completed',
      isManual: true,
      processedBy: req.user.userId,
      notes: `Admin edited subscription - changes: ${JSON.stringify(req.body)}`
    });
    
    await paymentRecord.save();
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscription: subscription.summary,
        auditRecord: paymentRecord.summary
      }
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription',
      message: error.message
    });
  }
});

// DELETE /subscriptions/admin/users/:userId/subscription - Cancel user's subscription
router.delete('/admin/users/:userId/subscription', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Admin cancellation' } = req.body;
    
    const subscription = await UserSubscription.findUserSubscription(userId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found for this user'
      });
    }
    
    // Update subscription status
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;
    subscription.lastModifiedBy = req.user.userId;
    subscription.lastModifiedAt = new Date();
    
    await subscription.save();
    
    // Create audit log entry
    const auditRecord = new PaymentHistory({
      userId,
      subscriptionId: subscription._id,
      transactionId: `admin_cancel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod: 'other',
      amount: 0,
      currency: subscription.currency,
      type: 'subscription_cancellation',
      planType: subscription.planType,
      billingCycle: subscription.billingCycle,
      status: 'completed',
      isManual: true,
      processedBy: req.user.userId,
      metadata: {
        action: 'admin_cancel',
        reason
      }
    });
    
    await auditRecord.save();
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: subscription.summary,
        auditRecord: auditRecord.summary
      }
    });
  } catch (error) {
    console.error('Error cancelling user subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
});

// Webhook endpoints

// DEPRECATED: Stripe webhook handler - replaced with EveryPay
// TODO: Remove after EveryPay webhook implementation
// POST /subscriptions/webhook/stripe - Stripe webhook handler
router.post('/webhook/stripe', async (req, res) => {
  console.log('⚠️ Stripe webhook called but service is deprecated');
  res.status(410).json({ 
    error: 'Stripe integration deprecated', 
    message: 'Payment system migrated to EveryPay' 
  });
  return;

  // OLD STRIPE CODE - COMMENTED OUT
  /*
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // In a real implementation, you would verify the webhook signature here
    // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    
    // For now, we'll handle basic webhook events
    const event = JSON.parse(req.body.toString());
    
    console.log('Received Stripe webhook:', event.type);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// POST /subscriptions/webhook/payment - Generic payment webhook
router.post('/webhook/payment', async (req, res) => {
  try {
    const { transactionId, status, amount, currency } = req.body;
    
    const payment = await PaymentHistory.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    if (status === 'completed') {
      await payment.markCompleted();
      
      // Update subscription status
      const subscription = await UserSubscription.findById(payment.subscriptionId);
      if (subscription && subscription.status === 'pending') {
        subscription.status = 'active';
        await subscription.save();
      }
    } else if (status === 'failed') {
      await payment.markFailed('payment_failed', 'Payment processing failed');
    }
    
    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// DEPRECATED: Stripe helper functions - replaced with EveryPay
// TODO: Remove after EveryPay integration
*/
});

// Helper functions for webhook processing - DEPRECATED
async function handlePaymentSuccess(paymentIntent) {
  try {
    const payment = await PaymentHistory.findOne({
      'providerDetails.stripePaymentIntentId': paymentIntent.id
    });
    
    if (payment) {
      await payment.markCompleted(paymentIntent.id);
      
      // Activate subscription
      const subscription = await UserSubscription.findById(payment.subscriptionId);
      if (subscription) {
        subscription.status = 'active';
        subscription.lastPaymentDate = new Date();
        await subscription.save();
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const payment = await PaymentHistory.findOne({
      'providerDetails.stripePaymentIntentId': paymentIntent.id
    });
    
    if (payment) {
      await payment.markFailed(
        paymentIntent.last_payment_error?.code || 'unknown',
        paymentIntent.last_payment_error?.message || 'Payment failed'
      );
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleSubscriptionUpdate(stripeSubscription) {
  try {
    const subscription = await UserSubscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });
    
    if (subscription) {
      subscription.status = stripeSubscription.status === 'active' ? 'active' : 'inactive';
      subscription.nextPaymentDate = new Date(stripeSubscription.current_period_end * 1000);
      await subscription.save();
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancellation(stripeSubscription) {
  try {
    const subscription = await UserSubscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });
    
    if (subscription) {
      await subscription.cancel('Cancelled via Stripe');
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

// TEST ENDPOINT: POST /subscriptions/test/plans - Create subscription plan without auth (FOR DEBUGGING ONLY)
router.post('/test/plans', async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`🧪 [${requestId}] TEST: Starting subscription plan creation (no auth)...`);
    console.log(`📋 [${requestId}] TEST: Request body:`, JSON.stringify(req.body, null, 2));
    
    const planData = req.body;
    
    // Detailed validation logging
    console.log(`✅ [${requestId}] TEST: Validating required fields...`);
    if (!planData.name) {
      console.log(`❌ [${requestId}] TEST: Validation failed: Missing name field`);
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name',
        requestId
      });
    }
    if (!planData.type) {
      console.log(`❌ [${requestId}] TEST: Validation failed: Missing type field`);
      return res.status(400).json({
        success: false,
        error: 'Missing required field: type',
        requestId
      });
    }
    if (planData.tier === undefined) {
      console.log(`❌ [${requestId}] TEST: Validation failed: Missing tier field`);
      return res.status(400).json({
        success: false,
        error: 'Missing required field: tier',
        requestId
      });
    }
    
    console.log(`✅ [${requestId}] TEST: All required fields present`);
    console.log(`🏗️ [${requestId}] TEST: Creating SubscriptionPlan instance...`);
    
    // Log the exact data being saved
    console.log(`📊 [${requestId}] TEST: Plan data for MongoDB:`, {
      name: planData.name,
      displayName: planData.displayName,
      description: planData.description,
      type: planData.type,
      tier: planData.tier,
      price: planData.price,
      features: planData.features ? Object.keys(planData.features) : 'undefined',
      isActive: planData.isActive,
      isVisible: planData.isVisible,
      isPopular: planData.isPopular,
      sortOrder: planData.sortOrder
    });
    
    const plan = new SubscriptionPlan(planData);
    
    console.log(`💾 [${requestId}] TEST: Attempting to save to MongoDB...`);
    const savedPlan = await plan.save();
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] TEST: Plan created successfully in ${duration}ms`);
    console.log(`🆔 [${requestId}] TEST: Created plan ID: ${savedPlan._id}`);
    
    // Clean up test plan
    await SubscriptionPlan.findByIdAndDelete(savedPlan._id);
    console.log(`🧹 [${requestId}] TEST: Test plan cleaned up`);
    
    res.status(201).json({
      success: true,
      message: 'TEST: Subscription plan created and cleaned up successfully',
      requestId,
      duration,
      data: {
        planId: savedPlan._id
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ [${requestId}] TEST: Error creating subscription plan after ${duration}ms:`, error);
    console.error(`🔍 [${requestId}] TEST: Error details:`, {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    // Send detailed error to Sentry with context
    if (global.Sentry) {
      global.Sentry.withScope((scope) => {
        scope.setTag('operation', 'subscription-plan-test');
        scope.setTag('requestId', requestId);
        scope.setLevel('error');
        scope.setContext('request', {
          body: req.body,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
        scope.setContext('error_details', {
          code: error.code,
          keyPattern: error.keyPattern,
          keyValue: error.keyValue,
          validationErrors: error.errors
        });
        global.Sentry.captureException(error);
      });
    }
    
    // Determine specific error type and message
    let errorMessage = 'TEST: Failed to create plan';
    let errorDetails = error.message;
    
    if (error.code === 11000) {
      console.error(`🔍 [${requestId}] TEST: Duplicate key error - unique constraint violation`);
      errorMessage = 'TEST: Plan with this type or tier already exists';
      errorDetails = `Duplicate key: ${JSON.stringify(error.keyValue)}`;
    } else if (error.name === 'ValidationError') {
      console.error(`🔍 [${requestId}] TEST: Mongoose validation error`);
      errorMessage = 'TEST: Invalid plan data';
      errorDetails = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
      console.error(`🔍 [${requestId}] TEST: Type casting error`);
      errorMessage = 'TEST: Invalid data type in plan fields';
      errorDetails = `${error.path}: ${error.value}`;
    }
    
    console.error(`📤 [${requestId}] TEST: Sending error response: ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: errorDetails,
      requestId,
      duration,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// 💳 EVERYPAY WEBHOOK INTEGRATION
// =====================================================

// POST /subscriptions/webhook/everypay - EveryPay webhook handler
router.post('/webhook/everypay', async (req, res) => {
  const requestId = `everypay-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();
  
  try {
    console.log(`🔔 EveryPay webhook received [${requestId}]`);
    console.log('📋 Webhook payload:', JSON.stringify(req.body, null, 2));
    
    const {
      token,
      amount,
      currency,
      status,
      date,
      customer_email,
      customer_name,
      order_reference,
      card_last_four,
      card_type,
      transaction_type
    } = req.body;
    
    // Validate required fields
    if (!token || !amount || !status) {
      console.log(`❌ Invalid webhook payload - missing required fields [${requestId}]`);
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        message: 'Missing required fields: token, amount, status',
        requestId
      });
    }
    
    // Process different payment events
    switch (status.toLowerCase()) {
      case 'settled':
      case 'completed':
      case 'success':
        await handleSuccessfulPayment(req.body, requestId);
        break;
        
      case 'failed':
      case 'error':
        await handleFailedPayment(req.body, requestId);
        break;
        
      case 'refunded':
        await handleRefundedPayment(req.body, requestId);
        break;
        
      case 'pending':
      case 'processing':
        await handlePendingPayment(req.body, requestId);
        break;
        
      default:
        console.log(`⚠️ Unknown payment status: ${status} [${requestId}]`);
        break;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ EveryPay webhook processed successfully [${requestId}] - ${duration}ms`);
    
    // Respond to EveryPay with success
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      requestId,
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown webhook processing error';
    
    console.log(`❌ EveryPay webhook processing failed [${requestId}]:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: errorMessage,
      requestId,
      duration,
      timestamp: new Date().toISOString()
    });
  }
});

// EveryPay webhook event handlers
async function handleSuccessfulPayment(payload, requestId) {
  try {
    console.log(`💰 Processing successful payment [${requestId}]`);
    
    const {
      token,
      amount,
      currency,
      customer_email,
      order_reference,
      date
    } = payload;
    
    // Find user by email
    const user = await mongoose.connection.db.collection('users').findOne({ 
      email: customer_email 
    });
    
    if (!user) {
      console.log(`⚠️ User not found for email: ${customer_email} [${requestId}]`);
      return;
    }
    
    // Create payment history record
    const paymentRecord = new PaymentHistory({
      userId: user._id,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      status: 'completed',
      provider: 'everypay',
      transactionId: token,
      metadata: {
        order_reference,
        customer_email,
        processed_at: new Date(date || Date.now()),
        webhook_request_id: requestId,
        raw_payload: payload
      }
    });
    
    await paymentRecord.save();
    console.log(`💾 Payment record saved for user ${user._id} [${requestId}]`);
    
    // If this is a subscription payment, update subscription status
    if (order_reference && order_reference.includes('subscription')) {
      await updateUserSubscription(user._id, payload, requestId);
    }
    
  } catch (error) {
    console.log(`❌ Error processing successful payment [${requestId}]:`, error);
    throw error;
  }
}

async function handleFailedPayment(payload, requestId) {
  try {
    console.log(`💔 Processing failed payment [${requestId}]`);
    
    const { token, customer_email, amount, currency } = payload;
    
    // Find user by email if available
    if (customer_email) {
      const user = await mongoose.connection.db.collection('users').findOne({ 
        email: customer_email 
      });
      
      if (user) {
        // Create failed payment record
        const paymentRecord = new PaymentHistory({
          userId: user._id,
          amount: parseFloat(amount || 0),
          currency: currency || 'EUR',
          status: 'failed',
          provider: 'everypay',
          transactionId: token,
          metadata: {
            customer_email,
            failed_at: new Date(),
            webhook_request_id: requestId,
            raw_payload: payload
          }
        });
        
        await paymentRecord.save();
        console.log(`💾 Failed payment record saved for user ${user._id} [${requestId}]`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error processing failed payment [${requestId}]:`, error);
    throw error;
  }
}

async function handleRefundedPayment(payload, requestId) {
  try {
    console.log(`💸 Processing refunded payment [${requestId}]`);
    
    const { token, customer_email, amount } = payload;
    
    // Find original payment by transaction ID
    const originalPayment = await PaymentHistory.findOne({
      transactionId: token,
      provider: 'everypay'
    });
    
    if (originalPayment) {
      // Update original payment status
      originalPayment.status = 'refunded';
      originalPayment.metadata.refunded_at = new Date();
      originalPayment.metadata.refund_webhook_id = requestId;
      await originalPayment.save();
      
      console.log(`💾 Payment refund processed for transaction ${token} [${requestId}]`);
      
      // If this was a subscription payment, handle subscription cancellation
      if (originalPayment.userId) {
        await handleSubscriptionRefund(originalPayment.userId, requestId);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error processing refunded payment [${requestId}]:`, error);
    throw error;
  }
}

async function handlePendingPayment(payload, requestId) {
  try {
    console.log(`⏳ Processing pending payment [${requestId}]`);
    
    const { token, customer_email, amount, currency } = payload;
    
    if (customer_email) {
      const user = await mongoose.connection.db.collection('users').findOne({ 
        email: customer_email 
      });
      
      if (user) {
        // Create pending payment record
        const paymentRecord = new PaymentHistory({
          userId: user._id,
          amount: parseFloat(amount || 0),
          currency: currency || 'EUR',
          status: 'pending',
          provider: 'everypay',
          transactionId: token,
          metadata: {
            customer_email,
            pending_since: new Date(),
            webhook_request_id: requestId,
            raw_payload: payload
          }
        });
        
        await paymentRecord.save();
        console.log(`💾 Pending payment record saved for user ${user._id} [${requestId}]`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error processing pending payment [${requestId}]:`, error);
    throw error;
  }
}

async function updateUserSubscription(userId, payload, requestId) {
  try {
    console.log(`🔄 Updating user subscription [${requestId}]`);
    
    // Find user's active subscription
    const subscription = await UserSubscription.findOne({
      userId: userId,
      status: { $in: ['active', 'pending', 'trial'] }
    });
    
    if (subscription) {
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date();
      
      // Calculate next billing date (30 days for monthly, 365 for yearly)
      const plan = await SubscriptionPlan.findById(subscription.planId);
      if (plan) {
        const daysToAdd = plan.billingPeriod === 'yearly' ? 365 : 30;
        subscription.currentPeriodEnd = new Date(Date.now() + (daysToAdd * 24 * 60 * 60 * 1000));
      }
      
      subscription.lastPaymentDate = new Date();
      await subscription.save();
      
      console.log(`✅ Subscription updated for user ${userId} [${requestId}]`);
    }
    
  } catch (error) {
    console.log(`❌ Error updating user subscription [${requestId}]:`, error);
    throw error;
  }
}

async function handleSubscriptionRefund(userId, requestId) {
  try {
    console.log(`🔄 Handling subscription refund [${requestId}]`);
    
    // Find and cancel user's subscription
    const subscription = await UserSubscription.findOne({
      userId: userId,
      status: 'active'
    });
    
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancelReason = 'payment_refunded';
      await subscription.save();
      
      console.log(`✅ Subscription cancelled due to refund for user ${userId} [${requestId}]`);
    }
    
  } catch (error) {
    console.log(`❌ Error handling subscription refund [${requestId}]:`, error);
    throw error;
  }
}

export default router;