// Supabase Authentication Middleware for DeyaRun
import jwt from 'jsonwebtoken';
import supabaseAuthService from '../services/supabaseAuth.js';

// Enhanced auth middleware that supports both JWT and Supabase tokens
const supabaseAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Try to verify as Supabase token first
    try {
      const supabaseUser = await supabaseAuthService.verifyToken(token);
      
      if (supabaseUser) {
        req.user = { 
          id: supabaseUser.id,
          email: supabaseUser.email,
          supabaseUser: true
        };
        return next();
      }
    } catch (supabaseError) {
      console.log('Supabase token verification failed, trying JWT:', supabaseError.message);
    }

    // Fallback to JWT verification
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = { 
        id: decoded.id,
        email: decoded.email,
        supabaseUser: false
      };
      return next();
    } catch (jwtError) {
      console.log('JWT token verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export default supabaseAuthMiddleware;