import express from 'express';
import coolifyService from '../services/coolifyService.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Coolify API Token Requirements:
 * - read: Basic read permissions for general API access
 * - read:sensitive: Required for deployment status, logs, and sensitive configuration
 * - deploy: Optional, needed only if triggering deployments via API
 * 
 * If getting 403 errors, check that your COOLIFY_API_KEY has sufficient permissions
 * in Coolify Settings → API Tokens
 */

// Admin authentication middleware for all routes
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
});

/**
 * @route   GET /api/deployment/status
 * @desc    Get current deployment status from Coolify
 * @access  Admin
 */
router.get('/status', async (req, res) => {
  try {
    console.log('📊 Admin requesting deployment status');

    if (!coolifyService.isConfigured()) {
      return res.json({
        success: true,
        data: {
          platform: 'Coolify',
          available: false,
          message: 'Coolify integration not configured',
          services: {
            backend: { status: 'not_configured', error: 'API credentials missing' },
            frontend: { status: 'not_configured', error: 'API credentials missing' }
          }
        }
      });
    }

    const deploymentStatus = await coolifyService.getDeploymentStatus();
    
    res.json({
      success: true,
      data: deploymentStatus
    });

  } catch (error) {
    console.error('❌ Failed to get deployment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/deployment/deployments
 * @desc    Get recent deployment history
 * @access  Admin
 */
router.get('/deployments', async (req, res) => {
  try {
    console.log('📋 Admin requesting deployment history');

    if (!coolifyService.isConfigured()) {
      return res.json({
        success: true,
        data: [],
        message: 'Coolify integration not configured'
      });
    }

    const deployments = await coolifyService.getRecentDeployments();
    
    res.json({
      success: true,
      data: deployments
    });

  } catch (error) {
    console.error('❌ Failed to get deployment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/deployment/health
 * @desc    Health check for Coolify integration
 * @access  Admin
 */
router.get('/health', async (req, res) => {
  try {
    const isConfigured = coolifyService.isConfigured();
    let connectionTest = false;

    if (isConfigured) {
      connectionTest = await coolifyService.testConnection();
    }

    res.json({
      success: true,
      data: {
        configured: isConfigured,
        connected: connectionTest,
        apiUrl: coolifyService.apiUrl ? 'configured' : 'missing',
        apiToken: coolifyService.apiToken ? 'configured' : 'missing',
        backendAppId: coolifyService.backendAppId ? 'configured' : 'missing',
        frontendAppId: coolifyService.frontendAppId ? 'configured' : 'missing'
      }
    });

  } catch (error) {
    console.error('❌ Deployment health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

export default router;