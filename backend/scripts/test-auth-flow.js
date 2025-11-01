// Script to test registration and login flow
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/mongodb/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/runacademy';

async function testAuthFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test parameters
    const testEmail = 'test_' + Date.now() + '@example.com';
    const testPassword = 'TestPass123!';
    const testFirstName = 'Test';
    const testLastName = 'User';
    
    console.log('🧪 TEST 1: Password Hashing Consistency');
    console.log('─'.repeat(50));
    
    // Test bcrypt multiple times with same password
    const hashes = [];
    for (let i = 1; i <= 3; i++) {
      const hash = await bcrypt.hash(testPassword, 12);
      hashes.push(hash);
      console.log(`Hash ${i}: ${hash.substring(0, 30)}...`);
      
      // Verify each hash
      const isValid = await bcrypt.compare(testPassword, hash);
      console.log(`Verification ${i}: ${isValid ? '✅' : '❌'}`);
    }
    
    // Cross-verify hashes
    console.log('\n🔄 Cross-verification:');
    for (let i = 0; i < hashes.length; i++) {
      const isValid = await bcrypt.compare(testPassword, hashes[i]);
      console.log(`Password vs Hash ${i + 1}: ${isValid ? '✅' : '❌'}`);
    }
    
    console.log('\n🧪 TEST 2: User Registration Flow');
    console.log('─'.repeat(50));
    
    // Check password regex validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    console.log(`Password "${testPassword}" regex validation: ${passwordRegex.test(testPassword) ? '✅' : '❌'}`);
    
    // Create a test user
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const testUser = new User({
      firstName: testFirstName,
      lastName: testLastName,
      email: testEmail.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: true,
      birthDate: new Date('1990-01-01'),
      gender: 'male',
      role: 'user'
    });
    
    await testUser.save();
    console.log(`✅ Test user created: ${testEmail}`);
    console.log(`   Password hash: ${hashedPassword.substring(0, 30)}...`);
    
    console.log('\n🧪 TEST 3: Login Simulation');
    console.log('─'.repeat(50));
    
    // Fetch user from database (simulating login)
    const loginUser = await User.findOne({ email: testEmail.toLowerCase() });
    
    if (!loginUser) {
      console.log('❌ User not found!');
    } else {
      console.log(`✅ User found: ${loginUser.email}`);
      console.log(`   Has password: ${!!loginUser.password}`);
      console.log(`   Password hash: ${loginUser.password.substring(0, 30)}...`);
      console.log(`   Email verified: ${loginUser.isEmailVerified}`);
      
      // Test password comparison
      console.log('\n🔐 Password verification tests:');
      
      // Test with correct password
      const correctPasswordTest = await bcrypt.compare(testPassword, loginUser.password);
      console.log(`   Correct password "${testPassword}": ${correctPasswordTest ? '✅ PASS' : '❌ FAIL'}`);
      
      // Test with wrong password
      const wrongPasswordTest = await bcrypt.compare('WrongPassword123!', loginUser.password);
      console.log(`   Wrong password "WrongPassword123!": ${wrongPasswordTest ? '❌ SHOULD FAIL' : '✅ CORRECTLY REJECTED'}`);
      
      // Test with variations
      const variations = [
        testPassword.toLowerCase(),
        testPassword.toUpperCase(),
        testPassword + ' ',
        ' ' + testPassword
      ];
      
      console.log('\n   Testing password variations:');
      for (const variant of variations) {
        const variantTest = await bcrypt.compare(variant, loginUser.password);
        console.log(`   "${variant}": ${variantTest ? '⚠️ MATCHES' : '✅ REJECTED'}`);
      }
    }
    
    console.log('\n🧪 TEST 4: Check Existing Users');
    console.log('─'.repeat(50));
    
    // Find users that might have auth issues
    const problemUsers = await User.find({
      $or: [
        { password: { $exists: false } },
        { password: null },
        { password: '' },
        { isEmailVerified: false }
      ]
    }).limit(10);
    
    console.log(`Found ${problemUsers.length} users with potential auth issues:`);
    for (const user of problemUsers) {
      console.log(`   ${user.email}: Password=${!!user.password}, Verified=${user.isEmailVerified}`);
    }
    
    // Clean up test user
    await User.deleteOne({ email: testEmail.toLowerCase() });
    console.log(`\n🧹 Cleaned up test user: ${testEmail}`);
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testAuthFlow();