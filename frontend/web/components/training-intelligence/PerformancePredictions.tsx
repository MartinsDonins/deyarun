import { useState, useEffect } from 'react'
import { Card, Metric, LineChart, DonutChart, BarChart, BadgeDelta } from '@tremor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { logger } from '../../lib/productionLogger';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  TrophyIcon,
  SparklesIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays } from 'date-fns'
import { trainingIntelligenceAPI, RacePrediction, FitnessProgression, InjuryRiskAssessment, formatTime, formatPace, formatDistance, getRiskColor, getRiskBgColor, getConfidenceColor } from '../../lib/trainingIntelligenceAPI'
import toast from 'react-hot-toast'

// Validation schema for race prediction form
const racePredictionSchema = z.object({
  raceDistance: z.string().min(1, 'Race distance is required'),
  targetDate: z.string().optional()
})

type RacePredictionForm = z.infer<typeof racePredictionSchema>

interface PerformancePredictionsProps {
  userId?: string
}

export default function PerformancePredictions({ userId }: PerformancePredictionsProps) {
  const [activeTab, setActiveTab] = useState<'race' | 'fitness' | 'injury'>('race')
  const [racePrediction, setRacePrediction] = useState<RacePrediction | null>(null)
  const [fitnessProgression, setFitnessProgression] = useState<FitnessProgression | null>(null)
  const [injuryRisk, setInjuryRisk] = useState<InjuryRiskAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [predictionWeeks, setPredictionWeeks] = useState(12)

  const { register, handleSubmit, formState: { errors } } = useForm<RacePredictionForm>({
    resolver: zodResolver(racePredictionSchema),
    defaultValues: {
      raceDistance: '10k',
      targetDate: format(addDays(new Date(), 84), 'yyyy-MM-dd') // 12 weeks from now
    }
  })

  const loadFitnessProgression = async (weeks: number = 12) => {
    try {
      setIsLoading(true)
      const response = await trainingIntelligenceAPI.getFitnessProgression(weeks)
      if (response.success) {
        setFitnessProgression(response.progression)
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading fitness progression:', { error: error })
      toast.error('Failed to load fitness progression')
    } finally {
      setIsLoading(false)
    }
  }

  const loadInjuryRisk = async () => {
    try {
      setIsLoading(true)
      const response = await trainingIntelligenceAPI.getInjuryRisk(30)
      if (response.success) {
        setInjuryRisk(response.riskAssessment)
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading injury risk:', { error: error })
      toast.error('Failed to load injury risk assessment')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitRacePrediction = async (data: RacePredictionForm) => {
    try {
      setIsLoading(true)
      const response = await trainingIntelligenceAPI.predictRacePerformance(
        data.raceDistance,
        data.targetDate
      )
      if (response.success) {
        setRacePrediction(response.prediction)
        toast.success('Race prediction generated!')
      }
    } catch (error) {
      logger.error('ERROR', 'Error generating race prediction:', { error: error })
      toast.error('Failed to generate race prediction')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'fitness') {
      loadFitnessProgression(predictionWeeks)
    } else if (activeTab === 'injury') {
      loadInjuryRisk()
    }
  }, [activeTab, predictionWeeks])

  const raceDistances = [
    { value: '5k', label: '5K' },
    { value: '10k', label: '10K' },
    { value: 'half_marathon', label: 'Half Marathon' },
    { value: 'marathon', label: 'Marathon' },
    { value: 'ultra_50k', label: '50K Ultra' }
  ]

  const tabs = [
    { id: 'race', name: 'Race Predictions', icon: TrophyIcon },
    { id: 'fitness', name: 'Fitness Progression', icon: ChartBarIcon },
    { id: 'injury', name: 'Injury Risk', icon: ExclamationTriangleIcon }
  ]

  // Prepare fitness progression chart data
  const fitnessChartData = fitnessProgression?.weeklyProgression.map(week => ({
    week: `Week ${week.week}`,
    fitness: Math.round(week.fitnessLevel * 100),
    change: week.change * 1000
  })) || []

  // Prepare injury risk chart data
  const injuryRiskChartData = injuryRisk ? [
    { factor: 'Training Load', score: injuryRisk.riskFactors.trainingLoad.score, status: injuryRisk.riskFactors.trainingLoad.status },
    { factor: 'Recovery', score: injuryRisk.riskFactors.recovery.score, status: injuryRisk.riskFactors.recovery.status },
    { factor: 'Biomechanical', score: injuryRisk.riskFactors.biomechanical.score, status: injuryRisk.riskFactors.biomechanical.status },
    { factor: 'Historical', score: injuryRisk.riskFactors.historical.score, status: injuryRisk.riskFactors.historical.status }
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BeakerIcon className="w-8 h-8 text-coral" />
        <h2 className="text-2xl font-bold text-white">Performance Predictions</h2>
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
        {/* Race Predictions Tab */}
        {activeTab === 'race' && (
          <motion.div
            key="race"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Race Prediction Form */}
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Generate Race Prediction</h3>
              <form onSubmit={handleSubmit(onSubmitRacePrediction)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Race Distance
                    </label>
                    <select
                      {...register('raceDistance')}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                    >
                      {raceDistances.map(distance => (
                        <option key={distance.value} value={distance.value}>
                          {distance.label}
                        </option>
                      ))}
                    </select>
                    {errors.raceDistance && (
                      <p className="text-red-400 text-sm mt-1">{errors.raceDistance.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Date (Optional)
                    </label>
                    <input
                      type="date"
                      {...register('targetDate')}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isLoading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
                  <SparklesIcon className="w-4 h-4" />
                  Generate Prediction
                </button>
              </form>
            </Card>

            {/* Race Prediction Results */}
            {racePrediction && (
              <div className="space-y-6">
                {/* Prediction Overview */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <ClockIcon className="w-5 h-5 text-coral" />
                      <p className="text-sm text-gray-400">Current Prediction</p>
                    </div>
                    <Metric className="text-white">{formatTime(racePrediction.predictions.current.time)}</Metric>
                    <p className="text-xs text-gray-400 mt-1">{formatPace(racePrediction.predictions.current.pace)}</p>
                  </Card>

                  {racePrediction.predictions.withTraining && (
                    <Card className="bg-gray-900 border-gray-800">
                      <div className="flex items-center gap-3 mb-2">
                        <TrophyIcon className="w-5 h-5 text-green-400" />
                        <p className="text-sm text-gray-400">With Training</p>
                      </div>
                      <Metric className="text-green-400">{formatTime(racePrediction.predictions.withTraining.time)}</Metric>
                      <p className="text-xs text-green-400 mt-1">
                        -{racePrediction.predictions.withTraining.improvement}s improvement
                      </p>
                    </Card>
                  )}

                  <Card className="bg-gray-900 border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <SparklesIcon className="w-5 h-5 text-blue-400" />
                      <p className="text-sm text-gray-400">Optimistic</p>
                    </div>
                    <Metric className="text-blue-400">{formatTime(racePrediction.predictions.optimistic.time)}</Metric>
                    <p className="text-xs text-gray-400 mt-1">{formatPace(racePrediction.predictions.optimistic.pace)}</p>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                      <p className="text-sm text-gray-400">Conservative</p>
                    </div>
                    <Metric className="text-yellow-400">{formatTime(racePrediction.predictions.conservative.time)}</Metric>
                    <p className="text-xs text-gray-400 mt-1">{formatPace(racePrediction.predictions.conservative.pace)}</p>
                  </Card>
                </div>

                {/* Confidence & Recommendations */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-gray-900 border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Prediction Confidence</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Overall Confidence</span>
                        <span className={`font-semibold ${getConfidenceColor(racePrediction.confidence.level)}`}>
                          {racePrediction.confidence.percentage}% ({racePrediction.confidence.level})
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Data Quantity</span>
                          <span className="text-gray-300">{racePrediction.confidence.factors.dataQuantity} workouts</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Consistency</span>
                          <span className="text-gray-300">{Math.round(racePrediction.confidence.factors.consistency * 100)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Race Experience</span>
                          <span className="text-gray-300">{Math.round(racePrediction.confidence.factors.raceExperience * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Training Recommendations</h3>
                    <div className="space-y-3">
                      {racePrediction.recommendations.map((rec, index) => (
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
              </div>
            )}
          </motion.div>
        )}

        {/* Fitness Progression Tab */}
        {activeTab === 'fitness' && (
          <motion.div
            key="fitness"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Weeks Selector */}
            <Card className="bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Fitness Progression Forecast</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Weeks:</label>
                  <select
                    value={predictionWeeks}
                    onChange={(e) => setPredictionWeeks(Number(e.target.value))}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-coral"
                  >
                    <option value={8}>8 weeks</option>
                    <option value={12}>12 weeks</option>
                    <option value={16}>16 weeks</option>
                    <option value={24}>24 weeks</option>
                  </select>
                </div>
              </div>
            </Card>

            {fitnessProgression && (
              <div className="space-y-6">
                {/* Fitness Overview */}
                <div className="grid gap-6 sm:grid-cols-3">
                  <Card className="bg-gray-900 border-gray-800">
                    <p className="text-sm text-gray-400">Current Fitness</p>
                    <Metric className="text-white">{Math.round(fitnessProgression.currentFitness * 100)}%</Metric>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800">
                    <p className="text-sm text-gray-400">Projected Fitness</p>
                    <Metric className="text-coral">{Math.round(fitnessProgression.projectedFitness * 100)}%</Metric>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800">
                    <p className="text-sm text-gray-400">Total Improvement</p>
                    <Metric className="text-green-400">
                      +{Math.round(fitnessProgression.totalImprovement * 100)}%
                    </Metric>
                  </Card>
                </div>

                {/* Fitness Chart */}
                <Card className="bg-gray-900 border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Projected Fitness Level</h3>
                  <LineChart
                    data={fitnessChartData}
                    index="week"
                    categories={["fitness"]}
                    colors={["coral"]}
                    className="h-64"
                    showXAxis={true}
                    showYAxis={true}
                    showGridLines={true}
                  />
                </Card>

                {/* Insights & Risks */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-gray-900 border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
                    <div className="space-y-3">
                      {fitnessProgression.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Potential Risks</h3>
                    <div className="space-y-3">
                      {fitnessProgression.risks.map((risk, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getRiskBgColor(risk.level)}`}></div>
                            <span className={`text-sm font-medium ${getRiskColor(risk.level)}`}>
                              {risk.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Injury Risk Tab */}
        {activeTab === 'injury' && (
          <motion.div
            key="injury"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {injuryRisk && (
              <div className="space-y-6">
                {/* Overall Risk */}
                <Card className="bg-gray-900 border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full ${getRiskBgColor(injuryRisk.overallRisk.level)} flex items-center justify-center`}>
                      <ExclamationTriangleIcon className={`w-8 h-8 ${getRiskColor(injuryRisk.overallRisk.level)}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Overall Injury Risk: {injuryRisk.overallRisk.level.charAt(0).toUpperCase() + injuryRisk.overallRisk.level.slice(1)}
                      </h3>
                      <p className="text-gray-400">{injuryRisk.overallRisk.description}</p>
                      <p className={`text-lg font-medium mt-1 ${getRiskColor(injuryRisk.overallRisk.level)}`}>
                        {injuryRisk.overallRisk.score}% Risk Score
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Risk Factors Chart */}
                <Card className="bg-gray-900 border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Risk Factor Breakdown</h3>
                  <BarChart
                    data={injuryRiskChartData}
                    index="factor"
                    categories={["score"]}
                    colors={["coral"]}
                    className="h-48"
                    showXAxis={true}
                    showYAxis={true}
                  />
                </Card>

                {/* Risk Factor Details */}
                <div className="grid gap-6 sm:grid-cols-2">
                  {Object.entries(injuryRisk.riskFactors).map(([key, factor]) => (
                    <Card key={key} className="bg-gray-900 border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBgColor(factor.status)} ${getRiskColor(factor.status)}`}>
                          {factor.status}
                        </span>
                      </div>
                      <Metric className={getRiskColor(factor.status)}>{factor.score}%</Metric>
                      <p className="text-xs text-gray-400 mt-2">{factor.details}</p>
                    </Card>
                  ))}
                </div>

                {/* Recommendations */}
                <Card className="bg-gray-900 border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Injury Prevention Recommendations</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {injuryRisk.recommendations.map((rec, index) => (
                      <div key={index} className="p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${
                            rec.priority === 'high' ? 'bg-red-400' : 
                            rec.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                          }`}></span>
                          <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{rec.description}</p>
                        <span className="inline-block px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {rec.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {!injuryRisk && !isLoading && (
              <Card className="bg-gray-900 border-gray-800 text-center py-12">
                <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Risk Assessment Available</h3>
                <p className="text-gray-400 mb-4">Complete more workouts to generate injury risk assessment</p>
                <button
                  onClick={loadInjuryRisk}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <Card className="bg-gray-900 border-gray-800 text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-400">Generating predictions...</p>
        </Card>
      )}
    </div>
  )
}