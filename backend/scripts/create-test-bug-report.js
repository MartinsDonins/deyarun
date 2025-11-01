#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import BugReport from '../models/mongodb/bugReport.model.js';

// Load environment variables
dotenv.config();

const createTestBugReport = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/running_academy_tracking';
    await mongoose.connect(mongoUrl, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      bufferCommands: false
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Create test bug report
    const testReport = new BugReport({
      title: 'Test Bug Report - Admin Panel Check',
      description: 'Šis ir test ziņojums, lai pārbaudītu vai admin panelī rādās bug reports. Šis ziņojums tika izveidots ar skriptu.',
      category: 'other',
      priority: 'medium',
      status: 'open',
      userEmail: 'admin.test@deyarun.com',
      userName: 'Admin Test User',
      deviceInfo: {
        platform: 'web',
        appVersion: '1.8.76',
        osVersion: 'Windows 11',
        deviceModel: 'Desktop'
      },
      stepsToReproduce: '1. Atvērt admin paneli\n2. Doties uz Bug Reports\n3. Pārbaudīt vai ziņojumi ir redzami',
      expectedBehavior: 'Bug reports ir redzami admin panelī',
      actualBehavior: 'Bug reports nerādās vai nav redzami',
      url: '/admin/bug-reports',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script'
    });
    
    const savedReport = await testReport.save();
    console.log('✅ Test bug report created:', {
      id: savedReport._id,
      title: savedReport.title,
      category: savedReport.category,
      status: savedReport.status,
      createdAt: savedReport.createdAt
    });
    
    // Check total count
    const totalReports = await BugReport.countDocuments();
    console.log('📊 Total bug reports in database:', totalReports);
    
    // Get recent reports
    const recentReports = await BugReport.find().sort({ createdAt: -1 }).limit(5);
    console.log('📋 Recent reports:');
    recentReports.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.title} (${report.category}) - ${report.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

createTestBugReport();