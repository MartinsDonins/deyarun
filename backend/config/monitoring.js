// Production Monitoring Configuration
// Centralized configuration for system monitoring, alerts, and performance thresholds

export const MONITORING_CONFIG = {
  // Performance thresholds
  thresholds: {
    api: {
      responseTime: {
        warning: 1000,    // 1 second
        critical: 3000    // 3 seconds
      },
      errorRate: {
        warning: 2,       // 2%
        critical: 5       // 5%
      },
      throughput: {
        min: 10           // Minimum requests per minute
      }
    },
    database: {
      responseTime: {
        warning: 500,     // 500ms
        critical: 1000    // 1 second
      },
      connections: {
        warning: 70,      // 70% of max connections
        critical: 85      // 85% of max connections
      },
      slowQueries: {
        warning: 5,       // 5 slow queries in 5 minutes
        critical: 15      // 15 slow queries in 5 minutes
      }
    },
    system: {
      memory: {
        warning: 80,      // 80% memory usage
        critical: 90      // 90% memory usage
      },
      cpu: {
        warning: 70,      // 70% CPU usage
        critical: 85      // 85% CPU usage
      },
      disk: {
        warning: 85,      // 85% disk usage
        critical: 95      // 95% disk usage
      }
    },
    mobile: {
      crashRate: {
        warning: 1,       // 1% crash rate
        critical: 2       // 2% crash rate
      },
      sessionLength: {
        min: 60           // Minimum 1 minute average session
      }
    },
    web: {
      bounceRate: {
        warning: 60,      // 60% bounce rate
        critical: 80      // 80% bounce rate
      },
      loadTime: {
        warning: 2000,    // 2 seconds
        critical: 5000    // 5 seconds
      }
    }
  },

  // Alert configurations
  alerts: [
    {
      id: 'api_response_time_high',
      name: 'API Response Time High',
      type: 'warning',
      condition: 'Average response time > 1000ms for 5 minutes',
      enabled: true,
      cooldown: 300000, // 5 minutes
      actions: ['email', 'webhook'],
      severity: 'medium'
    },
    {
      id: 'api_response_time_critical',
      name: 'API Response Time Critical',
      type: 'critical',
      condition: 'Average response time > 3000ms for 2 minutes',
      enabled: true,
      cooldown: 180000, // 3 minutes
      actions: ['email', 'sms', 'webhook'],
      severity: 'high'
    },
    {
      id: 'database_connection_pool_full',
      name: 'Database Connection Pool Nearly Full',
      type: 'warning',
      condition: 'Active connections > 70% of max pool size',
      enabled: true,
      cooldown: 600000, // 10 minutes
      actions: ['email'],
      severity: 'medium'
    },
    {
      id: 'database_down',
      name: 'Database Connection Lost',
      type: 'critical',
      condition: 'Database health check fails',
      enabled: true,
      cooldown: 0, // Immediate alert
      actions: ['email', 'sms', 'webhook', 'pagerduty'],
      severity: 'critical'
    },
    {
      id: 'high_error_rate',
      name: 'High API Error Rate',
      type: 'critical',
      condition: 'Error rate > 5% for 5 minutes',
      enabled: true,
      cooldown: 300000, // 5 minutes
      actions: ['email', 'webhook'],
      severity: 'high'
    },
    {
      id: 'mobile_crash_rate_high',
      name: 'Mobile App Crash Rate High',
      type: 'critical',
      condition: 'Mobile crash rate > 2%',
      enabled: true,
      cooldown: 1800000, // 30 minutes
      actions: ['email'],
      severity: 'high'
    },
    {
      id: 'server_memory_high',
      name: 'Server Memory Usage High',
      type: 'warning',
      condition: 'Memory usage > 80% for 10 minutes',
      enabled: true,
      cooldown: 600000, // 10 minutes
      actions: ['email'],
      severity: 'medium'
    },
    {
      id: 'server_memory_critical',
      name: 'Server Memory Usage Critical',
      type: 'critical',
      condition: 'Memory usage > 90%',
      enabled: true,
      cooldown: 300000, // 5 minutes
      actions: ['email', 'webhook'],
      severity: 'high'
    },
    {
      id: 'disk_space_low',
      name: 'Low Disk Space',
      type: 'warning',
      condition: 'Disk usage > 85%',
      enabled: true,
      cooldown: 3600000, // 1 hour
      actions: ['email'],
      severity: 'medium'
    },
    {
      id: 'web_load_time_slow',
      name: 'Web Application Load Time Slow',
      type: 'warning',
      condition: 'Average page load time > 2 seconds',
      enabled: true,
      cooldown: 900000, // 15 minutes
      actions: ['email'],
      severity: 'low'
    }
  ],

  // Notification channels
  notifications: {
    email: {
      enabled: true,
      recipients: [
        'martins.donins@gmail.com',
        'alerts@runacademy.com'
      ],
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      }
    },
    webhook: {
      enabled: true,
      urls: [
        process.env.SLACK_WEBHOOK_URL,
        process.env.DISCORD_WEBHOOK_URL
      ].filter(Boolean)
    },
    sms: {
      enabled: false, // Enable when SMS provider is configured
      provider: 'twilio',
      recipients: [
        '+37120000000' // Add actual phone numbers
      ]
    },
    pagerduty: {
      enabled: false, // Enable for critical production alerts
      integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY
    }
  },

  // Monitoring intervals
  intervals: {
    healthCheck: 30000,      // 30 seconds
    performanceCheck: 60000, // 1 minute
    alertEvaluation: 30000,  // 30 seconds
    cleanup: 3600000,        // 1 hour
    reportGeneration: 86400000 // 24 hours
  },

  // Data retention
  retention: {
    healthChecks: 7,         // 7 days
    performanceMetrics: 30,  // 30 days
    alerts: 90,              // 90 days
    errorLogs: 30            // 30 days
  },

  // Integration settings
  integrations: {
    sentry: {
      enabled: true,
      dsn: process.env.SENTRY_DSN,
      organization: 'coredigify',
      project: 'running-academy-backend'
    },
    logrocket: {
      enabled: true,
      appId: process.env.LOGROCKET_APP_ID || 'd2nxam/runacademy',
      apiKey: process.env.LOGROCKET_API_KEY
    },
    firebase: {
      enabled: true,
      projectId: process.env.FIREBASE_PROJECT_ID,
      crashlytics: true,
      analytics: true,
      performance: true
    },
    newrelic: {
      enabled: false, // Enable if New Relic is added
      appName: 'DeyaRun Backend',
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY
    }
  },

  // Dashboard settings
  dashboard: {
    autoRefresh: true,
    refreshInterval: 30000,  // 30 seconds
    defaultTimeRange: '24h',
    maxDataPoints: 1000,
    enableRealtime: true
  }
};

// Helper functions for monitoring
export const MonitoringHelpers = {
  /**
   * Check if a value exceeds threshold
   */
  exceedsThreshold(value, thresholds, type = 'warning') {
    return value > thresholds[type];
  },

  /**
   * Get alert severity based on condition
   */
  getAlertSeverity(condition, thresholds) {
    if (this.exceedsThreshold(condition, thresholds, 'critical')) {
      return 'critical';
    } else if (this.exceedsThreshold(condition, thresholds, 'warning')) {
      return 'warning';
    }
    return 'normal';
  },

  /**
   * Format uptime duration
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  /**
   * Check if alert is in cooldown period
   */
  isInCooldown(alert, lastTriggered) {
    if (!lastTriggered || !alert.cooldown) return false;
    const timeSinceLastAlert = Date.now() - new Date(lastTriggered).getTime();
    return timeSinceLastAlert < alert.cooldown;
  },

  /**
   * Generate monitoring report
   */
  generateHealthReport(systemHealth) {
    const report = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {},
      recommendations: []
    };

    // Analyze each service
    Object.keys(systemHealth).forEach(service => {
      const serviceHealth = systemHealth[service];
      report.services[service] = {
        status: serviceHealth.status || 'unknown',
        issues: [],
        metrics: serviceHealth
      };

      // Check for issues and recommendations
      if (service === 'backend' && serviceHealth.responseTime > 1000) {
        report.services[service].issues.push('High response time');
        report.recommendations.push('Investigate backend performance bottlenecks');
      }

      if (service === 'database' && serviceHealth.responseTime > 500) {
        report.services[service].issues.push('Slow database queries');
        report.recommendations.push('Review and optimize database queries');
      }

      // Update overall status
      if (serviceHealth.status === 'critical') {
        report.overall = 'critical';
      } else if (serviceHealth.status === 'warning' && report.overall === 'healthy') {
        report.overall = 'warning';
      }
    });

    return report;
  }
};

export default MONITORING_CONFIG;