import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { getAuthToken } from '../lib/auth'
import { withAuth } from '../contexts/AuthContext'

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  birthDate: string
  age?: number
  gender: string
  weight?: number
  height?: number
  fitnessLevel: string
  weeklyGoal: number
  preferredPace?: number
  runningExperience: string
  injuryHistory?: string
  preferredDistance: string
  timezone: string
  units: string
  
  // Extended training profile fields
  hasRunningExperience: boolean
  longestRunEver?: number
  longestRunLastMonth?: number
  personalBest5k?: number
  personalBest10k?: number
  workoutsPerWeekCurrent: number
  workoutsPerWeekLastMonth: number
  strengthTrainingPerWeek: number
  coreTrainingPerWeek: number
  otherActivities?: string
  hasRunningShoes: boolean
  runningShoesBrand?: string
  runningShoesModel?: string
  hasHeartRateMonitor: boolean
  monitorsHeartRate: boolean
  medicalConditions?: string
  currentInjuries?: string
  currentPain?: string
  hasExcessWeight: boolean
  targetEventType: string
  targetEventDate?: string
  trainingIntensityPref: string
  sleepHoursPerNight: number
  stressLevel: number
  nutritionQuality: number
  
  isEmailVerified: boolean
  isProfileComplete: boolean
  theme: string
  notificationsEnabled: boolean
  locationSharingEnabled: boolean
  avatarUrl?: string
  createdAt: string
  updatedAt: string
  
  // Email preferences
  workoutSummaries?: boolean
  weeklyReports?: boolean
  achievements?: boolean
  friendActivity?: boolean
  trainingPlanUpdates?: boolean
  lastLoginAt?: string
  
  // Training schedule preferences
  preferredDays?: string[]
}

function Profile() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [emailPreferences, setEmailPreferences] = useState({
    notificationsEnabled: true,
    workoutSummaries: true,
    weeklyReports: true,
    achievements: true,
    friendActivity: true,
    trainingPlanUpdates: true
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const token = getAuthToken()
      const supabaseSession = typeof window !== 'undefined' ? localStorage.getItem('supabase_session') : null
      
      if (!token && !supabaseSession) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token || JSON.parse(supabaseSession || '{}').access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        // Load email preferences from profile data
        setEmailPreferences({
          notificationsEnabled: data.user.notificationsEnabled || false,
          workoutSummaries: data.user.workoutSummaries !== false, // Default true
          weeklyReports: data.user.weeklyReports !== false, // Default true  
          achievements: data.user.achievements !== false, // Default true
          friendActivity: data.user.friendActivity !== false, // Default true
          trainingPlanUpdates: data.user.trainingPlanUpdates !== false // Default true
        })
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    setError('')

    try {
      const token = getAuthToken()
      const supabaseSession = typeof window !== 'undefined' ? localStorage.getItem('supabase_session') : null

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || JSON.parse(supabaseSession || '{}').access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setIsEditing(false)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const saveEmailPreferences = async () => {
    try {
      setSaving(true)
      const token = getAuthToken()
      const supabaseSession = typeof window !== 'undefined' ? localStorage.getItem('supabase_session') : null
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || JSON.parse(supabaseSession || '{}').access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profile,
          notificationsEnabled: emailPreferences.notificationsEnabled,
          workoutSummaries: emailPreferences.workoutSummaries,
          weeklyReports: emailPreferences.weeklyReports,
          achievements: emailPreferences.achievements,
          friendActivity: emailPreferences.friendActivity,
          trainingPlanUpdates: emailPreferences.trainingPlanUpdates
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
      } else {
        setError('Failed to update email preferences')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleEmailPreferenceChange = (field: string, value: boolean) => {
    setEmailPreferences(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <ProtectedLayout title="Profils">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full"></div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!profile) {
    return (
      <ProtectedLayout title="Profils">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </ProtectedLayout>
    )
  }

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>📧</span>
          E-pasta Preferences
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Pārvaldiet, kādus e-pastus vēlaties saņemt no DeyaRun
        </p>
      </div>

      <div className="space-y-4">
        {/* Master notifications toggle */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-gray-700">
          <div>
            <h4 className="font-medium text-white">E-pasta paziņojumi</h4>
            <p className="text-sm text-gray-400">Ieslēgt vai izslēgt visus e-pasta paziņojumus</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailPreferences.notificationsEnabled}
              onChange={(e) => handleEmailPreferenceChange('notificationsEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
          </label>
        </div>

        {/* Individual email preferences */}
        <div className={`space-y-3 transition-opacity ${emailPreferences.notificationsEnabled ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-gray-700">
            <div>
              <h4 className="font-medium text-white">Treniņu kopsavilkumi</h4>
              <p className="text-sm text-gray-400">E-pasts pēc katra pabeigta treniņa ar statistiku</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailPreferences.workoutSummaries && emailPreferences.notificationsEnabled}
                onChange={(e) => handleEmailPreferenceChange('workoutSummaries', e.target.checked)}
                disabled={!emailPreferences.notificationsEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-gray-700">
            <div>
              <h4 className="font-medium text-white">Nedēļas ziņojumi</h4>
              <p className="text-sm text-gray-400">Nedēļas progresa kopsavilkums katru svētdienu</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailPreferences.weeklyReports && emailPreferences.notificationsEnabled}
                onChange={(e) => handleEmailPreferenceChange('weeklyReports', e.target.checked)}
                disabled={!emailPreferences.notificationsEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-gray-700">
            <div>
              <h4 className="font-medium text-white">Sasniegumi</h4>
              <p className="text-sm text-gray-400">Paziņojumi par jauniem sasniegumiem un mērķiem</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailPreferences.achievements && emailPreferences.notificationsEnabled}
                onChange={(e) => handleEmailPreferenceChange('achievements', e.target.checked)}
                disabled={!emailPreferences.notificationsEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-gray-700">
            <div>
              <h4 className="font-medium text-white">Draugu aktivitāte</h4>
              <p className="text-sm text-gray-400">Informācija par draugu treniņiem un sasniegumiem</p>
            </div>
            <label className="relative inline-flex items-centers cursor-pointer">
              <input
                type="checkbox"
                checked={emailPreferences.friendActivity && emailPreferences.notificationsEnabled}
                onChange={(e) => handleEmailPreferenceChange('friendActivity', e.target.checked)}
                disabled={!emailPreferences.notificationsEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-gray-700">
            <div>
              <h4 className="font-medium text-white">Treniņu plānu atjauninājumi</h4>
              <p className="text-sm text-gray-400">Informācija par treniņu plāna izmaiņām un ieteikumiem</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailPreferences.trainingPlanUpdates && emailPreferences.notificationsEnabled}
                onChange={(e) => handleEmailPreferenceChange('trainingPlanUpdates', e.target.checked)}
                disabled={!emailPreferences.notificationsEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={saveEmailPreferences}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saglabā...
              </>
            ) : (
              <>
                <span>💾</span>
                Saglabāt Preferences
              </>
            )}
          </button>
        </div>

        {/* Info section */}
        <div className="mt-6 p-4 bg-surface-light rounded-lg border-l-4 border-coral">
          <h4 className="font-medium text-white mb-2">ℹ️ Informācija par e-pastiem</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• E-pasti tiek sūtīti no run@coredigify.com</li>
            <li>• Nedēļas ziņojumi tiek sūtīti katru svētdienu plkst. 19:00</li>
            <li>• Jūs vienmēr varat atjaunot šos iestatījumus</li>
            <li>• Svarīgi drošības paziņojumi tiks sūtīti neatkarīgi no iestatījumiem</li>
          </ul>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '👤' },
    { id: 'running', name: 'Running Profile', icon: '🏃‍♂️' },
    { id: 'onboarding', name: 'Onboarding', icon: '🎯' },
    { id: 'training', name: 'Training', icon: '💪' },
    { id: 'equipment', name: 'Equipment', icon: '👟' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'goals', name: 'Goals', icon: '🎯' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '🌱' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ]

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
          {isEditing ? (
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="input-field w-full"
            />
          ) : (
            <p className="text-white">{profile.firstName}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
          {isEditing ? (
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="input-field w-full"
            />
          ) : (
            <p className="text-white">{profile.lastName}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <p className="text-white">{profile.email}</p>
          <small className="text-gray-400">Email cannot be changed</small>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
          {isEditing ? (
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input-field w-full"
            />
          ) : (
            <p className="text-white">{profile.phone || 'Not provided'}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
          <p className="text-white">{profile.age} years</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
          <p className="text-white capitalize">{profile.gender}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
          {isEditing ? (
            <input
              type="number"
              step="0.1"
              value={profile.weight || ''}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || null)}
              className="input-field w-full"
            />
          ) : (
            <p className="text-white">{profile.weight || 'Not provided'} kg</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Height (cm)</label>
          {isEditing ? (
            <input
              type="number"
              value={profile.height || ''}
              onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || null)}
              className="input-field w-full"
            />
          ) : (
            <p className="text-white">{profile.height || 'Not provided'} cm</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderRunningProfile = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Running Experience</label>
          <p className="text-white">{profile.hasRunningExperience ? 'Yes' : 'No'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
          <p className="text-white capitalize">{profile.runningExperience}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Longest Run Ever (km)</label>
          <p className="text-white">{profile.longestRunEver || 'Not recorded'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Longest Run Last Month (km)</label>
          <p className="text-white">{profile.longestRunLastMonth || 'Not recorded'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Personal Best 5K</label>
          <p className="text-white">
            {profile.personalBest5k 
              ? `${Math.floor(profile.personalBest5k / 60)}:${(profile.personalBest5k % 60).toString().padStart(2, '0')}` 
              : 'Not recorded'
            }
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Personal Best 10K</label>
          <p className="text-white">
            {profile.personalBest10k 
              ? `${Math.floor(profile.personalBest10k / 60)}:${(profile.personalBest10k % 60).toString().padStart(2, '0')}` 
              : 'Not recorded'
            }
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Distance</label>
          <p className="text-white">{profile.preferredDistance}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Weekly Goal (km)</label>
          <p className="text-white">{profile.weeklyGoal} km</p>
        </div>
      </div>
    </div>
  )

  const renderOnboarding = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          Onboarding Preferences
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Atjaunojiet savas skrējiena preferences un mērķus, kas tika aizpildīti mobilās aplikācijas iesākšanas laikā
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Fitness Level</label>
          {isEditing ? (
            <select
              value={profile.fitnessLevel || 'beginner'}
              onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
              className="input-field w-full"
            >
              <option value="beginner">Beginner - New to running</option>
              <option value="intermediate">Intermediate - Regular runner</option>
              <option value="advanced">Advanced - Experienced runner</option>
            </select>
          ) : (
            <p className="text-white capitalize">{profile.fitnessLevel || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Primary Goal</label>
          {isEditing ? (
            <select
              value={profile.preferredDistance || '5k'}
              onChange={(e) => handleInputChange('preferredDistance', e.target.value)}
              className="input-field w-full"
            >
              <option value="5k">5K Race</option>
              <option value="10k">10K Race</option>
              <option value="half-marathon">Half Marathon</option>
              <option value="marathon">Marathon</option>
              <option value="fitness">General Fitness</option>
            </select>
          ) : (
            <p className="text-white">{profile.preferredDistance || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Weekly Commitment</label>
          {isEditing ? (
            <select
              value={profile.workoutsPerWeekCurrent || 3}
              onChange={(e) => handleInputChange('workoutsPerWeekCurrent', parseInt(e.target.value))}
              className="input-field w-full"
            >
              <option value={2}>2 days per week</option>
              <option value={3}>3 days per week</option>
              <option value={4}>4 days per week</option>
              <option value={5}>5 days per week</option>
              <option value={6}>6 days per week</option>
            </select>
          ) : (
            <p className="text-white">{profile.workoutsPerWeekCurrent || 3} days per week</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Training Style</label>
          {isEditing ? (
            <select
              value={profile.trainingIntensityPref || 'moderate'}
              onChange={(e) => handleInputChange('trainingIntensityPref', e.target.value)}
              className="input-field w-full"
            >
              <option value="high">Structured - Detailed plan</option>
              <option value="moderate">Flexible - Adaptable schedule</option>
              <option value="low">Social - Group challenges</option>
            </select>
          ) : (
            <p className="text-white capitalize">
              {profile.trainingIntensityPref === 'high' ? 'Structured' : 
               profile.trainingIntensityPref === 'moderate' ? 'Flexible' : 
               profile.trainingIntensityPref === 'low' ? 'Social' : 'Not set'}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Training Days</label>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const currentDays = profile.preferredDays || [];
                    const updatedDays = currentDays.includes(day)
                      ? currentDays.filter(d => d !== day)
                      : [...currentDays, day];
                    handleInputChange('preferredDays', updatedDays);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                    (profile.preferredDays || []).includes(day)
                      ? 'bg-coral text-white'
                      : 'bg-surface text-gray-300 hover:bg-surface-light border border-gray-700'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-white">
              {profile.preferredDays && profile.preferredDays.length > 0 
                ? profile.preferredDays.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ')
                : 'Not set'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Has Running Experience</label>
          <p className="text-white">{profile.hasRunningExperience ? 'Yes' : 'No'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Profile Completion</label>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm ${
            profile.isProfileComplete 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}>
            {profile.isProfileComplete ? 'Complete' : 'Incomplete'}
          </div>
        </div>
      </div>

      {/* Info section about mobile onboarding */}
      <div className="mt-6 p-4 bg-surface-light rounded-lg border-l-4 border-coral">
        <h4 className="font-medium text-white mb-2">ℹ️ Par Onboarding datiem</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Šie dati tiek aizpildīti mobilās aplikācijas iesākšanas laikā</li>
          <li>• Varat atjaunot šos iestatījumus, lai uzlabotu savu treniņu plānu</li>
          <li>• Izmaiņas tiks sinhronizētas ar jūsu mobilo aplikāciju</li>
          <li>• Pilnīgs profils palīdz izveidot labāku personalizēto treniņu plānu</li>
        </ul>
      </div>
    </div>
  )

  const renderTraining = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>💪</span>
          Treniņu aktivitātes
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Jūsu pašreizējā treniņu rutīna un aktivitātes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Treniņi nedēļā (pašreiz)</label>
          {isEditing ? (
            <select
              value={profile.workoutsPerWeekCurrent || 2}
              onChange={(e) => handleInputChange('workoutsPerWeekCurrent', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <option key={num} value={num}>{num} reize{num !== 1 ? 's' : ''} nedēļā</option>
              ))}
            </select>
          ) : (
            <p className="text-white">{profile.workoutsPerWeekCurrent || 2} reizes nedēļā</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Treniņi pēdējā mēnesī</label>
          {isEditing ? (
            <select
              value={profile.workoutsPerWeekLastMonth || 0}
              onChange={(e) => handleInputChange('workoutsPerWeekLastMonth', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>{num} reize{num !== 1 ? 's' : ''} nedēļā</option>
              ))}
            </select>
          ) : (
            <p className="text-white">{profile.workoutsPerWeekLastMonth || 0} reizes nedēļā</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Spēka treniņi nedēļā</label>
          {isEditing ? (
            <select
              value={profile.strengthTrainingPerWeek || 0}
              onChange={(e) => handleInputChange('strengthTrainingPerWeek', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[0, 1, 2, 3].map((num) => (
                <option key={num} value={num}>{num} reize{num !== 1 ? 's' : ''} nedēļā</option>
              ))}
            </select>
          ) : (
            <p className="text-white">{profile.strengthTrainingPerWeek || 0} reizes nedēļā</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Core treniņi nedēļā</label>
          {isEditing ? (
            <select
              value={profile.coreTrainingPerWeek || 0}
              onChange={(e) => handleInputChange('coreTrainingPerWeek', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[0, 1, 2, 3].map((num) => (
                <option key={num} value={num}>{num} reize{num !== 1 ? 's' : ''} nedēļā</option>
              ))}
            </select>
          ) : (
            <p className="text-white">{profile.coreTrainingPerWeek || 0} reizes nedēļā</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Citas aktivitātes</label>
          {isEditing ? (
            <textarea
              value={profile.otherActivities || ''}
              onChange={(e) => handleInputChange('otherActivities', e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="Peldēšana, riteņbraukšana, joga..."
            />
          ) : (
            <p className="text-white">{profile.otherActivities || 'Nav norādīts'}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderEquipment = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>👟</span>
          Aprīkojums
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Jūsu skriešanas aprīkojums un ierīces
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Skriešanas apavi</label>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasRunningShoes || false}
                  onChange={(e) => handleInputChange('hasRunningShoes', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-6 h-6 bg-gray-600 peer-focus:outline-none rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-coral relative"></div>
                <span className="ml-2 text-white">Man ir skriešanas apavi</span>
              </label>
            ) : (
              <p className="text-white">{profile.hasRunningShoes ? 'Jā' : 'Nē'}</p>
            )}
          </div>
        </div>

        {profile.hasRunningShoes && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ražotājs</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.runningShoesBrand || ''}
                  onChange={(e) => handleInputChange('runningShoesBrand', e.target.value)}
                  className="input-field w-full"
                  placeholder="Nike, Adidas, Asics..."
                />
              ) : (
                <p className="text-white">{profile.runningShoesBrand || 'Nav norādīts'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Modelis</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.runningShoesModel || ''}
                  onChange={(e) => handleInputChange('runningShoesModel', e.target.value)}
                  className="input-field w-full"
                  placeholder="Air Zoom, UltraBoost..."
                />
              ) : (
                <p className="text-white">{profile.runningShoesModel || 'Nav norādīts'}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Pulsometrs</label>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasHeartRateMonitor || false}
                  onChange={(e) => handleInputChange('hasHeartRateMonitor', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-6 h-6 bg-gray-600 peer-focus:outline-none rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-coral relative"></div>
                <span className="ml-2 text-white">Man ir pulsometrs</span>
              </label>
            ) : (
              <p className="text-white">{profile.hasHeartRateMonitor ? 'Jā' : 'Nē'}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mēru pulsu treniņos</label>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.monitorsHeartRate || false}
                  onChange={(e) => handleInputChange('monitorsHeartRate', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-6 h-6 bg-gray-600 peer-focus:outline-none rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-coral relative"></div>
                <span className="ml-2 text-white">Jā, mēru pulsu</span>
              </label>
            ) : (
              <p className="text-white">{profile.monitorsHeartRate ? 'Jā' : 'Nē'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderHealth = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>🏥</span>
          Veselības informācija
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Informācija par jūsu veselības stāvokli un ierobežojumiem
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Slimības vai veselības problēmas</label>
          {isEditing ? (
            <textarea
              value={profile.medicalConditions || ''}
              onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="Aprakstiet jebkādas slimības vai traumas..."
            />
          ) : (
            <p className="text-white">{profile.medicalConditions || 'Nav norādīts'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Pašreizējās traumas</label>
          {isEditing ? (
            <textarea
              value={profile.currentInjuries || ''}
              onChange={(e) => handleInputChange('currentInjuries', e.target.value)}
              className="input-field w-full"
              rows={2}
              placeholder="Vai šobrīd kaut kas sāp?"
            />
          ) : (
            <p className="text-white">{profile.currentInjuries || 'Nav norādīts'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Pašreizējās sāpes vai diskomforts</label>
          {isEditing ? (
            <textarea
              value={profile.currentPain || ''}
              onChange={(e) => handleInputChange('currentPain', e.target.value)}
              className="input-field w-full"
              rows={2}
              placeholder="Vai šobrīd kaut kas rada diskomfortu?"
            />
          ) : (
            <p className="text-white">{profile.currentPain || 'Nav norādīts'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Liekais svars</label>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasExcessWeight || false}
                  onChange={(e) => handleInputChange('hasExcessWeight', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-6 h-6 bg-gray-600 peer-focus:outline-none rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-coral relative"></div>
                <span className="ml-2 text-white">Man ir liekais svars</span>
              </label>
            ) : (
              <p className="text-white">{profile.hasExcessWeight ? 'Jā' : 'Nē'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-surface-light rounded-lg border-l-4 border-coral">
        <h4 className="font-medium text-white mb-2">⚠️ Svarīga informācija</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Šī informācija palīdz izveidot drošu treniņu plānu</li>
          <li>• Vienmēr konsultējieties ar ārstu pirms jauna treniņu plāna uzsākšanas</li>
          <li>• Traumu gadījumā pārtrauciet treniņus un vērsieties pie speciālista</li>
          <li>• Šie dati tiek izmantoti tikai treniņu personalizācijai</li>
        </ul>
      </div>
    </div>
  )

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          Mērķi un prioritātes
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Jūsu skriešanas mērķi un treniņu prioritātes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mērķa distance</label>
          {isEditing ? (
            <select
              value={profile.preferredDistance || '5k'}
              onChange={(e) => handleInputChange('preferredDistance', e.target.value)}
              className="input-field w-full"
            >
              <option value="5k">5 km</option>
              <option value="10k">10 km</option>
              <option value="half-marathon">Pusmaratons (21 km)</option>
              <option value="marathon">Maratons (42 km)</option>
            </select>
          ) : (
            <p className="text-white">
              {profile.preferredDistance === '5k' ? '5 km' :
               profile.preferredDistance === '10k' ? '10 km' :
               profile.preferredDistance === 'half-marathon' ? 'Pusmaratons (21 km)' :
               profile.preferredDistance === 'marathon' ? 'Maratons (42 km)' :
               profile.preferredDistance || 'Nav norādīts'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mērķa tips</label>
          {isEditing ? (
            <select
              value={profile.targetEventType || 'general'}
              onChange={(e) => handleInputChange('targetEventType', e.target.value)}
              className="input-field w-full"
            >
              <option value="general">Vispārīga fiziskā sagatavotība</option>
              <option value="specific_race">Konkrētas sacensības</option>
              <option value="personal_challenge">Personīgais izaicinājums</option>
            </select>
          ) : (
            <p className="text-white">
              {profile.targetEventType === 'general' ? 'Vispārīga fiziskā sagatavotība' :
               profile.targetEventType === 'specific_race' ? 'Konkrētas sacensības' :
               profile.targetEventType === 'personal_challenge' ? 'Personīgais izaicinājums' :
               'Nav norādīts'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Treniņa intensitāte</label>
          {isEditing ? (
            <select
              value={profile.trainingIntensityPref || 'moderate'}
              onChange={(e) => handleInputChange('trainingIntensityPref', e.target.value)}
              className="input-field w-full"
            >
              <option value="low">Zema - relaksēti treniņi</option>
              <option value="moderate">Vidēja - regulāri treniņi</option>
              <option value="high">Augsta - intensīvi treniņi</option>
            </select>
          ) : (
            <p className="text-white">
              {profile.trainingIntensityPref === 'low' ? 'Zema - relaksēti treniņi' :
               profile.trainingIntensityPref === 'moderate' ? 'Vidēja - regulāri treniņi' :
               profile.trainingIntensityPref === 'high' ? 'Augsta - intensīvi treniņi' :
               'Nav norādīts'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mērķa pasākuma datums</label>
          {isEditing ? (
            <input
              type="date"
              value={profile.targetEventDate || ''}
              onChange={(e) => handleInputChange('targetEventDate', e.target.value)}
              className="input-field w-full"
            />
          ) : (
            <p className="text-white">
              {profile.targetEventDate 
                ? new Date(profile.targetEventDate).toLocaleDateString('en-US')
                : 'Nav norādīts'}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderLifestyle = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>🌱</span>
          Dzīvesveida faktori
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Jūsu ikdienas paradumi, kas ietekmē treniņu efektivitāti
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Miega stundas naktī</label>
          {isEditing ? (
            <select
              value={profile.sleepHoursPerNight || 8}
              onChange={(e) => handleInputChange('sleepHoursPerNight', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[5, 6, 7, 8, 9, 10].map((hours) => (
                <option key={hours} value={hours}>{hours} stundas</option>
              ))}
            </select>
          ) : (
            <p className="text-white">{profile.sleepHoursPerNight || 8} stundas</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Stress līmenis (1-5)</label>
          {isEditing ? (
            <select
              value={profile.stressLevel || 3}
              onChange={(e) => handleInputChange('stressLevel', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {level} - {level === 1 ? 'Ļoti zems' : 
                           level === 2 ? 'Zems' :
                           level === 3 ? 'Vidējs' :
                           level === 4 ? 'Augsts' : 'Ļoti augsts'}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-white">
              {profile.stressLevel || 3} - {
                (profile.stressLevel || 3) === 1 ? 'Ļoti zems' :
                (profile.stressLevel || 3) === 2 ? 'Zems' :
                (profile.stressLevel || 3) === 3 ? 'Vidējs' :
                (profile.stressLevel || 3) === 4 ? 'Augsts' : 'Ļoti augsts'
              }
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Uzturs kvalitāte (1-5)</label>
          {isEditing ? (
            <select
              value={profile.nutritionQuality || 3}
              onChange={(e) => handleInputChange('nutritionQuality', parseInt(e.target.value))}
              className="input-field w-full"
            >
              {[1, 2, 3, 4, 5].map((quality) => (
                <option key={quality} value={quality}>
                  {quality} - {quality === 1 ? 'Ļoti slikts' : 
                               quality === 2 ? 'Slikts' :
                               quality === 3 ? 'Vidējs' :
                               quality === 4 ? 'Labs' : 'Izcils'}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-white">
              {profile.nutritionQuality || 3} - {
                (profile.nutritionQuality || 3) === 1 ? 'Ļoti slikts' :
                (profile.nutritionQuality || 3) === 2 ? 'Slikts' :
                (profile.nutritionQuality || 3) === 3 ? 'Vidējs' :
                (profile.nutritionQuality || 3) === 4 ? 'Labs' : 'Izcils'
              }
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-surface-light rounded-lg border-l-4 border-coral">
        <h4 className="font-medium text-white mb-2">💡 Kāpēc šie faktori ir svarīgi?</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• <strong>Miegs:</strong> Ietekme uz atveseļošanos un treniņu kvalitāti</li>
          <li>• <strong>Stress:</strong> Augsts stress var palēnināt progresu un palielināt traumu risku</li>
          <li>• <strong>Uzturs:</strong> Kvalitatīvs uzturs uzlabo veiktspēju un atveseļošanos</li>
          <li>• Šie faktori palīdz pielāgot treniņu intensitāti un biežumu</li>
        </ul>
      </div>
    </div>
  )

  return (
    <ProtectedLayout title="Profils">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Profila pārvaldība</h1>
          <p className="text-gray-400 mt-1">Pārvaldiet savu skrējiena profilu un iestatījumus</p>
        </div>
        
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Atcelt
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saglabā...' : 'Saglabāt izmaiņas'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Rediģēt profilu
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Profile Completion Status */}
      <div className="card mb-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Profila pabeigšana</h3>
              <p className="text-gray-400 text-sm">
                {profile.isProfileComplete ? 'Jūsu profils ir pabeigts!' : 'Pabeidziet profilu, lai saņemtu labākus treniņu ieteikumus'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              profile.isProfileComplete 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            }`}>
              {profile.isProfileComplete ? 'Pabeigts' : 'Nepabeigts'}
            </div>
          </div>
          
          {/* Profile Completion Progress */}
          {(() => {
            const requiredFields = [
              'firstName', 'lastName', 'birthDate', 'gender',
              'fitnessLevel', 'preferredDistance', 'workoutsPerWeekCurrent',
              'trainingIntensityPref', 'sleepHoursPerNight', 'stressLevel', 'nutritionQuality'
            ];
            const completedFields = requiredFields.filter(field => profile[field as keyof UserProfile]);
            const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
            
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Progess</span>
                  <span className="text-white font-medium">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-coral to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {completedFields.length} no {requiredFields.length} obligātie lauki aizpildīti
                </div>
                
                {completionPercentage < 100 && (
                  <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-400 text-lg">⚡</span>
                      <div>
                        <h4 className="text-white font-medium text-sm">Pabeigt profilu</h4>
                        <p className="text-gray-400 text-xs mt-1">
                          Aizpildiet trūkstošos laukus, lai iegūtu personalizētus treniņu plānus un labākus ieteikumus.
                        </p>
                        <button
                          onClick={() => setActiveTab('onboarding')}
                          className="mt-2 text-xs bg-coral hover:bg-coral/80 text-white px-3 py-1 rounded-lg transition-colors"
                        >
                          Aizpildīt tagad
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-coral text-white'
                  : 'bg-surface text-gray-300 hover:bg-surface-light'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'basic' && renderBasicInfo()}
        {activeTab === 'running' && renderRunningProfile()}
        {activeTab === 'onboarding' && renderOnboarding()}
        {activeTab === 'training' && renderTraining()}
        {activeTab === 'equipment' && renderEquipment()}
        {activeTab === 'health' && renderHealth()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'lifestyle' && renderLifestyle()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(Profile)