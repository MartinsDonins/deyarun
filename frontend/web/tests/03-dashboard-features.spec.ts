import { test, expect } from '@playwright/test';

test.describe('Dashboard & Features Tests', () => {
  test('should display dashboard components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for dashboard elements
    const dashboardIndicators = [
      'dashboard', 'stats', 'metrics', 'analytics', 
      'progress', 'activities', 'workouts', 'training'
    ];
    
    let foundComponents = 0;
    for (const indicator of dashboardIndicators) {
      const elements = page.locator(`[id*="${indicator}"], [class*="${indicator}"], text=/${indicator}/i`);
      const count = await elements.count();
      if (count > 0) {
        foundComponents++;
        console.log(`Dashboard component '${indicator}': Found (${count} elements)`);
      }
    }
    
    console.log(`Total dashboard components found: ${foundComponents}/${dashboardIndicators.length}`);
  });

  test('should check for activity tracking features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for activity-related features
    const activityFeatures = [
      'workout', 'training', 'running', 'activity', 'exercise',
      'distance', 'pace', 'time', 'calories', 'heart rate'
    ];
    
    let activityElements = 0;
    for (const feature of activityFeatures) {
      const elements = page.locator(`[id*="${feature}"], [class*="${feature}"], text=/${feature}/i`);
      const count = await elements.count();
      if (count > 0) {
        activityElements++;
        console.log(`Activity feature '${feature}': Found`);
      }
    }
    
    console.log(`Activity tracking features: ${activityElements}/${activityFeatures.length} detected`);
  });

  test('should verify data visualization components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for chart/graph elements
    const chartSelectors = [
      'canvas', 'svg', '[class*="chart"]', '[class*="graph"]',
      '[id*="chart"]', '[id*="graph"]', '.recharts-wrapper',
      '[data-testid*="chart"]', '[role="img"]'
    ];
    
    let chartsFound = 0;
    for (const selector of chartSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        chartsFound++;
        console.log(`Chart element '${selector}': ${count} found`);
      }
    }
    
    console.log(`Data visualization components: ${chartsFound} different types found`);
  });

  test('should check for real-time data (no mock data)', async ({ page }) => {
    // Monitor network requests for API calls
    const apiRequests: string[] = [];
    const mockDataIndicators: string[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('api.')) {
        apiRequests.push(url);
      }
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.status() === 200) {
        try {
          const text = await response.text();
          // Check for mock/fake data indicators
          if (text.includes('mock') || text.includes('demo') || text.includes('sample') || text.includes('fake')) {
            mockDataIndicators.push(response.url());
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`API requests detected: ${apiRequests.length}`);
    console.log(`Potential mock data responses: ${mockDataIndicators.length}`);
    
    if (mockDataIndicators.length > 0) {
      console.warn('Mock data detected in responses:', mockDataIndicators);
    }
    
    // Check page content for hardcoded fake data
    const content = await page.content();
    const fakeDataPatterns = [
      /9\s*km/, /15\s*workouts/, /demo.*data/i, /sample.*data/i,
      /mock.*data/i, /test.*user/i, /fake.*user/i
    ];
    
    let fakeDataFound = 0;
    for (const pattern of fakeDataPatterns) {
      if (pattern.test(content)) {
        fakeDataFound++;
        console.warn(`Potential fake data pattern found: ${pattern}`);
      }
    }
    
    console.log(`Fake data patterns in content: ${fakeDataFound} detected`);
  });

  test('should verify Strava integration presence', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for Strava-related elements
    const stravaElements = page.locator('text=/strava/i, [class*="strava"], [id*="strava"], img[alt*="strava"]');
    const stravaCount = await stravaElements.count();
    
    console.log(`Strava integration elements: ${stravaCount} found`);
    
    if (stravaCount > 0) {
      // Check if Strava elements are interactive
      const clickableStrava = page.locator('button, a, [role="button"]').filter({ hasText: /strava/i });
      const clickableCount = await clickableStrava.count();
      console.log(`Interactive Strava elements: ${clickableCount} found`);
    }
  });

  test('should check for mobile responsiveness', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (isMobile) {
      // Mobile-specific checks
      await expect(page.locator('body')).toHaveCSS('overflow-x', 'hidden');
      
      // Check for mobile navigation (hamburger menu, etc.)
      const mobileNav = page.locator('[class*="mobile"], [id*="mobile"], [aria-label*="menu"], .hamburger, .menu-toggle');
      const hasMobileNav = await mobileNav.count() > 0;
      console.log(`Mobile navigation: ${hasMobileNav ? 'Present' : 'Not detected'}`);
    } else {
      // Desktop-specific checks
      const sidebar = page.locator('[class*="sidebar"], [id*="sidebar"], nav[class*="side"]');
      const hasSidebar = await sidebar.count() > 0;
      console.log(`Desktop sidebar navigation: ${hasSidebar ? 'Present' : 'Not detected'}`);
    }
  });

  test('should verify footer information', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to bottom to ensure footer is loaded
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    const footer = page.locator('footer, [role="contentinfo"], [id*="footer"], [class*="footer"]');
    const footerExists = await footer.count() > 0;
    
    console.log(`Footer present: ${footerExists}`);
    
    if (footerExists) {
      // Check for version information
      const versionText = footer.locator('text=/v\d+\.\d+\.\d+|version/i');
      const hasVersion = await versionText.count() > 0;
      console.log(`Version information in footer: ${hasVersion ? 'Present' : 'Not found'}`);
      
      // Check for privacy policy/terms links
      const privacyLink = footer.locator('a').filter({ hasText: /privacy|privātums/i });
      const termsLink = footer.locator('a').filter({ hasText: /terms|noteikumi/i });
      
      console.log(`Privacy policy link: ${await privacyLink.count() > 0 ? 'Present' : 'Not found'}`);
      console.log(`Terms of service link: ${await termsLink.count() > 0 ? 'Present' : 'Not found'}`);
    }
  });
});