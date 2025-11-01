#!/usr/bin/env node

/**
 * DeyaRun AI Testing Application Launcher
 * 
 * This script launches the AI testing dashboard with proper environment setup
 * and database connection for testing all AI functionalities.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
const envPath = join(__dirname, '..', '.env');
console.log('🔧 Loading environment from:', envPath);

try {
  dotenv.config({ path: envPath });
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.warn('⚠️ Could not load .env file:', error.message);
}

// Set required environment variables for testing
process.env.NODE_ENV = process.env.NODE_ENV || 'testing';
process.env.PORT = process.env.PORT || '3002';

console.log('🧪 DeyaRun AI Testing Application Launcher');
console.log('='.repeat(50));

async function initializeDatabase() {
  try {
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/runacademy_test';
    console.log('🔌 Connecting to MongoDB:', mongoUrl.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Database connected successfully');
    
    // Test database connection
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    console.log('📡 Database ping:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.warn('⚠️ Continuing without database - some tests may fail');
    return false;
  }
}

async function checkEnvironment() {
  console.log('\n🔍 Environment Check:');
  console.log('-'.repeat(30));
  
  const checks = [
    {
      name: 'Node.js Version',
      value: process.version,
      status: 'info'
    },
    {
      name: 'Environment',
      value: process.env.NODE_ENV,
      status: 'info'
    },
    {
      name: 'MongoDB URI',
      value: process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing',
      status: process.env.MONGODB_URI ? 'success' : 'warning'
    },
    {
      name: 'OpenAI API Key',
      value: process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing',
      status: process.env.OPENAI_API_KEY ? 'success' : 'warning'
    },
    {
      name: 'JWT Secret',
      value: process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing',
      status: process.env.JWT_SECRET ? 'success' : 'warning'
    }
  ];
  
  checks.forEach(check => {
    const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${check.name}: ${check.value}`);
  });
  
  return checks;
}

async function checkDependencies() {
  console.log('\n📦 Dependency Check:');
  console.log('-'.repeat(30));
  
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = [
      'express',
      'mongoose', 
      'dotenv',
      'cors',
      'openai'
    ];
    
    const installedDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    requiredDeps.forEach(dep => {
      const version = installedDeps[dep];
      const status = version ? '✅' : '❌';
      console.log(`${status} ${dep}: ${version || 'Missing'}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Could not check dependencies:', error.message);
    return false;
  }
}

async function launchApplication() {
  console.log('\n🚀 Launching AI Testing Application...');
  console.log('-'.repeat(40));
  
  try {
    // Dynamic import the application
    const { default: app } = await import('./ai-testing-app.js');
    
    console.log('✅ Application launched successfully');
    console.log(`🌐 Dashboard available at: http://localhost:${process.env.PORT || 3002}`);
    console.log('📊 API Documentation:');
    console.log('   POST /api/test/personalization - Test personalization algorithm');
    console.log('   POST /api/test/latvian-ai - Test Latvian language features');
    console.log('   POST /api/test/adaptive-plans - Test adaptive adjustments');
    console.log('   POST /api/test/full-ai-plan - Test full AI plan generation');
    console.log('   POST /api/test/openai-integration - Test OpenAI service');
    console.log('   GET  /api/status - System status');
    
    return app;
  } catch (error) {
    console.error('❌ Failed to launch application:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

async function displayTestingInstructions() {
  console.log('\n📋 Testing Instructions:');
  console.log('='.repeat(50));
  console.log('1. Open http://localhost:3002 in your browser');
  console.log('2. Use the web dashboard to run tests interactively');
  console.log('3. Each test card provides different AI functionality testing');
  console.log('4. Check the console for detailed logs and debug information');
  console.log('5. Results are displayed in JSON format for analysis');
  console.log('\n🔬 Test Categories:');
  console.log('   🧠 Personalization - 6-factor scoring algorithm');
  console.log('   🇱🇻 Latvian AI - Language and cultural features');
  console.log('   🔄 Adaptive Plans - Performance-based adjustments');
  console.log('   🚀 Full AI Plan - End-to-end plan generation');
  console.log('   🤖 OpenAI Integration - Service configuration and connectivity');
  console.log('   🔍 Health Check - Overall system status');
  
  console.log('\n💡 Tips:');
  console.log('   • Check system status first to verify all services');
  console.log('   • Run personalization test to see scoring algorithm');
  console.log('   • Try Latvian AI test to see cultural adaptations');
  console.log('   • Use adaptive plans test for weather/performance scenarios');
  console.log('   • Full AI plan test demonstrates complete workflow');
  console.log('\n🐛 Debugging:');
  console.log('   • Console logs show detailed execution steps');
  console.log('   • Error messages include stack traces for debugging');
  console.log('   • JSON responses can be copied for analysis');
}

// Main execution
async function main() {
  try {
    // Environment and dependency checks
    await checkEnvironment();
    await checkDependencies();
    
    // Initialize database connection
    const dbConnected = await initializeDatabase();
    
    // Launch the application
    const app = await launchApplication();
    
    // Display testing instructions
    await displayTestingInstructions();
    
    console.log('\n✨ AI Testing Dashboard is ready!');
    console.log('Press Ctrl+C to stop the server');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down AI Testing Application...');
      
      if (dbConnected) {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
      }
      
      console.log('👋 AI Testing Application stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start AI Testing Application:', error);
    process.exit(1);
  }
}

// Run the application
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});