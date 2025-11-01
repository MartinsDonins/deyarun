import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { DataExportService } from '../services/dataExportService.js';
import { query, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/data-export/workouts - Export workout data
router.get('/workouts',
  authMiddleware,
  [
    query('format').optional().isIn(['csv', 'json', 'xlsx']).withMessage('Invalid format'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('includeGPS').optional().isBoolean().withMessage('includeGPS must be boolean')
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
      const { 
        format = 'csv', 
        startDate, 
        endDate, 
        includeGPS = false 
      } = req.query;

      console.log(`📤 Exporting workouts for user ${userId} in ${format} format`);

      const exportData = await DataExportService.exportWorkouts(userId, {
        format,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        includeGPS: includeGPS === 'true'
      });

      // Set appropriate headers based on format
      const headers = DataExportService.getExportHeaders(format, 'workouts');
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.send(exportData.data);
    } catch (error) {
      console.error('❌ Error exporting workouts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export workout data',
        error: error.message
      });
    }
  }
);

// GET /api/data-export/analytics - Export analytics report
router.get('/analytics',
  authMiddleware,
  [
    query('format').optional().isIn(['pdf', 'json', 'csv']).withMessage('Invalid format'),
    query('period').optional().isIn(['1month', '3months', '6months', '1year']).withMessage('Invalid period'),
    query('includeCharts').optional().isBoolean().withMessage('includeCharts must be boolean')
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
      const { 
        format = 'pdf', 
        period = '3months',
        includeCharts = true 
      } = req.query;

      console.log(`📊 Generating analytics report for user ${userId}`);

      const reportData = await DataExportService.generateAnalyticsReport(userId, {
        format,
        period,
        includeCharts: includeCharts === 'true'
      });

      const headers = DataExportService.getExportHeaders(format, 'analytics_report');
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.send(reportData.data);
    } catch (error) {
      console.error('❌ Error generating analytics report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate analytics report',
        error: error.message
      });
    }
  }
);

// GET /api/data-export/goals - Export goals data
router.get('/goals',
  authMiddleware,
  [
    query('format').optional().isIn(['csv', 'json', 'xlsx']).withMessage('Invalid format'),
    query('includeProgress').optional().isBoolean().withMessage('includeProgress must be boolean'),
    query('status').optional().isIn(['active', 'completed', 'paused', 'all']).withMessage('Invalid status')
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
      const { 
        format = 'csv', 
        includeProgress = true,
        status = 'all'
      } = req.query;

      console.log(`🎯 Exporting goals for user ${userId}`);

      const exportData = await DataExportService.exportGoals(userId, {
        format,
        includeProgress: includeProgress === 'true',
        status: status !== 'all' ? status : null
      });

      const headers = DataExportService.getExportHeaders(format, 'goals');
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.send(exportData.data);
    } catch (error) {
      console.error('❌ Error exporting goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export goals data',
        error: error.message
      });
    }
  }
);

// GET /api/data-export/complete - Export complete user data package
router.get('/complete',
  authMiddleware,
  [
    query('format').optional().isIn(['zip', 'json']).withMessage('Invalid format'),
    query('includeGPS').optional().isBoolean().withMessage('includeGPS must be boolean')
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
      const { 
        format = 'zip', 
        includeGPS = false 
      } = req.query;

      console.log(`📦 Generating complete data export for user ${userId}`);

      const exportData = await DataExportService.exportCompleteUserData(userId, {
        format,
        includeGPS: includeGPS === 'true'
      });

      const headers = DataExportService.getExportHeaders(format, 'complete_export');
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.send(exportData.data);
    } catch (error) {
      console.error('❌ Error generating complete export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate complete data export',
        error: error.message
      });
    }
  }
);

// POST /api/data-export/request - Request large data export (async)
router.post('/request',
  authMiddleware,
  [
    query('type').isIn(['workouts', 'analytics', 'goals', 'complete']).withMessage('Invalid export type'),
    query('format').optional().isIn(['csv', 'json', 'xlsx', 'pdf', 'zip']).withMessage('Invalid format'),
    query('email').optional().isEmail().withMessage('Invalid email format')
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
      const { type, format = 'csv', email, options = {} } = req.body;

      console.log(`📮 Queuing data export request for user ${userId}: ${type}`);

      const exportRequest = await DataExportService.queueExportRequest(userId, {
        type,
        format,
        email,
        options
      });

      res.json({
        success: true,
        message: 'Export request queued successfully',
        requestId: exportRequest.id,
        estimatedTime: exportRequest.estimatedTime,
        status: 'queued'
      });
    } catch (error) {
      console.error('❌ Error queuing export request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to queue export request',
        error: error.message
      });
    }
  }
);

// GET /api/data-export/status/:requestId - Check export request status
router.get('/status/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    console.log(`📋 Checking export status for request ${requestId}`);

    const status = await DataExportService.getExportStatus(requestId, userId);

    res.json({
      success: true,
      requestId,
      status: status.status,
      progress: status.progress,
      downloadUrl: status.downloadUrl,
      error: status.error,
      createdAt: status.createdAt,
      completedAt: status.completedAt
    });
  } catch (error) {
    console.error('❌ Error checking export status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check export status',
      error: error.message
    });
  }
});

export default router;