// Script to create sample running courses
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongoDB } from '../config/database.js';
import { Course } from '../models/mongodb/index.js';

async function createSampleCourses() {
  try {
    await connectMongoDB();
    
    const courses = [
      {
        title: 'Running Basics for Beginners',
        description: 'Essential running fundamentals for new runners',
        category: 'beginner',
        difficulty: 'beginner',
        status: 'published',
        lessons: [
          {
            title: 'Getting Started',
            description: 'Introduction to running',
            content: 'Welcome to running!',
            type: 'text',
            duration: 15,
            order: 1,
            isPublished: true,
            points: 10
          }
        ],
        author: { name: 'RunAcademy Team' },
        isFree: true,
        isActive: true
      },
      {
        title: 'Marathon Training Program',
        description: 'Complete marathon training guide',
        category: 'advanced',
        difficulty: 'advanced',
        status: 'draft',
        lessons: [
          {
            title: 'Training Overview',
            description: 'Marathon training basics',
            content: 'Marathon training overview...',
            type: 'text',
            duration: 20,
            order: 1,
            isPublished: false,
            points: 15
          }
        ],
        author: { name: 'Marathon Coach' },
        isFree: false,
        isActive: true
      }
    ];
    
    for (const courseData of courses) {
      const existing = await Course.findOne({ title: courseData.title });
      
      if (!existing) {
        const course = new Course(courseData);
        await course.save();
        console.log(`✅ Created: ${courseData.title} (${courseData.status})`);
      } else {
        console.log(`⚠️  Course "${courseData.title}" already exists`);
      }
    }
    
    const allCourses = await Course.find({});
    console.log(`\n📊 Total courses: ${allCourses.length}`);
    console.log(`  • Published: ${allCourses.filter(c => c.status === 'published').length}`);
    console.log(`  • Draft: ${allCourses.filter(c => c.status === 'draft').length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

createSampleCourses();