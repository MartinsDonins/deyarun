// Performance Monitoring API Routes
// Provides endpoints for performance metrics, load testing, and system health

import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import performanceMonitoringService from '../services/performanceMonitoringService.js';
import cacheMiddleware from '../middleware/cacheMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import loadTesting from '../testing/loadTesting.js';

const router = express.Router();

// Apply admin authentication to all performance routes
router.use(requireAdmin);

/**
 * GET /api/performance/summary
 * Get current performance summary
 */
router.get('/summary', 
  cacheMiddleware.cacheResponse({ ttl: 30000 }), // Cache for 30 seconds
  (req, res) => {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      
      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting performance summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance summary',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/performance/metrics
 * Get detailed performance metrics
 */
router.get('/metrics', 
  cacheMiddleware.cacheResponse({ ttl: 60000 }), // Cache for 1 minute
  (req, res) => {
    try {
      const { timeRange = '3600000' } = req.query; // Default 1 hour
      const timeRangeMs = parseInt(timeRange);
      
      if (isNaN(timeRangeMs) || timeRangeMs < 60000 || timeRangeMs > 86400000) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time range',
          message: 'Time range must be between 1 minute and 24 hours (in milliseconds)'
        });
      }
      
      const metrics = performanceMonitoringService.getPerformanceMetrics(timeRangeMs);
      
      res.json({
        success: true,
        data: metrics,
        timeRange: timeRangeMs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/performance/cache
 * Get cache statistics
 */
router.get('/cache', (req, res) => {
  try {
    const cacheStats = cacheMiddleware.getCacheStats();
    
    res.json({
      success: true,
      data: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics',
      message: error.message
    });
  }
});

/**
 * DELETE /api/performance/cache
 * Clear cache
 */
router.delete('/cache', (req, res) => {
  try {
    const clearedEntries = cacheMiddleware.clearCache();
    
    res.json({
      success: true,
      message: `Cleared ${clearedEntries} cache entries`,
      clearedEntries
    });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * POST /api/performance/cache/invalidate
 * Invalidate cache by pattern or tags
 */
router.post('/cache/invalidate', (req, res) => {
  try {
    const { pattern, tags } = req.body;
    
    if (!pattern && (!tags || !Array.isArray(tags))) {
      return res.status(400).json({
        success: false,
        error: 'Either pattern or tags array must be provided'
      });
    }
    
    const invalidatedCount = cacheMiddleware.invalidateCache(pattern, tags || []);
    
    res.json({
      success: true,
      message: `Invalidated ${invalidatedCount} cache entries`,
      invalidatedCount,
      pattern,
      tags
    });
  } catch (error) {
    console.error('❌ Error invalidating cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/security
 * Get security statistics
 */
router.get('/security', (req, res) => {
  try {
    const securityStats = securityMiddleware.getSecurityStats();
    
    res.json({
      success: true,
      data: securityStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting security stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/performance/load-test
 * Run load test
 */
router.post('/load-test', async (req, res) => {
  try {
    const {
      maxConcurrentUsers = 20,
      testDuration = 60000, // 1 minute default
      baseURL = `${req.protocol}://${req.get('host')}`
    } = req.body;
    
    // Validate parameters
    if (maxConcurrentUsers > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum concurrent users cannot exceed 100'
      });
    }
    
    if (testDuration > 300000) { // 5 minutes max
      return res.status(400).json({
        success: false,
        error: 'Test duration cannot exceed 5 minutes'
      });
    }
    
    // Start load test (async)
    res.json({
      success: true,
      message: 'Load test started',
      config: {
        maxConcurrentUsers,
        testDuration,
        baseURL
      },
      note: 'Load test is running in background. Check logs for results.'
    });
    
    // Run load test in background
    setTimeout(async () => {
      try {
        const results = await loadTesting.runLoadTest({
          maxConcurrentUsers,
          testDuration,
          baseURL
        });
        
        console.log('🚀 Load test completed:', results);
      } catch (error) {
        console.error('❌ Load test failed:', error);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error starting load test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start load test',
      message: error.message
    });
  }
});

/**
 * POST /api/performance/stress-test
 * Run stress test on specific endpoint
 */
router.post('/stress-test', async (req, res) => {
  try {
    const {
      endpoint = '/api/health',
      concurrentUsers = 10,
      requestsPerUser = 10,
      baseURL = `${req.protocol}://${req.get('host')}`
    } = req.body;
    
    // Validate parameters
    if (concurrentUsers > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum concurrent users for stress test cannot exceed 50'
      });
    }
    
    if (requestsPerUser > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum requests per user cannot exceed 50'
      });
    }
    
    console.log(`🔥 Starting stress test on ${endpoint}...`);
    
    const results = await loadTesting.runStressTest(endpoint, {
      concurrentUsers,
      requestsPerUser,
      baseURL
    });
    
    res.json({
      success: true,
      data: results,
      config: {
        endpoint,
        concurrentUsers,
        requestsPerUser,
        baseURL
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error running stress test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run stress test',
      message: error.message
    });
  }
});

/**
 * GET /api/performance/recommendations
 * Get performance optimization recommendations
 */
router.get('/recommendations', (req, res) => {
  try {
    const summary = performanceMonitoringService.getPerformanceSummary();
    const cacheStats = cacheMiddleware.getCacheStats();
    const securityStats = securityMiddleware.getSecurityStats();
    
    const recommendations = generateOptimizationRecommendations(summary, cacheStats, securityStats);
    
    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

/**
 * Generate optimization recommendations based on current metrics
 */
function generateOptimizationRecommendations(summary, cacheStats, securityStats) {
  const recommendations = [];
  
  // CPU optimization recommendations
  if (summary.system.cpu.current > 70) {
    recommendations.push({
      category: 'CPU',
      severity: summary.system.cpu.current > 85 ? 'high' : 'medium',
      title: 'High CPU Usage Detected',
      description: `CPU usage is currently ${summary.system.cpu.current.toFixed(1)}%`,
      suggestions: [
        'Consider implementing request queuing to throttle incoming requests',
        'Review and optimize database queries for efficiency',
        'Implement caching for frequently accessed data',
        'Consider scaling horizontally by adding more server instances'
      ],
      estimatedImpact: 'High'
    });
  }
  
  // Memory optimization recommendations
  if (summary.system.memory.current > 80) {
    recommendations.push({
      category: 'Memory',
      severity: summary.system.memory.current > 90 ? 'high' : 'medium',
      title: 'High Memory Usage Detected',
      description: `Memory usage is currently ${summary.system.memory.current.toFixed(1)}%`,
      suggestions: [
        'Implement memory-efficient data structures',
        'Review and optimize object caching strategies',
        'Consider implementing data pagination for large datasets',
        'Monitor for potential memory leaks in application code'
      ],
      estimatedImpact: 'High'
    });
  }
  
  // Response time optimization recommendations
  if (summary.application.responseTime.avg > 1000) {
    recommendations.push({
      category: 'Response Time',
      severity: summary.application.responseTime.avg > 2000 ? 'high' : 'medium',
      title: 'Slow Response Times Detected',
      description: `Average response time is ${summary.application.responseTime.avg.toFixed(2)}ms`,
      suggestions: [
        'Implement API response caching for frequently accessed endpoints',
        'Optimize database queries and add appropriate indexes',
        'Consider implementing CDN for static assets',
        'Review and optimize business logic for efficiency'
      ],
      estimatedImpact: 'Very High'
    });
  }
  
  // Cache optimization recommendations
  if (cacheStats.hitRatio < 60) {
    recommendations.push({
      category: 'Caching',
      severity: 'medium',
      title: 'Low Cache Hit Ratio',
      description: `Current cache hit ratio is ${cacheStats.hitRatio.toFixed(1)}%`,
      suggestions: [
        'Review cache TTL settings for different types of data',
        'Implement cache warming for critical application paths',
        'Consider implementing cache tags for better invalidation',
        'Review caching strategy for frequently accessed endpoints'
      ],
      estimatedImpact: 'Medium'
    });
  }
  
  // Security recommendations
  if (securityStats.blocked > securityStats.requests * 0.01) {
    recommendations.push({
      category: 'Security',
      severity: 'medium',
      title: 'High Number of Blocked Requests',
      description: `${securityStats.blocked} requests have been blocked recently`,
      suggestions: [
        'Review and adjust rate limiting thresholds',
        'Implement IP whitelisting for known good actors',
        'Review security rules for false positives',
        'Consider implementing CAPTCHA for suspicious traffic'
      ],
      estimatedImpact: 'Medium'
    });
  }
  
  // Database recommendations
  if (summary.application.responseTime.avg > 500) {
    recommendations.push({
      category: 'Database',
      severity: 'medium',
      title: 'Database Performance Optimization',
      description: 'Database queries may be contributing to slow response times',
      suggestions: [
        'Add database indexes for frequently queried fields',
        'Implement connection pooling for database connections',
        'Consider implementing read replicas for read-heavy operations',
        'Review and optimize slow database queries'
      ],
      estimatedImpact: 'High'
    });
  }
  
  // General recommendations if everything looks good
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'General',
      severity: 'info',
      title: 'System Performance is Optimal',
      description: 'All performance metrics are within acceptable ranges',
      suggestions: [
        'Continue monitoring system performance regularly',
        'Consider implementing proactive alerting for performance degradation',
        'Review and update performance baselines periodically',
        'Plan for capacity scaling as user base grows'
      ],
      estimatedImpact: 'Maintenance'
    });
  }
  
  return {
    totalRecommendations: recommendations.length,
    severityBreakdown: {
      high: recommendations.filter(r => r.severity === 'high').length,
      medium: recommendations.filter(r => r.severity === 'medium').length,
      low: recommendations.filter(r => r.severity === 'low').length,
      info: recommendations.filter(r => r.severity === 'info').length
    },
    recommendations: recommendations.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1, info: 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
  };
}

export default router;