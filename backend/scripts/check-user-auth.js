// Script to check user authentication status
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/mongodb/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/runacademy';

async function checkUserAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.argv[2];
    const testPassword = process.argv[3];

    if (!email) {
      console.error('❌ Usage: node check-user-auth.js <email> [test-password]');
      process.exit(1);
    }

    // Find all users with similar email
    const users = await User.find({ 
      email: { $regex: email, $options: 'i' } 
    });
    
    console.log(`\n📊 Found ${users.length} user(s) matching "${email}":\n`);
    
    for (const user of users) {
      console.log(`👤 User: ${user.firstName} ${user.lastName}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Verified: ${user.isEmailVerified ? '✅' : '❌'}`);
      console.log(`   Has Password: ${user.password ? '✅' : '❌'}`);
      console.log(`   Password Length: ${user.password ? user.password.length : 0}`);
      console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NONE'}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Google ID: ${user.googleId ? '✅' : '❌'}`);
      console.log(`   Apple ID: ${user.appleId ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log(`   Login Count: ${user.loginCount || 0}`);
      
      if (testPassword && user.password) {
        console.log(`\n   🔐 Testing password "${testPassword}"...`);
        try {
          const isValid = await bcrypt.compare(testPassword, user.password);
          console.log(`   Result: ${isValid ? '✅ PASSWORD CORRECT!' : '❌ Password incorrect'}`);
          
          if (!isValid) {
            // Try some common passwords
            const commonPasswords = [
              'runacademy2024',
              'DeyaRun2024',
              'martinslai',
              'password123',
              'Password123!',
              'admin123'
            ];
            
            console.log(`\n   🔍 Testing common passwords...`);
            for (const commonPass of commonPasswords) {
              const isCommonValid = await bcrypt.compare(commonPass, user.password);
              if (isCommonValid) {
                console.log(`   ✅ Found working password: ${commonPass}`);
                break;
              }
            }
          }
        } catch (error) {
          console.log(`   ❌ Error testing password: ${error.message}`);
        }
      }
      
      console.log('\n' + '─'.repeat(60) + '\n');
    }
    
    // Check login process
    if (users.length === 1 && testPassword) {
      const user = users[0];
      console.log('🔍 Simulating login process...\n');
      
      // 1. Check if user exists
      console.log(`1. User exists: ${user ? '✅' : '❌'}`);
      
      // 2. Check if has password
      console.log(`2. Has password: ${user.password ? '✅' : '❌'}`);
      
      if (user.password) {
        // 3. Check password match
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`3. Password valid: ${isPasswordValid ? '✅' : '❌'}`);
        
        // 4. Check email verified
        console.log(`4. Email verified: ${user.isEmailVerified ? '✅' : '❌'}`);
        
        if (!isPasswordValid) {
          console.log('\n❌ LOGIN WOULD FAIL: Invalid password');
        } else if (!user.isEmailVerified) {
          console.log('\n⚠️ LOGIN WOULD FAIL: Email not verified');
        } else {
          console.log('\n✅ LOGIN WOULD SUCCEED!');
        }
      } else {
        console.log('\n❌ LOGIN WOULD FAIL: No password set (social login account?)');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkUserAuth();