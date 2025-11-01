// Session Utility Functions
// Centralized session security configuration

/**
 * Get validated session secret
 * @returns {string} Session secret
 */
export const getSessionSecret = () => {
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  
  if (sessionSecret === 'fallback-session-secret' || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be a strong secret (minimum 32 characters)');
  }
  
  return sessionSecret;
};

/**
 * Get secure session configuration
 * @returns {Object} Session configuration object
 */
export const getSessionConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS required in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'strict' : 'lax' // CSRF protection
    },
    name: 'runacademy.sid' // Custom session name (security through obscurity)
  };
};

/**
 * Validate session configuration at startup
 */
export const validateSessionConfig = () => {
  try {
    getSessionSecret();
    console.log('✅ Session configuration validated');
    return true;
  } catch (error) {
    console.error('❌ Session configuration error:', error.message);
    throw error;
  }
};

export default {
  getSessionSecret,
  getSessionConfig,
  validateSessionConfig
};