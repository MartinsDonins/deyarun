// MongoDB Subscription Plans Seeder
import mongoose from 'mongoose';
import { SubscriptionPlan } from '../models/mongodb/index.js';
import dotenv from 'dotenv';

dotenv.config();

const subscriptionPlans = [
  {
    name: 'Bezmaksas',
    displayName: 'Bezmaksas plāns',
    description: 'Pamata funkcionalitāte bez maksas. Ideāls iesācējiem.',
    type: 'free',
    tier: 0,
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
    isPopular: false,
    sortOrder: 1
  },
  {
    name: 'Premium',
    displayName: 'Premium plāns',
    description: 'Uzlabota funkcionalitāte ar AI atbalstu un neierobežotiem treniņplāniem.',
    type: 'premium',
    tier: 1,
    price: {
      monthly: 19.99,
      yearly: 199.90, // ~2 months free
      currency: 'EUR'
    },
    features: {
      courseAccess: 'premium',
      maxCoursesPerMonth: 0, // unlimited
      maxWorkoutsPerWeek: 0, // unlimited
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
    name: 'Pro',
    displayName: 'Pro plāns',
    description: 'Profesionāla funkcionalitāte ar personīgo treneri un 1-uz-1 konsultācijām.',
    type: 'pro',
    tier: 2,
    price: {
      monthly: 39.99,
      yearly: 399.90, // ~3 months free
      currency: 'EUR'
    },
    features: {
      courseAccess: 'unlimited',
      maxCoursesPerMonth: 0, // unlimited
      maxWorkoutsPerWeek: 0, // unlimited
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
  }
];

async function seedSubscriptionPlans() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/runacademy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('🌱 Seeding subscription plans...');

    // Check if plans already exist
    const existingPlans = await SubscriptionPlan.find({});
    
    if (existingPlans.length > 0) {
      console.log(`📝 Found ${existingPlans.length} existing subscription plans. Updating...`);
      
      // Update existing plans
      for (const planData of subscriptionPlans) {
        const existingPlan = await SubscriptionPlan.findOne({ type: planData.type });
        
        if (existingPlan) {
          await SubscriptionPlan.findByIdAndUpdate(
            existingPlan._id,
            planData,
            { new: true, upsert: false }
          );
          console.log(`✅ Updated plan: ${planData.name}`);
        } else {
          const newPlan = new SubscriptionPlan(planData);
          await newPlan.save();
          console.log(`✅ Created new plan: ${planData.name}`);
        }
      }
    } else {
      console.log('📝 No existing plans found. Creating new plans...');
      
      // Create new plans
      for (const planData of subscriptionPlans) {
        const newPlan = new SubscriptionPlan(planData);
        await newPlan.save();
        console.log(`✅ Created plan: ${planData.name}`);
      }
    }

    console.log('🎉 All subscription plans seeded successfully!');
    
    // Display summary
    const allPlans = await SubscriptionPlan.find({}).sort({ sortOrder: 1 });
    
    console.log('\n📊 Subscription Plans Summary:');
    console.log('━'.repeat(80));
    console.log('Name'.padEnd(15) + 'Price (Monthly)'.padEnd(20) + 'Price (Yearly)'.padEnd(20) + 'Status'.padEnd(10) + 'Popular');
    console.log('━'.repeat(80));
    
    allPlans.forEach(plan => {
      const monthlyPrice = plan.price.monthly === 0 ? 'Free' : `€${plan.price.monthly}`;
      const yearlyPrice = plan.price.yearly === 0 ? 'Free' : `€${plan.price.yearly}`;
      const status = plan.isActive ? '✅ Active' : '❌ Inactive';
      const popular = plan.isPopular ? '⭐ Popular' : '';
      
      console.log(
        plan.name.padEnd(15) + 
        monthlyPrice.padEnd(20) + 
        yearlyPrice.padEnd(20) + 
        status.padEnd(10) + 
        popular
      );
    });
    console.log('━'.repeat(80));
    
    console.log(`\n📈 Total plans created: ${allPlans.length}`);
    console.log(`🎯 Active plans: ${allPlans.filter(p => p.isActive).length}`);
    console.log(`⭐ Popular plans: ${allPlans.filter(p => p.isPopular).length}`);
    
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  seedSubscriptionPlans()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedSubscriptionPlans };
export default seedSubscriptionPlans;