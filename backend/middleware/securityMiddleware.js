// Advanced Security Middleware
// Implements comprehensive security measures, input validation, and threat detection

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

// Security configuration
const securityConfig = {
  maxRequestSize: '10mb',
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  maxRequestsPerWindow: 100,
  slowRequestThreshold: 5000, // 5 seconds
  suspiciousRequestThreshold: 10,
  blockDuration: 60 * 60 * 1000, // 1 hour
  csrfTokenLength: 32,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 30 * 60 * 1000 // 30 minutes
};

// Threat detection storage (in production, use Redis)
const threatDetection = {
  suspiciousIPs: new Map(),
  blockedIPs: new Map(),
  failedLogins: new Map(),
  slowRequests: new Map()
};

// Security statistics
let securityStats = {
  requests: 0,
  blocked: 0,
  rateLimited: 0,
  validationErrors: 0,
  suspiciousActivity: 0,
  securityViolations: 0,
  lastResetAt: new Date().toISOString()
};

/**
 * Enhanced Helmet configuration for maximum security
 */
export function enhancedHelmet() {
  return helmet({
    // Content Security Policy
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
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
      reportOnly: process.env.NODE_ENV === 'development'
    },
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    
    // Permissions Policy
    permissionsPolicy: {
      features: {
        geolocation: ['self'],
        camera: ['none'],
        microphone: ['none'],
        payment: ['none'],
        usb: ['none']
      }
    },
    
    // Cross Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
    
    // Cross Origin Resource Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  });
}

/**
 * Advanced rate limiting with adaptive thresholds
 */
export function adaptiveRateLimit() {
  return rateLimit({
    windowMs: securityConfig.rateLimitWindow,
    max: (req) => {
      // Different limits based on authentication and endpoint
      if (req.user?.role === 'admin') return 200; // Higher limit for admins
      if (req.user) return 150; // Higher limit for authenticated users
      if (req.path.includes('/auth/')) return 10; // Strict limit for auth endpoints
      return securityConfig.maxRequestsPerWindow;
    },
    
    message: {
      error: 'Too many requests from this IP',
      retryAfter: Math.ceil(securityConfig.rateLimitWindow / 1000),
      code: 'RATE_LIMIT_EXCEEDED'
    },
    
    // Custom key generator to handle proxy scenarios
    keyGenerator: (req) => {
      return req.ip || 
             req.headers['x-forwarded-for']?.split(',')[0] || 
             req.connection.remoteAddress || 
             'unknown';
    },
    
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      securityStats.rateLimited++;
      logSecurityEvent('RATE_LIMIT_EXCEEDED', req);
      
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(securityConfig.rateLimitWindow / 1000)
      });
    },
    
    // Skip rate limiting for health checks
    skip: (req) => {
      return req.path === '/health' || req.path === '/api/health';
    },
    
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * IP-based threat detection and blocking
 */
export function threatDetectionMiddleware() {
  return (req, res, next) => {
    const clientIP = getClientIP(req);
    const now = Date.now();
    
    // Check if IP is blocked
    if (threatDetection.blockedIPs.has(clientIP)) {
      const blockInfo = threatDetection.blockedIPs.get(clientIP);
      if (now < blockInfo.blockedUntil) {
        securityStats.blocked++;
        return res.status(403).json({
          success: false,
          error: 'Access temporarily blocked',
          reason: blockInfo.reason,
          unblockAt: new Date(blockInfo.blockedUntil).toISOString()
        });
      } else {
        // Remove expired block
        threatDetection.blockedIPs.delete(clientIP);
      }
    }
    
    // Monitor for suspicious activity
    const suspicious = threatDetection.suspiciousIPs.get(clientIP) || { count: 0, lastSeen: now };
    suspicious.count++;
    suspicious.lastSeen = now;
    threatDetection.suspiciousIPs.set(clientIP, suspicious);
    
    // Block if too many suspicious requests
    if (suspicious.count > securityConfig.suspiciousRequestThreshold) {
      threatDetection.blockedIPs.set(clientIP, {
        reason: 'Suspicious activity detected',
        blockedAt: now,
        blockedUntil: now + securityConfig.blockDuration,
        requestCount: suspicious.count
      });
      
      logSecurityEvent('IP_BLOCKED_SUSPICIOUS_ACTIVITY', req, {
        requestCount: suspicious.count,
        duration: securityConfig.blockDuration
      });
      
      securityStats.suspiciousActivity++;
      return res.status(403).json({
        success: false,
        error: 'Access blocked due to suspicious activity'
      });
    }
    
    next();
  };
}

/**
 * Advanced input validation and sanitization
 */
export const inputValidation = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Valid email address is required'),
  
  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'),
  
  // Name validation
  name: (field) => body(field)
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(`${field} must contain only letters, spaces, hyphens, and apostrophes`),
  
  // MongoDB ObjectId validation
  objectId: (field) => param(field)
    .isMongoId()
    .withMessage(`${field} must be a valid ObjectId`),
  
  // Numeric validation
  number: (field, min = 0, max = Number.MAX_SAFE_INTEGER) => body(field)
    .isNumeric()
    .isFloat({ min, max })
    .withMessage(`${field} must be a number between ${min} and ${max}`),
  
  // Date validation
  date: (field) => body(field)
    .isISO8601()
    .toDate()
    .withMessage(`${field} must be a valid ISO date`),
  
  // Enum validation
  enum: (field, allowedValues) => body(field)
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`),
  
  // File upload validation
  file: {
    image: (field, maxSize = 5 * 1024 * 1024) => body(field)
      .custom((value, { req }) => {
        if (!req.file) return true; // Optional file
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Only JPEG, PNG and GIF images are allowed');
        }
        
        if (req.file.size > maxSize) {
          throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        }
        
        return true;
      })
  },
  
  // Query parameter validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be a number between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a number between 1 and 100')
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
      
      logSecurityEvent('VALIDATION_ERROR', req, {
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  };
}

/**
 * SQL injection and XSS protection
 */
export function sqlInjectionProtection() {
  const dangerousPatterns = [
    /('|(\\')|(;)|(\\)|(%27)|(-)|(#)|(%23))/i,
    /((\%3D)|(=))[^\\n]*(\%27|\')|(=)[^\\n]*\'/i,
    /w*((\%27)|(\\'))(\%6F|\s|(\%20))?((\%4F)|o|(\%6F))(((\%20)|\\s)?\%2A|\*)/i,
    /((\%27)|(\\'))union/i,
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];
  
  return (req, res, next) => {
    const checkValue = (obj, path = '') => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'string') {
          for (const pattern of dangerousPatterns) {
            if (pattern.test(value)) {
              securityStats.securityViolations++;
              logSecurityEvent('INJECTION_ATTEMPT', req, {
                field: currentPath,
                value: value,
                pattern: pattern.toString()
              });
              
              return res.status(400).json({
                success: false,
                error: 'Invalid input detected',
                code: 'SECURITY_VIOLATION'
              });
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          const result = checkValue(value, currentPath);
          if (result) return result;
        }
      }
      return null;
    };
    
    // Check request body, query, and params
    const result = checkValue({ ...req.body, ...req.query, ...req.params });
    if (result) return result;
    
    next();
  };
}

/**
 * Request fingerprinting for anomaly detection
 */
export function requestFingerprinting() {
  return (req, res, next) => {
    const fingerprint = {
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || '',
      acceptLanguage: req.headers['accept-language'] || '',
      acceptEncoding: req.headers['accept-encoding'] || '',
      timestamp: Date.now()
    };
    
    // Generate fingerprint hash
    const fingerprintString = JSON.stringify(fingerprint);
    const hash = crypto.createHash('sha256').update(fingerprintString).digest('hex');
    
    req.fingerprint = {
      hash,
      ...fingerprint
    };
    
    next();
  };
}

/**
 * Slow request detection and logging
 */
export function slowRequestDetection() {
  return (req, res, next) => {
    const startTime = performance.now();
    
    res.on('finish', () => {
      const duration = performance.now() - startTime;
      
      if (duration > securityConfig.slowRequestThreshold) {
        const clientIP = getClientIP(req);
        const slowRequests = threatDetection.slowRequests.get(clientIP) || 0;
        threatDetection.slowRequests.set(clientIP, slowRequests + 1);
        
        logSecurityEvent('SLOW_REQUEST', req, {
          duration,
          endpoint: req.path,
          method: req.method
        });
        
        // Add to suspicious activity if too many slow requests
        if (slowRequests > 5) {
          const suspicious = threatDetection.suspiciousIPs.get(clientIP) || { count: 0, lastSeen: Date.now() };
          suspicious.count += 2; // Weight slow requests more heavily
          threatDetection.suspiciousIPs.set(clientIP, suspicious);
        }
      }
    });
    
    next();
  };
}

/**
 * Enhanced login attempt tracking
 */
export function loginAttemptTracker() {
  return (req, res, next) => {
    // Only track failed login attempts
    const originalJson = res.json;
    
    res.json = function(data) {
      if (req.path.includes('/login') && res.statusCode >= 400) {
        const clientIP = getClientIP(req);
        const email = req.body.email || '';
        
        // Track by IP
        const ipAttempts = threatDetection.failedLogins.get(clientIP) || { count: 0, lastAttempt: Date.now() };
        ipAttempts.count++;
        ipAttempts.lastAttempt = Date.now();
        threatDetection.failedLogins.set(clientIP, ipAttempts);
        
        // Block if too many attempts
        if (ipAttempts.count >= securityConfig.maxLoginAttempts) {
          threatDetection.blockedIPs.set(clientIP, {
            reason: 'Too many failed login attempts',
            blockedAt: Date.now(),
            blockedUntil: Date.now() + securityConfig.lockoutDuration,
            failedAttempts: ipAttempts.count
          });
          
          logSecurityEvent('LOGIN_BLOCKED', req, {
            failedAttempts: ipAttempts.count,
            email: email
          });
        } else {
          logSecurityEvent('LOGIN_FAILED', req, {
            attemptNumber: ipAttempts.count,
            email: email
          });
        }
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Get client IP address through proxies
 */
function getClientIP(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Security event logging
 */
function logSecurityEvent(eventType, req, additionalData = {}) {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    fingerprint: req.fingerprint?.hash,
    user: req.user?.id || null,
    ...additionalData
  };
  
  // In production, send to SIEM/logging service
  console.warn(`🚨 Security Event [${eventType}]:`, JSON.stringify(event, null, 2));
  
  // Could integrate with services like:
  // - Sentry for error tracking
  // - DataDog for monitoring
  // - AWS CloudWatch for logging
  // - Elasticsearch for SIEM
}

/**
 * Security statistics endpoint
 */
export function getSecurityStats() {
  return {
    ...securityStats,
    threats: {
      suspiciousIPs: threatDetection.suspiciousIPs.size,
      blockedIPs: threatDetection.blockedIPs.size,
      failedLogins: threatDetection.failedLogins.size,
      slowRequests: threatDetection.slowRequests.size
    },
    uptime: Date.now() - new Date(securityStats.lastResetAt).getTime()
  };
}

/**
 * Cleanup expired security data
 */
export function cleanupSecurityData() {
  const now = Date.now();
  const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  // Clean up expired blocks
  for (const [ip, blockInfo] of threatDetection.blockedIPs.entries()) {
    if (now > blockInfo.blockedUntil) {
      threatDetection.blockedIPs.delete(ip);
    }
  }
  
  // Clean up old suspicious activity
  for (const [ip, suspicious] of threatDetection.suspiciousIPs.entries()) {
    if (now - suspicious.lastSeen > cleanupThreshold) {
      threatDetection.suspiciousIPs.delete(ip);
    }
  }
  
  // Clean up old failed login attempts
  for (const [ip, attempts] of threatDetection.failedLogins.entries()) {
    if (now - attempts.lastAttempt > cleanupThreshold) {
      threatDetection.failedLogins.delete(ip);
    }
  }
  
  console.log('🧹 Security data cleanup completed');
}

// Schedule periodic cleanup
setInterval(cleanupSecurityData, 60 * 60 * 1000); // Every hour

export default {
  enhancedHelmet,
  adaptiveRateLimit,
  threatDetectionMiddleware,
  inputValidation,
  handleValidationErrors,
  sqlInjectionProtection,
  requestFingerprinting,
  slowRequestDetection,
  loginAttemptTracker,
  getSecurityStats,
  cleanupSecurityData
};