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

interface WeekProgressProps {
  userStats: UserStats
}

const WeekProgress: React.FC<WeekProgressProps> = ({ userStats }) => {
  // Calculate progress percentage
  const progressPercentage = userStats.weeklyGoal > 0 
    ? Math.min((userStats.weeklyProgress / userStats.weeklyGoal) * 100, 100)
    : 0

  // Calculate remaining distance
  const remainingDistance = Math.max(userStats.weeklyGoal - userStats.weeklyProgress, 0)

  // Get week dates
  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1))
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7))

  // Weekly data should come from props or API - no random data generation
  // TODO: Accept weeklyWorkoutData as prop from parent component
  const weeklyData = [
    { day: 'P', distance: 0, completed: false },
    { day: 'O', distance: 0, completed: false },
    { day: 'T', distance: 0, completed: false },
    { day: 'C', distance: 0, completed: false },
    { day: 'P', distance: 0, completed: false },
    { day: 'S', distance: 0, completed: false },
    { day: 'Sv', distance: 0, completed: false }
  ]

  // Calculate streak color
  const getStreakColor = () => {
    if (userStats.streakDays >= 7) return 'var(--deyarun-success)'
    if (userStats.streakDays >= 3) return 'var(--deyarun-warning)'
    return 'var(--deyarun-primary)'
  }

  // Get motivational message
  const getMotivationalMessage = () => {
    if (progressPercentage >= 100) {
      return 'Weekly goal achieved! 🎉'
    } else if (progressPercentage >= 80) {
      return 'Almost there! 💪'
    } else if (progressPercentage >= 50) {
      return 'Great progress! 🏃‍♂️'
    } else if (progressPercentage > 0) {
      return 'Good start, keep going! 🌟'
    } else {
      return 'Time to start this week\'s workouts! ⚡'
    }
  }

  return (
    <div className="space-y-6">
      {/* Weekly Goal Progress */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-adaptive-white">Weekly Progress</h2>
          <div className="text-sm text-adaptive-light">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        {userStats.weeklyGoal > 0 ? (
          <div className="space-y-4">
            {/* Progress Circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-adaptive-light"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress arc */}
                  <path
                    className="text-[var(--deyarun-primary)]"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${progressPercentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-adaptive-white">
                      {Math.round(progressPercentage)}%
                    </div>
                    <div className="text-xs text-adaptive-light">completed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <div className="text-lg font-semibold text-[var(--deyarun-primary)]">
                  {userStats.weeklyProgress.toFixed(1)} km
                </div>
                <div className="text-xs text-adaptive-light">Of goal</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <div className="text-lg font-semibold text-adaptive-white">
                  {remainingDistance.toFixed(1)} km
                </div>
                <div className="text-xs text-adaptive-light">Remaining</div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="text-center p-3 rounded-lg bg-gradient-to-r from-[var(--deyarun-primary)]/10 to-[var(--deyarun-secondary)]/10 border border-[var(--deyarun-primary)]/30">
              <p className="text-[var(--deyarun-primary)] font-medium text-sm">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>
        ) : (
          /* No Goal Set */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-adaptive-white mb-2">Iestatīt nedēļas mērķi</h3>
            <p className="text-adaptive-light text-sm mb-4">
              Definējiet savu nedēļas kilometru mērķi, lai sekotu progresam
            </p>
            <a
              href="/profile/goals"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--deyarun-primary)] text-white hover:bg-[var(--deyarun-primary)]/90 transition-colors"
            >
              Iestatīt mērķi
            </a>
          </div>
        )}
      </div>

      {/* Streak Counter */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-adaptive-white">Treniņu sērija</h3>
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStreakColor() }}
            ></div>
            <span className="text-sm" style={{ color: getStreakColor() }}>
              {userStats.streakDays >= 7 ? 'Izcila' : userStats.streakDays >= 3 ? 'Laba' : 'Sāc'}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-adaptive-white mb-1">
            {userStats.streakDays}
          </div>
          <div className="text-adaptive-light text-sm mb-4">
            {userStats.streakDays === 1 ? 'diena' : 'dienas'} pēc kārtas
          </div>
          
          {userStats.streakDays > 0 && (
            <div className="text-xs text-muted">
              Turpini, lai uzlabotu savu rekordu!
            </div>
          )}
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-adaptive-white">Nedēļas aktivitāte</h3>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weeklyData.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-adaptive-light mb-2">{day.day}</div>
              <div className="h-16 w-full bg-gray-800 rounded-lg flex items-end justify-center p-1">
                <div
                  className={`w-full rounded transition-all duration-300 ${
                    day.completed 
                      ? 'bg-gradient-to-t from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)]'
                      : 'bg-gray-700'
                  }`}
                  style={{ 
                    height: day.completed ? `${Math.max((day.distance / 10) * 100, 10)}%` : '20%',
                    opacity: day.completed ? 1 : 0.3
                  }}
                ></div>
              </div>
              <div className="text-xs text-adaptive-light mt-1">
                {day.completed ? `${day.distance.toFixed(1)}km` : '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeekProgress