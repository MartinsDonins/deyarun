import { UserSettings, SUPPORTED_TIMEZONES, SUPPORTED_LANGUAGES } from '../types/settings'
import { logger } from '../lib/productionLogger'

/**
 * Get default user settings
 */
export function getDefaultSettings(): UserSettings {
  return {
    notifications: {
      email: true,
      push: true,
      workout_reminders: true,
      achievement_alerts: true,
      weekly_summary: true,
      social_interactions: true
    },
    privacy: {
      profile_visibility: 'public',
      activity_visibility: 'public',
      leaderboard_participation: true,
      allow_friend_requests: true,
      show_real_name: true,
      show_location: false
    },
    integrations: {
      strava: {
        connected: false,
        auto_sync: true,
        sync_activities: true,
        sync_routes: false
      },
      garmin: {
        connected: false,
        auto_sync: true,
        sync_activities: true,
        sync_health_data: false
      },
      apple_health: {
        connected: false,
        sync_workouts: true,
        sync_heart_rate: false,
        sync_steps: false
      },
      google_fit: {
        connected: false,
        sync_activities: true,
        sync_health_metrics: false
      }
    },
    preferences: {
      units: 'metric',
      language: 'lv',
      timezone: 'Europe/Riga',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      default_activity_type: 'running',
      auto_pause_threshold: 30,
      gps_accuracy: 'high',
      audio_cues: true,
      haptic_feedback: true
    }
  }
}

/**
 * Validate settings object
 */
export function validateSettings(settings: Partial<UserSettings>): boolean {
  try {
    // Validate timezone
    if (settings.preferences?.timezone && 
        !SUPPORTED_TIMEZONES.includes(settings.preferences.timezone as any)) {
      return false
    }

    // Validate language
    if (settings.preferences?.language && 
        !SUPPORTED_LANGUAGES.some(lang => lang.code === settings.preferences?.language)) {
      return false
    }

    // Validate units
    if (settings.preferences?.units && 
        !['metric', 'imperial'].includes(settings.preferences.units)) {
      return false
    }

    // Validate privacy settings
    if (settings.privacy?.profile_visibility && 
        !['public', 'friends', 'private'].includes(settings.privacy.profile_visibility)) {
      return false
    }

    if (settings.privacy?.activity_visibility && 
        !['public', 'friends', 'private'].includes(settings.privacy.activity_visibility)) {
      return false
    }

    return true
  } catch (error) {
    logger.error('ERROR', 'Settings validation error:', { error: error })
    return false
  }
}

/**
 * Merge user settings with defaults
 */
export function mergeWithDefaults(userSettings: Partial<UserSettings>): UserSettings {
  const defaults = getDefaultSettings()
  
  return {
    notifications: {
      ...defaults.notifications,
      ...userSettings.notifications
    },
    privacy: {
      ...defaults.privacy,
      ...userSettings.privacy
    },
    integrations: {
      strava: {
        ...defaults.integrations.strava,
        ...userSettings.integrations?.strava
      },
      garmin: {
        ...defaults.integrations.garmin,
        ...userSettings.integrations?.garmin
      },
      apple_health: {
        ...defaults.integrations.apple_health,
        ...userSettings.integrations?.apple_health
      },
      google_fit: {
        ...defaults.integrations.google_fit,
        ...userSettings.integrations?.google_fit
      }
    },
    preferences: {
      ...defaults.preferences,
      ...userSettings.preferences
    }
  }
}

/**
 * Format timezone for display
 */
export function formatTimezone(timezone: string): string {
  const timezoneMap: Record<string, string> = {
    'Europe/Riga': 'Rīga (GMT+2)',
    'Europe/London': 'Londona (GMT+0)',
    'Europe/Berlin': 'Berlīne (GMT+1)',
    'America/New_York': 'Ņujorka (GMT-5)',
    'America/Los_Angeles': 'Losandželosa (GMT-8)',
    'Asia/Tokyo': 'Tokija (GMT+9)',
    'Australia/Sydney': 'Sidneja (GMT+10)'
  }
  
  return timezoneMap[timezone] || timezone
}

/**
 * Get privacy level color
 */
export function getPrivacyColor(level: 'public' | 'friends' | 'private'): string {
  const colors = {
    public: 'text-green-400',
    friends: 'text-yellow-400',
    private: 'text-red-400'
  }
  
  return colors[level] || 'text-gray-400'
}

/**
 * Get integration status color
 */
export function getIntegrationStatusColor(connected: boolean): string {
  return connected ? 'text-green-400' : 'text-gray-400'
}

/**
 * Format connection date
 */
export function formatConnectionDate(dateString?: string): string {
  if (!dateString) return 'Not specified'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return 'Nav norādīts'
  }
}

/**
 * Calculate settings completion percentage
 */
export function calculateSettingsCompletion(settings: UserSettings): number {
  let totalFields = 0
  let completedFields = 0
  
  // Count notification settings
  Object.values(settings.notifications).forEach(value => {
    totalFields++
    if (typeof value === 'boolean') completedFields++
  })
  
  // Count privacy settings
  Object.values(settings.privacy).forEach(value => {
    totalFields++
    if (value !== undefined && value !== null && value !== '') completedFields++
  })
  
  // Count preference settings
  Object.values(settings.preferences).forEach(value => {
    totalFields++
    if (value !== undefined && value !== null && value !== '') completedFields++
  })
  
  // Count integrations (at least one connected gives full credit)
  const hasConnectedIntegration = Object.values(settings.integrations).some(
    integration => integration.connected
  )
  totalFields += 4 // 4 possible integrations
  if (hasConnectedIntegration) completedFields += 4
  
  return Math.round((completedFields / totalFields) * 100)
}

/**
 * Get settings recommendations
 */
export function getSettingsRecommendations(settings: UserSettings): string[] {
  const recommendations: string[] = []
  
  // Check for integrations
  if (!Object.values(settings.integrations).some(integration => integration.connected)) {
    recommendations.push('Pievienojiet kādu no integrācijām (Strava, Garmin), lai automātiski sinhronizētu aktivitātes')
  }
  
  // Check privacy settings
  if (settings.privacy.profile_visibility === 'public' && 
      settings.privacy.activity_visibility === 'public') {
    recommendations.push('Apsvēriet privātuma iestatījumu pielāgošanu, ja vēlaties ierobežot informācijas pieejamību')
  }
  
  // Check notification settings
  if (!settings.notifications.workout_reminders) {
    recommendations.push('Ieslēdziet treniņu atgādinājumus, lai neizlaistu plānotās aktivitātes')
  }
  
  // Check GPS accuracy
  if (settings.preferences.gps_accuracy === 'low') {
    recommendations.push('Augstāka GPS precizitāte nodrošina precīzākus attāluma un maršruta mērījumus')
  }
  
  return recommendations
}

/**
 * Export settings to JSON
 */
export function exportSettings(settings: UserSettings): string {
  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    settings: settings
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Import settings from JSON
 */
export function importSettings(jsonString: string): UserSettings | null {
  try {
    const importData = JSON.parse(jsonString)
    
    if (importData.version && importData.settings) {
      const settings = importData.settings
      
      // Validate imported settings
      if (validateSettings(settings)) {
        return mergeWithDefaults(settings)
      }
    }
    
    return null
  } catch (error) {
    logger.error('ERROR', 'Error importing settings:', { error: error })
    return null
  }
}