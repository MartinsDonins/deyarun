// Comprehensive Load Testing Suite
// Tests API performance under various load conditions and measures response times

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

// Load testing configuration
const loadTestConfig = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:3001',
  maxConcurrentUsers: 100,
  testDuration: 5 * 60 * 1000, // 5 minutes
  rampUpTime: 60 * 1000, // 1 minute
  responseTimeThresholds: {
    excellent: 200,
    good: 500,
    acceptable: 1000,
    poor: 2000
  },
  errorRateThreshold: 0.05, // 5%
  throughputTargets: {
    minimum: 50, // requests per second
    target: 100,
    maximum: 200
  }
};

// Test scenarios
const testScenarios = [
  {
    name: 'User Authentication',
    weight: 20, // 20% of traffic
    endpoints: [
      { method: 'POST', path: '/api/auth/login', weight: 70 },
      { method: 'POST', path: '/api/auth/refresh', weight: 20 },
      { method: 'POST', path: '/api/auth/logout', weight: 10 }
    ]
  },
  {
    name: 'User Dashboard',
    weight: 30, // 30% of traffic
    endpoints: [
      { method: 'GET', path: '/api/user/dashboard', weight: 40 },
      { method: 'GET', path: '/api/workouts', weight: 30 },
      { method: 'GET', path: '/api/user/stats', weight: 20 },
      { method: 'GET', path: '/api/training-plans', weight: 10 }
    ]
  },
  {
    name: 'Workout Management',
    weight: 25, // 25% of traffic
    endpoints: [
      { method: 'GET', path: '/api/workouts', weight: 40 },
      { method: 'POST', path: '/api/workouts', weight: 20 },
      { method: 'PUT', path: '/api/workouts/:id', weight: 20 },
      { method: 'GET', path: '/api/workouts/:id', weight: 20 }
    ]
  },
  {
    name: 'Analytics and Reports',
    weight: 15, // 15% of traffic
    endpoints: [
      { method: 'GET', path: '/api/analytics/user', weight: 50 },
      { method: 'GET', path: '/api/leaderboard', weight: 30 },
      { method: 'GET', path: '/api/user/progress', weight: 20 }
    ]
  },
  {
    name: 'Admin Operations',
    weight: 10, // 10% of traffic
    endpoints: [
      { method: 'GET', path: '/api/admin/users', weight: 40 },
      { method: 'GET', path: '/api/admin/analytics', weight: 30 },
      { method: 'GET', path: '/api/admin/monitoring/health', weight: 20 },
      { method: 'POST', path: '/api/admin/exports', weight: 10 }
    ]
  }
];

// Test results storage
let testResults = {
  startTime: null,
  endTime: null,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimeStats: {
    min: Infinity,
    max: 0,
    avg: 0,
    p50: 0,
    p95: 0,
    p99: 0
  },
  errorsByType: new Map(),
  throughputStats: [],
  concurrentUserStats: [],
  scenarioStats: new Map(),
  responseTimes: []
};

// Mock user pool for authentication
const mockUsers = [];
for (let i = 0; i < 50; i++) {
  mockUsers.push({
    id: `user_${i}`,
    email: `loadtest${i}@example.com`,
    password: 'LoadTest123!',
    token: null,
    refreshToken: null
  });
}

/**
 * Main load testing function
 */
export async function runLoadTest(options = {}) {
  const config = { ...loadTestConfig, ...options };
  
  console.log('🚀 Starting comprehensive load test...');
  console.log(`📊 Configuration:`, {
    baseURL: config.baseURL,
    maxConcurrentUsers: config.maxConcurrentUsers,
    testDuration: `${config.testDuration / 1000}s`,
    rampUpTime: `${config.rampUpTime / 1000}s`
  });
  
  testResults.startTime = Date.now();
  
  // Initialize scenario stats
  testScenarios.forEach(scenario => {
    testResults.scenarioStats.set(scenario.name, {
      requests: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0,
      responseTimes: []
    });
  });
  
  try {
    // Authenticate mock users
    await authenticateMockUsers(config.baseURL);
    
    // Run load test phases
    await runLoadTestPhases(config);
    
    // Calculate final statistics
    calculateFinalStats();
    
    // Generate and display report
    const report = generateLoadTestReport();
    console.log(report);
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
    throw error;
  }
}

/**
 * Authenticate mock users for testing
 */
async function authenticateMockUsers(baseURL) {
  console.log('🔐 Authenticating mock users...');
  
  const authPromises = mockUsers.map(async (user) => {
    try {
      const response = await makeRequest({
        method: 'POST',
        url: `${baseURL}/api/auth/login`,
        data: {
          email: user.email,
          password: user.password
        }
      });
      
      if (response.statusCode === 200 && response.data.token) {
        user.token = response.data.token;
        user.refreshToken = response.data.refreshToken;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to authenticate ${user.email}:`, error.message);
    }
  });
  
  await Promise.allSettled(authPromises);
  
  const authenticatedUsers = mockUsers.filter(user => user.token);
  console.log(`✅ Authenticated ${authenticatedUsers.length}/${mockUsers.length} users`);
}

/**
 * Run load test phases: ramp-up, steady state, ramp-down
 */
async function runLoadTestPhases(config) {
  const phases = [
    {
      name: 'Ramp-up',
      duration: config.rampUpTime,
      startUsers: 1,
      endUsers: config.maxConcurrentUsers
    },
    {
      name: 'Steady State',
      duration: config.testDuration - config.rampUpTime - (config.rampUpTime / 2),
      startUsers: config.maxConcurrentUsers,
      endUsers: config.maxConcurrentUsers
    },
    {
      name: 'Ramp-down',
      duration: config.rampUpTime / 2,
      startUsers: config.maxConcurrentUsers,
      endUsers: 1
    }
  ];
  
  for (const phase of phases) {
    console.log(`🏃 Starting ${phase.name} phase...`);
    await runTestPhase(phase, config);
  }
}

/**
 * Run individual test phase
 */
async function runTestPhase(phase, config) {
  const startTime = Date.now();
  const activeUsers = new Set();
  
  const phaseInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / phase.duration, 1);
    
    const currentUsers = Math.floor(
      phase.startUsers + (phase.endUsers - phase.startUsers) * progress
    );
    
    // Add or remove users to match target
    while (activeUsers.size < currentUsers) {
      const userId = `phase_user_${activeUsers.size}`;
      activeUsers.add(userId);
      startVirtualUser(userId, config);
    }
    
    while (activeUsers.size > currentUsers) {
      const userId = activeUsers.values().next().value;
      activeUsers.delete(userId);
      stopVirtualUser(userId);
    }
    
    // Record concurrent user stats
    testResults.concurrentUserStats.push({
      timestamp: Date.now(),
      activeUsers: activeUsers.size,
      phase: phase.name
    });
    
    if (progress >= 1) {
      clearInterval(phaseInterval);
      // Clean up remaining users
      activeUsers.forEach(userId => stopVirtualUser(userId));
    }
  }, 1000); // Check every second
  
  // Wait for phase to complete
  await new Promise(resolve => {
    setTimeout(resolve, phase.duration);
  });
}

/**
 * Start virtual user simulation
 */
const virtualUsers = new Map();

function startVirtualUser(userId, config) {
  if (virtualUsers.has(userId)) return;
  
  const userState = {
    id: userId,
    active: true,
    requestCount: 0,
    mockUser: mockUsers[Math.floor(Math.random() * mockUsers.length)]
  };
  
  virtualUsers.set(userId, userState);
  
  // Start request loop
  const requestLoop = async () => {
    while (userState.active) {
      try {
        await simulateUserRequest(userState, config);
        userState.requestCount++;
        
        // Random delay between requests (1-5 seconds)
        const delay = Math.random() * 4000 + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.warn(`⚠️ Virtual user ${userId} error:`, error.message);
      }
    }
  };
  
  requestLoop();
}

/**
 * Stop virtual user simulation
 */
function stopVirtualUser(userId) {
  const userState = virtualUsers.get(userId);
  if (userState) {
    userState.active = false;
    virtualUsers.delete(userId);
  }
}

/**
 * Simulate a single user request
 */
async function simulateUserRequest(userState, config) {
  // Select scenario based on weights
  const scenario = selectWeightedScenario();
  const endpoint = selectWeightedEndpoint(scenario);
  
  const startTime = performance.now();
  
  try {
    // Prepare request
    const requestOptions = {
      method: endpoint.method,
      url: `${config.baseURL}${endpoint.path.replace(':id', 'test123')}`,
      headers: {}
    };
    
    // Add authentication if user has token
    if (userState.mockUser.token) {
      requestOptions.headers['Authorization'] = `Bearer ${userState.mockUser.token}`;
    }
    
    // Add request body for POST/PUT requests
    if (['POST', 'PUT'].includes(endpoint.method)) {
      requestOptions.data = generateMockData(endpoint.path);
    }
    
    const response = await makeRequest(requestOptions);
    const responseTime = performance.now() - startTime;
    
    // Record successful request
    recordRequestResult({
      scenario: scenario.name,
      endpoint: endpoint.path,
      method: endpoint.method,
      responseTime,
      statusCode: response.statusCode,
      success: response.statusCode >= 200 && response.statusCode < 300
    });
    
  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    // Record failed request
    recordRequestResult({
      scenario: scenario.name,
      endpoint: endpoint.path,
      method: endpoint.method,
      responseTime,
      statusCode: error.statusCode || 0,
      success: false,
      error: error.message
    });
  }
}

/**
 * Select scenario based on weights
 */
function selectWeightedScenario() {
  const totalWeight = testScenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const scenario of testScenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      return scenario;
    }
  }
  
  return testScenarios[0]; // Fallback
}

/**
 * Select endpoint based on weights
 */
function selectWeightedEndpoint(scenario) {
  const totalWeight = scenario.endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of scenario.endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return scenario.endpoints[0]; // Fallback
}

/**
 * Generate mock data for requests
 */
function generateMockData(path) {
  if (path.includes('/workouts')) {
    return {
      name: `Load Test Workout ${Date.now()}`,
      type: 'running',
      duration: Math.floor(Math.random() * 3600) + 600, // 10-70 minutes
      distance: Math.floor(Math.random() * 20000) + 1000, // 1-21km
      status: 'completed'
    };
  }
  
  if (path.includes('/auth/login')) {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    return {
      email: user.email,
      password: user.password
    };
  }
  
  if (path.includes('/exports')) {
    return {
      type: 'workouts',
      format: 'csv',
      timeRange: '30d',
      includeFields: ['name', 'type', 'duration', 'distance']
    };
  }
  
  return {}; // Default empty object
}

/**
 * Make HTTP request
 */
async function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const httpModule = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DeyaRun-LoadTest/1.0',
        ...options.headers
      }
    };
    
    if (options.data) {
      const data = JSON.stringify(options.data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = httpModule.request(requestOptions, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: { raw: body }
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

/**
 * Record request result for statistics
 */
function recordRequestResult(result) {
  testResults.totalRequests++;
  
  if (result.success) {
    testResults.successfulRequests++;
  } else {
    testResults.failedRequests++;
    
    const errorKey = result.error || `HTTP ${result.statusCode}`;
    testResults.errorsByType.set(errorKey, (testResults.errorsByType.get(errorKey) || 0) + 1);
  }
  
  // Record response time
  testResults.responseTimes.push(result.responseTime);
  
  // Update scenario stats
  const scenarioStats = testResults.scenarioStats.get(result.scenario);
  if (scenarioStats) {
    scenarioStats.requests++;
    if (result.success) {
      scenarioStats.successes++;
    } else {
      scenarioStats.failures++;
    }
    scenarioStats.responseTimes.push(result.responseTime);
  }
  
  // Record throughput stats every 5 seconds
  const now = Date.now();
  if (testResults.throughputStats.length === 0 || 
      now - testResults.throughputStats[testResults.throughputStats.length - 1].timestamp > 5000) {
    
    testResults.throughputStats.push({
      timestamp: now,
      totalRequests: testResults.totalRequests,
      rps: calculateCurrentRPS()
    });
  }
}

/**
 * Calculate current requests per second
 */
function calculateCurrentRPS() {
  const now = Date.now();
  const fiveSecondsAgo = now - 5000;
  
  const recentRequests = testResults.responseTimes.filter((_, index) => {
    const requestTime = testResults.startTime + (index * (now - testResults.startTime) / testResults.responseTimes.length);
    return requestTime > fiveSecondsAgo;
  }).length;
  
  return Math.round(recentRequests / 5);
}

/**
 * Calculate final statistics
 */
function calculateFinalStats() {
  testResults.endTime = Date.now();
  
  if (testResults.responseTimes.length > 0) {
    const sortedTimes = testResults.responseTimes.sort((a, b) => a - b);
    
    testResults.responseTimeStats = {
      min: sortedTimes[0],
      max: sortedTimes[sortedTimes.length - 1],
      avg: sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length,
      p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
      p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
    };
  }
  
  // Calculate scenario statistics
  testResults.scenarioStats.forEach((stats, scenarioName) => {
    if (stats.responseTimes.length > 0) {
      stats.avgResponseTime = stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length;
    }
  });
}

/**
 * Generate comprehensive load test report
 */
function generateLoadTestReport() {
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  const errorRate = testResults.totalRequests > 0 ? 
    (testResults.failedRequests / testResults.totalRequests) * 100 : 0;
  const throughput = testResults.totalRequests / duration;
  
  let report = `
🚀 LOAD TEST RESULTS REPORT
${'='.repeat(50)}

📊 OVERVIEW
Duration: ${duration.toFixed(1)}s
Total Requests: ${testResults.totalRequests}
Successful: ${testResults.successfulRequests}
Failed: ${testResults.failedRequests}
Error Rate: ${errorRate.toFixed(2)}%
Throughput: ${throughput.toFixed(2)} req/s

⚡ RESPONSE TIME STATISTICS
Min: ${testResults.responseTimeStats.min.toFixed(2)}ms
Max: ${testResults.responseTimeStats.max.toFixed(2)}ms
Average: ${testResults.responseTimeStats.avg.toFixed(2)}ms
50th percentile: ${testResults.responseTimeStats.p50.toFixed(2)}ms
95th percentile: ${testResults.responseTimeStats.p95.toFixed(2)}ms
99th percentile: ${testResults.responseTimeStats.p99.toFixed(2)}ms

`;
  
  // Performance assessment
  const { responseTimeThresholds, errorRateThreshold, throughputTargets } = loadTestConfig;
  
  report += `🎯 PERFORMANCE ASSESSMENT\n`;
  
  // Response time assessment
  if (testResults.responseTimeStats.avg <= responseTimeThresholds.excellent) {
    report += `✅ Response Time: EXCELLENT (${testResults.responseTimeStats.avg.toFixed(2)}ms)\n`;
  } else if (testResults.responseTimeStats.avg <= responseTimeThresholds.good) {
    report += `✅ Response Time: GOOD (${testResults.responseTimeStats.avg.toFixed(2)}ms)\n`;
  } else if (testResults.responseTimeStats.avg <= responseTimeThresholds.acceptable) {
    report += `⚠️ Response Time: ACCEPTABLE (${testResults.responseTimeStats.avg.toFixed(2)}ms)\n`;
  } else {
    report += `❌ Response Time: POOR (${testResults.responseTimeStats.avg.toFixed(2)}ms)\n`;
  }
  
  // Error rate assessment
  if (errorRate <= errorRateThreshold * 100) {
    report += `✅ Error Rate: ACCEPTABLE (${errorRate.toFixed(2)}%)\n`;
  } else {
    report += `❌ Error Rate: TOO HIGH (${errorRate.toFixed(2)}%)\n`;
  }
  
  // Throughput assessment
  if (throughput >= throughputTargets.target) {
    report += `✅ Throughput: TARGET MET (${throughput.toFixed(2)} req/s)\n`;
  } else if (throughput >= throughputTargets.minimum) {
    report += `⚠️ Throughput: BELOW TARGET (${throughput.toFixed(2)} req/s)\n`;
  } else {
    report += `❌ Throughput: BELOW MINIMUM (${throughput.toFixed(2)} req/s)\n`;
  }
  
  // Scenario breakdown
  report += `\n📋 SCENARIO BREAKDOWN\n`;
  testResults.scenarioStats.forEach((stats, scenarioName) => {
    const scenarioErrorRate = stats.requests > 0 ? (stats.failures / stats.requests) * 100 : 0;
    report += `${scenarioName}: ${stats.requests} req, ${stats.successes} ok, ${stats.failures} err (${scenarioErrorRate.toFixed(1)}%), avg: ${stats.avgResponseTime.toFixed(2)}ms\n`;
  });
  
  // Error breakdown
  if (testResults.errorsByType.size > 0) {
    report += `\n❌ ERROR BREAKDOWN\n`;
    testResults.errorsByType.forEach((count, errorType) => {
      report += `${errorType}: ${count} occurrences\n`;
    });
  }
  
  return report;
}

/**
 * Simple stress test for specific endpoints
 */
export async function runStressTest(endpoint, options = {}) {
  const {
    concurrentUsers = 50,
    requestsPerUser = 20,
    baseURL = loadTestConfig.baseURL
  } = options;
  
  console.log(`🔥 Running stress test on ${endpoint}`);
  console.log(`Users: ${concurrentUsers}, Requests per user: ${requestsPerUser}`);
  
  const startTime = Date.now();
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: []
  };
  
  const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
    const mockUser = mockUsers[userIndex % mockUsers.length];
    
    for (let i = 0; i < requestsPerUser; i++) {
      try {
        const requestStart = performance.now();
        
        const response = await makeRequest({
          method: 'GET',
          url: `${baseURL}${endpoint}`,
          headers: mockUser.token ? {
            'Authorization': `Bearer ${mockUser.token}`
          } : {}
        });
        
        const responseTime = performance.now() - requestStart;
        
        results.totalRequests++;
        results.responseTimes.push(responseTime);
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
        }
        
      } catch (error) {
        results.totalRequests++;
        results.failedRequests++;
      }
    }
  });
  
  await Promise.all(userPromises);
  
  const duration = (Date.now() - startTime) / 1000;
  const avgResponseTime = results.responseTimes.reduce((sum, time) => sum + time, 0) / results.responseTimes.length;
  const throughput = results.totalRequests / duration;
  const errorRate = (results.failedRequests / results.totalRequests) * 100;
  
  console.log(`\n🚀 STRESS TEST RESULTS for ${endpoint}`);
  console.log(`Duration: ${duration.toFixed(1)}s`);
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Success Rate: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%`);
  console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Throughput: ${throughput.toFixed(2)} req/s`);
  
  return results;
}

export default {
  runLoadTest,
  runStressTest,
  loadTestConfig,
  testScenarios
};