import { useState, useEffect } from 'react'
import { Card, AreaChart, BarChart, LineChart, Metric } from '@tremor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { logger } from '../../lib/productionLogger';
import { 
  CalendarDaysIcon,
  ChartBarIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon,
  MapIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { trainingIntelligenceAPI, WeeklyReport, StreakData, DailyProgress, formatPace, formatDistance } from '../../lib/trainingIntelligenceAPI'
import toast from 'react-hot-toast'

interface ProgressTrackerProps {
  userId?: string
}

export default function ProgressTracker({ userId }: ProgressTrackerProps) {
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [dailyProgress, setDailyProgress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'weekly' | 'streaks'>('overview')

  const loadProgressData = async () => {
    try {
      setIsLoading(true)
      
      // Load weekly report and streaks in parallel
      const [weeklyResponse, streaksResponse] = await Promise.all([
        trainingIntelligenceAPI.getWeeklyReport(),
        trainingIntelligenceAPI.getStreaks()
      ])

      if (weeklyResponse.success) {
        setWeeklyReport(weeklyResponse.report)
      }

      if (streaksResponse.success) {
        setStreakData(streaksResponse.streaks)
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading progress data:', { error: error })
      toast.error('Failed to load progress data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDailyProgress = async (date: string) => {
    try {
      const response = await trainingIntelligenceAPI.getDailyProgress(date)
      if (response.success) {
        setDailyProgress(response)
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading daily progress:', { error: error })
      toast.error('Failed to load daily progress')
    }
  }

  useEffect(() => {
    loadProgressData()
  }, [userId])

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyProgress(selectedDate)
    }
  }, [selectedDate, activeTab])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Progress Tracking</h2>
          <div className="animate-spin w-6 h-6 border-2 border-coral border-t-transparent rounded-full"></div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Prepare weekly progression chart data
  const weeklyChartData = weeklyReport ? [
    { metric: 'Distance', current: Math.round(weeklyReport.metrics.totalDistance / 1000), previous: Math.round((weeklyReport.previousMetrics.totalDistance || 0) / 1000) },
    { metric: 'Duration', current: Math.round(weeklyReport.metrics.totalDuration / 60), previous: Math.round((weeklyReport.previousMetrics.totalDuration || 0) / 60) },
    { metric: 'Workouts', current: weeklyReport.metrics.workoutsCompleted, previous: weeklyReport.previousMetrics.workoutsCompleted },
    { metric: 'Avg Pace', current: Math.round(weeklyReport.metrics.averagePace), previous: Math.round(weeklyReport.previousMetrics.averagePace || 0) }
  ] : []

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'daily', name: 'Daily', icon: CalendarDaysIcon },
    { id: 'weekly', name: 'Weekly', icon: Bars3Icon },
    { id: 'streaks', name: 'Streaks', icon: FireIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-8 h-8 text-coral" />
          <h2 className="text-2xl font-bold text-white">Progress Tracking</h2>
        </div>
        <button
          onClick={loadProgressData}
          className="btn btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-coral text-coral'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && weeklyReport && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* This Week Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Distance</p>
                    <Metric className="text-white">
                      {formatDistance(weeklyReport.metrics.totalDistance)}
                    </Metric>
                    <p className="text-xs text-coral mt-1">
                      {weeklyReport.improvements.distance > 0 ? '+' : ''}{weeklyReport.improvements.distance}% vs last week
                    </p>
                  </div>
                  <MapIcon className="w-8 h-8 text-coral" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Workouts</p>
                    <Metric className="text-white">{weeklyReport.metrics.workoutsCompleted}</Metric>
                    <p className="text-xs text-coral mt-1">
                      {weeklyReport.improvements.workouts > 0 ? '+' : ''}{weeklyReport.improvements.workouts}% vs last week
                    </p>
                  </div>
                  <TrophyIcon className="w-8 h-8 text-coral" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Average Pace</p>
                    <Metric className="text-white">
                      {formatPace(weeklyReport.metrics.averagePace)}
                    </Metric>
                    <p className="text-xs text-coral mt-1">
                      {weeklyReport.improvements.pace < 0 ? 'Improved by ' : 'Slower by '}
                      {Math.abs(weeklyReport.improvements.pace)}%
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-coral" />
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Adherence Rate</p>
                    <Metric className="text-white">{weeklyReport.metrics.adherenceRate}%</Metric>
                    <p className="text-xs text-gray-400 mt-1">planned workouts completed</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-coral" />
                </div>
              </Card>
            </div>

            {/* Weekly Comparison Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">This Week vs Last Week</h3>
              <BarChart
                data={weeklyChartData}
                index="metric"
                categories={["current", "previous"]}
                colors={["coral", "gray"]}
                className="h-48"
                showXAxis={true}
                showYAxis={true}
                showGridLines={false}
              />
            </Card>

            {/* Highlights & Recommendations */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-gray-900 border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Weekly Highlights</h3>
                <div className="space-y-3">
                  {weeklyReport.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-coral rounded-full flex-shrink-0"></div>
                      <p className="text-sm text-gray-300">{highlight}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {weeklyReport.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
                      <span className="inline-block px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded mt-2">
                        {rec.type}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Daily Tab */}
        {activeTab === 'daily' && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Date Selector */}
            <Card className="bg-gray-900 border-gray-800">
              <div className="flex items-center gap-4">
                <CalendarDaysIcon className="w-6 h-6 text-coral" />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                  />
                </div>
              </div>
            </Card>

            {/* Daily Progress */}
            {dailyProgress && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gray-900 border-gray-800">
                  <p className="text-sm text-gray-400">Workouts Completed</p>
                  <Metric className="text-white">{dailyProgress.workouts.completed}</Metric>
                  <p className="text-xs text-gray-400">of {dailyProgress.workouts.planned} planned</p>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <p className="text-sm text-gray-400">Total Distance</p>
                  <Metric className="text-white">
                    {formatDistance(dailyProgress.metrics.totalDistance)}
                  </Metric>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <p className="text-sm text-gray-400">Total Duration</p>
                  <Metric className="text-white">
                    {Math.round(dailyProgress.metrics.totalDuration / 60)} min
                  </Metric>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <p className="text-sm text-gray-400">Average Pace</p>
                  <Metric className="text-white">
                    {dailyProgress.metrics.averagePace > 0 ? formatPace(dailyProgress.metrics.averagePace) : 'N/A'}
                  </Metric>
                </Card>
              </div>
            )}

            {/* Daily Workouts */}
            {dailyProgress?.details.completedWorkouts && (
              <Card className="bg-gray-900 border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Completed Workouts</h3>
                <div className="space-y-3">
                  {dailyProgress.details.completedWorkouts.map((workout: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral flex items-center justify-center">
                          <TrophyIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{workout.type || 'Running'}</p>
                          <p className="text-sm text-gray-400">
                            {formatDistance(workout.distance)} • {Math.round(workout.duration / 60)} min
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-coral font-medium">{formatPace(workout.pace)}</p>
                        <p className="text-xs text-gray-400">{workout.calories} cal</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Streaks Tab */}
        {activeTab === 'streaks' && streakData && (
          <motion.div
            key="streaks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Streak Overview */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <FireIcon className="w-8 h-8 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Current Streak</h3>
                </div>
                <Metric className="text-orange-400">{streakData.current}</Metric>
                <p className="text-sm text-gray-400">consecutive days</p>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <TrophyIcon className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Longest Streak</h3>
                </div>
                <Metric className="text-yellow-400">{streakData.longest}</Metric>
                <p className="text-sm text-gray-400">personal record</p>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <ChartBarIcon className="w-8 h-8 text-coral" />
                  <h3 className="text-lg font-semibold text-white">Next Milestone</h3>
                </div>
                <Metric className="text-coral">{streakData.milestones.next}</Metric>
                <p className="text-sm text-gray-400">days to go: {streakData.milestones.next - streakData.current}</p>
              </Card>
            </div>

            {/* Achieved Milestones */}
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Achieved Milestones</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {streakData.milestones.achieved.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <TrophyIcon className="w-6 h-6 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">{milestone} Days</p>
                      <p className="text-xs text-gray-400">Milestone achieved</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}