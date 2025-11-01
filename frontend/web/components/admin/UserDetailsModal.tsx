import { useState, useEffect } from 'react'
import { apiService } from '../../lib/api'
import { logger } from '../../lib/productionLogger'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

interface UserDetails {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  lastActiveAt?: string
  birthDate?: string
  gender?: string
  stats: {
    totalWorkouts: number
    totalDistance: number
    averagePace: string
    completedCourses: number
    streakDays: number
  }
  subscription?: {
    plan: string
    status: string
    expiresAt?: string
  }
  recentWorkouts: Array<{
    id: string
    type: string
    name: string
    date: string
    duration: number
    distance: number
  }>
  activityLog: Array<{
    id: string
    action: string
    timestamp: string
    details?: string
  }>
  onboarding?: {
    completed: boolean
    completedAt?: string
    personalInfo: {
      height?: number
      weight?: number
      birthDate?: string
      gender?: string
    }
    healthInfo: {
      fitnessLevel?: string
      sleepHours?: number
      stressLevel?: number
      nutritionQuality?: number
    }
    goals: {
      weeklyGoal?: number
      preferredDistance?: string
      targetEventType?: string
      targetEventDate?: string
      trainingIntensityPref?: string
      hasRunningExperience?: boolean
      runningExperience?: string
      longestRunEver?: string
      personalBest5k?: string
      personalBest10k?: string
    }
  }
  trainingPlans?: Array<{
    id: string
    name: string
    status: string
    createdAt: string
    targetEvent?: string
    duration?: number
    totalWorkouts?: number
    completedWorkouts?: number
  }>
}

export default function UserDetailsModal({ isOpen, onClose, userId }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'activity' | 'subscription' | 'onboarding' | 'training-plans'>('overview')

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetails()
    }
  }, [isOpen, userId])

  const loadUserDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.data) {
        setUser(data.data)
      } else {
        throw new Error(data.message || 'Failed to load user details')
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading user details:', { error: error })
      setError(error instanceof Error ? error.message : 'Failed to load user details')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = (userId: string) => {
    // Navigate to subscription management page with user filter
    window.location.href = `/admin/subscriptions?userId=${userId}`
  }

  const handleChangeUserPlan = async (userId: string, planType: 'free' | 'premium' | 'pro') => {
    if (!confirm(`Vai tiešām vēlaties mainīt lietotāja abonements uz "${planType}"?`)) {
      return
    }

    try {
      // Update user subscription type in backend
      const response = await apiService.put(`/api/admin/users/${userId}`, {
        subscriptionType: planType
      }) as any

      if (response.data) {
        // Reload user details to show updated subscription
        await loadUserDetails()
        alert('Lietotāja abonements veiksmīgi atjaunināts!')
      }
    } catch (error) {
      logger.error('ERROR', 'Error updating user subscription:', { error: error })
      alert('Error atjauninot abonements: ' + (error as Error).message)
    }
  }

  const handleExtendSubscription = async (userId: string) => {
    if (!confirm('Vai tiešām vēlaties pagarināt lietotāja abonements par 30 dienām?')) {
      return
    }

    try {
      // Extend user subscription by 30 days
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/users/${userId}/extend-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days: 30 })
      })

      if (response.ok) {
        // Reload user details to show updated expiration date
        await loadUserDetails()
        alert('Lietotāja abonements veiksmīgi pagarināts par 30 dienām!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Neizdevās pagarināt abonements')
      }
    } catch (error) {
      logger.error('ERROR', 'Error extending subscription:', { error: error })
      alert('Error pagarinot abonements: ' + (error as Error).message)
    }
  }

  const handleGenerateTrainingPlan = async (userId: string) => {
    if (!confirm('Vai vēlaties izveidot jaunu AI treniņu plānu šim lietotājam?')) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/users/${userId}/generate-training-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await loadUserDetails()
        alert('Treniņu plāns veiksmīgi izveidots!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Neizdevās izveidot treniņu plānu')
      }
    } catch (error) {
      logger.error('ERROR', 'Error generating training plan:', { error: error })
      alert('Error izveidojot treniņu plānu: ' + (error as Error).message)
    }
  }

  const handleCreateQuickPlan = async (userId: string, planType: string) => {
    if (!confirm(`Vai vēlaties izveidot ${planType} treniņu plānu šim lietotājam?`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/users/${userId}/create-quick-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planType })
      })

      if (response.ok) {
        await loadUserDetails()
        alert('Treniņu plāns veiksmīgi izveidots!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Neizdevās izveidot treniņu plānu')
      }
    } catch (error) {
      logger.error('ERROR', 'Error creating quick plan:', { error: error })
      alert('Error izveidojot treniņu plānu: ' + (error as Error).message)
    }
  }

  const handleToggleTrainingPlanStatus = async (userId: string, planId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    if (!confirm(`Vai vēlaties ${newStatus === 'active' ? 'aktivizēt' : 'apturēt'} šo treniņu plānu?`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/users/${userId}/training-plans/${planId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadUserDetails()
        alert(`Treniņu plāna status veiksmīgi ${newStatus === 'active' ? 'aktivizēts' : 'apturēts'}!`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Neizdevās mainīt plāna statusu')
      }
    } catch (error) {
      logger.error('ERROR', 'Error toggling plan status:', { error: error })
      alert('Error mainot plāna statusu: ' + (error as Error).message)
    }
  }

  const handleDeleteTrainingPlan = async (userId: string, planId: string) => {
    if (!confirm('Vai tiešām vēlaties dzēst šo treniņu plānu? Šī darbība ir neatgriezeniska.')) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/users/${userId}/training-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await loadUserDetails()
        alert('Treniņu plāns veiksmīgi dzēsts!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Neizdevās dzēst treniņu plānu')
      }
    } catch (error) {
      logger.error('ERROR', 'Error deleting training plan:', { error: error })
      alert('Error dzēšot treniņu plānu: ' + (error as Error).message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {user ? `${user.firstName} ${user.lastName}` : 'Lietotāja detaļas'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-400">Ielādē lietotāja datus...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Error ielādējot datus</h3>
            <p className="text-gray-400 text-center mb-4">{error}</p>
            <button
              onClick={loadUserDetails}
              className="btn-primary"
            >
              Mēģināt vēlreiz
            </button>
          </div>
        ) : user ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'overview', label: 'Pārskats' },
                { id: 'workouts', label: 'Treniņi' },
                { id: 'activity', label: 'Aktivitāte' },
                { id: 'subscription', label: 'Abonements' },
                { id: 'onboarding', label: 'Onboarding' },
                { id: 'training-plans', label: 'Treniņu plāni' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-coral border-b-2 border-coral'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Pamatinformācija</h3>
                      <div>
                        <label className="text-sm text-gray-400">E-pasts</label>
                        <p className="text-white">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Loma</label>
                        <span className="block px-2 py-1 bg-coral/20 text-coral rounded text-sm w-fit mt-1">
                          {user.role === 'admin' ? 'Administrators' : user.role === 'coach' ? 'Treners' : 'Lietotājs'}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <span className={`block px-2 py-1 rounded text-sm w-fit mt-1 ${
                          user.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Reģistrācijas datums</label>
                        <p className="text-white">{new Date(user.createdAt).toLocaleString('lv')}</p>
                      </div>
                      {user.lastActiveAt && (
                        <div>
                          <label className="text-sm text-gray-400">Pēdējā aktivitāte</label>
                          <p className="text-white">{new Date(user.lastActiveAt).toLocaleString('lv')}</p>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Statistika</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-coral">{user.stats.totalWorkouts}</div>
                          <div className="text-sm text-gray-400">Treniņi</div>
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-coral">{user.stats.totalDistance}</div>
                          <div className="text-sm text-gray-400">km</div>
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-coral">{user.stats.averagePace}</div>
                          <div className="text-sm text-gray-400">Tempo</div>
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-coral">{user.stats.streakDays}</div>
                          <div className="text-sm text-gray-400">Dienu sērija</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Workouts Tab */}
              {activeTab === 'workouts' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Pēdējie treniņi</h3>
                  <div className="space-y-3">
                    {user.recentWorkouts.map((workout) => (
                      <div key={workout.id} className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{workout.name}</h4>
                            <p className="text-sm text-gray-400">{workout.type}</p>
                          </div>
                          <div className="text-right text-sm text-gray-400">
                            <div>{new Date(workout.date).toLocaleDateString('en-US')}</div>
                            <div>{workout.distance}km • {Math.round(workout.duration / 60)}min</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Aktivitātes žurnāls</h3>
                  <div className="space-y-3">
                    {user.activityLog.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-coral rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-white">{activity.action}</p>
                          {activity.details && (
                            <p className="text-sm text-gray-400">{activity.details}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString('lv')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Abonements un piekļuve</h3>
                    <button
                      onClick={() => handleManageSubscription(user.id)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Pārvaldīt
                    </button>
                  </div>

                  {/* Current Subscription Status */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Pašreizējais abonements</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Plāns</label>
                        <p className="text-white font-medium">
                          {user.subscription?.plan || 'Bezmaksas'}
                          {user.subscription?.status === 'active' && (
                            <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <span className={`block px-2 py-1 rounded text-sm w-fit mt-1 ${
                          user.subscription?.status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {user.subscription?.status === 'active' ? 'Active' : 'Inactive/Bezmaksas'}
                        </span>
                      </div>
                      {user.subscription?.expiresAt && (
                        <div>
                          <label className="text-sm text-gray-400">Beidzas</label>
                          <p className="text-white">{new Date(user.subscription.expiresAt).toLocaleDateString('en-US')}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm text-gray-400">Reģistrēts</label>
                        <p className="text-white">{new Date(user.createdAt).toLocaleDateString('en-US')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Actions */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Abonements darbības</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleChangeUserPlan(user.id, 'free')}
                        className="btn-secondary text-sm py-2"
                        disabled={user.subscription?.plan === 'Bezmaksas'}
                      >
                        Iestatīt Bezmaksas
                      </button>
                      <button
                        onClick={() => handleChangeUserPlan(user.id, 'premium')}
                        className="btn-secondary text-sm py-2"
                        disabled={user.subscription?.plan === 'Premium'}
                      >
                        Iestatīt Premium
                      </button>
                      <button
                        onClick={() => handleChangeUserPlan(user.id, 'pro')}
                        className="btn-secondary text-sm py-2"
                        disabled={user.subscription?.plan === 'Pro'}
                      >
                        Iestatīt Pro
                      </button>
                      <button
                        onClick={() => handleExtendSubscription(user.id)}
                        className="btn-secondary text-sm py-2"
                        disabled={!user.subscription || user.subscription.status !== 'active'}
                      >
                        Pagarināt (+30 dienas)
                      </button>
                    </div>
                  </div>

                  {/* Access Restrictions */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Piekļuves ierobežojumi</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">AI Coaching</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          (user.subscription?.plan === 'Premium' || user.subscription?.plan === 'Pro') 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {(user.subscription?.plan === 'Premium' || user.subscription?.plan === 'Pro') ? 'Available' : 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Neierobežoti treniņplāni</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          (user.subscription?.plan === 'Premium' || user.subscription?.plan === 'Pro') 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {(user.subscription?.plan === 'Premium' || user.subscription?.plan === 'Pro') ? 'Available' : 'Ierobežots (2 plāni)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Personīgais treners</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.subscription?.plan === 'Pro' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.subscription?.plan === 'Pro' ? 'Available' : 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Datu glabāšana</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          (user.subscription?.plan === 'Premium' || user.subscription?.plan === 'Pro') 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {(user.subscription?.plan === 'Premium' || user.subscription?.plan === 'Pro') ? 'Neierobežots' : '1 mēnesis'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Onboarding Tab */}
              {activeTab === 'onboarding' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Onboarding informācija</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      user.onboarding?.completed 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {user.onboarding?.completed ? 'Completed' : 'Nav pabeigts'}
                    </span>
                  </div>

                  {user.onboarding?.completedAt && (
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <label className="text-sm text-gray-400">Completed</label>
                      <p className="text-white">{new Date(user.onboarding.completedAt).toLocaleString('lv')}</p>
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Personālā informācija</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Augums</label>
                        <p className="text-white">{user.onboarding?.personalInfo.height ? `${user.onboarding.personalInfo.height} cm` : 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Svars</label>
                        <p className="text-white">{user.onboarding?.personalInfo.weight ? `${user.onboarding.personalInfo.weight} kg` : 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Dzimšanas datums</label>
                        <p className="text-white">{user.onboarding?.personalInfo.birthDate ? new Date(user.onboarding.personalInfo.birthDate).toLocaleDateString('en-US') : 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Dzimums</label>
                        <p className="text-white">{user.onboarding?.personalInfo.gender === 'male' ? 'Vīrietis' : user.onboarding?.personalInfo.gender === 'female' ? 'Sieviete' : 'Nav norādīts'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Health Information */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Veselības informācija</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Fiziskās sagatavotības līmenis</label>
                        <p className="text-white">{user.onboarding?.healthInfo.fitnessLevel || 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Miega stundas</label>
                        <p className="text-white">{user.onboarding?.healthInfo.sleepHours ? `${user.onboarding.healthInfo.sleepHours}h` : 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Stresa līmenis (1-10)</label>
                        <p className="text-white">{user.onboarding?.healthInfo.stressLevel || 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Uztura kvalitāte (1-10)</label>
                        <p className="text-white">{user.onboarding?.healthInfo.nutritionQuality || 'Nav norādīts'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Treniņu mērķi</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Nedēļas mērķis</label>
                        <p className="text-white">{user.onboarding?.goals.weeklyGoal ? `${user.onboarding.goals.weeklyGoal} km` : 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Vēlamā distance</label>
                        <p className="text-white">{user.onboarding?.goals.preferredDistance || 'Nav norādīta'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Mērķa sacensību veids</label>
                        <p className="text-white">{user.onboarding?.goals.targetEventType || 'Nav norādīts'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Treniņa intensitāte</label>
                        <p className="text-white">{user.onboarding?.goals.trainingIntensityPref || 'Nav norādīta'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Skriešanas pieredze</label>
                        <p className="text-white">{user.onboarding?.goals.hasRunningExperience ? 'Jā' : 'Nē'}</p>
                      </div>
                      {user.onboarding?.goals.hasRunningExperience && (
                        <>
                          <div>
                            <label className="text-sm text-gray-400">Pieredzes līmenis</label>
                            <p className="text-white">{user.onboarding?.goals.runningExperience || 'Nav norādīts'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Garākā distance</label>
                            <p className="text-white">{user.onboarding?.goals.longestRunEver ? `${user.onboarding.goals.longestRunEver} km` : 'Nav norādīta'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Labākais 5km</label>
                            <p className="text-white">{user.onboarding?.goals.personalBest5k || 'Nav norādīts'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Labākais 10km</label>
                            <p className="text-white">{user.onboarding?.goals.personalBest10k || 'Nav norādīts'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Training Plans Tab */}
              {activeTab === 'training-plans' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Treniņu plānu pārvaldība</h3>
                    <button
                      onClick={() => handleGenerateTrainingPlan(user.id)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Izveidot jaunu plānu
                    </button>
                  </div>

                  {/* Current Training Plans */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Pašreizējie treniņu plāni</h4>
                    {user.trainingPlans && user.trainingPlans.length > 0 ? (
                      <div className="space-y-3">
                        {user.trainingPlans.map((plan) => (
                          <div key={plan.id} className="bg-gray-700/50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-white">{plan.name}</h5>
                                <p className="text-sm text-gray-400">
                                  Status: <span className={`px-2 py-1 rounded text-xs ${
                                    plan.status === 'active' 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : plan.status === 'completed'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {plan.status === 'active' ? 'Active' : 
                                     plan.status === 'completed' ? 'Completed' : 
                                     plan.status === 'paused' ? 'Paused' : plan.status}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {new Date(plan.createdAt).toLocaleDateString('en-US')}
                                </p>
                                {plan.targetEvent && (
                                  <p className="text-xs text-gray-500">
                                    Mērķis: {plan.targetEvent}
                                  </p>
                                )}
                                {plan.totalWorkouts && (
                                  <p className="text-xs text-gray-500">
                                    Progress: {plan.completedWorkouts || 0}/{plan.totalWorkouts} treniņi
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleToggleTrainingPlanStatus(user.id, plan.id, plan.status)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                  title={plan.status === 'active' ? 'Apturēt plānu' : 'Aktivizēt plānu'}
                                >
                                  {plan.status === 'active' ? 'Apturēt' : 'Aktivizēt'}
                                </button>
                                <button
                                  onClick={() => handleDeleteTrainingPlan(user.id, plan.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                  title="Delete plānu"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">
                        Lietotājam nav izveidotu treniņu plānu
                      </p>
                    )}
                  </div>

                  {/* Training Plan Templates */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Ātrie treniņu plāni</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleCreateQuickPlan(user.id, 'beginner')}
                        className="btn-secondary text-sm py-2"
                      >
                        Iesācēju 5K plāns
                      </button>
                      <button
                        onClick={() => handleCreateQuickPlan(user.id, 'intermediate')}
                        className="btn-secondary text-sm py-2"
                      >
                        Vidēja līmeņa 10K
                      </button>
                      <button
                        onClick={() => handleCreateQuickPlan(user.id, 'advanced')}
                        className="btn-secondary text-sm py-2"
                      >
                        Pusmaratona sagatavošana
                      </button>
                      <button
                        onClick={() => handleCreateQuickPlan(user.id, 'strength')}
                        className="btn-secondary text-sm py-2"
                      >
                        Spēka treniņi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Neizdevās ielādēt lietotāja datus
          </div>
        )}
      </div>
    </div>
  )
}