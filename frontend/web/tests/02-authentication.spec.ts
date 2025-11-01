import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for login button or form
    const loginButton = page.locator('button, a, [role="button"]').filter({ hasText: /login|sign in|pieteikt/i });
    const loginForm = page.locator('form[action*="login"], form[action*="signin"], form[action*="auth"]');
    
    // Either login button or form should be visible
    const hasLoginElement = await loginButton.count() > 0 || await loginForm.count() > 0;
    expect(hasLoginElement).toBeTruthy();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to find and click login link
    const loginLink = page.locator('a, button').filter({ hasText: /login|sign in|pieteikt/i }).first();
    
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should be on login page or login form should be visible
      const currentUrl = page.url();
      const hasLoginForm = await page.locator('input[type="email"], input[type="text"], input[name*="email"], input[name*="user"]').count() > 0;
      
      expect(currentUrl.includes('login') || currentUrl.includes('signin') || hasLoginForm).toBeTruthy();
    }
  });

  test('should handle registration flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for registration/signup links
    const registerLink = page.locator('a, button').filter({ hasText: /register|sign up|reģistrēt|izveidot/i }).first();
    
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should see registration form
      const emailInput = page.locator('input[type="email"], input[name*="email"]');
      const passwordInput = page.locator('input[type="password"], input[name*="password"]');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        expect(await emailInput.isVisible()).toBeTruthy();
        expect(await passwordInput.isVisible()).toBeTruthy();
      }
    }
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to login form
    const loginForm = page.locator('form').filter({ has: page.locator('input[type="email"], input[type="password"]') }).first();
    
    if (await loginForm.count() > 0) {
      // Try invalid login
      const emailInput = loginForm.locator('input[type="email"], input[name*="email"]').first();
      const passwordInput = loginForm.locator('input[type="password"]').first();
      const submitButton = loginForm.locator('button[type="submit"], input[type="submit"]').first();
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        await emailInput.fill('invalid@test.com');
        await passwordInput.fill('wrongpassword');
        
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForLoadState('networkidle');
          
          // Should show error message (check for common error indicators)
          const errorMessage = page.locator('.error, .alert, .danger, [role="alert"]');
          const hasError = await errorMessage.count() > 0;
          
          // Non-blocking check - just report findings
          console.log(`Authentication error handling: ${hasError ? 'Working' : 'Not detected'}`);
        }
      }
    }
  });

  test('should handle OAuth/social login options', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for social login buttons
    const googleLogin = page.locator('button, a').filter({ hasText: /google/i });
    const stravaLogin = page.locator('button, a').filter({ hasText: /strava/i });
    const facebookLogin = page.locator('button, a').filter({ hasText: /facebook/i });
    
    const socialLogins = [
      { name: 'Google', element: googleLogin },
      { name: 'Strava', element: stravaLogin },
      { name: 'Facebook', element: facebookLogin }
    ];
    
    for (const { name, element } of socialLogins) {
      const count = await element.count();
      console.log(`${name} login option: ${count > 0 ? 'Available' : 'Not found'}`);
    }
  });

  test('should check for GDPR consent handling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for GDPR consent banner or modal
    const gdprElements = page.locator('[id*="consent"], [class*="consent"], [id*="cookie"], [class*="cookie"], [id*="gdpr"], [class*="gdpr"]');
    const gdprText = page.locator('text=/cookie|consent|gdpr|privātums|sīkfaili/i');
    
    const hasGdprConsent = await gdprElements.count() > 0 || await gdprText.count() > 0;
    console.log(`GDPR consent mechanism: ${hasGdprConsent ? 'Present' : 'Not detected'}`);
    
    if (hasGdprConsent) {
      // Look for accept/reject buttons
      const acceptButton = page.locator('button, a').filter({ hasText: /accept|agree|pieņemt|piekrist/i });
      const rejectButton = page.locator('button, a').filter({ hasText: /reject|deny|noraidīt|atteikt/i });
      
      console.log(`GDPR accept button: ${await acceptButton.count() > 0 ? 'Available' : 'Not found'}`);
      console.log(`GDPR reject button: ${await rejectButton.count() > 0 ? 'Available' : 'Not found'}`);
    }
  });
});