#!/usr/bin/env node

// Fix Exercise Model Indexes - Remove Parallel Array Index
// This script removes the problematic compound index on parallel arrays and creates separate indexes

import { connectMongoDB, closeConnections } from '../config/database.js';
import Exercise from '../models/Exercise.js';

console.log('🚀 Starting Exercise indexes fix...');

async function fixExerciseIndexes() {
  try {
    await connectMongoDB();
    console.log('📊 Connected to MongoDB');

    // Get the Exercise collection
    const collection = Exercise.collection;
    
    console.log('🔍 Checking existing indexes...');
    const existingIndexes = await collection.indexes();
    console.log('📋 Current indexes:', existingIndexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      background: idx.background
    })));

    // Check if the problematic compound index exists
    const problematicIndexName = 'trainingPhase_1_workoutTypes_1';
    const hasProblematicIndex = existingIndexes.some(idx => idx.name === problematicIndexName);
    
    if (hasProblematicIndex) {
      console.log(`❌ Found problematic compound index: ${problematicIndexName}`);
      console.log('🔄 Dropping the problematic index...');
      
      try {
        await collection.dropIndex(problematicIndexName);
        console.log('✅ Successfully dropped problematic compound index');
      } catch (dropError) {
        if (dropError.codeName === 'IndexNotFound') {
          console.log('⚠️ Index was already dropped or does not exist');
        } else {
          console.error('❌ Error dropping index:', dropError);
          throw dropError;
        }
      }
    } else {
      console.log('✅ No problematic compound index found');
    }

    // Ensure separate indexes exist
    console.log('🔄 Creating/ensuring separate indexes...');
    
    try {
      // Create individual indexes for the array fields
      await collection.createIndex({ trainingPhase: 1 }, { 
        background: true,
        name: 'trainingPhase_1'
      });
      console.log('✅ Created/ensured trainingPhase index');
      
      await collection.createIndex({ workoutTypes: 1 }, { 
        background: true,
        name: 'workoutTypes_1' 
      });
      console.log('✅ Created/ensured workoutTypes index');
      
    } catch (indexError) {
      if (indexError.codeName === 'IndexOptionsConflict' || indexError.message.includes('already exists')) {
        console.log('⚠️ Indexes already exist with different options, continuing...');
      } else {
        console.error('❌ Error creating indexes:', indexError);
        throw indexError;
      }
    }

    // Verify the fix by attempting to create a test document
    console.log('🧪 Testing document creation...');
    
    const testExercise = {
      name: 'Test Exercise - Index Fix',
      description: 'This is a test exercise to verify the index fix works correctly',
      instructions: 'Test instructions to ensure no index conflicts occur',
      category: 'warm-up',
      difficulty: 'beginner',
      targetMuscleGroups: ['legs'],
      trainingPhase: ['base-building'], // Array field
      workoutTypes: ['running'],        // Array field  
      equipment: ['none'],
      video: {
        provider: 'firebase',
        aspectRatio: '16:9',
        quality: '720p'
      },
      aiTags: [],
      contraindications: [],
      benefits: [],
      isActive: true,
      isPublic: false // Make it not public so it doesn't interfere with real data
    };

    console.log('💾 Creating test exercise...');
    const exercise = new Exercise(testExercise);
    await exercise.save();
    console.log('✅ Test exercise created successfully with ID:', exercise._id);
    
    // Clean up test exercise
    console.log('🧹 Cleaning up test exercise...');
    await Exercise.findByIdAndDelete(exercise._id);
    console.log('✅ Test exercise cleaned up');

    // Show final index status
    console.log('🔍 Final index status:');
    const finalIndexes = await collection.indexes();
    const relevantIndexes = finalIndexes.filter(idx => 
      idx.name.includes('trainingPhase') || 
      idx.name.includes('workoutTypes') ||
      idx.name === '_id_'
    );
    
    console.log('📋 Relevant indexes after fix:');
    relevantIndexes.forEach(idx => {
      console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Exercise indexes fix completed successfully!');
    console.log('🌐 The Create Exercise button should now work without errors.');

  } catch (error) {
    console.error('❌ Error fixing exercise indexes:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  } finally {
    await closeConnections();
  }
}

// Run the script
fixExerciseIndexes().catch(console.error);