// Course Management Routes - MongoDB Implementation
import express from 'express';
import mongoose from 'mongoose';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { requirePremium, addUsageInfo, addSubscriptionInfo } from '../middleware/subscriptionMiddleware.js';
import { Course, UserProgress } from '../models/mongodb/index.js';

const router = express.Router();

console.log('✅ Courses route enabled with MongoDB support');

// GET /courses - Get all published courses with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      difficulty, 
      featured, 
      search, 
      page = 1, 
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    let query = { status: 'published', isActive: true };
    
    // Apply filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (featured === 'true') query.isFeatured = true;
    
    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    let coursesQuery = Course.find(query);
    
    // Text search if provided
    if (search) {
      coursesQuery = Course.find({
        ...query,
        $text: { $search: search }
      });
    }
    
    // Execute query with pagination
    const courses = await coursesQuery
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-lessons.quiz.questions.correctAnswer -lessons.quiz.questions.explanation')
      .lean();
    
    // Get total count for pagination
    const total = await Course.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        courses: courses.map(course => ({
          id: course._id,
          name: course.title,
          description: course.description,
          shortDescription: course.shortDescription,
          category: course.category,
          level: course.difficulty || 'beginner',
          duration: course.duration || '1 week',
          price: course.pricing?.amount || 0,
          currency: course.pricing?.currency || 'EUR',
          isPaid: course.pricing?.amount > 0,
          features: course.features || [],
          imageUrl: course.imageUrl,
          rating: course.rating || 0,
          enrolledCount: course.enrollmentCount || 0,
          instructorName: course.instructor || 'Running Academy',
          lessons: course.lessons?.length || 0 // Hide lesson details in list view
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses',
      message: error.message
    });
  }
});

// Protected routes (require authentication)

// GET /courses/me - Get user's enrolled courses (MUST be before /:id route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const userProgress = await UserProgress.find({ userId })
      .populate('courseId', 'title description category difficulty duration pricing imageUrl rating enrollmentCount instructor')
      .lean();
    
    const enrolledCourses = userProgress
      .filter(progress => progress.courseId) // Filter out deleted courses
      .map(progress => ({
        id: progress.courseId._id,
        name: progress.courseId.title,
        description: progress.courseId.description,
        category: progress.courseId.category,
        level: progress.courseId.difficulty || 'beginner',
        duration: progress.courseId.duration || '1 week',
        price: progress.courseId.pricing?.amount || 0,
        currency: progress.courseId.pricing?.currency || 'EUR',
        isPaid: progress.courseId.pricing?.amount > 0,
        features: progress.courseId.features || [],
        imageUrl: progress.courseId.imageUrl,
        rating: progress.courseId.rating || 0,
        enrolledCount: progress.courseId.enrollmentCount || 0,
        instructorName: progress.courseId.instructor || 'Running Academy',
        enrollmentStatus: progress.status,
        progress: progress.progressSummary?.completionPercentage || 0,
        enrolledAt: progress.enrolledAt,
        lastAccessedAt: progress.lastAccessedAt,
        currentLessonId: progress.currentLessonId
      }));
    
    res.json({
      success: true,
      courses: enrolledCourses
    });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user courses',
      message: error.message
    });
  }
});

// GET /courses/:id - Get specific course details
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeProgress = false } = req.query;
    
    // Debug auth status
    console.log('Course detail request debug:', {
      courseId: id,
      includeProgress: includeProgress,
      hasUser: !!req.user,
      userId: req.user?.userId || req.user?.id,
      userObject: req.user
    });
    
    // Find course by ID or slug
    let course;
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id);
    } else {
      course = await Course.findBySlug(id);
    }
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user can access this course
    let userProgress = null;
    if (req.user && includeProgress === 'true') {
      // Check course access based on user subscription
      if (!course.canAccessUser(req.user)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'This course requires a higher subscription level'
        });
      }
      
      // Enhanced debug logging for user data
      console.log('User object debug:', {
        user: req.user,
        userId: req.user?.userId || req.user?.id,
        userIdField: req.user?.userId,
        userIdFieldAlt: req.user?.id,
        courseId: course._id
      });
      
      // Try multiple user ID fields for compatibility
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        console.error('❌ No valid user ID found in req.user');
        return res.status(401).json({
          success: false,
          error: 'Authentication error',
          message: 'User ID not found in authentication data'
        });
      }
      
      // Get user progress if authenticated (exclude unenrolled users)
      userProgress = await UserProgress.findOne({ 
        userId: userId, 
        courseId: course._id,
        status: { $ne: 'unenrolled' }
      });
      
      // Debug user progress
      console.log('User progress debug:', {
        userId: userId,
        courseId: course._id,
        userProgress: userProgress ? {
          id: userProgress._id,
          status: userProgress.status,
          progressSummary: userProgress.progressSummary
        } : null,
        hasProgress: !!userProgress,
        queryUsed: { userId, courseId: course._id, status: { $ne: 'unenrolled' } }
      });
    }
    
    // Prepare course data (hide sensitive info for non-enrolled users)
    const courseData = course.toSafeObject();
    if (!req.user || !course.canAccessUser(req.user)) {
      // Hide quiz answers and detailed content for non-subscribed users
      courseData.lessons = courseData.lessons.map(lesson => ({
        ...lesson,
        content: lesson.type === 'quiz' ? 'Quiz content available after enrollment' : lesson.content.substring(0, 200) + '...',
        quiz: lesson.quiz ? { questions: lesson.quiz.questions.length } : undefined
      }));
    }
    
    // Return full userProgress with lessonProgress for enrolled users
    let progressData = null;
    if (userProgress) {
      progressData = {
        status: userProgress.status,
        completionPercentage: userProgress.completionPercentage,
        completedLessons: userProgress.completedLessons,
        totalLessons: userProgress.totalLessons,
        lastAccessed: userProgress.lastAccessedAt,
        // Include lessonProgress for frontend to check individual lesson completion
        lessonProgress: userProgress.lessonProgress.reduce((acc, lp) => {
          acc[lp.lessonId] = {
            completed: lp.status === 'completed',
            status: lp.status,
            lastAccessedAt: lp.lastAccessedAt
          };
          return acc;
        }, {})
      };
    }
    
    res.json({
      success: true,
      data: {
        course: courseData,
        userProgress: progressData,
        canAccess: req.user ? course.canAccessUser(req.user) : course.isFree
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course',
      message: error.message
    });
  }
});

// POST /courses/:id/enroll - Enroll in a course (premium courses require subscription)
router.post('/:id/enroll', authMiddleware, addSubscriptionInfo, addUsageInfo, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    
    // Debug user data for enrollment
    console.log('Enrollment user debug:', {
      user: req.user,
      userId: userId,
      courseId: id
    });
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication error',
        message: 'User ID not found'
      });
    }
    
    const course = await Course.findById(id);
    if (!course || course.status !== 'published' || !course.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or not available'
      });
    }
    
    // Debug: Log subscription information
    console.log('Course enrollment debug:', {
      courseId: id,
      courseIsFree: course.isFree,
      courseRequiredSubscription: course.requiredSubscription,
      userSubscriptionType: req.user?.subscriptionType,
      userSubscription: req.user?.subscription,
      userSubscriptionInfo: req.userSubscription
    });

    // Enhance user object with subscription info for the check
    const enhancedUser = {
      ...req.user,
      subscriptionType: req.userSubscription?.plan || req.user?.subscriptionType || 'free'
    };
    
    // Check if user can access this course
    if (!course.canAccessUser(enhancedUser)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'This course requires a higher subscription level',
        debug: {
          courseIsFree: course.isFree,
          courseRequiredSubscription: course.requiredSubscription,
          userSubscriptionType: enhancedUser.subscriptionType,
          userSubscriptionInfo: req.userSubscription
        }
      });
    }
    
    // Check if already enrolled (exclude unenrolled users)
    const existingProgress = await UserProgress.findOne({ 
      userId, 
      courseId: course._id,
      status: { $ne: 'unenrolled' }
    });
    if (existingProgress) {
      return res.status(409).json({
        success: false,
        error: 'Already enrolled',
        message: 'You are already enrolled in this course'
      });
    }
    
    // Create new user progress
    const userProgress = new UserProgress({
      userId,
      courseId: course._id,
      totalLessons: course.totalLessons,
      status: 'enrolled'
    });
    
    await userProgress.save();
    
    // 🎯 AUTO-GENERATE TRAINING PLAN AFTER COURSE ENROLLMENT
    console.log(`🏃 Auto-generating training plan for course: ${course.title}`);
    try {
      const weeklyPlanGenerator = (await import('../services/weeklyPlanGenerator.js')).default;
      
      // Determine user preferences based on course
      const userPreferences = {
        trainingDays: ['monday', 'wednesday', 'friday', 'sunday'],
        fitnessLevel: 'intermediate', // Could be determined from user profile
        weeklyDistanceGoal: course.category === 'beginner' ? 15 : 
                           course.category === 'intermediate' ? 25 : 35,
        preferredWorkoutTypes: ['easy', 'tempo', 'long'],
        timeAvailable: 60,
        hasActivePlan: false,
        courseType: course.category,
        courseName: course.title
      };
      
      const planResult = await weeklyPlanGenerator.generateWeeklyPlan(userId, userPreferences);
      
      if (planResult.success) {
        console.log(`✅ Training plan generated successfully: ${planResult.data.totalWorkouts} workouts`);
      } else {
        console.log(`⚠️ Training plan generation failed, but enrollment continues`);
      }
    } catch (planError) {
      console.error('❌ Error generating training plan:', planError);
      // Continue with enrollment even if plan generation fails
    }
    
    // Update course enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrollmentCount: 1 }
    });
    
    res.json({
      success: true,
      message: 'Successfully enrolled in course and training plan generated',
      data: {
        enrollmentId: userProgress._id,
        courseId: course._id,
        progress: userProgress.progressSummary,
        trainingPlanGenerated: true
      }
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enroll in course',
      message: error.message
    });
  }
});

// POST /courses/:id/unenroll - Unenroll from a course
router.post('/:id/unenroll', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication error',
        message: 'User ID not found'
      });
    }
    const { reason } = req.body;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user is enrolled
    const userProgress = await UserProgress.findUserProgress(userId, course._id);
    if (!userProgress) {
      return res.status(409).json({
        success: false,
        error: 'Not enrolled',
        message: 'You are not enrolled in this course'
      });
    }
    
    // Update user progress status to unenrolled
    userProgress.status = 'unenrolled';
    userProgress.unenrolledAt = new Date();
    userProgress.unenrollmentReason = reason || 'user_request';
    await userProgress.save();
    
    // Decrease course enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrollmentCount: -1 }
    });
    
    res.json({
      success: true,
      message: 'Successfully unenrolled from course',
      data: {
        courseId: course._id,
        unenrolledAt: userProgress.unenrolledAt
      }
    });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unenroll from course',
      message: error.message
    });
  }
});

// DELETE /courses/:id/progress - Delete course progress completely
router.delete('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication error',
        message: 'User ID not found'
      });
    }
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Find user progress
    const userProgress = await UserProgress.findOne({ userId, courseId: course._id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found',
        message: 'You have no progress to delete for this course'
      });
    }
    
    // Delete the progress record completely
    await UserProgress.findByIdAndDelete(userProgress._id);
    
    // Decrease course enrollment count if user was enrolled
    if (userProgress.status !== 'unenrolled') {
      await Course.findByIdAndUpdate(course._id, {
        $inc: { enrollmentCount: -1 }
      });
    }
    
    res.json({
      success: true,
      message: 'Course progress deleted successfully',
      data: {
        courseId: course._id,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error deleting course progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course progress',
      message: error.message
    });
  }
});

// POST /courses/:id/lesson-plan - Create personalized lesson plan
router.post('/:id/lesson-plan', authMiddleware, addSubscriptionInfo, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { planType, duration, focus } = req.body;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user is enrolled
    const userProgress = await UserProgress.findUserProgress(userId, course._id);
    if (!userProgress) {
      return res.status(403).json({
        success: false,
        error: 'Not enrolled',
        message: 'You must be enrolled in this course to create a lesson plan'
      });
    }
    
    // Create lesson plan based on course content
    const lessonPlan = {
      planType: planType || 'progressive',
      duration: duration || 'weekly',
      focus: focus || course.category,
      createdAt: new Date(),
      exercises: generateExercisePlan(course, planType)
    };
    
    // Add lesson plan to user progress
    if (!userProgress.customPlans) {
      userProgress.customPlans = [];
    }
    userProgress.customPlans.push(lessonPlan);
    await userProgress.save();
    
    res.json({
      success: true,
      message: 'Lesson plan created successfully',
      data: {
        lessonPlan,
        courseId: course._id
      }
    });
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lesson plan',
      message: error.message
    });
  }
});

// Helper function to generate exercise plan
function generateExercisePlan(course, planType) {
  const baseExercises = [
    {
      name: 'Dynamic Warm-up',
      duration: 10,
      type: 'warmup',
      description: 'Prepare your body for running'
    },
    {
      name: 'Form Focus Run',
      duration: 20,
      type: 'technique',
      description: 'Focus on proper running form'
    },
    {
      name: 'Cool-down Stretch',
      duration: 10,
      type: 'cooldown', 
      description: 'Stretch and recover'
    }
  ];
  
  if (planType === 'progressive') {
    return [
      ...baseExercises,
      {
        name: 'Interval Training',
        duration: 15,
        type: 'cardio',
        description: 'Build speed and endurance'
      }
    ];
  }
  
  return baseExercises;
}

// GET /courses/:id/lessons/:lessonId - Get specific lesson content
router.get('/:id/lessons/:lessonId', authMiddleware, async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const userId = req.user.userId;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user has access to this course
    if (!course.canAccessUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Check if user is enrolled
    const userProgress = await UserProgress.findUserProgress(userId, course._id);
    if (!userProgress) {
      return res.status(403).json({
        success: false,
        error: 'Not enrolled',
        message: 'You must be enrolled in this course to access lessons'
      });
    }
    
    // Find the lesson
    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }
    
    // Get lesson progress
    const lessonProgress = userProgress.lessonProgress.find(lp => 
      lp.lessonId.toString() === lessonId
    );
    
    // Update last accessed
    userProgress.lastAccessedAt = new Date();
    userProgress.currentLessonId = lesson._id;
    await userProgress.save();
    
    res.json({
      success: true,
      data: {
        lesson,
        progress: lessonProgress || null,
        courseProgress: userProgress.progressSummary
      }
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson',
      message: error.message
    });
  }
});

// POST /courses/:id/lessons/:lessonId/complete - Mark lesson as complete
router.post('/:id/lessons/:lessonId/complete', authMiddleware, async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const { timeSpent = 0 } = req.body;
    const userId = req.user.userId;
    
    const userProgress = await UserProgress.findUserProgress(userId, id);
    if (!userProgress) {
      return res.status(403).json({
        success: false,
        error: 'Not enrolled in course'
      });
    }
    
    // Complete the lesson
    const lessonProgress = userProgress.completeLesson(lessonId, timeSpent);
    await userProgress.save();
    
    res.json({
      success: true,
      message: 'Lesson completed successfully',
      data: {
        lessonProgress,
        courseProgress: userProgress.progressSummary
      }
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete lesson',
      message: error.message
    });
  }
});

// POST /courses/:id/lessons/:lessonId/quiz - Submit quiz attempt
router.post('/:id/lessons/:lessonId/quiz', authMiddleware, async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const { answers } = req.body;
    const userId = req.user.userId;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz answers format'
      });
    }
    
    const course = await Course.findById(id);
    const lesson = course.lessons.id(lessonId);
    
    if (!lesson || !lesson.quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    const userProgress = await UserProgress.findUserProgress(userId, id);
    if (!userProgress) {
      return res.status(403).json({
        success: false,
        error: 'Not enrolled in course'
      });
    }
    
    // Calculate quiz results
    const quiz = lesson.quiz;
    let score = 0;
    const detailedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const correct = question.correctAnswer === answer;
      if (correct) score++;
      
      return {
        questionIndex: index,
        selectedAnswer: answer,
        correct
      };
    });
    
    const maxScore = quiz.questions.length;
    const percentage = Math.round((score / maxScore) * 100);
    const passed = percentage >= (quiz.passingScore || 70);
    
    const quizResult = {
      score,
      maxScore,
      percentage,
      passed,
      answers: detailedAnswers
    };
    
    // Record quiz attempt
    const attempt = userProgress.recordQuizAttempt(lessonId, quizResult);
    await userProgress.save();
    
    res.json({
      success: true,
      message: `Quiz ${passed ? 'passed' : 'failed'}`,
      data: {
        attempt,
        result: {
          score,
          maxScore,
          percentage,
          passed
        },
        courseProgress: userProgress.progressSummary
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz',
      message: error.message
    });
  }
});

// GET /courses/my/progress - Get user's course progress
router.get('/my/progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;
    
    const userCourses = await UserProgress.getUserCourses(userId, status);
    
    res.json({
      success: true,
      data: {
        courses: userCourses
      }
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course progress',
      message: error.message
    });
  }
});

// Admin routes (require admin privileges)

// GET /courses/admin/all - Get all courses (including drafts) for admin
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      status,
      category,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    const courses = await Course.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Course.countDocuments(query);
    
    // Get course statistics
    const stats = await Course.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        statistics: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses',
      message: error.message
    });
  }
});

// POST /courses/admin/create - Create new course
router.post('/admin/create', adminMiddleware, async (req, res) => {
  try {
    const courseData = req.body;
    
    // Validate required fields
    if (!courseData.title || !courseData.description || !courseData.category || !courseData.difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Title, description, category, and difficulty are required'
      });
    }
    
    // Create new course
    const course = new Course({
      ...courseData,
      status: courseData.status || 'draft'
    });
    
    await course.save();
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create course',
      message: error.message
    });
  }
});

// PUT /courses/admin/:id - Update course
router.put('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const course = await Course.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update course',
      message: error.message
    });
  }
});

// DELETE /courses/admin/:id - Delete course
router.delete('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if course has enrollments
    const enrollmentCount = await UserProgress.countDocuments({ courseId: id });
    if (enrollmentCount > 0) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete course with active enrollments',
        message: `This course has ${enrollmentCount} active enrollments. Archive the course instead.`
      });
    }
    
    await Course.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course',
      message: error.message
    });
  }
});

// GET /courses/admin/:id/analytics - Get course analytics
router.get('/admin/:id/analytics', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Get enrollment statistics
    const enrollmentStats = await UserProgress.getCourseStats(id);
    
    // Get recent enrollments
    const recentEnrollments = await UserProgress.find({ courseId: id })
      .populate('userId', 'firstName lastName email')
      .sort({ enrolledAt: -1 })
      .limit(10)
      .lean();
    
    // Calculate completion rates by lesson
    const lessonStats = await UserProgress.aggregate([
      { $match: { courseId: mongoose.Types.ObjectId(id) } },
      { $unwind: '$lessonProgress' },
      {
        $group: {
          _id: '$lessonProgress.lessonId',
          completed: {
            $sum: {
              $cond: [{ $eq: ['$lessonProgress.status', 'completed'] }, 1, 0]
            }
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ['$lessonProgress.status', 'in_progress'] }, 1, 0]
            }
          },
          totalAttempts: { $sum: 1 },
          avgTimeSpent: { $avg: '$lessonProgress.timeSpent' },
          avgQuizScore: { $avg: '$lessonProgress.bestQuizPercentage' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          title: course.title,
          totalLessons: course.totalLessons,
          enrollmentCount: course.enrollmentCount,
          completionCount: course.completionCount,
          averageRating: course.averageRating
        },
        enrollmentStats,
        recentEnrollments,
        lessonStats
      }
    });
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course analytics',
      message: error.message
    });
  }
});

// POST /courses/admin/:id/publish - Publish course
router.post('/admin/:id/publish', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Validate course is ready for publishing
    if (course.lessons.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot publish course without lessons'
      });
    }
    
    // Update course status
    course.status = 'published';
    course.publishedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      message: 'Course published successfully',
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Error publishing course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish course',
      message: error.message
    });
  }
});

// POST /courses/admin/:id/archive - Archive course
router.post('/admin/:id/archive', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findByIdAndUpdate(
      id,
      { 
        status: 'archived',
        archivedAt: new Date(),
        isActive: false
      },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Course archived successfully',
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Error archiving course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive course',
      message: error.message
    });
  }
});

export default router;