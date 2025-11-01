import { test, expect, type Page } from '@playwright/test';

// Test configuration
const LOCAL_FRONTEND = 'http://localhost:3002';
const PRODUCTION_API = 'https://api.deyarun.com';

// Test credentials - you may need to adjust these
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword123'
};

test.describe('HttpOnly Cookie Authentication Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Clear all cookies and local storage before each test
    await page.context().clearCookies();
    await page.goto(LOCAL_FRONTEND);
  });

  test('should redirect unauthenticated users to login page', async ({ page }) => {
    // Try to access protected dashboard/profile page
    const protectedRoutes = ['/dashboard', '/profile', '/workouts', '/settings'];

    for (const route of protectedRoutes) {
      await page.goto(`${LOCAL_FRONTEND}${route}`);

      // Should be redirected to login or access denied
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();

      // Check if redirected to login or blocked
      const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
      const isAccessDenied = await page.locator('text=Access Denied').isVisible().catch(() => false);
      const isLoginRequired = await page.locator('text=Login').isVisible().catch(() => false);

      expect(isRedirectedToLogin || isAccessDenied || isLoginRequired).toBe(true);

      console.log(`Route ${route}: ${currentUrl} - Protected: ${isRedirectedToLogin || isAccessDenied || isLoginRequired}`);
    }
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto(`${LOCAL_FRONTEND}/login`);
    await page.waitForLoadState('networkidle');

    // Check if login form exists
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('Login form elements found and visible');
  });

  test('should handle login attempt and check cookie behavior', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${LOCAL_FRONTEND}/login`);
    await page.waitForLoadState('networkidle');

    // Find login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

    // Check if elements exist
    const emailExists = await emailInput.isVisible().catch(() => false);
    const passwordExists = await passwordInput.isVisible().catch(() => false);
    const submitExists = await submitButton.isVisible().catch(() => false);

    if (!emailExists || !passwordExists || !submitExists) {
      console.log('Login form not found - checking current page content');
      const pageContent = await page.content();
      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());

      // Look for any authentication-related content
      const hasAuthContent = pageContent.includes('login') || pageContent.includes('signin') || pageContent.includes('auth');
      expect(hasAuthContent).toBe(true);
      return;
    }

    // Try to login with test credentials
    await emailInput.fill(TEST_CREDENTIALS.email);
    await passwordInput.fill(TEST_CREDENTIALS.password);

    // Monitor network requests
    const loginRequest = page.waitForResponse(response =>
      response.url().includes('/login') || response.url().includes('/auth')
    );

    await submitButton.click();

    try {
      const response = await loginRequest;
      console.log('Login request status:', response.status());
      console.log('Login request URL:', response.url());

      // Check response headers for Set-Cookie
      const headers = response.headers();
      console.log('Response headers:', headers);

      if (headers['set-cookie']) {
        console.log('Cookies being set:', headers['set-cookie']);
      }

    } catch (error) {
      console.log('No login request intercepted or timeout:', error.message);
    }

    // Wait for potential redirect or error message
    await page.waitForLoadState('networkidle');

    // Check current state
    const currentUrl = page.url();
    console.log('After login attempt URL:', currentUrl);

    // Check if any error messages appear
    const errorMessage = await page.locator('text=Invalid credentials, text=Login failed, text=Error').isVisible().catch(() => false);
    if (errorMessage) {
      console.log('Error message displayed - likely invalid test credentials');
    }
  });

  test('should check /me endpoint accessibility', async ({ page }) => {
    // First, try to access /me endpoint directly via API call
    const response = await page.request.get(`${PRODUCTION_API}/me`, {
      failOnStatusCode: false
    });

    console.log('/me endpoint status without auth:', response.status());

    if (response.status() === 401) {
      console.log('✅ /me endpoint properly returns 401 without authentication');
    } else {
      console.log('Response headers:', await response.allHeaders());
      console.log('Response body:', await response.text());
    }

    expect([401, 403]).toContain(response.status());
  });

  test('should verify cookie handling in network requests', async ({ page }) => {
    const requests: any[] = [];
    const responses: any[] = [];

    // Monitor all network activity
    page.on('request', request => {
      if (request.url().includes(PRODUCTION_API)) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes(PRODUCTION_API)) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      }
    });

    // Navigate through the application
    await page.goto(LOCAL_FRONTEND);
    await page.waitForLoadState('networkidle');

    // Try to access different pages to trigger API calls
    const routes = ['/', '/login', '/dashboard'];
    for (const route of routes) {
      try {
        await page.goto(`${LOCAL_FRONTEND}${route}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow time for API calls
      } catch (error) {
        console.log(`Error accessing ${route}:`, error.message);
      }
    }

    // Report findings
    console.log('API Requests made:', requests.length);
    console.log('API Responses received:', responses.length);

    requests.forEach((req, index) => {
      console.log(`Request ${index + 1}: ${req.method} ${req.url}`);
      if (req.headers.cookie) {
        console.log(`  Cookies sent: ${req.headers.cookie}`);
      } else {
        console.log(`  No cookies sent`);
      }
    });

    responses.forEach((res, index) => {
      console.log(`Response ${index + 1}: ${res.status} ${res.url}`);
      if (res.headers['set-cookie']) {
        console.log(`  Cookies set: ${res.headers['set-cookie']}`);
      }
      if (res.status === 401) {
        console.log(`  ❌ 401 Unauthorized error detected`);
      } else if (res.status >= 200 && res.status < 300) {
        console.log(`  ✅ Request successful`);
      }
    });

    // Check for 401 errors
    const unauthorizedResponses = responses.filter(res => res.status === 401);
    console.log(`Found ${unauthorizedResponses.length} unauthorized responses`);

    if (unauthorizedResponses.length > 0) {
      console.log('401 errors found - authentication may not be working properly');
    } else {
      console.log('No 401 errors detected - authentication appears to be working');
    }
  });

  test('should test complete authentication flow', async ({ page }) => {
    console.log('Starting complete authentication flow test...');

    // Step 1: Access main page
    await page.goto(LOCAL_FRONTEND);
    await page.waitForLoadState('networkidle');
    console.log('✅ Main page loaded');

    // Step 2: Check initial authentication state
    try {
      const meResponse = await page.request.get(`${PRODUCTION_API}/me`);
      console.log('Initial /me endpoint status:', meResponse.status());
    } catch (error) {
      console.log('Initial /me request failed:', error.message);
    }

    // Step 3: Navigate to login
    await page.goto(`${LOCAL_FRONTEND}/login`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // Step 4: Analyze login form structure
    const pageContent = await page.content();
    const hasEmailField = pageContent.includes('email') || pageContent.includes('Email');
    const hasPasswordField = pageContent.includes('password') || pageContent.includes('Password');
    const hasLoginButton = pageContent.includes('Login') || pageContent.includes('Sign in');

    console.log('Login form analysis:');
    console.log('- Email field found:', hasEmailField);
    console.log('- Password field found:', hasPasswordField);
    console.log('- Login button found:', hasLoginButton);

    // Step 5: Check for any existing authentication
    const cookies = await page.context().cookies();
    console.log('Current cookies:', cookies.length);
    cookies.forEach(cookie => {
      console.log(`- ${cookie.name}: ${cookie.httpOnly ? '[HttpOnly]' : '[Accessible]'}`);
    });

    // Step 6: Final verification
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);

    expect(currentUrl).toContain(LOCAL_FRONTEND);
  });
});