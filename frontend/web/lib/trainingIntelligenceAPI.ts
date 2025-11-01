import { apiService } from './api'
import { logger } from '../lib/productionLogger'

// Re-export existing API for compatibility
export { apiService as apiClient }

// Types for Training Intelligence
export interface DailyProgress {
  date: string
  workoutsCompleted: number
  totalDistance: number
  totalDuration: number
  averagePace: number
  caloriesBurned: number
  activePlanId?: string
}

export interface WeeklyReport {
  period: {
    start: string
    end: string
  }
  metrics: {
    workoutsCompleted: number
    totalDistance: number
    totalDuration: number
    totalCalories: number
    averagePace: number
    adherenceRate: number
    averageDistance: number
    averageDuration: number
  }
  previousMetrics: {
    workoutsCompleted: number
    totalDistance: number
    totalDuration: number
    averagePace: number
  }
  improvements: {
    distance: number
    duration: number
    pace: number
    workouts: number
    calories: number
  }
  highlights: string[]
  recommendations: Array<{
    type: string
    title: string
    description: string
  }>
}

export interface StreakData {
  current: number
  longest: number
  lastUpdate: string
  recentActivity: number
  milestones: {
    next: number
    achieved: number[]
  }
}

export interface Goal {
  id: string
  type: 'race_time' | 'distance_total' | 'pace_average' | 'frequency_weekly' | 'consistency_streak'
  target: {
    value: number
    distance?: string
    time?: number
  }
  deadline: string
  priority: 'high' | 'medium' | 'low'
  startDate?: string
  createdAt: string
}

export interface GoalAssessment {
  goal: Goal
  currentProgress: {
    current: number
    target: number
    unit: string
    progressPercentage: number
    recentTrend: string
    workoutCount: number
  }
  expectedProgress: number
  progressGap: number
  progressRatio: number
  daysRemaining: number
  needsAdaptation: boolean
  adaptationType: 'intensify' | 'focus' | 'advance' | 'vary' | 'maintain'
  reason: string
  urgency: 'low' | 'medium' | 'high'
}

export interface RacePrediction {
  raceDistance: string
  targetDate?: string
  predictions: {
    current: {
      time: number
      pace: number
      description: string
    }
    withTraining?: {
      time: number
      pace: number
      improvement: number
      description: string
    }
    optimistic: {
      time: number
      pace: number
      description: string
    }
    conservative: {
      time: number
      pace: number
      description: string
    }
  }
  confidence: {
    level: 'high' | 'medium' | 'low'
    percentage: number
    factors: {
      dataQuantity: number
      consistency: number
      raceExperience: number
    }
  }
  recommendations: Array<{
    type: string
    title: string
    description: string
  }>
}

export interface FitnessProgression {
  currentFitness: number
  projectedFitness: number
  totalImprovement: number
  weeklyProgression: Array<{
    week: number
    fitnessLevel: number
    change: number
    trainingLoad: number
    factors: Record<string, any>
  }>
  insights: string[]
  risks: Array<{
    type: string
    level: string
    description: string
  }>
}

export interface InjuryRiskAssessment {
  overallRisk: {
    score: number
    level: 'low' | 'moderate' | 'high'
    description: string
  }
  riskFactors: {
    trainingLoad: {
      score: number
      status: string
      details: string
    }
    recovery: {
      score: number
      status: string
      details: string
    }
    biomechanical: {
      score: number
      status: string
      details: string
    }
    historical: {
      score: number
      status: string
      details: string
    }
  }
  specificRisks: Array<{
    type: string
    level: string
    description: string
    recommendations: string[]
  }>
  recommendations: Array<{
    type: string
    title: string
    description: string
    priority: string
  }>
  monitoring: Array<{
    metric: string
    threshold: number
    description: string
  }>
}

export interface TrainingIntelligenceDashboard {
  overview: {
    currentFitness: number
    fitnessConfidence: number
    weeklyWorkouts: number
    injuryRisk: string
  }
  progress: {
    thisWeek: WeeklyReport['metrics']
    improvements: WeeklyReport['improvements']
    streakDays: number
  }
  predictions: {
    fitnessLevel: number
    injuryRisk: number
    riskFactors: InjuryRiskAssessment['riskFactors']
  }
  activePlan?: {
    id: string
    name: string
    progress: number
    currentWeek: number
    totalWeeks: number
    adaptationEnabled: boolean
  }
  recommendations: Array<{
    type: string
    title: string
    description: string
  }>
  aiInsights?: {
    injuryAssessment?: AIInjuryAssessment
    workoutRecommendations?: AIWorkoutRecommendations
    performanceAnalysis?: AIPerformanceAnalysis
  }
}

// NEW AI ENHANCED INTERFACES
export interface AIInjuryAssessment {
  overallRisk: 'low' | 'moderate' | 'high'
  riskScore: number
  riskFactors: Array<{
    category: string
    risk: 'low' | 'moderate' | 'high'
    description: string
  }>
  preventiveMeasures: Array<{
    priority: 'high' | 'medium' | 'low'
    measure: string
    description: string
  }>
  timeline: string
}

export interface AIWorkoutRecommendations {
  recommendations: Array<{
    workoutType: string
    duration: number
    intensity: 'easy' | 'moderate' | 'hard'
    description: string
    benefits: string[]
    timing: string
  }>
  weeklyPlan: {
    totalDistance: number
    workouts: number
    intenseSessions: number
    restDays: number
  }
  adaptation: {
    reason: string
    changes: string[]
  }
}

export interface AIPerformanceAnalysis {
  trends: {
    overall: 'improving' | 'stable' | 'declining'
    pace: { trend: string; change: number }
    endurance: { trend: string; change: number }
    consistency: { trend: string; score: number }
  }
  predictions: {
    nextRace: {
      distance: string
      predictedTime: string
      confidence: number
    }
    fitnessProgression: {
      timeframe: string
      expectedImprovement: number
    }
  }
  insights: {
    strengths: string[]
    areasForImprovement: string[]
    recommendations: string[]
  }
}

export interface SmartPlanConfig {
  targetRace: {
    distance: string
    date: string
    name?: string
    timeGoal?: number
  }
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  currentWeeklyMileage?: number
  longestRecentRun?: number
  preferredTrainingDays?: string[]
  timeGoal?: number
  age?: number
  restingHeartRate?: number
  maxHeartRate?: number
  injuryHistory?: Array<{
    type: string
    date: string
    severity: string
    chronic?: boolean
  }>
  availableTime?: 'limited' | 'moderate' | 'extensive'
  experience?: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferredIntensity?: 'low' | 'moderate' | 'high'
}

export interface SmartPlan {
  id: string
  name: string
  description: string
  duration: number
  aiFeatures: {
    adaptiveLoading: boolean
    injuryPrevention: boolean
    personalizedPacing: boolean
    weatherAdaptation: boolean
    loadManagement: boolean
    recoveryOptimization: boolean
    nutritionGuidance: boolean
    realTimeFeedback: boolean
  }
  adaptationEnabled: boolean
  intelligenceFeatures: {
    progressTracking: boolean
    goalAdaptation: boolean
    injuryPrevention: boolean
    performancePrediction: boolean
  }
}

// Training Intelligence API functions
export const trainingIntelligenceAPI = {
  // Progress tracking
  async getDailyProgress(date: string): Promise<{ success: boolean; date: Date; metrics: DailyProgress; workouts: any; details: any }> {
    const response = await apiService.get<{ success: boolean; date: Date; metrics: DailyProgress; workouts: any; details: any }>(`/training-intelligence/progress/daily/${date}`)
    return response
  },

  async getWeeklyReport(): Promise<{ success: boolean; report: WeeklyReport; generated: Date }> {
    const response = await apiService.get<{ success: boolean; report: WeeklyReport; generated: Date }>('/training-intelligence/progress/weekly')
    return response
  },

  async getStreaks(): Promise<{ success: boolean; streaks: StreakData }> {
    const response = await apiService.get<{ success: boolean; streaks: StreakData }>('/training-intelligence/progress/streaks')
    return response
  },

  // Goal management
  async assessGoals(goals: Goal[]): Promise<{ 
    success: boolean
    assessments: GoalAssessment[]
    summary: {
      totalGoals: number
      needingAdaptation: number
      onTrack: number
      behindSchedule: number
    }
    recommendations: string
  }> {
    const response = await apiService.post<any>('/training-intelligence/goals/assess', { goals })
    return response
  },

  async adaptPlanForGoal(goalId: string, adaptationType: string, urgency: string = 'medium'): Promise<{
    success: boolean
    message: string
    adaptation: {
      planId: string
      goalId: string
      type: string
      urgency: string
      appliedAt: Date
    }
  }> {
    const response = await apiService.post<any>('/training-intelligence/goals/adapt-plan', {
      goalId,
      adaptationType,
      urgency
    })
    return response
  },

  // Performance predictions
  async predictRacePerformance(raceDistance: string, targetDate?: string): Promise<{
    success: boolean
    prediction: RacePrediction
    generated: Date
  }> {
    const response = await apiService.post<any>('/training-intelligence/predict/race-performance', {
      raceDistance,
      targetDate
    })
    return response
  },

  async getFitnessProgression(weeks: number = 12): Promise<{
    success: boolean
    progression: FitnessProgression
    generated: Date
  }> {
    const response = await apiService.get<any>(`/training-intelligence/predict/fitness-progression?weeks=${weeks}`)
    return response
  },

  async getInjuryRisk(timeframe: number = 30): Promise<{
    success: boolean
    riskAssessment: InjuryRiskAssessment
    generated: Date
  }> {
    const response = await apiService.get<any>(`/training-intelligence/predict/injury-risk?timeframe=${timeframe}`)
    return response
  },

  async predictAdaptationResponse(adaptation: any): Promise<{
    success: boolean
    response: {
      adaptation: any
      predictedResponse: {
        likelihood: number
        magnitude: number
        timeframe: number
        confidence: number
      }
      risks: {
        overreaching: number
        injury: number
        plateau: number
      }
      recommendations: Array<{
        type: string
        title: string
        description: string
      }>
      monitoring: Array<{
        metric: string
        frequency: string
        threshold: number
      }>
    }
    generated: Date
  }> {
    const response = await apiService.post<any>('/training-intelligence/predict/adaptation-response', { adaptation })
    return response
  },

  // Smart plan generation
  async generateSmartPlan(config: SmartPlanConfig): Promise<{
    success: boolean
    message: string
    plan: SmartPlan
  }> {
    const response = await apiService.post<any>('/training-intelligence/generate/smart-plan', config)
    return response
  },

  // Dashboard
  async getDashboard(): Promise<{
    success: boolean
    dashboard: TrainingIntelligenceDashboard
    generated: Date
  }> {
    const response = await apiService.get<any>('/training-intelligence/insights/dashboard')
    return response
  },

  // NEW AI-POWERED FEATURES
  async getInjuryRiskAssessment(userProfile: any, workoutHistory: any[], currentSymptoms: any[] = []): Promise<{ success: boolean; data?: AIInjuryAssessment; error?: string }> {
    try {
      const response = await apiService.post<any>('/ai-training/injury-risk-assessment', {
        userProfile,
        workoutHistory,
        currentSymptoms
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      logger.error('ERROR', 'Error fetching injury risk assessment:', { error: error })
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to assess injury risk'
      }
    }
  },

  async getWorkoutRecommendations(userProfile: any, recentWorkouts: any[], upcomingGoals: any[] = []): Promise<{ success: boolean; data?: AIWorkoutRecommendations; error?: string }> {
    try {
      const response = await apiService.post<any>('/ai-training/workout-recommendations', {
        userProfile,
        recentWorkouts,
        upcomingGoals
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      logger.error('ERROR', 'Error fetching workout recommendations:', { error: error })
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get workout recommendations'
      }
    }
  },

  async getPerformanceAnalysis(workoutData: any[], timeframe: '1month' | '3months' | '6months' | '1year' = '3months'): Promise<{ success: boolean; data?: AIPerformanceAnalysis; error?: string }> {
    try {
      const response = await apiService.post<any>('/ai-training/performance-analysis', {
        workoutData,
        timeframe
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      logger.error('ERROR', 'Error fetching performance analysis:', { error: error })
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to analyze performance'
      }
    }
  },

  async getAIServiceStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiService.get<any>('/ai-training/service-status')
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      logger.error('ERROR', 'Error fetching AI service status:', { error: error })
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get AI service status'
      }
    }
  }
}

// Utility functions
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export const formatPace = (paceInSecondsPerKm: number): string => {
  const minutes = Math.floor(paceInSecondsPerKm / 60)
  const seconds = Math.round(paceInSecondsPerKm % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
}

export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(1)} km`
  }
  return `${distanceInMeters} m`
}

export const getRiskColor = (level: string): string => {
  switch (level) {
    case 'low': return 'text-green-400'
    case 'moderate': return 'text-yellow-400'
    case 'high': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export const getRiskBgColor = (level: string): string => {
  switch (level) {
    case 'low': return 'bg-green-500/20'
    case 'moderate': return 'bg-yellow-500/20'
    case 'high': return 'bg-red-500/20'
    default: return 'bg-gray-500/20'
  }
}

export const getConfidenceColor = (level: string): string => {
  switch (level) {
    case 'high': return 'text-green-400'
    case 'medium': return 'text-yellow-400'
    case 'low': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

// NEW AI UTILITY FUNCTIONS
export const formatAIConfidence = (confidence: number): string => {
  if (confidence >= 0.9) return 'Very High'
  if (confidence >= 0.8) return 'High'
  if (confidence >= 0.6) return 'Medium'
  if (confidence >= 0.4) return 'Low'
  return 'Very Low'
}

export const getAIRiskColor = (risk: 'low' | 'moderate' | 'high'): string => {
  switch (risk) {
    case 'low': return 'text-green-400'
    case 'moderate': return 'text-yellow-400'
    case 'high': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export const getAIRiskBgColor = (risk: 'low' | 'moderate' | 'high'): string => {
  switch (risk) {
    case 'low': return 'bg-green-500/20 border-green-500/30'
    case 'moderate': return 'bg-yellow-500/20 border-yellow-500/30'
    case 'high': return 'bg-red-500/20 border-red-500/30'
    default: return 'bg-gray-500/20 border-gray-500/30'
  }
}

export const getIntensityColor = (intensity: 'easy' | 'moderate' | 'hard'): string => {
  switch (intensity) {
    case 'easy': return 'text-green-400'
    case 'moderate': return 'text-yellow-400'
    case 'hard': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export const formatWorkoutDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}