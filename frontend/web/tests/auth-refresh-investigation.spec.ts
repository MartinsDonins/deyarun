import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Refresh Logout Investigation', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Enable console logging for debugging
    page.on('console', (msg) => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    // Track network requests
    page.on('request', (request) => {
      if (request.url().includes('/api/auth')) {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`);
        console.log(`[REQUEST HEADERS] ${JSON.stringify(request.headers())}`);
      }
    });

    // Track network responses
    page.on('response', (response) => {
      if (response.url().includes('/api/auth')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
        response.headers().then(headers => {
          console.log(`[RESPONSE HEADERS] ${JSON.stringify(headers)}`);
        }).catch(() => {});
      }
    });

    // Track network failures
    page.on('requestfailed', (request) => {
      console.log(`[REQUEST FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('Initial page load authentication check', async () => {
    console.log('=== Testing initial page load authentication ===');

    // Navigate to the application
    await page.goto('http://localhost:3003');

    // Wait for potential authentication check to complete
    await page.waitForTimeout(3000);

    // Check if we're on login page or main app
    const currentUrl = page.url();
    console.log(`Current URL after initial load: ${currentUrl}`);

    // Check for authentication-related errors in console
    // The console logs are already being captured above

    // Take screenshot for analysis
    await page.screenshot({
      path: 'test-results/initial-load.png',
      fullPage: true
    });

    // Check if there are any visible error messages
    const errorMessages = await page.locator('[class*="error"], [class*="Error"], .text-red-500, .text-red-600').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }

    // Check if there's a loading spinner indicating auth check is in progress
    const loadingSpinner = await page.locator('.animate-spin').count();
    console.log(`Loading spinners found: ${loadingSpinner}`);
  });

  test('Authentication API endpoint test', async () => {
    console.log('=== Testing authentication API endpoint directly ===');

    // First, test if the API endpoint is reachable
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://runacademy-backend.coredigify.com/api/auth/me', {
          credentials: 'include'
        });
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          text: await response.text()
        };
      } catch (error) {
        return {
          error: error.message,
          type: error.name
        };
      }
    });

    console.log('API Response:', JSON.stringify(apiResponse, null, 2));

    // Check if it's a 503 error (backend unavailable) as mentioned
    expect(apiResponse.status).toBeDefined();

    if (apiResponse.status === 503) {
      console.log('✓ Confirmed: Backend is returning 503 Service Unavailable');
      console.log('This explains why authentication check fails on refresh');
    }
  });

  test('Cookie inspection and CORS analysis', async () => {
    console.log('=== Testing cookie behavior and CORS ===');

    // Navigate to the app
    await page.goto('http://localhost:3003');

    // Wait for any auth checks to complete
    await page.waitForTimeout(2000);

    // Get all cookies
    const cookies = await page.context().cookies();
    console.log('Current cookies:', JSON.stringify(cookies, null, 2));

    // Check for authentication-related cookies
    const authCookies = cookies.filter(cookie =>
      cookie.name.includes('auth') ||
      cookie.name.includes('token') ||
      cookie.name.includes('session') ||
      cookie.name.includes('connect.sid')
    );

    console.log('Authentication-related cookies:', JSON.stringify(authCookies, null, 2));

    if (authCookies.length === 0) {
      console.log('⚠️ No authentication cookies found - this could explain the logout issue');
    }

    // Test CORS preflight request
    const corsTest = await page.evaluate(async () => {
      try {
        const response = await fetch('https://runacademy-backend.coredigify.com/api/auth/me', {
          method: 'OPTIONS'
        });
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('CORS preflight test:', JSON.stringify(corsTest, null, 2));
  });

  test('Simulated page refresh behavior', async () => {
    console.log('=== Simulating page refresh behavior ===');

    // First load
    await page.goto('http://localhost:3003');
    await page.waitForTimeout(2000);

    console.log('--- First load completed ---');

    // Take screenshot before refresh
    await page.screenshot({
      path: 'test-results/before-refresh.png',
      fullPage: true
    });

    // Simulate page refresh
    await page.reload();
    await page.waitForTimeout(3000);

    console.log('--- Page refreshed ---');

    // Take screenshot after refresh
    await page.screenshot({
      path: 'test-results/after-refresh.png',
      fullPage: true
    });

    const currentUrl = page.url();
    console.log(`URL after refresh: ${currentUrl}`);

    // Check if we got redirected to login page
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
      console.log('❌ CONFIRMED: User was logged out after page refresh');
    } else {
      console.log('✓ User remained authenticated after refresh');
    }
  });

  test('Authentication context behavior analysis', async () => {
    console.log('=== Analyzing AuthContext behavior ===');

    // Inject a script to monitor AuthContext state changes
    await page.goto('http://localhost:3003');

    // Wait for React to load
    await page.waitForTimeout(1000);

    // Monitor authentication state changes
    const authStateChanges = await page.evaluate(() => {
      return new Promise((resolve) => {
        const changes = [];
        let timeoutId;

        // Try to hook into the auth context if possible
        const checkAuthState = () => {
          // Look for loading indicators
          const loadingElements = document.querySelectorAll('.animate-spin');
          const loginForms = document.querySelectorAll('[type="email"], [placeholder*="email" i]');

          changes.push({
            timestamp: Date.now(),
            hasLoading: loadingElements.length > 0,
            hasLoginForm: loginForms.length > 0,
            url: window.location.href
          });

          if (changes.length < 10) { // Monitor for 5 seconds
            timeoutId = setTimeout(checkAuthState, 500);
          } else {
            resolve(changes);
          }
        };

        checkAuthState();
      });
    });

    console.log('Authentication state changes:', JSON.stringify(authStateChanges, null, 2));

    // Final screenshot
    await page.screenshot({
      path: 'test-results/auth-state-analysis.png',
      fullPage: true
    });
  });

  test('Network error handling analysis', async () => {
    console.log('=== Testing how app handles network errors ===');

    // First, navigate normally
    await page.goto('http://localhost:3003');
    await page.waitForTimeout(2000);

    // Analyze how the app handles failed auth requests
    const networkErrorHandling = await page.evaluate(async () => {
      const results = [];

      // Test what happens when auth endpoint fails
      try {
        const response = await fetch('https://runacademy-backend.coredigify.com/api/auth/me', {
          credentials: 'include'
        });

        results.push({
          test: 'auth_me_endpoint',
          status: response.status,
          ok: response.ok,
          data: await response.text()
        });
      } catch (error) {
        results.push({
          test: 'auth_me_endpoint',
          error: error.message,
          type: 'network_error'
        });
      }

      // Test with a definitely failing endpoint
      try {
        const response = await fetch('http://localhost:9999/nonexistent', {
          credentials: 'include'
        });
        results.push({
          test: 'definitely_failing',
          status: response.status
        });
      } catch (error) {
        results.push({
          test: 'definitely_failing',
          error: error.message,
          type: 'connection_error'
        });
      }

      return results;
    });

    console.log('Network error handling results:', JSON.stringify(networkErrorHandling, null, 2));
  });

  test.afterEach(async () => {
    await page.close();
  });
});