// Debug script for onboarding issues with specific user
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/mongodb/index.js';
import { getJwtSecret } from '../utils/jwtUtils.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/runacademy';
const USER_ID = '689c9c47c6060c1d034042af';

async function findUserByAnyField(searchId) {
  // Try multiple approaches to find the user
  const queries = [
    { _id: searchId },
    { postgresId: searchId },
    { postgresId: parseInt(searchId, 16) }, // Try as number if hex
  ];

  // Also try as ObjectId if it looks like one
  try {
    if (mongoose.Types.ObjectId.isValid(searchId)) {
      queries.push({ _id: new mongoose.Types.ObjectId(searchId) });
    }
  } catch (e) {
    // Ignore ObjectId conversion errors
  }

  for (const query of queries) {
    try {
      const user = await User.findOne(query);
      if (user) {
        console.log(`✅ User found with query:`, query);
        return user;
      }
    } catch (e) {
      console.log(`   Query failed:`, query, e.message);
    }
  }

  return null;
}

async function debugOnboardingUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Debugging user: ${USER_ID}\n`);

    // Find user by any matching field
    const user = await findUserByAnyField(USER_ID);
    
    if (!user) {
      console.log('❌ User not found by any method');
      
      // Let's search for recent users to see what IDs look like
      console.log('\n📋 Recent users in database:');
      const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(5);
      recentUsers.forEach((u, i) => {
        console.log(`   ${i+1}. ${u.email} - ID: ${u._id} - PostgresId: ${u.postgresId || 'N/A'}`);
      });
      
      return;
    } else {
      console.log('✅ User found:', user.email);
      await analyzeUser(user);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

async function analyzeUser(user) {
  console.log('\n📊 User Analysis:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
  console.log(`   ID: ${user._id}`);
  console.log(`   PostgresId: ${user.postgresId || 'N/A'}`);
  console.log(`   Created: ${user.createdAt}`);
  console.log(`   Email Verified: ${user.isEmailVerified}`);

  console.log('\n🎯 Onboarding Status:');
  console.log(`   Onboarding Completed: ${user.onboardingCompleted || false}`);
  console.log(`   Onboarding Completed At: ${user.onboardingCompletedAt || 'N/A'}`);

  console.log('\n📝 Profile Completion:');
  console.log(`   Height: ${user.height || 'N/A'}`);
  console.log(`   Weight: ${user.weight || 'N/A'}`);
  console.log(`   Birth Date: ${user.birthDate || 'N/A'}`);
  console.log(`   Gender: ${user.gender || 'N/A'}`);
  console.log(`   Fitness Level: ${user.fitnessLevel || 'N/A'}`);
  console.log(`   Sleep Hours: ${user.sleepHours || 'N/A'}`);
  console.log(`   Stress Level: ${user.stressLevel || 'N/A'}`);
  console.log(`   Weekly Goal: ${user.weeklyGoal || 'N/A'}`);
  console.log(`   Preferred Distance: ${user.preferredDistance || 'N/A'}`);

  // Check onboarding completion criteria
  const profileComplete = !!(user.height && user.weight && user.birthDate && user.gender);
  const healthComplete = !!(user.fitnessLevel && user.stressLevel);
  const goalsComplete = !!(user.weeklyGoal && user.preferredDistance);

  console.log('\n✅ Completion Status:');
  console.log(`   Profile Step: ${profileComplete ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`   Health Step: ${healthComplete ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`   Goals Step: ${goalsComplete ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`   Ready for Dashboard: ${profileComplete && healthComplete && goalsComplete ? '✅ YES' : '❌ NO'}`);

  // Test JWT token creation
  console.log('\n🔐 JWT Token Test:');
  try {
    const testToken = jwt.sign(
      { 
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user'
      }, 
      getJwtSecret(), 
      { expiresIn: '7d' }
    );
    
    console.log(`   Token Creation: ✅ Success`);
    console.log(`   Token Preview: ${testToken.substring(0, 50)}...`);
    
    // Verify token
    const decoded = jwt.verify(testToken, getJwtSecret());
    console.log(`   Token Verification: ✅ Success`);
    console.log(`   Decoded userId: ${decoded.userId}`);
    console.log(`   Decoded id: ${decoded.id}`);
    
  } catch (tokenError) {
    console.log(`   Token Error: ❌ ${tokenError.message}`);
  }

  // Test onboarding completion update
  console.log('\n🧪 Testing Onboarding Completion:');
  try {
    const updateResult = await User.findOneAndUpdate(
      {
        $or: [
          { postgresId: user._id.toString() },
          { _id: user._id }
        ]
      },
      { 
        $set: { 
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (updateResult) {
      console.log(`   Update Test: ✅ Success`);
      console.log(`   Updated User: ${updateResult.email}`);
      console.log(`   Onboarding Completed: ${updateResult.onboardingCompleted}`);
      
      // Revert the test change
      await User.findByIdAndUpdate(user._id, {
        $set: {
          onboardingCompleted: user.onboardingCompleted || false,
          onboardingCompletedAt: user.onboardingCompletedAt || null,
          updatedAt: user.updatedAt
        }
      });
      console.log(`   Test Reverted: ✅ Success`);
      
    } else {
      console.log(`   Update Test: ❌ Failed - User not found in update query`);
    }
    
  } catch (updateError) {
    console.log(`   Update Error: ❌ ${updateError.message}`);
  }

  console.log('\n💡 Recommendations:');
  if (!profileComplete) {
    console.log('   • User needs to complete profile (height, weight, birthDate, gender)');
  }
  if (!healthComplete) {
    console.log('   • User needs to complete health info (fitnessLevel, stressLevel)');
  }
  if (!goalsComplete) {
    console.log('   • User needs to complete goals (weeklyGoal, preferredDistance)');
  }
  if (profileComplete && healthComplete && goalsComplete) {
    console.log('   • User profile is complete - onboarding should work');
    console.log('   • Check frontend token storage and API calls');
  }
}

debugOnboardingUser();