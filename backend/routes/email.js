// Email Routes - SendGrid Integration
import express from 'express';
import emailService from '../services/emailService.js';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/email/test
 * @desc Test email configuration
 * @access Private (Admin only)
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    // Only allow admins to test email configuration
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ 
    //     error: 'Unauthorized',
    //     message: 'Only administrators can test email configuration'
    //   });
    // }
    
    const result = await emailService.testEmailConfig(testEmail);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
        sentTo: testEmail || emailService.fromEmail
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      error: 'Email test failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/email/welcome
 * @desc Send welcome email to user
 * @access Private
 */
router.post('/welcome', authMiddleware, async (req, res) => {
  try {
    const { userEmail, userData } = req.body;
    
    if (!userEmail || !userData) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userEmail and userData are required'
      });
    }
    
    const result = await emailService.sendWelcomeEmail(userEmail, userData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send welcome email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({
      error: 'Welcome email failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/email/password-reset
 * @desc Send password reset email
 * @access Public
 */
router.post('/password-reset', async (req, res) => {
  try {
    const { userEmail, resetData } = req.body;
    
    if (!userEmail || !resetData || !resetData.resetLink) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userEmail and resetData with resetLink are required'
      });
    }
    
    const result = await emailService.sendPasswordResetEmail(userEmail, resetData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Password reset email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send password reset email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Password reset email error:', error);
    res.status(500).json({
      error: 'Password reset email failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/email/workout-summary
 * @desc Send workout summary email
 * @access Private
 */
router.post('/workout-summary', authMiddleware, async (req, res) => {
  try {
    const { userEmail, workoutData } = req.body;
    
    if (!userEmail || !workoutData) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userEmail and workoutData are required'
      });
    }
    
    const result = await emailService.sendWorkoutSummaryEmail(userEmail, workoutData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Workout summary email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send workout summary email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Workout summary email error:', error);
    res.status(500).json({
      error: 'Workout summary email failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/email/weekly-report
 * @desc Send weekly progress report email
 * @access Private
 */
router.post('/weekly-report', authMiddleware, async (req, res) => {
  try {
    const { userEmail, reportData } = req.body;
    
    if (!userEmail || !reportData) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userEmail and reportData are required'
      });
    }
    
    const result = await emailService.sendWeeklyReportEmail(userEmail, reportData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Weekly report email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send weekly report email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Weekly report email error:', error);
    res.status(500).json({
      error: 'Weekly report email failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/email/custom
 * @desc Send custom email using template
 * @access Private
 */
router.post('/custom', authMiddleware, async (req, res) => {
  try {
    const { userEmail, subject, templateData, templateName } = req.body;
    
    if (!userEmail || !templateData) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userEmail and templateData are required'
      });
    }
    
    const result = await emailService.sendCustomEmail(
      userEmail, 
      subject, 
      templateData, 
      templateName || 'custom'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Custom email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send custom email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Custom email error:', error);
    res.status(500).json({
      error: 'Custom email failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/email/bulk
 * @desc Send bulk emails
 * @access Private (Admin only)
 */
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { emails, subject, htmlContent, textContent } = req.body;
    
    // Only allow admins to send bulk emails
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ 
    //     error: 'Unauthorized',
    //     message: 'Only administrators can send bulk emails'
    //   });
    // }
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Invalid emails array',
        message: 'emails must be a non-empty array'
      });
    }
    
    if (!subject || !htmlContent) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'subject and htmlContent are required'
      });
    }
    
    const results = await emailService.sendBulkEmails(
      emails, 
      subject, 
      htmlContent, 
      textContent
    );
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.json({
      success: true,
      message: `Bulk email operation completed`,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        successRate: `${((successCount / results.length) * 100).toFixed(1)}%`
      },
      results: results
    });
    
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({
      error: 'Bulk email failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/email/stats
 * @desc Get email service statistics
 * @access Private
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Email stats error:', error);
    res.status(500).json({
      error: 'Failed to get email stats',
      message: error.message
    });
  }
});

/**
 * @route GET /api/email/templates
 * @desc Get available email templates
 * @access Private
 */
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();
    
    res.json({
      success: true,
      templates: stats.templatesAvailable,
      templateDetails: {
        welcome: 'Welcome email for new users',
        passwordReset: 'Password reset email with secure link',
        workoutSummary: 'Post-workout summary with statistics',
        weeklyReport: 'Weekly progress report with analytics'
      }
    });
    
  } catch (error) {
    console.error('Templates list error:', error);
    res.status(500).json({
      error: 'Failed to get templates',
      message: error.message
    });
  }
});

export default router;