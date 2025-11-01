// JWT Utility Functions
// Centralized JWT secret management and validation

/**
 * Get validated JWT secret
 * Throws error if JWT_SECRET is not properly configured
 * @returns {string} JWT secret
 */
export const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required for secure operation');
  }
  
  if (jwtSecret === 'secret' || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be a strong secret (minimum 32 characters)');
  }
  
  return jwtSecret;
};

/**
 * Validate JWT secret at application startup
 * Should be called during server initialization
 */
export const validateJwtConfig = () => {
  try {
    getJwtSecret();
    console.log('✅ JWT configuration validated');
    return true;
  } catch (error) {
    console.error('❌ JWT configuration error:', error.message);
    throw error;
  }
};

export default {
  getJwtSecret,
  validateJwtConfig
};