import { logger } from '../lib/productionLogger'
/**
 * Bug Report API Service for Web
 * 
 * Manages communication with backend for bug reporting functionality
 */

import { getAuthToken } from '../utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';

export interface BugReportData {
  title: string;
  description: string;
  category: string;
  priority?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  deviceInfo?: {
    platform: string;
    userAgent?: string;
    screenSize?: string;
    appVersion?: string;
  };
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface BugReportResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
    createdAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface Category {
  value: string;
  label: string;
  description: string;
}

export interface UserBugReport {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

class BugReportAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Submit a new bug report
   */
  async submitBugReport(bugReportData: BugReportData): Promise<BugReportResponse> {
    try {
      const authToken = getAuthToken();
      
      logger.info('COMPONENT', '📤 Submitting bug report:', {
        title: bugReportData.title,
        category: bugReportData.category,
        hasAuth: !!authToken
      });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const url = `${this.baseURL}/api/bug-reports`;
      logger.info('COMPONENT', '📍 Making request to:', { url });
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bugReportData)
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('ERROR', '❌ Server error response:', {
          status: response.status,
          result
        });
        throw new Error(`HTTP ${response.status}: ${result.message || 'Unknown error'}`);
      }

      logger.info('COMPONENT', '✅ Bug report submitted successfully:', result.data?.id);
      
      return result;

    } catch (error) {
      logger.error('ERROR', '❌ Error submitting bug report:', error);
      
      // Determine specific error message
      let message = 'Neizdevās nosūtīt ziņojumu. Lūdzu mēģiniet vēlāk.';
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        message = 'Nav savienojuma ar internetu. Lūdzu pārbaudiet savienojumu un mēģiniet vēlāk.';
      } else if (error instanceof Error) {
        if (error.message.includes('HTTP 400')) {
          message = 'Validācijas kļūda. Lūdzu, pārbaudiet ievadītos datus.';
        } else if (error.message.includes('HTTP 500')) {
          message = 'Servera kļūda. Lūdzu mēģiniet vēlāk.';
        } else if (error.message.includes('HTTP')) {
          message = 'Servera kļūda. Lūdzu mēģiniet vēlāk.';
        }
      }
      
      return {
        success: false,
        message
      };
    }
  }

  /**
   * Get available bug report categories
   */
  async getCategories(): Promise<{ success: boolean; data?: Category[]; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/bug-reports/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.message || 'Failed to load categories'}`);
      }

      return result;

    } catch (error) {
      logger.error('ERROR', '❌ Error loading categories:', error);
      
      // Return fallback categories
      return {
        success: true,
        data: [
          { value: 'crash', label: 'Application error', description: 'Sistēmas kļūdas vai neparedzēta uzvedība' },
          { value: 'performance', label: 'Veiktspējas problēma', description: 'Lēna ielāde vai saķeršana' },
          { value: 'ui_bug', label: 'Design error', description: 'UI elementi nestrādā pareizi' },
          { value: 'login_issue', label: 'Login issue', description: 'Nevar pieslēgties vai autentifikācijas kļūdas' },
          { value: 'gps_tracking', label: 'GPS izsekošanas problēma', description: 'GPS nestrādā vai neprecīzi izseko atrašanās vietu' },
          { value: 'sync_issue', label: 'Datu sinhronizācijas problēma', description: 'Dati netiek saglabāti vai sinhronizēti' },
          { value: 'feature_request', label: 'Funkcionalitātes pieprasījums', description: 'Jaunu funkciju ieteikumi' },
          { value: 'other', label: 'Cits', description: 'Citas problēmas' }
        ]
      };
    }
  }

  /**
   * Get user's bug reports (requires authentication)
   */
  async getUserBugReports(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    success: boolean;
    data?: {
      bugReports: UserBugReport[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
    message?: string;
  }> {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseURL}/api/bug-reports/my?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.message || 'Failed to load bug reports'}`);
      }

      return result;

    } catch (error) {
      logger.error('ERROR', '❌ Error loading user bug reports:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load bug reports'
      };
    }
  }

  /**
   * Validate bug report data before submission
   */
  validateBugReport(data: BugReportData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Nosaukums ir obligāts');
    } else if (data.title.trim().length < 5) {
      errors.push('Nosaukums ir pārāk īss (minimums 5 rakstzīmes)');
    } else if (data.title.length > 200) {
      errors.push('Nosaukums ir pārāk garš (maksimums 200 rakstzīmes)');
    }

    // Description validation
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Apraksts ir obligāts');
    } else if (data.description.trim().length < 10) {
      errors.push('Apraksts ir pārāk īss (minimums 10 rakstzīmes)');
    } else if (data.description.length > 2000) {
      errors.push('Apraksts ir pārāk garš (maksimums 2000 rakstzīmes)');
    }

    // Category validation
    if (!data.category || data.category.trim().length === 0) {
      errors.push('Kategorija ir obligāta');
    }

    // Email validation (if provided)
    if (data.userEmail && data.userEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.userEmail)) {
        errors.push('Nederīgs e-pasta formāts');
      }
    }

    // Phone validation (if provided)
    if (data.userPhone && data.userPhone.trim().length > 0) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Basic international format
      if (!phoneRegex.test(data.userPhone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Nederīgs tālruņa numura formāts (izmantojiet +371XXXXXXXX)');
      }
    }

    // Optional fields length validation
    if (data.stepsToReproduce && data.stepsToReproduce.length > 1000) {
      errors.push('Reproducēšanas soļi ir pārāk gari (maksimums 1000 rakstzīmes)');
    }

    if (data.expectedBehavior && data.expectedBehavior.length > 500) {
      errors.push('Gaidītā rīcība ir pārāk gara (maksimums 500 rakstzīmes)');
    }

    if (data.actualBehavior && data.actualBehavior.length > 500) {
      errors.push('Faktiskā rīcība ir pārāk gara (maksimums 500 rakstzīmes)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get browser/device info for web
   */
  getDeviceInfo(): BugReportData['deviceInfo'] {
    return {
      platform: 'web',
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      appVersion: '2.8.52' // This should match current app version
    };
  }
}

// Export singleton instance
export const bugReportAPI = new BugReportAPI();
export default bugReportAPI;