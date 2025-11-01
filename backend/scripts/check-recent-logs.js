// Script to check recent login activity and token generation
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/mongodb/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/runacademy';

async function checkRecentActivity() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Searching for user activity...\n');

    // Find all users and look for the rocket ID pattern
    const allUsers = await User.find({}).sort({ updatedAt: -1 }).limit(10);
    
    console.log('📋 Recent users (last 10 by update time):');
    allUsers.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email}`);
      console.log(`      ID: ${user._id}`);
      console.log(`      PostgresId: ${user.postgresId || 'N/A'}`);
      console.log(`      Last Login Count: ${user.loginCount || 0}`);
      console.log(`      Updated: ${user.updatedAt}`);
      console.log(`      Email Verified: ${user.isEmailVerified}`);
      
      // Check if any part of the ID matches our search
      const searchId = '689c9c47c6060c1d034042af';
      const userId = user._id.toString();
      const postgresId = user.postgresId || '';
      
      if (userId.includes('689c9c47') || postgresId.includes('689c9c47')) {
        console.log(`      🎯 POTENTIAL MATCH!`);
      }
      
      console.log('');
    });

    // Also check for users with recent onboarding activity
    console.log('\n🎯 Users with recent onboarding activity:');
    const onboardingUsers = await User.find({
      $or: [
        { onboardingCompleted: { $exists: true } },
        { onboardingCompletedAt: { $exists: true } },
        { updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
      ]
    }).sort({ updatedAt: -1 });
    
    onboardingUsers.forEach((user, i) => {
      if (i < 5) { // Limit to 5 for readability
        console.log(`   ${i+1}. ${user.email} - Onboarding: ${user.onboardingCompleted || false}`);
        console.log(`      Last Updated: ${user.updatedAt}`);
        console.log(`      ID: ${user._id}`);
      }
    });

    // Search specifically for any ID containing the hex pattern
    console.log('\n🔍 Searching for hex pattern in database...');
    const hexPattern = '689c9c47';
    const regexPattern = new RegExp(hexPattern, 'i');
    
    // Search in email field (sometimes IDs get logged there)
    const emailMatches = await User.find({
      email: regexPattern
    });
    
    if (emailMatches.length > 0) {
      console.log('📧 Found matches in email field:');
      emailMatches.forEach(user => {
        console.log(`   • ${user.email} - ID: ${user._id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkRecentActivity();