// Script to update production user role via direct database connection
import { connectMongoDB } from '../config/database.js';
import User from '../models/mongodb/user/user.model.js';

async function updateProductionAdmin() {
  try {
    const email = 'martins.donins@gmail.com';
    
    console.log('🔄 Connecting to production MongoDB...');
    
    // Use production MongoDB URI
    process.env.MONGODB_URI = "mongodb+srv://martinsdonins:DlLxlMSjcLbqqpjH@cluster0.f3fbkov.mongodb.net/runacademy?retryWrites=true&w=majority&appName=Cluster0";
    
    await connectMongoDB();
    
    console.log('🔍 Finding user in production database...');
    
    // Find all users with this email to see what's in the database
    const users = await User.find({ email: email.toLowerCase() });
    
    console.log(`Found ${users.length} users with email ${email}:`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('🆔 ID:', user._id);
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.firstName, user.lastName);
      console.log('👑 Role:', user.role);
      console.log('💎 Subscription:', user.subscriptionType);
      console.log('🔒 Permissions:', user.permissions);
      console.log('📅 Created:', user.createdAt);
      console.log('📅 Updated:', user.updatedAt);
    });
    
    if (users.length > 0) {
      console.log('\n🔄 Updating user role to super_admin...');
      
      const updateResult = await User.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            role: 'super_admin',
            subscriptionType: 'pro',
            permissions: ['all'],
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Update result:', updateResult);
      
      // Verify the update
      const updatedUser = await User.findOne({ email: email.toLowerCase() });
      console.log('\n✅ Updated user verification:');
      console.log('👑 Role:', updatedUser.role);
      console.log('💎 Subscription:', updatedUser.subscriptionType);
      console.log('🔒 Permissions:', updatedUser.permissions);
      
      if (updatedUser.role === 'super_admin') {
        console.log('\n🎉 SUCCESS: User role updated to super_admin in production database!');
      } else {
        console.log('\n❌ FAILED: User role was not updated');
      }
    } else {
      console.log('\n❌ No user found with that email');
    }
    
  } catch (error) {
    console.error('❌ Error updating production admin:', error);
  } finally {
    process.exit(0);
  }
}

updateProductionAdmin();