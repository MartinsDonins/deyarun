// Script to drop unique indexes from SubscriptionPlan collection
// Run this once to remove old unique constraints after model update

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dropUniqueIndexes = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    console.log('🔗 URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/runacademy');
    
    console.log('✅ Connected to MongoDB');
    
    // Get the collection
    const collection = mongoose.connection.db.collection('subscriptionplans');
    
    // List existing indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });
    
    // Drop unique indexes if they exist
    try {
      console.log('🗑️  Attempting to drop type unique index...');
      await collection.dropIndex('type_1');
      console.log('✅ Dropped type unique index');
    } catch (error) {
      console.log('ℹ️  Type unique index not found or already dropped');
    }
    
    try {
      console.log('🗑️  Attempting to drop tier unique index...');
      await collection.dropIndex('tier_1'); 
      console.log('✅ Dropped tier unique index');
    } catch (error) {
      console.log('ℹ️  Tier unique index not found or already dropped');
    }
    
    // List indexes after cleanup
    console.log('📋 Indexes after cleanup:');
    const newIndexes = await collection.listIndexes().toArray();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });
    
    console.log('✅ Index cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during index cleanup:', error);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
};

// Run the script if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  dropUniqueIndexes()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { dropUniqueIndexes };