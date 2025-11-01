// ✅ Lessons route - MongoDB Compatible (Integrated with Courses)
import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { Course } from '../models/mongodb/index.js';

const router = express.Router();

console.log('✅ Lessons route enabled with MongoDB support - integrated with Courses');

// Lessons are now part of the Course system for better organization
router.get('/', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    message: 'Lessons are now integrated within courses for better organization.',
    info: 'Use /api/courses/{courseId}/lessons to access lesson content.',
    availableEndpoints: [
      'GET /api/courses - List all courses with lessons',
      'GET /api/courses/{courseId} - Get course with lessons',
      'GET /api/courses/{courseId}/lessons - Get all lessons for a course'
    ]
  });
});

// Redirect legacy lesson ID requests to course system
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Try to find which course contains this lesson
    const course = await Course.findOne({ 'lessons._id': req.params.id });
    
    if (course) {
      const lesson = course.lessons.id(req.params.id);
      res.json({
        success: true,
        lesson,
        course: {
          id: course._id,
          title: course.title
        },
        message: 'Lesson found in course system',
        redirectTo: `/api/courses/${course._id}/lessons/${req.params.id}`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Lesson not found',
        message: 'This lesson may have been moved to the course system. Please check /api/courses for available content.'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to find lesson', message: error.message });
  }
});

// Create lesson (now creates within a course)
router.post('/', authMiddleware, (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Lessons must be created within courses.',
    instruction: 'Use POST /api/courses/{courseId}/lessons to create a lesson within a specific course.'
  });
});

// Legacy admin routes - redirect to course management
router.get('/admin/all', adminMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Lesson administration is now handled through course management.',
    redirectTo: '/api/courses/admin/all',
    info: 'All lessons are managed as part of their respective courses.'
  });
});

export default router;