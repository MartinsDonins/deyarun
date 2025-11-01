import fetch from 'node-fetch';

/**
 * Coolify API Integration Service
 * Fetches deployment status and application information from Coolify
 */
class CoolifyService {
  constructor() {
    // Support both old and new environment variable names
    this.apiUrl = process.env.COOLIFY_BASE_URL || process.env.COOLIFY_API_URL || 'https://runacademy.coredigify.com';
    this.apiToken = process.env.COOLIFY_API_KEY || process.env.COOLIFY_API_TOKEN || '4|tW9McgEL2V0J0CcnAlU8aAUT2Q5eEM7zEdvGfNkS130eecc7';
    this.backendAppId = process.env.COOLIFY_BACKEND_RESOURCE_ID || process.env.COOLIFY_BACKEND_APP_ID || 'rwcgggs4s008cksks8k8o00s';
    this.frontendAppId = process.env.COOLIFY_FRONTEND_RESOURCE_ID || process.env.COOLIFY_FRONTEND_APP_ID || 'yog8cgss8osko8woc4ss8owg';
    this.serverId = process.env.COOLIFY_SERVER_ID || 'w48c0s80sk08gkgsw0owg084';
    
    if (!this.apiUrl || !this.apiToken) {
      console.warn('⚠️ Coolify API credentials not configured');
    }
  }

  /**
   * Make authenticated request to Coolify API
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object|null>} Response data or null on error
   */
  async makeRequest(endpoint) {
    if (!this.apiUrl || !this.apiToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/v1${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        console.warn(`Coolify API error: ${response.status} ${response.statusText} for ${this.apiUrl}/api/v1${endpoint}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Coolify API request failed:', error.message);
      return null;
    }
  }

  /**
   * Get application information
   * @param {string} appId - Application ID
   * @returns {Promise<Object|null>} Application data
   */
  async getApplication(appId) {
    if (!appId) return null;
    return await this.makeRequest(`/applications/${appId}`);
  }

  /**
   * Get deployment status for specific application
   * @param {string} appId - Application ID  
   * @returns {Promise<Object|null>} Deployment status
   */
  async getApplicationDeployments(appId) {
    if (!appId) return null;
    return await this.makeRequest(`/applications/${appId}/deployments`);
  }

  /**
   * Get server status
   * @returns {Promise<Object|null>} Server status
   */
  async getServerStatus() {
    return await this.makeRequest('/servers');
  }

  /**
   * Parse application status from Coolify response
   * @param {Object} app - Application data from API
   * @returns {Object} Parsed status
   */
  parseApplicationStatus(app) {
    if (!app) {
      return {
        status: 'unknown',
        health: 'unknown',
        uptime: null,
        lastDeployment: null,
        url: null,
        error: 'Application not found'
      };
    }

    return {
      status: app.status || 'unknown',
      health: app.health_status || 'unknown',
      uptime: app.uptime || null,
      lastDeployment: app.updated_at || app.deployed_at || null,
      url: app.fqdn || app.url || null,
      name: app.name || 'Unknown',
      error: null
    };
  }

  /**
   * Get comprehensive deployment status for all services
   * @returns {Promise<Object>} Complete deployment status
   */
  async getDeploymentStatus() {
    try {
      console.log('🔄 Fetching Coolify deployment status...');

      const [backendApp, frontendApp, serverStatus] = await Promise.all([
        this.getApplication(this.backendAppId),
        this.getApplication(this.frontendAppId),
        this.getServerStatus()
      ]);

      const status = {
        platform: 'Coolify',
        timestamp: new Date().toISOString(),
        available: !!(this.apiUrl && this.apiToken),
        services: {
          backend: this.parseApplicationStatus(backendApp),
          frontend: this.parseApplicationStatus(frontendApp)
        },
        server: {
          status: serverStatus?.status || 'unknown',
          uptime: serverStatus?.uptime || null
        }
      };

      console.log('✅ Coolify status retrieved:', {
        backend: status.services.backend.status,
        frontend: status.services.frontend.status
      });

      return status;
    } catch (error) {
      console.error('❌ Failed to get Coolify deployment status:', error);
      
      return {
        platform: 'Coolify',
        timestamp: new Date().toISOString(),
        available: false,
        error: error.message,
        configured: this.isConfigured(),
        apiUrl: this.apiUrl,
        services: {
          backend: {
            status: 'connection_error',
            health: 'unknown',
            error: 'API endpoint not responding - check Coolify configuration'
          },
          frontend: {
            status: 'connection_error', 
            health: 'unknown',
            error: 'API endpoint not responding - check Coolify configuration'
          }
        }
      };
    }
  }

  /**
   * Get recent deployments for monitoring
   * @returns {Promise<Array>} Recent deployment history
   */
  async getRecentDeployments() {
    try {
      const [backendDeployments, frontendDeployments] = await Promise.all([
        this.getApplicationDeployments(this.backendAppId),
        this.getApplicationDeployments(this.frontendAppId)
      ]);

      const deployments = [];

      // Process backend deployments
      if (backendDeployments?.data) {
        backendDeployments.data.slice(0, 5).forEach(deployment => {
          deployments.push({
            service: 'backend',
            id: deployment.id,
            status: deployment.status,
            created_at: deployment.created_at,
            finished_at: deployment.finished_at,
            commit: deployment.commit?.substring(0, 7) || 'unknown'
          });
        });
      }

      // Process frontend deployments  
      if (frontendDeployments?.data) {
        frontendDeployments.data.slice(0, 5).forEach(deployment => {
          deployments.push({
            service: 'frontend',
            id: deployment.id, 
            status: deployment.status,
            created_at: deployment.created_at,
            finished_at: deployment.finished_at,
            commit: deployment.commit?.substring(0, 7) || 'unknown'
          });
        });
      }

      // Sort by date, most recent first
      return deployments.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

    } catch (error) {
      console.error('Failed to get recent deployments:', error);
      return [];
    }
  }

  /**
   * Check if Coolify integration is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!(this.apiUrl && this.apiToken && (this.backendAppId || this.frontendAppId));
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} Connection test result
   */
  async testConnection() {
    try {
      const result = await this.makeRequest('/servers');
      return !!result;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const coolifyService = new CoolifyService();
export default coolifyService;