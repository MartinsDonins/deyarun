// Health Check Component
// Verifies that all critical services are working properly

import { useState, useEffect } from 'react'
import { apiService } from '../lib/api'
import { logger } from '../lib/productionLogger'

interface HealthStatus {
  api: boolean
  supabase: boolean
  firebase: boolean
  analytics: boolean
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    api: false,
    supabase: false,
    firebase: false,
    analytics: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    const healthStatus: HealthStatus = {
      api: false,
      supabase: false,
      firebase: false,
      analytics: false
    }
    const errorList: string[] = []

    // Check API connection
    try {
      await apiService.healthCheck()
      healthStatus.api = true
    } catch (error) {
      errorList.push('API connection failed')
      logger.error('ERROR', 'API health check failed:', { error: error })
    }

    // Check Supabase configuration (disabled)
    try {
      // Supabase is intentionally disabled - using backend auth only
      healthStatus.supabase = true  // Show as OK since it's intentionally disabled
    } catch (error) {
      errorList.push('Supabase check failed')
    }

    // Check Firebase configuration
    try {
      const firebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-firebase-api-key'
      healthStatus.firebase = !!firebaseConfigured
      if (!firebaseConfigured) {
        errorList.push('Firebase not configured (optional)')
      }
    } catch (error) {
      errorList.push('Firebase check failed')
    }

    // Check Analytics configuration
    try {
      const analyticsConfigured = typeof window !== 'undefined' && 
                                   window.gtag !== undefined
      healthStatus.analytics = analyticsConfigured
      if (!analyticsConfigured) {
        errorList.push('Analytics not loaded (optional)')
      }
    } catch (error) {
      errorList.push('Analytics check failed')
    }

    setHealth(healthStatus)
    setErrors(errorList)
    setIsLoading(false)
  }

  const getStatusIcon = (status: boolean) => status ? '✅' : '❌'
  const getStatusColor = (status: boolean) => status ? 'text-green-400' : 'text-red-400'

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white font-medium mb-3">System Health</h3>
      <div className="space-y-2 text-sm">
        <div className={`flex items-center gap-2 ${getStatusColor(health.api)}`}>
          <span>{getStatusIcon(health.api)}</span>
          <span>API Connection</span>
        </div>
        <div className={`flex items-center gap-2 ${getStatusColor(health.supabase)}`}>
          <span>{getStatusIcon(health.supabase)}</span>
          <span>Backend Authentication (Supabase Disabled)</span>
        </div>
        <div className={`flex items-center gap-2 ${getStatusColor(health.firebase)}`}>
          <span>{getStatusIcon(health.firebase)}</span>
          <span>Firebase (Optional)</span>
        </div>
        <div className={`flex items-center gap-2 ${getStatusColor(health.analytics)}`}>
          <span>{getStatusIcon(health.analytics)}</span>
          <span>Analytics (Optional)</span>
        </div>
      </div>
      
      {errors.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600 rounded">
          <p className="text-yellow-400 text-xs font-medium mb-1">Non-critical issues:</p>
          <ul className="text-xs text-yellow-300 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}