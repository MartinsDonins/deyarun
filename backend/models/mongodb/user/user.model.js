// MongoDB User Model with Firebase Integration
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Firebase Integration
  firebaseUID: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to not violate uniqueness
    index: true
  },
  
  // PostgreSQL User ID (for migration compatibility)
  postgresId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  // Basic Identity
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    select: true // Include password field by default (can be excluded when needed)
  },
  
  // OAuth Integration
  googleId: {
    type: String,
    unique: true,
    sparse: true, // This allows multiple null/undefined values
    index: true
  },
  supabaseId: {
    type: String,
    sparse: true,
    unique: true
  },
  profilePicture: String,
  
  // Personal Information
  phone: String,
  birthDate: {
    type: Date,
    required: true
  },
  age: Number, // Auto-calculated from birthDate
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  
  // Physical Profile
  weight: Number, // in kg or lbs based on units preference
  height: Number, // in cm or inches based on units preference
  
  // Running Profile & Training Assessment
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  weeklyGoal: {
    type: Number,
    default: 20 // target km per week
  },
  preferredPace: Number, // target pace in min/km
  runningExperience: {
    type: String,
    enum: ['never', 'beginner', 'recreational', 'competitive'],
    default: 'beginner'
  },
  injuryHistory: String,
  preferredDistance: {
    type: String,
    enum: ['5k', '10k', 'half-marathon', 'marathon'],
    default: '5k'
  },

  // Detailed Training Profile
  hasRunningExperience: {
    type: Boolean,
    default: false
  },
  longestRunEver: Number, // Garākā noskrietā distance
  longestRunLastMonth: Number, // Garākā distance pēdējā mēnesī
  personalBest5k: Number, // PB 5k in seconds
  personalBest10k: Number, // PB 10k in seconds
  personalBestHalfMarathon: Number, // PB half marathon in seconds
  personalBestMarathon: Number, // PB marathon in seconds

  // Training Frequency & Activities
  workoutsPerWeekCurrent: {
    type: Number,
    default: 0
  },
  workoutsPerWeekLastMonth: {
    type: Number,
    default: 0
  },
  strengthTrainingPerWeek: {
    type: Number,
    default: 0
  },
  coreTrainingPerWeek: {
    type: Number,
    default: 0
  },
  otherActivities: String,

  // Equipment & Gear
  hasRunningShoes: {
    type: Boolean,
    default: false
  },
  runningShoesBrand: String,
  runningShoesModel: String,
  hasHeartRateMonitor: {
    type: Boolean,
    default: false
  },
  monitorsHeartRate: {
    type: Boolean,
    default: false
  },
  hasStressTest: {
    type: Boolean,
    default: false
  },

  // Health & Medical
  medicalConditions: String,
  currentInjuries: String,
  currentPain: String,
  hasExcessWeight: {
    type: Boolean,
    default: false
  },
  needsWalkingStart: {
    type: Boolean,
    default: false
  },

  // Training Goals & Preferences
  targetEventType: {
    type: String,
    enum: ['general', '5k', '10k', 'half-marathon', 'marathon'],
    default: 'general'
  },
  targetEventDate: Date,
  maxHeartRate: Number,
  restingHeartRate: Number,
  trainingIntensityPref: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },

  // Recovery & Lifestyle
  sleepHours: {
    type: Number,
    default: 8.0
  },
  sleepHoursPerNight: {
    type: Number,
    default: 8.0
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  nutritionQuality: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  hydrationLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },

  // App Preferences
  timezone: {
    type: String,
    default: 'UTC'
  },
  units: {
    type: String,
    enum: ['metric', 'imperial'],
    default: 'metric'
  },
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  },
  
  // Dashboard Configuration
  dashboardConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },

  // Detailed notification preferences
  notificationPreferences: {
    workoutReminders: {
      type: Boolean,
      default: true
    },
    achievementAlerts: {
      type: Boolean,
      default: true
    },
    courseUpdates: {
      type: Boolean,
      default: true
    },
    weeklyProgress: {
      type: Boolean,
      default: true
    },
    socialUpdates: {
      type: Boolean,
      default: false
    },
    systemUpdates: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: {
        type: String,
        default: '22:00'
      },
      end: {
        type: String,
        default: '08:00'
      }
    }
  },
  locationSharingEnabled: {
    type: Boolean,
    default: false
  },

  // Admin notification preferences (only for admin users)
  adminNotificationPreferences: {
    type: {
      receiveUserSignups: {
        type: Boolean,
        default: true
      },
      receiveErrorAlerts: {
        type: Boolean,
        default: true
      },
      receiveSystemUpdates: {
        type: Boolean,
        default: true
      },
      receiveWeeklyReports: {
        type: Boolean,
        default: true
      },
      receiveSecurityAlerts: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false
        },
        start: {
          type: String,
          default: '22:00'
        },
        end: {
          type: String,
          default: '08:00'
        }
      }
    },
    default: null // Only set for admin users
  },

  // Profile Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Email Verification
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  emailVerificationSentAt: {
    type: Date,
    default: null
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  avatarUrl: String,

  // User Roles and Permissions
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin', 'coach'],
    default: 'user'
  },
  subscriptionType: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null // null means no expiration for free plan
  },
  permissions: [String], // Custom permissions array

  // Statistics (aggregated from workouts)
  totalWorkouts: {
    type: Number,
    default: 0
  },
  totalDistance: {
    type: Number,
    default: 0 // Total distance in km
  },
  totalDuration: {
    type: Number,
    default: 0 // Total workout time in seconds
  },
  bestPace: Number, // Best pace in min/km
  longestRun: {
    type: Number,
    default: 0 // Longest single run in km
  },

  // App Usage Analytics
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingCompletedAt: {
    type: Date,
    default: null
  },
  firstWorkoutDate: Date,
  
  // News and notifications tracking
  lastNewsRead: {
    type: Date,
    default: Date.now
  },
  readNews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News'
  }],
  
  // Privacy Settings
  profileVisibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  workoutVisibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  },
  leaderboardOptIn: {
    type: Boolean,
    default: true
  },

  // Notification Preferences
  workoutReminders: {
    type: Boolean,
    default: true
  },
  friendActivity: {
    type: Boolean,
    default: true
  },
  achievements: {
    type: Boolean,
    default: true
  },
  trainingPlanUpdates: {
    type: Boolean,
    default: true
  },

  // App Behavior
  autoStartGPS: {
    type: Boolean,
    default: false
  },
  autoPauseEnabled: {
    type: Boolean,
    default: true
  },
  voiceCoaching: {
    type: Boolean,
    default: true
  },

  // Data Preferences
  syncWithHealthApp: {
    type: Boolean,
    default: false
  },
  shareWithCoach: {
    type: Boolean,
    default: false
  },

  // Strava Integration
  strava: {
    isConnected: {
      type: Boolean,
      default: false
    },
    athleteId: {
      type: Number,
      sparse: true,
      index: true
    },
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    connectedAt: Date,
    lastSyncAt: Date,
    lastSyncCount: {
      type: Number,
      default: 0
    },
    athlete: {
      id: Number,
      username: String,
      firstname: String,
      lastname: String,
      city: String,
      state: String,
      country: String,
      sex: {
        type: String,
        enum: ['M', 'F', null]
      },
      premium: Boolean,
      summit: Boolean,
      profile: String,
      profile_medium: String
    },
    updatedAt: Date
  },

  // Integrations
  integrations: {
    googleFit: {
      connected: {
        type: Boolean,
        default: false
      },
      accessToken: String,
      refreshToken: String,
      tokenType: String,
      expiryDate: Number,
      connectedAt: Date,
      lastSyncAt: Date,
      lastSyncCount: {
        type: Number,
        default: 0
      }
    }
  },

  // Device tokens for push notifications
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    deviceInfo: {
      type: Object,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
    }
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'users' // Explicit collection name
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
userSchema.virtual('calculatedAge').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birth = new Date(this.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ firebaseUID: 1 });
userSchema.index({ postgresId: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ subscriptionType: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });

// Pre-save middleware to calculate age, hash password, and handle null OAuth IDs
userSchema.pre('save', async function(next) {
  if (this.birthDate) {
    this.age = this.calculatedAge;
  }
  
  // Hash password if it's new or modified
  if (this.isNew || this.isModified('password')) {
    if (this.password) {
      console.log(`🔍 MODEL MIDDLEWARE: Hashing password for ${this.email}`);
      console.log(`🔍 MODEL MIDDLEWARE: Input password length: ${this.password.length}`);
      console.log(`🔍 MODEL MIDDLEWARE: Is password already hashed? ${this.password.startsWith('$2b$') ? 'YES' : 'NO'}`);
      
      // Only hash if password is not already hashed
      if (!this.password.startsWith('$2b$') && !this.password.startsWith('$2a$')) {
        const saltRounds = 12;
        const originalPassword = this.password;
        this.password = await bcrypt.hash(this.password, saltRounds);
        console.log(`🔍 MODEL MIDDLEWARE: Password hashed successfully`);
        console.log(`🔍 MODEL MIDDLEWARE: Hash length: ${this.password.length}`);
        
        // Test the hash immediately
        const testVerify = await bcrypt.compare(originalPassword, this.password);
        console.log(`🔍 MODEL MIDDLEWARE: Hash verification test: ${testVerify ? '✅ PASS' : '❌ FAIL'}`);
      } else {
        console.log(`⚠️ MODEL MIDDLEWARE: Password already hashed, skipping`);
      }
    }
  }
  
  // Remove null/undefined OAuth IDs to prevent unique index conflicts
  if (this.googleId === null || this.googleId === undefined) {
    this.googleId = undefined;
  }
  if (this.supabaseId === null || this.supabaseId === undefined) {
    this.supabaseId = undefined;
  }
  if (this.firebaseUID === null || this.firebaseUID === undefined) {
    this.firebaseUID = undefined;
  }
  
  next();
});

// Methods
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  delete user.password; // Don't include password in JSON output
  return user;
};

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Statics
userSchema.statics.findByFirebaseUID = function(firebaseUID) {
  return this.findOne({ firebaseUID });
};

userSchema.statics.findByPostgresId = function(postgresId) {
  return this.findOne({ postgresId });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

export default User;