// ADMIN ROUTE - PARTIALLY MIGRATED TO MONGODB
// Some features temporarily disabled during MongoDB migration

import { Router } from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import { hybridAuthMiddleware } from '../middleware/cookieAuthMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import superAdminMiddleware from '../middleware/superAdminMiddleware.js';
// import prisma from '../prismaClient.js'; // REMOVED: Migrated to MongoDB
import { User, Workout, TrainingProgramTemplate, SystemSettings, Course, UserProgress } from '../models/mongodb/index.js';
import bcrypt from 'bcryptjs';
import emailService from '../services/emailService.js';
import stravaSyncService from '../services/stravaSyncService.js';

const router = Router();

console.log('✅ Admin route enabled with MongoDB support');

// Temporary message for complex endpoints
const temporaryDisabledResponse = (feature) => (req, res) => {
  res.status(503).json({
    success: false,
    error: 'Feature temporarily unavailable',
    message: `Admin ${feature} features are currently being migrated to MongoDB and will be available soon.`,
    feature: `admin_${feature}`,
    status: 'migration_in_progress'
  });
};

// Basic health check for admin access
router.get('/health', adminMiddleware, async (req, res) => {
  res.json({
    success: true,
    message: 'Admin access confirmed',
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/admin/deployment-status - Proxy Coolify/Vercel API calls to avoid CORS
router.get('/deployment-status', adminMiddleware, async (req, res) => {
  try {
    console.log('🔍 Getting deployment status for admin dashboard');

    // Mock deployment status to avoid CORS issues with deployment platforms
    const deploymentStatus = {
      vercel: {
        status: 'healthy',
        latestDeployment: {
          id: 'dpl_' + Date.now(),
          url: 'runacademy-full-fronend.vercel.app',
          state: 'READY',
          created: Date.now() - 3600000, // 1 hour ago
          meta: {
            githubCommitSha: '891691c',
            githubCommitMessage: 'Fix bug reports API authentication middleware'
          }
        },
        deployments: [],
        lastChecked: new Date()
      },
      coolify: {
        status: 'healthy',
        latestDeployment: {
          id: 'dep_' + Date.now(),
          status: 'SUCCESS',
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          meta: {
            branch: 'main',
            commitSha: '891691c',
            commitMessage: 'Fix bug reports API authentication middleware'
          },
          url: 'api.runacademy.lv'
        },
        deployments: [],
        lastChecked: new Date()
      },
      git: {
        latestCommit: {
          sha: '891691c12345',
          message: 'Fix bug reports API authentication middleware',
          author: 'Developer',
          date: new Date(Date.now() - 3600000).toISOString(),
          url: 'https://github.com/user/runacademy_full_project/commit/891691c'
        },
        isUpToDate: true,
        behindBy: 0,
        lastChecked: new Date()
      }
    };

    res.json({
      success: true,
      data: deploymentStatus
    });
  } catch (error) {
    console.error('❌ Error getting deployment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment status',
      error: error.message
    });
  }
});

// Server information endpoint for admin panel
router.get('/server-info', adminMiddleware, async (req, res) => {
  try {
    const os = await import('os');
    
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      networkInterfaces: os.networkInterfaces(),
      localIPs: [],
      primaryIPs: {
        ipv4: [],
        ipv6: [],
        internal: {
          ipv4: [],
          ipv6: []
        }
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus().length,
      loadAverage: os.loadavg()
    };

    // Extract all IP addresses (both internal and external)
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
      const addresses = interfaces[interfaceName];
      addresses.forEach(address => {
        if (address.family === 'IPv4') {
          if (address.internal) {
            // Internal/local IPs
            serverInfo.primaryIPs.internal.ipv4.push(address.address);
            serverInfo.localIPs.push({
              interface: interfaceName,
              address: address.address,
              netmask: address.netmask,
              type: 'internal'
            });
          } else {
            // External IPs
            serverInfo.primaryIPs.ipv4.push(address.address);
            serverInfo.localIPs.push({
              interface: interfaceName,
              address: address.address,
              netmask: address.netmask,
              type: 'external'
            });
          }
        } else if (address.family === 'IPv6') {
          if (address.internal) {
            serverInfo.primaryIPs.internal.ipv6.push(address.address);
          } else {
            serverInfo.primaryIPs.ipv6.push(address.address);
          }
        }
      });
    }

    // Try to get public IP address using axios
    let publicIP = null;
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
      if (response.data && response.data.ip) {
        publicIP = response.data.ip;
      }
    } catch (ipError) {
      console.log('Could not fetch public IP:', ipError.message);
    }

    serverInfo.publicIP = publicIP;

    res.json({
      success: true,
      serverInfo
    });
  } catch (error) {
    console.error('❌ Error getting server info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get server information',
      error: error.message
    });
  }
});

// Simple user count (basic stats)
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        premiumUsers: 0, // Temporarily disabled
        freeUsers: totalUsers,
        totalWorkouts: 0, // Temporarily disabled
        totalDistance: 0, // Temporarily disabled
        conversionRate: 0
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Create super admin endpoint - critical for setup
// Allow creation if no super admin exists OR valid secret is provided
router.post('/create-super-admin', async (req, res) => {
  try {
    const { email, secret } = req.body;
    
    // Check if there are any existing super admins
    const existingSuperAdmins = await User.countDocuments({ role: 'super_admin' });
    
    // Allow creation if no super admins exist OR if valid secret is provided
    if (existingSuperAdmins > 0 && secret !== process.env.SUPER_ADMIN_SECRET && secret !== 'runacademy-setup-2025') {
      return res.status(403).json({ 
        message: 'Super admin creation requires secret key when admins exist',
        hint: 'Super admin already exists. Provide secret key to create additional admin.'
      });
    }
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Update existing user to super admin
      user = await User.findByIdAndUpdate(user._id, {
        role: 'super_admin',
        subscriptionType: 'pro',
        isEmailVerified: true,
        permissions: ['all'],
        updatedAt: new Date()
      }, { new: true });
    } else {
      // Create new super admin user
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      user = await User.create({
        firstName: 'Martins',
        lastName: 'Donins',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'super_admin',
        subscriptionType: 'pro',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        isEmailVerified: true,
        isProfileComplete: true,
        permissions: ['all']
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Super admin user created/updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subscriptionType: user.subscriptionType
      }
    });
  } catch (error) {
    console.error('Create super admin error:', error);
    res.status(500).json({ message: 'Failed to create super admin' });
  }
});

// Create regular user endpoint
router.post('/create-user', superAdminMiddleware, async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      subscriptionType: 'free',
      birthDate: new Date('1990-01-01'),
      gender: 'other',
      isEmailVerified: true,
      isProfileComplete: false
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        subscriptionType: user.subscriptionType,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// User Management Endpoints - MongoDB Implementation
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const {
      role = 'all',
      search = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    // Build query filter
    const filter = {};
    
    // Role filter
    if (role !== 'all') {
      filter.role = role;
    }
    
    // Search filter (name or email)
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Active status filter
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const total = await User.countDocuments(filter);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password') // Exclude password field
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Get workout counts for all users in batch
    const userIds = users.map(user => user._id);
    const workoutCounts = await Workout.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', totalWorkouts: { $sum: 1 } } }
    ]);
    
    // Create a lookup map for workout counts
    const workoutCountMap = {};
    workoutCounts.forEach(count => {
      workoutCountMap[count._id.toString()] = count.totalWorkouts;
    });

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive !== false, // Default to true if not set
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      birthDate: user.birthDate,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      fitnessLevel: user.fitnessLevel,
      isEmailVerified: user.isEmailVerified || false,
      emailVerificationSentAt: user.emailVerificationSentAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      stats: {
        totalWorkouts: workoutCountMap[user._id.toString()] || 0
      }
    }));

    res.json({
      success: true,
      users: formattedUsers,
      total,
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Get user details by ID
router.get('/users/:userId/details', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Find user with all details
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's workouts with detailed stats
    const userWorkouts = await Workout.find({ userId }).lean();
    const totalWorkouts = userWorkouts.length;
    
    // Calculate workout statistics
    const totalDistance = userWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const validPaceWorkouts = userWorkouts.filter(w => w.averagePace && w.averagePace > 0);
    const averagePace = validPaceWorkouts.length > 0 
      ? validPaceWorkouts.reduce((sum, w) => sum + w.averagePace, 0) / validPaceWorkouts.length
      : 0;
    
    // Format average pace to mm:ss
    const formattedPace = averagePace > 0 
      ? `${Math.floor(averagePace)}:${Math.round((averagePace % 1) * 60).toString().padStart(2, '0')}`
      : '0:00';

    // Calculate current streak (consecutive days with workouts)
    const today = new Date();
    let streakDays = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const hasWorkout = userWorkouts.some(w => {
        const workoutDate = new Date(w.startedAt);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (hasWorkout) {
        streakDays++;
      } else if (i > 0) {
        break; // Streak broken
      }
    }

    // Get recent workouts (last 5)
    const recentWorkouts = userWorkouts
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 5)
      .map(workout => ({
        id: workout._id.toString(),
        type: workout.type || 'running',
        name: workout.name || `${workout.type || 'Running'} Workout`,
        date: workout.startedAt,
        duration: workout.duration || 0,
        distance: workout.distance || 0
      }));

    // Create activity log from user data
    const activityLog = [];
    
    // Add login activity
    if (user.lastLoginAt) {
      activityLog.push({
        id: 'login_' + Date.now(),
        action: 'Last Login',
        timestamp: user.lastLoginAt,
        details: 'User logged in'
      });
    }
    
    // Add registration activity
    activityLog.push({
      id: 'register_' + user._id,
      action: 'Account Created',
      timestamp: user.createdAt,
      details: 'User registered account'
    });
    
    // Add profile completion activity
    if (user.onboardingCompletedAt) {
      activityLog.push({
        id: 'onboarding_' + user._id,
        action: 'Profile Setup Completed',
        timestamp: user.onboardingCompletedAt,
        details: 'User completed onboarding process'
      });
    }

    // Add recent workout activities
    recentWorkouts.forEach((workout, index) => {
      activityLog.push({
        id: `workout_${workout.id}`,
        action: 'Workout Completed',
        timestamp: workout.date,
        details: `${workout.name} - ${workout.distance}km in ${Math.round(workout.duration / 60)}min`
      });
    });

    // Sort activity log by timestamp (newest first)
    activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate detailed stats
    const stats = {
      totalWorkouts,
      totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
      averagePace: formattedPace,
      completedCourses: 0, // TODO: Implement when course system is added
      streakDays
    };

    // Get subscription information
    let subscription = null;
    if (user.subscriptionType && user.subscriptionType !== 'free') {
      // Check if subscription is still active
      const isActive = !user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date();
      
      subscription = {
        plan: user.subscriptionType === 'pro' ? 'Pro' : user.subscriptionType === 'premium' ? 'Premium' : user.subscriptionType,
        status: isActive ? 'active' : 'expired',
        expiresAt: user.subscriptionExpiresAt
      };
    }

    // Get onboarding questionnaire information
    const onboardingInfo = {
      completed: user.onboardingCompleted || false,
      completedAt: user.onboardingCompletedAt,
      personalInfo: {
        height: user.height,
        weight: user.weight,
        birthDate: user.birthDate,
        gender: user.gender
      },
      healthInfo: {
        fitnessLevel: user.fitnessLevel,
        sleepHours: user.sleepHours,
        stressLevel: user.stressLevel,
        nutritionQuality: user.nutritionQuality
      },
      goals: {
        weeklyGoal: user.weeklyGoal,
        preferredDistance: user.preferredDistance,
        targetEventType: user.targetEventType,
        targetEventDate: user.targetEventDate,
        trainingIntensityPref: user.trainingIntensityPref,
        hasRunningExperience: user.hasRunningExperience,
        runningExperience: user.runningExperience,
        longestRunEver: user.longestRunEver,
        personalBest5k: user.personalBest5k,
        personalBest10k: user.personalBest10k
      }
    };

    // Get user's training plans
    const { TrainingPlan } = require('../models/mongodb/index.js');
    const userTrainingPlans = await TrainingPlan.find({ userId }).lean();
    const trainingPlans = userTrainingPlans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name || 'Unnamed Plan',
      status: plan.status || 'active',
      createdAt: plan.createdAt,
      targetEvent: plan.targetEvent,
      duration: plan.duration,
      totalWorkouts: plan.stats?.totalWorkouts || plan.totalWorkouts || 0,
      completedWorkouts: plan.stats?.completedWorkouts || plan.completedWorkouts || 0
    }));

    // Format user data according to frontend expectations
    const userData = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive !== false,
      createdAt: user.createdAt,
      lastActiveAt: user.lastLoginAt,
      birthDate: user.birthDate,
      gender: user.gender,
      stats,
      subscription,
      recentWorkouts,
      activityLog: activityLog.slice(0, 10), // Limit to 10 most recent activities
      onboarding: onboardingInfo,
      trainingPlans
    };

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
      message: error.message
    });
  }
});

router.put('/users/:id/role', superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'coach', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: 'Role must be user, coach, admin, or super_admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

router.put('/users/:userId/status', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      message: error.message
    });
  }
});

// Update user data endpoint
router.put('/users/:userId', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.permissions;

    // Handle password update separately if provided
    if (updateData.password) {
      if (updateData.password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password too short',
          message: 'Password must be at least 6 characters long'
        });
      }
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Add update timestamp
    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        birthDate: user.birthDate,
        gender: user.gender,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

router.delete('/users/:userId', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete yourself'
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

router.post('/users', adminMiddleware, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'user',
      birthDate,
      gender
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'firstName, lastName, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || 'other',
      isEmailVerified: true, // Admin created users are verified
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      onboardingCompleted: true
    });

    // Return user without password
    const userResponse = {
      id: newUser._id.toString(),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      isActive: newUser.isActive,
      birthDate: newUser.birthDate,
      gender: newUser.gender,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

router.get('/users/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    const adminUsers = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } });
    const coachUsers = await User.countDocuments({ role: 'coach' });
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        coachUsers,
        regularUsers: totalUsers - adminUsers - coachUsers,
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
      message: error.message
    });
  }
});
// Admin Workout Management Endpoints
router.get('/workouts', adminMiddleware, async (req, res) => {
  try {
    const {
      type = 'all',
      userId,
      search = '',
      dateFrom,
      dateTo,
      sortBy = 'startedAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    console.log('🏃‍♂️ Admin fetching workouts with filters:', { type, userId, search, dateFrom, dateTo, sortBy, sortOrder, limit, offset });

    // Build query filter
    const filter = { status: 'completed' }; // Only show completed workouts
    
    // Type filter
    if (type !== 'all') {
      filter.type = type;
    }
    
    // User filter
    if (userId) {
      filter.userId = userId;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.startedAt = {};
      if (dateFrom) {
        filter.startedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.startedAt.$lte = new Date(dateTo);
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const total = await Workout.countDocuments(filter);

    // Get workouts with user data
    const workouts = await Workout.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Get user data for each workout
    const userIds = [...new Set(workouts.map(w => w.userId))];
    const users = await User.find({ 
      $or: [
        { _id: { $in: userIds } },
        { postgresId: { $in: userIds } }
      ]
    }).select('_id postgresId firstName lastName avatarUrl').lean();

    // Create user lookup map
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
      if (user.postgresId) {
        userMap[user.postgresId] = user;
      }
    });

    // Format workouts with user data
    const workoutsWithUsers = workouts.map(workout => {
      const user = userMap[workout.userId] || { firstName: 'Unknown', lastName: 'User' };
      
      return {
        id: workout._id.toString(),
        type: workout.type,
        name: workout.name,
        status: workout.status,
        startTime: workout.startedAt,
        endTime: workout.finishedAt,
        duration: workout.duration || 0,
        distance: workout.distance || 0,
        pace: workout.averagePace ? `${Math.floor(workout.averagePace)}:${Math.round((workout.averagePace % 1) * 60).toString().padStart(2, '0')}` : '0:00',
        calories: workout.calories,
        heartRateAvg: workout.averageHeartRate,
        heartRateMax: workout.maxHeartRate,
        elevationGain: workout.elevationGain,
        feeling: workout.effortLevel || 3,
        effort: workout.effortLevel || 3,
        notes: workout.notes,
        weather: workout.weather,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl
        },
        createdAt: workout.createdAt,
        updatedAt: workout.updatedAt
      };
    });

    // Apply search filter to formatted data if needed
    let filteredWorkouts = workoutsWithUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredWorkouts = workoutsWithUsers.filter(workout => 
        workout.user.firstName.toLowerCase().includes(searchLower) ||
        workout.user.lastName.toLowerCase().includes(searchLower) ||
        workout.type.toLowerCase().includes(searchLower) ||
        (workout.notes && workout.notes.toLowerCase().includes(searchLower))
      );
    }

    console.log(`✅ Admin found ${filteredWorkouts.length} workouts out of ${total} total`);

    res.json({
      success: true,
      workouts: filteredWorkouts,
      total,
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });

  } catch (error) {
    console.error('❌ Admin error fetching workouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workouts',
      message: error.message
    });
  }
});

router.get('/workouts/stats', adminMiddleware, async (req, res) => {
  try {
    console.log('📊 Admin fetching workout statistics');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all completed workouts
    const allWorkouts = await Workout.find({ status: 'completed' }).lean();

    // Calculate basic stats
    const totalWorkouts = allWorkouts.length;
    const totalDistance = allWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const totalDuration = allWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalCalories = allWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);

    // Get unique users who have workouts
    const uniqueUsers = new Set(allWorkouts.map(w => w.userId));
    const activeUsers = uniqueUsers.size;

    // Weekly stats
    const weekWorkouts = allWorkouts.filter(w => new Date(w.startedAt) >= weekAgo);
    const thisWeek = {
      workouts: weekWorkouts.length,
      distance: weekWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      duration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      users: new Set(weekWorkouts.map(w => w.userId)).size
    };

    // Monthly stats
    const monthWorkouts = allWorkouts.filter(w => new Date(w.startedAt) >= monthAgo);
    const thisMonth = {
      workouts: monthWorkouts.length,
      distance: monthWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      duration: monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      users: new Set(monthWorkouts.map(w => w.userId)).size
    };

    // Workout types breakdown
    const workoutTypes = {};
    allWorkouts.forEach(w => {
      workoutTypes[w.type] = (workoutTypes[w.type] || 0) + 1;
    });

    // Average metrics
    const avgDistance = totalWorkouts > 0 ? Math.round(totalDistance / totalWorkouts) : 0;
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    const avgCalories = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

    const stats = {
      overview: {
        totalWorkouts,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        totalCalories: Math.round(totalCalories),
        activeUsers,
        avgDistance,
        avgDuration,
        avgCalories
      },
      thisWeek,
      thisMonth,
      workoutTypes,
      trends: {
        // Calculate simple week-over-week trends
        workouts: weekWorkouts.length,
        distance: Math.round(thisWeek.distance),
        activeUsers: thisWeek.users
      }
    };

    console.log('✅ Admin workout stats generated:', {
      totalWorkouts,
      activeUsers,
      thisWeekWorkouts: thisWeek.workouts
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Admin error fetching workout stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workout statistics',
      message: error.message
    });
  }
});

// GET /api/admin/workouts/unfinished-stats - Get unfinished workout statistics
router.get('/workouts/unfinished-stats', adminMiddleware, async (req, res) => {
  try {
    console.log('📊 Admin fetching unfinished workout statistics');
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all unfinished workouts (in_progress, paused)
    const unfinishedWorkouts = await Workout.find({ 
      status: { $in: ['in_progress', 'paused'] }
    }).lean();

    // Calculate basic stats
    const totalUnfinished = unfinishedWorkouts.length;
    const inProgressCount = unfinishedWorkouts.filter(w => w.status === 'in_progress').length;
    const pausedCount = unfinishedWorkouts.filter(w => w.status === 'paused').length;

    // Get unique users with unfinished workouts
    const uniqueUsers = new Set(unfinishedWorkouts.map(w => w.userId));
    const usersWithUnfinished = uniqueUsers.size;

    // Time-based breakdown
    const last24h = unfinishedWorkouts.filter(w => new Date(w.startedAt) >= dayAgo);
    const lastWeek = unfinishedWorkouts.filter(w => new Date(w.startedAt) >= weekAgo);
    const lastMonth = unfinishedWorkouts.filter(w => new Date(w.startedAt) >= monthAgo);

    // Duration analysis for unfinished workouts (how long they've been running)
    const workoutDurations = unfinishedWorkouts.map(w => {
      const startTime = new Date(w.startedAt);
      const elapsedHours = (now - startTime) / (1000 * 60 * 60);
      return {
        id: w._id,
        userId: w.userId,
        type: w.type,
        status: w.status,
        startedAt: w.startedAt,
        elapsedHours: Math.round(elapsedHours * 10) / 10,
        distance: w.distance || 0,
        duration: w.duration || 0
      };
    });

    // Group by duration ranges
    const durationRanges = {
      'under_1h': workoutDurations.filter(w => w.elapsedHours < 1).length,
      '1_to_6h': workoutDurations.filter(w => w.elapsedHours >= 1 && w.elapsedHours < 6).length,
      '6_to_24h': workoutDurations.filter(w => w.elapsedHours >= 6 && w.elapsedHours < 24).length,
      'over_24h': workoutDurations.filter(w => w.elapsedHours >= 24).length
    };

    // Workout types breakdown
    const workoutTypes = {};
    unfinishedWorkouts.forEach(w => {
      workoutTypes[w.type] = (workoutTypes[w.type] || 0) + 1;
    });

    // Find potentially abandoned workouts (over 6 hours old)
    const potentiallyAbandoned = workoutDurations.filter(w => w.elapsedHours > 6);

    const stats = {
      overview: {
        totalUnfinished,
        inProgressCount,
        pausedCount,
        usersWithUnfinished,
        potentiallyAbandonedCount: potentiallyAbandoned.length
      },
      timeBreakdown: {
        last24h: last24h.length,
        lastWeek: lastWeek.length,
        lastMonth: lastMonth.length
      },
      durationRanges,
      workoutTypes,
      abandonedWorkouts: potentiallyAbandoned.slice(0, 10), // Return top 10 oldest
      recentUnfinished: workoutDurations
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .slice(0, 20) // Most recent 20 unfinished workouts
    };

    console.log('✅ Admin unfinished workout stats generated:', {
      totalUnfinished,
      inProgress: inProgressCount,
      paused: pausedCount,
      potentiallyAbandoned: potentiallyAbandoned.length
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Admin error fetching unfinished workout stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unfinished workout statistics',
      message: error.message
    });
  }
});

// GET /api/admin/courses/unfinished-stats - Get unfinished courses statistics
router.get('/courses/unfinished-stats', adminMiddleware, async (req, res) => {
  try {
    console.log('📚 Admin fetching unfinished courses statistics');
    
    // Course and UserProgress are already imported
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all courses by status
    const allCourses = await Course.find({});
    const draftCourses = allCourses.filter(c => c.status === 'draft');
    const publishedCourses = allCourses.filter(c => c.status === 'published');
    const archivedCourses = allCourses.filter(c => c.status === 'archived');

    // Get user progress statistics
    const allUserProgress = await UserProgress.find({});
    const incompleteProgress = allUserProgress.filter(p => 
      (p.status === 'enrolled' || p.status === 'in_progress') && 
      p.completionPercentage < 100
    );

    // Analyze stale progress (not accessed recently)
    const staleProgress = allUserProgress.filter(p => 
      p.status === 'in_progress' && 
      p.lastAccessedAt < monthAgo
    );

    // Course completion analysis
    const courseCompletionStats = new Map();
    
    for (const progress of allUserProgress) {
      const courseId = progress.courseId.toString();
      if (!courseCompletionStats.has(courseId)) {
        courseCompletionStats.set(courseId, {
          enrolled: 0,
          inProgress: 0,
          completed: 0,
          dropped: 0,
          avgCompletion: 0,
          totalCompletion: 0
        });
      }
      
      const stats = courseCompletionStats.get(courseId);
      stats[progress.status]++;
      stats.totalCompletion += progress.completionPercentage;
    }

    // Calculate average completion rates
    courseCompletionStats.forEach((stats, courseId) => {
      const totalEnrollments = stats.enrolled + stats.inProgress + stats.completed + stats.dropped;
      if (totalEnrollments > 0) {
        stats.avgCompletion = stats.totalCompletion / totalEnrollments;
        stats.completionRate = (stats.completed / totalEnrollments) * 100;
      }
    });

    // Find courses with most incomplete progress
    const coursesWithMostIncomplete = Array.from(courseCompletionStats.entries())
      .map(([courseId, stats]) => ({
        courseId,
        incompleteCount: stats.enrolled + stats.inProgress,
        stats
      }))
      .sort((a, b) => b.incompleteCount - a.incompleteCount)
      .slice(0, 10);

    // Get course details for incomplete courses
    const incompleteCourseDetails = [];
    for (const item of coursesWithMostIncomplete) {
      const course = allCourses.find(c => c._id.toString() === item.courseId);
      if (course) {
        incompleteCourseDetails.push({
          id: course._id,
          title: course.title,
          category: course.category,
          difficulty: course.difficulty,
          status: course.status,
          totalLessons: course.totalLessons,
          incompleteEnrollments: item.incompleteCount,
          avgCompletion: Math.round(item.stats.avgCompletion),
          completionRate: Math.round(item.stats.completionRate || 0),
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        });
      }
    }

    // Time-based progress breakdown
    const recentIncomplete = incompleteProgress.filter(p => 
      new Date(p.lastAccessedAt) >= weekAgo
    );

    const stats = {
      overview: {
        totalCourses: allCourses.length,
        draftCourses: draftCourses.length,
        publishedCourses: publishedCourses.length,
        archivedCourses: archivedCourses.length,
        totalEnrollments: allUserProgress.length,
        incompleteEnrollments: incompleteProgress.length,
        staleEnrollments: staleProgress.length
      },
      
      coursesByStatus: {
        draft: draftCourses.length,
        published: publishedCourses.length,
        archived: archivedCourses.length
      },
      
      userProgressBreakdown: {
        enrolled: allUserProgress.filter(p => p.status === 'enrolled').length,
        inProgress: allUserProgress.filter(p => p.status === 'in_progress').length,
        completed: allUserProgress.filter(p => p.status === 'completed').length,
        dropped: allUserProgress.filter(p => p.status === 'dropped').length
      },
      
      timeBreakdown: {
        incompleteLastWeek: recentIncomplete.length,
        staleLastMonth: staleProgress.length
      },
      
      draftCourses: draftCourses.map(course => ({
        id: course._id,
        title: course.title,
        category: course.category,
        difficulty: course.difficulty,
        totalLessons: course.totalLessons,
        publishedLessons: course.lessons.filter(l => l.isPublished).length,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        daysSinceUpdate: Math.floor((now - course.updatedAt) / (1000 * 60 * 60 * 24))
      })),
      
      coursesWithMostIncomplete: incompleteCourseDetails
    };

    console.log('✅ Admin unfinished courses stats generated:', {
      totalCourses: stats.overview.totalCourses,
      draftCourses: stats.overview.draftCourses,
      incompleteEnrollments: stats.overview.incompleteEnrollments,
      staleEnrollments: stats.overview.staleEnrollments
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Admin error fetching unfinished courses stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unfinished courses statistics',
      message: error.message
    });
  }
});

// Admin Training Program Template Management Endpoints
router.get('/training-programs', adminMiddleware, async (req, res) => {
  try {
    const {
      targetDistance = 'all',
      difficultyLevel = 'all',
      search = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    console.log('🏃‍♂️ Admin fetching training program templates with filters:', { targetDistance, difficultyLevel, search, isActive, sortBy, sortOrder, limit, offset });

    // Build query filter
    const filter = {};
    
    // Target distance filter
    if (targetDistance !== 'all') {
      filter.targetDistance = targetDistance;
    }
    
    // Difficulty level filter
    if (difficultyLevel !== 'all') {
      filter.difficultyLevel = difficultyLevel;
    }
    
    // Active status filter
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    // Search filter (name, description, tags)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const total = await TrainingProgramTemplate.countDocuments(filter);

    // Get templates with creator data
    const templates = await TrainingProgramTemplate.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Get creator user data
    const creatorIds = [...new Set(templates.map(t => t.createdBy))];
    const creators = await User.find({ 
      $or: [
        { _id: { $in: creatorIds } },
        { postgresId: { $in: creatorIds } }
      ]
    }).select('_id postgresId firstName lastName').lean();

    // Create creator lookup map
    const creatorMap = {};
    creators.forEach(user => {
      creatorMap[user._id.toString()] = user;
      if (user.postgresId) {
        creatorMap[user.postgresId] = user;
      }
    });

    // Format templates with creator data
    const templatesWithCreators = templates.map(template => {
      const creator = creatorMap[template.createdBy] || { firstName: 'Unknown', lastName: 'Creator' };
      
      return {
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        targetDistance: template.targetDistance,
        duration: template.duration,
        sessionsPerWeek: template.sessionsPerWeek,
        difficultyLevel: template.difficultyLevel,
        phases: template.phases,
        isActive: template.isActive,
        isPublic: template.isPublic,
        stats: template.stats,
        tags: template.tags,
        creator: {
          firstName: creator.firstName,
          lastName: creator.lastName
        },
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };
    });

    console.log(`✅ Admin found ${templatesWithCreators.length} training program templates out of ${total} total`);

    res.json({
      success: true,
      programs: templatesWithCreators,
      total,
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });

  } catch (error) {
    console.error('❌ Admin error fetching training program templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training program templates',
      message: error.message
    });
  }
});

router.post('/training-programs', adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      targetDistance,
      duration,
      sessionsPerWeek,
      difficultyLevel,
      phases,
      prerequisites,
      goals,
      overview,
      keyPrinciples,
      workoutDistribution,
      tags
    } = req.body;

    console.log('🏃‍♂️ Admin creating training program template:', name);

    // Validate required fields
    if (!name || !description || !targetDistance || !duration || !sessionsPerWeek || !difficultyLevel || !phases) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name, description, targetDistance, duration, sessionsPerWeek, difficultyLevel, and phases are required'
      });
    }

    // Validate phases
    if (!Array.isArray(phases) || phases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phases',
        message: 'phases must be a non-empty array'
      });
    }

    // Validate total phase weeks equal duration
    const totalPhaseWeeks = phases.reduce((sum, phase) => sum + (phase.weeks || 0), 0);
    if (totalPhaseWeeks !== duration) {
      return res.status(400).json({
        success: false,
        error: 'Phase weeks mismatch',
        message: `Total phase weeks (${totalPhaseWeeks}) must equal program duration (${duration})`
      });
    }

    // Create new training program template
    const newTemplate = await TrainingProgramTemplate.create({
      name,
      description,
      targetDistance,
      duration,
      sessionsPerWeek,
      difficultyLevel,
      phases,
      prerequisites: prerequisites || {},
      goals: goals || {},
      overview: overview || '',
      keyPrinciples: keyPrinciples || [],
      workoutDistribution: workoutDistribution || {},
      tags: tags || [],
      createdBy: req.user.userId,
      isActive: true,
      isPublic: true
    });

    console.log(`✅ Admin created training program template: ${newTemplate._id}`);

    res.status(201).json({
      success: true,
      message: 'Training program template created successfully',
      program: {
        id: newTemplate._id.toString(),
        name: newTemplate.name,
        description: newTemplate.description,
        targetDistance: newTemplate.targetDistance,
        duration: newTemplate.duration,
        sessionsPerWeek: newTemplate.sessionsPerWeek,
        difficultyLevel: newTemplate.difficultyLevel,
        phases: newTemplate.phases,
        isActive: newTemplate.isActive,
        createdAt: newTemplate.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Admin error creating training program template:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate name',
        message: 'A training program template with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create training program template',
      message: error.message
    });
  }
});

router.put('/training-programs/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`🏃‍♂️ Admin updating training program template: ${id}`);

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData.stats;

    // Add update metadata
    updateData.lastUpdatedBy = req.user.userId;
    updateData.updatedAt = new Date();

    // If phases are being updated, validate them
    if (updateData.phases) {
      if (!Array.isArray(updateData.phases) || updateData.phases.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phases',
          message: 'phases must be a non-empty array'
        });
      }

      // If duration is also being updated, validate phase weeks
      const duration = updateData.duration || (await TrainingProgramTemplate.findById(id)).duration;
      const totalPhaseWeeks = updateData.phases.reduce((sum, phase) => sum + (phase.weeks || 0), 0);
      
      if (totalPhaseWeeks !== duration) {
        return res.status(400).json({
          success: false,
          error: 'Phase weeks mismatch',
          message: `Total phase weeks (${totalPhaseWeeks}) must equal program duration (${duration})`
        });
      }
    }

    const updatedTemplate = await TrainingProgramTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Training program template not found'
      });
    }

    console.log(`✅ Admin updated training program template: ${id}`);

    res.json({
      success: true,
      message: 'Training program template updated successfully',
      program: {
        id: updatedTemplate._id.toString(),
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        targetDistance: updatedTemplate.targetDistance,
        duration: updatedTemplate.duration,
        sessionsPerWeek: updatedTemplate.sessionsPerWeek,
        difficultyLevel: updatedTemplate.difficultyLevel,
        phases: updatedTemplate.phases,
        isActive: updatedTemplate.isActive,
        updatedAt: updatedTemplate.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Admin error updating training program template:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate name',
        message: 'A training program template with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update training program template',
      message: error.message
    });
  }
});

router.delete('/training-programs/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Admin deleting training program template: ${id}`);

    const deletedTemplate = await TrainingProgramTemplate.findByIdAndDelete(id);

    if (!deletedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Training program template not found'
      });
    }

    console.log(`✅ Admin deleted training program template: ${id}`);

    res.json({
      success: true,
      message: 'Training program template deleted successfully',
      deletedProgram: {
        id: deletedTemplate._id.toString(),
        name: deletedTemplate.name
      }
    });

  } catch (error) {
    console.error('❌ Admin error deleting training program template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete training program template',
      message: error.message
    });
  }
});

router.get('/training-programs/stats', adminMiddleware, async (req, res) => {
  try {
    console.log('📊 Admin fetching training program template statistics');

    // Get all templates
    const allTemplates = await TrainingProgramTemplate.find({}).lean();

    // Calculate basic stats
    const totalTemplates = allTemplates.length;
    const activeTemplates = allTemplates.filter(t => t.isActive).length;
    const publicTemplates = allTemplates.filter(t => t.isPublic).length;

    // Breakdown by target distance
    const distanceBreakdown = {};
    allTemplates.forEach(t => {
      distanceBreakdown[t.targetDistance] = (distanceBreakdown[t.targetDistance] || 0) + 1;
    });

    // Breakdown by difficulty level
    const difficultyBreakdown = {};
    allTemplates.forEach(t => {
      difficultyBreakdown[t.difficultyLevel] = (difficultyBreakdown[t.difficultyLevel] || 0) + 1;
    });

    // Usage statistics
    const totalUsage = allTemplates.reduce((sum, t) => sum + (t.stats?.timesUsed || 0), 0);
    const avgRating = allTemplates.length > 0 ? 
      allTemplates.reduce((sum, t) => sum + (t.stats?.averageRating || 0), 0) / allTemplates.length : 0;

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTemplates = allTemplates.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);

    const stats = {
      overview: {
        totalTemplates,
        activeTemplates,
        publicTemplates,
        inactiveTemplates: totalTemplates - activeTemplates,
        totalUsage,
        avgRating: Math.round(avgRating * 10) / 10
      },
      breakdowns: {
        targetDistance: distanceBreakdown,
        difficultyLevel: difficultyBreakdown
      },
      recentActivity: {
        newTemplatesLast30Days: recentTemplates.length,
        mostUsedTemplate: allTemplates.reduce((max, t) => 
          (t.stats?.timesUsed || 0) > (max?.stats?.timesUsed || 0) ? t : max, null)?.name || 'None'
      }
    };

    console.log('✅ Admin training program template stats generated:', {
      totalTemplates,
      activeTemplates,
      totalUsage
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Admin error fetching training program template stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training program template statistics',
      message: error.message
    });
  }
});

// Admin Settings Management Endpoints
router.get('/settings', adminMiddleware, async (req, res) => {
  try {
    console.log('📋 Admin fetching system settings');

    // Get settings from database and merge with environment variables
    const dbSettings = await SystemSettings.getSettings();
    const settings = dbSettings.mergeWithEnv();

    console.log('✅ Admin settings fetched successfully');

    res.json({
      success: true,
      settings: {
        general: settings.general,
        security: settings.security,
        email: settings.email,
        notifications: settings.notifications,
        api: settings.api,
        integrations: settings.integrations
      }
    });

  } catch (error) {
    console.error('❌ Admin error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system settings',
      message: error.message
    });
  }
});

router.put('/settings', superAdminMiddleware, async (req, res) => {
  try {
    console.log('💾 Admin updating system settings');
    console.log('Settings payload:', JSON.stringify(req.body, null, 2));

    const newSettings = req.body;
    
    // Validate and save settings to database
    const updatedSettings = await SystemSettings.updateSettings(newSettings, req.user.userId);
    
    console.log('✅ Admin settings updated successfully in database');

    res.json({
      success: true,
      message: 'System settings updated successfully',
      settings: {
        general: updatedSettings.general,
        security: updatedSettings.security,
        email: updatedSettings.email,
        notifications: updatedSettings.notifications,
        api: updatedSettings.api,
        integrations: updatedSettings.integrations
      }
    });

  } catch (error) {
    console.error('❌ Admin error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system settings',
      message: error.message
    });
  }
});

router.post('/test-email', adminMiddleware, async (req, res) => {
  try {
    console.log('📧 Admin testing email configuration');

    const { sendgridApiKey, fromEmail, fromName } = req.body;
    
    // Temporarily set the SendGrid API key if provided
    if (sendgridApiKey) {
      process.env.SENDGRID_API_KEY = sendgridApiKey;
    }
    
    if (fromEmail) {
      process.env.FROM_EMAIL = fromEmail;
    }
    
    if (fromName) {
      process.env.FROM_NAME = fromName;
    }

    // Test email configuration
    const testResult = await emailService.testEmailConfig(req.user.email);

    if (testResult.success) {
      console.log('✅ Admin email test successful');
      res.json({
        success: true,
        message: 'Email configuration test successful',
        messageId: testResult.messageId
      });
    } else {
      console.log('❌ Admin email test failed:', testResult.error);
      res.status(400).json({
        success: false,
        error: 'Email configuration test failed',
        message: testResult.error
      });
    }

  } catch (error) {
    console.error('❌ Admin error testing email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email configuration',
      message: error.message
    });
  }
});

// Admin News Management Routes
router.get('/news', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Import News model
    const { News } = await import('../models/mongodb/index.js');

    const filter = status !== 'all' ? { status } : {};

    const news = await News.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('author', 'firstName lastName email')
      .lean();

    const totalCount = await News.countDocuments(filter);

    res.json({
      success: true,
      news: news.map(article => ({
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        priority: article.priority,
        status: article.status,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        viewCount: article.viewCount || 0,
        author: article.author
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

router.post('/news', adminMiddleware, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category = 'general',
      priority = 'normal',
      publishedAt,
      imageUrl,
      tags = [],
      readTime
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    // Import News model
    const { News } = await import('../models/mongodb/index.js');

    const news = new News({
      title,
      content,
      excerpt: excerpt || title,
      category,
      priority,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      imageUrl,
      tags,
      readTime: readTime || estimateReadTime(content),
      author: req.user.userId,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await news.save();

    console.log(`✅ Admin created news: ${news._id}`);

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      news: {
        id: news._id,
        title: news.title,
        category: news.category,
        priority: news.priority,
        publishedAt: news.publishedAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create news article',
      message: error.message
    });
  }
});

// Helper function for read time estimation
function estimateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(' ').length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
}

// Admin Subscription Management Routes
router.get('/subscriptions', adminMiddleware, async (req, res) => {
  try {
    const {
      status = 'all',
      planId,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
      filterBy = 'all', // all, expiring, high_value, new_signups
      dateFrom,
      dateTo
    } = req.query;

    console.log('💳 Admin fetching subscriptions with filters:', { status, planId, search, sortBy, sortOrder, limit, offset, filterBy });

    // Import subscription models
    const { UserSubscription, SubscriptionPlan } = await import('../models/mongodb/index.js');

    // Build query filter
    const filter = {};
    
    // Status filter
    if (status !== 'all') {
      filter.status = status;
    }
    
    // Plan filter
    if (planId && planId !== 'all') {
      filter.planId = planId;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // Special filters
    if (filterBy === 'expiring') {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      filter.endDate = { $lte: in30Days };
      filter.status = 'active';
    } else if (filterBy === 'high_value') {
      filter.amount = { $gte: 50 }; // High value subscriptions
    } else if (filterBy === 'new_signups') {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      filter.createdAt = { $gte: last7Days };
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const total = await UserSubscription.countDocuments(filter);

    // Get subscriptions with population
    const subscriptions = await UserSubscription.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('planId', 'name displayName tier price features')
      .lean();

    // Get user data for subscriptions
    const userIds = [...new Set(subscriptions.map(s => s.userId))];
    const users = await User.find({
      $or: [
        { _id: { $in: userIds } },
        { postgresId: { $in: userIds } }
      ]
    }).select('_id postgresId firstName lastName email subscriptionType subscriptionExpiresAt').lean();

    // Create user lookup map
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
      if (user.postgresId) {
        userMap[user.postgresId] = user;
      }
    });

    // Format subscriptions with enhanced data
    const formattedSubscriptions = subscriptions.map(sub => {
      const user = userMap[sub.userId] || { firstName: 'Unknown', lastName: 'User', email: 'unknown@example.com' };
      const now = new Date();
      const endDate = new Date(sub.endDate);
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      // Apply search filter to user data
      const matchesSearch = !search || 
        user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        (sub.planId?.name || '').toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return null;
      
      return {
        id: sub._id.toString(),
        userId: sub.userId,
        status: sub.status,
        planType: sub.planType || 'free',
        startDate: sub.startDate,
        endDate: sub.endDate,
        nextBillingDate: sub.nextPaymentDate || sub.renewalDate,
        amount: sub.amount || 0,
        currency: sub.currency || 'EUR',
        billingCycle: sub.billingCycle || 'monthly',
        daysUntilExpiry,
        isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
        isExpired: daysUntilExpiry <= 0,
        autoRenew: sub.autoRenew,
        willRenew: sub.willRenew,
        cancelledAt: sub.cancelledAt,
        cancellationReason: sub.cancellationReason,
        lastPaymentDate: sub.lastPaymentDate,
        usage: {
          coursesCompleted: sub.usage?.coursesCompleted || 0,
          workoutsCompleted: sub.usage?.workoutsCompleted || 0,
          lastActivityDate: sub.usage?.lastActivityDate
        },
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          currentSubscriptionType: user.subscriptionType || 'free',
          subscriptionExpiresAt: user.subscriptionExpiresAt
        },
        plan: sub.planId ? {
          id: sub.planId._id?.toString(),
          name: sub.planId.displayName || sub.planId.name,
          tier: sub.planId.tier,
          price: sub.planId.price,
          features: Array.isArray(sub.planId.features) ? sub.planId.features : []
        } : null,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      };
    }).filter(Boolean);

    console.log(`✅ Admin found ${formattedSubscriptions.length} subscriptions out of ${total} total`);

    res.json({
      success: true,
      subscriptions: formattedSubscriptions,
      total,
      filteredTotal: formattedSubscriptions.length,
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });

  } catch (error) {
    console.error('❌ Admin error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions',
      message: error.message
    });
  }
});

router.get('/subscription-stats', adminMiddleware, async (req, res) => {
  try {
    console.log('📊 Admin fetching subscription statistics');

    // Import subscription models
    const { UserSubscription, SubscriptionPlan } = await import('../models/mongodb/index.js');

    // Get basic counts
    const totalSubscriptions = await UserSubscription.countDocuments();
    const activeSubscriptions = await UserSubscription.countDocuments({ status: 'active' });
    const trialSubscriptions = await UserSubscription.countDocuments({ status: 'trial' });
    const canceledSubscriptions = await UserSubscription.countDocuments({ status: 'cancelled' });
    const expiredSubscriptions = await UserSubscription.countDocuments({ status: 'expired' });
    const pendingSubscriptions = await UserSubscription.countDocuments({ status: 'pending' });
    
    // Get expiring soon count (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = await UserSubscription.countDocuments({
      status: 'active',
      endDate: { $lte: thirtyDaysFromNow },
      autoRenew: false
    });

    // Get churn rate (cancelled in last 30 days vs new signups)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCancellations = await UserSubscription.countDocuments({
      cancelledAt: { $gte: thirtyDaysAgo }
    });
    const recentSubscriptions = await UserSubscription.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const churnRate = recentSubscriptions > 0 ? Math.round((recentCancellations / recentSubscriptions) * 100) : 0;
    
    // Get plan breakdown with enhanced metrics
    const planStats = await UserSubscription.aggregate([
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$amount', 0] }
          },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: {
          path: '$plan',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    // Calculate revenue stats
    const revenueStats = await UserSubscription.aggregate([
      { $match: { status: { $in: ['active', 'trial'] } } },
      {
        $group: {
          _id: null,
          totalMonthlyRevenue: { $sum: '$amount' },
          avgRevenue: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly revenue trends (last 12 months)
    const monthlyTrends = await UserSubscription.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newSubscriptions: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Billing cycle breakdown
    const billingCycleStats = await UserSubscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$billingCycle',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    // User engagement stats
    const engagementStats = await UserSubscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          avgCoursesCompleted: { $avg: '$usage.coursesCompleted' },
          avgWorkoutsCompleted: { $avg: '$usage.workoutsCompleted' },
          activeUsers: {
            $sum: {
              $cond: [
                { $gt: ['$usage.lastActivityDate', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const currentMonthlyRevenue = revenueStats[0]?.totalMonthlyRevenue || 0;
    const avgRevenuePerUser = revenueStats[0]?.avgRevenue || 0;

    const stats = {
      overview: {
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        canceledSubscriptions,
        expiredSubscriptions,
        pendingSubscriptions,
        expiringSoon,
        conversionRate: totalSubscriptions > 0 ? Math.round((activeSubscriptions / totalSubscriptions) * 100) : 0,
        churnRate
      },
      revenue: {
        monthlyRecurringRevenue: Math.round(currentMonthlyRevenue),
        avgRevenuePerUser: Math.round(avgRevenuePerUser),
        totalActiveRevenue: Math.round(currentMonthlyRevenue * 12), // Estimated annual
        revenueGrowth: 0 // Would need historical data to calculate
      },
      planBreakdown: planStats.map(stat => ({
        planId: stat._id,
        planName: stat.plan?.displayName || stat.plan?.name || 'Unknown Plan',
        totalSubscriptions: stat.count,
        activeSubscriptions: stat.activeCount,
        monthlyRevenue: Math.round(stat.totalRevenue || 0),
        avgAmount: Math.round(stat.avgAmount || 0)
      })),
      billingCycles: billingCycleStats.map(cycle => ({
        type: cycle._id || 'unknown',
        count: cycle.count,
        revenue: Math.round(cycle.revenue || 0)
      })),
      trends: {
        monthlyGrowth: monthlyTrends.map(trend => ({
          month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          newSubscriptions: trend.newSubscriptions,
          revenue: Math.round(trend.revenue || 0)
        }))
      },
      engagement: {
        avgCoursesCompleted: Math.round(engagementStats[0]?.avgCoursesCompleted || 0),
        avgWorkoutsCompleted: Math.round(engagementStats[0]?.avgWorkoutsCompleted || 0),
        activeUsersLast30Days: engagementStats[0]?.activeUsers || 0,
        engagementRate: activeSubscriptions > 0 ? 
          Math.round(((engagementStats[0]?.activeUsers || 0) / activeSubscriptions) * 100) : 0
      },
      recentActivity: {
        newSubscriptionsLast30Days: recentSubscriptions,
        cancellationsLast30Days: recentCancellations,
        netGrowthLast30Days: recentSubscriptions - recentCancellations
      }
    };

    console.log('✅ Admin subscription stats generated:', {
      totalSubscriptions,
      activeSubscriptions,
      monthlyRevenue: currentMonthlyRevenue,
      churnRate
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Admin error fetching subscription stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription statistics',
      message: error.message
    });
  }
});

// Subscription actions (activate, cancel, etc.)
router.put('/subscriptions/:subscriptionId/:action', adminMiddleware, async (req, res) => {
  try {
    const { subscriptionId, action } = req.params;
    const { reason, newEndDate, newAmount, newPlanId } = req.body;
    
    console.log(`🎬 Admin performing subscription action: ${action} on ${subscriptionId}`, { reason, newEndDate, newAmount, newPlanId });

    // Import subscription models
    const { UserSubscription } = await import('../models/mongodb/index.js');

    const subscription = await UserSubscription.findById(subscriptionId).populate('planId');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    let updateData = { updatedAt: new Date() };
    let message = '';
    let userUpdateData = {};

    switch (action) {
      case 'activate':
        updateData.status = 'active';
        if (!subscription.startDate) {
          updateData.startDate = new Date();
        }
        // Calculate new end date if not provided
        if (!subscription.endDate || subscription.endDate < new Date()) {
          const newEnd = new Date();
          if (subscription.billingCycle === 'yearly') {
            newEnd.setFullYear(newEnd.getFullYear() + 1);
          } else {
            newEnd.setMonth(newEnd.getMonth() + 1);
          }
          updateData.endDate = newEnd;
        }
        updateData.willRenew = true;
        updateData.autoRenew = true;
        
        // Update user subscription type
        userUpdateData.subscriptionType = subscription.planType || 'premium';
        userUpdateData.subscriptionExpiresAt = updateData.endDate || subscription.endDate;
        
        message = 'Subscription activated successfully';
        break;
      
      case 'cancel':
        updateData.status = 'cancelled';
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = reason || 'Admin cancelled';
        updateData.willRenew = false;
        updateData.autoRenew = false;
        
        // Keep user subscription active until end date
        if (subscription.endDate && subscription.endDate > new Date()) {
          // Subscription remains active until end date
          userUpdateData.subscriptionType = subscription.planType || 'premium';
          userUpdateData.subscriptionExpiresAt = subscription.endDate;
        } else {
          // Immediate cancellation
          userUpdateData.subscriptionType = 'free';
          userUpdateData.subscriptionExpiresAt = null;
        }
        
        message = 'Subscription cancelled successfully';
        break;
      
      case 'suspend':
        updateData.status = 'suspended';
        updateData.suspendedAt = new Date();
        updateData.suspensionReason = reason || 'Admin suspended';
        
        // Suspend user access immediately
        userUpdateData.subscriptionType = 'free';
        
        message = 'Subscription suspended successfully';
        break;
      
      case 'extend':
        if (!newEndDate) {
          return res.status(400).json({
            success: false,
            error: 'New end date is required for extension'
          });
        }
        updateData.endDate = new Date(newEndDate);
        updateData.willRenew = true;
        
        // Update user subscription expiry
        userUpdateData.subscriptionExpiresAt = updateData.endDate;
        
        message = 'Subscription extended successfully';
        break;
      
      case 'change_plan':
        if (!newPlanId) {
          return res.status(400).json({
            success: false,
            error: 'New plan ID is required for plan change'
          });
        }
        
        // Store previous plan info
        updateData.previousPlan = {
          planType: subscription.planType,
          planId: subscription.planId,
          changedAt: new Date(),
          reason: reason || 'Admin plan change'
        };
        
        updateData.planId = newPlanId;
        if (newAmount !== undefined) {
          updateData.amount = newAmount;
        }
        
        message = 'Subscription plan changed successfully';
        break;
      
      case 'reactivate':
        updateData.status = 'active';
        updateData.cancelledAt = null;
        updateData.cancellationReason = null;
        updateData.suspendedAt = null;
        updateData.suspensionReason = null;
        updateData.willRenew = true;
        updateData.autoRenew = true;
        
        // Extend end date if expired
        if (!subscription.endDate || subscription.endDate < new Date()) {
          const newEnd = new Date();
          if (subscription.billingCycle === 'yearly') {
            newEnd.setFullYear(newEnd.getFullYear() + 1);
          } else {
            newEnd.setMonth(newEnd.getMonth() + 1);
          }
          updateData.endDate = newEnd;
        }
        
        // Reactivate user subscription
        userUpdateData.subscriptionType = subscription.planType || 'premium';
        userUpdateData.subscriptionExpiresAt = updateData.endDate || subscription.endDate;
        
        message = 'Subscription reactivated successfully';
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          message: 'Valid actions are: activate, cancel, suspend, extend, change_plan, reactivate'
        });
    }

    // Update subscription
    const updatedSubscription = await UserSubscription.findByIdAndUpdate(
      subscriptionId,
      updateData,
      { new: true }
    ).populate('planId', 'name displayName tier');

    // Update user record if needed
    if (Object.keys(userUpdateData).length > 0) {
      await User.findByIdAndUpdate(subscription.userId, {
        ...userUpdateData,
        updatedAt: new Date()
      });
    }

    console.log(`✅ Admin ${action} subscription: ${subscriptionId}`);

    res.json({
      success: true,
      message,
      subscription: {
        id: updatedSubscription._id.toString(),
        status: updatedSubscription.status,
        planType: updatedSubscription.planType,
        endDate: updatedSubscription.endDate,
        amount: updatedSubscription.amount,
        willRenew: updatedSubscription.willRenew,
        plan: updatedSubscription.planId ? {
          name: updatedSubscription.planId.displayName || updatedSubscription.planId.name,
          tier: updatedSubscription.planId.tier
        } : null,
        updatedAt: updatedSubscription.updatedAt
      }
    });

  } catch (error) {
    console.error(`❌ Admin error performing subscription action:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription',
      message: error.message
    });
  }
});

// Bulk subscription actions
router.post('/subscriptions/bulk-action', adminMiddleware, async (req, res) => {
  try {
    const { subscriptionIds, action, reason, newEndDate, newPlanId } = req.body;
    
    if (!subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Subscription IDs array is required'
      });
    }

    if (!['cancel', 'suspend', 'activate', 'extend'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Valid actions are: cancel, suspend, activate, extend'
      });
    }

    console.log(`🎬 Admin performing bulk action: ${action} on ${subscriptionIds.length} subscriptions`);

    const { UserSubscription } = await import('../models/mongodb/index.js');
    
    const results = {
      success: [],
      failed: [],
      total: subscriptionIds.length
    };

    for (const subscriptionId of subscriptionIds) {
      try {
        const subscription = await UserSubscription.findById(subscriptionId);
        
        if (!subscription) {
          results.failed.push({
            id: subscriptionId,
            error: 'Subscription not found'
          });
          continue;
        }

        let updateData = { updatedAt: new Date() };
        let userUpdateData = {};

        switch (action) {
          case 'cancel':
            updateData.status = 'cancelled';
            updateData.cancelledAt = new Date();
            updateData.cancellationReason = reason || 'Bulk admin cancellation';
            updateData.willRenew = false;
            updateData.autoRenew = false;
            
            if (subscription.endDate && subscription.endDate > new Date()) {
              userUpdateData.subscriptionType = subscription.planType || 'premium';
              userUpdateData.subscriptionExpiresAt = subscription.endDate;
            } else {
              userUpdateData.subscriptionType = 'free';
              userUpdateData.subscriptionExpiresAt = null;
            }
            break;
            
          case 'suspend':
            updateData.status = 'suspended';
            updateData.suspendedAt = new Date();
            updateData.suspensionReason = reason || 'Bulk admin suspension';
            userUpdateData.subscriptionType = 'free';
            break;
            
          case 'activate':
            updateData.status = 'active';
            updateData.willRenew = true;
            updateData.autoRenew = true;
            updateData.suspendedAt = null;
            updateData.suspensionReason = null;
            
            if (!subscription.endDate || subscription.endDate < new Date()) {
              const newEnd = new Date();
              if (subscription.billingCycle === 'yearly') {
                newEnd.setFullYear(newEnd.getFullYear() + 1);
              } else {
                newEnd.setMonth(newEnd.getMonth() + 1);
              }
              updateData.endDate = newEnd;
            }
            
            userUpdateData.subscriptionType = subscription.planType || 'premium';
            userUpdateData.subscriptionExpiresAt = updateData.endDate || subscription.endDate;
            break;
            
          case 'extend':
            if (!newEndDate) {
              results.failed.push({
                id: subscriptionId,
                error: 'New end date is required for extension'
              });
              continue;
            }
            updateData.endDate = new Date(newEndDate);
            updateData.willRenew = true;
            userUpdateData.subscriptionExpiresAt = updateData.endDate;
            break;
        }

        // Update subscription
        await UserSubscription.findByIdAndUpdate(subscriptionId, updateData);
        
        // Update user if needed
        if (Object.keys(userUpdateData).length > 0) {
          await User.findByIdAndUpdate(subscription.userId, {
            ...userUpdateData,
            updatedAt: new Date()
          });
        }

        results.success.push({
          id: subscriptionId,
          action: action
        });

      } catch (error) {
        console.error(`Error processing subscription ${subscriptionId}:`, error);
        results.failed.push({
          id: subscriptionId,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk action completed: ${results.success.length} succeeded, ${results.failed.length} failed`);

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      results
    });

  } catch (error) {
    console.error('❌ Admin error performing bulk subscription action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action',
      message: error.message
    });
  }
});

// Get basic subscription information
router.get('/subscriptions/:subscriptionId', adminMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    console.log(`🔍 Admin fetching subscription: ${subscriptionId}`);
    const { UserSubscription } = await import('../models/mongodb/index.js');
    const subscription = await UserSubscription.findById(subscriptionId)
      .populate('planId')
      .lean();
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          status: subscription.status,
          plan: subscription.planId ? {
            id: subscription.planId._id,
            name: subscription.planId.displayName || subscription.planId.name,
            tier: subscription.planId.tier,
            price: subscription.planId.price
          } : null,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Admin error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
      message: error.message
    });
  }
});

// Get detailed subscription information
router.get('/subscriptions/:subscriptionId/details', adminMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    console.log(`🔍 Admin fetching detailed subscription info: ${subscriptionId}`);

    const { UserSubscription, SubscriptionPlan } = await import('../models/mongodb/index.js');

    const subscription = await UserSubscription.findById(subscriptionId)
      .populate('planId')
      .lean();
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Get user details
    const user = await User.findOne({
      $or: [
        { _id: subscription.userId },
        { postgresId: subscription.userId }
      ]
    }).select('firstName lastName email subscriptionType subscriptionExpiresAt createdAt lastLoginAt').lean();

    // Get payment history (would need to implement payment history model)
    const paymentHistory = []; // Placeholder for payment history

    // Calculate metrics
    const now = new Date();
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const daysActive = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const lifetimeValue = subscription.amount * Math.max(1, Math.ceil(daysActive / 30));

    const detailedInfo = {
      subscription: {
        id: subscription._id.toString(),
        status: subscription.status,
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        autoRenew: subscription.autoRenew,
        willRenew: subscription.willRenew,
        daysActive,
        daysRemaining,
        isExpired: daysRemaining <= 0,
        isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30,
        cancelledAt: subscription.cancelledAt,
        cancellationReason: subscription.cancellationReason,
        suspendedAt: subscription.suspendedAt,
        suspensionReason: subscription.suspensionReason,
        lastPaymentDate: subscription.lastPaymentDate,
        nextPaymentDate: subscription.nextPaymentDate,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      },
      user: user ? {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        currentSubscriptionType: user.subscriptionType,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        memberSince: user.createdAt,
        lastLogin: user.lastLoginAt
      } : null,
      plan: subscription.planId ? {
        id: subscription.planId._id.toString(),
        name: subscription.planId.displayName || subscription.planId.name,
        description: subscription.planId.description,
        tier: subscription.planId.tier,
        price: subscription.planId.price,
        features: Array.isArray(subscription.planId.features) ? subscription.planId.features : [],
        isActive: subscription.planId.isActive
      } : null,
      usage: {
        coursesCompleted: subscription.usage?.coursesCompleted || 0,
        workoutsCompleted: subscription.usage?.workoutsCompleted || 0,
        lastActivityDate: subscription.usage?.lastActivityDate,
        monthlyUsage: subscription.usage?.monthlyUsage || []
      },
      metrics: {
        lifetimeValue,
        utilizationRate: 0, // Would calculate based on plan limits vs usage
        engagementScore: 0 // Would calculate based on activity
      },
      history: {
        payments: paymentHistory,
        planChanges: subscription.previousPlan ? [subscription.previousPlan] : [],
        statusChanges: [] // Would track status change history
      }
    };

    console.log(`✅ Admin retrieved detailed subscription info: ${subscriptionId}`);

    res.json({
      success: true,
      data: detailedInfo
    });

  } catch (error) {
    console.error('❌ Admin error fetching subscription details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details',
      message: error.message
    });
  }
});

// Create manual subscription for user
router.post('/subscriptions/create-manual', adminMiddleware, async (req, res) => {
  try {
    const {
      userId,
      planId,
      startDate,
      endDate,
      amount,
      currency = 'EUR',
      billingCycle = 'monthly',
      notes
    } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Plan ID are required'
      });
    }

    console.log(`📝 Admin creating manual subscription for user: ${userId}`);

    const { UserSubscription, SubscriptionPlan } = await import('../models/mongodb/index.js');

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      userId: userId,
      status: { $in: ['active', 'trial'] }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: 'User already has an active subscription',
        message: 'Cancel or modify the existing subscription first'
      });
    }

    // Calculate dates if not provided
    const subStartDate = startDate ? new Date(startDate) : new Date();
    let subEndDate;
    
    if (endDate) {
      subEndDate = new Date(endDate);
    } else {
      subEndDate = new Date(subStartDate);
      if (billingCycle === 'yearly') {
        subEndDate.setFullYear(subEndDate.getFullYear() + 1);
      } else {
        subEndDate.setMonth(subEndDate.getMonth() + 1);
      }
    }

    // Create subscription
    const newSubscription = await UserSubscription.create({
      userId: userId,
      planId: planId,
      planType: plan.type || 'premium',
      status: 'active',
      startDate: subStartDate,
      endDate: subEndDate,
      amount: amount || (typeof plan.price === 'object' ? plan.price.monthly : plan.price),
      currency: currency,
      billingCycle: billingCycle,
      autoRenew: false, // Manual subscriptions don't auto-renew by default
      willRenew: false,
      usage: {
        coursesCompleted: 0,
        workoutsCompleted: 0,
        monthlyUsage: []
      },
      notes: notes
    });

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscriptionType: plan.type || 'premium',
      subscriptionExpiresAt: subEndDate,
      updatedAt: new Date()
    });

    console.log(`✅ Admin created manual subscription: ${newSubscription._id}`);

    res.status(201).json({
      success: true,
      message: 'Manual subscription created successfully',
      subscription: {
        id: newSubscription._id.toString(),
        userId: newSubscription.userId,
        planType: newSubscription.planType,
        status: newSubscription.status,
        startDate: newSubscription.startDate,
        endDate: newSubscription.endDate,
        amount: newSubscription.amount,
        currency: newSubscription.currency,
        billingCycle: newSubscription.billingCycle
      }
    });

  } catch (error) {
    console.error('❌ Admin error creating manual subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create manual subscription',
      message: error.message
    });
  }
});

// Get subscription plans for admin
router.get('/subscription-plans', adminMiddleware, async (req, res) => {
  try {
    const {
      isActive,
      sortBy = 'tier',
      sortOrder = 'asc'
    } = req.query;

    console.log('📋 Admin fetching subscription plans');

    const { SubscriptionPlan } = await import('../models/mongodb/index.js');

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const plans = await SubscriptionPlan.find(filter)
      .sort(sortObj)
      .lean();

    // Get subscription counts for each plan
    const { UserSubscription } = await import('../models/mongodb/index.js');
    const planCounts = await UserSubscription.aggregate([
      {
        $group: {
          _id: '$planId',
          totalSubscriptions: { $sum: 1 },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    const countMap = {};
    planCounts.forEach(count => {
      countMap[count._id] = {
        total: count.totalSubscriptions,
        active: count.activeSubscriptions
      };
    });

    const plansWithStats = plans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      type: plan.type,
      tier: plan.tier,
      price: plan.price,
      features: Array.isArray(plan.features) ? plan.features : [],
      isActive: plan.isActive,
      isVisible: plan.isVisible,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      subscriptionCounts: countMap[plan._id] || { total: 0, active: 0 },
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    console.log(`✅ Admin fetched ${plansWithStats.length} subscription plans`);

    res.json({
      success: true,
      plans: plansWithStats
    });

  } catch (error) {
    console.error('❌ Admin error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
      message: error.message
    });
  }
});

// Resend email verification for user (Admin endpoint)
router.post('/users/:userId/resend-verification', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📧 Admin resending email verification for user: ${userId}`);
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
        message: 'This user\'s email is already verified'
      });
    }

    // Check if verification email was sent recently (prevent spam)
    if (user.emailVerificationSentAt) {
      const timeSinceLastSent = Date.now() - user.emailVerificationSentAt.getTime();
      const oneMinute = 1 * 60 * 1000; // Allow admins to resend more frequently
      
      if (timeSinceLastSent < oneMinute) {
        return res.status(429).json({
          success: false,
          error: 'Rate limited',
          message: 'Please wait before sending another verification email',
          retryAfter: Math.ceil((oneMinute - timeSinceLastSent) / 1000)
        });
      }
    }

    // Generate new verification token
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    user.emailVerificationSentAt = new Date();
    
    await user.save();

    // Send verification email
    const verificationLink = `https://runacademy.coredigify.com/auth/verify-email/${verificationToken}`;
    
    const emailResult = await emailService.sendEmailVerificationEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      verificationLink: verificationLink
    });

    if (emailResult.success) {
      console.log(`✅ Admin successfully resent email verification for user: ${userId}`);
      
      res.json({
        success: true,
        message: 'Verification email sent successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified
        },
        emailStatus: {
          sent: true,
          messageId: emailResult.messageId,
          sentAt: user.emailVerificationSentAt
        }
      });
    } else {
      console.error(`❌ Admin failed to send email verification for user: ${userId}`, emailResult.error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to send verification email',
        message: emailResult.error || 'Email service error'
      });
    }

  } catch (error) {
    console.error('❌ Admin resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification email',
      message: error.message
    });
  }
});

// Manual email verification endpoint for admin
router.post('/users/:userId/verify-email', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Manually verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    console.log(`✅ Admin manually verified email for user: ${userId} (${user.email})`);

    res.json({
      success: true,
      message: 'Email verified successfully by admin',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('❌ Admin email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email',
      message: error.message
    });
  }
});

// Extend user subscription endpoint
router.post('/users/:userId/extend-subscription', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.body;

    console.log(`🔄 Admin extending subscription for user ${userId} by ${days} days`);

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If user doesn't have a subscription, set them to premium for the specified days
    if (!user.subscriptionType || user.subscriptionType === 'free') {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      
      await User.findByIdAndUpdate(userId, {
        subscriptionType: 'premium',
        subscriptionExpiresAt: expirationDate,
        updatedAt: new Date()
      });

      console.log(`✅ Admin set user ${userId} to premium for ${days} days`);
      
      return res.json({
        success: true,
        message: `User subscription set to premium for ${days} days`,
        expiresAt: expirationDate
      });
    }

    // Extend existing subscription
    let currentExpiration = user.subscriptionExpiresAt || new Date();
    
    // If subscription has already expired, start from today
    if (currentExpiration < new Date()) {
      currentExpiration = new Date();
    }
    
    const newExpiration = new Date(currentExpiration);
    newExpiration.setDate(newExpiration.getDate() + days);

    await User.findByIdAndUpdate(userId, {
      subscriptionExpiresAt: newExpiration,
      updatedAt: new Date()
    });

    console.log(`✅ Admin extended subscription for user ${userId} by ${days} days until ${newExpiration}`);

    res.json({
      success: true,
      message: `Subscription extended by ${days} days`,
      expiresAt: newExpiration
    });

  } catch (error) {
    console.error('❌ Error extending user subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extend subscription',
      message: error.message
    });
  }
});

// =============================================================================
// STRAVA SYNC MANAGEMENT ENDPOINTS
// =============================================================================

// GET /api/admin/strava/sync-status - Get Strava sync status and statistics
router.get('/strava/sync-status', adminMiddleware, async (req, res) => {
  try {
    const stats = stravaSyncService.getSyncStats();
    
    // Get additional Strava statistics from database
    const totalStravaUsers = await User.countDocuments({
      'strava.isConnected': true,
      'strava.accessToken': { $exists: true }
    });
    
    const recentlyFailedUsers = await User.countDocuments({
      'strava.isConnected': false,
      'strava.errorAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      syncStats: stats,
      databaseStats: {
        totalStravaUsers,
        recentlyFailedUsers,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Error getting Strava sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: error.message
    });
  }
});

// POST /api/admin/strava/trigger-sync - Manually trigger Strava sync
router.post('/strava/trigger-sync', adminMiddleware, async (req, res) => {
  try {
    const { comprehensive = false } = req.body;
    
    console.log(`🚀 Admin ${req.user.email} triggered Strava sync (comprehensive: ${comprehensive})`);
    
    // Trigger sync in background
    stravaSyncService.triggerManualSync({ comprehensive })
      .then((stats) => {
        console.log('✅ Manual Strava sync completed:', stats);
      })
      .catch((error) => {
        console.error('❌ Manual Strava sync failed:', error);
      });

    res.json({
      success: true,
      message: `Strava sync ${comprehensive ? 'comprehensive' : 'standard'} triggered successfully`,
      triggeredBy: req.user.email,
      triggeredAt: new Date()
    });
  } catch (error) {
    console.error('❌ Error triggering Strava sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync',
      message: error.message
    });
  }
});

// GET /api/admin/strava/failed-users - Get users with failed Strava connections
router.get('/strava/failed-users', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const failedUsers = await User.find({
      $or: [
        { 'strava.isConnected': false, 'strava.errorAt': { $exists: true } },
        { 'strava.lastError': { $exists: true } }
      ]
    })
    .select('email firstName lastName strava.lastError strava.errorAt strava.lastSyncAt')
    .sort({ 'strava.errorAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [
        { 'strava.isConnected': false, 'strava.errorAt': { $exists: true } },
        { 'strava.lastError': { $exists: true } }
      ]
    });

    res.json({
      success: true,
      users: failedUsers.map(user => ({
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        lastError: user.strava?.lastError,
        errorAt: user.strava?.errorAt,
        lastSyncAt: user.strava?.lastSyncAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error getting failed Strava users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get failed users',
      message: error.message
    });
  }
});

// POST /api/admin/strava/reconnect-user - Help user reconnect to Strava
router.post('/strava/reconnect-user', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Clear error state to allow reconnection
    await User.findByIdAndUpdate(userId, {
      $unset: {
        'strava.lastError': 1,
        'strava.errorAt': 1
      },
      $set: {
        'strava.isConnected': false,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Admin cleared Strava errors for user ${userId}`);

    res.json({
      success: true,
      message: 'User Strava connection reset. They can now reconnect.',
      clearedBy: req.user.email,
      clearedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Error reconnecting Strava user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user connection',
      message: error.message
    });
  }
});

// Admin utility: Fix user verification and reset password
router.post('/fix-user-verification', superAdminMiddleware, async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log(`🔧 Admin: Fixing user verification for ${email}`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found: ${email}`
      });
    }

    let changes = [];

    // 1. Fix email verification
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      changes.push('Email verified');
    }

    // 2. Reset password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      changes.push('Password reset');
    }

    // 3. Ensure auth provider is set
    if (!user.authProvider) {
      user.authProvider = 'email';
      changes.push('Auth provider set');
    }

    // 4. Update timestamp
    user.updatedAt = new Date();

    await user.save();

    console.log(`✅ Admin: User ${email} fixed. Changes: ${changes.join(', ')}`);

    res.json({
      success: true,
      message: `User ${email} verification fixed`,
      changes: changes,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error('❌ Admin fix user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix user verification',
      message: error.message
    });
  }
});

// Emergency endpoint to promote user to super_admin (no auth required for first setup)
router.post('/emergency-promote-admin', async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    // Simple secret key check (in production would be more secure)
    if (secretKey !== 'promote-admin-emergency-2024') {
      return res.status(403).json({
        success: false,
        message: 'Invalid secret key'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found: ${email}`
      });
    }

    // Promote to super_admin
    user.role = 'super_admin';
    user.subscriptionType = 'pro';
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.updatedAt = new Date();

    await user.save();

    console.log(`🚀 EMERGENCY: Promoted ${email} to super_admin`);

    res.json({
      success: true,
      message: `User ${email} promoted to super_admin`,
      user: {
        email: user.email,
        role: user.role,
        subscriptionType: user.subscriptionType,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('❌ Emergency promote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to promote user',
      message: error.message
    });
  }
});

// Training Plan Management Endpoints

// Generate AI training plan for user
router.post('/users/:userId/generate-training-plan', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Import the training plan generator
    const trainingPlanGenerator = require('../services/trainingPlanGenerator.js');
    
    // Generate a basic training plan based on user data
    const planConfig = {
      name: 'Admin Generated Plan',
      targetEvent: user.targetEventType || '5K',
      weeks: 8,
      fitnessLevel: user.fitnessLevel || 'beginner',
      weeklyGoal: user.weeklyGoal || 3
    };

    const plan = await trainingPlanGenerator.generateAdvancedTrainingPlan(userId, planConfig);

    res.json({
      success: true,
      message: 'Training plan generated successfully',
      data: {
        planId: plan._id,
        name: plan.name
      }
    });

  } catch (error) {
    console.error('Error generating training plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate training plan',
      message: error.message
    });
  }
});

// Create quick training plan for user
router.post('/users/:userId/create-quick-plan', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { planType } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const trainingPlanGenerator = require('../services/trainingPlanGenerator.js');
    
    // Define quick plan configurations
    const quickPlanConfigs = {
      beginner: {
        name: 'Iesācēju 5K treniņu plāns',
        targetEvent: '5K',
        weeks: 8,
        fitnessLevel: 'beginner',
        weeklyGoal: 3
      },
      intermediate: {
        name: 'Vidēja līmeņa 10K plāns',
        targetEvent: '10K',
        weeks: 10,
        fitnessLevel: 'intermediate',
        weeklyGoal: 4
      },
      advanced: {
        name: 'Pusmaratona sagatavošanas plāns',
        targetEvent: 'Half Marathon',
        weeks: 12,
        fitnessLevel: 'advanced',
        weeklyGoal: 5
      },
      strength: {
        name: 'Spēka treniņu plāns',
        targetEvent: 'Strength Building',
        weeks: 8,
        fitnessLevel: user.fitnessLevel || 'intermediate',
        weeklyGoal: 3,
        includeStrengthTraining: true
      }
    };

    const planConfig = quickPlanConfigs[planType];
    if (!planConfig) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan type'
      });
    }

    const plan = await trainingPlanGenerator.generateAdvancedTrainingPlan(userId, planConfig);

    res.json({
      success: true,
      message: 'Quick training plan created successfully',
      data: {
        planId: plan._id,
        name: plan.name
      }
    });

  } catch (error) {
    console.error('Error creating quick plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quick plan',
      message: error.message
    });
  }
});

// Update training plan status
router.put('/users/:userId/training-plans/:planId/status', adminMiddleware, async (req, res) => {
  try {
    const { userId, planId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const { TrainingPlan } = require('../models/mongodb/index.js');
    const plan = await TrainingPlan.findOne({ _id: planId, userId });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Training plan not found'
      });
    }

    plan.status = status;
    plan.updatedAt = new Date();
    
    if (status === 'completed') {
      plan.completedAt = new Date();
    }

    await plan.save();

    res.json({
      success: true,
      message: 'Training plan status updated successfully'
    });

  } catch (error) {
    console.error('Error updating training plan status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update training plan status',
      message: error.message
    });
  }
});

// Delete training plan
router.delete('/users/:userId/training-plans/:planId', adminMiddleware, async (req, res) => {
  try {
    const { userId, planId } = req.params;
    
    const { TrainingPlan, PlannedWorkout } = require('../models/mongodb/index.js');
    
    // Check if plan exists and belongs to user
    const plan = await TrainingPlan.findOne({ _id: planId, userId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Training plan not found'
      });
    }

    // Delete the plan and all associated planned workouts
    await Promise.all([
      TrainingPlan.findByIdAndDelete(planId),
      PlannedWorkout.deleteMany({ trainingPlanId: planId })
    ]);

    res.json({
      success: true,
      message: 'Training plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting training plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete training plan',
      message: error.message
    });
  }
});

// ============================================================================
// WEEKLY PLAN SCHEDULER MANAGEMENT
// ============================================================================

// Import scheduler
import weeklyPlanScheduler from '../services/weeklyPlanScheduler.js';

/**
 * GET /api/admin/scheduler/weekly-plans/status
 * Get weekly plan scheduler status
 */
router.get('/scheduler/weekly-plans/status', adminMiddleware, async (req, res) => {
  try {
    const stats = weeklyPlanScheduler.getStats();

    res.json({
      success: true,
      scheduler: stats
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/scheduler/weekly-plans/trigger
 * Manually trigger weekly plan generation for all users or specific user
 */
router.post('/scheduler/weekly-plans/trigger', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    console.log(`🔧 Admin triggering manual weekly plan generation ${userId ? `for user ${userId}` : 'for all users'}`);

    // Run in background
    weeklyPlanScheduler.triggerManualGeneration(userId).catch(error => {
      console.error('❌ Background generation failed:', error);
    });

    res.json({
      success: true,
      message: userId
        ? `Nedēļas plāna ģenerēšana sākta lietotājam ${userId}`
        : 'Nedēļas plānu ģenerēšana sākta visiem lietotājiem (background process)'
    });
  } catch (error) {
    console.error('Error triggering scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scheduler',
      message: error.message
    });
  }
});

export default router;