// Advanced Analytics Dashboard
// Comprehensive analytics and performance metrics for DeyaRun administration

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout'
import ResponsiveCard from '../../components/ui/ResponsiveCard'
import ResponsiveGrid from '../../components/ui/ResponsiveGrid'
import { withAdminAuth } from '../../contexts/AuthContext'
import { apiService } from '../../lib/api'
import { getAuthToken } from '../../utils/auth'
import { adminLogger } from '../../lib/logger'
import { 
  ChartBarIcon,
  UsersIcon,
  CurrencyEuroIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ClockIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  SignalIcon,
  CpuChipIcon,
  CircleStackIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BeakerIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ChartBarSquareIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface PerformanceMetrics {
  system: {
    cpu: {
      usage: number;
      cores: number;
      loadAverage: number[];
      model: string;
    };
    memory: {
      total: number;
      free: number;
      used: number;
      usage: number;
    };
    network: {
      bytesReceived: number;
      bytesSent: number;
      connectionsActive: number;
    };
    disk: {
      usage: number;
      readOperations: number;
      writeOperations: number;
    };
  };
  api: {
    timeline: Array<{
      timestamp: string;
      responseTime: number;
      requestCount: number;
      errorRate: number;
      throughput: number;
    }>;
    summary: {
      averageResponseTime: number;
      totalRequests: number;
      averageErrorRate: number;
      peakThroughput: number;
    };
  };
  database: {
    activeConnections: number;
    maxConnections: number;
    queryCount: number;
    slowQueries: number;
    averageQueryTime: number;
    indexHitRatio: number;
    lockWaitTime: number;
    cacheHitRatio: number;
  };
  errors: {
    totalErrors: number;
    criticalErrors: number;
    warningErrors: number;
    errorsByType: Array<{ type: string; count: number; }>;
    errorTrend: number;
  };
  trends: {
    responseTime: {
      current: string;
      change: number;
      comparison: string;
    };
    throughput: {
      current: string;
      change: number;
      comparison: string;
    };
    errorRate: {
      current: string;
      change: number;
      comparison: string;
    };
  };
}

interface RealtimeData {
  activeUsers: number;
  currentRequests: number;
  responseTime: number;
  errorRate: number;
  systemLoad: number;
  memoryUsage: number;
}

interface AIIntelligenceData {
  predictions: {
    totalPredictions: number;
    accuracyRate: number;
    raceTimePredictions: {
      total: number;
      accurate: number;
      averageError: number;
    };
    fitnessProgressions: {
      total: number;
      improved: number;
      averageImprovement: number;
    };
    predictionsByType: Array<{
      type: string;
      count: number;
      accuracy: number;
    }>;
    trends: {
      accuracy: number;
      volume: number;
      userSatisfaction: number;
    };
  };
  adaptivePlans: {
    totalAdaptations: number;
    successRate: number;
    adaptationTypes: Array<{
      type: string;
      count: number;
      successRate: number;
    }>;
    userEngagement: {
      planCompletionRate: number;
      feedbackProvided: number;
      planSatisfaction: number;
    };
    performanceOutcomes: {
      improvedPerformance: number;
      reducedInjuries: number;
      increasedMotivation: number;
    };
    algorithmEfficiency: {
      avgProcessingTime: number;
      cpuUsage: number;
      memoryUsage: number;
    };
  };
  injuryPrevention: {
    totalAlertsGenerated: number;
    preventedInjuries: number;
    alertAccuracy: number;
    riskFactors: Array<{
      factor: string;
      alerts: number;
      prevented: number;
    }>;
    interventionSuccess: {
      planModifications: number;
      restRecommendations: number;
      exerciseCorrections: number;
      medicalReferrals: number;
    };
    userCompliance: {
      followedRecommendations: number;
      providedFeedback: number;
      completedAssessments: number;
    };
    injuryReduction: {
      comparedToPrevious: number;
      costSavings: number;
      userSatisfaction: number;
    };
  };
  modelPerformance: {
    models: Array<{
      name: string;
      version: string;
      accuracy: number;
      latency: number;
      throughput: number;
      memoryUsage: number;
      lastTrained: string;
    }>;
    systemMetrics: {
      totalInferences: number;
      avgResponseTime: number;
      errorRate: number;
      resourceUtilization: {
        cpu: number;
        memory: number;
        gpu: number;
      };
    };
    trainingMetrics: {
      lastRetraining: string;
      datasetSize: number;
      trainingTime: number;
      validationScore: number;
    };
  };
  insights: {
    keyInsights: Array<{
      category: string;
      insight: string;
      impact: string;
      confidence: number;
      affectedUsers: number;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      priority: string;
      estimatedImpact: string;
      implementationTime: string;
    }>;
    trendAnalysis: {
      userAdoption: {
        trend: string;
        rate: number;
        description: string;
      };
      modelAccuracy: {
        trend: string;
        rate: number;
        description: string;
      };
      systemLoad: {
        trend: string;
        rate: number;
        description: string;
      };
    };
  };
}

interface RealtimeAIData {
  activePredictions: number;
  adaptivePlansGenerated: number;
  injuryAlertsTriggered: number;
  modelAccuracy: number;
  predictionLatency: number;
  systemLoad: number;
}

interface AnalyticsOverview {
  totalUsers: number
  activeUsers: number
  totalWorkouts: number
  totalSubscriptions: number
  revenueThisMonth: number
  systemHealth: string
  trends: {
    users: number
    workouts: number
    revenue: number
  }
  monthlyStats: {
    newUsers: number
    completedWorkouts: number
    revenue: number
  }
}

interface UserAnalytics {
  registrationTrends: Array<{
    _id: { year: number; month: number }
    count: number
  }>
  activityDistribution: Array<{
    _id: string
    count: number
  }>
  geographicDistribution: Array<{
    _id: string
    count: number
  }>
}

interface WorkoutAnalytics {
  trends: Array<{
    _id: { year: number; month: number; day: number }
    count: number
    totalDistance: number
    totalDuration: number
  }>
  typeDistribution: Array<{
    _id: string
    count: number
    avgDistance: number
    avgDuration: number
  }>
  performanceMetrics: {
    avgDistance: number
    avgDuration: number
    totalWorkouts: number
    totalDistance: number
    totalDuration: number
  }
}

interface RecentActivity {
  activities: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    status: string
    details: any
  }>
  total: number
}

function AdminAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [workoutAnalytics, setWorkoutAnalytics] = useState<WorkoutAnalytics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null)
  const [aiIntelligenceData, setAiIntelligenceData] = useState<AIIntelligenceData | null>(null)
  const [realtimeAIData, setRealtimeAIData] = useState<RealtimeAIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workouts' | 'activity' | 'performance' | 'ai-intelligence'>('overview')
  const [timePeriod, setTimePeriod] = useState('6months')
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [selectedAITimeframe, setSelectedAITimeframe] = useState('30d')
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [isAIRealTimeConnected, setIsAIRealTimeConnected] = useState(false)
  const [exportFormat, setExportFormat] = useState('json')
  const [exportType, setExportType] = useState('overview')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadAnalyticsData()
  }, [timePeriod])

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformanceMetrics()
      const eventSource = setupRealTimeConnection()
      return () => {
        if (eventSource) {
          eventSource.close()
        }
      }
    } else if (activeTab === 'ai-intelligence') {
      fetchAIIntelligenceData()
      const aiEventSource = setupAIRealTimeConnection()
      return () => {
        if (aiEventSource) {
          aiEventSource.close()
        }
      }
    }
  }, [activeTab, selectedTimeframe, selectedAITimeframe])

  // Fetch performance metrics
  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      const data = await apiService.getPerformanceMetrics(selectedTimeframe);
      setPerformanceMetrics(data);
      setLastUpdate(new Date());
    } catch (error) {
      adminLogger.error('ANALYTICS', 'Failed to fetch performance metrics', error)
    }
  }, [selectedTimeframe])

  // Setup real-time connection
  const setupRealTimeConnection = useCallback(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
    const token = getAuthToken()
    
    if (!token) {
      adminLogger.warn('ANALYTICS', 'No auth token available for real-time connection')
      return null
    }
    
    const eventSource = new EventSource(`${API_BASE_URL}/api/admin/analytics/real-time?token=${encodeURIComponent(token)}`)
    
    eventSource.onopen = () => {
      adminLogger.info('ANALYTICS', 'Real-time analytics connected')
      setIsRealTimeConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'update' && data.metrics) {
          setRealtimeData(data.metrics)
          setLastUpdate(new Date())
        }
      } catch (error) {
        adminLogger.error('ANALYTICS', 'Error parsing real-time data', error)
      }
    }

    eventSource.onerror = () => {
      adminLogger.error('ANALYTICS', 'Real-time analytics connection error')
      setIsRealTimeConnected(false)
      eventSource.close()
    }

    return eventSource
  }, [])

  // Fetch AI Intelligence data
  const fetchAIIntelligenceData = useCallback(async () => {
    try {
      const data = await apiService.getAIIntelligence(selectedAITimeframe);
      setAiIntelligenceData(data);
      setLastUpdate(new Date());
    } catch (error) {
      adminLogger.error('ANALYTICS', 'Failed to fetch AI intelligence data', error)
    }
  }, [selectedAITimeframe])

  // Setup AI real-time connection
  const setupAIRealTimeConnection = useCallback(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
    const token = getAuthToken()
    
    if (!token) {
      adminLogger.warn('ANALYTICS', 'No auth token available for AI real-time connection')
      return null
    }
    
    const eventSource = new EventSource(`${API_BASE_URL}/api/admin/analytics/ai-real-time?token=${encodeURIComponent(token)}`)
    
    eventSource.onopen = () => {
      adminLogger.info('ANALYTICS', 'Real-time AI intelligence connected')
      setIsAIRealTimeConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'ai_update' && data.metrics) {
          setRealtimeAIData(data.metrics)
          setLastUpdate(new Date())
        }
      } catch (error) {
        adminLogger.error('ANALYTICS', 'Error parsing real-time AI data', error)
      }
    }

    eventSource.onerror = () => {
      adminLogger.error('ANALYTICS', 'Real-time AI intelligence connection error')
      setIsAIRealTimeConnected(false)
      eventSource.close()
    }

    return eventSource
  }, [])

  // Export analytics data
  const exportAnalytics = async () => {
    try {
      const blob = await apiService.exportAnalytics(exportFormat, exportType, '30d');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `runacademy-analytics-${exportType}-${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      adminLogger.error('ANALYTICS', 'Export failed', error)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Load all analytics data in parallel using apiService
      const [overview, userAnalyticsData, workoutAnalyticsData, recentActivityData] = await Promise.all([
        apiService.getAnalyticsOverview(),
        apiService.getUserAnalytics(timePeriod),
        apiService.getWorkoutAnalytics(timePeriod),
        apiService.getAdminRecentActivity(20)
      ]);

      setOverview(overview);
      setUserAnalytics(userAnalyticsData);
      setWorkoutAnalytics(workoutAnalyticsData);
      setRecentActivity(recentActivityData);

    } catch (error) {
      adminLogger.error('ANALYTICS', 'Error loading analytics data', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
    } else if (trend < 0) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
    }
    return <ArrowPathIcon className="w-4 h-4 text-gray-500" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-500'
    if (trend < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <UsersIcon className="w-5 h-5 text-blue-500" />
      case 'workout_completed':
        return <BoltIcon className="w-5 h-5 text-orange-500" />
      case 'subscription_created':
        return <CurrencyEuroIcon className="w-5 h-5 text-green-500" />
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const formatActivityTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `pirms ${diffMins} min`
    } else if (diffHours < 24) {
      return `pirms ${diffHours} h`
    } else {
      return `pirms ${diffDays} d`
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Analītika">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Ielādē analītiku...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Analītika">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Sistēmas Analītika
            </h1>
            <p className="text-gray-400">
              Detalizēta sistēmas veiktspējas un lietotāju aktivitāšu analīze
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
              <span>Pēdējais atjaunojums: {lastUpdate.toLocaleString()}</span>
              {activeTab === 'performance' && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isRealTimeConnected ? 'Tiešsaiste' : 'Atvienots'}</span>
                </div>
              )}
              {activeTab === 'ai-intelligence' && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isAIRealTimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>AI {isAIRealTimeConnected ? 'Tiešsaiste' : 'Atvienots'}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Performance timeframe selector */}
            {activeTab === 'performance' && (
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="1h">Pēdējā stunda</option>
                <option value="24h">Pēdējās 24h</option>
                <option value="7d">Pēdējās 7 dienas</option>
                <option value="30d">Pēdējās 30 dienas</option>
              </select>
            )}

            {/* AI Intelligence timeframe selector */}
            {activeTab === 'ai-intelligence' && (
              <select
                value={selectedAITimeframe}
                onChange={(e) => setSelectedAITimeframe(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="7d">Pēdējās 7 dienas</option>
                <option value="30d">Pēdējās 30 dienas</option>
                <option value="90d">Pēdējās 90 dienas</option>
              </select>
            )}
            
            {/* Regular timeframe selector */}
            {activeTab !== 'performance' && activeTab !== 'ai-intelligence' && (
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="1month">Pēdējais mēnesis</option>
                <option value="3months">Pēdējie 3 mēneši</option>
                <option value="6months">Pēdējie 6 mēneši</option>
                <option value="1year">Pēdējais gads</option>
              </select>
            )}

            {/* Export Controls */}
            <div className="flex items-center space-x-2">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="overview">Pārskats</option>
                <option value="users">Lietotāji</option>
                <option value="workouts">Treniņi</option>
                <option value="revenue">Ieņēmumi</option>
                <option value="performance">Veiktspēja</option>
              </select>
              
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              
              <button
                onClick={exportAnalytics}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Eksportēt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-gray-700 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Pārskats', icon: ChartBarIcon },
            { id: 'users', label: 'Lietotāji', icon: UsersIcon },
            { id: 'workouts', label: 'Treniņi', icon: BoltIcon },
            { id: 'activity', label: 'Aktivitāte', icon: ClockIcon },
            { id: 'performance', label: 'Veiktspēja', icon: CpuChipIcon },
            { id: 'ai-intelligence', label: 'AI Inteliģence', icon: BeakerIcon }
          ].map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <ResponsiveGrid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
              <ResponsiveCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Kopā lietotāju</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(overview.totalUsers)}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(overview.trends?.users || 0)}
                      <span className={`text-sm ml-1 ${getTrendColor(overview.trends?.users || 0)}`}>
                        {Math.abs(overview.trends?.users || 0)}%
                      </span>
                    </div>
                  </div>
                  <UsersIcon className="w-8 h-8 text-blue-500" />
                </div>
              </ResponsiveCard>

              <ResponsiveCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Aktīvi lietotāji</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(overview.activeUsers)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((overview.activeUsers / overview.totalUsers) * 100)}% no kopējā
                    </p>
                  </div>
                  <BoltIcon className="w-8 h-8 text-green-500" />
                </div>
              </ResponsiveCard>

              <ResponsiveCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Kopā treniņu</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(overview.totalWorkouts)}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(overview.trends?.workouts || 0)}
                      <span className={`text-sm ml-1 ${getTrendColor(overview.trends?.workouts || 0)}`}>
                        {Math.abs(overview.trends?.workouts || 0)}%
                      </span>
                    </div>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-orange-500" />
                </div>
              </ResponsiveCard>

              <ResponsiveCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Ieņēmumi šomēnes</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(overview.revenueThisMonth)}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(overview.trends?.revenue || 0)}
                      <span className={`text-sm ml-1 ${getTrendColor(overview.trends?.revenue || 0)}`}>
                        {Math.abs(overview.trends?.revenue || 0)}%
                      </span>
                    </div>
                  </div>
                  <CurrencyEuroIcon className="w-8 h-8 text-green-500" />
                </div>
              </ResponsiveCard>
            </ResponsiveGrid>

            {/* Monthly Stats */}
            <ResponsiveCard>
              <h3 className="text-lg font-semibold text-white mb-4">Šī mēneša statistika</h3>
              <ResponsiveGrid columns={{ sm: 1, md: 3 }} gap="md">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{overview.monthlyStats.newUsers}</p>
                  <p className="text-sm text-gray-400">Jauni lietotāji</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-400">{overview.monthlyStats.completedWorkouts}</p>
                  <p className="text-sm text-gray-400">Pabeigti treniņi</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(overview.monthlyStats.revenue)}</p>
                  <p className="text-sm text-gray-400">Ieņēmumi</p>
                </div>
              </ResponsiveGrid>
            </ResponsiveCard>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && userAnalytics && (
          <div className="space-y-6">
            <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
              <ResponsiveCard>
                <h3 className="text-lg font-semibold text-white mb-4">Aktivitātes līmenis</h3>
                <div className="space-y-3">
                  {userAnalytics.activityDistribution.map((item) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{item._id}</span>
                      <span className="text-white font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </ResponsiveCard>

              <ResponsiveCard>
                <h3 className="text-lg font-semibold text-white mb-4">Ģeogrāfiskais sadalījums</h3>
                <div className="space-y-3">
                  {userAnalytics.geographicDistribution.slice(0, 5).map((item) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-300">{item._id || 'Nav norādīts'}</span>
                      </div>
                      <span className="text-white font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </ResponsiveCard>
            </ResponsiveGrid>
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && workoutAnalytics && (
          <div className="space-y-6">
            <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
              <ResponsiveCard>
                <h3 className="text-lg font-semibold text-white mb-4">Treniņu veidi</h3>
                <div className="space-y-3">
                  {workoutAnalytics.typeDistribution.map((item) => (
                    <div key={item._id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 capitalize">{item._id || 'Nezināms'}</span>
                        <span className="text-white font-medium">{item.count}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Vidējā distance: {formatDistance(item.avgDistance || 0)} | 
                        Vidējais ilgums: {formatDuration(item.avgDuration || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </ResponsiveCard>

              <ResponsiveCard>
                <h3 className="text-lg font-semibold text-white mb-4">Veiktspējas metriki</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Kopējā distance</p>
                    <p className="text-xl font-bold text-white">{formatDistance(workoutAnalytics.performanceMetrics.totalDistance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Kopējais ilgums</p>
                    <p className="text-xl font-bold text-white">{formatDuration(workoutAnalytics.performanceMetrics.totalDuration || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Vidējā distance</p>
                    <p className="text-xl font-bold text-white">{formatDistance(workoutAnalytics.performanceMetrics.avgDistance || 0)}</p>
                  </div>
                </div>
              </ResponsiveCard>
            </ResponsiveGrid>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && recentActivity && (
          <ResponsiveCard>
            <h3 className="text-lg font-semibold text-white mb-4">Pēdējā aktivitāte</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.message}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-400">
                      <CalendarDaysIcon className="w-3 h-3 mr-1" />
                      {formatActivityTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivity.activities.length === 0 && (
                <p className="text-gray-400 text-center py-8">Nav pieejama pēdējā aktivitāte</p>
              )}
            </div>
          </ResponsiveCard>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Real-time Metrics */}
            {realtimeData && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Reālā laika metriki</h3>
                <ResponsiveGrid columns={{ sm: 2, md: 3, lg: 6 }} gap="sm">
                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <UsersIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className="text-xl font-bold text-white">{realtimeData.activeUsers}</div>
                    <div className="text-xs text-gray-400">Aktīvi lietotāji</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <SignalIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className="text-xl font-bold text-white">{realtimeData.currentRequests}</div>
                    <div className="text-xs text-gray-400">Pašreizējie pieprasījumi</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <ClockIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className={`text-xl font-bold ${getStatusColor(realtimeData.responseTime, { good: 200, warning: 500 })}`}>
                      {realtimeData.responseTime}ms
                    </div>
                    <div className="text-xs text-gray-400">Atbildes laiks</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className={`text-xl font-bold ${getStatusColor(realtimeData.errorRate, { good: 0.5, warning: 2 })}`}>
                      {realtimeData.errorRate}%
                    </div>
                    <div className="text-xs text-gray-400">Kļūdu līmenis</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <CpuChipIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className={`text-xl font-bold ${getStatusColor(realtimeData.systemLoad, { good: 50, warning: 75 })}`}>
                      {realtimeData.systemLoad}%
                    </div>
                    <div className="text-xs text-gray-400">Sistēmas slodze</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <CircleStackIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className={`text-xl font-bold ${getStatusColor(realtimeData.memoryUsage, { good: 70, warning: 85 })}`}>
                      {realtimeData.memoryUsage}%
                    </div>
                    <div className="text-xs text-gray-400">Atmiņas lietojums</div>
                  </ResponsiveCard>
                </ResponsiveGrid>
              </div>
            )}

            {/* Performance Overview */}
            {performanceMetrics && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Sistēmas veiktspējas pārskats</h3>
                  <ResponsiveGrid columns={{ sm: 1, lg: 2, xl: 4 }} gap="md">
                    {/* CPU Metrics */}
                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <CpuChipIcon className="w-6 h-6 text-blue-500" />
                          <h4 className="text-lg font-semibold text-white">CPU Veiktspēja</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Lietojums</span>
                          <span className={`font-medium ${getStatusColor(performanceMetrics.system.cpu.usage, { good: 50, warning: 75 })}`}>
                            {performanceMetrics.system.cpu.usage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              performanceMetrics.system.cpu.usage < 50 ? 'bg-green-500' :
                              performanceMetrics.system.cpu.usage < 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(performanceMetrics.system.cpu.usage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kodoli</span>
                          <span className="text-white">{performanceMetrics.system.cpu.cores}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Vidējā slodze</span>
                          <span className="text-white">{performanceMetrics.system.cpu.loadAverage[0]?.toFixed(2)}</span>
                        </div>
                      </div>
                    </ResponsiveCard>

                    {/* Memory Metrics */}
                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <CircleStackIcon className="w-6 h-6 text-blue-500" />
                          <h4 className="text-lg font-semibold text-white">Atmiņas lietojums</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Lietojums</span>
                          <span className={`font-medium ${getStatusColor(performanceMetrics.system.memory.usage, { good: 70, warning: 85 })}`}>
                            {performanceMetrics.system.memory.usage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              performanceMetrics.system.memory.usage < 70 ? 'bg-green-500' :
                              performanceMetrics.system.memory.usage < 85 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(performanceMetrics.system.memory.usage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Izmantots</span>
                          <span className="text-white">{performanceMetrics.system.memory.used} GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kopā</span>
                          <span className="text-white">{performanceMetrics.system.memory.total} GB</span>
                        </div>
                      </div>
                    </ResponsiveCard>

                    {/* API Performance */}
                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <SignalIcon className="w-6 h-6 text-blue-500" />
                          <h4 className="text-lg font-semibold text-white">API Veiktspēja</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Vid. atbilde</span>
                          <span className={`font-medium ${getStatusColor(performanceMetrics.api.summary.averageResponseTime, { good: 200, warning: 500 })}`}>
                            {performanceMetrics.api.summary.averageResponseTime}ms
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kopā pieprasījumi</span>
                          <span className="text-white">{performanceMetrics.api.summary.totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kļūdu līmenis</span>
                          <span className={`font-medium ${getStatusColor(performanceMetrics.api.summary.averageErrorRate, { good: 0.5, warning: 2 })}`}>
                            {performanceMetrics.api.summary.averageErrorRate}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Maksimālā caurlaidība</span>
                          <span className="text-white">{performanceMetrics.api.summary.peakThroughput} piep/min</span>
                        </div>
                      </div>
                    </ResponsiveCard>

                    {/* Database Performance */}
                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <CircleStackIcon className="w-6 h-6 text-blue-500" />
                          <h4 className="text-lg font-semibold text-white">Datubāze</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Savienojumi</span>
                          <span className="text-white">
                            {performanceMetrics.database.activeConnections}/{performanceMetrics.database.maxConnections}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Vaicājuma laiks</span>
                          <span className={`font-medium ${getStatusColor(performanceMetrics.database.averageQueryTime, { good: 20, warning: 50 })}`}>
                            {performanceMetrics.database.averageQueryTime}ms
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kešatmiņas līmenis</span>
                          <span className="text-green-400">{performanceMetrics.database.cacheHitRatio}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Lēni vaicājumi</span>
                          <span className={`${performanceMetrics.database.slowQueries > 5 ? 'text-red-400' : 'text-green-400'}`}>
                            {performanceMetrics.database.slowQueries}
                          </span>
                        </div>
                      </div>
                    </ResponsiveCard>
                  </ResponsiveGrid>
                </div>

                {/* Performance Trends */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Veiktspējas tendences</h3>
                  <ResponsiveGrid columns={{ sm: 1, lg: 3 }} gap="md">
                    {Object.entries(performanceMetrics.trends).map(([key, trend]) => (
                      <ResponsiveCard key={key}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white capitalize">
                            {key === 'responseTime' ? 'Atbildes laiks' : 
                             key === 'throughput' ? 'Caurlaidība' : 
                             key === 'errorRate' ? 'Kļūdu līmenis' : key}
                          </h4>
                          {trend.change > 0 ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                          ) : trend.change < 0 ? (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Statuss</span>
                            <span className={`capitalize ${
                              trend.current === 'improving' ? 'text-green-400' : 
                              trend.current === 'declining' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {trend.current === 'improving' ? 'uzlabojas' : 
                               trend.current === 'declining' ? 'pasliktinās' : 'stabils'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Izmaiņas</span>
                            <span className={`${trend.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trend.change > 0 ? '+' : ''}{trend.change}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{trend.comparison}</div>
                        </div>
                      </ResponsiveCard>
                    ))}
                  </ResponsiveGrid>
                </div>

                {/* Error Analytics */}
                <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                  {/* Error Overview */}
                  <ResponsiveCard>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                        <span>Kļūdu analīze</span>
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        performanceMetrics.errors.errorTrend < 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {performanceMetrics.errors.errorTrend > 0 ? '+' : ''}{performanceMetrics.errors.errorTrend}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{performanceMetrics.errors.totalErrors}</div>
                        <div className="text-xs text-gray-400">Kopā kļūdu</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{performanceMetrics.errors.criticalErrors}</div>
                        <div className="text-xs text-gray-400">Kritiskās</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{performanceMetrics.errors.warningErrors}</div>
                        <div className="text-xs text-gray-400">Brīdinājumi</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {performanceMetrics.errors.errorsByType.map((error, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-300">{error.type}</span>
                          <span className="text-white font-medium">{error.count}</span>
                        </div>
                      ))}
                    </div>
                  </ResponsiveCard>

                  {/* Network & Disk I/O */}
                  <ResponsiveCard>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <WifiIcon className="w-5 h-5 text-blue-500" />
                        <span>I/O Metriki</span>
                      </h4>
                    </div>

                    <div className="space-y-6">
                      {/* Network */}
                      <div>
                        <h5 className="text-lg font-medium text-white mb-3">Tīkls</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Saņemti baiti</span>
                            <span className="text-white">{formatBytes(performanceMetrics.system.network.bytesReceived)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Nosūtīti baiti</span>
                            <span className="text-white">{formatBytes(performanceMetrics.system.network.bytesSent)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Aktīvie savienojumi</span>
                            <span className="text-white">{performanceMetrics.system.network.connectionsActive}</span>
                          </div>
                        </div>
                      </div>

                      {/* Disk */}
                      <div>
                        <h5 className="text-lg font-medium text-white mb-3">Diska I/O</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Lietojums</span>
                            <span className={`font-medium ${getStatusColor(performanceMetrics.system.disk.usage, { good: 70, warning: 90 })}`}>
                              {performanceMetrics.system.disk.usage}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Lasīšanas operācijas</span>
                            <span className="text-white">{performanceMetrics.system.disk.readOperations.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Rakstīšanas operācijas</span>
                            <span className="text-white">{performanceMetrics.system.disk.writeOperations.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ResponsiveCard>
                </ResponsiveGrid>
              </>
            )}

            {!performanceMetrics && !loading && (
              <ResponsiveCard>
                <div className="text-center py-8">
                  <CpuChipIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Nav pieejami veiktspējas dati</p>
                  <button
                    onClick={fetchPerformanceMetrics}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Ielādēt datus
                  </button>
                </div>
              </ResponsiveCard>
            )}
          </div>
        )}

        {/* AI Intelligence Tab */}
        {activeTab === 'ai-intelligence' && (
          <div className="space-y-6">
            {/* Real-time AI Metrics */}
            {realtimeAIData && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Reālā laika AI metriki</h3>
                <ResponsiveGrid columns={{ sm: 2, md: 3, lg: 6 }} gap="sm">
                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <SparklesIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className="text-xl font-bold text-white">{realtimeAIData.activePredictions}</div>
                    <div className="text-xs text-gray-400">Aktīvās prognozes</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <CogIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className="text-xl font-bold text-white">{realtimeAIData.adaptivePlansGenerated}</div>
                    <div className="text-xs text-gray-400">Adaptīvie plāni</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <ShieldCheckIcon className="w-5 h-5 text-red-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className="text-xl font-bold text-white">{realtimeAIData.injuryAlertsTriggered}</div>
                    <div className="text-xs text-gray-400">Traumu brīdinājumi</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <ChartBarSquareIcon className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className={`text-xl font-bold ${getStatusColor(realtimeAIData.modelAccuracy, { good: 90, warning: 85 })}`}>
                      {realtimeAIData.modelAccuracy}%
                    </div>
                    <div className="text-xs text-gray-400">Modeļa precizitāte</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <ClockIcon className="w-5 h-5 text-yellow-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className={`text-xl font-bold ${getStatusColor(realtimeAIData.predictionLatency, { good: 100, warning: 200 })}`}>
                      {realtimeAIData.predictionLatency}ms
                    </div>
                    <div className="text-xs text-gray-400">Prognožu latence</div>
                  </ResponsiveCard>

                  <ResponsiveCard padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <CpuChipIcon className="w-5 h-5 text-orange-500" />
                      <span className="text-xs text-gray-400">LIVE</span>
                    </div>
                    <div className={`text-xl font-bold ${getStatusColor(realtimeAIData.systemLoad, { good: 30, warning: 50 })}`}>
                      {realtimeAIData.systemLoad}%
                    </div>
                    <div className="text-xs text-gray-400">AI sistēmas slodze</div>
                  </ResponsiveCard>
                </ResponsiveGrid>
              </div>
            )}

            {/* AI Intelligence Overview */}
            {aiIntelligenceData && (
              <>
                {/* Performance Predictions */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Veiktspējas prognozes</h3>
                  <ResponsiveGrid columns={{ sm: 1, lg: 2, xl: 4 }} gap="md">
                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <SparklesIcon className="w-6 h-6 text-purple-500" />
                          <h4 className="text-lg font-semibold text-white">Kopējās prognozes</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kopā prognožu</span>
                          <span className="text-white font-medium">{aiIntelligenceData.predictions.totalPredictions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Precizitāte</span>
                          <span className={`font-medium ${getStatusColor(aiIntelligenceData.predictions.accuracyRate, { good: 85, warning: 75 })}`}>
                            {aiIntelligenceData.predictions.accuracyRate}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Lietotāju apmierinātība</span>
                          <span className="text-green-400">{aiIntelligenceData.predictions.trends.userSatisfaction}%</span>
                        </div>
                      </div>
                    </ResponsiveCard>

                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <BeakerIcon className="w-6 h-6 text-blue-500" />
                          <h4 className="text-lg font-semibold text-white">Sacensību laiki</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kopā prognožu</span>
                          <span className="text-white">{aiIntelligenceData.predictions.raceTimePredictions.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Precīzas prognozes</span>
                          <span className="text-green-400">{aiIntelligenceData.predictions.raceTimePredictions.accurate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Vid. kļūda</span>
                          <span className="text-white">{aiIntelligenceData.predictions.raceTimePredictions.averageError}s</span>
                        </div>
                      </div>
                    </ResponsiveCard>

                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <ArrowTrendingUpIcon className="w-6 h-6 text-green-500" />
                          <h4 className="text-lg font-semibold text-white">Fitnesa progress</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kopā analīžu</span>
                          <span className="text-white">{aiIntelligenceData.predictions.fitnessProgressions.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Uzlabojumi</span>
                          <span className="text-green-400">{aiIntelligenceData.predictions.fitnessProgressions.improved}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Vid. uzlabojums</span>
                          <span className="text-green-400">+{aiIntelligenceData.predictions.fitnessProgressions.averageImprovement}%</span>
                        </div>
                      </div>
                    </ResponsiveCard>

                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <LightBulbIcon className="w-6 h-6 text-yellow-500" />
                          <h4 className="text-lg font-semibold text-white">Prognozu veidi</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {aiIntelligenceData.predictions.predictionsByType.slice(0, 3).map((type, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-400">{type.type}</span>
                            <span className="text-white">{type.accuracy}%</span>
                          </div>
                        ))}
                      </div>
                    </ResponsiveCard>
                  </ResponsiveGrid>
                </div>

                {/* Adaptive Training Plans */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Adaptīvie treniņu plāni</h3>
                  <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                          <CogIcon className="w-5 h-5 text-blue-500" />
                          <span>Adaptāciju statistika</span>
                        </h4>
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                          {aiIntelligenceData.adaptivePlans.successRate}% panākumi
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{aiIntelligenceData.adaptivePlans.totalAdaptations}</div>
                          <div className="text-xs text-gray-400">Kopā adaptāciju</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{aiIntelligenceData.adaptivePlans.userEngagement.planCompletionRate}%</div>
                          <div className="text-xs text-gray-400">Izpildes līmenis</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{aiIntelligenceData.adaptivePlans.userEngagement.planSatisfaction}%</div>
                          <div className="text-xs text-gray-400">Apmierinātība</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {aiIntelligenceData.adaptivePlans.adaptationTypes.map((type, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div>
                              <span className="text-gray-300 font-medium">{type.type}</span>
                              <div className="text-xs text-gray-400">{type.count} adaptācijas</div>
                            </div>
                            <span className="text-green-400 font-medium">{type.successRate}%</span>
                          </div>
                        ))}
                      </div>
                    </ResponsiveCard>

                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                          <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                          <span>Rezultātu ietekme</span>
                        </h4>
                      </div>

                      <div className="space-y-6">
                        {/* Performance Outcomes */}
                        <div>
                          <h5 className="text-lg font-medium text-white mb-3">Veiktspējas rezultāti</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Uzlabota veiktspēja</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${aiIntelligenceData.adaptivePlans.performanceOutcomes.improvedPerformance}%` }}
                                  />
                                </div>
                                <span className="text-green-400 font-medium text-sm">
                                  {aiIntelligenceData.adaptivePlans.performanceOutcomes.improvedPerformance}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Samazinātas traumas</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${aiIntelligenceData.adaptivePlans.performanceOutcomes.reducedInjuries}%` }}
                                  />
                                </div>
                                <span className="text-blue-400 font-medium text-sm">
                                  {aiIntelligenceData.adaptivePlans.performanceOutcomes.reducedInjuries}%
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Palielināta motivācija</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-purple-500 h-2 rounded-full"
                                    style={{ width: `${aiIntelligenceData.adaptivePlans.performanceOutcomes.increasedMotivation}%` }}
                                  />
                                </div>
                                <span className="text-purple-400 font-medium text-sm">
                                  {aiIntelligenceData.adaptivePlans.performanceOutcomes.increasedMotivation}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Algorithm Efficiency */}
                        <div>
                          <h5 className="text-lg font-medium text-white mb-3">Algoritma efektivitāte</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Vid. apstrādes laiks</span>
                              <span className="text-white">{aiIntelligenceData.adaptivePlans.algorithmEfficiency.avgProcessingTime}ms</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">CPU lietojums</span>
                              <span className={`${getStatusColor(aiIntelligenceData.adaptivePlans.algorithmEfficiency.cpuUsage, { good: 20, warning: 40 })}`}>
                                {aiIntelligenceData.adaptivePlans.algorithmEfficiency.cpuUsage}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Atmiņas lietojums</span>
                              <span className={`${getStatusColor(aiIntelligenceData.adaptivePlans.algorithmEfficiency.memoryUsage, { good: 40, warning: 60 })}`}>
                                {aiIntelligenceData.adaptivePlans.algorithmEfficiency.memoryUsage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ResponsiveCard>
                  </ResponsiveGrid>
                </div>

                {/* Injury Prevention Analytics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Traumu prevencijas analīze</h3>
                  <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                          <ShieldCheckIcon className="w-5 h-5 text-red-500" />
                          <span>Brīdinājumi un prevencija</span>
                        </h4>
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                          {aiIntelligenceData.injuryPrevention.preventedInjuries} novērstas
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{aiIntelligenceData.injuryPrevention.totalAlertsGenerated}</div>
                          <div className="text-xs text-gray-400">Kopā brīdinājumu</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{aiIntelligenceData.injuryPrevention.preventedInjuries}</div>
                          <div className="text-xs text-gray-400">Novērstas traumas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{aiIntelligenceData.injuryPrevention.alertAccuracy}%</div>
                          <div className="text-xs text-gray-400">Precizitāte</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-300 mb-2">Riska faktori</h5>
                        {aiIntelligenceData.injuryPrevention.riskFactors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                            <div>
                              <span className="text-gray-300 text-sm">{factor.factor}</span>
                              <div className="text-xs text-gray-500">{factor.alerts} brīdinājumi</div>
                            </div>
                            <span className="text-green-400 font-medium text-sm">{factor.prevented} novērstas</span>
                          </div>
                        ))}
                      </div>
                    </ResponsiveCard>

                    <ResponsiveCard>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                          <ChartBarSquareIcon className="w-5 h-5 text-green-500" />
                          <span>Ietekmes analīze</span>
                        </h4>
                      </div>

                      <div className="space-y-6">
                        {/* Cost Savings */}
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-green-400 font-medium">Izmaksu ietaupījums</h5>
                              <p className="text-green-300 text-sm">Novērsto traumu ekonomiskā vērtība</p>
                            </div>
                            <div className="text-2xl font-bold text-green-400">
                              €{aiIntelligenceData.injuryPrevention.injuryReduction.costSavings.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Intervention Success */}
                        <div>
                          <h5 className="text-lg font-medium text-white mb-3">Intervences efektivitāte</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Plānu modifikācijas</span>
                              <span className="text-green-400">{aiIntelligenceData.injuryPrevention.interventionSuccess.planModifications}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Atpūtas ieteikumi</span>
                              <span className="text-blue-400">{aiIntelligenceData.injuryPrevention.interventionSuccess.restRecommendations}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Vingrinājumu korekcijas</span>
                              <span className="text-purple-400">{aiIntelligenceData.injuryPrevention.interventionSuccess.exerciseCorrections}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Medicīniskas nosūtīšanas</span>
                              <span className="text-orange-400">{aiIntelligenceData.injuryPrevention.interventionSuccess.medicalReferrals}%</span>
                            </div>
                          </div>
                        </div>

                        {/* User Compliance */}
                        <div>
                          <h5 className="text-lg font-medium text-white mb-3">Lietotāju iesaistīšanās</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Sekoja ieteikumiem</span>
                              <span className="text-green-400">{aiIntelligenceData.injuryPrevention.userCompliance.followedRecommendations}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Sniedza atgriezenisko saiti</span>
                              <span className="text-blue-400">{aiIntelligenceData.injuryPrevention.userCompliance.providedFeedback}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Pabeidza novērtējumus</span>
                              <span className="text-purple-400">{aiIntelligenceData.injuryPrevention.userCompliance.completedAssessments}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ResponsiveCard>
                  </ResponsiveGrid>
                </div>

                {/* Model Performance */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">AI modeļu veiktspēja</h3>
                  <ResponsiveGrid columns={{ sm: 1, xl: 3 }} gap="md">
                    {aiIntelligenceData.modelPerformance.models.map((model, index) => (
                      <ResponsiveCard key={index}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-white">{model.name}</h4>
                            <p className="text-gray-400 text-sm">Versija {model.version}</p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            model.accuracy > 90 ? 'bg-green-500/20 text-green-400' :
                            model.accuracy > 80 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {model.accuracy}%
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Latence</span>
                            <span className={`${getStatusColor(model.latency, { good: 100, warning: 200 })}`}>
                              {model.latency}ms
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Caurlaidība</span>
                            <span className="text-white">{model.throughput}/min</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Atmiņa</span>
                            <span className="text-white">{model.memoryUsage}MB</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Pēdējā apmācība</span>
                            <span className="text-gray-300 text-xs">
                              {new Date(model.lastTrained).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </ResponsiveCard>
                    ))}
                  </ResponsiveGrid>
                </div>

                {/* Key Insights and Recommendations */}
                <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                  {/* Key Insights */}
                  <ResponsiveCard>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                        <span>Galvenie atklājumi</span>
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {aiIntelligenceData.insights.keyInsights.map((insight, index) => (
                        <div key={index} className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                              {insight.category}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                                {insight.impact === 'high' ? 'Augsts' : insight.impact === 'medium' ? 'Vidējs' : 'Zems'} ietekme
                              </span>
                              <span className="text-gray-400 text-xs">{Math.round(insight.confidence * 100)}%</span>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{insight.insight}</p>
                          <p className="text-gray-400 text-xs">Ietekmē {insight.affectedUsers} lietotājus</p>
                        </div>
                      ))}
                    </div>
                  </ResponsiveCard>

                  {/* Recommendations */}
                  <ResponsiveCard>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <SparklesIcon className="w-5 h-5 text-purple-500" />
                        <span>Ieteikumi</span>
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {aiIntelligenceData.insights.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="text-white font-medium">{recommendation.title}</h5>
                            <span className={`px-2 py-1 rounded text-xs ${
                              recommendation.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              recommendation.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {recommendation.priority === 'high' ? 'Augsta' : recommendation.priority === 'medium' ? 'Vidēja' : 'Zema'} prioritāte
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{recommendation.description}</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-400">{recommendation.estimatedImpact}</span>
                            <span className="text-gray-400">{recommendation.implementationTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ResponsiveCard>
                </ResponsiveGrid>
              </>
            )}

            {!aiIntelligenceData && !loading && (
              <ResponsiveCard>
                <div className="text-center py-8">
                  <BeakerIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Nav pieejami AI Intelligence dati</p>
                  <button
                    onClick={fetchAIIntelligenceData}
                    className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Ielādēt AI datus
                  </button>
                </div>
              </ResponsiveCard>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default withAdminAuth(AdminAnalytics)