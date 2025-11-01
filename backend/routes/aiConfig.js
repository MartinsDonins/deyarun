import express from 'express';
import AIConfig from '../models/AIConfig.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get current active AI configuration
router.get('/', adminMiddleware, async (req, res) => {
  try {
    let config = await AIConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!config) {
      // Create default AI configuration if none exists
      console.log('🤖 No AI config found, creating default configuration');
      
      const defaultConfig = new AIConfig({
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        isActive: true,
        name: 'Default Configuration',
        description: 'Default AI configuration for training recommendations',
        exerciseWeights: {
          difficulty: 0.3,
          muscleGroups: 0.25,
          equipment: 0.2,
          duration: 0.25
        },
        progressionRules: {
          weekly: 0.1,
          biweekly: 0.15,
          monthly: 0.2
        },
        restDayRules: {
          beginnerMinRest: 2,
          intermediateMinRest: 1,
          advancedMinRest: 1
        },
        createdBy: {
          _id: req.user.userId || 'system',
          email: req.user.email || 'system@runacademy.com',
          name: req.user.name || 'System'
        }
      });
      
      config = await defaultConfig.save();
      console.log('✅ Default AI configuration created');
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI configuration'
    });
  }
});

// Create new AI configuration
router.post('/', 
  adminMiddleware,
  [
    body('model').isIn(['gpt-4', 'gpt-3.5-turbo', 'claude-3']).withMessage('Invalid AI model'),
    body('temperature').isFloat({ min: 0, max: 1 }).withMessage('Temperature must be between 0 and 1'),
    body('maxTokens').isInt({ min: 500, max: 4000 }).withMessage('Max tokens must be between 500 and 4000'),
    body('systemPrompt').isLength({ min: 10 }).withMessage('System prompt is required'),
    body('exerciseWeights.difficulty').isFloat({ min: 0, max: 1 }),
    body('exerciseWeights.muscleGroups').isFloat({ min: 0, max: 1 }),
    body('exerciseWeights.equipment').isFloat({ min: 0, max: 1 }),
    body('exerciseWeights.duration').isFloat({ min: 0, max: 1 }),
    body('progressionRules.weekly').isFloat({ min: 0, max: 0.5 }),
    body('progressionRules.biweekly').isFloat({ min: 0, max: 0.5 }),
    body('progressionRules.monthly').isFloat({ min: 0, max: 0.5 }),
    body('restDayRules.beginnerMinRest').isInt({ min: 1, max: 5 }),
    body('restDayRules.intermediateMinRest').isInt({ min: 1, max: 5 }),
    body('restDayRules.advancedMinRest').isInt({ min: 1, max: 5 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // If this config should be active, deactivate all others
      if (req.body.isActive) {
        await AIConfig.updateMany({}, { isActive: false });
      }

      const configData = {
        ...req.body,
        createdBy: {
          _id: req.user.userId,
          email: req.user.email,
          name: req.user.name
        }
      };

      const config = new AIConfig(configData);
      await config.save();

      res.status(201).json({
        success: true,
        data: config,
        message: 'AI configuration created successfully'
      });
    } catch (error) {
      console.error('Create AI config error:', error);
      
      if (error.message.includes('Exercise weights must sum to 1.0')) {
        return res.status(400).json({
          success: false,
          error: 'Exercise weights must sum to 1.0'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create AI configuration'
      });
    }
  }
);

// Update AI configuration
router.put('/:id', 
  adminMiddleware,
  [
    body('model').optional().isIn(['gpt-4', 'gpt-3.5-turbo', 'claude-3']).withMessage('Invalid AI model'),
    body('temperature').optional().isFloat({ min: 0, max: 1 }).withMessage('Temperature must be between 0 and 1'),
    body('maxTokens').optional().isInt({ min: 500, max: 4000 }).withMessage('Max tokens must be between 500 and 4000'),
    body('systemPrompt').optional().isLength({ min: 10 }).withMessage('System prompt is required'),
    body('exerciseWeights.difficulty').optional().isFloat({ min: 0, max: 1 }),
    body('exerciseWeights.muscleGroups').optional().isFloat({ min: 0, max: 1 }),
    body('exerciseWeights.equipment').optional().isFloat({ min: 0, max: 1 }),
    body('exerciseWeights.duration').optional().isFloat({ min: 0, max: 1 }),
    body('progressionRules.weekly').optional().isFloat({ min: 0, max: 0.5 }),
    body('progressionRules.biweekly').optional().isFloat({ min: 0, max: 0.5 }),
    body('progressionRules.monthly').optional().isFloat({ min: 0, max: 0.5 }),
    body('restDayRules.beginnerMinRest').optional().isInt({ min: 1, max: 5 }),
    body('restDayRules.intermediateMinRest').optional().isInt({ min: 1, max: 5 }),
    body('restDayRules.advancedMinRest').optional().isInt({ min: 1, max: 5 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const config = await AIConfig.findById(id);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'AI configuration not found'
        });
      }

      // If this config should be active, deactivate all others
      if (req.body.isActive && !config.isActive) {
        await AIConfig.updateMany({ _id: { $ne: id } }, { isActive: false });
      }

      // Update version
      const updateData = {
        ...req.body,
        version: config.version + 1
      };

      const updatedConfig = await AIConfig.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: updatedConfig,
        message: 'AI configuration updated successfully'
      });
    } catch (error) {
      console.error('Update AI config error:', error);
      
      if (error.message.includes('Exercise weights must sum to 1.0')) {
        return res.status(400).json({
          success: false,
          error: 'Exercise weights must sum to 1.0'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update AI configuration'
      });
    }
  }
);

// Get all AI configurations (for history/comparison)
router.get('/history', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const configs = await AIConfig.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AIConfig.countDocuments();
    
    res.json({
      success: true,
      data: configs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get AI config history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI configuration history'
    });
  }
});

// Delete AI configuration
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const config = await AIConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'AI configuration not found'
      });
    }

    // Don't allow deleting the active configuration if it's the only one
    if (config.isActive) {
      const configCount = await AIConfig.countDocuments();
      if (configCount === 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the only AI configuration'
        });
      }
    }

    await AIConfig.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'AI configuration deleted successfully'
    });
  } catch (error) {
    console.error('Delete AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete AI configuration'
    });
  }
});

// Test AI configuration
router.post('/:id/test', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const config = await AIConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'AI configuration not found'
      });
    }

    // Simple validation test
    const testResult = {
      configValid: true,
      warnings: [],
      recommendations: []
    };

    // Check exercise weights sum
    const weights = config.exerciseWeights;
    const weightSum = weights.difficulty + weights.muscleGroups + weights.equipment + weights.duration;
    if (Math.abs(weightSum - 1) > 0.01) {
      testResult.warnings.push('Exercise weights do not sum to 1.0');
    }

    // Check progression rules are reasonable
    if (config.progressionRules.weekly > 0.2) {
      testResult.warnings.push('Weekly progression seems high (>20%)');
    }

    // Check temperature settings
    if (config.temperature > 0.9) {
      testResult.recommendations.push('High temperature may produce inconsistent results');
    } else if (config.temperature < 0.3) {
      testResult.recommendations.push('Low temperature may produce repetitive results');
    }

    res.json({
      success: true,
      data: testResult,
      message: 'AI configuration test completed'
    });
  } catch (error) {
    console.error('Test AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI configuration'
    });
  }
});

export default router;