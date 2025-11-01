import React from 'react'
import TodayWorkout from './TodayWorkout'
import WeekProgress from './WeekProgress'
import QuickStats from './QuickStats'
import UpcomingWorkouts from './UpcomingWorkouts'

interface User {
  id: string
  firstName?: string
  lastName?: string
  email: string
  weeklyGoal?: number
  preferredDistance?: string
}

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

interface Workout {
  id: string
  type: string
  startTime?: string
  date: string
  distance: number
  duration: number
  pace: number | string
}

interface TrainingPlan {
  id: string
  title: string
  date: string
  duration: number
}

interface DashboardMainProps {
  user: User | null
  userStats: UserStats
  recentWorkouts: Workout[]
  upcomingPlans: TrainingPlan[]
  onRefresh?: () => void
}

const DashboardMain: React.FC<DashboardMainProps> = ({
  user,
  userStats,
  recentWorkouts,
  upcomingPlans,
  onRefresh
}) => {
  // Quick actions for the dashboard
  const quickActions = [
    {
      title: 'Sākt treniņu',
      description: 'Sākt jaunu skrējiena sesiju',
      href: '/workouts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'gradient-primary'
    },
    {
      title: 'Kalendārs',
      description: 'Apskatīt treniņu kalendāru',
      href: '/calendar',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'gradient-secondary'
    },
    {
      title: 'Treniņu plāns',
      description: 'Personalizēti treniņu plāni',
      href: '/training-plans',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      gradient: 'gradient-success'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-adaptive-white mb-2">
          Sveiki, {user?.firstName || user?.email?.split('@')[0]}! 🏃‍♂️
        </h1>
        <p className="text-adaptive-light text-lg">
          Jūsu treniņu progresa apkopojums un nākamie izaicinājumi
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-2 text-sm text-[var(--deyarun-primary)] hover:text-[var(--deyarun-secondary)] transition-colors flex items-center gap-1 mx-auto md:mx-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh datus
          </button>
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Workout + Quick Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Workout */}
          <TodayWorkout 
            userStats={userStats} 
            upcomingPlans={upcomingPlans}
          />
          
          {/* Quick Stats */}
          <QuickStats userStats={userStats} />
        </div>

        {/* Right Column - Week Progress */}
        <div className="space-y-6">
          <WeekProgress userStats={userStats} />
          
          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-adaptive-white mb-4">Ātrās darbības</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="block"
                >
                  <div className={`${action.gradient} rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 text-white mr-3">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {action.title}
                        </h4>
                        <p className="text-white/80 text-sm truncate">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Upcoming Workouts */}
      <UpcomingWorkouts 
        recentWorkouts={recentWorkouts}
        upcomingPlans={upcomingPlans}
      />

      {/* Motivational Message */}
      {userStats.totalWorkouts === 0 ? (
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-[var(--deyarun-primary)]/20 to-[var(--deyarun-warning)]/20 border-[var(--deyarun-primary)]/30">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-adaptive-white">
                Sveicināti DeyaRun!
              </h3>
              <p className="text-[var(--deyarun-primary)] text-sm">
                Sāciet savu skriešanas ceļojumu ar pirmo treniņu. Katrs lielis ceļojums sākas ar vienu soli.
              </p>
            </div>
          </div>
        </div>
      ) : userStats.streakDays >= 7 ? (
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-[var(--deyarun-success)]/20 to-[var(--deyarun-secondary)]/20 border-[var(--deyarun-success)]/30">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-[var(--deyarun-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-adaptive-white">
                Fantastisks progress!
              </h3>
              <p className="text-[var(--deyarun-success)] text-sm">
                Tu esi uzturējis {userStats.streakDays} dienu treniņu sēriju. Turpini tā!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-[var(--deyarun-accent)]/20 to-[var(--deyarun-secondary)]/20 border-[var(--deyarun-accent)]/30">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-[var(--deyarun-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-adaptive-white">
                Turpini savu ceļojumu!
              </h3>
              <p className="text-[var(--deyarun-accent)] text-sm">
                Katrs solis tevi ved tuvāk tam, lai kļūtu par labāku skrējēju.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardMain