// Script to check subscription API endpoints and data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SubscriptionPlan, UserSubscription } from '../models/mongodb/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/runacademy';

async function checkSubscriptionAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Checking subscription API data...\n');

    // Check subscription plans
    console.log('📋 Subscription Plans:');
    const plans = await SubscriptionPlan.find({});
    
    if (plans.length === 0) {
      console.log('   ❌ No subscription plans found in database!');
      console.log('   💡 This explains the 404 error - no plans to return\n');
      
      // Create basic plans
      console.log('🔧 Creating basic subscription plans...');
      
      const basicPlans = [
        {
          type: 'free',
          name: 'Free',
          description: 'Basic features for casual runners',
          price: {
            monthly: 0,
            yearly: 0,
            currency: 'EUR'
          },
          features: [
            'Up to 5 workouts per month',
            'Basic progress tracking',
            'Community access'
          ],
          tier: 1,
          isActive: true,
          isVisible: true,
          sortOrder: 1
        },
        {
          type: 'premium',
          name: 'Premium',
          description: 'Advanced features for serious runners',
          price: {
            monthly: 9.99,
            yearly: 99.99,
            currency: 'EUR'
          },
          features: [
            'Unlimited workouts',
            'Advanced analytics',
            'Custom training plans',
            'AI coaching recommendations'
          ],
          tier: 2,
          isActive: true,
          isVisible: true,
          sortOrder: 2
        },
        {
          type: 'pro',
          name: 'Pro',
          description: 'Professional features for elite athletes',
          price: {
            monthly: 19.99,
            yearly: 199.99,
            currency: 'EUR'
          },
          features: [
            'Everything in Premium',
            'Personal coach access',
            'Advanced performance metrics',
            'Priority support',
            'Race strategy planning'
          ],
          tier: 3,
          isActive: true,
          isVisible: true,
          sortOrder: 3
        }
      ];

      for (const planData of basicPlans) {
        const plan = new SubscriptionPlan(planData);
        await plan.save();
        console.log(`   ✅ Created ${planData.name} plan (${planData.type})`);
      }
      
      console.log('   🎯 All basic plans created!\n');
    } else {
      console.log(`   ✅ Found ${plans.length} subscription plans:`);
      plans.forEach(plan => {
        console.log(`   • ${plan.name} (${plan.type}) - €${plan.price.monthly}/month - ${plan.isActive ? 'Active' : 'Inactive'}`);
      });
      console.log('');
    }

    // Check user subscriptions
    console.log('👥 User Subscriptions:');
    const subscriptions = await UserSubscription.find({}).limit(5);
    
    if (subscriptions.length === 0) {
      console.log('   ℹ️  No user subscriptions found (this is normal for new users)\n');
    } else {
      console.log(`   ✅ Found ${subscriptions.length} user subscriptions:`);
      subscriptions.forEach(sub => {
        console.log(`   • User: ${sub.userId} - Plan: ${sub.planType} - Status: ${sub.status}`);
      });
      console.log('');
    }

    // Test API structure
    console.log('🧪 API Structure Test:');
    console.log('   Expected endpoint: POST /api/subscriptions/create');
    console.log('   Expected body: { planType, billingCycle, paymentMethodId }');
    console.log('   Available plan types:', plans.map(p => p.type).join(', '));
    console.log('');

    console.log('✅ Subscription API check completed!');
    console.log('💡 If frontend still gets 404, check:');
    console.log('   1. Backend server is running');
    console.log('   2. Routes are properly registered in server.js');
    console.log('   3. CORS settings allow frontend domain');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkSubscriptionAPI();