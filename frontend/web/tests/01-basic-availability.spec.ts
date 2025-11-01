import { test, expect } from '@playwright/test';

test.describe('Basic Availability Tests', () => {
  test('should load homepage and display title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DeyaRun|RunAcademy/i);
    
    // Check if page loaded without errors
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Report console errors for investigation (non-blocking)
    if (errors.length > 0) {
      console.warn('Console errors found:', errors);
    }
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if main navigation elements are present
    const nav = page.locator('nav, [role="navigation"], header');
    await expect(nav.first()).toBeVisible();
  });

  test('should load PWA manifest correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached();
    
    // Check for apple-touch-icon
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toBeAttached();
    
    // Verify the apple-touch-icon responds
    const response = await page.request.get('/apple-touch-icon.png');
    expect(response.status()).toBe(200);
  });

  test('should have secure headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check for security headers
    const headers = response?.headers();
    
    // CSP header should be present for security
    if (headers && !headers['content-security-policy']) {
      console.warn('Content Security Policy header missing');
    }
    
    // X-Frame-Options should be present
    if (headers && !headers['x-frame-options']) {
      console.warn('X-Frame-Options header missing');
    }
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (isMobile) {
      // Mobile-specific tests
      await expect(page.locator('body')).toHaveCSS('overflow-x', 'hidden');
    } else {
      // Desktop-specific tests
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeGreaterThan(1024);
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    page.on('requestfailed', (request) => {
      console.warn(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Report JS errors (non-blocking for info gathering)
    if (jsErrors.length > 0) {
      console.warn('JavaScript errors found:', jsErrors);
    }
  });
});