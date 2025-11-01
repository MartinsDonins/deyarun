// Script to analyze unfinished courses and user progress
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongoDB } from '../config/database.js';
import { Course, UserProgress, User } from '../models/mongodb/index.js';

async function analyzeUnfinishedCourses() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    console.log('\n📚 Analyzing Courses and User Progress...\n');
    
    // 1. Get all courses by status
    const allCourses = await Course.find({});
    const coursesByStatus = {
      draft: allCourses.filter(c => c.status === 'draft'),
      published: allCourses.filter(c => c.status === 'published'),
      archived: allCourses.filter(c => c.status === 'archived')
    };
    
    console.log('📊 COURSES BY STATUS:');
    console.log(`  • Draft (unfinished): ${coursesByStatus.draft.length}`);
    console.log(`  • Published: ${coursesByStatus.published.length}`);
    console.log(`  • Archived: ${coursesByStatus.archived.length}`);
    console.log(`  • Total: ${allCourses.length}\n`);
    
    // 2. List draft courses (unfinished by admin)
    if (coursesByStatus.draft.length > 0) {
      console.log('🚧 DRAFT COURSES (Unfinished):');
      coursesByStatus.draft.forEach((course, index) => {
        console.log(`  ${index + 1}. "${course.title}"`);
        console.log(`     Category: ${course.category}`);
        console.log(`     Lessons: ${course.totalLessons}`);
        console.log(`     Created: ${course.createdAt.toLocaleDateString()}`);
        console.log(`     Updated: ${course.updatedAt.toLocaleDateString()}\n`);
      });
    }
    
    // 3. Get user progress statistics
    const allUserProgress = await UserProgress.find({});
    const progressByStatus = {
      enrolled: allUserProgress.filter(p => p.status === 'enrolled'),
      in_progress: allUserProgress.filter(p => p.status === 'in_progress'),
      completed: allUserProgress.filter(p => p.status === 'completed'),
      dropped: allUserProgress.filter(p => p.status === 'dropped')
    };
    
    console.log('👥 USER PROGRESS STATISTICS:');
    console.log(`  • Enrolled (not started): ${progressByStatus.enrolled.length}`);
    console.log(`  • In Progress (unfinished): ${progressByStatus.in_progress.length}`);
    console.log(`  • Completed: ${progressByStatus.completed.length}`);
    console.log(`  • Dropped: ${progressByStatus.dropped.length}`);
    console.log(`  • Total enrollments: ${allUserProgress.length}\n`);
    
    // 4. Analyze incomplete course progress (most important for "neparadas")
    const incompleteCourses = allUserProgress.filter(p => 
      p.status === 'in_progress' && p.completionPercentage < 100
    );
    
    if (incompleteCourses.length > 0) {
      console.log('📈 UNFINISHED COURSE PROGRESS (neparadas kursi):');
      
      // Get course details for incomplete progress
      const courseIds = [...new Set(incompleteCourses.map(p => p.courseId))];
      const courses = await Course.find({ _id: { $in: courseIds } });
      const courseMap = new Map(courses.map(c => [c._id.toString(), c]));
      
      // Group by completion percentage ranges
      const progressRanges = {
        '0-25%': incompleteCourses.filter(p => p.completionPercentage <= 25),
        '26-50%': incompleteCourses.filter(p => p.completionPercentage > 25 && p.completionPercentage <= 50),
        '51-75%': incompleteCourses.filter(p => p.completionPercentage > 50 && p.completionPercentage <= 75),
        '76-99%': incompleteCourses.filter(p => p.completionPercentage > 75 && p.completionPercentage < 100)
      };
      
      console.log('  Progress Distribution:');
      Object.entries(progressRanges).forEach(([range, progresses]) => {
        console.log(`    • ${range}: ${progresses.length} enrollments`);
      });
      
      // Show most abandoned courses (highest enrollment but lowest completion rate)
      const courseStats = new Map();
      incompleteCourses.forEach(progress => {
        const courseId = progress.courseId.toString();
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, {
            course: courseMap.get(courseId),
            incompleteCount: 0,
            avgCompletion: 0,
            totalCompletion: 0
          });
        }
        const stats = courseStats.get(courseId);
        stats.incompleteCount++;
        stats.totalCompletion += progress.completionPercentage;
        stats.avgCompletion = stats.totalCompletion / stats.incompleteCount;
      });
      
      const sortedCourseStats = Array.from(courseStats.entries())
        .sort(([,a], [,b]) => b[1].incompleteCount - a[1].incompleteCount)
        .slice(0, 10);
      
      console.log('\n  📉 Most Frequently Unfinished Courses:');
      sortedCourseStats.forEach(([courseId, stats], index) => {
        if (stats.course) {
          console.log(`    ${index + 1}. "${stats.course.title}"`);
          console.log(`       • ${stats.incompleteCount} unfinished enrollments`);
          console.log(`       • Average completion: ${stats.avgCompletion.toFixed(1)}%`);
          console.log(`       • Category: ${stats.course.category}`);
          console.log(`       • Total lessons: ${stats.course.totalLessons}\n`);
        }
      });
    }
    
    // 5. Analyze stale progress (not accessed recently)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const staleCourses = allUserProgress.filter(p => 
      p.status === 'in_progress' && 
      p.lastAccessedAt < thirtyDaysAgo
    );
    
    if (staleCourses.length > 0) {
      console.log(`⏰ STALE COURSE PROGRESS (not accessed in 30+ days): ${staleCourses.length}`);
      
      // Show oldest stale courses
      const oldestStale = staleCourses
        .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)
        .slice(0, 5);
      
      console.log('  Oldest unfinished courses:');
      for (const progress of oldestStale) {
        const course = await Course.findById(progress.courseId);
        const daysSince = Math.floor((Date.now() - progress.lastAccessedAt) / (1000 * 60 * 60 * 24));
        console.log(`    • "${course?.title || 'Unknown'}" - ${daysSince} days ago (${progress.completionPercentage}% complete)`);
      }
      console.log();
    }
    
    // 6. Summary statistics
    console.log('📋 SUMMARY:');
    console.log(`  • Total courses in system: ${allCourses.length}`);
    console.log(`  • Unfinished courses (draft): ${coursesByStatus.draft.length}`);
    console.log(`  • Users with unfinished progress: ${incompleteCourses.length}`);
    console.log(`  • Stale course progress (30+ days): ${staleCourses.length}`);
    
    const totalUsers = await User.countDocuments({});
    const usersWithProgress = new Set(allUserProgress.map(p => p.userId.toString())).size;
    const engagementRate = totalUsers > 0 ? ((usersWithProgress / totalUsers) * 100).toFixed(1) : 0;
    
    console.log(`  • Total users: ${totalUsers}`);
    console.log(`  • Users with course progress: ${usersWithProgress}`);
    console.log(`  • Course engagement rate: ${engagementRate}%`);
    
  } catch (error) {
    console.error('❌ Error analyzing courses:', error);
  } finally {
    process.exit(0);
  }
}

analyzeUnfinishedCourses();