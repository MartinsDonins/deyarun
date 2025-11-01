// Passport.js configuration for Google OAuth
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/mongodb/index.js';

// Check if Google OAuth is configured
const isGoogleOAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (isGoogleOAuthConfigured) {
  console.log('🔧 Configuring Google OAuth strategy');

  // Simple production-only callback URL configuration
  const getGoogleCallbackURL = () => {
    // If explicitly set in env (for custom domains), use it
    if (process.env.GOOGLE_REDIRECT_URI) {
      console.log('📌 Using explicit GOOGLE_REDIRECT_URI from env');
      return process.env.GOOGLE_REDIRECT_URI;
    }

    // Always use production URL - no development mode
    const callbackUrl = 'https://api.deyarun.com/api/auth/google/callback';
    console.log('🔗 Using production callback URL:', callbackUrl);
    return callbackUrl;
  };

  const callbackURL = getGoogleCallbackURL();
  console.log('🔗 Google OAuth callback URL:', callbackURL);

  // Configure Google OAuth strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 Google OAuth Profile:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      // User exists with Google ID
      console.log('✅ Existing Google user found:', user.email);
      
      // Update last login and Google profile info if needed
      user.lastLoginAt = new Date();
      if (profile.photos?.[0]?.value && !user.profilePicture) {
        user.profilePicture = profile.photos[0].value;
      }
      await user.save();
      
      return done(null, user);
    }

    // Check if user exists with same email (link accounts)
    const emailUser = await User.findOne({ 
      email: profile.emails?.[0]?.value?.toLowerCase() 
    });

    if (emailUser) {
      // Link Google account to existing email account
      console.log('🔗 Linking Google account to existing email user:', emailUser.email);
      
      emailUser.googleId = profile.id;
      emailUser.lastLoginAt = new Date();
      emailUser.isEmailVerified = true; // Google accounts are verified
      
      if (profile.photos?.[0]?.value && !emailUser.profilePicture) {
        emailUser.profilePicture = profile.photos[0].value;
      }
      
      await emailUser.save();
      return done(null, emailUser);
    }

    // Create new user account
    console.log('🆕 Creating new Google user account');
    
    const newUser = await User.create({
      googleId: profile.id,
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
      lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
      email: profile.emails?.[0]?.value?.toLowerCase() || '',
      profilePicture: profile.photos?.[0]?.value,
      isEmailVerified: true, // Google accounts are verified
      authProvider: 'google',
      role: 'user',
      subscriptionType: 'free',
      theme: 'dark',
      notificationsEnabled: true,
      locationSharingEnabled: false,
      onboardingCompleted: false, // User needs to complete profile
      lastLoginAt: new Date(),
      
      // Default values for required fields
      gender: 'other',
      fitnessLevel: 'beginner',
      weeklyGoal: 3,
      runningExperience: 'beginner',
      preferredDistance: '5k',
      timezone: 'Europe/Riga',
      units: 'metric',
      
      // Training profile defaults
      hasRunningExperience: false,
      workoutsPerWeekCurrent: 0,
      workoutsPerWeekLastMonth: 0,
      strengthTrainingPerWeek: 0,
      coreTrainingPerWeek: 0,
      hasRunningShoes: false,
      hasHeartRateMonitor: false,
      monitorsHeartRate: false,
      hasExcessWeight: false,
      targetEventType: 'general_fitness',
      trainingIntensityPref: 'moderate',
      sleepHoursPerNight: 8,
      stressLevel: 3,
      nutritionQuality: 3
    });

    console.log('✅ New Google user created:', newUser.email);
    return done(null, newUser);

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return done(error, null);
  }
  }));
} else {
  console.log('⚠️ Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;