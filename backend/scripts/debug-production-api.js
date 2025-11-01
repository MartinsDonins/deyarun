// Debug production API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'https://api.deyarun.com';

async function debugProductionAPI() {
  console.log('🔍 Testing production API endpoints...\n');

  // Test endpoints
  const endpoints = [
    { method: 'GET', path: '/api/subscriptions/plans', requiresAuth: false },
    { method: 'POST', path: '/api/subscriptions/create', requiresAuth: true },
    { method: 'GET', path: '/api/auth/me', requiresAuth: true },
    { method: 'GET', path: '/', requiresAuth: false }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.method} ${endpoint.path}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DeyaRun-Debug/1.0'
        }
      };

      if (endpoint.requiresAuth) {
        options.headers['Authorization'] = 'Bearer test-token';
      }

      if (endpoint.method === 'POST') {
        options.body = JSON.stringify({
          planType: 'premium',
          billingCycle: 'monthly'
        });
      }

      const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
      
      // Try to get response text
      try {
        const text = await response.text();
        if (text.length < 500) {
          console.log(`   Response: ${text}`);
        } else {
          console.log(`   Response: [${text.length} characters] ${text.substring(0, 100)}...`);
        }
      } catch (e) {
        console.log('   Response: [Failed to read response body]');
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }

  // Test specific 404 cases
  console.log('🔍 Testing specific 404 cases...\n');
  
  const notFoundPaths = [
    '/api/subscriptions/create',
    '/site.webmanifest'
  ];

  for (const path of notFoundPaths) {
    try {
      console.log(`Testing 404: GET ${path}`);
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'DeyaRun-Debug/1.0'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        const text = await response.text();
        console.log(`   404 Response: ${text.substring(0, 200)}...`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
}

debugProductionAPI();