import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  // Singleton pattern - only one settings document
  _id: {
    type: String,
    default: 'system_settings'
  },
  
  // General Settings
  general: {
    siteName: {
      type: String,
      default: 'DeyaRun'
    },
    siteDescription: {
      type: String,
      default: 'Personīgais skrējiena treneris un treniņu plānotājs'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    },
    defaultLanguage: {
      type: String,
      enum: ['lv', 'en'],
      default: 'lv'
    },
    timezone: {
      type: String,
      default: 'Europe/Riga'
    }
  },

  // Security Settings
  security: {
    sessionTimeout: {
      type: Number,
      default: 24,
      min: 1,
      max: 168
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    passwordMinLength: {
      type: Number,
      default: 8,
      min: 6,
      max: 32
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    enableTwoFactor: {
      type: Boolean,
      default: false
    },
    allowedDomains: [{
      type: String
    }]
  },

  // Email Settings
  email: {
    sendgridApiKey: {
      type: String,
      default: ''
    },
    fromEmail: {
      type: String,
      default: 'run@coredigify.com'
    },
    fromName: {
      type: String,
      default: 'DeyaRun'
    },
    adminEmail: {
      type: String,
      default: 'admin@coredigify.com'
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true
    }
  },

  // Notification Settings
  notifications: {
    enablePushNotifications: {
      type: Boolean,
      default: true
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true
    },
    enableSlackIntegration: {
      type: Boolean,
      default: false
    },
    slackWebhookUrl: {
      type: String,
      default: ''
    }
  },

  // API Settings
  api: {
    rateLimitEnabled: {
      type: Boolean,
      default: true
    },
    rateLimitRequests: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000
    },
    rateLimitWindow: {
      type: Number,
      default: 60,
      min: 60,
      max: 3600
    },
    enableCors: {
      type: Boolean,
      default: true
    },
    allowedOrigins: [{
      type: String
    }]
  },

  // Integration Settings
  integrations: {
    stravaClientId: {
      type: String,
      default: ''
    },
    stravaClientSecret: {
      type: String,
      default: ''
    },
    stravaVerifyToken: {
      type: String,
      default: ''
    },
    googleFitEnabled: {
      type: Boolean,
      default: false
    },
    garminEnabled: {
      type: Boolean,
      default: false
    },
    analyticsEnabled: {
      type: Boolean,
      default: true
    },
    googleAnalyticsId: {
      type: String,
      default: ''
    }
  },

  // Metadata
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'system_settings'
});

// Static method to get settings (creates default if not exists)
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findById('system_settings');
  
  if (!settings) {
    console.log('📋 Creating default system settings');
    settings = await this.create({
      _id: 'system_settings'
    });
  }
  
  return settings;
};

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function(newSettings, updatedBy) {
  console.log('💾 Updating system settings in database');
  
  const settings = await this.findByIdAndUpdate(
    'system_settings',
    {
      ...newSettings,
      lastUpdatedBy: updatedBy,
      lastUpdatedAt: new Date()
    },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  
  console.log('✅ System settings updated successfully');
  return settings;
};

// Method to merge with environment variables (environment takes precedence)
systemSettingsSchema.methods.mergeWithEnv = function() {
  const envOverrides = {
    general: {
      siteName: process.env.SITE_NAME || this.general.siteName,
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
      defaultLanguage: process.env.DEFAULT_LANGUAGE || this.general.defaultLanguage,
      timezone: process.env.TIMEZONE || this.general.timezone
    },
    security: {
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || this.security.sessionTimeout),
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || this.security.maxLoginAttempts),
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || this.security.passwordMinLength),
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
      enableTwoFactor: process.env.ENABLE_TWO_FACTOR === 'true',
      allowedDomains: process.env.ALLOWED_DOMAINS ? 
        process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim()) : 
        this.security.allowedDomains
    },
    email: {
      sendgridApiKey: process.env.SENDGRID_API_KEY || this.email.sendgridApiKey,
      fromEmail: process.env.FROM_EMAIL || this.email.fromEmail,
      fromName: process.env.FROM_NAME || this.email.fromName,
      adminEmail: process.env.ADMIN_EMAIL || this.email.adminEmail,
      enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false'
    },
    notifications: {
      enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
      enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
      enableSlackIntegration: process.env.ENABLE_SLACK_INTEGRATION === 'true',
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || this.notifications.slackWebhookUrl
    },
    api: {
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      rateLimitRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || this.api.rateLimitRequests),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || (this.api.rateLimitWindow * 1000)) / 1000,
      enableCors: process.env.ENABLE_CORS !== 'false',
      allowedOrigins: process.env.CORS_ORIGIN ? 
        process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
        this.api.allowedOrigins
    },
    integrations: {
      stravaClientId: process.env.STRAVA_CLIENT_ID || this.integrations.stravaClientId,
      stravaClientSecret: process.env.STRAVA_CLIENT_SECRET || this.integrations.stravaClientSecret,
      stravaVerifyToken: process.env.STRAVA_VERIFY_TOKEN || this.integrations.stravaVerifyToken,
      googleFitEnabled: process.env.GOOGLE_FIT_ENABLED === 'true',
      garminEnabled: process.env.GARMIN_ENABLED === 'true',
      analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false',
      googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || this.integrations.googleAnalyticsId
    }
  };

  return {
    ...this.toObject(),
    ...envOverrides,
    general: { ...this.general, ...envOverrides.general },
    security: { ...this.security, ...envOverrides.security },
    email: { ...this.email, ...envOverrides.email },
    notifications: { ...this.notifications, ...envOverrides.notifications },
    api: { ...this.api, ...envOverrides.api },
    integrations: { ...this.integrations, ...envOverrides.integrations }
  };
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;