import express from 'express';
import Exercise from '../models/Exercise.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
import { body, validationResult, query } from 'express-validator';
import multer from 'multer';
import { uploadToFirebase, deleteFromFirebase } from '../services/firebaseStorage.js';

const router = express.Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Validation middleware
const validateExercise = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name must be 1-200 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('instructions').trim().isLength({ min: 10, max: 2000 }).withMessage('Instructions must be 10-2000 characters'),
  body('category').isIn([
    'warm-up', 'strength', 'flexibility', 'balance', 'coordination',
    'plyometric', 'core', 'recovery', 'cool-down', 'technique', 'cardio'
  ]).withMessage('Invalid category'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  body('targetMuscleGroups').isArray().withMessage('Target muscle groups must be an array'),
  body('video.provider').optional().isIn(['firebase', 'vimeo', 'youtube', 'local']).withMessage('Invalid video provider')
];

// GET /api/exercises/fix-indexes - Fix parallel array indexes issue (Admin only)
router.get('/fix-indexes', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔧 Fix indexes endpoint called by user:', req.user?.userId);
    
    const collection = Exercise.collection;
    
    // Get current indexes
    const existingIndexes = await collection.indexes();
    const problematicIndexName = 'trainingPhase_1_workoutTypes_1';
    const hasProblematicIndex = existingIndexes.some(idx => idx.name === problematicIndexName);
    
    let actions = [];
    
    if (hasProblematicIndex) {
      console.log('❌ Found problematic compound index, dropping it...');
      try {
        await collection.dropIndex(problematicIndexName);
        actions.push('Dropped problematic compound index: ' + problematicIndexName);
        console.log('✅ Successfully dropped problematic index');
      } catch (dropError) {
        console.log('⚠️ Could not drop index:', dropError.message);
        actions.push('Warning: Could not drop index - ' + dropError.message);
      }
    } else {
      actions.push('No problematic compound index found');
    }
    
    // Ensure separate indexes exist
    try {
      await collection.createIndex({ trainingPhase: 1 }, { background: true });
      actions.push('Created/ensured trainingPhase index');
    } catch (e) {
      if (e.message.includes('already exists')) {
        actions.push('trainingPhase index already exists');
      } else {
        actions.push('Warning: trainingPhase index issue - ' + e.message);
      }
    }
    
    try {
      await collection.createIndex({ workoutTypes: 1 }, { background: true });
      actions.push('Created/ensured workoutTypes index');
    } catch (e) {
      if (e.message.includes('already exists')) {
        actions.push('workoutTypes index already exists');
      } else {
        actions.push('Warning: workoutTypes index issue - ' + e.message);
      }
    }
    
    // Test exercise creation
    const testData = {
      name: 'Index Fix Test Exercise',
      description: 'Test exercise created during index fix process',
      instructions: 'This exercise validates that the index fix worked correctly',
      category: 'warm-up',
      difficulty: 'beginner',
      targetMuscleGroups: ['legs'],
      trainingPhase: ['base-building'],
      workoutTypes: ['running'],
      equipment: ['none'],
      createdBy: req.user.userId,
      isPublic: false
    };
    
    const testExercise = new Exercise(testData);
    await testExercise.save();
    console.log('✅ Test exercise created successfully');
    
    // Clean up test exercise
    await Exercise.findByIdAndDelete(testExercise._id);
    actions.push('Test exercise creation successful');
    
    res.json({
      success: true,
      message: 'Exercise indexes fixed successfully',
      actions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fix indexes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix indexes',
      details: error.message
    });
  }
});

// GET /api/exercises/test - Test endpoint for debugging (Admin only)
router.get('/test', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 Test endpoint called by user:', req.user?.userId);
    
    // Test database connection
    const exerciseCount = await Exercise.countDocuments();
    
    // Test model creation without saving
    const testExercise = new Exercise({
      name: 'Test Exercise',
      description: 'This is a test exercise for debugging purposes',
      instructions: 'Test instructions to verify the system works',
      category: 'warm-up',
      difficulty: 'beginner',
      targetMuscleGroups: ['legs'],
      createdBy: req.user.userId
    });
    
    // Validate the test exercise
    const validationError = testExercise.validateSync();
    
    res.json({
      success: true,
      message: 'Exercise system is working',
      debug: {
        dbConnected: true,
        exerciseCount,
        validationPassed: !validationError,
        validationError: validationError?.message || null,
        userInfo: {
          userId: req.user.userId,
          role: req.user.role
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

// GET /api/exercises - Get all exercises with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
], async (req, res) => {
  try {
    console.log('Exercises API - Query params:', req.query);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      trainingPhase,
      workoutType,
      search,
      isActive = true
    } = req.query;

    // Build query
    const query = {};
    
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    if (category && category.trim().length > 0) query.category = category;
    if (difficulty && difficulty.trim().length > 0) {
      // Validate difficulty value
      if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
        query.difficulty = difficulty;
      }
    }
    if (trainingPhase && trainingPhase.trim().length > 0) query.trainingPhase = { $in: [trainingPhase] };
    if (workoutType && workoutType.trim().length > 0) query.workoutTypes = { $in: [workoutType] };
    
    if (search && search.trim().length > 0) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'translations.lv.name': { $regex: search, $options: 'i' } },
        { 'translations.en.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [exercises, total] = await Promise.all([
      Exercise.find(query)
        .populate('createdBy', 'email name')
        .populate('lastModifiedBy', 'email name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Exercise.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      exercises,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// GET /api/exercises/:id - Get single exercise
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('createdBy', 'email name')
      .populate('lastModifiedBy', 'email name');
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json({ success: true, exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// POST /api/exercises - Create new exercise (Admin only)
router.post('/', verifyToken, requireAdmin, validateExercise, async (req, res) => {
  console.log('🚀 POST /api/exercises - Create exercise started');
  console.log('👤 User:', req.user?.userId, 'Role:', req.user?.role);
  console.log('📋 Request body keys:', Object.keys(req.body));
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    // Validate required fields manually as extra safety
    if (!req.body.name || !req.body.description || !req.body.instructions) {
      console.log('❌ Missing required fields:', {
        name: !!req.body.name,
        description: !!req.body.description,
        instructions: !!req.body.instructions
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, and instructions are required'
      });
    }

    if (!Array.isArray(req.body.targetMuscleGroups) || req.body.targetMuscleGroups.length === 0) {
      console.log('❌ Invalid targetMuscleGroups:', req.body.targetMuscleGroups);
      return res.status(400).json({
        success: false,
        error: 'targetMuscleGroups must be a non-empty array'
      });
    }

    const exerciseData = {
      ...req.body,
      createdBy: req.user.userId,
      // Ensure default values for optional fields
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true
    };

    console.log('💾 Creating exercise with data:', JSON.stringify(exerciseData, null, 2));
    
    // Use the safe creation method that handles parallel array indexing
    const exercise = await Exercise.createSafely(exerciseData);
    console.log('✅ Exercise created with ID:', exercise._id);

    // Skip population if it might cause issues
    try {
      await exercise.populate('createdBy', 'email name');
      console.log('✅ Exercise populated successfully');
    } catch (populateError) {
      console.log('⚠️ Population failed, continuing without:', populateError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      exercise
    });
  } catch (error) {
    console.error('❌ Error creating exercise:', error);
    console.error('📋 Request body:', req.body);
    console.error('👤 User ID:', req.user?.userId);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create exercise';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation error: ${error.message}`;
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = `Database error: ${error.message}`;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/exercises/:id - Update exercise (Admin only)
router.put('/:id', verifyToken, requireAdmin, validateExercise, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Update fields
    Object.assign(exercise, req.body);
    exercise.lastModifiedBy = req.user.userId;

    await exercise.save();
    await exercise.populate(['createdBy', 'lastModifiedBy'], 'email name');

    res.json({
      success: true,
      message: 'Exercise updated successfully',
      exercise
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

// POST /api/exercises/:id/upload-video - Upload video to Firebase (Admin only)
router.post('/:id/upload-video', verifyToken, requireAdmin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Delete old video if exists
    if (exercise.video.provider === 'firebase' && exercise.video.firebaseUrl) {
      try {
        await deleteFromFirebase(exercise.video.firebaseUrl);
      } catch (deleteError) {
        console.warn('Failed to delete old video:', deleteError.message);
      }
    }

    // Upload new video
    const folder = 'exercises/videos';
    const filename = `${exercise._id}_${Date.now()}.${req.file.originalname.split('.').pop()}`;
    
    const firebaseUrl = await uploadToFirebase(req.file.buffer, folder, filename, req.file.mimetype);

    // Update exercise
    exercise.video.provider = 'firebase';
    exercise.video.firebaseUrl = firebaseUrl;
    exercise.lastModifiedBy = req.user.userId;

    await exercise.save();

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      videoUrl: exercise.videoUrl
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// PUT /api/exercises/:id/video-provider - Change video provider (Admin only)
router.put('/:id/video-provider', verifyToken, requireAdmin, [
  body('provider').isIn(['firebase', 'vimeo', 'youtube', 'local']).withMessage('Invalid provider'),
  body('videoId').optional().isString().withMessage('Video ID must be a string'),
  body('videoUrl').optional().isURL().withMessage('Video URL must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { provider, videoId, videoUrl } = req.body;
    const exercise = await Exercise.findById(req.params.id);
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Update video configuration based on provider
    exercise.video.provider = provider;
    
    switch (provider) {
      case 'vimeo':
        exercise.video.vimeoId = videoId;
        exercise.video.firebaseUrl = undefined;
        exercise.video.youtubeId = undefined;
        exercise.video.localPath = undefined;
        break;
      case 'youtube':
        exercise.video.youtubeId = videoId;
        exercise.video.firebaseUrl = undefined;
        exercise.video.vimeoId = undefined;
        exercise.video.localPath = undefined;
        break;
      case 'firebase':
        exercise.video.firebaseUrl = videoUrl;
        exercise.video.vimeoId = undefined;
        exercise.video.youtubeId = undefined;
        exercise.video.localPath = undefined;
        break;
      case 'local':
        exercise.video.localPath = videoUrl;
        exercise.video.firebaseUrl = undefined;
        exercise.video.vimeoId = undefined;
        exercise.video.youtubeId = undefined;
        break;
    }

    exercise.lastModifiedBy = req.user.userId;
    await exercise.save();

    res.json({
      success: true,
      message: 'Video provider updated successfully',
      exercise
    });
  } catch (error) {
    console.error('Error updating video provider:', error);
    res.status(500).json({ error: 'Failed to update video provider' });
  }
});

// DELETE /api/exercises/:id - Delete exercise (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Delete video from Firebase if exists
    if (exercise.video.provider === 'firebase' && exercise.video.firebaseUrl) {
      try {
        await deleteFromFirebase(exercise.video.firebaseUrl);
      } catch (deleteError) {
        console.warn('Failed to delete video from Firebase:', deleteError.message);
      }
    }

    await Exercise.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

// PUT /api/exercises/:id/toggle-status - Toggle active status (Admin only)
router.put('/:id/toggle-status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    exercise.isActive = !exercise.isActive;
    exercise.lastModifiedBy = req.user.userId;
    await exercise.save();

    res.json({
      success: true,
      message: `Exercise ${exercise.isActive ? 'activated' : 'deactivated'} successfully`,
      exercise
    });
  } catch (error) {
    console.error('Error toggling exercise status:', error);
    res.status(500).json({ error: 'Failed to toggle exercise status' });
  }
});

// GET /api/exercises/categories/stats - Get category statistics (Admin only)
router.get('/categories/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Exercise.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$usageStats.avgRating' },
          totalUsage: { $sum: '$usageStats.timesUsed' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalExercises = await Exercise.countDocuments();
    const activeExercises = await Exercise.countDocuments({ isActive: true });

    res.json({
      success: true,
      stats,
      summary: {
        total: totalExercises,
        active: activeExercises,
        inactive: totalExercises - activeExercises
      }
    });
  } catch (error) {
    console.error('Error fetching exercise stats:', error);
    res.status(500).json({ error: 'Failed to fetch exercise statistics' });
  }
});

// POST /api/exercises/migrate-videos - Migrate video provider (Admin only)
router.post('/migrate-videos', verifyToken, requireAdmin, [
  body('from').isIn(['firebase', 'vimeo', 'youtube', 'local']).withMessage('Invalid source provider'),
  body('to').isIn(['firebase', 'vimeo', 'youtube', 'local']).withMessage('Invalid target provider')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { from, to, updateData = {} } = req.body;
    
    const result = await Exercise.migrateVideoProvider(from, to, {
      ...updateData,
      lastModifiedBy: req.user.userId
    });

    res.json({
      success: true,
      message: `Successfully migrated ${result.modifiedCount} exercises from ${from} to ${to}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error migrating video providers:', error);
    res.status(500).json({ error: 'Failed to migrate video providers' });
  }
});

// GET /api/exercises/for-training - Get exercises for AI training plan generation
router.get('/for-training', [
  query('category').optional().isString(),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('trainingPhase').optional().isString(),
  query('workoutType').optional().isString(),
  query('targetMuscles').optional().isString(),
  query('duration').optional().isInt({ min: 1 }),
  query('equipment').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const criteria = req.query;
    
    // Parse arrays from query string
    if (criteria.targetMuscles) {
      criteria.targetMuscles = criteria.targetMuscles.split(',');
    }
    if (criteria.equipment) {
      criteria.equipment = criteria.equipment.split(',');
    }

    const exercises = await Exercise.findForTrainingPlan(criteria).limit(50);

    res.json({
      success: true,
      exercises,
      count: exercises.length
    });
  } catch (error) {
    console.error('Error fetching exercises for training:', error);
    res.status(500).json({ error: 'Failed to fetch exercises for training plan' });
  }
});

export default router;