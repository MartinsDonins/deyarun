// SECURITY: Secure authentication using httpOnly cookies
// This prevents XSS attacks from accessing JWT tokens

// Helper function to set auth token via secure httpOnly cookie
export const setAuthToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      credentials: 'include' // Include cookies in request
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to set auth cookie:', error);
    return false;
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      credentials: 'include' // Include cookies in request
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to verify authentication:', error);
    return false;
  }
}

// Helper function to remove auth token (logout)
export const removeAuthToken = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include' // Include cookies in request
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to logout:', error);
    return false;
  }
}

// Legacy support: Get token from localStorage (DEPRECATED - for migration only)
export const getLegacyAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // SECURITY WARNING: This is deprecated and should be removed after migration
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  
  // If found in localStorage, migrate to secure httpOnly cookie
  if (token) {
    setAuthToken(token);
    // Clear from localStorage after migration
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
  }
  
  return token;
}

// SECURITY: No direct token access - use API endpoints with httpOnly cookies
export const getAuthToken = (): null => {
  // SECURITY: Tokens are now stored in httpOnly cookies and cannot be accessed by JavaScript
  // This prevents XSS attacks from stealing authentication tokens
  console.warn('Direct token access is disabled for security. Use isAuthenticated() instead.');
  return null;
}