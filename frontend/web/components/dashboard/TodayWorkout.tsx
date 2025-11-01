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

interface TrainingPlan {
  id: string
  title: string
  date: string
  duration: number
}

interface TodayWorkoutProps {
  userStats: UserStats
  upcomingPlans: TrainingPlan[]
}

const TodayWorkout: React.FC<TodayWorkoutProps> = ({ userStats, upcomingPlans }) => {
  // Check if there's a workout scheduled for today
  const today = new Date()
  const todayFormatted = today.toISOString().split('T')[0]
  
  const todaysPlan = upcomingPlans.find(plan => 
    plan.date.split('T')[0] === todayFormatted
  )

  // Format duration helper
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Format pace helper
  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace)
    const seconds = Math.floor((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get recommended workout based on user's history
  const getRecommendedWorkout = () => {
    if (userStats.totalWorkouts === 0) {
      return {
        type: 'Viegls skrējiens',
        duration: 20,
        distance: 2,
        description: 'Ideāls sākums jūsu skriešanas ceļojumam',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        color: 'success'
      }
    } else if (userStats.streakDays >= 3) {
      return {
        type: 'Tempo skrējiens',
        duration: 35,
        distance: 5,
        description: 'Uzlabojiet savu ātrumu ar tempo treniņu',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'warning'
      }
    } else {
      return {
        type: 'Viegls skrējiens',
        duration: 25,
        distance: 3,
        description: 'Turpiniet ar mērenu intensitāti',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        color: 'success'
      }
    }
  }

  const recommendedWorkout = getRecommendedWorkout()

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-adaptive-white">Šodienas treniņš</h2>
        <div className="text-sm text-adaptive-light">
          {today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {todaysPlan ? (
        /* Scheduled Workout */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-[var(--deyarun-primary)]/20">
                <svg className="w-6 h-6 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-adaptive-white">{todaysPlan.title}</h3>
                <p className="text-adaptive-light">Plānotais treniņš</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[var(--deyarun-primary)] font-medium">
                {formatDuration(todaysPlan.duration)}
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <a
              href="/workouts"
              className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 text-center"
            >
              Sākt treniņu
            </a>
            <button className="px-4 py-3 rounded-xl border border-gray-600 text-adaptive-light hover:border-[var(--deyarun-primary)] hover:text-[var(--deyarun-primary)] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* Recommended Workout */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full bg-[var(--deyarun-${recommendedWorkout.color})]/20`}>
                <div className={`text-[var(--deyarun-${recommendedWorkout.color})]`}>
                  {recommendedWorkout.icon}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-adaptive-white">{recommendedWorkout.type}</h3>
                <p className="text-adaptive-light">{recommendedWorkout.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[var(--deyarun-${recommendedWorkout.color})] font-medium`}>
                {recommendedWorkout.distance} km
              </div>
              <div className="text-adaptive-light text-sm">
                ~{formatDuration(recommendedWorkout.duration)}
              </div>
            </div>
          </div>

          {/* Workout Stats Preview */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-700">
            <div className="text-center">
              <div className="text-adaptive-white font-semibold">{recommendedWorkout.distance} km</div>
              <div className="text-adaptive-light text-xs">Attālums</div>
            </div>
            <div className="text-center">
              <div className="text-adaptive-white font-semibold">
                {userStats.avgPace > 0 ? formatPace(userStats.avgPace) : '5:30'} min/km
              </div>
              <div className="text-adaptive-light text-xs">Mērķa temps</div>
            </div>
            <div className="text-center">
              <div className="text-adaptive-white font-semibold">{formatDuration(recommendedWorkout.duration)}</div>
              <div className="text-adaptive-light text-xs">Ilgums</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <a
              href="/workouts"
              className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 text-center"
            >
              Sākt skrējienu
            </a>
            <a
              href="/training-plans"
              className="px-4 py-3 rounded-xl border border-gray-600 text-adaptive-light hover:border-[var(--deyarun-secondary)] hover:text-[var(--deyarun-secondary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Today's Weather Hint */}
      <div className="mt-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-[var(--deyarun-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <span className="text-adaptive-light">Laika apstākļi</span>
          </div>
          <span className="text-[var(--deyarun-accent)]">Piemērots skrējienam</span>
        </div>
      </div>
    </div>
  )
}

export default TodayWorkout