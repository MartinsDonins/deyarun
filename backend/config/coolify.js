// Coolify API Configuration
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config({ path: '../.env.coolify' });
dotenv.config(); // Load default .env

export const coolifyConfig = {
  // API Configuration
  apiKey: process.env.COOLIFY_API_KEY || '4|tW9McgEL2V0J0CcnAlU8aAUT2Q5eEM7zEdvGfNkS130eecc7',
  baseUrl: process.env.COOLIFY_BASE_URL || 'https://runacademy.coredigify.com',
  serverId: process.env.COOLIFY_SERVER_ID || 'w48c0s80sk08gkgsw0owg084',
  
  // API Endpoints
  endpoints: {
    applications: process.env.COOLIFY_API_APPLICATIONS_URL || 'https://runacademy.coredigify.com/api/v1/applications',
    servers: process.env.COOLIFY_API_SERVERS_URL || 'https://runacademy.coredigify.com/api/v1/servers',
    deployments: process.env.COOLIFY_API_DEPLOYMENTS_URL || 'https://runacademy.coredigify.com/api/v1/deployments'
  },
  
  // Resource IDs
  resources: {
    frontend: process.env.COOLIFY_FRONTEND_RESOURCE_ID || 'yog8cgss8osko8woc4ss8owg',
    backend: process.env.COOLIFY_BACKEND_RESOURCE_ID || 'rwcgggs4s008cksks8k8o00s'
  },
  
  // Environment
  environment: process.env.COOLIFY_ENVIRONMENT || 'production',
  
  // Request Headers
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  },
  
  // Helper method to make API requests
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: this.getHeaders(),
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`Coolify API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Coolify API Request Failed:', error);
      throw error;
    }
  }
};

export default coolifyConfig;