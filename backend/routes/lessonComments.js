// ✅ Lesson Comments route - MongoDB Compatible
import express from 'express';
import mongoose from 'mongoose';
import { User, Course } from '../models/mongodb/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
console.log('✅ Lesson Comments route enabled with MongoDB support');

// Comment Schema
const CommentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
  lessonId: { type: String, required: true }, // Lesson ID within course
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  content: { type: String, required: true, maxlength: 2000 },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // For replies
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'lessoncomments' });

const Comment = mongoose.model('Comment', CommentSchema);

// Get comments for a lesson
router.get('/:courseId/:lessonId', authMiddleware, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Get comments with user info
    const comments = await Comment.find({ 
      courseId, 
      lessonId,
      parentCommentId: { $exists: false } // Only root comments
    })
    .populate('userId', 'firstName lastName')
    .populate({
      path: 'replies',
      populate: { path: 'userId', select: 'firstName lastName' }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentCommentId: comment._id })
          .populate('userId', 'firstName lastName')
          .sort({ createdAt: 1 });
        
        return {
          ...comment.toObject(),
          replies,
          likesCount: comment.likes.length,
          isLiked: comment.likes.includes(req.user.userId)
        };
      })
    );

    const total = await Comment.countDocuments({ courseId, lessonId, parentCommentId: { $exists: false } });

    res.json({
      success: true,
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get lesson comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson comments',
      message: error.message
    });
  }
});

// Create new comment
router.post('/:courseId/:lessonId', authMiddleware, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.userId;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Verify parent comment exists if replying
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, error: 'Parent comment not found' });
      }
    }

    const comment = new Comment({
      courseId,
      lessonId,
      userId,
      content: content.trim(),
      parentCommentId: parentCommentId || undefined
    });

    await comment.save();

    // Populate user info for response
    await comment.populate('userId', 'firstName lastName');

    res.status(201).json({
      success: true,
      comment: {
        ...comment.toObject(),
        likesCount: 0,
        isLiked: false,
        replies: []
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment',
      message: error.message
    });
  }
});

// Update comment
router.patch('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found or not authorized' });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    comment.updatedAt = new Date();

    await comment.save();
    await comment.populate('userId', 'firstName lastName');

    res.json({
      success: true,
      comment: {
        ...comment.toObject(),
        likesCount: comment.likes.length,
        isLiked: comment.likes.includes(userId)
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment',
      message: error.message
    });
  }
});

// Delete comment
router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found or not authorized' });
    }

    // Delete replies first
    await Comment.deleteMany({ parentCommentId: commentId });
    
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
      message: error.message
    });
  }
});

// Like/unlike comment
router.post('/:commentId/like', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => !id.equals(userId));
    } else {
      // Like
      comment.likes.push(userId);
    }

    await comment.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: comment.likes.length
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like comment',
      message: error.message
    });
  }
});
export default router;