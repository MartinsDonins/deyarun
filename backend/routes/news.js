// News and Announcements API Routes
// Provides news feed functionality for DeyaRun users

import express from 'express';
import { News, User } from '../models/mongodb/index.js';
import authMiddleware, { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/news - Get news feed for users
 * Public endpoint with optional authentication for personalized content
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category = 'all',
      priority = 'all' 
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = {
      status: 'published',
      publishedAt: { $lte: new Date() }
    };

    if (category !== 'all') {
      filter.category = category;
    }

    if (priority !== 'all') {
      filter.priority = priority;
    }

    // Get news articles
    const newsArticles = await News.find(filter)
      .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .select('-content') // Exclude full content for feed
      .lean();

    // Get total count for pagination
    const totalCount = await News.countDocuments(filter);

    // Format response
    const formattedNews = newsArticles.map(article => ({
      id: article._id,
      title: article.title,
      excerpt: article.excerpt || article.title,
      category: article.category,
      priority: article.priority,
      publishedAt: article.publishedAt,
      readTime: article.readTime || '2 min',
      imageUrl: article.imageUrl,
      tags: article.tags || [],
      isUrgent: article.priority === 'urgent'
    }));

    res.json({
      success: true,
      news: formattedNews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + formattedNews.length < totalCount
      },
      categories: await getNewsCategories(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

/**
 * GET /api/news/:id - Get single news article
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await News.findOne({
      _id: id,
      status: 'published',
      publishedAt: { $lte: new Date() }
    }).lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    // Increment view count
    await News.updateOne(
      { _id: id },
      { $inc: { viewCount: 1 } }
    );

    res.json({
      success: true,
      article: {
        id: article._id,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        category: article.category,
        priority: article.priority,
        publishedAt: article.publishedAt,
        readTime: article.readTime,
        imageUrl: article.imageUrl,
        tags: article.tags || [],
        viewCount: (article.viewCount || 0) + 1,
        author: article.author
      }
    });

  } catch (error) {
    console.error('❌ Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article',
      message: error.message
    });
  }
});

/**
 * GET /api/news/user/unread-count - Get unread news count for authenticated user
 */
router.get('/user/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's last read timestamp or account creation date
    const user = await User.findById(userId).select('lastNewsRead createdAt');
    const lastReadDate = user?.lastNewsRead || user?.createdAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count unread news
    const unreadCount = await News.countDocuments({
      status: 'published',
      publishedAt: { 
        $lte: new Date(),
        $gt: lastReadDate 
      }
    });

    res.json({
      success: true,
      unreadCount,
      lastReadDate
    });

  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count',
      message: error.message
    });
  }
});

/**
 * POST /api/news/user/mark-read - Mark news as read for user
 */
router.post('/user/mark-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newsId, markAllRead = false } = req.body;

    if (markAllRead) {
      // Mark all news as read by updating user's lastNewsRead timestamp
      await User.updateOne(
        { _id: userId },
        { lastNewsRead: new Date() }
      );

      res.json({
        success: true,
        message: 'All news marked as read'
      });
    } else if (newsId) {
      // Mark specific news as read (store in user's readNews array)
      await User.updateOne(
        { _id: userId },
        { 
          $addToSet: { readNews: newsId },
          lastNewsRead: new Date()
        }
      );

      res.json({
        success: true,
        message: 'News article marked as read'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either newsId or markAllRead flag is required'
      });
    }

  } catch (error) {
    console.error('❌ Error marking news as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark news as read',
      message: error.message
    });
  }
});

// Admin endpoints
/**
 * GET /api/news/admin/all - Get all news for admin management
 */
router.get('/admin/all', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    const filter = status !== 'all' ? { status } : {};

    const news = await News.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('author', 'firstName lastName email')
      .lean();

    const totalCount = await News.countDocuments(filter);

    res.json({
      success: true,
      news: news.map(article => ({
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        priority: article.priority,
        status: article.status,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        viewCount: article.viewCount || 0,
        author: article.author
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

/**
 * POST /api/news/admin/create - Create new news article
 */
router.post('/admin/create', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category = 'general',
      priority = 'normal',
      publishedAt,
      imageUrl,
      tags = [],
      readTime
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const news = new News({
      title,
      content,
      excerpt: excerpt || title,
      category,
      priority,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      imageUrl,
      tags,
      readTime: readTime || estimateReadTime(content),
      author: req.user.userId,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await news.save();

    // If urgent priority, could trigger push notifications here
    if (priority === 'urgent') {
      console.log(`🚨 Urgent news published: ${title}`);
      // TODO: Trigger push notifications to all users
    }

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      news: {
        id: news._id,
        title: news.title,
        category: news.category,
        priority: news.priority,
        publishedAt: news.publishedAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create news article',
      message: error.message
    });
  }
});

/**
 * PUT /api/news/admin/:id - Update news article
 */
router.put('/admin/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Recalculate read time if content changed
    if (updateData.content) {
      updateData.readTime = updateData.readTime || estimateReadTime(updateData.content);
    }

    const news = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    res.json({
      success: true,
      message: 'News article updated successfully',
      news: {
        id: news._id,
        title: news.title,
        category: news.category,
        priority: news.priority,
        status: news.status
      }
    });

  } catch (error) {
    console.error('❌ Error updating news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update news article',
      message: error.message
    });
  }
});

/**
 * DELETE /api/news/admin/:id - Delete news article
 */
router.delete('/admin/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findByIdAndDelete(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    res.json({
      success: true,
      message: 'News article deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete news article',
      message: error.message
    });
  }
});

// Helper functions
async function getNewsCategories() {
  try {
    const categories = await News.distinct('category', { 
      status: 'published',
      publishedAt: { $lte: new Date() }
    });
    
    return categories.length > 0 ? categories : ['general', 'training', 'features', 'maintenance'];
  } catch (error) {
    return ['general', 'training', 'features', 'maintenance'];
  }
}

function estimateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(' ').length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
}

export default router;