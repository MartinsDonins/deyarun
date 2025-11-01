import { useState, useEffect } from 'react';
import { logger } from '../lib/productionLogger'

/**
 * Safe localStorage hook that handles SSR and potential errors
 * @param key - localStorage key
 * @param initialValue - fallback value if localStorage is not available or key doesn't exist
 * @returns [value, setValue, isLoading]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Get value from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);
          setStoredValue(parsedItem);
        }
      }
    } catch (error) {
      logger.warn('WARNING', 'Error reading localStorage key:', { key, error });
      // Keep initial value on error
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Save to localStorage if available
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logger.warn('WARNING', 'Error setting localStorage key:', { key, error });
    }
  };

  return [storedValue, setValue, isLoading];
}

/**
 * Safe localStorage getter that handles SSR and errors
 * @param key - localStorage key
 * @param fallback - fallback value if localStorage is not available or key doesn't exist
 * @returns value from localStorage or fallback
 */
export function getLocalStorageItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    }
  } catch (error) {
    logger.warn('WARNING', 'Error reading localStorage key:', { key, error });
  }
  return fallback;
}

/**
 * Safe localStorage setter that handles SSR and errors
 * @param key - localStorage key
 * @param value - value to store
 * @returns success boolean
 */
export function setLocalStorageItem<T>(key: string, value: T): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
  } catch (error) {
    logger.warn('WARNING', 'Error setting localStorage key:', { key, error });
  }
  return false;
}

/**
 * Safe localStorage remover that handles SSR and errors
 * @param key - localStorage key
 * @returns success boolean
 */
export function removeLocalStorageItem(key: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    logger.warn('WARNING', 'Error removing localStorage key:', { key, error });
  }
  return false;
}

/**
 * Hook for safely getting auth token from localStorage
 * @returns [token, isLoading]
 */
export function useAuthToken(): [string | null, boolean] {
  const [token, setToken, isLoading] = useLocalStorage<string | null>('authToken', null);
  return [token, isLoading];
}

/**
 * Safe auth token getter for API calls
 * @returns token string or null
 */
export function getAuthToken(): string | null {
  return getLocalStorageItem<string | null>('authToken', null);
}

/**
 * Safe auth token setter
 * @param token - JWT token
 * @returns success boolean
 */
export function setAuthToken(token: string): boolean {
  return setLocalStorageItem('authToken', token);
}

/**
 * Safe auth token remover (for logout)
 * @returns success boolean
 */
export function removeAuthToken(): boolean {
  return removeLocalStorageItem('authToken');
}

export default useLocalStorage;