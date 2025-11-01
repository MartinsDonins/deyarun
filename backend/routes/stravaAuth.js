import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/mongodb/index.js';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import {
  stravaConfig,
  createStravaAuthUrl,
  exchangeCodeForToken,
  refreshStravaToken,
  deauthorizeStrava,
  stravaAPI
} from '../config/strava.js';

const router = express.Router();

// Helper function to update user's Strava data in MongoDB
const updateUserStravaData = async (userId, stravaData) => {
  try {
    const updateData = {
      'strava.accessToken': stravaData.access_token,
      'strava.refreshToken': stravaData.refresh_token,
      'strava.expiresAt': new Date(stravaData.expires_at * 1000),
      'strava.athleteId': stravaData.athlete?.id,
      'strava.connectedAt': new Date(),
      'strava.isConnected': true
    };

    // Add athlete info if available
    if (stravaData.athlete) {
      updateData['strava.athlete'] = {
        id: stravaData.athlete.id,
        username: stravaData.athlete.username,
        firstname: stravaData.athlete.firstname,
        lastname: stravaData.athlete.lastname,
        city: stravaData.athlete.city,
        state: stravaData.athlete.state,
        country: stravaData.athlete.country,
        sex: stravaData.athlete.sex,
        premium: stravaData.athlete.premium,
        summit: stravaData.athlete.summit,
        profile: stravaData.athlete.profile,
        profile_medium: stravaData.athlete.profile_medium
      };
    }

    const result = await User.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }

    console.log(`✅ Updated Strava data for user ${userId}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to update user Strava data:', error);
    throw error;
  }
};

// Helper function to get user's Strava data
const getUserStravaData = async (userId) => {
  try {
    const user = await User.findById(userId).select('strava');
    return user?.strava || null;
  } catch (error) {
    console.error('❌ Failed to get user Strava data:', error);
    throw error;
  }
};

// Check if Strava is configured middleware
const checkStravaConfig = (req, res, next) => {
  // For demo purposes, allow access even if not configured
  if (!stravaConfig.isConfigured) {
    console.log('⚠️ Strava API not configured - running in demo mode');
    req.isStravaDemo = true;
  }
  next();
};

// GET /api/strava/auth - Start Strava OAuth flow
router.get('/auth', authMiddleware, checkStravaConfig, async (req, res) => {
  try {
    // Demo mode - simulate successful connection
    if (req.isStravaDemo) {
      console.log('🔧 Strava demo mode - simulating auth flow');
      
      // Simulate mock connection after 2 seconds
      setTimeout(async () => {
        try {
          await updateUserStravaData(req.user.userId, {
            access_token: 'demo_access_token_' + Date.now(),
            refresh_token: 'demo_refresh_token_' + Date.now(),
            expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours
            athlete: {
              id: 12345678,
              username: 'demo_runner',
              firstname: 'Demo',
              lastname: 'Runner',
              city: 'Riga',
              state: 'Latvia',
              country: 'Latvia',
              sex: 'M',
              premium: false,
              summit: false,
              profile: 'https://via.placeholder.com/124x124.png?text=Demo',
              profile_medium: 'https://via.placeholder.com/62x62.png?text=Demo'
            }
          });
          console.log('✅ Demo Strava connection simulated for user', req.user.userId);
        } catch (error) {
          console.error('❌ Error creating demo Strava connection:', error);
        }
      }, 2000);
      
      // Return demo auth URL that redirects to success
      const demoAuthUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?strava_connected=demo`;
      
      return res.json({
        success: true,
        authUrl: demoAuthUrl,
        message: 'Demo mode: Strava connection will be simulated',
        demo: true
      });
    }

    // Real Strava mode
    const state = jwt.sign(
      { userId: req.user.userId, timestamp: Date.now() },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '10m' }
    );

    const authUrl = createStravaAuthUrl(state);

    res.json({
      success: true,
      authUrl,
      message: 'Visit the provided URL to authorize Strava access'
    });
  } catch (error) {
    console.error('❌ Failed to create Strava auth URL:', error);
    res.status(500).json({
      error: 'Failed to initiate Strava authentication',
      message: error.message
    });
  }
});

// GET /api/strava/callback - Handle Strava OAuth callback
router.get('/callback', checkStravaConfig, async (req, res) => {
  try {
    const { code, state, error: stravaError, error_description } = req.query;

    // Check for Strava OAuth errors
    if (stravaError) {
      console.error('❌ Strava OAuth error:', stravaError, error_description);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?strava_error=${encodeURIComponent(stravaError)}`);
    }

    if (!code || !state) {
      return res.status(400).json({
        error: 'Invalid callback',
        message: 'Missing authorization code or state parameter'
      });
    }

    // Verify and decode state
    let decodedState;
    try {
      decodedState = jwt.verify(state, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      console.error('❌ Invalid state parameter:', error);
      return res.status(400).json({
        error: 'Invalid state parameter',
        message: 'Security validation failed'
      });
    }

    const userId = decodedState.userId;

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);
    
    // Update user's Strava data
    await updateUserStravaData(userId, tokenData);

    // Redirect to frontend with success
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?strava_connected=true`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Strava callback error:', error);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?strava_error=${encodeURIComponent('connection_failed')}`;
    res.redirect(redirectUrl);
  }
});

// GET /api/strava/status - Check user's Strava connection status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const stravaData = await getUserStravaData(req.user.userId);
    
    if (!stravaData || !stravaData.isConnected) {
      return res.json({
        connected: false,
        configured: stravaConfig.isConfigured
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(stravaData.expiresAt);
    const isExpired = now >= expiresAt;

    res.json({
      connected: true,
      configured: stravaConfig.isConfigured,
      expired: isExpired,
      athleteId: stravaData.athleteId,
      athlete: stravaData.athlete,
      connectedAt: stravaData.connectedAt
    });
  } catch (error) {
    console.error('❌ Failed to get Strava status:', error);
    res.status(500).json({
      error: 'Failed to get Strava status',
      message: error.message
    });
  }
});

// POST /api/strava/oauth/token - Exchange authorization code for tokens (for mobile app)
router.post('/oauth/token', authMiddleware, checkStravaConfig, [
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('redirect_uri').notEmpty().withMessage('Redirect URI is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array()
      });
    }

    const { code, redirect_uri } = req.body;

    console.log('🔄 Mobile app requesting token exchange for user:', req.user.userId);
    console.log('📱 Redirect URI:', redirect_uri);

    // Exchange authorization code for tokens using our Strava config
    const tokenData = await exchangeCodeForToken(code, redirect_uri);
    
    if (!tokenData) {
      console.error('❌ Failed to exchange code for token');
      return res.status(400).json({
        error: 'Failed to exchange authorization code for access token',
        message: 'The authorization code may be invalid or expired'
      });
    }

    console.log('✅ Successfully exchanged code for tokens');

    // Update user's Strava data in database
    await updateUserStravaData(req.user.userId, tokenData);

    // Return only the token data (not sensitive info)
    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      scope: tokenData.scope,
      athlete: tokenData.athlete
    });

  } catch (error) {
    console.error('❌ Error in Strava OAuth token exchange:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process Strava authorization'
    });
  }
});

// POST /api/strava/disconnect - Disconnect Strava account
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    console.log('🔌 Disconnecting Strava for user:', req.user.userId);
    console.log('🔍 Request user object:', JSON.stringify(req.user, null, 2));
    console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
    
    const stravaData = await getUserStravaData(req.user.userId);
    
    if (!stravaData || !stravaData.isConnected) {
      console.log('ℹ️ Strava already disconnected for user:', req.user.userId);
      return res.json({
        success: true,
        message: 'Strava account already disconnected'
      });
    }

    // Try to deauthorize on Strava side if we have an access token and Strava is configured
    if (stravaData.accessToken && stravaConfig.isConfigured) {
      try {
        console.log('🔄 Deauthorizing Strava application...');
        await deauthorizeStrava(stravaData.accessToken);
        console.log('✅ Deauthorized Strava application');
      } catch (error) {
        console.warn('⚠️ Failed to deauthorize on Strava side:', error.message);
        // Continue with local disconnection even if Strava deauth fails
      }
    } else if (!stravaConfig.isConfigured) {
      console.log('ℹ️ Strava not configured - skipping remote deauthorization');
    }

    // Remove Strava data from user document
    console.log('🗑️ Removing local Strava data...');
    await User.updateOne(
      { _id: req.user.userId },
      { $unset: { strava: "" } }
    );

    console.log('✅ Strava disconnected successfully for user:', req.user.userId);
    res.json({
      success: true,
      message: 'Strava account disconnected successfully'
    });
  } catch (error) {
    console.error('❌ Failed to disconnect Strava:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a validation error or similar
    if (error.name === 'ValidationError' || error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: error.message,
        details: error.details || 'Invalid request data'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Strava account',
      message: error.message
    });
  }
});

// POST /api/strava/refresh-token - Manually refresh Strava token
router.post('/refresh-token', authMiddleware, checkStravaConfig, async (req, res) => {
  try {
    const stravaData = await getUserStravaData(req.user.userId);
    
    if (!stravaData || !stravaData.isConnected) {
      return res.status(400).json({
        error: 'Strava not connected',
        message: 'No Strava account connected to refresh'
      });
    }

    if (!stravaData.refreshToken) {
      return res.status(400).json({
        error: 'No refresh token',
        message: 'Cannot refresh token - please reconnect your Strava account'
      });
    }

    // Refresh the token
    const newTokenData = await refreshStravaToken(stravaData.refreshToken);
    
    // Update user's Strava data with new tokens
    await updateUserStravaData(req.user.userId, newTokenData);

    res.json({
      success: true,
      message: 'Strava token refreshed successfully',
      expiresAt: new Date(newTokenData.expires_at * 1000)
    });
  } catch (error) {
    console.error('❌ Failed to refresh Strava token:', error);
    
    // If refresh fails, the user likely needs to reconnect
    if (error.response?.status === 400) {
      // Remove invalid Strava data
      try {
        await User.updateOne(
          { _id: req.user.userId },
          { $unset: { strava: "" } }
        );
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup invalid Strava data:', cleanupError);
      }
      
      return res.status(400).json({
        error: 'Token refresh failed',
        message: 'Please reconnect your Strava account',
        reconnect_required: true
      });
    }

    res.status(500).json({
      error: 'Failed to refresh Strava token',
      message: error.message
    });
  }
});

// POST /api/strava/oauth/refresh - Refresh Strava token (for mobile app)
router.post('/oauth/refresh', authMiddleware, checkStravaConfig, [
  body('refresh_token').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array()
      });
    }

    const { refresh_token } = req.body;

    console.log('🔄 Mobile app requesting token refresh for user:', req.user.userId);

    // Refresh the token using backend service
    const newTokenData = await refreshStravaToken(refresh_token);
    
    if (!newTokenData) {
      console.error('❌ Failed to refresh Strava token');
      return res.status(400).json({
        error: 'Failed to refresh Strava token',
        message: 'The refresh token may be invalid or expired'
      });
    }

    console.log('✅ Successfully refreshed Strava token');

    // Update user's Strava data in database
    await updateUserStravaData(req.user.userId, newTokenData);

    // Return only the token data
    res.json({
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token,
      expires_at: newTokenData.expires_at,
      scope: newTokenData.scope
    });

  } catch (error) {
    console.error('❌ Error in Strava token refresh:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh Strava token'
    });
  }
});

// Helper function to ensure valid Strava token
export const ensureValidStravaToken = async (userId) => {
  try {
    const stravaData = await getUserStravaData(userId);
    
    if (!stravaData || !stravaData.isConnected) {
      throw new Error('Strava not connected');
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(stravaData.expiresAt);
    
    if (now >= expiresAt) {
      console.log('🔄 Strava token expired, refreshing...');
      
      if (!stravaData.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Refresh the token
      const newTokenData = await refreshStravaToken(stravaData.refreshToken);
      
      // Update user's Strava data
      await updateUserStravaData(userId, newTokenData);
      
      return newTokenData.access_token;
    }

    return stravaData.accessToken;
  } catch (error) {
    console.error('❌ Failed to ensure valid Strava token:', error);
    throw error;
  }
};

export default router;