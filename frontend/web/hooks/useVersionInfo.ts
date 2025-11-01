import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';
import { logger } from '../lib/productionLogger'

interface VersionInfo {
  backend: string;
  frontend: string;
  mobile: string;
  api: string;
}

interface SystemHealth {
  status: 'OK' | 'DEGRADED' | 'ERROR';
  service: string;
  timestamp: string;
  versions?: VersionInfo;
  databases?: {
    mongodb: string;
  };
}

export function useVersionInfo() {
  const [versions, setVersions] = useState<VersionInfo>({
    backend: 'Loading...',
    frontend: 'Loading...',
    mobile: 'Loading...',
    api: 'Loading...'
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchVersionInfo = async () => {
    if (!isClient) return;
    
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // First try the dedicated versions endpoint
      try {
        const versionsResponse = await fetch(`${apiUrl}/api/versions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (versionsResponse.ok) {
          const versionsData = await versionsResponse.json();
          if (versionsData.success && versionsData.data) {
            setVersions({
              backend: versionsData.data.backend || 'Unknown',
              frontend: versionsData.data.frontend || 'Unknown',
              mobile: versionsData.data.mobile || 'Unknown',
              api: versionsData.data.backend || 'Unknown'
            });
            setLastUpdated(new Date());
            return;
          }
        }
      } catch (versionsError) {
        logger.warn('WARNING', 'Versions endpoint not available, trying health endpoint');
      }

      // Fallback to health endpoint
      const healthData = await apiService.healthCheck();
      
      if (healthData && healthData.versions) {
        setVersions({
          backend: healthData.versions.backend || 'Unknown',
          frontend: healthData.versions.frontend || 'Unknown', 
          mobile: healthData.versions.mobile || 'Unknown',
          api: healthData.version || healthData.versions.backend || 'Unknown'
        });
        setSystemHealth(healthData);
      } else {
        // Final fallback to root endpoint
        try {
          const rootResponse = await fetch(`${apiUrl}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (rootResponse.ok) {
            const rootData = await rootResponse.json();
            if (rootData.versions) {
              setVersions({
                backend: rootData.versions.backend || 'Unknown',
                frontend: rootData.versions.frontend || 'Unknown',
                mobile: rootData.versions.mobile || 'Unknown', 
                api: rootData.version || 'Unknown'
              });
            }
          }
        } catch (rootError) {
          logger.warn('WARNING', 'Failed to fetch from root endpoint:', { rootError });
        }
      }

      setLastUpdated(new Date());
      
    } catch (err) {
      logger.error('ERROR', 'Error fetching version info:', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to fetch version info');
      
      // Set fallback versions on error
      setVersions({
        backend: 'Error',
        frontend: 'Error', 
        mobile: 'Error',
        api: 'Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 minutes (only on client side)
  useEffect(() => {
    if (!isClient) return;

    // Initial fetch
    fetchVersionInfo();

    // Set up auto-refresh interval
    const interval = setInterval(fetchVersionInfo, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const refresh = () => {
    fetchVersionInfo();
  };

  return {
    versions,
    systemHealth,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

// Helper function to get current frontend version from package.json  
export function getFrontendVersion(): string {
  // Try to get from environment variable first (set at build time)
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }
  
  // Fallback - this should be set via build process
  try {
    // In production, this would be injected at build time
    return require('../package.json').version;
  } catch {
    return 'Unknown';
  }
}

// Helper function to format version display
export function formatVersion(version: string): string {
  if (!version || version === 'Loading...' || version === 'Error' || version === 'Unknown') {
    return version;
  }
  
  // Ensure version starts with 'v' prefix
  return version.startsWith('v') ? version : `v${version}`;
}

// Helper function to check if version is outdated
export function isVersionOutdated(version: string, latestVersion: string): boolean {
  if (!version || !latestVersion || version === 'Loading...' || version === 'Error') {
    return false;
  }
  
  // Simple version comparison (assumes semantic versioning)
  const cleanVersion = version.replace('v', '');
  const cleanLatest = latestVersion.replace('v', '');
  
  return cleanVersion !== cleanLatest;
}