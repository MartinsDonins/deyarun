// Enhanced Database Configuration with Performance Optimizations
// Implements connection pooling, index management, and query optimization

import mongoose from 'mongoose';
import { performance } from 'perf_hooks';

// Enhanced connection state with metrics
let mongoConnection = null;
let connectionMetrics = {
  connectionTime: null,
  queries: 0,
  avgQueryTime: 0,
  slowQueries: 0,
  connectionPoolStats: {},
  lastHealthCheck: null
};

// Database index definitions for optimization
const indexDefinitions = {
  users: [
    { fields: { email: 1 }, options: { unique: true, background: true } },
    { fields: { firebaseUID: 1 }, options: { unique: true, sparse: true, background: true } },
    { fields: { role: 1, isActive: 1 }, options: { background: true } },
    { fields: { createdAt: -1 }, options: { background: true } },
    { fields: { lastLoginAt: -1 }, options: { background: true } },
    { fields: { 'strava.athleteId': 1 }, options: { sparse: true, background: true } },
    { fields: { subscriptionType: 1, role: 1 }, options: { background: true } }
  ],
  workouts: [
    { fields: { userId: 1, createdAt: -1 }, options: { background: true } },
    { fields: { userId: 1, status: 1 }, options: { background: true } },
    { fields: { status: 1, startedAt: -1 }, options: { background: true } },
    { fields: { type: 1, createdAt: -1 }, options: { background: true } },
    { fields: { userId: 1, type: 1, distance: -1 }, options: { background: true } },
    { fields: { createdAt: -1 }, options: { background: true } }
  ],
  gpsPoints: [
    { fields: { workoutId: 1, timestamp: 1 }, options: { background: true } },
    { fields: { workoutId: 1, sequenceNumber: 1 }, options: { background: true } },
    { fields: { createdAt: -1 }, options: { expireAfterSeconds: 60 * 60 * 24 * 30 } } // 30 days TTL
  ],
  trainingPlans: [
    { fields: { userId: 1, isActive: 1 }, options: { background: true } },
    { fields: { templateId: 1, createdAt: -1 }, options: { background: true } },
    { fields: { userId: 1, startDate: -1 }, options: { background: true } }
  ],
  courses: [
    { fields: { isPublished: 1, difficulty: 1 }, options: { background: true } },
    { fields: { category: 1, createdAt: -1 }, options: { background: true } },
    { fields: { createdAt: -1 }, options: { background: true } }
  ]
};

/**
 * Enhanced MongoDB connection with performance optimizations
 */
const connectMongoDB = async (retries = 5) => {
  try {
    if (mongoConnection && mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected - reusing connection');
      return mongoConnection;
    }

    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/running_academy_tracking';
    const startTime = performance.now();
    
    console.log('🔄 Establishing optimized MongoDB connection...');
    
    // Enhanced connection options for maximum performance
    const connectionOptions = {
      // Connection Pool Optimization
      maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5, // Higher pool for production
      minPoolSize: 1, // Always maintain at least 1 connection
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      
      // Timeout Optimization
      serverSelectionTimeoutMS: 10000, // 10s for server selection
      socketTimeoutMS: 20000, // 20s for socket operations
      connectTimeoutMS: 10000, // 10s for connection establishment
      
      // Performance Optimizations
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      
      // Write Concern Optimization
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      readPreference: 'primaryPreferred', // Allow secondary reads for better performance
      readConcern: { level: 'local' }, // Faster read consistency
      
      // Compression for bandwidth optimization
      compressors: ['zlib'],
      
      // Connection monitoring
      monitorCommands: process.env.NODE_ENV === 'development',
      
      // SSL/TLS optimizations for production
      ssl: process.env.NODE_ENV === 'production',
      sslValidate: process.env.NODE_ENV === 'production'
    };

    mongoConnection = await mongoose.connect(mongoUrl, connectionOptions);
    
    connectionMetrics.connectionTime = performance.now() - startTime;
    
    console.log(`✅ MongoDB connected successfully in ${connectionMetrics.connectionTime.toFixed(2)}ms`);
    console.log(`🔧 Connection pool: min=${connectionOptions.minPoolSize}, max=${connectionOptions.maxPoolSize}`);
    
    // Setup performance monitoring
    setupPerformanceMonitoring();
    
    // Create optimized indexes
    await createOptimizedIndexes();
    
    return mongoConnection;
    
  } catch (error) {
    console.error(`❌ MongoDB connection error (${6 - retries} attempts remaining):`, error.message);
    
    if (retries > 0) {
      const backoffTime = (6 - retries) * 1000; // Exponential backoff
      console.log(`🔄 Retrying MongoDB connection in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return connectMongoDB(retries - 1);
    }
    
    throw error;
  }
};

/**
 * Setup database performance monitoring
 */
function setupPerformanceMonitoring() {
  if (process.env.NODE_ENV === 'development') {
    // Monitor slow queries
    mongoose.set('debug', (coll, method, query, doc, options) => {
      const startTime = Date.now();
      
      // Log slow queries (>100ms)
      setTimeout(() => {
        const duration = Date.now() - startTime;
        if (duration > 100) {
          console.warn(`🐌 Slow query detected: ${coll}.${method}() - ${duration}ms`);
          console.warn('Query:', JSON.stringify(query, null, 2));
          connectionMetrics.slowQueries++;
        }
        
        // Update metrics
        connectionMetrics.queries++;
        connectionMetrics.avgQueryTime = 
          (connectionMetrics.avgQueryTime * (connectionMetrics.queries - 1) + duration) / connectionMetrics.queries;
      }, 0);
    });
  }
  
  // Monitor connection pool
  mongoose.connection.on('connected', () => {
    console.log('📡 MongoDB connection pool established');
    updateConnectionPoolStats();
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('📡 MongoDB connection pool disconnected');
    connectionMetrics.connectionPoolStats = {};
  });
}

/**
 * Create optimized database indexes
 */
async function createOptimizedIndexes() {
  try {
    console.log('🔧 Creating optimized database indexes...');
    const db = mongoose.connection.db;
    
    for (const [collectionName, indexes] of Object.entries(indexDefinitions)) {
      try {
        const collection = db.collection(collectionName);
        
        for (const indexDef of indexes) {
          await collection.createIndex(indexDef.fields, indexDef.options);
        }
        
        console.log(`✅ Indexes created for ${collectionName}`);
      } catch (error) {
        console.warn(`⚠️ Index creation warning for ${collectionName}:`, error.message);
      }
    }
    
    console.log('✅ Database index optimization completed');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

/**
 * Update connection pool statistics
 */
function updateConnectionPoolStats() {
  if (mongoose.connection.readyState === 1) {
    // Get pool stats from mongoose connection
    const db = mongoose.connection.db;
    if (db && db.serverConfig) {
      connectionMetrics.connectionPoolStats = {
        availableConnections: db.serverConfig.s?.pool?.availableConnections || 0,
        totalConnections: db.serverConfig.s?.pool?.totalConnections || 0,
        checkedOutConnections: db.serverConfig.s?.pool?.checkedOutConnections || 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

/**
 * Enhanced database health check with performance metrics
 */
const checkDatabaseHealth = async () => {
  const healthCheckStart = performance.now();
  
  const health = {
    mongodb: { status: 'disconnected', error: null, metrics: {} },
    timestamp: new Date().toISOString(),
    overall: 'unhealthy',
    performance: {
      connectionTime: connectionMetrics.connectionTime,
      queries: connectionMetrics.queries,
      avgQueryTime: connectionMetrics.avgQueryTime,
      slowQueries: connectionMetrics.slowQueries,
      connectionPool: connectionMetrics.connectionPoolStats
    }
  };

  try {
    if (mongoose.connection.readyState === 1) {
      // Perform ping test
      await mongoose.connection.db.admin().ping();
      
      const pingTime = performance.now() - healthCheckStart;
      
      // Get database stats
      const dbStats = await mongoose.connection.db.stats();
      
      health.mongodb = {
        status: 'connected',
        responseTime: Math.round(pingTime),
        connections: mongoose.connection.readyState,
        database: mongoose.connection.name,
        metrics: {
          collections: dbStats.collections,
          dataSize: Math.round(dbStats.dataSize / 1024 / 1024), // MB
          storageSize: Math.round(dbStats.storageSize / 1024 / 1024), // MB
          indexes: dbStats.indexes,
          indexSize: Math.round(dbStats.indexSize / 1024 / 1024), // MB
          avgObjSize: Math.round(dbStats.avgObjSize)
        }
      };
      
      health.overall = 'healthy';
      
      // Update connection pool stats
      updateConnectionPoolStats();
      
    } else {
      health.mongodb.error = 'Connection not established';
    }
  } catch (error) {
    health.mongodb.error = error.message;
    console.error('❌ MongoDB health check failed:', error.message);
  }

  connectionMetrics.lastHealthCheck = health.timestamp;
  return health;
};

/**
 * Query optimization utilities
 */
const queryOptimizations = {
  // Optimize user queries with proper projections
  findUserBasic: (query) => {
    return mongoose.model('User').findOne(query)
      .select('_id email firstName lastName role subscriptionType isActive')
      .lean(); // Use lean() for read-only operations
  },
  
  // Optimize workout queries with pagination
  findUserWorkouts: (userId, limit = 20, skip = 0) => {
    return mongoose.model('Workout').find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('_id type distance duration averagePace calories createdAt status')
      .lean();
  },
  
  // Aggregate user statistics efficiently
  getUserStats: async (userId) => {
    return mongoose.model('Workout').aggregate([
      { $match: { userId, status: 'completed' } },
      {
        $group: {
          _id: userId,
          totalWorkouts: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          avgPace: { $avg: '$averagePace' },
          bestPace: { $min: '$averagePace' },
          longestRun: { $max: '$distance' }
        }
      }
    ]);
  }
};

/**
 * Database cleanup and maintenance
 */
const performMaintenance = async () => {
  try {
    console.log('🧹 Performing database maintenance...');
    
    const db = mongoose.connection.db;
    
    // Clean up expired sessions
    await db.collection('sessions').deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    // Clean up old GPS points (older than 30 days for inactive workouts)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db.collection('gpspoints').deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      workoutId: { $in: await db.collection('workouts').distinct('_id', { 
        status: { $in: ['cancelled', 'completed'] },
        createdAt: { $lt: thirtyDaysAgo }
      })}
    });
    
    // Update database statistics
    await db.command({ planCacheClear: 1 });
    
    console.log('✅ Database maintenance completed');
    
  } catch (error) {
    console.error('❌ Database maintenance error:', error);
  }
};

/**
 * Enhanced connection initialization
 */
const initializeDatabases = async () => {
  console.log('🚀 Initializing optimized MongoDB database...');
  
  try {
    await connectMongoDB();
    
    // Schedule periodic maintenance (every 6 hours)
    setInterval(performMaintenance, 6 * 60 * 60 * 1000);
    
    console.log('✅ Database initialization completed with optimizations');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced graceful shutdown
 */
const closeConnections = async () => {
  try {
    console.log('🔄 Closing optimized database connections...');
    
    // Log final metrics
    console.log('📊 Final connection metrics:', connectionMetrics);
    
    if (mongoConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      mongoConnection = null;
      console.log('✅ MongoDB connection closed gracefully');
    }
    
    console.log('✅ All database connections closed');
    
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

export {
  mongoose,
  connectMongoDB,
  checkDatabaseHealth,
  closeConnections,
  initializeDatabases,
  queryOptimizations,
  performMaintenance,
  connectionMetrics
};