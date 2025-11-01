import React from 'react'

interface UserStats {
  totalDistance: number
  totalWorkouts: number
  avgPace: number
  weeklyGoal: number
  weeklyProgress: number
  streakDays: number
  totalTime: number
  favoriteDistance: string
  isRealData: boolean
}

interface QuickStatsProps {
  userStats: UserStats
}

const QuickStats: React.FC<QuickStatsProps> = ({ userStats }) => {
  // Format functions
  const formatPace = (pace: number) => {
    if (!pace || pace <= 0) return '--:--'
    const minutes = Math.floor(pace)
    const seconds = Math.floor((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1)
  }

  // Calculate calories (rough estimate: 60 cal/km for average person)
  const estimatedCalories = Math.round((userStats.totalDistance / 1000) * 60)

  // Stats configuration
  const stats = [
    {
      id: 'distance',
      title: 'Kopējais attālums',
      value: userStats.isRealData ? `${formatDistance(userStats.totalDistance)} km` : '0.0 km',
      subtitle: userStats.isRealData ? 'Līdz šim veikts' : 'Sāc pirmo skrējienu',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'primary',
      trend: userStats.isRealData ? '+' + formatDistance(userStats.weeklyProgress) + ' km šonedēļ' : null
    },
    {
      id: 'workouts',
      title: 'Treniņu skaits',
      value: userStats.isRealData ? userStats.totalWorkouts.toString() : '0',
      subtitle: userStats.totalWorkouts === 1 ? 'treniņš' : 'treniņi',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'secondary',
      trend: userStats.streakDays > 0 ? `${userStats.streakDays} dienu sērija` : null
    },
    {
      id: 'pace',
      title: 'Vidējais temps',
      value: userStats.isRealData && userStats.avgPace > 0 ? `${formatPace(userStats.avgPace)} min/km` : '--:-- min/km',
      subtitle: userStats.isRealData ? 'Aprēķināts temps' : 'Nav datu',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'warning',
      trend: userStats.avgPace > 0 && userStats.avgPace < 6 ? 'Ātrs temps!' : userStats.avgPace > 6 ? 'Mērens temps' : null
    },
    {
      id: 'time',
      title: 'Kopējais laiks',
      value: userStats.isRealData ? formatDuration(userStats.totalTime) : '0m',
      subtitle: userStats.isRealData ? 'Aktīvs laiks' : 'Nav treniņu',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'accent',
      trend: userStats.totalTime > 120 ? `~${estimatedCalories} kcal sadedzināts` : null
    }
  ]

  // Get color for stat card
  const getStatColor = (color: string) => {
    switch (color) {
      case 'primary': return 'var(--deyarun-primary)'
      case 'secondary': return 'var(--deyarun-secondary)'
      case 'warning': return 'var(--deyarun-warning)'
      case 'accent': return 'var(--deyarun-accent)'
      case 'success': return 'var(--deyarun-success)'
      default: return 'var(--deyarun-primary)'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-adaptive-white">Ātrā statistika</h2>
        {userStats.isRealData && (
          <a 
            href="/analytics" 
            className="text-sm text-[var(--deyarun-primary)] hover:text-[var(--deyarun-secondary)] transition-colors"
          >
            Detalizēta analīze →
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.id} className="glass-card rounded-xl p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${getStatColor(stat.color)}20` }}
              >
                <div style={{ color: getStatColor(stat.color) }}>
                  {stat.icon}
                </div>
              </div>
              {stat.trend && (
                <div className="text-xs text-adaptive-light">
                  {stat.trend}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-adaptive-light">
                {stat.title}
              </h3>
              <div className="text-xl font-bold text-adaptive-white">
                {stat.value}
              </div>
              <div className="text-xs text-muted">
                {stat.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      {userStats.isRealData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Favorite Distance */}
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-[var(--deyarun-accent)] text-2xl font-bold mb-1">
              {userStats.favoriteDistance}
            </div>
            <div className="text-adaptive-light text-sm">Iecienītākais attālums</div>
          </div>

          {/* Weekly Goal Progress */}
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-[var(--deyarun-success)] text-2xl font-bold mb-1">
              {userStats.weeklyGoal > 0 ? Math.round((userStats.weeklyProgress / userStats.weeklyGoal) * 100) : 0}%
            </div>
            <div className="text-adaptive-light text-sm">Nedēļas mērķis</div>
          </div>

          {/* Running Consistency */}
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-[var(--deyarun-warning)] text-2xl font-bold mb-1">
              {userStats.totalWorkouts > 0 ? Math.round(userStats.totalWorkouts / Math.max(Math.ceil((Date.now() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)), 1)) : 0}
            </div>
            <div className="text-adaptive-light text-sm">Treniņi/nedēļā</div>
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {!userStats.isRealData && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--deyarun-primary)]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-adaptive-white mb-2">
            Sāciet savu skriešanas statistiku
          </h3>
          <p className="text-adaptive-light text-sm mb-6">
            Uzsāciet pirmo treniņu, lai redzētu savu personīgo statistiku un progress šeit.
          </p>
          <div className="space-y-3">
            <a
              href="/workouts"
              className="inline-block gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
            >
              Sākt pirmo treniņu
            </a>
            <div className="text-xs text-muted">
              Vai <a href="/training-plans" className="text-[var(--deyarun-secondary)] hover:underline">izveidojiet AI treniņu plānu</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickStats