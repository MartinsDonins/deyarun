import express from 'express';
import { AIConversation } from '../models/mongodb/index.js';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/ai-conversations - Start new conversation or add message
router.post('/', async (req, res) => {
  try {
    const {
      sessionId,
      role,
      content,
      conversationType = 'general',
      userEmail,
      metadata = {},
      source = 'web',
      language = 'lv'
    } = req.body;

    if (!content || !role) {
      return res.status(400).json({
        success: false,
        message: 'Content and role are required'
      });
    }

    const finalSessionId = sessionId || uuidv4();
    let conversation = await AIConversation.findOne({ sessionId: finalSessionId });

    if (!conversation) {
      // Create new conversation
      conversation = new AIConversation({
        sessionId: finalSessionId,
        userId: req.user?.userId || null,
        userEmail: userEmail || req.user?.email || null,
        conversationType,
        source,
        language,
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress,
        metadata: {
          ...metadata,
          initialSource: source
        }
      });
    }

    // Add message to conversation
    conversation.addMessage(role, content, {
      ...metadata,
      timestamp: new Date(),
      source
    });

    await conversation.save();

    res.json({
      success: true,
      sessionId: finalSessionId,
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        messageCount: conversation.messageCount,
        isActive: conversation.isActive
      }
    });

  } catch (error) {
    console.error('Error saving AI conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai-conversations/:sessionId - Get specific conversation
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const conversation = await AIConversation.findOne({ sessionId })
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
});

// PUT /api/ai-conversations/:sessionId/end - End conversation
router.put('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { feedback, rating, resolved = false } = req.body;

    const conversation = await AIConversation.findOne({ sessionId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.endConversation();
    
    if (feedback) conversation.feedback = feedback;
    if (rating) conversation.rating = rating;
    if (resolved !== undefined) conversation.resolved = resolved;

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation ended successfully',
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        duration: conversation.duration,
        messageCount: conversation.messageCount,
        resolved: conversation.resolved
      }
    });

  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end conversation'
    });
  }
});

// PUT /api/ai-conversations/:sessionId/tags - Add tags to conversation
router.put('/:sessionId/tags', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array'
      });
    }

    const conversation = await AIConversation.findOne({ sessionId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.addTags(tags);
    await conversation.save();

    res.json({
      success: true,
      message: 'Tags added successfully',
      tags: conversation.tags
    });

  } catch (error) {
    console.error('Error adding tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add tags'
    });
  }
});

// ADMIN ROUTES - Require admin authentication

// GET /api/ai-conversations/admin/list - Get all conversations for admin
router.get('/admin/list', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      conversationType,
      resolved,
      sentiment,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};
    
    if (conversationType) query.conversationType = conversationType;
    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (sentiment) query.sentiment = sentiment;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { summary: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [conversations, total] = await Promise.all([
      AIConversation.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AIConversation.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching conversations for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// GET /api/ai-conversations/admin/analytics - Get conversation analytics
router.get('/admin/analytics', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const [analytics] = await AIConversation.getAnalytics(dateRange);
    
    // Get additional stats
    const [
      recentConversations,
      topTags,
      conversationsByDay
    ] = await Promise.all([
      AIConversation.find()
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      AIConversation.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      AIConversation.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ])
    ]);

    res.json({
      success: true,
      analytics: analytics || {
        totalConversations: 0,
        averageMessages: 0,
        averageDuration: 0,
        resolvedCount: 0,
        resolutionRate: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        typeBreakdown: { support: 0, training: 0, general: 0 }
      },
      recentConversations,
      topTags,
      conversationsByDay
    });

  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// PUT /api/ai-conversations/admin/:id - Update conversation (admin only)
router.put('/admin/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only allow certain fields to be updated
    const allowedFields = [
      'conversationType', 'summary', 'topic', 'tags', 'sentiment', 
      'resolved', 'rating', 'feedback'
    ];
    
    const updateData = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    const conversation = await AIConversation.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation updated successfully',
      conversation
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversation'
    });
  }
});

// DELETE /api/ai-conversations/admin/:id - Delete conversation (admin only)
router.delete('/admin/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await AIConversation.findByIdAndDelete(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation'
    });
  }
});

export default router;