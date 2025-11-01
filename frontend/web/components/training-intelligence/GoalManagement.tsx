import { useState, useEffect } from 'react'
import { Card, Metric, ProgressBar, BadgeDelta } from '@tremor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { logger } from '../../lib/productionLogger';
import { 
  TrophyIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays, differenceInDays } from 'date-fns'
import { trainingIntelligenceAPI, Goal, GoalAssessment, formatTime, formatPace, formatDistance } from '../../lib/trainingIntelligenceAPI'
import toast from 'react-hot-toast'

// Validation schema for goal creation
const goalSchema = z.object({
  type: z.enum(['race_time', 'distance_total', 'pace_average', 'frequency_weekly', 'consistency_streak']),
  target: z.object({
    value: z.number().min(1, 'Target value must be positive'),
    distance: z.string().optional(),
    time: z.number().optional()
  }),
  deadline: z.string().min(1, 'Deadline is required'),
  priority: z.enum(['high', 'medium', 'low'])
})

type GoalForm = z.infer<typeof goalSchema>

interface GoalManagementProps {
  userId?: string
}

export default function GoalManagement({ userId }: GoalManagementProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [assessments, setAssessments] = useState<GoalAssessment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [adaptingGoalId, setAdaptingGoalId] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<GoalAssessment | null>(null)

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      type: 'race_time',
      priority: 'medium',
      deadline: format(addDays(new Date(), 90), 'yyyy-MM-dd')
    }
  })

  const goalType = watch('type')

  const loadGoals = async () => {
    try {
      setIsLoading(true)
      
      // Fetch real goals from backend API
      const response = await fetch('/api/goals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch goals: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Convert backend format to frontend format
        const convertedGoals: Goal[] = data.goals.map((backendGoal: any) => ({
          id: backendGoal._id,
          type: backendGoal.type,
          target: {
            value: backendGoal.target.value,
            distance: backendGoal.metadata?.raceDistance || undefined,
            time: backendGoal.type === 'race_time' ? backendGoal.target.value : undefined
          },
          deadline: backendGoal.timeline.endDate.split('T')[0], // Convert to YYYY-MM-DD format
          priority: backendGoal.priority,
          createdAt: backendGoal.createdAt
        }))
        
        setGoals(convertedGoals)
        
        // Assess goals if any exist
        if (convertedGoals.length > 0) {
          const assessResponse = await trainingIntelligenceAPI.assessGoals(convertedGoals)
          if (assessResponse.success) {
            setAssessments(assessResponse.assessments)
          }
        } else {
          setAssessments([])
        }
      } else {
        throw new Error(data.message || 'Failed to fetch goals')
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading goals:', { error: error })
      toast.error('Failed to load goals')
      // Fallback to empty state on error
      setGoals([])
      setAssessments([])
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitGoal = async (data: GoalForm) => {
    try {
      // Prepare goal data for backend API
      const goalData = {
        title: `${goalTypes.find(t => t.value === data.type)?.label} - ${data.target.value}`,
        description: `Goal to achieve ${data.target.value} ${data.type === 'race_time' ? 'seconds' : 'units'} by ${data.deadline}`,
        type: data.type,
        category: 'milestone', // Default category for user-created goals
        target: {
          value: data.target.value,
          unit: data.type === 'race_time' ? 'seconds' : 
                data.type === 'distance_total' ? 'meters' : 
                data.type === 'pace_average' ? 'seconds_per_km' : 'count'
        },
        timeline: {
          endDate: new Date(data.deadline).toISOString()
        },
        priority: data.priority,
        metadata: {
          raceDistance: data.target.distance,
          createdFrom: 'web_goal_management'
        }
      }

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create goal: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setShowCreateForm(false)
        reset()
        toast.success('Goal created successfully!')
        
        // Reload goals to get the new one
        await loadGoals()
      } else {
        throw new Error(result.message || 'Failed to create goal')
      }
    } catch (error) {
      logger.error('ERROR', 'Error creating goal:', { error: error })
      toast.error('Failed to create goal')
    }
  }

  const adaptPlan = async (goalId: string, adaptationType: string) => {
    try {
      setAdaptingGoalId(goalId)
      const response = await trainingIntelligenceAPI.adaptPlanForGoal(goalId, adaptationType)
      
      if (response.success) {
        toast.success('Training plan adapted successfully!')
        await loadGoals() // Reload to get updated assessments
      }
    } catch (error) {
      logger.error('ERROR', 'Error adapting plan:', { error: error })
      toast.error('Failed to adapt training plan')
    } finally {
      setAdaptingGoalId(null)
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete goal: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Remove from local state immediately for better UX
        setGoals(prev => prev.filter(g => g.id !== goalId))
        setAssessments(prev => prev.filter(a => a.goal.id !== goalId))
        toast.success('Goal deleted successfully!')
      } else {
        throw new Error(result.message || 'Failed to delete goal')
      }
    } catch (error) {
      logger.error('ERROR', 'Error deleting goal:', { error: error })
      toast.error('Failed to delete goal')
    }
  }

  useEffect(() => {
    loadGoals()
  }, [userId])

  const goalTypes = [
    { value: 'race_time', label: 'Race Time Goal', icon: TrophyIcon },
    { value: 'distance_total', label: 'Distance Goal', icon: FireIcon },
    { value: 'pace_average', label: 'Pace Goal', icon: ClockIcon },
    { value: 'frequency_weekly', label: 'Weekly Frequency', icon: CalendarDaysIcon },
    { value: 'consistency_streak', label: 'Consistency Streak', icon: CheckCircleIcon }
  ]

  const raceDistances = [
    { value: '5k', label: '5K' },
    { value: '10k', label: '10K' },
    { value: 'half_marathon', label: 'Half Marathon' },
    { value: 'marathon', label: 'Marathon' }
  ]

  const getGoalStatusColor = (assessment: GoalAssessment) => {
    if (assessment.progressRatio >= 1) return 'text-green-400'
    if (assessment.needsAdaptation && assessment.urgency === 'high') return 'text-red-400'
    if (assessment.needsAdaptation) return 'text-yellow-400'
    return 'text-blue-400'
  }

  const getGoalStatusBg = (assessment: GoalAssessment) => {
    if (assessment.progressRatio >= 1) return 'bg-green-500/20'
    if (assessment.needsAdaptation && assessment.urgency === 'high') return 'bg-red-500/20'
    if (assessment.needsAdaptation) return 'bg-yellow-500/20'
    return 'bg-blue-500/20'
  }

  const formatGoalValue = (goal: Goal, currentValue?: number) => {
    switch (goal.type) {
      case 'race_time':
        return formatTime(currentValue || goal.target.value)
      case 'distance_total':
        return formatDistance(currentValue || goal.target.value)
      case 'pace_average':
        return formatPace(currentValue || goal.target.value)
      case 'frequency_weekly':
      case 'consistency_streak':
        return `${currentValue || goal.target.value}`
      default:
        return `${currentValue || goal.target.value}`
    }
  }

  const getGoalUnit = (type: string) => {
    switch (type) {
      case 'race_time': return ''
      case 'distance_total': return ''
      case 'pace_average': return ''
      case 'frequency_weekly': return 'workouts/week'
      case 'consistency_streak': return 'days'
      default: return ''
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Goal Management</h2>
          <div className="animate-spin w-6 h-6 border-2 border-coral border-t-transparent rounded-full"></div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrophyIcon className="w-8 h-8 text-coral" />
          <h2 className="text-2xl font-bold text-white">Goal Management</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {/* Create Goal Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Create New Goal</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitGoal)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Goal Type
                    </label>
                    <select
                      {...register('type')}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                    >
                      {goalTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Value
                    </label>
                    <input
                      type="number"
                      {...register('target.value', { valueAsNumber: true })}
                      placeholder={
                        goalType === 'race_time' ? 'Seconds' :
                        goalType === 'distance_total' ? 'Meters' :
                        goalType === 'pace_average' ? 'Seconds per km' :
                        'Number'
                      }
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                    />
                    {errors.target?.value && (
                      <p className="text-red-400 text-sm mt-1">{errors.target.value.message}</p>
                    )}
                  </div>

                  {goalType === 'race_time' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Race Distance
                      </label>
                      <select
                        {...register('target.distance')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      >
                        {raceDistances.map(distance => (
                          <option key={distance.value} value={distance.value}>
                            {distance.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      {...register('deadline')}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                    />
                    {errors.deadline && (
                      <p className="text-red-400 text-sm mt-1">{errors.deadline.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Create Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {assessments.map((assessment, index) => {
          const IconComponent = goalTypes.find(t => t.value === assessment.goal.type)?.icon || TrophyIcon
          const daysRemaining = differenceInDays(new Date(assessment.goal.deadline), new Date())
          
          return (
            <motion.div
              key={assessment.goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`bg-gray-900 border-gray-800 cursor-pointer hover:border-coral transition-all ${
                  selectedGoal?.goal.id === assessment.goal.id ? 'border-coral' : ''
                }`}
                onClick={() => setSelectedGoal(selectedGoal?.goal.id === assessment.goal.id ? null : assessment)}
              >
                <div className="space-y-4">
                  {/* Goal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getGoalStatusBg(assessment)} flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${getGoalStatusColor(assessment)}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {goalTypes.find(t => t.value === assessment.goal.type)?.label}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {assessment.goal.priority} priority
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteGoal(assessment.goal.id)
                      }}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Progress</span>
                      <span className={`text-sm font-medium ${getGoalStatusColor(assessment)}`}>
                        {Math.round(assessment.currentProgress.progressPercentage)}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={assessment.currentProgress.progressPercentage} 
                      color={assessment.progressRatio >= 1 ? 'green' : assessment.needsAdaptation ? 'red' : 'blue'}
                      className="h-2"
                    />
                  </div>

                  {/* Current vs Target */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Current</p>
                      <p className="text-coral font-medium">
                        {formatGoalValue(assessment.goal, assessment.currentProgress.current)}
                        {getGoalUnit(assessment.goal.type) && (
                          <span className="text-xs text-gray-400 ml-1">
                            {getGoalUnit(assessment.goal.type)}
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Target</p>
                      <p className="text-white font-medium">
                        {formatGoalValue(assessment.goal)}
                        {getGoalUnit(assessment.goal.type) && (
                          <span className="text-xs text-gray-400 ml-1">
                            {getGoalUnit(assessment.goal.type)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Deadline passed'}
                      </span>
                    </div>
                    {assessment.needsAdaptation && (
                      <div className="flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-400">Needs attention</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {assessment.needsAdaptation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        adaptPlan(assessment.goal.id, assessment.adaptationType)
                      }}
                      disabled={adaptingGoalId === assessment.goal.id}
                      className="w-full btn btn-coral text-sm flex items-center justify-center gap-2"
                    >
                      {adaptingGoalId === assessment.goal.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <SparklesIcon className="w-4 h-4" />
                      )}
                      Adapt Training Plan
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Goal Details Modal */}
      <AnimatePresence>
        {selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGoal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Goal Details</h3>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-400">Progress Ratio</p>
                    <p className={`text-lg font-semibold ${getGoalStatusColor(selectedGoal)}`}>
                      {selectedGoal.progressRatio.toFixed(2)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Recent Trend</p>
                    <p className="text-white">{selectedGoal.currentProgress.recentTrend}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Assessment</p>
                  <p className="text-white">{selectedGoal.reason}</p>
                </div>

                {selectedGoal.needsAdaptation && (
                  <div className="p-4 bg-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                      <h4 className="font-semibold text-yellow-400">Adaptation Needed</h4>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      Recommended adaptation: <span className="text-yellow-400 font-medium">
                        {selectedGoal.adaptationType}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Urgency: {selectedGoal.urgency}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => adaptPlan(selectedGoal.goal.id, selectedGoal.adaptationType)}
                    disabled={adaptingGoalId === selectedGoal.goal.id}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    {adaptingGoalId === selectedGoal.goal.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                    Adapt Plan
                  </button>
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {assessments.length === 0 && !isLoading && (
        <Card className="bg-gray-900 border-gray-800 text-center py-12">
          <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Goals Set</h3>
          <p className="text-gray-400 mb-4">Create your first training goal to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Goal
          </button>
        </Card>
      )}
    </div>
  )
}