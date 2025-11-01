import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken as getStoredAuthToken } from '../lib/auth';
import { logger } from '../lib/productionLogger'

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

interface AuthenticatedResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
  status: number;
}

/**
 * Hook for making authenticated API requests with proper error handling
 * @returns authenticatedFetch function
 */
export function useAuthenticatedFetch() {
  const { token } = useAuth();
  
  const authenticatedFetch = useCallback(async <T = any>(
    url: string,
    options: FetchOptions = {}
  ): Promise<AuthenticatedResponse<T>> => {
    try {
      const { requireAuth = true, headers = {}, ...restOptions } = options;
      
      // Prepare headers
      const requestHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Add auth token if required
      if (requireAuth) {
        // Try to get token from context first, fallback to localStorage
        const authToken = token || getStoredAuthToken();
        
        logger.info('COMPONENT', 'Auth check in useAuthenticatedFetch:', {
          requireAuth,
          contextToken: !!token,
          storedToken: !!getStoredAuthToken(),
          finalToken: !!authToken,
          tokenLength: authToken?.length,
          tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : null
        });
        
        if (!authToken) {
          return {
            data: null,
            error: 'Authentication token not found',
            success: false,
            status: 401
          };
        }
        (requestHeaders as Record<string, string>).Authorization = `Bearer ${authToken}`;
      }

      // Make the request
      const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
      });

      let data: T | null = null;
      let error: string | null = null;

      // Try to parse response
      try {
        const responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        logger.warn('WARNING', 'Failed to parse response as JSON:', { parseError });
        error = 'Invalid response format';
      }

      // Handle different response statuses
      if (!response.ok) {
        const errorMessage = 
          (data as any)?.error || 
          (data as any)?.message || 
          `HTTP ${response.status}: ${response.statusText}`;
        
        return {
          data: null,
          error: errorMessage,
          success: false,
          status: response.status
        };
      }

      return {
        data,
        error: null,
        success: true,
        status: response.status
      };

    } catch (networkError) {
      logger.error('ERROR', 'Network error:', { error: networkError });
      return {
        data: null,
        error: networkError instanceof Error ? networkError.message : 'Network error',
        success: false,
        status: 0
      };
    }
  }, [token]);

  return authenticatedFetch;
}

/**
 * Hook for common API operations
 */
export function useApiOperations() {
  const authenticatedFetch = useAuthenticatedFetch();

  const get = useCallback(<T = any>(url: string, requireAuth = true) => {
    // Construct full URL if it's a relative path
    const fullUrl = url.startsWith('/') 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}${url}`
      : url;
    return authenticatedFetch<T>(fullUrl, { method: 'GET', requireAuth });
  }, [authenticatedFetch]);

  const post = useCallback(<T = any>(url: string, data?: any, requireAuth = true) => {
    const body = data ? JSON.stringify(data) : undefined;
    const fullUrl = url.startsWith('/') 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}${url}`
      : url;
    return authenticatedFetch<T>(fullUrl, { method: 'POST', body, requireAuth });
  }, [authenticatedFetch]);

  const put = useCallback(<T = any>(url: string, data?: any, requireAuth = true) => {
    const body = data ? JSON.stringify(data) : undefined;
    const fullUrl = url.startsWith('/') 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}${url}`
      : url;
    return authenticatedFetch<T>(fullUrl, { method: 'PUT', body, requireAuth });
  }, [authenticatedFetch]);

  const del = useCallback(<T = any>(url: string, requireAuth = true) => {
    const fullUrl = url.startsWith('/') 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}${url}`
      : url;
    return authenticatedFetch<T>(fullUrl, { method: 'DELETE', requireAuth });
  }, [authenticatedFetch]);

  const upload = useCallback(<T = any>(url: string, formData: FormData, requireAuth = true) => {
    const fullUrl = url.startsWith('/') 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}${url}`
      : url;
    return authenticatedFetch<T>(fullUrl, {
      method: 'POST',
      body: formData,
      requireAuth,
      headers: {} // Don't set Content-Type for FormData - browser will set it with boundary
    });
  }, [authenticatedFetch]);

  return {
    get,
    post,
    put,
    delete: del,
    upload,
    authenticatedFetch
  };
}

export default useAuthenticatedFetch;