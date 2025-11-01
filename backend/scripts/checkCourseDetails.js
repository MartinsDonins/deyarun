// Script to check course details for debugging
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongoDB } from '../config/database.js';
import { Course } from '../models/mongodb/index.js';

async function checkCourseDetails() {
  try {
    await connectMongoDB();
    
    const courses = await Course.find({});
    
    console.log('📚 Course Details:\n');
    
    courses.forEach((course, index) => {
      console.log(`${index + 1}. "${course.title}"`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Status: ${course.status}`);
      console.log(`   Active: ${course.isActive}`);
      console.log(`   Free: ${course.isFree}`);
      console.log(`   Access Level: ${course.accessLevel}`);
      console.log(`   Required Subscription: ${course.requiredSubscription}`);
      console.log(`   Author: ${course.author?.name || 'Unknown'}`);
      console.log(`   Lessons: ${course.totalLessons}`);
      console.log(`   Published Lessons: ${course.lessons.filter(l => l.isPublished).length}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCourseDetails();