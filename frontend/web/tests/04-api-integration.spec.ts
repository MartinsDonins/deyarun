import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test('should make successful API requests', async ({ page }) => {
    const successfulRequests: string[] = [];
    const failedRequests: { url: string; status: number; error?: string }[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('api.')) {
        if (response.status() >= 200 && response.status() < 300) {
          successfulRequests.push(`${response.status()} ${url}`);
        } else {
          failedRequests.push({
            url: url,
            status: response.status()
          });
        }
      }
    });
    
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('api.')) {
        failedRequests.push({
          url: url,
          status: 0,
          error: request.failure()?.errorText
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Successful API requests: ${successfulRequests.length}`);
    successfulRequests.forEach(req => console.log(`  ✅ ${req}`));
    
    console.log(`Failed API requests: ${failedRequests.length}`);
    failedRequests.forEach(req => {
      console.log(`  ❌ ${req.status} ${req.url}${req.error ? ` - ${req.error}` : ''}`);
    });
    
    // Critical: Check for authentication errors (401/403)
    const authErrors = failedRequests.filter(req => req.status === 401 || req.status === 403);
    console.log(`Authentication errors (401/403): ${authErrors.length}`);
    
    if (authErrors.length > 0) {
      console.error('Critical authentication errors found:');
      authErrors.forEach(req => console.error(`  🚨 ${req.status} ${req.url}`));
    }
  });

  test('should handle API endpoint health checks', async ({ page }) => {
    // Check common API health endpoints
    const healthEndpoints = [
      '/api/health',
      '/api/status', 
      '/api/ping',
      '/health',
      '/status'
    ];
    
    const healthResults: { endpoint: string; status: number; ok: boolean }[] = [];
    
    for (const endpoint of healthEndpoints) {
      try {
        const response = await page.request.get(endpoint);
        healthResults.push({
          endpoint,
          status: response.status(),
          ok: response.ok()
        });
      } catch (error) {
        healthResults.push({
          endpoint,
          status: 0,
          ok: false
        });
      }
    }
    
    console.log('API Health Check Results:');
    healthResults.forEach(result => {
      const status = result.ok ? '✅' : '❌';
      console.log(`  ${status} ${result.endpoint}: ${result.status}`);
    });
    
    const healthyEndpoints = healthResults.filter(r => r.ok).length;
    console.log(`Healthy endpoints: ${healthyEndpoints}/${healthResults.length}`);
  });

  test('should verify authentication token handling', async ({ page }) => {
    const authRequests: { url: string; hasAuthHeader: boolean; tokenType?: string }[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('api.')) {
        const headers = request.headers();
        const hasAuthHeader = !!(headers.authorization || headers.Authorization);
        let tokenType: string | undefined;
        
        if (hasAuthHeader) {
          const authHeader = headers.authorization || headers.Authorization || '';
          if (authHeader.startsWith('Bearer ')) {
            tokenType = 'Bearer';
          } else if (authHeader.startsWith('Basic ')) {
            tokenType = 'Basic';
          } else {
            tokenType = 'Other';
          }
        }
        
        authRequests.push({
          url,
          hasAuthHeader,
          tokenType
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const protectedRequests = authRequests.filter(req => req.hasAuthHeader);
    const unprotectedRequests = authRequests.filter(req => !req.hasAuthHeader);
    
    console.log(`API requests with authentication: ${protectedRequests.length}`);
    console.log(`API requests without authentication: ${unprotectedRequests.length}`);
    
    if (protectedRequests.length > 0) {
      const tokenTypes = protectedRequests.reduce((acc, req) => {
        if (req.tokenType) {
          acc[req.tokenType] = (acc[req.tokenType] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Token types used:', tokenTypes);
    }
  });

  test('should check for Strava API integration', async ({ page }) => {
    const stravaRequests: string[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('strava') || url.includes('/api/strava') || url.includes('strava-api')) {
        stravaRequests.push(url);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for Strava-related elements and try to interact
    const stravaElements = page.locator('text=/strava/i, [class*="strava"], [id*="strava"]');
    const stravaCount = await stravaElements.count();
    
    if (stravaCount > 0) {
      console.log(`Strava UI elements found: ${stravaCount}`);
      
      // Try to click on Strava element to trigger API calls
      const clickableStrava = page.locator('button, a, [role="button"]').filter({ hasText: /strava/i }).first();
      if (await clickableStrava.count() > 0) {
        await clickableStrava.click();
        await page.waitForTimeout(2000); // Wait for potential API calls
      }
    }
    
    console.log(`Strava API requests: ${stravaRequests.length}`);
    stravaRequests.forEach(url => console.log(`  📊 ${url}`));
  });

  test('should verify database connectivity', async ({ page }) => {
    const dbRequests: { url: string; method: string; status?: number }[] = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('api.')) {
        // Common database-related endpoints
        if (url.includes('user') || url.includes('workout') || url.includes('activity') || 
            url.includes('training') || url.includes('dashboard') || url.includes('analytics')) {
          dbRequests.push({
            url,
            method: response.request().method(),
            status: response.status()
          });
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different sections to trigger more API calls
    const sections = ['dashboard', 'profile', 'analytics', 'workouts', 'training'];
    for (const section of sections) {
      const link = page.locator(`a, button`).filter({ hasText: new RegExp(section, 'i') }).first();
      if (await link.count() > 0) {
        await link.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    }
    
    console.log(`Database-related API requests: ${dbRequests.length}`);
    
    const successfulDbRequests = dbRequests.filter(req => req.status && req.status >= 200 && req.status < 300);
    const failedDbRequests = dbRequests.filter(req => !req.status || req.status >= 400);
    
    console.log(`Successful database requests: ${successfulDbRequests.length}`);
    console.log(`Failed database requests: ${failedDbRequests.length}`);
    
    if (failedDbRequests.length > 0) {
      console.error('Failed database requests:');
      failedDbRequests.forEach(req => {
        console.error(`  🚨 ${req.method} ${req.url} - ${req.status || 'Network Error'}`);
      });
    }
  });

  test('should monitor for rate limiting', async ({ page }) => {
    const rateLimitedRequests: string[] = [];
    const tooManyRequests: string[] = [];
    
    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      
      if (url.includes('/api/') || url.includes('api.')) {
        if (status === 429) {
          rateLimitedRequests.push(url);
        } else if (status === 503) {
          tooManyRequests.push(url);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to trigger multiple requests by refreshing and navigating
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log(`Rate limited requests (429): ${rateLimitedRequests.length}`);
    console.log(`Service unavailable requests (503): ${tooManyRequests.length}`);
    
    if (rateLimitedRequests.length > 0) {
      console.warn('Rate limiting detected on:', rateLimitedRequests);
    }
    
    if (tooManyRequests.length > 0) {
      console.warn('Service unavailable errors:', tooManyRequests);
    }
  });
});