// ✅ Supabase Authentication route - MongoDB Compatible
// Migrated to use MongoDB with Firebase Auth integration

import express from 'express';
import admin from 'firebase-admin';
import { User } from '../models/mongodb/index.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

console.log('✅ Supabase Authentication route enabled with MongoDB support');

// Firebase-based Supabase-compatible auth endpoint
router.post('/auth', async (req, res) => {
  try {
    const { idToken, userData } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUID = decodedToken.uid;

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUID });

    if (!user) {
      // Create new user with Firebase data
      user = new User({
        firebaseUID,
        email: decodedToken.email || userData?.email,
        firstName: userData?.firstName || decodedToken.name?.split(' ')[0] || 'User',
        lastName: userData?.lastName || decodedToken.name?.split(' ')[1] || '',
        isEmailVerified: decodedToken.email_verified || false,
        role: 'user',
        subscriptionType: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await user.save();
    } else {
      // Update existing user
      user.updatedAt = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, firebaseUID: user.firebaseUID },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firebaseUID: user.firebaseUID,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionType: user.subscriptionType
      }
    });

  } catch (error) {
    console.error('Supabase auth error:', error);
    res.status(400).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// User profile endpoint (Supabase compatible)
router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firebaseUID: user.firebaseUID,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionType: user.subscriptionType,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: error.message
    });
  }
});

// Registration endpoint for Supabase-compatible auth
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'email', 'password']
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'Lietotājs ar šo e-pastu jau eksistē'
      });
    }

    // Create new user in MongoDB
    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password, // Will be hashed by the model
      phone: userData.phone || null,
      birthDate: userData.birthDate ? new Date(userData.birthDate) : null,
      gender: userData.gender || null,
      weight: userData.weight || null,
      height: userData.height || null,
      
      // Running profile
      hasRunningExperience: userData.hasRunningExperience || false,
      runningExperience: userData.runningExperience || 'beginner',
      longestRunEver: userData.longestRunEver || null,
      longestRunLastMonth: userData.longestRunLastMonth || null,
      personalBest5k: userData.personalBest5k || null,
      personalBest10k: userData.personalBest10k || null,
      
      // Training
      workoutsPerWeekCurrent: userData.workoutsPerWeekCurrent || 2,
      workoutsPerWeekLastMonth: userData.workoutsPerWeekLastMonth || 0,
      strengthTrainingPerWeek: userData.strengthTrainingPerWeek || 0,
      coreTrainingPerWeek: userData.coreTrainingPerWeek || 0,
      otherActivities: userData.otherActivities || null,
      
      // Equipment
      hasRunningShoes: userData.hasRunningShoes || false,
      runningShoesBrand: userData.runningShoesBrand || null,
      runningShoesModel: userData.runningShoesModel || null,
      hasHeartRateMonitor: userData.hasHeartRateMonitor || false,
      monitorsHeartRate: userData.monitorsHeartRate || false,
      
      // Health
      medicalConditions: userData.medicalConditions || null,
      currentInjuries: userData.currentInjuries || null,
      currentPain: userData.currentPain || null,
      hasExcessWeight: userData.hasExcessWeight || false,
      
      // Goals
      preferredDistance: userData.preferredDistance || '5k',
      targetEventType: userData.targetEventType || 'general',
      targetEventDate: userData.targetEventDate ? new Date(userData.targetEventDate) : null,
      trainingIntensityPref: userData.trainingIntensityPref || 'moderate',
      
      // Lifestyle
      sleepHoursPerNight: userData.sleepHoursPerNight || 8,
      stressLevel: userData.stressLevel || 3,
      nutritionQuality: userData.nutritionQuality || 3,
      
      // Defaults
      units: userData.units || 'metric',
      timezone: userData.timezone || 'Europe/Riga',
      role: 'user',
      subscriptionType: 'free',
      isEmailVerified: false,
      isProfileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session data
    const sessionData = {
      access_token: token,
      refresh_token: token,
      expires_in: 604800, // 7 days
      token_type: 'bearer',
      user: {
        id: newUser._id,
        email: newUser.email,
        email_confirmed_at: null,
        phone: newUser.phone,
        created_at: newUser.createdAt,
        updated_at: newUser.updatedAt,
        last_sign_in_at: null,
        app_metadata: {
          provider: 'email',
          providers: ['email']
        },
        user_metadata: {
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      }
    };

    res.json({
      success: true,
      message: 'Registration successful',
      session: sessionData,
      profileData: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        birthDate: newUser.birthDate,
        gender: newUser.gender,
        weight: newUser.weight,
        height: newUser.height,
        role: newUser.role,
        subscriptionType: newUser.subscriptionType,
        isEmailVerified: newUser.isEmailVerified,
        isProfileComplete: newUser.isProfileComplete,
        hasRunningExperience: newUser.hasRunningExperience,
        runningExperience: newUser.runningExperience,
        preferredDistance: newUser.preferredDistance,
        trainingIntensityPref: newUser.trainingIntensityPref,
        units: newUser.units,
        timezone: newUser.timezone,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message || 'Reģistrācijas laikā radās kļūda'
    });
  }
});

// Login endpoint for Supabase-compatible auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'E-pasts un parole ir obligāti'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Nepareizs e-pasts vai parole'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Nepareizs e-pasts vai parole'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session data
    const sessionData = {
      access_token: token,
      refresh_token: token,
      expires_in: 604800, // 7 days
      token_type: 'bearer',
      user: {
        id: user._id,
        email: user.email,
        email_confirmed_at: user.isEmailVerified ? user.createdAt : null,
        phone: user.phone,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_sign_in_at: user.lastLoginAt,
        app_metadata: {
          provider: 'email',
          providers: ['email']
        },
        user_metadata: {
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    };

    res.json({
      success: true,
      message: 'Login successful',
      session: sessionData,
      profileData: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        birthDate: user.birthDate,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        role: user.role,
        subscriptionType: user.subscriptionType,
        isEmailVerified: user.isEmailVerified,
        isProfileComplete: user.isProfileComplete,
        hasRunningExperience: user.hasRunningExperience,
        runningExperience: user.runningExperience,
        preferredDistance: user.preferredDistance,
        trainingIntensityPref: user.trainingIntensityPref,
        units: user.units,
        timezone: user.timezone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message || 'Pieslēgšanās laikā radās kļūda'
    });
  }
});

export default router;