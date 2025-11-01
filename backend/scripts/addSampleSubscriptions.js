#!/usr/bin/env node

// Add Sample Subscription Data - MongoDB Migration Support
// This script creates sample subscription plans and user subscriptions for testing admin panel

import { connectMongoDB, closeConnections } from '../config/database.js';
import { SubscriptionPlan, UserSubscription, User } from '../models/mongodb/index.js';

console.log('🚀 Starting sample subscription data creation...');

const sampleSubscriptionPlans = [
  {
    name: 'free',
    displayName: 'Free Plan',
    description: 'Basic access to running features with community support',
    type: 'free',
    tier: 1,
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'EUR'
    },
    features: {
      courseAccess: 'basic',
      maxCoursesPerMonth: 1,
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
    isPopular: false,
    sortOrder: 1
  },
  {
    name: 'premium',
    displayName: 'Premium Plan',
    description: 'Advanced features with personalized plans and analytics',
    type: 'premium',
    tier: 2,
    price: {
      monthly: 9.99,
      yearly: 99.99,
      currency: 'EUR'
    },
    features: {
      courseAccess: 'premium',
      maxCoursesPerMonth: 5,
      maxWorkoutsPerWeek: 10,
      advancedAnalytics: true,
      personalizedPlans: true,
      downloadableContent: true,
      offlineMode: true,
      prioritySupport: false,
      personalCoaching: false,
      communityAccess: true,
      exclusiveEvents: false
    },
    isActive: true,
    isVisible: true,
    isPopular: true,
    sortOrder: 2,
    discount: {
      percentage: 20,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Limited time offer - 20% off first month!'
    }
  },
  {
    name: 'pro',
    displayName: 'Pro Plan',
    description: 'Professional coaching with all features and priority support',
    type: 'pro',
    tier: 3,
    price: {
      monthly: 19.99,
      yearly: 199.99,
      currency: 'EUR'
    },
    features: {
      courseAccess: 'unlimited',
      maxCoursesPerMonth: -1, // unlimited
      maxWorkoutsPerWeek: -1, // unlimited
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
    sortOrder: 3
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise Plan',
    description: 'Custom solution for teams and organizations',
    type: 'enterprise',
    tier: 4,
    price: {
      monthly: 49.99,
      yearly: 499.99,
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
    isVisible: false, // Not visible to regular users
    isPopular: false,
    sortOrder: 4
  }
];

async function createSampleData() {
  try {
    await connectMongoDB();
    console.log('📊 Connected to MongoDB');

    // 1. Create subscription plans
    console.log('🏷️ Creating subscription plans...');
    
    for (const planData of sampleSubscriptionPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });
      
      if (existingPlan) {
        console.log(`   ⚠️ Plan "${planData.name}" already exists, updating...`);
        await SubscriptionPlan.findByIdAndUpdate(existingPlan._id, planData);
      } else {
        console.log(`   ✅ Creating plan "${planData.name}"`);
        await SubscriptionPlan.create(planData);
      }
    }

    // 2. Get created plans
    const createdPlans = await SubscriptionPlan.find();
    console.log(`📋 Created/Updated ${createdPlans.length} subscription plans`);

    // 3. Get some users to create sample subscriptions for
    const users = await User.find().limit(10);
    console.log(`👥 Found ${users.length} users for creating sample subscriptions`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Creating a sample user first...');
      
      const sampleUser = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword123', // This should be properly hashed
        isEmailVerified: true,
        subscriptionType: 'free',
        role: 'user'
      });
      
      users.push(sampleUser);
      console.log('✅ Created sample user:', sampleUser.email);
    }

    // 4. Create sample user subscriptions
    console.log('💳 Creating sample user subscriptions...');

    const subscriptionStatuses = ['active', 'inactive', 'expired', 'trial', 'cancelled'];
    const planTypes = ['free', 'premium', 'pro'];
    
    for (let i = 0; i < Math.min(users.length, 8); i++) {
      const user = users[i];
      const randomPlanType = planTypes[Math.floor(Math.random() * planTypes.length)];
      const randomStatus = subscriptionStatuses[Math.floor(Math.random() * subscriptionStatuses.length)];
      const plan = createdPlans.find(p => p.type === randomPlanType);
      
      if (!plan) continue;

      // Check if user already has subscription
      const existingSubscription = await UserSubscription.findOne({ userId: user._id });
      
      if (existingSubscription) {
        console.log(`   ⚠️ User ${user.email} already has subscription, updating...`);
        
        existingSubscription.planType = randomPlanType;
        existingSubscription.planId = plan._id;
        existingSubscription.status = randomStatus;
        existingSubscription.amount = plan.price.monthly;
        existingSubscription.usage.workoutsCompleted = Math.floor(Math.random() * 50);
        existingSubscription.usage.coursesCompleted = Math.floor(Math.random() * 10);
        
        await existingSubscription.save();
      } else {
        console.log(`   ✅ Creating subscription for ${user.email} (${randomPlanType})`);
        
        // Create subscription dates
        const startDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random start within last 90 days
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
        
        const subscription = await UserSubscription.create({
          userId: user._id,
          planType: randomPlanType,
          planId: plan._id,
          status: randomStatus,
          billingCycle: Math.random() > 0.5 ? 'monthly' : 'yearly',
          amount: plan.price.monthly,
          currency: plan.price.currency,
          startDate: startDate,
          endDate: endDate,
          usage: {
            workoutsCompleted: Math.floor(Math.random() * 50),
            coursesCompleted: Math.floor(Math.random() * 10),
            lastActivityDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
            monthlyUsage: [
              {
                month: new Date().toISOString().slice(0, 7),
                workoutsCompleted: Math.floor(Math.random() * 15),
                coursesAccessed: Math.floor(Math.random() * 5),
                totalTimeSpent: Math.floor(Math.random() * 3600) // Random hours
              }
            ]
          }
        });

        // Update user's subscription type
        await User.findByIdAndUpdate(user._id, { subscriptionType: randomPlanType });
      }
    }

    // 5. Display summary
    const totalSubscriptions = await UserSubscription.countDocuments();
    const totalPlans = await SubscriptionPlan.countDocuments();
    
    console.log('\n📊 Summary:');
    console.log(`   📋 Subscription Plans: ${totalPlans}`);
    console.log(`   💳 User Subscriptions: ${totalSubscriptions}`);
    
    // Show breakdown by plan type
    const subscriptionStats = await UserSubscription.aggregate([
      { $group: { _id: '$planType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📈 Subscription Distribution:');
    subscriptionStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} users`);
    });

    console.log('\n✅ Sample subscription data created successfully!');
    console.log('🌐 You can now view subscriptions in the admin panel at /admin/subscriptions');

  } catch (error) {
    console.error('❌ Error creating sample subscription data:', error);
  } finally {
    await closeConnections();
  }
}

// Run the script
createSampleData().catch(console.error);