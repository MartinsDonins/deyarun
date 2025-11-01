import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { Goal } from '../models/mongodb/goal.model.js';
import { GoalTrackingService } from '../services/goalTrackingService.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/goals - Get user's goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      status = 'active', 
      category, 
      type, 
      limit = 50, 
      includeAnalytics = false 
    } = req.query;

    const query = { userId };
    
    if (status !== 'all') {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }

    console.log(`📊 Getting goals for user ${userId}, filters:`, query);

    let goals = await Goal.find(query)
      .sort({ priority: -1, 'timeline.endDate': 1 })
      .limit(parseInt(limit));

    // Include analytics if requested
    if (includeAnalytics === 'true') {
      goals = await Promise.all(goals.map(async (goal) => {
        const analytics = await GoalTrackingService.calculateGoalAnalytics(goal._id);
        return { ...goal.toObject(), analytics };
      }));
    }

    res.json({
      success: true,
      count: goals.length,
      goals: goals
    });
  } catch (error) {
    console.error('❌ Error fetching goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goals',
      error: error.message
    });
  }
});

// POST /api/goals - Create new goal
router.post('/', 
  authMiddleware,
  [
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 chars)'),
    body('type').isIn([
      'distance', 'pace', 'duration', 'frequency', 
      'weight_loss', 'race_time', 'consistency', 
      'elevation', 'custom'
    ]).withMessage('Valid goal type is required'),
    body('category').isIn([
      'daily', 'weekly', 'monthly', 'yearly', 'race', 'milestone'
    ]).withMessage('Valid category is required'),
    body('target.value').isNumeric().withMessage('Target value must be a number'),
    body('target.unit').notEmpty().withMessage('Target unit is required'),
    body('timeline.endDate').isISO8601().withMessage('Valid end date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const goalData = {
        ...req.body,
        userId,
        timeline: {
          startDate: req.body.timeline?.startDate || new Date(),
          endDate: new Date(req.body.timeline.endDate),
          milestones: req.body.timeline?.milestones || []
        },
        metadata: {
          createdBy: 'user',
          aiGenerated: false,
          tags: req.body.tags || []
        }
      };

      console.log(`📝 Creating goal for user ${userId}:`, goalData.title);

      const goal = new Goal(goalData);
      await goal.save();

      // Add initial history entry
      goal.history.push({
        action: 'created',
        note: 'Goal created by user',
        automaticUpdate: false
      });
      await goal.save();

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        goal: goal.toObject()
      });
    } catch (error) {
      console.error('❌ Error creating goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create goal',
        error: error.message
      });
    }
  }
);

// GET /api/goals/:id - Get specific goal
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { includeAnalytics = false } = req.query;

    const goal = await Goal.findOne({ _id: id, userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    let responseGoal = goal.toObject();

    if (includeAnalytics === 'true') {
      const analytics = await GoalTrackingService.calculateGoalAnalytics(id);
      responseGoal.analytics = analytics;
    }

    res.json({
      success: true,
      goal: responseGoal
    });
  } catch (error) {
    console.error('❌ Error fetching goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goal',
      error: error.message
    });
  }
});

// PUT /api/goals/:id - Update goal
router.put('/:id',
  authMiddleware,
  [
    body('title').optional().trim().isLength({ min: 1, max: 100 }),
    body('target.value').optional().isNumeric(),
    body('timeline.endDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const updates = req.body;

      console.log(`✏️ Updating goal ${id} for user ${userId}`);

      const goal = await Goal.findOne({ _id: id, userId });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      // Track changes for history
      const changes = {};
      for (const [key, value] of Object.entries(updates)) {
        if (goal[key] !== value) {
          changes[key] = { old: goal[key], new: value };
        }
      }

      // Apply updates
      Object.assign(goal, updates);

      // Add to history
      goal.history.push({
        action: 'updated',
        oldValue: changes,
        note: 'Goal updated by user',
        automaticUpdate: false
      });

      await goal.save();

      res.json({
        success: true,
        message: 'Goal updated successfully',
        goal: goal.toObject()
      });
    } catch (error) {
      console.error('❌ Error updating goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update goal',
        error: error.message
      });
    }
  }
);

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log(`🗑️ Deleting goal ${id} for user ${userId}`);

    const goal = await Goal.findOneAndDelete({ _id: id, userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message
    });
  }
});

// POST /api/goals/:id/progress - Update goal progress
router.post('/:id/progress',
  authMiddleware,
  [
    body('value').isNumeric().withMessage('Progress value must be a number'),
    body('source').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const { value, source = 'manual', note } = req.body;

      console.log(`📈 Updating progress for goal ${id}: ${value}`);

      const goal = await Goal.findOne({ _id: id, userId });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      await goal.updateProgress(value, source);

      // Add custom note if provided
      if (note) {
        goal.history.push({
          action: 'progress_updated',
          note,
          automaticUpdate: source !== 'manual'
        });
        await goal.save();
      }

      res.json({
        success: true,
        message: 'Progress updated successfully',
        goal: goal.toObject()
      });
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update progress',
        error: error.message
      });
    }
  }
);

// POST /api/goals/:id/milestones - Add milestone
router.post('/:id/milestones',
  authMiddleware,
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Description is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const { date, description } = req.body;

      console.log(`🎯 Adding milestone to goal ${id}`);

      const goal = await Goal.findOne({ _id: id, userId });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      await goal.addMilestone(date, description);

      res.json({
        success: true,
        message: 'Milestone added successfully',
        goal: goal.toObject()
      });
    } catch (error) {
      console.error('❌ Error adding milestone:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add milestone',
        error: error.message
      });
    }
  }
);

// PUT /api/goals/:id/milestones/:milestoneIndex/achieve - Mark milestone as achieved
router.put('/:id/milestones/:milestoneIndex/achieve', authMiddleware, async (req, res) => {
  try {
    const { id, milestoneIndex } = req.params;
    const userId = req.user.userId;

    console.log(`✅ Achieving milestone ${milestoneIndex} for goal ${id}`);

    const goal = await Goal.findOne({ _id: id, userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const index = parseInt(milestoneIndex);
    if (index < 0 || index >= goal.timeline.milestones.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid milestone index'
      });
    }

    await goal.achieveMilestone(index);

    res.json({
      success: true,
      message: 'Milestone achieved!',
      goal: goal.toObject()
    });
  } catch (error) {
    console.error('❌ Error achieving milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to achieve milestone',
      error: error.message
    });
  }
});

// GET /api/goals/analytics/summary - Get goals analytics summary
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = '1month' } = req.query;

    console.log(`📊 Getting goals analytics summary for user ${userId}`);

    const summary = await GoalTrackingService.getGoalsAnalyticsSummary(userId, period);

    res.json({
      success: true,
      period,
      summary
    });
  } catch (error) {
    console.error('❌ Error getting goals analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get goals analytics',
      error: error.message
    });
  }
});

// POST /api/goals/templates/:templateId - Create goal from template
router.post('/templates/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.userId;
    const customizations = req.body;

    console.log(`📋 Creating goal from template ${templateId} for user ${userId}`);

    const goal = await GoalTrackingService.createGoalFromTemplate(
      userId, 
      templateId, 
      customizations
    );

    res.status(201).json({
      success: true,
      message: 'Goal created from template',
      goal: goal.toObject()
    });
  } catch (error) {
    console.error('❌ Error creating goal from template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal from template',
      error: error.message
    });
  }
});

// POST /api/goals/sync-progress - Sync progress from workouts
router.post('/sync-progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { goalIds = [] } = req.body; // Specific goals to sync, or empty for all

    console.log(`🔄 Syncing goal progress for user ${userId}`);

    const results = await GoalTrackingService.syncGoalProgressFromWorkouts(
      userId, 
      goalIds.length > 0 ? goalIds : null
    );

    res.json({
      success: true,
      message: 'Goal progress synced successfully',
      results
    });
  } catch (error) {
    console.error('❌ Error syncing goal progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync goal progress',
      error: error.message
    });
  }
});

export default router;