import { Page, expect } from '@playwright/test';

export class TestUtils {
  constructor(private page: Page) {}

  async waitForNoErrors() {
    // Wait for any async operations to complete
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async captureConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  async captureNetworkErrors(): Promise<Array<{ url: string; status: number; error?: string }>> {
    const networkErrors: Array<{ url: string; status: number; error?: string }> = [];
    
    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    this.page.on('requestfailed', (request) => {
      networkErrors.push({
        url: request.url(),
        status: 0,
        error: request.failure()?.errorText
      });
    });

    return networkErrors;
  }

  async checkForElement(selector: string, description: string): Promise<boolean> {
    const element = this.page.locator(selector);
    const exists = await element.count() > 0;
    console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Found' : 'Not found'}`);
    return exists;
  }

  async checkForText(text: string | RegExp, description: string): Promise<boolean> {
    const element = this.page.locator(`text=${text instanceof RegExp ? text.source : text}`);
    const exists = await element.count() > 0;
    console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Found' : 'Not found'}`);
    return exists;
  }

  async safeClick(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    const count = await element.count();
    
    if (count > 0) {
      await element.first().click();
      await this.waitForNoErrors();
      return true;
    }
    return false;
  }

  async safeFill(selector: string, value: string): Promise<boolean> {
    const element = this.page.locator(selector);
    const count = await element.count();
    
    if (count > 0) {
      await element.first().fill(value);
      return true;
    }
    return false;
  }

  async getResponsesByPattern(pattern: string | RegExp): Promise<Array<{ url: string; status: number }>> {
    const responses: Array<{ url: string; status: number }> = [];
    
    this.page.on('response', (response) => {
      const url = response.url();
      const matches = typeof pattern === 'string' ? 
        url.includes(pattern) : 
        pattern.test(url);
      
      if (matches) {
        responses.push({
          url,
          status: response.status()
        });
      }
    });

    return responses;
  }

  async generateTestReport(testName: string, results: Record<string, any>): Promise<void> {
    console.log(`\n=== ${testName} Test Report ===`);
    Object.entries(results).forEach(([key, value]) => {
      console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
    });
    console.log(`=== End ${testName} Report ===\n`);
  }
}

export const TestConstants = {
  COMMON_SELECTORS: {
    navigation: 'nav, [role="navigation"], header',
    footer: 'footer, [role="contentinfo"]',
    main: 'main, [role="main"]',
    sidebar: '[class*="sidebar"], [id*="sidebar"]',
    loginForm: 'form[action*="login"], form[action*="signin"]',
    registerForm: 'form[action*="register"], form[action*="signup"]',
    modal: '[role="dialog"], .modal',
    alert: '[role="alert"], .alert, .error, .warning'
  },
  
  API_PATTERNS: {
    health: /\/(api\/)?health$/,
    auth: /\/(api\/)?auth/,
    user: /\/(api\/)?user/,
    strava: /strava/i,
    workout: /\/(api\/)?(workout|training|activity)/
  },
  
  TIMEOUTS: {
    short: 2000,
    medium: 5000,
    long: 10000,
    navigation: 30000
  }
} as const;