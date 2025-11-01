export interface UserSettings {
  notifications: NotificationSettings
  privacy: PrivacySettings
  integrations: IntegrationSettings
  preferences: PreferenceSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  workout_reminders: boolean
  achievement_alerts: boolean
  weekly_summary: boolean
  social_interactions: boolean
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private'
  activity_visibility: 'public' | 'friends' | 'private'
  leaderboard_participation: boolean
  allow_friend_requests: boolean
  show_real_name: boolean
  show_location: boolean
}

export interface IntegrationSettings {
  strava: StravaIntegration
  garmin: GarminIntegration
  apple_health: AppleHealthIntegration
  google_fit: GoogleFitIntegration
}

export interface StravaIntegration {
  connected: boolean
  athlete_id?: string
  username?: string
  access_token?: string
  refresh_token?: string
  expires_at?: string
  connected_at?: string
  auto_sync: boolean
  sync_activities: boolean
  sync_routes: boolean
}

export interface GarminIntegration {
  connected: boolean
  device_id?: string
  device_name?: string
  connected_at?: string
  auto_sync: boolean
  sync_activities: boolean
  sync_health_data: boolean
}

export interface AppleHealthIntegration {
  connected: boolean
  connected_at?: string
  sync_workouts: boolean
  sync_heart_rate: boolean
  sync_steps: boolean
}

export interface GoogleFitIntegration {
  connected: boolean
  connected_at?: string
  sync_activities: boolean
  sync_health_metrics: boolean
}

export interface PreferenceSettings {
  units: 'metric' | 'imperial'
  language: 'lv' | 'en' | 'ru'
  timezone: string
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  time_format: '12h' | '24h'
  default_activity_type: 'running' | 'walking' | 'cycling' | 'swimming' | 'gym'
  auto_pause_threshold: number // seconds of inactivity
  gps_accuracy: 'high' | 'medium' | 'low'
  audio_cues: boolean
  haptic_feedback: boolean
}

export interface SettingsUpdateRequest {
  settings: Partial<UserSettings>
}

export interface SettingsResponse {
  success: boolean
  settings: UserSettings
  message?: string
}

export interface IntegrationAuthResponse {
  success: boolean
  authUrl?: string
  message?: string
}

export interface IntegrationCallbackRequest {
  code: string
  state?: string
}

export interface IntegrationCallbackResponse {
  success: boolean
  athlete?: {
    id: string
    username?: string
    firstname?: string
    lastname?: string
    profile_medium?: string
  }
  message?: string
}

export interface IntegrationDisconnectResponse {
  success: boolean
  message?: string
}

// Strava specific types
export interface StravaAthlete {
  id: number
  username: string
  resource_state: number
  firstname: string
  lastname: string
  bio: string
  city: string
  state: string
  country: string
  sex: 'M' | 'F'
  premium: boolean
  summit: boolean
  created_at: string
  updated_at: string
  badge_type_id: number
  weight: number
  profile_medium: string
  profile: string
  friend: any
  follower: any
}

export interface StravaTokenResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: StravaAthlete
}

// Settings validation schemas
export const SUPPORTED_TIMEZONES = [
  'Europe/Riga',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney'
] as const

export const SUPPORTED_LANGUAGES = [
  { code: 'lv', name: 'Latvian' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' }
] as const

export const ACTIVITY_TYPES = [
  { value: 'running', label: 'Skriešana' },
  { value: 'walking', label: 'Staigāšana' },
  { value: 'cycling', label: 'Riteņbraukšana' },
  { value: 'swimming', label: 'Peldēšana' },
  { value: 'gym', label: 'Sporta zāle' }
] as const

export const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Publisks - visi var redzēt' },
  { value: 'friends', label: 'Draugi - tikai draugu loks' },
  { value: 'private', label: 'Privāts - tikai es' }
] as const