// Production Logger - Replaces console.* statements for production builds
// Automatically strips logs in production while maintaining structured logging for admin users

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info', 
  WARN: 'warn',
  ERROR: 'error'
};

class ProductionLogger {
  private isDevelopment: boolean;
  private isAdmin: boolean = false;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  setAdminStatus(isAdmin: boolean) {
    this.isAdmin = isAdmin;
  }

  private shouldLog(level: string): boolean {
    // Always log in development
    if (this.isDevelopment) return true;
    
    // In production, only log errors for non-admin users
    if (!this.isAdmin && level !== 'error') return false;
    
    // Admin users get all logs in production (stored locally)
    return this.isAdmin;
  }

  private formatMessage(category: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${category}: ${message}${dataStr}`;
  }

  debug(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${this.formatMessage(category, message, data)}`);
    } else if (this.isAdmin) {
      // Store in admin logger for production
      import('./logger').then(({ adminLogger }) => {
        adminLogger.debug(category, message, data);
      });
    }
  }

  info(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;
    
    if (this.isDevelopment) {
      console.log(`[INFO] ${this.formatMessage(category, message, data)}`);
    } else if (this.isAdmin) {
      import('./logger').then(({ adminLogger }) => {
        adminLogger.info(category, message, data);
      });
    }
  }

  warn(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${this.formatMessage(category, message, data)}`);
    } else if (this.isAdmin) {
      import('./logger').then(({ adminLogger }) => {
        adminLogger.warn(category, message, data);
      });
    }
  }

  error(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${this.formatMessage(category, message, data)}`);
    } else {
      // Always report errors to monitoring in production
      import('./logger').then(({ adminLogger }) => {
        adminLogger.error(category, message, data);
      });
      
      // Also send to external error monitoring (Sentry, LogRocket, etc.)
      if (typeof window !== 'undefined') {
        // Client-side error reporting
        if ((window as any).Sentry) {
          (window as any).Sentry.captureException(new Error(`${category}: ${message}`), {
            extra: data
          });
        }
      }
    }
  }

  // Legacy console.log replacements for gradual migration
  log(message: string, ...args: any[]) {
    this.info('LEGACY', message, args.length ? args : undefined);
  }

  // API logging helpers
  logApiCall(endpoint: string, method: string, params?: any) {
    this.info('API_CALL', `${method} ${endpoint}`, { params });
  }

  logApiResponse(endpoint: string, status: number, data?: any, error?: any) {
    if (error || status >= 400) {
      this.error('API_RESPONSE', `${endpoint} failed with status ${status}`, { status, data, error });
    } else {
      this.debug('API_RESPONSE', `${endpoint} succeeded with status ${status}`, { status });
    }
  }
}

// Create singleton instance
export const logger = new ProductionLogger();

// Export types
export type { LogLevel };