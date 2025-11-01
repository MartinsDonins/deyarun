import { useState, useEffect } from 'react';
import { apiService, DashboardStats, User, Workout, RecentActivity } from '../lib/api';
import { logger } from '../lib/productionLogger'

// Generic hook for API data fetching
function useApiData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('ERROR', 'API Error:', { error: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
}

// Specific hooks for different data types
export function useDashboardStats() {
  return useApiData<DashboardStats>(() => apiService.getDashboardStats());
}

export function useUsers(limit: number = 20, offset: number = 0) {
  return useApiData<User[]>(
    () => apiService.getUsers(limit, offset),
    [limit, offset]
  );
}

export function useWorkouts(limit: number = 20, offset: number = 0) {
  return useApiData<Workout[]>(
    () => apiService.getWorkouts(limit, offset),
    [limit, offset]
  );
}

export function useRecentActivity() {
  return useApiData<RecentActivity[]>(() => apiService.getRecentActivity());
}

export function useLeaderboard(type: 'distance' | 'pace' | 'workouts' = 'distance', limit: number = 10) {
  return useApiData<any[]>(
    () => apiService.getLeaderboard(type, limit),
    [type, limit]
  );
}

export function useCoachTips(limit: number = 10) {
  return useApiData<any[]>(
    () => apiService.getCoachTips(limit),
    [limit]
  );
}

// Health check hook
export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await apiService.healthCheck();
        setHealthData(health);
        setIsHealthy(health.status === 'OK');
      } catch (error) {
        setIsHealthy(false);
        logger.error('ERROR', 'Health check failed:', { error: error });
      }
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, healthData };
}

// General API hook with request function
export function useApi() {
  const request = async (endpoint: string, options: { method?: string; data?: any; headers?: Record<string, string> } = {}) => {
    const { method = 'GET', data, headers = {} } = options;
    
    // Get token for authenticated requests
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      let response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await apiService.request(endpoint, { method: 'GET', headers });
          break;
        case 'POST':
          response = await apiService.request(endpoint, { 
            method: 'POST', 
            headers, 
            body: data ? JSON.stringify(data) : undefined 
          });
          break;
        case 'PUT':
          response = await apiService.request(endpoint, { 
            method: 'PUT', 
            headers, 
            body: data ? JSON.stringify(data) : undefined 
          });
          break;
        case 'DELETE':
          response = await apiService.request(endpoint, { method: 'DELETE', headers });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      return { success: true, data: response, message: 'Success' };
    } catch (error) {
      logger.error('ERROR', 'API request failed:', { error: error });
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null 
      };
    }
  };

  return { request };
}