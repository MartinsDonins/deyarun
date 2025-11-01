// Test course enrollment endpoint debugging
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongoDB } from '../config/database.js';
import { Course, UserProgress, User } from '../models/mongodb/index.js';

async function testEnrollment() {
  try {
    await connectMongoDB();
    
    // Get the course that's causing the error
    const courseId = '689f34e6b75897a3d279f01d';
    const course = await Course.findById(courseId);
    
    if (!course) {
      console.log('❌ Course not found');
      return;
    }
    
    console.log('✅ Course found:', course.title);
    console.log('   Status:', course.status);
    console.log('   Active:', course.isActive);
    console.log('   Free:', course.isFree);
    console.log('   Access Level:', course.accessLevel);
    console.log('   Required Subscription:', course.requiredSubscription);
    
    // Get a test user
    const testUser = await User.findOne({ email: { $exists: true } }).limit(1);
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }
    
    console.log('✅ Test user found:', testUser.email);
    console.log('   Subscription:', testUser.subscriptionType);
    console.log('   User ID:', testUser._id);
    
    // Check if user can access course
    const canAccess = course.canAccessUser(testUser);
    console.log('✅ Can access course:', canAccess);
    
    // Check if already enrolled
    const existingProgress = await UserProgress.findUserProgress(testUser._id, course._id);
    console.log('✅ Already enrolled:', !!existingProgress);
    
    if (existingProgress) {
      console.log('   Existing enrollment status:', existingProgress.status);
      console.log('   Enrolled at:', existingProgress.enrolledAt);
    }
    
    // Test creating new progress (simulate enrollment)
    if (!existingProgress) {
      console.log('🔧 Testing new enrollment creation...');
      
      const userProgress = new UserProgress({
        userId: testUser._id,
        courseId: course._id,
        totalLessons: course.totalLessons || course.lessons?.length || 0,
        status: 'enrolled'
      });
      
      console.log('✅ UserProgress object created');
      console.log('   User ID:', userProgress.userId);
      console.log('   Course ID:', userProgress.courseId);
      console.log('   Total Lessons:', userProgress.totalLessons);
      
      // Try to save (this is where validation errors might occur)
      try {
        await userProgress.save();
        console.log('✅ Enrollment saved successfully');
        
        // Clean up test enrollment
        await UserProgress.findByIdAndDelete(userProgress._id);
        console.log('✅ Test enrollment cleaned up');
      } catch (saveError) {
        console.error('❌ Error saving enrollment:', saveError.message);
        console.error('   Error details:', saveError);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('   Error stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testEnrollment();