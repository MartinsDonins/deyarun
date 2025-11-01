// File: backend/routes/auth.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/mongodb/index.js';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { hybridAuthMiddleware } from '../middleware/cookieAuthMiddleware.js';
import emailService from '../services/emailService.js';
import { getJwtSecret } from '../utils/jwtUtils.js';

const router = Router();

// Enhanced registration for running app with comprehensive user profile
router.post('/register', async (req, res) => {
  const { 
    firstName, 
    lastName, 
    email, 
    password, 
    phone,
    birthDate, 
    gender, 
    weight, 
    height,
    fitnessLevel,
    weeklyGoal,
    preferredPace,
    runningExperience,
    injuryHistory,
    preferredDistance,
    timezone,
    units, // metric or imperial
    
    // Extended training profile fields from trenins.md
    hasRunningExperience,
    longestRunEver,
    longestRunLastMonth,
    personalBest5k,
    personalBest10k,
    workoutsPerWeekCurrent,
    workoutsPerWeekLastMonth,
    strengthTrainingPerWeek,
    coreTrainingPerWeek,
    otherActivities,
    hasRunningShoes,
    runningShoesBrand,
    runningShoesModel,
    hasHeartRateMonitor,
    monitorsHeartRate,
    medicalConditions,
    currentInjuries,
    currentPain,
    hasExcessWeight,
    targetEventType,
    targetEventDate,
    trainingIntensityPref,
    sleepHoursPerNight,
    stressLevel,
    nutritionQuality
  } = req.body;

  // Required field validation
  if (!firstName || !lastName || !email || !password || !birthDate || !gender) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      required: ['firstName', 'lastName', 'email', 'password', 'birthDate', 'gender']
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Password validation (min 8 chars, at least 1 letter and 1 number)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  console.log(`🔍 REGISTER DEBUG: Password validation for ${email}`);
  console.log(`🔍 REGISTER DEBUG: Password length: ${password.length}`);
  console.log(`🔍 REGISTER DEBUG: Password regex test: ${passwordRegex.test(password)}`);
  
  if (!passwordRegex.test(password)) {
    console.log(`❌ REGISTER FAILED: Invalid password format for ${email}`);
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters with at least 1 letter and 1 number' 
    });
  }

  try {
    // Check if user already exists in MongoDB
    const existing = await User.findByEmail(email.toLowerCase());
    if (existing) {
      console.log(`❌ REGISTER FAILED: User already exists: ${email}`);
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // IMPORTANT: Don't manually hash password - let model middleware handle it
    console.log(`🔍 REGISTER DEBUG: Setting plain password for model middleware to hash`);

    // Calculate age from birthDate
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();

    // Create user with comprehensive profile in MongoDB
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: password, // Plain password - model middleware will hash it
      phone: phone || null,
      birthDate: birthDateObj,
      age,
      gender,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      fitnessLevel: fitnessLevel || 'beginner', // beginner, intermediate, advanced
      weeklyGoal: weeklyGoal ? parseInt(weeklyGoal) : 20, // km per week
      preferredPace: preferredPace ? parseFloat(preferredPace) : null, // min/km
      runningExperience: runningExperience || 'beginner', // never, beginner, recreational, competitive
      injuryHistory: injuryHistory || null,
      preferredDistance: preferredDistance || '5k', // 5k, 10k, half-marathon, marathon
      timezone: timezone || 'UTC',
      units: units || 'metric', // metric or imperial
      
      // Extended training profile fields
      hasRunningExperience: hasRunningExperience || false,
      longestRunEver: longestRunEver ? parseFloat(longestRunEver) : null,
      longestRunLastMonth: longestRunLastMonth ? parseFloat(longestRunLastMonth) : null,
      personalBest5k: personalBest5k ? parseInt(personalBest5k) : null, // in seconds
      personalBest10k: personalBest10k ? parseInt(personalBest10k) : null, // in seconds
      workoutsPerWeekCurrent: workoutsPerWeekCurrent ? parseInt(workoutsPerWeekCurrent) : 0,
      workoutsPerWeekLastMonth: workoutsPerWeekLastMonth ? parseInt(workoutsPerWeekLastMonth) : 0,
      strengthTrainingPerWeek: strengthTrainingPerWeek ? parseInt(strengthTrainingPerWeek) : 0,
      coreTrainingPerWeek: coreTrainingPerWeek ? parseInt(coreTrainingPerWeek) : 0,
      otherActivities: otherActivities || null,
      hasRunningShoes: hasRunningShoes || false,
      runningShoesBrand: runningShoesBrand || null,
      runningShoesModel: runningShoesModel || null,
      hasHeartRateMonitor: hasHeartRateMonitor || false,
      monitorsHeartRate: monitorsHeartRate || false,
      medicalConditions: medicalConditions || null,
      currentInjuries: currentInjuries || null,
      currentPain: currentPain || null,
      hasExcessWeight: hasExcessWeight || false,
      targetEventType: targetEventType || 'general',
      targetEventDate: targetEventDate ? new Date(targetEventDate) : null,
      trainingIntensityPref: trainingIntensityPref || 'moderate',
      sleepHoursPerNight: sleepHoursPerNight ? parseFloat(sleepHoursPerNight) : 8.0,
      stressLevel: stressLevel ? parseInt(stressLevel) : 3,
      nutritionQuality: nutritionQuality ? parseInt(nutritionQuality) : 3,
      
      isEmailVerified: false,
      isProfileComplete: !!(weight && height && fitnessLevel),
      theme: 'dark',
      notificationsEnabled: true,
      locationSharingEnabled: false
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    user.emailVerificationSentAt = new Date();
    
    await user.save();
    
    // Verify the saved user
    console.log(`✅ REGISTER SUCCESS: User created for ${user.email}`);
    console.log(`🔍 REGISTER DEBUG: Saved user has password: ${!!user.password}`);
    
    // Test that password was saved correctly
    const savedUser = await User.findById(user._id);
    console.log(`🔍 REGISTER DEBUG: Retrieved user has password: ${!!savedUser.password}`);
    if (savedUser.password) {
      const testVerify = await bcrypt.compare(password, savedUser.password);
      console.log(`🔍 REGISTER DEBUG: Password verify test: ${testVerify ? '✅ PASS' : '❌ FAIL'}`);
    }

    // Send email verification email instead of welcome email
    const verificationLink = `https://deyarun.com/auth/verify-email/${verificationToken}`;
    
    emailService.sendEmailVerificationEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      verificationLink: verificationLink
    }).catch(error => {
      console.error('Email verification failed:', error);
    });

    // For now, still generate JWT token (users can use app but with limited features)
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        isEmailVerified: false 
      }, 
      getJwtSecret(), 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (compatible with frontend)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.fullName,
      role: user.role,
      subscriptionType: user.subscriptionType,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      isProfileComplete: user.isProfileComplete,
      authProvider: 'email'
    };

    // Set httpOnly cookie for enhanced security
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // domain removed - uses current domain automatically
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/'
    });
    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Enhanced login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user by email in MongoDB
    console.log(`🔍 LOGIN DEBUG: Looking for user with email: ${email.toLowerCase()}`);
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log(`🔍 LOGIN DEBUG: User found:`, user ? `${user.firstName} ${user.lastName} (${user.email})` : 'NOT FOUND');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid email or password' 
      });
    }

    // Check if user has password (for email-based accounts)
    if (!user.password) {
      return res.status(401).json({ 
        success: false,
        msg: 'Please use social login (Google/Apple) for this account' 
      });
    }

    // Check password with detailed logging
    console.log(`🔍 LOGIN DEBUG: Password check for ${user.email}`);
    console.log(`🔍 LOGIN DEBUG: Has password hash: ${!!user.password}`);
    console.log(`🔍 LOGIN DEBUG: Password hash length: ${user.password ? user.password.length : 0}`);
    console.log(`🔍 LOGIN DEBUG: Input password length: ${password ? password.length : 0}`);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`🔍 LOGIN DEBUG: Password validation result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`❌ LOGIN FAILED: Invalid password for ${user.email}`);
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid email or password' 
      });
    }

    // Check if email is verified (only for email-based accounts)
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        success: false,
        msg: 'Please verify your email address before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    // Update login tracking
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      }, 
      getJwtSecret(), 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (compatible with frontend)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.fullName,
      role: user.role,
      subscriptionType: user.subscriptionType,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      isProfileComplete: user.isProfileComplete,
      authProvider: 'email'
    };

    // Set httpOnly cookie for enhanced security
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // domain removed - uses current domain automatically
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/'
    });
    res.json({ 
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', hybridAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data without password
    const userData = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      fitnessLevel: user.fitnessLevel,
      weeklyGoal: user.weeklyGoal,
      preferredPace: user.preferredPace,
      runningExperience: user.runningExperience,
      injuryHistory: user.injuryHistory,
      preferredDistance: user.preferredDistance,
      timezone: user.timezone,
      units: user.units,
      
      // Extended training profile fields
      hasRunningExperience: user.hasRunningExperience,
      longestRunEver: user.longestRunEver,
      longestRunLastMonth: user.longestRunLastMonth,
      personalBest5k: user.personalBest5k,
      personalBest10k: user.personalBest10k,
      workoutsPerWeekCurrent: user.workoutsPerWeekCurrent,
      workoutsPerWeekLastMonth: user.workoutsPerWeekLastMonth,
      strengthTrainingPerWeek: user.strengthTrainingPerWeek,
      coreTrainingPerWeek: user.coreTrainingPerWeek,
      otherActivities: user.otherActivities,
      hasRunningShoes: user.hasRunningShoes,
      runningShoesBrand: user.runningShoesBrand,
      runningShoesModel: user.runningShoesModel,
      hasHeartRateMonitor: user.hasHeartRateMonitor,
      monitorsHeartRate: user.monitorsHeartRate,
      medicalConditions: user.medicalConditions,
      currentInjuries: user.currentInjuries,
      currentPain: user.currentPain,
      hasExcessWeight: user.hasExcessWeight,
      targetEventType: user.targetEventType,
      targetEventDate: user.targetEventDate,
      trainingIntensityPref: user.trainingIntensityPref,
      sleepHoursPerNight: user.sleepHoursPerNight,
      stressLevel: user.stressLevel,
      nutritionQuality: user.nutritionQuality,
      
      isEmailVerified: user.isEmailVerified,
      isProfileComplete: user.isProfileComplete,
      theme: user.theme,
      notificationsEnabled: user.notificationsEnabled,
      locationSharingEnabled: user.locationSharingEnabled,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      
      // Role and subscription information - CRITICAL for frontend authorization
      role: user.role,
      subscriptionType: user.subscriptionType,
      permissions: user.permissions
    };

    res.json({ 
      success: true,
      user: userData 
    });

  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/me', hybridAuthMiddleware, async (req, res) => {
  const { 
    firstName, 
    lastName, 
    phone,
    weight, 
    height,
    fitnessLevel,
    weeklyGoal,
    preferredPace,
    runningExperience,
    injuryHistory,
    preferredDistance,
    timezone,
    units,
    theme,
    notificationsEnabled,
    locationSharingEnabled,
    avatarUrl,
    
    // Extended training profile fields
    hasRunningExperience,
    longestRunEver,
    longestRunLastMonth,
    personalBest5k,
    personalBest10k,
    workoutsPerWeekCurrent,
    workoutsPerWeekLastMonth,
    strengthTrainingPerWeek,
    coreTrainingPerWeek,
    otherActivities,
    hasRunningShoes,
    runningShoesBrand,
    runningShoesModel,
    hasHeartRateMonitor,
    monitorsHeartRate,
    medicalConditions,
    currentInjuries,
    currentPain,
    hasExcessWeight,
    targetEventType,
    targetEventDate,
    trainingIntensityPref,
    sleepHoursPerNight,
    stressLevel,
    nutritionQuality
  } = req.body;

  try {
    // Find user in MongoDB
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (weight) user.weight = parseFloat(weight);
    if (height) user.height = parseFloat(height);
    if (fitnessLevel) user.fitnessLevel = fitnessLevel;
    if (weeklyGoal) user.weeklyGoal = parseInt(weeklyGoal);
    if (preferredPace) user.preferredPace = parseFloat(preferredPace);
    if (runningExperience) user.runningExperience = runningExperience;
    if (injuryHistory !== undefined) user.injuryHistory = injuryHistory;
    if (preferredDistance) user.preferredDistance = preferredDistance;
    if (timezone) user.timezone = timezone;
    if (units) user.units = units;
    if (theme) user.theme = theme;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (locationSharingEnabled !== undefined) user.locationSharingEnabled = locationSharingEnabled;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    
    // Extended training profile fields
    if (hasRunningExperience !== undefined) user.hasRunningExperience = hasRunningExperience;
    if (longestRunEver) user.longestRunEver = parseFloat(longestRunEver);
    if (longestRunLastMonth) user.longestRunLastMonth = parseFloat(longestRunLastMonth);
    if (personalBest5k) user.personalBest5k = parseInt(personalBest5k);
    if (personalBest10k) user.personalBest10k = parseInt(personalBest10k);
    if (workoutsPerWeekCurrent) user.workoutsPerWeekCurrent = parseInt(workoutsPerWeekCurrent);
    if (workoutsPerWeekLastMonth) user.workoutsPerWeekLastMonth = parseInt(workoutsPerWeekLastMonth);
    if (strengthTrainingPerWeek) user.strengthTrainingPerWeek = parseInt(strengthTrainingPerWeek);
    if (coreTrainingPerWeek) user.coreTrainingPerWeek = parseInt(coreTrainingPerWeek);
    if (otherActivities !== undefined) user.otherActivities = otherActivities;
    if (hasRunningShoes !== undefined) user.hasRunningShoes = hasRunningShoes;
    if (runningShoesBrand !== undefined) user.runningShoesBrand = runningShoesBrand;
    if (runningShoesModel !== undefined) user.runningShoesModel = runningShoesModel;
    if (hasHeartRateMonitor !== undefined) user.hasHeartRateMonitor = hasHeartRateMonitor;
    if (monitorsHeartRate !== undefined) user.monitorsHeartRate = monitorsHeartRate;
    if (medicalConditions !== undefined) user.medicalConditions = medicalConditions;
    if (currentInjuries !== undefined) user.currentInjuries = currentInjuries;
    if (currentPain !== undefined) user.currentPain = currentPain;
    if (hasExcessWeight !== undefined) user.hasExcessWeight = hasExcessWeight;
    if (targetEventType) user.targetEventType = targetEventType;
    if (targetEventDate) user.targetEventDate = new Date(targetEventDate);
    if (trainingIntensityPref) user.trainingIntensityPref = trainingIntensityPref;
    if (sleepHoursPerNight) user.sleepHoursPerNight = parseFloat(sleepHoursPerNight);
    if (stressLevel) user.stressLevel = parseInt(stressLevel);
    if (nutritionQuality) user.nutritionQuality = parseInt(nutritionQuality);
    
    // Calculate if profile is complete
    user.isProfileComplete = !!(user.firstName && user.lastName && user.weight && user.height && user.fitnessLevel);
    user.updatedAt = new Date();

    // Save updated user
    await user.save();

    // Return user data (convert _id to id for frontend compatibility)
    const userData = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      fitnessLevel: user.fitnessLevel,
      weeklyGoal: user.weeklyGoal,
      preferredPace: user.preferredPace,
      runningExperience: user.runningExperience,
      injuryHistory: user.injuryHistory,
      preferredDistance: user.preferredDistance,
      timezone: user.timezone,
      units: user.units,
      
      // Extended training profile fields
      hasRunningExperience: user.hasRunningExperience,
      longestRunEver: user.longestRunEver,
      longestRunLastMonth: user.longestRunLastMonth,
      personalBest5k: user.personalBest5k,
      personalBest10k: user.personalBest10k,
      workoutsPerWeekCurrent: user.workoutsPerWeekCurrent,
      workoutsPerWeekLastMonth: user.workoutsPerWeekLastMonth,
      strengthTrainingPerWeek: user.strengthTrainingPerWeek,
      coreTrainingPerWeek: user.coreTrainingPerWeek,
      otherActivities: user.otherActivities,
      hasRunningShoes: user.hasRunningShoes,
      runningShoesBrand: user.runningShoesBrand,
      runningShoesModel: user.runningShoesModel,
      hasHeartRateMonitor: user.hasHeartRateMonitor,
      monitorsHeartRate: user.monitorsHeartRate,
      medicalConditions: user.medicalConditions,
      currentInjuries: user.currentInjuries,
      currentPain: user.currentPain,
      hasExcessWeight: user.hasExcessWeight,
      targetEventType: user.targetEventType,
      targetEventDate: user.targetEventDate,
      trainingIntensityPref: user.trainingIntensityPref,
      sleepHoursPerNight: user.sleepHoursPerNight,
      stressLevel: user.stressLevel,
      nutritionQuality: user.nutritionQuality,
      
      isEmailVerified: user.isEmailVerified,
      isProfileComplete: user.isProfileComplete,
      theme: user.theme,
      notificationsEnabled: user.notificationsEnabled,
      locationSharingEnabled: user.locationSharingEnabled,
      avatarUrl: user.avatarUrl,
      updatedAt: user.updatedAt
    };

    res.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: userData 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', hybridAuthMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  // Password validation
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      message: 'New password must be at least 8 characters with at least 1 letter and 1 number' 
    });
  }

  try {
    // Get current user from MongoDB
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (for social login accounts)
    if (!user.password) {
      return res.status(400).json({ message: 'Cannot change password for social login accounts' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Forgot password - send reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const user = await User.findByEmail(email.toLowerCase());

    // Always return success for security reasons (don't reveal if email exists)
    // But only actually send email if user exists
    if (user) {
      // Check if user has a password (for social login accounts)
      if (!user.password) {
        // Still return success but don't send email
        return res.json({ 
          success: true,
          message: 'If an account with that email exists, we have sent password reset instructions' 
        });
      }

      const token = jwt.sign(
        { userId: user._id.toString() },
        getJwtSecret(),
        { expiresIn: '1h' }
      );
      const resetLink = `https://deyarun.com/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      // Debug log for reset link (temporary)
      console.log(`🔑 PASSWORD RESET DEBUG: ${email} -> ${resetLink}`);

      try {
        console.log('🔍 Email Service Debug:', {
          isEnabled: emailService.isEnabled,
          hasApiKey: !!process.env.SENDGRID_API_KEY,
          apiKeyLength: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0,
          fromEmail: emailService.fromEmail,
          userEmail: user.email,
          resetLink: resetLink.substring(0, 50) + '...'
        });
        
        const emailResult = await emailService.sendPasswordResetEmail(user.email, {
          firstName: user.firstName,
          resetLink
        });
        
        console.log('📧 Email Send Result:', emailResult);
      } catch (err) {
        console.error('Failed to send password reset email:', err);
      }
    }

    const responseData = { 
      success: true,
      message: 'If an account with that email exists, we have sent password reset instructions' 
    };

    // Include debug info if debugging is enabled or for admin users
    if ((process.env.NODE_ENV !== 'production' || process.env.DEBUG_MODE === 'true') && user) {
      responseData.debugResetLink = resetLink;
      responseData.debugToken = token;
    }

    res.json(responseData);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Reset password (without authentication - for forgot password)
router.post('/reset-password', async (req, res) => {
  const { email, newPassword, resetToken } = req.body;

  if (!email || !newPassword || !resetToken) {
    return res.status(400).json({ message: 'Email, token and new password are required' });
  }

  // Password validation
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters with at least 1 letter and 1 number' 
    });
  }

  try {
    console.log(`🔍 RESET DEBUG: Resetting password for ${email}`);
    console.log(`🔍 RESET DEBUG: Token verification starting...`);
    
    const decoded = jwt.verify(resetToken, getJwtSecret());
    const user = await User.findById(decoded.userId);

    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      console.log(`❌ RESET FAILED: Invalid token or email mismatch for ${email}`);
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    console.log(`✅ RESET DEBUG: User found: ${user.email}`);

    // Check if user has a password (for social login accounts)
    if (!user.password) {
      console.log(`❌ RESET FAILED: No password for social login account: ${email}`);
      return res.status(400).json({ message: 'Cannot reset password for social login accounts' });
    }
    
    console.log(`🔍 RESET DEBUG: Original password hash length: ${user.password.length}`);
    console.log(`🔍 RESET DEBUG: New password length: ${newPassword.length}`);
    
    // IMPORTANT: Set the plain password, let the model middleware handle hashing
    // This prevents double-hashing (auth.js + model.js middleware)
    user.password = newPassword;
    user.updatedAt = new Date();
    
    console.log(`🔍 RESET DEBUG: Saving user with new password...`);
    await user.save();
    
    // Verify the saved password works
    const savedUser = await User.findById(user._id);
    const testVerify = await bcrypt.compare(newPassword, savedUser.password);
    console.log(`🔍 RESET DEBUG: Password verify test after save: ${testVerify ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔍 RESET DEBUG: New password hash length: ${savedUser.password.length}`);

    res.json({ 
      success: true,
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Delete account
router.delete('/account', hybridAuthMiddleware, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password confirmation required' });
  }

  try {
    // Get current user from MongoDB
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (for social login accounts)
    if (!user.password) {
      return res.status(400).json({ message: 'Cannot delete social login accounts with password verification' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Delete user account from MongoDB
    await User.findByIdAndDelete(req.user.userId);

    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// Get user statistics/dashboard data
router.get('/dashboard', hybridAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId, {
      firstName: 1,
      weeklyGoal: 1,
      fitnessLevel: 1,
      preferredDistance: 1
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // TODO: Add workout statistics when workout model is implemented
    const dashboardData = {
      user: {
        firstName: user.firstName,
        weeklyGoal: user.weeklyGoal,
        fitnessLevel: user.fitnessLevel,
        preferredDistance: user.preferredDistance
      },
      weeklyProgress: {
        currentWeek: 0, // TODO: Calculate from workouts
        goal: user.weeklyGoal || 20,
        percentage: 0
      },
      totalWorkouts: 0, // TODO: Count from workouts
      totalDistance: 0, // TODO: Sum from workouts
      personalBests: {
        longestRun: 0,
        fastestPace: null,
        totalRunTime: 0
      },
      recentActivity: [] // TODO: Get recent workouts
    };

    res.json({ 
      success: true,
      data: dashboardData 
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Firebase Authentication - Google/Apple Sign-In with MongoDB Integration
router.post('/firebase', async (req, res) => {
  const { idToken, provider } = req.body;

  if (!idToken || !provider) {
    return res.status(400).json({
      success: false,
      msg: 'Firebase ID token and provider are required'
    });
  }

  try {
    // Import dependencies
    const admin = await import('firebase-admin');
    const { UserMigrationService } = await import('../services/userMigrationService.js');
    
    // Verify Firebase ID token
    const decodedToken = await admin.default.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        msg: 'Email is required from Firebase provider'
      });
    }

    // Use MongoDB for user management
    const mongoUser = await UserMigrationService.findOrCreateFromFirebase(uid, {
      email,
      name,
      picture,
      email_verified
    });

    // Generate JWT token for our app
    const token = jwt.sign(
      { 
        userId: mongoUser._id.toString(),
        email: mongoUser.email,
        role: mongoUser.role
      },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update login tracking
    mongoUser.loginCount = (mongoUser.loginCount || 0) + 1;
    mongoUser.lastLoginAt = new Date();
    await mongoUser.save();

    // Return user data (compatible with existing frontend)
    const userData = {
      id: mongoUser._id.toString(),
      email: mongoUser.email,
      firstName: mongoUser.firstName,
      lastName: mongoUser.lastName,
      name: mongoUser.fullName,
      role: mongoUser.role,
      subscriptionType: mongoUser.subscriptionType,
      profilePicture: mongoUser.profilePicture,
      isEmailVerified: mongoUser.isEmailVerified,
      isProfileComplete: mongoUser.isProfileComplete,
      authProvider: provider
    };

    res.json({
      success: true,
      token,
      user: userData,
      msg: 'Firebase authentication successful'
    });

  } catch (error) {
    console.error('Firebase auth error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        msg: 'Firebase token expired. Please sign in again.'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        msg: 'Invalid Firebase token.'
      });
    }

    res.status(500).json({
      success: false,
      msg: 'Firebase authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Debug endpoint to check email service status
router.get('/email-status', async (req, res) => {
  try {
    const emailStats = await emailService.getEmailStats();
    
    res.json({
      success: true,
      emailService: {
        ...emailStats,
        hasApiKey: !!process.env.SENDGRID_API_KEY,
        apiKeyLength: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0,
        apiKeyPrefix: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 8) + '...' : 'none'
      }
    });
  } catch (error) {
    console.error('Email status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Complete onboarding for mobile users
router.post('/complete-onboarding', hybridAuthMiddleware, async (req, res) => {
  try {
    const { userId, onboardingData } = req.body;
    
    // Verify that the authenticated user matches the userId
    if (req.user.userId !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Cannot update another user\'s onboarding data' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update user with onboarding data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...onboardingData,
        isProfileComplete: true,
        onboardingCompleted: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Return updated user data
    const userData = {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      name: updatedUser.fullName,
      role: updatedUser.role,
      subscriptionType: updatedUser.subscriptionType,
      profilePicture: updatedUser.profilePicture,
      isEmailVerified: updatedUser.isEmailVerified,
      isProfileComplete: updatedUser.isProfileComplete,
      onboardingCompleted: updatedUser.onboardingCompleted,
      authProvider: 'email'
    };

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: userData
    });

  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Email verification endpoint
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email now that email is verified
    emailService.sendWelcomeEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }).catch(error => {
      console.error('Welcome email failed:', error);
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Resend email verification
router.post('/resend-verification', hybridAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if verification email was sent recently (prevent spam)
    if (user.emailVerificationSentAt) {
      const timeSinceLastSent = Date.now() - user.emailVerificationSentAt.getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLastSent < fiveMinutes) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting another verification email',
          retryAfter: Math.ceil((fiveMinutes - timeSinceLastSent) / 1000)
        });
      }
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    user.emailVerificationSentAt = new Date();
    
    await user.save();

    // Send verification email
    const verificationLink = `https://deyarun.com/auth/verify-email/${verificationToken}`;
    
    emailService.sendEmailVerificationEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      verificationLink: verificationLink
    }).catch(error => {
      console.error('Email verification failed:', error);
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Debug endpoint to generate reset token (temporary admin utility)
router.post('/debug-reset-token', async (req, res) => {
  try {
    const { email, adminKey } = req.body;

    if (adminKey !== 'debug-admin-reset-2024') {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin key'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found: ${email}`
      });
    }

    // Generate reset token
    const token = jwt.sign(
      { userId: user._id.toString() },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    const resetLink = `https://deyarun.com/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    res.json({
      success: true,
      email: email,
      resetToken: token,
      resetLink: resetLink,
      expiresIn: '1 hour',
      userInfo: {
        email: user.email,
        firstName: user.firstName,
        isEmailVerified: user.isEmailVerified,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Debug reset token error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user and clear httpOnly cookie
 * @access Public
 */
router.post('/logout', (req, res) => {
  try {
    // Clear httpOnly cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // domain removed - uses current domain automatically
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

export default router;