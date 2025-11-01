// ✅ Resources route - MongoDB Compatible
import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
console.log('✅ Resources route enabled with MongoDB support');

// Resource Schema
const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true, enum: ['article', 'video', 'pdf', 'tool', 'guide'] },
  category: { type: String, required: true, enum: ['nutrition', 'training', 'recovery', 'gear', 'motivation'] },
  content: { type: String },
  url: { type: String },
  fileUrl: { type: String },
  thumbnailUrl: { type: String },
  tags: [String],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  estimatedReadTime: { type: Number }, // in minutes
  author: { type: String, default: 'DeyaRun Team' },
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'resources' });

const Resource = mongoose.model('Resource', ResourceSchema);

// Initialize default resources
const initializeDefaultResources = async () => {
  try {
    const count = await Resource.countDocuments();
    if (count === 0) {
      const defaultResources = [
        {
          title: 'Running Form Basics',
          description: 'Learn proper running technique to improve efficiency and prevent injuries.',
          type: 'article',
          category: 'training',
          content: 'Proper running form includes maintaining an upright posture, landing on your midfoot, and keeping your arms relaxed...',
          tags: ['form', 'technique', 'basics'],
          difficulty: 'beginner',
          estimatedReadTime: 5
        },
        {
          title: 'Nutrition for Runners',
          description: 'Essential nutrition guidelines for optimal running performance.',
          type: 'guide',
          category: 'nutrition',
          content: 'Pre-run fueling, hydration strategies, and post-workout recovery nutrition...',
          tags: ['nutrition', 'fueling', 'hydration'],
          difficulty: 'beginner',
          estimatedReadTime: 8
        },
        {
          title: 'Recovery Techniques',
          description: 'Methods to speed up recovery and prevent overtraining.',
          type: 'article',
          category: 'recovery',
          content: 'Active recovery, stretching, foam rolling, and sleep optimization...',
          tags: ['recovery', 'stretching', 'sleep'],
          difficulty: 'intermediate',
          estimatedReadTime: 6
        }
      ];
      
      await Resource.insertMany(defaultResources);
      console.log('Default resources initialized');
    }
  } catch (error) {
    console.error('Failed to initialize default resources:', error);
  }
};

// Initialize resources on startup
initializeDefaultResources();

// Get all resources
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, type, difficulty, search, page = 1, limit = 20 } = req.query;
    
    const query = { isPublished: true };
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Resource.countDocuments(query);
    
    res.json({
      success: true,
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch resources', message: error.message });
  }
});

// Get resource by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch resource', message: error.message });
  }
});

// Get resources by category
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;
    
    const resources = await Resource.find({ category, isPublished: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, resources, category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch category resources', message: error.message });
  }
});

// Get featured resources
router.get('/featured/list', authMiddleware, async (req, res) => {
  try {
    const featuredResources = await Resource.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(6);
    
    res.json({ success: true, resources: featuredResources });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch featured resources', message: error.message });
  }
});
export default router;