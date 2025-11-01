#!/usr/bin/env node

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const testBugReportsAPI = async () => {
  try {
    const apiUrl = process.env.API_URL || 'https://api.deyarun.com';
    
    console.log('🔄 Testing bug reports admin API...');
    console.log('📡 API URL:', `${apiUrl}/api/bug-reports/admin`);
    
    // Test without auth first
    console.log('\n1. Testing without auth (should return 401):');
    const response1 = await fetch(`${apiUrl}/api/bug-reports/admin`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response1.status);
    const result1 = await response1.json();
    console.log('Response:', result1);
    
    // Test with mock auth token (will probably fail but shows if endpoint exists)
    console.log('\n2. Testing with mock auth token:');
    const response2 = await fetch(`${apiUrl}/api/bug-reports/admin`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-testing'
      }
    });
    
    console.log('Status:', response2.status);
    const result2 = await response2.json();
    console.log('Response:', result2);
    
    // Test public endpoints
    console.log('\n3. Testing public bug report categories:');
    const response3 = await fetch(`${apiUrl}/api/bug-reports/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response3.status);
    const result3 = await response3.json();
    console.log('Categories found:', result3.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testBugReportsAPI();