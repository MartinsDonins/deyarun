// Script to create or update super admin user in MongoDB
import { connectMongoDB } from '../config/database.js';
import User from '../models/mongodb/user/user.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Generate cryptographically secure password
function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

async function createSuperAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@deyarun.com';
    const password = process.env.ADMIN_PASSWORD || generateSecurePassword();
    
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    console.log('🔍 Checking if super admin user exists...');
    
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (user) {
      // Update existing user to super admin
      user = await User.findByIdAndUpdate(user._id, {
        role: 'super_admin',
        subscriptionType: 'pro',
        isEmailVerified: true,
        permissions: ['all'],
        password: hashedPassword, // Update password too
        updatedAt: new Date()
      }, { new: true });
      
      console.log('✅ Super admin user updated successfully');
    } else {
      // Create new super admin user
      user = await User.create({
        firstName: process.env.ADMIN_FIRSTNAME || 'Admin',
        lastName: process.env.ADMIN_LASTNAME || 'User',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'super_admin',
        subscriptionType: 'pro',
        birthDate: new Date('1990-01-01'),
        gender: 'other',
        isEmailVerified: true,
        isProfileComplete: true,
        permissions: ['all'],
        onboardingCompleted: true,
        fitnessLevel: 'advanced',
        weeklyGoal: 50,
        targetEventType: 'general'
      });
      
      console.log('✅ Super admin user created successfully');
    }
    
    console.log('📧 Email:', user.email);
    // SECURITY: Password is NOT logged for security reasons
    console.log('🔑 Password: [SET_VIA_ENVIRONMENT_VARIABLE]');
    console.log('👑 Role:', user.role);
    console.log('💎 Subscription:', user.subscriptionType);
    console.log('🆔 MongoDB ID:', user._id);
    console.log('🔒 Permissions:', user.permissions);
    
    // SECURITY: Store password securely for production use
    if (!process.env.ADMIN_PASSWORD) {
      console.log('⚠️  WARNING: No ADMIN_PASSWORD environment variable set');
      console.log('🔧 Generated secure password for this session');
      console.log('💡 Set ADMIN_PASSWORD environment variable for production');
    }
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    process.exit(0);
  }
}

async function checkSuperAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@deyarun.com';
    
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    console.log('🔍 Checking super admin user status...');
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log('✅ User found in MongoDB:');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.firstName, user.lastName);
      console.log('👑 Role:', user.role);
      console.log('💎 Subscription:', user.subscriptionType);
      console.log('🆔 MongoDB ID:', user._id);
      console.log('🔒 Permissions:', user.permissions);
      console.log('✅ Email Verified:', user.isEmailVerified);
      console.log('📅 Created:', user.createdAt);
      console.log('📅 Updated:', user.updatedAt);
      
      // Check if user has super admin privileges
      if (user.role === 'super_admin') {
        console.log('🎉 User has SUPER ADMIN privileges!');
      } else {
        console.log('⚠️  User does NOT have super admin privileges');
        console.log('🔧 Current role:', user.role);
      }
    } else {
      console.log('❌ User NOT found in MongoDB');
      console.log('💡 Run this script with "create" argument to create the user');
    }
    
  } catch (error) {
    console.error('❌ Error checking super admin:', error);
  } finally {
    process.exit(0);
  }
}

// Main function
async function main() {
  const action = process.argv[2];
  
  if (action === 'create') {
    await createSuperAdmin();
  } else {
    await checkSuperAdmin();
  }
}

main();