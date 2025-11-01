// Database Config - MongoDB Only (PostgreSQL/Prisma removed for production stability)

import mongoose from 'mongoose';

// PostgreSQL support removed for production stability
// All data now stored in MongoDB

// MongoDB Connection State
let mongoConnection = null;

// Connect to MongoDB with retry logic
const connectMongoDB = async (retries = 5) => {
  try {
    if (mongoConnection && mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return mongoConnection;
    }

    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/running_academy_tracking';
    
    console.log('🔄 Connecting to MongoDB...');
    
    // MongoDB Atlas connection with Coolify production timeouts
    mongoConnection = await mongoose.connect(mongoUrl, {
      maxPoolSize: 3,                 // Small pool for cloud deployment
      serverSelectionTimeoutMS: 5000, // Slightly longer timeout
      socketTimeoutMS: 15000,         // Longer socket timeout
      bufferCommands: false,
      // Atlas-specific optimizations
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      // Connection pool settings for production
      minPoolSize: 0,                 // No minimum pool for cloud deployment
      maxIdleTimeMS: 30000,           // Longer idle time
      connectTimeoutMS: 5000          // Longer connect timeout
    });

    console.log('✅ MongoDB connected successfully');
    return mongoConnection;
    
  } catch (error) {
    console.error(`❌ MongoDB connection error (${6 - retries} attempts remaining):`, error.message);
    
    if (retries > 0) {
      console.log(`🔄 Retrying MongoDB connection in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectMongoDB(retries - 1);
    }
    
    throw error;
  }
};

// PostgreSQL connection removed - using MongoDB only

// MongoDB-only Database Health Check
const checkDatabaseHealth = async () => {
  const health = {
    mongodb: { status: 'disconnected', error: null },
    timestamp: new Date().toISOString(),
    overall: 'unhealthy'
  };

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.mongodb.status = 'connected';
      health.overall = 'healthy';
    } else {
      health.mongodb.error = 'Connection not established';
    }
  } catch (error) {
    health.mongodb.error = error.message;
    console.error('❌ MongoDB health check failed:', error.message);
  }

  return health;
};

// Initialize MongoDB (PostgreSQL removed)
const initializeDatabases = async () => {
  console.log('🚀 Initializing MongoDB database...');
  
  // Initialize MongoDB connection lazily
  setTimeout(async () => {
    try {
      await connectMongoDB();
    } catch (e) {
      console.log('MongoDB will retry later');
    }
  }, 1000);
  
  return { success: true };
};

// Graceful Shutdown (MongoDB only)
const closeConnections = async () => {
  try {
    console.log('🔄 Closing database connections...');
    
    // Close MongoDB connection
    if (mongoConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      mongoConnection = null;
      console.log('✅ MongoDB connection closed');
    }
    
    console.log('✅ Database connections closed');
    
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Database Connection Event Handlers
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB connection established');
});

mongoose.connection.on('error', (error) => {
  console.error('📡 MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('📡 MongoDB reconnected');
});

// Export MongoDB-only functions
export {
  mongoose,
  connectMongoDB,
  checkDatabaseHealth,
  closeConnections,
  initializeDatabases
};