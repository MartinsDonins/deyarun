import express from 'express';
import { hybridAuthMiddleware } from '../middleware/cookieAuthMiddleware.js';

const router = express.Router();

/**
 * Debug endpoint to check cookies and headers
 */
router.get('/debug/cookies', (req, res) => {
  const authHeader = req.headers['authorization'];
  const cookies = req.cookies;
  const allHeaders = req.headers;

  res.json({
    success: true,
    debug: {
      hasCookies: !!req.cookies,
      cookieKeys: Object.keys(req.cookies || {}),
      authToken: req.cookies?.authToken ? 'PRESENT (hidden)' : 'MISSING',
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? 'Bearer ***' : 'MISSING',
      allCookies: cookies,
      headers: {
        cookie: req.headers.cookie,
        authorization: authHeader,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Debug endpoint to test cookie setting
 */
router.get('/debug/set-test-cookie', (req, res) => {
  res.cookie('testCookie', 'testValue', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.deyarun.com' : undefined,
    maxAge: 60000 // 1 minute
  });

  res.json({
    success: true,
    message: 'Test cookie set successfully',
    cookieConfig: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.deyarun.com' : undefined,
      maxAge: 60000
    }
  });
});

/**
 * CRITICAL TEST: Protected endpoint with hybrid auth middleware
 * This will test if the middleware actually works
 */
router.get('/debug/test-auth', hybridAuthMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '✅ HYBRID AUTH MIDDLEWARE WORKS!',
    user: {
      userId: req.user?.userId,
      email: req.user?.email,
      role: req.user?.role
    },
    authSource: req.cookies?.authToken ? 'cookie' : 'header',
    timestamp: new Date().toISOString()
  });
});

export default router;
