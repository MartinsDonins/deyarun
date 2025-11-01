// Google OAuth Authentication Routes
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Check if Google OAuth is configured
const isGoogleOAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (isGoogleOAuthConfigured) {
  console.log('✅ Google OAuth routes enabled');
} else {
  console.log('⚠️ Google OAuth routes disabled - missing configuration');
}

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', async (req, res, next) => {
  console.log('🚀 Initiating Google OAuth');
  
  // Check if Google OAuth is configured
  if (!isGoogleOAuthConfigured) {
    console.error('❌ Google OAuth not configured - missing environment variables');
    return res.status(500).json({
      success: false,
      error: 'Google OAuth not configured',
      message: 'Please contact administrator to enable Google login'
    });
  }

  try {
    // Import passport only when needed
    const { default: passport } = await import('../config/passport.js');
    
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account' // Always show account selection
    })(req, res, next);
  } catch (error) {
    console.error('❌ Error loading passport:', error);
    return res.status(500).json({
      success: false,
      error: 'Google OAuth configuration error',
      message: 'Please contact administrator'
    });
  }
});

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', async (req, res, next) => {
  console.log('📞 Google OAuth callback received');
  
  if (!isGoogleOAuthConfigured) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3002').replace(/\/$/, '');
    return res.redirect(`${frontendUrl}/auth/login?error=oauth_not_configured`);
  }

  try {
    // Import passport only when needed
    const { default: passport } = await import('../config/passport.js');
    
    passport.authenticate('google', { 
      session: false,
      failureRedirect: '/auth/login?error=google_auth_failed'
    }, async (err, user, info) => {
      try {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3002').replace(/\/$/, '');

      if (err) {
        console.error('❌ Google OAuth authentication error:', err);
        return res.redirect(`${frontendUrl}/auth/login?error=auth_error`);
      }

      if (!user) {
        console.error('❌ Google OAuth: No user returned');
        return res.redirect(`${frontendUrl}/auth/login?error=no_user`);
      }

      console.log('✅ Google OAuth successful for user:', user.email);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie for authentication
      // NO domain parameter - browser will use current domain automatically
      // This works for both deyarun.com and www.deyarun.com
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      console.log('🍪 Set httpOnly cookie for authentication');

      // Prepare user data (excluding sensitive info)
      const userData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
        avatarUrl: user.avatarUrl || user.profilePicture,
        googleId: user.googleId,
        isEmailVerified: user.isEmailVerified,
        theme: user.theme,
        subscriptionType: user.subscriptionType,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted
      };

      // Redirect to frontend with token and user data
      const redirectUrl = new URL(`${frontendUrl}/auth/google-callback`);
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('user', btoa(JSON.stringify(userData))); // Base64 encode user data
      
      console.log('🔄 Redirecting to frontend:', redirectUrl.toString());
      res.redirect(redirectUrl.toString());

      } catch (error) {
        console.error('❌ Error in Google OAuth callback:', error);
        res.redirect(`${frontendUrl}/auth/login?error=callback_error`);
      }
    })(req, res, next);
  } catch (error) {
    console.error('❌ Error loading passport for callback:', error);
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3002').replace(/\/$/, '');
    res.redirect(`${frontendUrl}/auth/login?error=passport_error`);
  }
});

// GET /api/auth/google/status - Check Google OAuth configuration status
router.get('/google/status', (req, res) => {
  const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  
  res.json({
    success: true,
    configured: isConfigured,
    clientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : null,
    message: isConfigured ? 'Google OAuth is configured' : 'Google OAuth requires configuration'
  });
});

export default router;