// Performance Monitoring Service
// Real-time performance tracking, alerting, and optimization recommendations

import { performance } from 'perf_hooks';
import os from 'os';
import process from 'process';

// Performance monitoring configuration
const monitoringConfig = {
  metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  alertThresholds: {
    cpuUsage: 80, // %
    memoryUsage: 80, // %
    responseTime: 2000, // ms
    errorRate: 5, // %
    diskSpace: 90, // %
    activeConnections: 1000
  },
  samplingInterval: 10000, // 10 seconds
  slowQueryThreshold: 100, // ms
  memoryLeakThreshold: 1.5 // 50% increase over baseline
};

// Performance metrics storage
const performanceMetrics = {
  system: {
    cpu: [],
    memory: [],
    disk: [],
    network: []
  },
  application: {
    requests: [],
    responses: [],
    errors: [],
    database: [],
    cache: []
  },
  business: {
    activeUsers: [],
    workoutsCreated: [],
    apiUsage: []
  }
};

// Performance baselines (established over first hour of operation)
let performanceBaselines = null;
let baselineEstablished = false;

// Alert history
const alertHistory = [];

// Performance monitoring state
let monitoringActive = false;
let monitoringInterval = null;

/**
 * Start performance monitoring
 */
export function startPerformanceMonitoring() {
  if (monitoringActive) {
    console.log('⚠️ Performance monitoring already active');
    return;
  }
  
  monitoringActive = true;
  console.log('📊 Starting performance monitoring...');
  
  // Start metrics collection
  monitoringInterval = setInterval(collectMetrics, monitoringConfig.samplingInterval);
  
  // Establish baselines after 1 hour
  setTimeout(() => {
    establishPerformanceBaselines();
  }, 60 * 60 * 1000);
  
  // Start cleanup routine
  setInterval(cleanupOldMetrics, 60 * 60 * 1000); // Every hour
  
  console.log('✅ Performance monitoring started');
}

/**
 * Stop performance monitoring
 */
export function stopPerformanceMonitoring() {
  if (!monitoringActive) {
    return;
  }
  
  monitoringActive = false;
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  console.log('🛑 Performance monitoring stopped');
}

/**
 * Collect comprehensive system and application metrics
 */
async function collectMetrics() {
  const timestamp = Date.now();
  
  try {
    // System metrics
    const systemMetrics = await collectSystemMetrics();
    performanceMetrics.system.cpu.push({ timestamp, ...systemMetrics.cpu });
    performanceMetrics.system.memory.push({ timestamp, ...systemMetrics.memory });
    performanceMetrics.system.disk.push({ timestamp, ...systemMetrics.disk });
    performanceMetrics.system.network.push({ timestamp, ...systemMetrics.network });
    
    // Application metrics
    const appMetrics = await collectApplicationMetrics();
    performanceMetrics.application.requests.push({ timestamp, ...appMetrics.requests });
    performanceMetrics.application.responses.push({ timestamp, ...appMetrics.responses });
    performanceMetrics.application.errors.push({ timestamp, ...appMetrics.errors });
    performanceMetrics.application.database.push({ timestamp, ...appMetrics.database });
    performanceMetrics.application.cache.push({ timestamp, ...appMetrics.cache });
    
    // Business metrics
    const businessMetrics = await collectBusinessMetrics();
    performanceMetrics.business.activeUsers.push({ timestamp, ...businessMetrics.activeUsers });
    performanceMetrics.business.workoutsCreated.push({ timestamp, ...businessMetrics.workoutsCreated });
    performanceMetrics.business.apiUsage.push({ timestamp, ...businessMetrics.apiUsage });
    
    // Check for performance alerts
    checkPerformanceAlerts(systemMetrics, appMetrics);
    
  } catch (error) {
    console.error('❌ Error collecting metrics:', error);
  }
}

/**
 * Collect system performance metrics
 */
async function collectSystemMetrics() {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const loadAvg = os.loadavg();
  
  // CPU usage calculation
  let cpuUsage = 0;
  if (cpus.length > 0) {
    const cpuTimes = cpus.reduce((acc, cpu) => {
      acc.idle += cpu.times.idle;
      acc.total += Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      return acc;
    }, { idle: 0, total: 0 });
    
    cpuUsage = ((cpuTimes.total - cpuTimes.idle) / cpuTimes.total) * 100;
  }
  
  // Memory usage
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
  
  // Process-specific metrics
  const processMemory = process.memoryUsage();
  const processUptime = process.uptime();
  
  return {
    cpu: {
      usage: cpuUsage,
      cores: cpus.length,
      loadAvg1: loadAvg[0],
      loadAvg5: loadAvg[1],
      loadAvg15: loadAvg[2]
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: totalMemory - freeMemory,
      usagePercent: memoryUsage,
      processRSS: processMemory.rss,
      processHeapUsed: processMemory.heapUsed,
      processHeapTotal: processMemory.heapTotal,
      processExternal: processMemory.external
    },
    disk: {
      // Note: Getting disk usage requires platform-specific commands
      // For cross-platform compatibility, we'll use process working directory
      usage: 0, // Placeholder - would need platform-specific implementation
      free: 0,
      total: 0
    },
    network: {
      // Network interface statistics would go here
      // Requires additional system calls or third-party modules
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0
    },
    uptime: processUptime
  };
}

/**
 * Collect application-specific metrics
 */
async function collectApplicationMetrics() {
  // Get cache statistics if available
  let cacheStats = { hits: 0, misses: 0, size: 0 };
  try {
    const cacheMiddleware = await import('../middleware/cacheMiddleware.js');
    cacheStats = cacheMiddleware.getCacheStats();
  } catch (error) {
    // Cache middleware not available
  }
  
  // Get database connection info
  let databaseStats = { connections: 0, responseTime: 0 };
  try {
    const database = await import('../config/databaseOptimized.js');
    const connectionMetrics = database.connectionMetrics;
    databaseStats = {
      connections: connectionMetrics.connectionPoolStats?.totalConnections || 0,
      responseTime: connectionMetrics.avgQueryTime || 0,
      queries: connectionMetrics.queries || 0,
      slowQueries: connectionMetrics.slowQueries || 0
    };
  } catch (error) {
    // Database metrics not available
  }
  
  return {
    requests: {
      total: requestMetrics.total || 0,
      perSecond: requestMetrics.rps || 0,
      active: requestMetrics.active || 0
    },
    responses: {
      avgTime: responseMetrics.avgTime || 0,
      p50: responseMetrics.p50 || 0,
      p95: responseMetrics.p95 || 0,
      p99: responseMetrics.p99 || 0
    },
    errors: {
      total: errorMetrics.total || 0,
      rate: errorMetrics.rate || 0,
      byType: errorMetrics.byType || {}
    },
    database: databaseStats,
    cache: {
      hitRate: cacheStats.hitRatio || 0,
      size: cacheStats.memoryUsage?.size || 0,
      memoryUsage: cacheStats.memoryUsage?.calculatedSize || 0
    }
  };
}

/**
 * Collect business metrics
 */
async function collectBusinessMetrics() {
  // These would typically come from your database
  // For now, we'll use placeholder values
  
  return {
    activeUsers: {
      total: Math.floor(Math.random() * 100) + 50,
      authenticated: Math.floor(Math.random() * 80) + 30,
      anonymous: Math.floor(Math.random() * 20) + 10
    },
    workoutsCreated: {
      total: Math.floor(Math.random() * 20) + 5,
      lastHour: Math.floor(Math.random() * 10) + 2
    },
    apiUsage: {
      totalRequests: requestMetrics.total || 0,
      uniqueUsers: Math.floor(Math.random() * 50) + 20,
      topEndpoints: apiUsageMetrics.topEndpoints || []
    }
  };
}

/**
 * Check for performance alerts
 */
function checkPerformanceAlerts(systemMetrics, appMetrics) {
  const alerts = [];
  
  // CPU usage alert
  if (systemMetrics.cpu.usage > monitoringConfig.alertThresholds.cpuUsage) {
    alerts.push({
      type: 'HIGH_CPU_USAGE',
      severity: 'warning',
      message: `CPU usage is ${systemMetrics.cpu.usage.toFixed(1)}% (threshold: ${monitoringConfig.alertThresholds.cpuUsage}%)`,
      value: systemMetrics.cpu.usage,
      threshold: monitoringConfig.alertThresholds.cpuUsage
    });
  }
  
  // Memory usage alert
  if (systemMetrics.memory.usagePercent > monitoringConfig.alertThresholds.memoryUsage) {
    alerts.push({
      type: 'HIGH_MEMORY_USAGE',
      severity: 'warning',
      message: `Memory usage is ${systemMetrics.memory.usagePercent.toFixed(1)}% (threshold: ${monitoringConfig.alertThresholds.memoryUsage}%)`,
      value: systemMetrics.memory.usagePercent,
      threshold: monitoringConfig.alertThresholds.memoryUsage
    });
  }
  
  // Response time alert
  if (appMetrics.responses.avgTime > monitoringConfig.alertThresholds.responseTime) {
    alerts.push({
      type: 'HIGH_RESPONSE_TIME',
      severity: 'critical',
      message: `Average response time is ${appMetrics.responses.avgTime.toFixed(2)}ms (threshold: ${monitoringConfig.alertThresholds.responseTime}ms)`,
      value: appMetrics.responses.avgTime,
      threshold: monitoringConfig.alertThresholds.responseTime
    });
  }
  
  // Error rate alert
  if (appMetrics.errors.rate > monitoringConfig.alertThresholds.errorRate) {
    alerts.push({
      type: 'HIGH_ERROR_RATE',
      severity: 'critical',
      message: `Error rate is ${appMetrics.errors.rate.toFixed(2)}% (threshold: ${monitoringConfig.alertThresholds.errorRate}%)`,
      value: appMetrics.errors.rate,
      threshold: monitoringConfig.alertThresholds.errorRate
    });
  }
  
  // Memory leak detection (if baselines are established)
  if (baselineEstablished && performanceBaselines) {
    const memoryGrowth = (systemMetrics.memory.processHeapUsed - performanceBaselines.memory.processHeapUsed) / 
                        performanceBaselines.memory.processHeapUsed;
    
    if (memoryGrowth > monitoringConfig.memoryLeakThreshold) {
      alerts.push({
        type: 'POTENTIAL_MEMORY_LEAK',
        severity: 'warning',
        message: `Process memory has grown ${(memoryGrowth * 100).toFixed(1)}% above baseline`,
        value: memoryGrowth,
        threshold: monitoringConfig.memoryLeakThreshold
      });
    }
  }
  
  // Log and store alerts
  alerts.forEach(alert => {
    alert.timestamp = Date.now();
    alertHistory.push(alert);
    
    console.warn(`🚨 Performance Alert [${alert.type}]: ${alert.message}`);
    
    // In production, you would send these alerts to:
    // - Slack/Discord webhooks
    // - Email notifications
    // - PagerDuty/OpsGenie
    // - Monitoring dashboards
  });
  
  return alerts;
}

/**
 * Establish performance baselines after initial period
 */
function establishPerformanceBaselines() {
  if (baselineEstablished) return;
  
  console.log('📊 Establishing performance baselines...');
  
  // Calculate averages from collected metrics
  const systemCpu = performanceMetrics.system.cpu;
  const systemMemory = performanceMetrics.system.memory;
  const appResponses = performanceMetrics.application.responses;
  
  if (systemCpu.length > 0 && systemMemory.length > 0 && appResponses.length > 0) {
    performanceBaselines = {
      cpu: {
        usage: systemCpu.reduce((sum, m) => sum + m.usage, 0) / systemCpu.length,
        loadAvg1: systemCpu.reduce((sum, m) => sum + m.loadAvg1, 0) / systemCpu.length
      },
      memory: {
        usagePercent: systemMemory.reduce((sum, m) => sum + m.usagePercent, 0) / systemMemory.length,
        processHeapUsed: systemMemory.reduce((sum, m) => sum + m.processHeapUsed, 0) / systemMemory.length
      },
      responses: {
        avgTime: appResponses.reduce((sum, m) => sum + m.avgTime, 0) / appResponses.length,
        p95: appResponses.reduce((sum, m) => sum + m.p95, 0) / appResponses.length
      }
    };
    
    baselineEstablished = true;
    console.log('✅ Performance baselines established:', performanceBaselines);
  } else {
    console.warn('⚠️ Insufficient data to establish baselines, retrying in 30 minutes...');
    setTimeout(establishPerformanceBaselines, 30 * 60 * 1000);
  }
}

/**
 * Clean up old metrics to prevent memory leaks
 */
function cleanupOldMetrics() {
  const cutoffTime = Date.now() - monitoringConfig.metricsRetentionPeriod;
  
  // Clean up system metrics
  Object.keys(performanceMetrics.system).forEach(category => {
    performanceMetrics.system[category] = performanceMetrics.system[category]
      .filter(metric => metric.timestamp > cutoffTime);
  });
  
  // Clean up application metrics
  Object.keys(performanceMetrics.application).forEach(category => {
    performanceMetrics.application[category] = performanceMetrics.application[category]
      .filter(metric => metric.timestamp > cutoffTime);
  });
  
  // Clean up business metrics
  Object.keys(performanceMetrics.business).forEach(category => {
    performanceMetrics.business[category] = performanceMetrics.business[category]
      .filter(metric => metric.timestamp > cutoffTime);
  });
  
  // Clean up alert history
  alertHistory.splice(0, alertHistory.length - 100); // Keep last 100 alerts
  
  console.log('🧹 Performance metrics cleanup completed');
}

/**
 * Get current performance summary
 */
export function getPerformanceSummary() {
  const now = Date.now();
  const last5Minutes = now - 5 * 60 * 1000;
  
  // Get recent metrics
  const recentCpu = performanceMetrics.system.cpu.filter(m => m.timestamp > last5Minutes);
  const recentMemory = performanceMetrics.system.memory.filter(m => m.timestamp > last5Minutes);
  const recentResponses = performanceMetrics.application.responses.filter(m => m.timestamp > last5Minutes);
  const recentErrors = performanceMetrics.application.errors.filter(m => m.timestamp > last5Minutes);
  
  // Calculate current averages
  const summary = {
    timestamp: now,
    system: {
      cpu: recentCpu.length > 0 ? {
        current: recentCpu[recentCpu.length - 1]?.usage || 0,
        avg: recentCpu.reduce((sum, m) => sum + m.usage, 0) / recentCpu.length || 0
      } : { current: 0, avg: 0 },
      memory: recentMemory.length > 0 ? {
        current: recentMemory[recentMemory.length - 1]?.usagePercent || 0,
        avg: recentMemory.reduce((sum, m) => sum + m.usagePercent, 0) / recentMemory.length || 0
      } : { current: 0, avg: 0 }
    },
    application: {
      responseTime: recentResponses.length > 0 ? {
        current: recentResponses[recentResponses.length - 1]?.avgTime || 0,
        avg: recentResponses.reduce((sum, m) => sum + m.avgTime, 0) / recentResponses.length || 0
      } : { current: 0, avg: 0 },
      errorRate: recentErrors.length > 0 ? {
        current: recentErrors[recentErrors.length - 1]?.rate || 0,
        avg: recentErrors.reduce((sum, m) => sum + m.rate, 0) / recentErrors.length || 0
      } : { current: 0, avg: 0 }
    },
    alerts: {
      recent: alertHistory.filter(alert => alert.timestamp > last5Minutes).length,
      total: alertHistory.length
    },
    baselines: baselineEstablished ? performanceBaselines : null
  };
  
  return summary;
}

/**
 * Get detailed performance metrics for time range
 */
export function getPerformanceMetrics(timeRangeMs = 60 * 60 * 1000) { // Default 1 hour
  const cutoffTime = Date.now() - timeRangeMs;
  
  const filterByTime = (metrics) => metrics.filter(m => m.timestamp > cutoffTime);
  
  return {
    system: {
      cpu: filterByTime(performanceMetrics.system.cpu),
      memory: filterByTime(performanceMetrics.system.memory),
      disk: filterByTime(performanceMetrics.system.disk),
      network: filterByTime(performanceMetrics.system.network)
    },
    application: {
      requests: filterByTime(performanceMetrics.application.requests),
      responses: filterByTime(performanceMetrics.application.responses),
      errors: filterByTime(performanceMetrics.application.errors),
      database: filterByTime(performanceMetrics.application.database),
      cache: filterByTime(performanceMetrics.application.cache)
    },
    business: {
      activeUsers: filterByTime(performanceMetrics.business.activeUsers),
      workoutsCreated: filterByTime(performanceMetrics.business.workoutsCreated),
      apiUsage: filterByTime(performanceMetrics.business.apiUsage)
    },
    alerts: alertHistory.filter(alert => alert.timestamp > cutoffTime)
  };
}

// Request/Response/Error tracking (to be called by middleware)
export const requestMetrics = { total: 0, rps: 0, active: 0 };
export const responseMetrics = { avgTime: 0, p50: 0, p95: 0, p99: 0, times: [] };
export const errorMetrics = { total: 0, rate: 0, byType: {} };
export const apiUsageMetrics = { topEndpoints: [] };

/**
 * Middleware to track request metrics
 */
export function trackRequest(req, res, next) {
  const startTime = performance.now();
  requestMetrics.total++;
  requestMetrics.active++;
  
  res.on('finish', () => {
    const responseTime = performance.now() - startTime;
    requestMetrics.active--;
    
    // Update response time metrics
    responseMetrics.times.push(responseTime);
    if (responseMetrics.times.length > 1000) {
      responseMetrics.times = responseMetrics.times.slice(-1000); // Keep last 1000
    }
    
    const sortedTimes = [...responseMetrics.times].sort((a, b) => a - b);
    responseMetrics.avgTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    responseMetrics.p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    responseMetrics.p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    responseMetrics.p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    
    // Track errors
    if (res.statusCode >= 400) {
      errorMetrics.total++;
      const errorType = `${res.statusCode}xx`;
      errorMetrics.byType[errorType] = (errorMetrics.byType[errorType] || 0) + 1;
    }
    
    // Calculate error rate (last 100 requests)
    const recent = responseMetrics.times.slice(-100).length;
    const recentErrors = Object.values(errorMetrics.byType).reduce((sum, count) => sum + count, 0);
    errorMetrics.rate = recent > 0 ? (recentErrors / recent) * 100 : 0;
  });
  
  next();
}

export default {
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  getPerformanceSummary,
  getPerformanceMetrics,
  trackRequest,
  monitoringConfig
};