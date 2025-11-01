import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwtUtils.js';

/**
 * Cookie-based authentication middleware for httpOnly cookies
 * This middleware checks for JWT tokens in httpOnly cookies instead of Authorization header
 */
function cookieAuthMiddleware(req, res, next) {
  // Check for JWT token in cookies
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    // Normalize user object - ensure both 'id' and 'userId' are available
    req.user = {
      ...decoded,
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id
    };

    next();
  } catch (err) {
    console.error('Cookie auth middleware error:', err.message);

    // Clear invalid cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // domain removed - uses current domain automatically
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Optional cookie-based auth middleware - doesn't fail if no token provided
 */
function optionalCookieAuthMiddleware(req, res, next) {
  const token = req.cookies?.authToken;

  if (!token) {
    // No token, continue without setting req.user
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    // Normalize user object - ensure both 'id' and 'userId' are available
    req.user = {
      ...decoded,
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id
    };
  } catch (err) {
    // Invalid token, but continue anyway (don't fail)
    console.warn('Invalid token in optional cookie auth:', err.message);

    // Clear invalid cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // domain removed - uses current domain automatically
    });
  }

  next();
}

/**
 * Admin role check middleware (works with cookie auth)
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
}

/**
 * Hybrid auth middleware - supports both cookie and header token
 * This allows backward compatibility during transition
 */
function hybridAuthMiddleware(req, res, next) {
  // First try cookie-based auth
  const cookieToken = req.cookies?.authToken;

  // Fallback to header-based auth
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader ? authHeader.split(' ')[1] : null;

  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    // Normalize user object - ensure both 'id' and 'userId' are available
    req.user = {
      ...decoded,
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id
    };

    next();
  } catch (err) {
    console.error('Hybrid auth middleware error:', err.message);

    // Clear invalid cookie if it was used
    if (cookieToken) {
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // domain removed - uses current domain automatically
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
  }
}

// Export all middleware functions
export default cookieAuthMiddleware;
export {
  cookieAuthMiddleware,
  optionalCookieAuthMiddleware,
  hybridAuthMiddleware,
  requireAdmin
};

// Aliases for compatibility
export const authenticateToken = hybridAuthMiddleware;
export const verifyToken = hybridAuthMiddleware;