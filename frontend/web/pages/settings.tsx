import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useAuth, withAuth } from '../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'
import GoogleFitIntegration from '../components/GoogleFitIntegration'
import { logger } from '../lib/productionLogger'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    workout_reminders: boolean
    achievement_alerts: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private'
    activity_visibility: 'public' | 'friends' | 'private'
    leaderboard_participation: boolean
  }
  integrations: {
    strava: {
      connected: boolean
      athlete_id?: string
      username?: string
      connected_at?: string
    }
    garmin: {
      connected: boolean
      device_id?: string
      connected_at?: string
    }
  }
  preferences: {
    units: 'metric' | 'imperial'
    language: 'lv' | 'en'
    timezone: string
    default_activity_type: 'running' | 'walking' | 'cycling'
    theme: 'light' | 'dark'
  }
}

function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const themeClasses = useThemeClasses()
  const { t, language, setLanguage } = useLanguage()
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [lastImport, setLastImport] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'integrations' | 'notifications'>('general')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: 'GET',
        credentials: 'include', // Use httpOnly cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        // Fallback to default settings if API fails
        setSettings({
          notifications: {
            email: true,
            push: true,
            workout_reminders: true,
            achievement_alerts: true
          },
          privacy: {
            profile_visibility: 'public',
            activity_visibility: 'public',
            leaderboard_participation: true
          },
          integrations: {
            strava: {
              connected: false
            },
            garmin: {
              connected: false
            }
          },
          preferences: {
            units: 'metric',
            language: 'lv',
            timezone: 'Europe/Riga',
            default_activity_type: 'running',
            theme: theme
          }
        })
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading settings:', { error: error })
      showMessage('error', t('error_loading_settings'))
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: 'PUT',
        credentials: 'include', // Use httpOnly cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        showMessage('success', t('settings_saved'))
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      logger.error('ERROR', 'Error saving settings:', { error: error })
      showMessage('error', t('error_saving'))
    } finally {
      setSaving(false)
    }
  }

  const connectStrava = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/strava/auth`, {
        method: 'GET',
        credentials: 'include', // Use httpOnly cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Check if it's demo mode
        if (data.demo) {
          showMessage('success', 'Test mode: Strava connection will be simulated 📱')
          
          // Simulate connection after 3 seconds
          setTimeout(() => {
            setSettings(prev => prev ? {
              ...prev,
              integrations: {
                ...prev.integrations,
                strava: { 
                  connected: true, 
                  username: 'demo_runner',
                  connected_at: new Date().toISOString()
                }
              }
            } : null)
            showMessage('success', 'Demo Strava savienojums izveidots veiksmīgi! 🎉')
          }, 3000)
          
          return
        }
        
        // Redirect to Strava OAuth
        window.location.href = data.authUrl
      } else {
        const errorData = await response.json()
        
        // Check if Strava is not configured
        if (response.status === 503 && errorData.error === 'Strava API not configured') {
          showMessage('error', 'Strava integrācija nav konfigurēta. Lūdzu sazinieties ar administratoru.')
        } else {
          throw new Error(errorData.message || 'Failed to get Strava auth URL')
        }
      }
    } catch (error) {
      logger.error('ERROR', 'Error connecting to Strava:', { error: error })
      showMessage('error', error.message || t('error_connecting_strava'))
    }
  }

  const disconnectStrava = async () => {
    if (!confirm(t('confirm_disconnect_strava'))) return

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/strava/disconnect`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        setSettings(prev => prev ? {
          ...prev,
          integrations: {
            ...prev.integrations,
            strava: { connected: false }
          }
        } : null)
        showMessage('success', t('strava_disconnected'))
      } else {
        throw new Error('Failed to disconnect Strava')
      }
    } catch (error) {
      logger.error('ERROR', 'Error disconnecting Strava:', { error: error })
      showMessage('error', t('error_disconnecting_strava'))
    }
  }

  const importStravaActivities = async () => {
    if (!confirm('Vai tiešām vēlaties importēt Strava aktivitātes? Tas var ilgt dažas minūtes.')) return

    setImporting(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      // Import activities from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const response = await fetch(`${API_BASE_URL}/api/strava/activities?after=${thirtyDaysAgo.toISOString()}&per_page=50`, {
        method: 'GET',
        credentials: 'include', // Use httpOnly cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const activityCount = data.activities?.length || 0
        setLastImport(new Date().toISOString())
        showMessage('success', `Veiksmīgi importētas ${activityCount} aktivitātes no Strava`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error importējot aktivitātes')
      }
    } catch (error) {
      logger.error('ERROR', 'Error importing Strava activities:', { error: error })
      showMessage('error', error instanceof Error ? error.message : 'Error importējot aktivitātes')
    } finally {
      setImporting(false)
    }
  }

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    } : null)
    
    // Handle theme change immediately
    if (section === 'preferences' && key === 'theme') {
      setTheme(value)
    }
    
    // Handle language change immediately
    if (section === 'preferences' && key === 'language') {
      setLanguage(value)
    }
  }

  const updateNestedSettings = (section: keyof UserSettings, subsection: string, key: string, value: any) => {
    setSettings(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [key]: value
        }
      }
    } : null)
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">{t('loading_settings')}</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!settings) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{t('error_loading_settings')}</p>
            <button onClick={loadSettings} className="btn-primary">
              {t('try_again')}
            </button>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)`
        }}></div>

        <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
          <div className="glass-card p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-adaptive-white">{t('settings_title')}</h1>
                <p className="text-adaptive-light">{t('settings_subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`mb-6 ${
              message.type === 'success' 
                ? 'glass-card-success' 
                : message.type === 'info'
                ? 'glass-card p-4 border-blue-500/30'
                : 'glass-card-error'
            } p-4`}>
              <div className="flex items-start gap-3">
                {message.type === 'success' && (
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {message.type === 'error' && (
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {message.type === 'info' && (
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={`text-sm ${
                  message.type === 'success' ? 'text-green-400' :
                  message.type === 'error' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {message.text}
                </span>
              </div>
            </div>
          )}

          <div className="glass-card p-8">
            {/* Tabs */}
            <div className="flex space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'general'
                    ? 'glass-button-primary text-white'
                    : 'glass-button text-adaptive-muted hover:text-adaptive-light'
                }`}
              >
                ⚙️ {t('general')}
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'privacy'
                    ? 'glass-button-primary text-white'
                    : 'glass-button text-adaptive-muted hover:text-adaptive-light'
                }`}
              >
                🔒 {t('privacy')}
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'integrations'
                    ? 'glass-button-primary text-white'
                    : 'glass-button text-adaptive-muted hover:text-adaptive-light'
                }`}
              >
                🔗 {t('integrations')}
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'notifications'
                    ? 'glass-button-primary text-white'
                    : 'glass-button text-adaptive-muted hover:text-adaptive-light'
                }`}
              >
                🔔 {t('notifications')}
              </button>
            </div>

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>{t('general_settings')}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      {t('units')}
                    </label>
                    <select
                      value={settings.preferences.units}
                      onChange={(e) => updateSettings('preferences', 'units', e.target.value)}
                      className="glass-input w-full"
                    >
                      <option value="metric">{t('metric_system')}</option>
                      <option value="imperial">{t('imperial_system')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      {t('language')}
                    </label>
                    <select
                      value={settings.preferences.language}
                      onChange={(e) => updateSettings('preferences', 'language', e.target.value)}
                      className="glass-input w-full"
                    >
                      <option value="lv">{t('latvian')}</option>
                      <option value="en">{t('english')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      {t('timezone')}
                    </label>
                    <select
                      value={settings.preferences.timezone}
                      onChange={(e) => updateSettings('preferences', 'timezone', e.target.value)}
                      className="glass-input w-full"
                    >
                      <option value="Europe/Riga">Rīga (GMT+2)</option>
                      <option value="Europe/London">Londona (GMT+0)</option>
                      <option value="America/New_York">Ņujorka (GMT-5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      {t('default_activity_type')}
                    </label>
                    <select
                      value={settings.preferences.default_activity_type}
                      onChange={(e) => updateSettings('preferences', 'default_activity_type', e.target.value)}
                      className="glass-input w-full"
                    >
                      <option value="running">{t('running')}</option>
                      <option value="walking">{t('walking')}</option>
                      <option value="cycling">{t('cycling')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      {t('design_theme')}
                    </label>
                    <select
                      value={settings.preferences.theme}
                      onChange={(e) => updateSettings('preferences', 'theme', e.target.value)}
                      className="glass-input w-full"
                    >
                      <option value="dark">{t('dark_mode')}</option>
                      <option value="light">{t('light_mode')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">{t('privacy_settings')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('profile_visibility')}
                    </label>
                    <select
                      value={settings.privacy.profile_visibility}
                      onChange={(e) => updateSettings('privacy', 'profile_visibility', e.target.value)}
                      className="glass-input w-full px-3 py-2 focus:outline-none"
                    >
                      <option value="public">{t('public')}</option>
                      <option value="friends">{t('friends_only')}</option>
                      <option value="private">{t('private')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('activity_visibility')}
                    </label>
                    <select
                      value={settings.privacy.activity_visibility}
                      onChange={(e) => updateSettings('privacy', 'activity_visibility', e.target.value)}
                      className="glass-input w-full px-3 py-2 focus:outline-none"
                    >
                      <option value="public">{t('public_activities')}</option>
                      <option value="friends">{t('friends_activities')}</option>
                      <option value="private">{t('private_activities')}</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-300">{t('leaderboard_participation')}</div>
                      <div className="text-xs text-gray-500">{t('leaderboard_description')}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.leaderboard_participation}
                        onChange={(e) => updateSettings('privacy', 'leaderboard_participation', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integration Settings */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">{t('integrations_title')}</h3>
                
                <div className="space-y-6">
                  {/* Strava Integration */}
                  <div className="border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.172"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Strava</h4>
                          <p className="text-sm text-gray-400">{t('strava_integration')}</p>
                        </div>
                      </div>
                      
                      {settings.integrations.strava.connected ? (
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <div className="text-green-400 font-medium">{t('connected')}</div>
                            {settings.integrations.strava.username && (
                              <div className="text-gray-400">@{settings.integrations.strava.username}</div>
                            )}
                          </div>
                          <button
                            onClick={disconnectStrava}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            {t('disconnect')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={connectStrava}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                        >
                          {t('connect_strava')}
                        </button>
                      )}
                    </div>
                    
                    {settings.integrations.strava.connected && (
                      <div className="text-xs text-gray-500">
                        Savienots: {settings.integrations.strava.connected_at ? 
                          new Date(settings.integrations.strava.connected_at).toLocaleDateString('en-US') : 
                          'Nav norādīts'
                        }
                      </div>
                    )}
                  </div>

                  {/* Strava Activities Import */}
                  {settings.integrations.strava.connected && (
                    <div className="border border-gray-700 rounded-lg p-6 bg-surface/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">Strava Aktivitāšu Importēšana</h4>
                            <p className="text-sm text-gray-400">Importē savas skriešanas aktivitātes no Strava</p>
                          </div>
                        </div>
                        <button
                          onClick={importStravaActivities}
                          disabled={importing}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          {importing ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Importē...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Importēt Aktivitātes
                            </>
                          )}
                        </button>
                      </div>
                      
                      {lastImport && (
                        <div className="text-xs text-gray-500">
                          Pēdējais imports: {new Date(lastImport).toLocaleString('lv')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Google Fit Integration */}
                  <GoogleFitIntegration />

                  {/* Garmin Integration */}
                  <div className="border border-gray-700 rounded-lg p-6 opacity-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Garmin Connect</h4>
                          <p className="text-sm text-gray-400">{t('garmin_integration')}</p>
                        </div>
                      </div>
                      
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                      >
                        {t('coming_soon')}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('garmin_coming_soon')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">{t('notifications_settings')}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-300">{t('email_notifications')}</div>
                      <div className="text-xs text-gray-500">{t('email_description')}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => updateSettings('notifications', 'email', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-300">{t('push_notifications')}</div>
                      <div className="text-xs text-gray-500">{t('push_description')}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.push}
                        onChange={(e) => updateSettings('notifications', 'push', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-300">{t('workout_reminders')}</div>
                      <div className="text-xs text-gray-500">{t('workout_reminders_description')}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.workout_reminders}
                        onChange={(e) => updateSettings('notifications', 'workout_reminders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-300">{t('achievement_alerts')}</div>
                      <div className="text-xs text-gray-500">{t('achievement_description')}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.achievement_alerts}
                        onChange={(e) => updateSettings('notifications', 'achievement_alerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-white/10 mt-8">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="glass-button-primary"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {t('saving')}
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('save_changes')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(SettingsPage)