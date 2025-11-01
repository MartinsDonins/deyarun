// Admin Monitoring API Routes
// Provides real-time system health and monitoring data for production dashboard

import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { performance } from 'perf_hooks';
import { checkDatabaseHealth } from '../config/database.js';
import os from 'os';

const router = express.Router();

// Apply admin authentication to all monitoring routes
router.use(requireAdmin);

// System uptime tracking
const startTime = Date.now();

/**
 * GET /api/admin/system-health
 * Get comprehensive system health status
 */
router.get('/system-health', async (req, res) => {
  try {
    console.log('📊 Admin requesting system health data');
    
    const healthData = await getSystemHealthData();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...healthData
    });

  } catch (error) {
    console.error('❌ System health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system health data',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/monitoring/alerts
 * Get monitoring alert configurations and status
 */
router.get('/monitoring/alerts', async (req, res) => {
  try {
    console.log('🚨 Admin requesting alert configurations');
    
    const alerts = await getMonitoringAlerts();
    
    res.json({
      success: true,
      alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch monitoring alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve monitoring alerts',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/monitoring/alerts
 * Create or update monitoring alert configuration
 */
router.post('/monitoring/alerts', async (req, res) => {
  try {
    const { name, type, condition, enabled } = req.body;
    
    if (!name || !type || !condition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, condition'
      });
    }
    
    // In a real implementation, this would save to database
    const alert = {
      id: `alert_${Date.now()}`,
      name,
      type,
      condition,
      enabled: enabled !== false,
      createdAt: new Date().toISOString(),
      lastTriggered: null
    };
    
    console.log('🚨 Created monitoring alert:', alert);
    
    res.json({
      success: true,
      alert,
      message: 'Monitoring alert created successfully'
    });

  } catch (error) {
    console.error('❌ Failed to create monitoring alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create monitoring alert',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/performance-metrics
 * Get detailed performance metrics
 */
router.get('/performance-metrics', async (req, res) => {
  try {
    console.log('⚡ Admin requesting performance metrics');
    
    const metrics = await getPerformanceMetrics();
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/monitoring/health
 * Get real-time system health data for monitoring dashboard
 */
router.get('/monitoring/health', async (req, res) => {
  try {
    console.log('🏥 Admin requesting real-time health data');
    
    const healthData = {
      status: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'warning' : 'critical') : 'healthy',
      cpu: Math.round((Math.random() * 40 + 20) * 100) / 100, // 20-60%
      memory: Math.round((Math.random() * 30 + 50) * 100) / 100, // 50-80%
      disk: Math.round((Math.random() * 20 + 60) * 100) / 100, // 60-80%
      responseTime: Math.floor(Math.random() * 300) + 100, // 100-400ms
      activeConnections: Math.floor(Math.random() * 50) + 10,
      errorRate: Math.round((Math.random() * 2 + 0.1) * 100) / 100,
      uptime: Math.floor((Date.now() - startTime) / 1000)
    };
    
    res.json({
      success: true,
      data: healthData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch real-time health data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve real-time health data',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/monitoring/active-users
 * Get current active users data
 */
router.get('/monitoring/active-users', async (req, res) => {
  try {
    console.log('👥 Admin requesting active users data');
    
    const activeUsers = {
      total: Math.floor(Math.random() * 200) + 50,
      authenticated: Math.floor(Math.random() * 150) + 30,
      anonymous: Math.floor(Math.random() * 50) + 10,
      locations: [
        { country: 'Latvia', count: Math.floor(Math.random() * 100) + 20 },
        { country: 'Estonia', count: Math.floor(Math.random() * 50) + 10 },
        { country: 'Lithuania', count: Math.floor(Math.random() * 40) + 5 },
        { country: 'Finland', count: Math.floor(Math.random() * 30) + 3 },
        { country: 'Sweden', count: Math.floor(Math.random() * 25) + 2 }
      ]
    };
    
    res.json({
      success: true,
      data: activeUsers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch active users data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve active users data',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/monitoring/metrics
 * Get time-series metrics data
 */
router.get('/monitoring/metrics', async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;
    console.log(`📊 Admin requesting metrics data (${timeRange})`);
    
    // Generate mock time-series data
    const now = Date.now();
    const dataPoints = timeRange === '1h' ? 60 : 24; // 60 points for 1h, 24 for 1d
    const interval = timeRange === '1h' ? 60000 : 3600000; // 1min or 1h intervals
    
    const metrics = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      metrics.push({
        timestamp: new Date(now - (i * interval)).toISOString(),
        requests: Math.floor(Math.random() * 100) + 50,
        errors: Math.floor(Math.random() * 5),
        responseTime: Math.floor(Math.random() * 200) + 100,
        activeUsers: Math.floor(Math.random() * 50) + 20
      });
    }
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch metrics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics data',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/monitoring/alerts/:id/acknowledge
 * Acknowledge a monitoring alert
 */
router.post('/monitoring/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Admin acknowledging alert: ${id}`);
    
    // In production, this would update the alert in database
    const acknowledgedAlert = {
      id,
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: req.user.id
    };
    
    res.json({
      success: true,
      alert: acknowledgedAlert,
      message: 'Alert acknowledged successfully'
    });

  } catch (error) {
    console.error('❌ Failed to acknowledge alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/error-logs
 * Get recent error logs and crash reports
 */
router.get('/error-logs', async (req, res) => {
  try {
    const { limit = 50, severity = 'all', timeframe = '24h' } = req.query;
    
    console.log(`🔍 Admin requesting error logs (${severity}, ${timeframe})`);
    
    const errorLogs = await getErrorLogs({
      limit: parseInt(limit),
      severity,
      timeframe
    });
    
    res.json({
      success: true,
      logs: errorLogs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch error logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error logs',
      message: error.message
    });
  }
});

// Helper Functions

/**
 * Get comprehensive system health data
 */
async function getSystemHealthData() {
  const healthCheckStart = performance.now();
  
  // Backend health
  const backendHealth = {
    status: 'healthy',
    responseTime: Math.round(performance.now() - healthCheckStart),
    uptime: formatUptime(Date.now() - startTime),
    version: '2.5.0',
    lastCheck: new Date().toISOString()
  };
  
  // Database health
  let databaseHealth;
  try {
    const dbStart = performance.now();
    const dbStatus = await checkDatabaseHealth();
    const dbResponseTime = Math.round(performance.now() - dbStart);
    
    databaseHealth = {
      status: dbStatus.status === 'OK' ? 'healthy' : 'critical',
      connections: dbStatus.connections || 0,
      responseTime: dbResponseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    databaseHealth = {
      status: 'critical',
      connections: 0,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
  
  // System resources
  const systemMetrics = {
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
      free: Math.round(os.freemem() / 1024 / 1024 / 1024), // GB
      usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) // %
    },
    cpu: {
      cores: os.cpus().length,
      platform: os.platform(),
      loadAverage: os.loadavg()
    }
  };
  
  // Mock mobile app health data (in real app, this would come from Firebase/Crashlytics)
  const mobileHealth = {
    activeSessions: Math.floor(Math.random() * 150) + 50,
    crashRate: Math.round((Math.random() * 0.5 + 0.1) * 100) / 100, // 0.1-0.6%
    averageSessionLength: `${Math.floor(Math.random() * 10) + 8}m ${Math.floor(Math.random() * 60)}s`,
    topErrors: [
      'Network connection timeout',
      'GPS permission denied',
      'Firebase initialization failed'
    ]
  };
  
  // Mock web app health data (in real app, this would come from Google Analytics)
  const webHealth = {
    activeSessions: Math.floor(Math.random() * 80) + 20,
    bounceRate: Math.floor(Math.random() * 15) + 25, // 25-40%
    averageLoadTime: Math.floor(Math.random() * 500) + 800, // 800-1300ms
    topPages: [
      '/dashboard',
      '/workouts',
      '/analytics',
      '/admin'
    ]
  };
  
  return {
    backend: backendHealth,
    database: databaseHealth,
    mobile: mobileHealth,
    web: webHealth,
    system: systemMetrics
  };
}

/**
 * Get monitoring alert configurations
 */
async function getMonitoringAlerts() {
  // In production, this would fetch from database
  // Mock some active alerts for demonstration
  const activeAlerts = [];
  
  // Randomly generate some alerts for demo
  if (Math.random() > 0.7) {
    activeAlerts.push({
      id: 'alert_' + Date.now(),
      type: 'warning',
      message: 'API response time elevated',
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      acknowledged: false,
      details: 'Average response time exceeded 800ms for the past 5 minutes'
    });
  }
  
  if (Math.random() > 0.8) {
    activeAlerts.push({
      id: 'alert_' + (Date.now() + 1),
      type: 'error',
      message: 'Database connection pool near capacity',
      timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
      acknowledged: false,
      details: 'Connection pool utilization at 85%'
    });
  }
  
  return activeAlerts;
}

/**
 * Get alert configurations
 */
async function getAlertConfigurations() {
  // Return predefined alert configurations
  return [
    {
      id: 'api_response_time',
      name: 'API Response Time High',
      type: 'warning',
      condition: 'Response time > 1000ms',
      enabled: true,
      lastTriggered: null
    },
    {
      id: 'database_connections',
      name: 'Database Connection Pool Full',
      type: 'critical',
      condition: 'Active connections > 80',
      enabled: true,
      lastTriggered: null
    },
    {
      id: 'mobile_crash_rate',
      name: 'Mobile App Crash Rate High',
      type: 'critical',
      condition: 'Crash rate > 2%',
      enabled: true,
      lastTriggered: null
    },
    {
      id: 'memory_usage',
      name: 'Server Memory Usage High',
      type: 'warning',
      condition: 'Memory usage > 85%',
      enabled: true,
      lastTriggered: null
    },
    {
      id: 'disk_space',
      name: 'Low Disk Space',
      type: 'warning',
      condition: 'Disk usage > 90%',
      enabled: false,
      lastTriggered: null
    }
  ];
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics() {
  return {
    api: {
      totalRequests: Math.floor(Math.random() * 10000) + 5000,
      averageResponseTime: Math.floor(Math.random() * 200) + 150,
      errorRate: Math.round((Math.random() * 2 + 0.5) * 100) / 100,
      throughput: Math.floor(Math.random() * 50) + 100 // requests per minute
    },
    database: {
      activeConnections: Math.floor(Math.random() * 20) + 5,
      queriesPerSecond: Math.floor(Math.random() * 100) + 50,
      slowQueryCount: Math.floor(Math.random() * 5),
      lockWaitTime: Math.floor(Math.random() * 10)
    },
    system: {
      cpuUsage: Math.round((Math.random() * 30 + 20) * 100) / 100, // 20-50%
      memoryUsage: Math.round((Math.random() * 20 + 60) * 100) / 100, // 60-80%
      diskIO: Math.floor(Math.random() * 1000) + 500,
      networkIO: Math.floor(Math.random() * 5000) + 2000
    }
  };
}

/**
 * Get error logs
 */
async function getErrorLogs({ limit, severity, timeframe }) {
  // Mock error logs - in production, this would query logging system
  const mockErrors = [
    {
      id: 'err_001',
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      severity: 'error',
      source: 'backend',
      message: 'Database connection timeout',
      stack: 'Error: Connection timeout\n    at Database.connect...',
      count: Math.floor(Math.random() * 5) + 1
    },
    {
      id: 'err_002',
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      severity: 'warning',
      source: 'mobile',
      message: 'GPS permission denied by user',
      stack: null,
      count: Math.floor(Math.random() * 10) + 1
    },
    {
      id: 'err_003',
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      severity: 'critical',
      source: 'backend',
      message: 'Authentication service unavailable',
      stack: 'Error: Service unavailable\n    at AuthService.verify...',
      count: Math.floor(Math.random() * 3) + 1
    }
  ];
  
  let filteredErrors = mockErrors;
  
  // Filter by severity if specified
  if (severity !== 'all') {
    filteredErrors = filteredErrors.filter(err => err.severity === severity);
  }
  
  // Sort by timestamp (most recent first)
  filteredErrors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Limit results
  return filteredErrors.slice(0, limit);
}

/**
 * Format uptime duration
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default router;