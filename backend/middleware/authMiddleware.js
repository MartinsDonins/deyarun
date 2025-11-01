import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwtUtils.js';

function authMiddleware(req, res, next) {
  // Try to get token from Authorization header first (Bearer token)
  let token = null;
  const authHeader = req.headers['authorization'];

  if (authHeader) {
    token = authHeader.split(' ')[1];
  }

  // If no Authorization header, try to get token from httpOnly cookie
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  // If still no token found, return 401
  if (!token) {
    return res.status(401).json({ message: 'Authentication required - no token provided' });
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
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Optional auth middleware - doesn't fail if no token provided
function optionalAuthMiddleware(req, res, next) {
  // Try to get token from Authorization header first (Bearer token)
  let token = null;
  const authHeader = req.headers['authorization'];

  if (authHeader) {
    token = authHeader.split(' ')[1];
  }

  // If no Authorization header, try to get token from httpOnly cookie
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  // If no token found, continue without setting req.user
  if (!token) {
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
    console.warn('Invalid token in optional auth:', err.message);
  }

  next();
}

// Alias for compatibility
export const verifyToken = authMiddleware;

// Admin role check middleware
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

// Export both default and named
export default authMiddleware;
export { authMiddleware, optionalAuthMiddleware };

// Alternative export name for compatibility
export const authenticateToken = authMiddleware;
