import { logger } from '../../lib/productionLogger'
'use client'

import { useState, useEffect } from 'react'
import { Card, Metric, AreaChart, DonutChart, BarChart, BadgeDelta, ProgressBar } from '@tremor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon, 
  TrophyIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon,
  HeartIcon,
  BoltIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { 
  trainingIntelligenceAPI, 
  AIInjuryAssessment,
  AIWorkoutRecommendations, 
  AIPerformanceAnalysis,
  formatPace, 
  formatDistance, 
  formatAIConfidence,
  getAIRiskColor,
  getAIRiskBgColor,
  getIntensityColor,
  formatWorkoutDuration
} from '../../lib/trainingIntelligenceAPI'
import toast from 'react-hot-toast'

interface AIAnalyticsDashboardProps {
  userId?: string
  userProfile?: any
}

export default function AIAnalyticsDashboard({ userId, userProfile }: AIAnalyticsDashboardProps) {
  const [aiInsights, setAiInsights] = useState<{
    injuryAssessment?: AIInjuryAssessment
    workoutRecommendations?: AIWorkoutRecommendations
    performanceAnalysis?: AIPerformanceAnalysis
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInsight, setSelectedInsight] = useState<'injury' | 'workouts' | 'performance'>('injury')

  const loadAIInsights = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Use actual user profile or show error if not provided
      if (!userProfile) {
        throw new Error('User profile required for AI analysis')
      }
      const profile = userProfile
      
      // Fetch actual workout data from API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const workoutResponse = await fetch(`${API_BASE_URL}/api/workouts/recent?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!workoutResponse.ok) {
        throw new Error('Failed to fetch workout history for AI analysis')
      }
      
      const workoutApiData = await workoutResponse.json()
      const workoutHistory = workoutApiData.workouts || []
      
      const workoutData = workoutHistory.map(w => ({
        ...w,
        averagePace: w.pace,
        status: 'completed'
      }))
      
      // Load AI features in parallel
      const [injuryResult, workoutResult, performanceResult] = await Promise.allSettled([
        trainingIntelligenceAPI.getInjuryRiskAssessment(profile, workoutHistory),
        trainingIntelligenceAPI.getWorkoutRecommendations(profile, workoutHistory.slice(-10)),
        trainingIntelligenceAPI.getPerformanceAnalysis(workoutData)
      ])
      
      const insights: any = {}
      
      if (injuryResult.status === 'fulfilled' && injuryResult.value.success) {
        insights.injuryAssessment = injuryResult.value.data
      } else {
        logger.info('COMPONENT', 'Injury assessment failed:', { injuryResult })
      }
      
      if (workoutResult.status === 'fulfilled' && workoutResult.value.success) {
        insights.workoutRecommendations = workoutResult.value.data
      } else {
        logger.info('COMPONENT', 'Workout recommendations failed:', { workoutResult })
      }
      
      if (performanceResult.status === 'fulfilled' && performanceResult.value.success) {
        insights.performanceAnalysis = performanceResult.value.data
      } else {
        logger.info('COMPONENT', 'Performance analysis failed:', { performanceResult })
      }
      
      setAiInsights(insights)
      toast.success('AI Analytics loaded successfully')
      
    } catch (error) {
      logger.error('ERROR', 'Error loading AI insights:', { error: error })
      setError('Failed to load AI analytics')
      toast.error('Failed to load AI insights')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAIInsights()
  }, [userId, userProfile])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="w-8 h-8 text-coral" />
            <h2 className="text-2xl font-bold text-white">AI Analytics</h2>
          </div>
          <div className="animate-spin w-6 h-6 border-2 border-coral border-t-transparent rounded-full"></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-64 bg-gray-800 rounded"></div>
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
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load AI Analytics</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadAIInsights}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!aiInsights || Object.keys(aiInsights).length === 0) {
    return (
      <div className="card text-center py-12">
        <CpuChipIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">AI Analytics Unavailable</h3>
        <p className="text-gray-400 mb-4">Premium subscription required for AI insights</p>
        <button className="btn btn-primary">Upgrade to Premium</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CpuChipIcon className="w-8 h-8 text-coral" />
          <h2 className="text-2xl font-bold text-white">AI Analytics</h2>
          <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-coral/20 text-yellow-400 text-sm rounded-full border border-yellow-500/30">
            PRO Feature
          </span>
        </div>
        <button
          onClick={loadAIInsights}
          disabled={isLoading}
          className="px-4 py-2 bg-coral/20 text-coral rounded-lg hover:bg-coral/30 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <motion.div
            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
          >
            <SparklesIcon className="w-4 h-4" />
          </motion.div>
          {isLoading ? 'Analyzing...' : 'Refresh AI'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'injury', label: 'Injury Risk', icon: ShieldCheckIcon },
          { key: 'workouts', label: 'Workout AI', icon: FireIcon },
          { key: 'performance', label: 'Performance', icon: ChartBarIcon }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedInsight(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              selectedInsight === tab.key
                ? 'bg-coral text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {selectedInsight === 'injury' && aiInsights.injuryAssessment && (
          <motion.div
            key="injury"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Injury Risk Overview */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="bg-gray-900 border-gray-800 lg:col-span-1">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getAIRiskBgColor(aiInsights.injuryAssessment.overallRisk)}`}>
                    <ExclamationTriangleIcon className={`w-8 h-8 ${getAIRiskColor(aiInsights.injuryAssessment.overallRisk)}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Overall Risk</h3>
                  <Metric className={`${getAIRiskColor(aiInsights.injuryAssessment.overallRisk)}`}>
                    {aiInsights.injuryAssessment.overallRisk.charAt(0).toUpperCase() + aiInsights.injuryAssessment.overallRisk.slice(1)}
                  </Metric>
                  <p className="text-sm text-gray-400 mt-2">Risk Score: {aiInsights.injuryAssessment.riskScore}%</p>
                  <div className="mt-4">
                    <ProgressBar
                      value={aiInsights.injuryAssessment.riskScore}
                      color={aiInsights.injuryAssessment.overallRisk === 'low' ? 'green' : aiInsights.injuryAssessment.overallRisk === 'moderate' ? 'yellow' : 'red'}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Risk Factors Analysis</h3>
                <div className="space-y-3">
                  {aiInsights.injuryAssessment.riskFactors.map((factor, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getAIRiskBgColor(factor.risk)}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-white">{factor.category}</h4>
                        <span className={`text-sm font-bold ${getAIRiskColor(factor.risk)}`}>
                          {factor.risk.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Preventive Measures */}
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">AI-Recommended Preventive Measures</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {aiInsights.injuryAssessment.preventiveMeasures.map((measure, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                      measure.priority === 'high' ? 'bg-red-400' : 
                      measure.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-white mb-1">{measure.measure}</h4>
                      <p className="text-sm text-gray-400">{measure.description}</p>
                      <span className={`inline-block px-2 py-1 mt-2 rounded text-xs ${
                        measure.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        measure.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {measure.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {selectedInsight === 'workouts' && aiInsights.workoutRecommendations && (
          <motion.div
            key="workouts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Weekly Plan Overview */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="bg-gray-900 border-gray-800">
                <div className="text-center">
                  <FireIcon className="w-8 h-8 text-coral mx-auto mb-2" />
                  <Metric className="text-white">{aiInsights.workoutRecommendations.weeklyPlan.workouts}</Metric>
                  <p className="text-sm text-gray-400">Workouts/Week</p>
                </div>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <div className="text-center">
                  <BoltIcon className="w-8 h-8 text-coral mx-auto mb-2" />
                  <Metric className="text-white">{aiInsights.workoutRecommendations.weeklyPlan.totalDistance}km</Metric>
                  <p className="text-sm text-gray-400">Total Distance</p>
                </div>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <div className="text-center">
                  <HeartIcon className="w-8 h-8 text-coral mx-auto mb-2" />
                  <Metric className="text-white">{aiInsights.workoutRecommendations.weeklyPlan.intenseSessions}</Metric>
                  <p className="text-sm text-gray-400">Intense Sessions</p>
                </div>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <div className="text-center">
                  <CalendarDaysIcon className="w-8 h-8 text-coral mx-auto mb-2" />
                  <Metric className="text-white">{aiInsights.workoutRecommendations.weeklyPlan.restDays}</Metric>
                  <p className="text-sm text-gray-400">Rest Days</p>
                </div>
              </Card>
            </div>

            {/* AI Workout Recommendations */}
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Personalized AI Recommendations</h3>
              <div className="space-y-4">
                {aiInsights.workoutRecommendations.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white text-lg">{rec.workoutType}</h4>
                        <p className="text-sm text-gray-400">{rec.timing}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                          rec.intensity === 'easy' ? 'bg-green-500/20 text-green-400' :
                          rec.intensity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {rec.intensity.toUpperCase()}
                        </span>
                        <p className="text-sm text-gray-400 mt-1">{formatWorkoutDuration(rec.duration)}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3">{rec.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.benefits.map((benefit, benefitIndex) => (
                        <span key={benefitIndex} className="px-2 py-1 bg-coral/20 text-coral text-xs rounded">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Adaptation Logic */}
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">AI Adaptation Reasoning</h3>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Why these changes?</h4>
                <p className="text-gray-300 mb-3">{aiInsights.workoutRecommendations.adaptation.reason}</p>
                <div className="space-y-2">
                  {aiInsights.workoutRecommendations.adaptation.changes.map((change, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-300">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {selectedInsight === 'performance' && aiInsights.performanceAnalysis && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Performance Trends */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-gray-900 border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
                <div className={`p-4 rounded-lg mb-4 ${
                  aiInsights.performanceAnalysis.trends.overall === 'improving' ? 'bg-green-500/20 border border-green-500/30' :
                  aiInsights.performanceAnalysis.trends.overall === 'declining' ? 'bg-red-500/20 border border-red-500/30' :
                  'bg-gray-800'
                }`}>
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Overall Trend</h4>
                    <Metric className={`${
                      aiInsights.performanceAnalysis.trends.overall === 'improving' ? 'text-green-400' :
                      aiInsights.performanceAnalysis.trends.overall === 'declining' ? 'text-red-400' :
                      'text-gray-300'
                    }`}>
                      {aiInsights.performanceAnalysis.trends.overall.toUpperCase()}
                    </Metric>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pace Improvement:</span>
                    <span className="text-white font-medium">{aiInsights.performanceAnalysis.trends.pace.trend}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Endurance Trend:</span>
                    <span className="text-white font-medium">{aiInsights.performanceAnalysis.trends.endurance.trend}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Consistency Score:</span>
                    <span className="text-white font-medium">{aiInsights.performanceAnalysis.trends.consistency.score}%</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">AI Predictions</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Next Race Prediction</h4>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400">Distance:</span>
                      <span className="text-white">{aiInsights.performanceAnalysis.predictions.nextRace.distance}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400">Predicted Time:</span>
                      <span className="text-white font-mono">{aiInsights.performanceAnalysis.predictions.nextRace.predictedTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Confidence:</span>
                      <span className={`font-medium ${
                        aiInsights.performanceAnalysis.predictions.nextRace.confidence > 80 ? 'text-green-400' :
                        aiInsights.performanceAnalysis.predictions.nextRace.confidence > 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {aiInsights.performanceAnalysis.predictions.nextRace.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Fitness Progression</h4>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400">Timeframe:</span>
                      <span className="text-white">{aiInsights.performanceAnalysis.predictions.fitnessProgression.timeframe}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expected Improvement:</span>
                      <span className="text-green-400 font-medium">+{aiInsights.performanceAnalysis.predictions.fitnessProgression.expectedImprovement}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* AI Insights */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-gray-900 border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-green-400" />
                  Strengths
                </h3>
                <div className="space-y-3">
                  {aiInsights.performanceAnalysis.insights.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{strength}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-yellow-400" />
                  Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {aiInsights.performanceAnalysis.insights.areasForImprovement.map((area, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{area}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">AI Performance Recommendations</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {aiInsights.performanceAnalysis.insights.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                    <SparklesIcon className="w-5 h-5 text-coral mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{rec}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Status Footer */}
      <Card className="bg-gray-900 border-gray-800 border-t-coral border-t-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="w-6 h-6 text-coral" />
            <div>
              <h4 className="font-medium text-white">AI Analytics System</h4>
              <p className="text-sm text-gray-400">Powered by advanced machine learning algorithms</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-400">AI Status: Active</span>
            </div>
            <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}