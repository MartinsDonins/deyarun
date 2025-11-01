// Simplified Security Middleware
// Basic but effective security measures without complex regex

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';

const securityConfig = {
  maxRequestSize: '10mb',
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  maxRequestsPerWindow: 100,
  maxLoginAttempts: 15, // Increased from 5 to 15 for better user experience
  lockoutDuration: 15 * 60 * 1000 // Reduced from 30 to 15 minutes
};

const threatDetection = {
  blockedIPs: new Map(),
  failedLogins: new Map()
};

let securityStats = {
  requests: 0,
  blocked: 0,
  rateLimited: 0,
  validationErrors: 0,
  lastResetAt: new Date().toISOString()
};

/**
 * Enhanced Helmet configuration
 */
export function enhancedHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      },
      reportOnly: process.env.NODE_ENV === 'development'
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
}

/**
 * Adaptive rate limiting
 */
export function adaptiveRateLimit() {
  return rateLimit({
    windowMs: securityConfig.rateLimitWindow,
    max: (req) => {
      if (req.user?.role === 'admin') return 200;
      if (req.user) return 150;
      if (req.path.includes('/auth/')) return 50; // Increased from 10 to 50 for login attempts
      return securityConfig.maxRequestsPerWindow;
    },
    message: {
      error: 'Too many requests from this IP',
      retryAfter: Math.ceil(securityConfig.rateLimitWindow / 1000)
    },
    keyGenerator: (req) => {
      return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    },
    handler: (req, res) => {
      securityStats.rateLimited++;
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(securityConfig.rateLimitWindow / 1000)
      });
    },
    skip: (req) => req.path === '/health' || req.path === '/api/health',
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * Basic threat detection
 */
export function threatDetectionMiddleware() {
  return (req, res, next) => {
    const clientIP = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    
    if (threatDetection.blockedIPs.has(clientIP)) {
      const blockInfo = threatDetection.blockedIPs.get(clientIP);
      if (Date.now() < blockInfo.blockedUntil) {
        securityStats.blocked++;
        return res.status(403).json({
          success: false,
          error: 'Access temporarily blocked'
        });
      } else {
        threatDetection.blockedIPs.delete(clientIP);
      }
    }
    
    securityStats.requests++;
    next();
  };
}

/**
 * Basic input validation
 */
export const inputValidation = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 }),
  
  password: body('password')
    .isLength({ min: 8, max: 128 }),
  
  name: (field) => body(field)
    .trim()
    .isLength({ min: 1, max: 100 })
    .isAlpha('en-US', { ignore: ' -\'' }),
  
  objectId: (field) => param(field)
    .isMongoId(),
  
  number: (field, min = 0, max = Number.MAX_SAFE_INTEGER) => body(field)
    .isNumeric()
    .isFloat({ min, max }),
  
  pagination: [
    query('page').optional().isInt({ min: 1, max: 1000 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]
};

/**
 * Validation error handler
 */
export function handleValidationErrors() {
  return (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      securityStats.validationErrors++;
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    next();
  };
}

/**
 * Basic XSS protection
 */
export function xssProtection() {
  return (req, res, next) => {
    const checkForXSS = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Basic XSS detection
          if (obj[key].includes('<script') || 
              obj[key].includes('javascript:') || 
              obj[key].includes('vbscript:')) {
            return true;
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkForXSS(obj[key])) return true;
        }
      }
      return false;
    };
    
    if (checkForXSS({ ...req.body, ...req.query, ...req.params })) {
      securityStats.validationErrors++;
      return res.status(400).json({
        success: false,
        error: 'Potentially malicious content detected'
      });
    }
    
    next();
  };
}

/**
 * Login attempt tracking
 */
export function loginAttemptTracker() {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (req.path.includes('/login') && res.statusCode >= 400) {
        const clientIP = req.ip || 'unknown';
        const attempts = threatDetection.failedLogins.get(clientIP) || { count: 0, lastAttempt: Date.now() };
        
        attempts.count++;
        attempts.lastAttempt = Date.now();
        threatDetection.failedLogins.set(clientIP, attempts);
        
        if (attempts.count >= securityConfig.maxLoginAttempts) {
          threatDetection.blockedIPs.set(clientIP, {
            reason: 'Too many failed login attempts',
            blockedUntil: Date.now() + securityConfig.lockoutDuration
          });
        }
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Request fingerprinting (simplified)
 */
export function requestFingerprinting() {
  return (req, res, next) => {
    req.fingerprint = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      timestamp: Date.now()
    };
    next();
  };
}

/**
 * Slow request detection (placeholder)
 */
export function slowRequestDetection() {
  return (req, res, next) => {
    // Simplified - just pass through
    next();
  };
}

/**
 * Basic SQL injection protection (placeholder)
 */
export function sqlInjectionProtection() {
  return (req, res, next) => {
    // Simplified - just pass through
    next();
  };
}

/**
 * Get security statistics
 */
export function getSecurityStats() {
  return {
    ...securityStats,
    threats: {
      blockedIPs: threatDetection.blockedIPs.size,
      failedLogins: threatDetection.failedLogins.size
    }
  };
}

export default {
  enhancedHelmet,
  adaptiveRateLimit,
  threatDetectionMiddleware,
  inputValidation,
  handleValidationErrors,
  xssProtection,
  loginAttemptTracker,
  requestFingerprinting,
  slowRequestDetection,
  sqlInjectionProtection,
  getSecurityStats
};