// SECURITY: Auth utility functions using httpOnly cookies
// This prevents XSS attacks from accessing JWT tokens

/**
 * DEPRECATED: Direct token access is disabled for security
 * Use API calls with credentials: 'include' instead
 */
export const getAuthToken = (): null => {
  console.warn('Direct token access is disabled for security. Use credentials: "include" in fetch requests.');
  return null;
};

/**
 * DEPRECATED: Tokens are now stored in httpOnly cookies
 */
export const setAuthToken = (_token: string): void => {
  console.warn('Direct token setting is disabled. Tokens are managed via httpOnly cookies.');
};

/**
 * DEPRECATED: Tokens are now stored in httpOnly cookies
 */
export const removeAuthToken = (): void => {
  console.warn('Use logout API endpoint instead.');
};

/**
 * Get headers for authenticated API requests
 * No Authorization header needed - authentication via httpOnly cookies
 */
export const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json'
    // No Authorization header - using httpOnly cookies
  };
};