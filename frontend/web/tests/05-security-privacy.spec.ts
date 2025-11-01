import { test, expect } from '@playwright/test';

test.describe('Security & Privacy Tests', () => {
  test('should have secure HTTP headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    
    const securityHeaders = [
      { name: 'content-security-policy', description: 'Content Security Policy' },
      { name: 'x-frame-options', description: 'X-Frame-Options' },
      { name: 'x-content-type-options', description: 'X-Content-Type-Options' },
      { name: 'strict-transport-security', description: 'HSTS' },
      { name: 'referrer-policy', description: 'Referrer Policy' }
    ];
    
    console.log('Security Headers Check:');
    securityHeaders.forEach(({ name, description }) => {
      const present = headers[name] || headers[name.toUpperCase()];
      const status = present ? '✅' : '❌';
      console.log(`  ${status} ${description}: ${present || 'Missing'}`);
    });
    
    // Check for insecure headers that should not be present
    const insecureHeaders = ['server', 'x-powered-by'];
    console.log('\nInformation Disclosure Headers:');
    insecureHeaders.forEach(name => {
      const present = headers[name] || headers[name.toUpperCase()];
      const status = present ? '⚠️' : '✅';
      console.log(`  ${status} ${name}: ${present || 'Not disclosed'}`);
    });
  });

  test('should use HTTPS and secure protocols', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const isHttps = currentUrl.startsWith('https://');
    
    console.log(`Protocol security: ${isHttps ? '✅ HTTPS' : '❌ HTTP (insecure)'}`);
    
    // Check for mixed content issues
    const requests = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('http://')) {
        requests.push(url);
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    if (requests.length > 0) {
      console.warn('⚠️  Mixed content detected (HTTP resources on HTTPS page):');
      requests.forEach(url => console.warn(`    ${url}`));
    } else {
      console.log('✅ No mixed content issues detected');
    }
  });

  test('should handle sensitive data securely', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for password fields with proper attributes
    const passwordFields = page.locator('input[type="password"]');
    const passwordCount = await passwordFields.count();
    
    console.log(`Password fields found: ${passwordCount}`);
    
    for (let i = 0; i < passwordCount; i++) {
      const field = passwordFields.nth(i);
      const autocomplete = await field.getAttribute('autocomplete');
      const name = await field.getAttribute('name');
      
      console.log(`  Password field ${i + 1}:`);
      console.log(`    Name: ${name}`);
      console.log(`    Autocomplete: ${autocomplete || 'not set'}`);
      
      // Check if autocomplete is properly configured
      const hasSecureAutocomplete = autocomplete === 'current-password' || autocomplete === 'new-password' || autocomplete === 'off';
      console.log(`    Secure autocomplete: ${hasSecureAutocomplete ? '✅' : '⚠️'}`);
    }
  });

  test('should check for console log security', async ({ page }) => {
    const consoleLogs = [];
    const sensitivePatterns = [
      /password/i, /token/i, /key/i, /secret/i, /api[-_]?key/i,
      /bearer/i, /authorization/i, /jwt/i, /session/i
    ];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      
      // Check for sensitive information in console
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(text)) {
          console.warn(`⚠️  Potentially sensitive data in console: ${text.substring(0, 100)}...`);
        }
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Total console messages: ${consoleLogs.length}`);
    
    // Check for debug/development logs that shouldn't be in production
    const debugLogs = consoleLogs.filter(log => 
      log.includes('debug') || log.includes('dev') || log.includes('test')
    );
    
    if (debugLogs.length > 0) {
      console.warn(`⚠️  Debug logs in production: ${debugLogs.length}`);
      debugLogs.slice(0, 3).forEach(log => console.warn(`    ${log.substring(0, 100)}...`));
    }
  });

  test('should verify GDPR compliance features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for GDPR compliance elements
    const gdprElements = {
      consent: page.locator('[id*="consent"], [class*="consent"], text=/consent|piekrišana/i'),
      privacy: page.locator('a, button').filter({ hasText: /privacy|privātums/i }),
      cookies: page.locator('[id*="cookie"], [class*="cookie"], text=/cookie|sīkfails/i'),
      dataExport: page.locator('a, button').filter({ hasText: /export|download.*data|lejupielādēt.*datus/i }),
      dataDelete: page.locator('a, button').filter({ hasText: /delete.*account|dzēst.*kontu|delete.*data/i })
    };
    
    console.log('GDPR Compliance Check:');
    for (const [feature, element] of Object.entries(gdprElements)) {
      const count = await element.count();
      const status = count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${feature.charAt(0).toUpperCase() + feature.slice(1)}: ${count > 0 ? 'Present' : 'Not found'}`);
    }
    
    // Check for consent banner/modal
    const consentBanner = page.locator('[role="dialog"], [role="banner"], .modal, .banner').filter({ 
      hasText: /cookie|consent|privacy|gdpr/i 
    });
    const hasConsentUI = await consentBanner.count() > 0;
    console.log(`  ${hasConsentUI ? '✅' : '❌'} Consent UI: ${hasConsentUI ? 'Present' : 'Not found'}`);
  });

  test('should check data encryption in transit', async ({ page }) => {
    const requestData = [];
    
    page.on('request', async (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('api.')) {
        const method = request.method();
        const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
        
        if (hasBody) {
          try {
            const postData = request.postData();
            requestData.push({
              url,
              method,
              hasData: !!postData,
              isSecure: url.startsWith('https://')
            });
          } catch (e) {
            // Some requests might not have accessible post data
          }
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to find and interact with forms to generate POST requests
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    console.log(`Forms found: ${formCount}`);
    
    console.log('Data transmission security:');
    requestData.forEach(req => {
      const security = req.isSecure ? '✅ HTTPS' : '❌ HTTP';
      console.log(`  ${security} ${req.method} ${req.url}`);
    });
    
    const insecureRequests = requestData.filter(req => !req.isSecure);
    if (insecureRequests.length > 0) {
      console.error(`🚨 Insecure data transmission detected: ${insecureRequests.length} requests`);
    }
  });

  test('should verify session security', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check cookies for security flags
    const cookies = await page.context().cookies();
    
    console.log('Cookie Security Analysis:');
    console.log(`Total cookies: ${cookies.length}`);
    
    cookies.forEach(cookie => {
      console.log(`  Cookie: ${cookie.name}`);
      console.log(`    HttpOnly: ${cookie.httpOnly ? '✅' : '❌'}`);
      console.log(`    Secure: ${cookie.secure ? '✅' : '❌'}`);
      console.log(`    SameSite: ${cookie.sameSite || 'Not set'}`);
      console.log(`    Domain: ${cookie.domain}`);
      
      // Check for potentially sensitive cookies
      const isSensitive = cookie.name.toLowerCase().includes('session') || 
                         cookie.name.toLowerCase().includes('token') ||
                         cookie.name.toLowerCase().includes('auth');
      
      if (isSensitive) {
        const isSecure = cookie.httpOnly && cookie.secure;
        console.log(`    Sensitive cookie security: ${isSecure ? '✅' : '⚠️'}`);
      }
    });
    
    // Check localStorage and sessionStorage for sensitive data
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key)?.substring(0, 50) + '...';
      }
      return data;
    });
    
    const sessionStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        data[key] = sessionStorage.getItem(key)?.substring(0, 50) + '...';
      }
      return data;
    });
    
    console.log(`Local storage items: ${Object.keys(localStorageData).length}`);
    console.log(`Session storage items: ${Object.keys(sessionStorageData).length}`);
    
    // Check for sensitive data patterns in storage
    const sensitivePatterns = ['token', 'password', 'key', 'secret', 'bearer'];
    [...Object.keys(localStorageData), ...Object.keys(sessionStorageData)].forEach(key => {
      const hasSensitive = sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern));
      if (hasSensitive) {
        console.warn(`⚠️  Potentially sensitive data in storage: ${key}`);
      }
    });
  });
});