import { useState, useEffect } from 'react'
import { Card, Metric, AreaChart, DonutChart, BarChart, BadgeDelta } from '@tremor/react'
import { motion } from 'framer-motion'
import { logger } from '../../lib/productionLogger';
import { 
  ChartBarIcon, 
  TrophyIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { 
  trainingIntelligenceAPI, 
  TrainingIntelligenceDashboard as DashboardData, 
  AIInjuryAssessment,
  AIWorkoutRecommendations, 
  AIPerformanceAnalysis,
  formatPace, 
  formatDistance, 
  getRiskColor, 
  getRiskBgColor, 
  getConfidenceColor,
  formatAIConfidence,
  getAIRiskColor,
  getAIRiskBgColor,
  getIntensityColor,
  formatWorkoutDuration
} from '../../lib/trainingIntelligenceAPI'
import toast from 'react-hot-toast'

interface TrainingIntelligenceDashboardProps {
  userId?: string
}

export default function TrainingIntelligenceDashboard({ userId }: TrainingIntelligenceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = async () => {
    try {
      const response = await trainingIntelligenceAPI.getDashboard()
      if (response.success) {
        setDashboardData(response.dashboard)
        setError(null)
      } else {
        throw new Error('Failed to load dashboard')
      }
    } catch (err) {
      logger.error('ERROR', 'Error loading Training Intelligence dashboard:', { error: err })
      setError('Unable to load Training Intelligence data')
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const refreshDashboard = async () => {
    setRefreshing(true)
    await loadDashboard()
    toast.success('Dashboard refreshed')
  }

  useEffect(() => {
    loadDashboard()
  }, [userId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Training Intelligence</h2>
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

  if (error) {
    return (
      <div className="card text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Training Intelligence</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="card text-center py-12">
        <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Training Intelligence Data</h3>
        <p className="text-gray-400">Start tracking workouts to see intelligent insights</p>
      </div>
    )
  }

  const overview = dashboardData.overview
  const progress = dashboardData.progress
  const predictions = dashboardData.predictions
  const activePlan = dashboardData.activePlan
  const recommendations = dashboardData.recommendations

  // Prepare chart data
  const fitnessData = [
    { date: 'Week 1', fitness: predictions.fitnessLevel * 0.85 },
    { date: 'Week 2', fitness: predictions.fitnessLevel * 0.90 },
    { date: 'Week 3', fitness: predictions.fitnessLevel * 0.95 },
    { date: 'Week 4', fitness: predictions.fitnessLevel },
  ]

  const riskData = [
    { 
      name: 'Training Load', 
      value: predictions.riskFactors.trainingLoad?.score || 20,
      color: predictions.riskFactors.trainingLoad?.status === 'high' ? '#EF4444' : 
             predictions.riskFactors.trainingLoad?.status === 'moderate' ? '#F59E0B' : '#10B981'
    },
    { 
      name: 'Recovery', 
      value: predictions.riskFactors.recovery?.score || 15,
      color: predictions.riskFactors.recovery?.status === 'high' ? '#EF4444' : 
             predictions.riskFactors.recovery?.status === 'moderate' ? '#F59E0B' : '#10B981'
    },
    { 
      name: 'Biomechanical', 
      value: predictions.riskFactors.biomechanical?.score || 25,
      color: predictions.riskFactors.biomechanical?.status === 'high' ? '#EF4444' : 
             predictions.riskFactors.biomechanical?.status === 'moderate' ? '#F59E0B' : '#10B981'
    },
    { 
      name: 'Historical', 
      value: predictions.riskFactors.historical?.score || 30,
      color: predictions.riskFactors.historical?.status === 'high' ? '#EF4444' : 
             predictions.riskFactors.historical?.status === 'moderate' ? '#F59E0B' : '#10B981'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-coral" />
          <h2 className="text-2xl font-bold text-white">Training Intelligence</h2>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="btn btn-secondary flex items-center gap-2"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Fitness</p>
                <Metric className="text-white">
                  {Math.round(overview.currentFitness * 100)}%
                </Metric>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${getConfidenceColor(overview.fitnessConfidence > 0.8 ? 'high' : overview.fitnessConfidence > 0.6 ? 'medium' : 'low').replace('text-', 'bg-')}`}></div>
                  <p className="text-xs text-gray-400">
                    {Math.round(overview.fitnessConfidence * 100)}% confidence
                  </p>
                </div>
              </div>
              <ChartBarIcon className="w-8 h-8 text-coral" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Weekly Workouts</p>
                <Metric className="text-white">{overview.weeklyWorkouts}</Metric>
                <BadgeDelta deltaType={progress.improvements.workouts > 0 ? "increase" : progress.improvements.workouts < 0 ? "decrease" : "unchanged"}>
                  {progress.improvements.workouts > 0 ? '+' : ''}{progress.improvements.workouts}%
                </BadgeDelta>
              </div>
              <FireIcon className="w-8 h-8 text-coral" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Streak</p>
                <Metric className="text-white">{progress.streakDays}</Metric>
                <p className="text-xs text-gray-400 mt-2">consecutive days</p>
              </div>
              <TrophyIcon className="w-8 h-8 text-coral" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Injury Risk</p>
                <Metric className={`${getRiskColor(overview.injuryRisk)}`}>
                  {overview.injuryRisk.charAt(0).toUpperCase() + overview.injuryRisk.slice(1)}
                </Metric>
                <div className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${getRiskBgColor(overview.injuryRisk)} ${getRiskColor(overview.injuryRisk)}`}>
                  {predictions.injuryRisk}% risk score
                </div>
              </div>
              <ExclamationTriangleIcon className={`w-8 h-8 ${getRiskColor(overview.injuryRisk)}`} />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fitness Progression */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Fitness Progression</h3>
            <AreaChart
              data={fitnessData}
              index="date"
              categories={["fitness"]}
              colors={["coral"]}
              className="h-48"
              showXAxis={true}
              showYAxis={true}
              showGridLines={false}
            />
            <p className="text-sm text-gray-400 mt-2">
              Projected fitness improvement over next 4 weeks
            </p>
          </Card>
        </motion.div>

        {/* Risk Factor Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Factor Analysis</h3>
            <DonutChart
              data={riskData}
              category="value"
              index="name"
              colors={["red", "yellow", "green", "blue"]}
              className="h-48"
              showTooltip={true}
            />
            <p className="text-sm text-gray-400 mt-2">
              Breakdown of injury risk factors
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Active Plan & Recommendations */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Training Plan */}
        {activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gray-900 border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-6 h-6 text-coral" />
                <h3 className="text-lg font-semibold text-white">Active Plan</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-white">{activePlan.name}</h4>
                  <p className="text-sm text-gray-400">
                    Week {activePlan.currentWeek} of {activePlan.totalWeeks}
                  </p>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-coral h-2 rounded-full transition-all duration-300"
                    style={{ width: `${activePlan.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400">
                  {activePlan.progress}% complete
                </p>
                {activePlan.adaptationEnabled && (
                  <div className="flex items-center gap-2 mt-3">
                    <SparklesIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400">Smart Adaptation Enabled</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={activePlan ? "lg:col-span-2" : "lg:col-span-3"}
        >
          <Card className="bg-gray-900 border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="w-6 h-6 text-coral" />
              <h3 className="text-lg font-semibold text-white">Smart Recommendations</h3>
            </div>
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 3).map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
                      <span className="inline-block px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded mt-2">
                        {rec.type}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No recommendations available at this time.</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}