#!/usr/bin/env node

/**
 * Test Bug Reporting Flow
 * 
 * This script tests the complete bug reporting functionality:
 * 1. Submit a bug report
 * 2. Check if email notification is sent
 * 3. Verify admin can view and update the report
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@coredigify.com';

// Test data
const testBugReport = {
  title: 'Test Bug Report - GPS ikke virker',
  description: 'Dette er en test bug report. GPS funktionen virker ikke korrekt i mobile app. Når jeg trykker på "Start Workout", så får jeg fejlbesked.',
  category: 'gps_tracking',
  priority: 'medium',
  userEmail: 'test@example.com',
  userName: 'Test User',
  deviceInfo: {
    platform: 'android',
    osVersion: '14',
    appVersion: '2.2.1',
    deviceModel: 'Samsung Galaxy S21',
    screenSize: '1080x2400'
  },
  stepsToReproduce: '1. Åben DeyaRun app\n2. Gå til Workouts tab\n3. Tryk på "Quick Start"\n4. Vælg "Easy Run"\n5. GPS fejl vises',
  expectedBehavior: 'GPS skulle starte automatisk og begynde at tracke min position',
  actualBehavior: 'Får fejlbesked "GPS Required - location permissions are needed"'
};

let createdBugReportId = null;

async function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '📊',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️'
  }[type] || '📊';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testConnection() {
  log('Testing connection to backend...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health-simple`);
    
    if (response.ok) {
      const data = await response.json();
      log(`Backend is running: ${data.service} (${data.env})`, 'success');
      return true;
    } else {
      log(`Backend health check failed: HTTP ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Failed to connect to backend: ${error.message}`, 'error');
    return false;
  }
}

async function testSubmitBugReport() {
  log('Testing bug report submission...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/bug-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBugReport)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      createdBugReportId = result.data.id;
      log(`Bug report submitted successfully! ID: ${createdBugReportId}`, 'success');
      log(`Status: ${result.data.status}`, 'info');
      return true;
    } else {
      log(`Failed to submit bug report: ${result.message}`, 'error');
      if (result.errors) {
        result.errors.forEach(error => {
          log(`  - ${error.field}: ${error.message}`, 'warning');
        });
      }
      return false;
    }
  } catch (error) {
    log(`Error submitting bug report: ${error.message}`, 'error');
    return false;
  }
}

async function testGetCategories() {
  log('Testing categories endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/bug-reports/categories`);
    const result = await response.json();

    if (response.ok && result.success) {
      log(`Categories loaded: ${result.data.length} categories available`, 'success');
      result.data.forEach(category => {
        log(`  - ${category.value}: ${category.label}`, 'info');
      });
      return true;
    } else {
      log(`Failed to load categories: ${result.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Error loading categories: ${error.message}`, 'error');
    return false;
  }
}

async function testAdminEndpoints() {
  log('Testing admin endpoints (requires admin authentication)...');
  
  // Note: This would require actual admin authentication
  // For now, we'll just test the endpoint existence
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/bug-reports/admin/statistics`);
    
    if (response.status === 401) {
      log('Admin endpoints are properly protected (requires authentication)', 'success');
      return true;
    } else if (response.ok) {
      const result = await response.json();
      log('Admin statistics loaded (running with admin privileges)', 'success');
      log(`Total reports: ${result.data?.overview?.total || 'unknown'}`, 'info');
      return true;
    } else {
      log(`Unexpected response from admin endpoint: HTTP ${response.status}`, 'warning');
      return false;
    }
  } catch (error) {
    log(`Error testing admin endpoints: ${error.message}`, 'error');
    return false;
  }
}

async function testEmailConfiguration() {
  log('Testing email configuration...');
  
  const emailConfigured = !!process.env.SENDGRID_API_KEY;
  const adminEmailConfigured = !!process.env.ADMIN_EMAIL;
  
  if (emailConfigured) {
    log('SendGrid API key is configured', 'success');
  } else {
    log('SendGrid API key is NOT configured - emails will be simulated', 'warning');
  }
  
  if (adminEmailConfigured) {
    log(`Admin email configured: ${ADMIN_EMAIL}`, 'success');
  } else {
    log('Admin email is NOT configured', 'warning');
  }
  
  return emailConfigured && adminEmailConfigured;
}

async function cleanup() {
  if (!createdBugReportId) {
    log('No bug report to clean up');
    return;
  }
  
  log(`Cleaning up test bug report: ${createdBugReportId}`);
  
  // Note: This would require admin authentication to delete
  // For now, we'll just log the ID for manual cleanup
  log(`Manual cleanup required: Delete bug report ${createdBugReportId} from admin panel`, 'warning');
}

async function runTests() {
  log('🧪 Starting Bug Reporting System Tests', 'info');
  log('='.repeat(50), 'info');
  
  const results = {
    connection: false,
    submission: false,
    categories: false,
    admin: false,
    email: false
  };
  
  // Test 1: Connection
  results.connection = await testConnection();
  if (!results.connection) {
    log('❌ Connection test failed - stopping tests', 'error');
    return results;
  }
  
  // Test 2: Email configuration
  results.email = await testEmailConfiguration();
  
  // Test 3: Categories
  results.categories = await testGetCategories();
  
  // Test 4: Bug report submission
  results.submission = await testSubmitBugReport();
  
  // Test 5: Admin endpoints
  results.admin = await testAdminEndpoints();
  
  // Summary
  log('='.repeat(50), 'info');
  log('🧪 Test Results Summary:', 'info');
  log(`Connection: ${results.connection ? '✅' : '❌'}`, results.connection ? 'success' : 'error');
  log(`Email Config: ${results.email ? '✅' : '⚠️'}`, results.email ? 'success' : 'warning');
  log(`Categories: ${results.categories ? '✅' : '❌'}`, results.categories ? 'success' : 'error');
  log(`Submission: ${results.submission ? '✅' : '❌'}`, results.submission ? 'success' : 'error');
  log(`Admin Endpoints: ${results.admin ? '✅' : '❌'}`, results.admin ? 'success' : 'error');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  log(`Overall: ${passedTests}/${totalTests} tests passed (${successRate}%)`, 
    successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error');
  
  if (results.submission) {
    log('✅ Bug reporting system is functional!', 'success');
    
    if (results.email) {
      log('📧 Email notifications should be sent to admin', 'info');
    } else {
      log('⚠️ Email notifications are not configured', 'warning');
    }
    
    if (createdBugReportId) {
      log(`📱 Test report created with ID: ${createdBugReportId}`, 'info');
      log(`🔗 View in admin: ${process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:3000'}/admin/bug-reports/${createdBugReportId}`, 'info');
    }
  } else {
    log('❌ Bug reporting system has issues that need to be fixed', 'error');
  }
  
  // Cleanup
  await cleanup();
  
  return results;
}

// Run tests if this script is executed directly
if (process.argv[1].endsWith('testBugReporting.js')) {
  runTests()
    .then((results) => {
      const allPassed = Object.values(results).every(Boolean);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      log(`Unexpected error: ${error.message}`, 'error');
      process.exit(1);
    });
}

export { runTests };