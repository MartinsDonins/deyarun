// Strava API Configuration
import axios from 'axios';

const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth';

// Function to get Strava configuration (lazy-loaded)
const getStravaConfig = () => {
  // Check if Strava API is configured (support both naming conventions)
  const clientId = process.env.STRAVA_CLIENT_ID || process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET || process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;
  const verifyToken = process.env.STRAVA_VERIFY_TOKEN || 'runacademy_webhook_verify_token';
  
  const isStravaConfigured = !!(clientId && clientSecret);

  if (isStravaConfigured) {
    console.log('🔧 Strava API configured successfully');
  } else {
    console.log('⚠️ Strava API not configured - STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_VERIFY_TOKEN are required');
  }

  return {
    clientId: clientId,
    clientSecret: clientSecret,
    verifyToken: verifyToken,
    webhookCallbackUrl: process.env.STRAVA_WEBHOOK_CALLBACK_URL || `${process.env.BACKEND_URL || 'https://api.deyarun.com'}/api/strava/webhook`,
    redirectUri: process.env.STRAVA_REDIRECT_URI || `${process.env.BACKEND_URL || 'https://api.deyarun.com'}/api/strava/callback`,
    scope: 'read,activity:read_all,profile:read_all',
    isConfigured: isStravaConfigured,
    
    // API endpoints
    endpoints: {
      authorize: `${STRAVA_AUTH_URL}/authorize`,
      token: `${STRAVA_AUTH_URL}/token`,
      deauthorize: `${STRAVA_AUTH_URL}/deauthorize`,
      activities: `${STRAVA_API_BASE_URL}/activities`,
      athlete: `${STRAVA_API_BASE_URL}/athlete`,
      activity: (id) => `${STRAVA_API_BASE_URL}/activities/${id}`,
      streams: (id) => `${STRAVA_API_BASE_URL}/activities/${id}/streams`,
      webhook: `${STRAVA_API_BASE_URL}/push_subscriptions`
    }
  };
};

// Create a getter that ensures fresh config each time
export const stravaConfig = new Proxy({}, {
  get(target, prop) {
    const config = getStravaConfig();
    return config[prop];
  }
});

// Create axios instance for Strava API calls
export const stravaAPI = axios.create({
  baseURL: STRAVA_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
stravaAPI.interceptors.request.use(
  (config) => {
    // Add client credentials for token requests
    if (config.url?.includes('/oauth/token')) {
      const stravaConf = getStravaConfig();
      config.data = {
        ...config.data,
        client_id: stravaConf.clientId,
        client_secret: stravaConf.clientSecret
      };
    }
    return config;
  },
  (error) => {
    console.error('❌ Strava API request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
stravaAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Strava API response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 900; // 15 minutes default
      console.warn(`⚠️ Strava API rate limit reached. Retry after ${retryAfter} seconds`);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('❌ Strava API authentication failed - token may be expired');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to create authorization URL
export const createStravaAuthUrl = (state) => {
  const config = getStravaConfig();
  if (!config.isConfigured) {
    throw new Error('Strava API not configured');
  }
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state: state || 'default'
  });
  
  return `${config.endpoints.authorize}?${params.toString()}`;
};

// Helper function to exchange code for token
export const exchangeCodeForToken = async (code) => {
  const config = getStravaConfig();
  if (!config.isConfigured) {
    throw new Error('Strava API not configured');
  }
  
  try {
    const response = await axios.post(config.endpoints.token, {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code'
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to exchange Strava code for token:', error.response?.data);
    throw error;
  }
};

// Helper function to refresh access token
export const refreshStravaToken = async (refreshToken) => {
  const config = getStravaConfig();
  if (!config.isConfigured) {
    throw new Error('Strava API not configured');
  }
  
  try {
    const response = await axios.post(config.endpoints.token, {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to refresh Strava token:', error.response?.data);
    throw error;
  }
};

// Helper function to deauthorize Strava connection
export const deauthorizeStrava = async (accessToken) => {
  const config = getStravaConfig();
  if (!config.isConfigured) {
    throw new Error('Strava API not configured');
  }
  
  try {
    const response = await axios.post(config.endpoints.deauthorize, {
      access_token: accessToken
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to deauthorize Strava:', error.response?.data);
    throw error;
  }
};

export default getStravaConfig();